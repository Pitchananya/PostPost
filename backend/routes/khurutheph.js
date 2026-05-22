/**
 * 🔮 Khurutheph integration — โพสบทความจาก OEM Content Factory → เว็บคุรุเทพ
 * ───────────────────────────────────────
 * POST /api/khurutheph/post-article
 *   - รับ content (hook/caption/image) จากแอดมิน
 *   - upload รูป → Supabase Storage → public URL
 *   - forward ไป Khurutheph POST /api/articles ด้วย header X-API-Key
 *
 * ต้องตั้ง env:
 *   KHURUTHEPH_API_URL    เช่น https://khurutheph.com
 *   KHURUTHEPH_ARTICLES_KEY  = ARTICLES_API_KEY ที่ตั้งฝั่งคุรุเทพ
 */
import { Router } from 'express';
import { requireAuth } from './auth.js';
import { supabase } from '../db.js';

const router = Router();
router.use(requireAuth);

const ARTICLE_IMG_BUCKET = 'khuru-article-images';

// emoji default ตาม category (ใช้กับ cover_type=gradient)
const CAT_EMOJI = { money: '💰', love: '💕', work: '📈', tarot: '🃏', home: '🏠', week: '🔮' };
const VALID_CATS = new Set(['money', 'love', 'work', 'tarot', 'home', 'week']);

// 🤖 จัดหมวดอัตโนมัติจากเนื้อหา — keyword scoring (ฟรี ทันที)
const CAT_KEYWORDS = {
  money: ['เงิน', 'การเงิน', 'รวย', 'หนี้', 'ลงทุน', 'ทอง', 'โชคลาภ', 'รายได้', 'ออมเงิน', 'กระเป๋าตังค์', 'เลขเด็ด', 'หวย'],
  love: ['รัก', 'คู่', 'แฟน', 'โสด', 'เนื้อคู่', 'ความรัก', 'หัวใจ', 'คนรู้ใจ', 'แต่งงาน', 'อกหัก', 'จีบ'],
  work: ['งาน', 'อาชีพ', 'เลื่อนตำแหน่ง', 'ลาออก', 'เจ้านาย', 'ธุรกิจ', 'สมัครงาน', 'หน้าที่การงาน', 'เพื่อนร่วมงาน'],
  tarot: ['ไพ่', 'ทาโรต์', 'tarot', 'ยิปซี', 'สำรับ', 'เปิดไพ่'],
  home: ['ฮวงจุ้ย', 'บ้าน', 'ห้อง', 'ทิศ', 'จัดบ้าน', 'โต๊ะ', 'เตียง', 'ประตู', 'มุมบ้าน'],
  week: ['สัปดาห์', 'รายวัน', '7 วัน', 'เจ็ดวัน', 'วันเกิด', 'ราศี', 'ดวงประจำ'],
};
function classifyCategory(text) {
  const t = String(text || '').toLowerCase();
  let best = 'week', bestScore = 0;
  for (const [cat, words] of Object.entries(CAT_KEYWORDS)) {
    let score = 0;
    for (const w of words) {
      const idx = t.indexOf(w.toLowerCase());
      if (idx >= 0) score += (idx < 60 ? 2 : 1);  // คำใน hook (60 ตัวแรก) นับ 2 เท่า
    }
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;  // ไม่เจอ keyword เด่น → 'week' (ทั่วไป)
}

function escHtml(s) {
  return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// 🧹 caption → plain text สะอาด (ตัด markdown / emoji ตัวเลข / hashtag) — สำหรับ excerpt
function toPlainText(s) {
  return String(s || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')          // **bold** → bold
    .replace(/[*_`>#~]/g, '')                  // markdown chars
    .replace(/[0-9]️?⃣/g, '')         // number emoji 1️⃣ 2️⃣
    .replace(/#[^\s#]+/g, '')                   // hashtag
    .replace(/\s+/g, ' ')
    .trim();
}

// 🧹 caption → HTML body จัดระเบียบ — รองรับ **bold**, bullet, ย่อหน้า
function captionToHtml(caption) {
  const lines = String(caption || '').split(/\r?\n/);
  let html = '', inList = false;
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    // bullet: -, •, ●, ✅, ✔️, *, หรือ "1." / "2)"
    const m = line.match(/^(?:[-•●▪️✅✔️*]|[0-9]+[.)])\s*(.+)/);
    let content = escHtml(m ? m[1] : line)
      .replace(/[0-9]️?⃣/g, '')        // ตัด number emoji
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');  // bold
    if (m) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${content}</li>`;
    } else {
      closeList();
      html += `<p>${content}</p>`;
    }
  }
  closeList();
  return html;
}

// POST /api/khurutheph/post-article
router.post('/post-article', async (req, res) => {
  const apiUrl = (process.env.KHURUTHEPH_API_URL || '').replace(/\/$/, '');
  const apiKey = process.env.KHURUTHEPH_ARTICLES_KEY;
  if (!apiUrl) return res.status(400).json({ error: 'KHURUTHEPH_API_URL ยังไม่ตั้งค่าใน env' });
  if (!apiKey) return res.status(400).json({ error: 'KHURUTHEPH_ARTICLES_KEY ยังไม่ตั้งค่าใน env' });

  const { hook = '', caption = '', image_base64, image_url, category = 'auto', status = 'published' } = req.body || {};
  if (!hook && !caption) return res.status(400).json({ error: 'ต้องมี hook หรือ caption' });
  // category='auto' → จัดหมวดอัตโนมัติจาก hook+caption
  const cat = (category === 'auto' || !VALID_CATS.has(category))
    ? classifyCategory(hook + ' ' + caption)
    : category;

  try {
    // 1) รูปปก — ถ้ามี image_url อยู่แล้วใช้ตรงๆ · ถ้าเป็น base64 → upload Storage
    let coverUrl = null, coverType = 'gradient';
    if (image_url && /^https?:\/\//.test(image_url)) {
      coverUrl = image_url; coverType = 'image';
    } else if (image_base64 && supabase) {
      const b64 = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64;
      const buf = Buffer.from(b64, 'base64');
      if (buf.length > 0 && buf.length < 10 * 1024 * 1024) {
        try {
          await supabase.storage.createBucket(ARTICLE_IMG_BUCKET, { public: true, fileSizeLimit: 10485760 });
        } catch {}
        const fname = `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        const { error: upErr } = await supabase.storage
          .from(ARTICLE_IMG_BUCKET)
          .upload(fname, buf, { contentType: 'image/png', upsert: false });
        if (!upErr) {
          const { data: pub } = supabase.storage.from(ARTICLE_IMG_BUCKET).getPublicUrl(fname);
          if (pub?.publicUrl) { coverUrl = pub.publicUrl; coverType = 'image'; }
        } else {
          console.warn('[khurutheph] image upload failed:', upErr.message);
        }
      }
    }

    // 2) ประกอบ payload บทความ — ทำความสะอาดข้อความ
    const title = toPlainText(hook || caption).slice(0, 200);
    const excerpt = toPlainText(caption).slice(0, 180);
    const payload = {
      title,
      category: cat,
      excerpt,
      body: captionToHtml(caption),
      emoji: CAT_EMOJI[cat] || '🔮',
      thumb_title: title.slice(0, 60),
      cover_type: coverType,
      cover_url: coverUrl,
      read_minutes: Math.max(2, Math.ceil((caption || '').length / 400)),
      status: status === 'draft' ? 'draft' : 'published',
    };

    // 3) forward ไป Khurutheph
    const r = await fetch(`${apiUrl}/api/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(502).json({ error: `Khurutheph ${r.status}: ${data.error || 'post failed'}`, detail: data });
    }

    const slug = data.article?.slug;
    res.json({
      ok: true,
      article: data.article,
      url: slug ? `${apiUrl}/article.html?slug=${encodeURIComponent(slug)}` : null,
      note: 'โพสขึ้นเว็บคุรุเทพแล้ว — ดูที่หน้าบทความ',
    });
  } catch (e) {
    console.error('[khurutheph/post-article]', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
