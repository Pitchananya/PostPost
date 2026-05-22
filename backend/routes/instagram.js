import { Router } from 'express';
import { requireAuth } from './auth.js';
import { db } from '../db.js';

const router = Router();
router.use(requireAuth);

const FB_API = 'https://graph.facebook.com/v21.0';

async function getCreds(course = null) {
  const c = await db.fbCreds.get(course);
  return {
    igUserId: c.ig_business_id,
    pageToken: c.page_token,  // IG ใช้ FB Page Token ตัวเดียวกัน
  };
}

// GET /api/instagram/connection — ตรวจการเชื่อมต่อ
router.get('/connection', async (req, res) => {
  const course = req.query.course || null;
  const { igUserId, pageToken } = await getCreds(course);
  if (!igUserId || !pageToken) {
    return res.json({
      connected: false,
      reason: course ? `IG ยังไม่ตั้งค่าสำหรับ ${course}` : 'IG_BUSINESS_ID หรือ FB_PAGE_TOKEN ยังไม่ตั้งค่า',
      hint: '1) เชื่อม IG Business Account กับ FB Page  2) ใช้ /api/instagram/discover-id เพื่อหา IG_BUSINESS_ID',
    });
  }
  try {
    const r = await fetch(`${FB_API}/${igUserId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${pageToken}`);
    if (!r.ok) {
      const err = await r.text();
      return res.json({ connected: false, reason: `IG API ${r.status}: ${err.slice(0, 200)}` });
    }
    const data = await r.json();
    res.json({ connected: true, account: data });
  } catch (e) {
    res.json({ connected: false, reason: e.message });
  }
});

// GET /api/instagram/discover-id — หา IG_BUSINESS_ID จาก FB Page
// ?course=PFB|PHE|GURU — discover ของหลักสูตรนั้น ๆ
router.get('/discover-id', async (req, res) => {
  const course = req.query.course || null;
  const c = await db.fbCreds.get(course);
  const pageToken = c.page_token;
  const pageId = c.page_id;
  if (!pageToken || !pageId) return res.status(400).json({ error: course ? `FB Page ${course} ยังไม่ตั้งค่า` : 'FB_PAGE_ID + FB_PAGE_TOKEN required' });
  try {
    const r = await fetch(`${FB_API}/${pageId}?fields=instagram_business_account{id,username,name}&access_token=${pageToken}`);
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data });
    if (!data.instagram_business_account) {
      return res.json({
        ok: false,
        message: 'FB Page นี้ยังไม่ผูกกับ IG Business Account',
        instructions: '1) เปิด IG → Settings → Account → Switch to Professional → Business  2) เชื่อม IG กับ FB Page  3) ลอง endpoint นี้ใหม่',
      });
    }
    const igId = data.instagram_business_account.id;
    // 💾 auto-save ลง DB ทันที (ตาม course ที่ระบุ หรือ default)
    try { await db.fbCreds.save({ course, ig_business_id: igId }); }
    catch (e) { console.warn('[discover-id] save IG ID failed:', e.message); }

    res.json({
      ok: true,
      course: course || 'default',
      instagram_business_id: igId,
      username: data.instagram_business_account.username,
      saved: true,
      hint: course ? `บันทึก IG_BUSINESS_ID สำหรับ ${course} แล้ว — ใช้ได้ทันที` : `บันทึก IG_BUSINESS_ID (default) แล้ว — ใช้ได้ทันที`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/instagram/post — โพสต์ภาพ + caption
// IG ต้องการ image_url ที่ public (ไม่รับ base64 ตรงๆ) → 2-step process
router.post('/post', async (req, res) => {
  const { course } = req.body || {};
  const { igUserId, pageToken } = await getCreds(course);
  if (!igUserId || !pageToken) return res.status(400).json({ error: 'IG credentials missing' });

  const { hook = '', caption = '', image_url, hashtags = [] } = req.body || {};
  if (!image_url) {
    return res.status(400).json({
      error: 'IG ต้องการ image_url ที่ public — ไม่รับ base64',
      hint: 'อัพโหลดภาพไป Facebook ก่อน → ใช้ permalink_url เป็น image_url',
    });
  }
  const message = [hook, caption, hashtags.length ? '\n' + hashtags.join(' ') : ''].filter(Boolean).join('\n\n');

  try {
    // Step 1: สร้าง media container
    const containerForm = new URLSearchParams();
    containerForm.set('image_url', image_url);
    containerForm.set('caption', message);
    containerForm.set('access_token', pageToken);

    const r1 = await fetch(`${FB_API}/${igUserId}/media`, { method: 'POST', body: containerForm });
    const d1 = await r1.json();
    if (!r1.ok) return res.status(500).json({ error: d1?.error?.message || 'IG container error', detail: d1 });

    const containerId = d1.id;
    if (!containerId) return res.status(500).json({ error: 'no container_id returned', detail: d1 });

    // Step 1.5: รอ container พร้อม (status=FINISHED) สำหรับวิดีโอ — รูปภาพมักพร้อมทันที แต่เช็คเผื่อ
    let attempts = 0;
    while (attempts < 5) {
      const sr = await fetch(`${FB_API}/${containerId}?fields=status_code,status&access_token=${pageToken}`);
      const sd = await sr.json();
      if (sd.status_code === 'FINISHED' || !sd.status_code) break;
      if (sd.status_code === 'ERROR') return res.status(500).json({ error: 'container processing error', detail: sd });
      await new Promise(r => setTimeout(r, 1500));
      attempts++;
    }

    // Step 2: publish
    const publishForm = new URLSearchParams();
    publishForm.set('creation_id', containerId);
    publishForm.set('access_token', pageToken);

    const r2 = await fetch(`${FB_API}/${igUserId}/media_publish`, { method: 'POST', body: publishForm });
    const d2 = await r2.json();
    if (!r2.ok) return res.status(500).json({ error: d2?.error?.message || 'IG publish error', detail: d2 });

    res.json({
      ok: true,
      ig_media_id: d2.id,
      container_id: containerId,
      permalink: d2.id ? `https://www.instagram.com/p/${d2.id}` : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/instagram/post-carousel — โพสต์ Carousel หลายรูป (สูงสุด 10 รูป)
// body: { course, caption, content_ids: [id1, id2, ...] }
router.post('/post-carousel', async (req, res) => {
  const { course, caption = '', content_ids = [], hashtags = [] } = req.body || {};
  if (!Array.isArray(content_ids) || content_ids.length === 0) return res.status(400).json({ error: 'content_ids array required' });
  if (content_ids.length < 2) return res.status(400).json({ error: 'IG Carousel ต้องมีอย่างน้อย 2 รูป (1 รูป ใช้ /post)' });
  if (content_ids.length > 10) return res.status(400).json({ error: 'IG Carousel จำกัด 10 รูปต่อโพส' });

  const { igUserId, pageToken } = await getCreds(course);
  if (!igUserId || !pageToken) return res.status(400).json({ error: `IG credentials missing for ${course || 'default'}` });

  const publicBase = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (!publicBase) return res.status(500).json({ error: 'PUBLIC_URL env ยังไม่ตั้งค่า — IG ต้องดึงรูปจาก public URL' });

  try {
    // Verify content_ids (targeted query — กัน statement timeout)
    const rows = await db.contents.getByIds(content_ids);
    if (rows.length !== content_ids.length) return res.status(400).json({ error: 'บาง content_id ไม่พบ' });
    for (const c of rows) {
      if (!c.image_base64) return res.status(400).json({ error: `content_id ${c.id} ไม่มี image_base64` });
    }
    const validIds = rows.map(c => c.id);

    const message = [caption, hashtags.length ? '\n' + hashtags.join(' ') : ''].filter(Boolean).join('\n\n');

    // Helper: poll container status_code until FINISHED (or ERROR/timeout)
    // IG returns "Media ID is not available" when publish is called while any
    // child or the carousel itself is still IN_PROGRESS.
    const waitForContainer = async (containerId, label, maxSec) => {
      const t0 = Date.now();
      while ((Date.now() - t0) / 1000 < maxSec) {
        const sr = await fetch(`${FB_API}/${containerId}?fields=status_code,status&access_token=${pageToken}`);
        const sd = await sr.json();
        if (sd.status_code === 'FINISHED') return { ok: true };
        if (sd.status_code === 'ERROR' || sd.status_code === 'EXPIRED') {
          return { ok: false, error: `${label} ${sd.status_code}: ${sd.status || 'no detail'}`, detail: sd };
        }
        await new Promise(r => setTimeout(r, 2500));
      }
      return { ok: false, error: `${label} timeout after ${maxSec}s — IG ยังประมวลผลไม่เสร็จ (ลองโพสใหม่)` };
    };

    // Step 1a: สร้าง child container ทั้งหมดพร้อมกัน (parallel) — เร็วกว่า sequential
    const createChild = async (id) => {
      const imageUrl = `${publicBase}/api/public/content-image/${id}?platform=instagram`;
      const form = new URLSearchParams();
      form.set('image_url', imageUrl);
      form.set('is_carousel_item', 'true');
      form.set('access_token', pageToken);
      const r = await fetch(`${FB_API}/${igUserId}/media`, { method: 'POST', body: form });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(`child(${id}) create: ${d.error?.message || r.status}`);
      return { contentId: id, containerId: d.id };
    };

    let children;
    try {
      children = await Promise.all(validIds.map(createChild));
    } catch (e) {
      return res.status(500).json({ error: `IG child container error: ${e.message}` });
    }

    // Step 1b: รอ child ทั้งหมดให้ FINISHED พร้อมกัน
    // (Vercel 60s limit — 20s per child × parallel ≈ 20-25s worst case)
    const childWaits = await Promise.all(
      children.map(c => waitForContainer(c.containerId, `child #${c.contentId}`, 20))
    );
    const failed = childWaits.find(w => !w.ok);
    if (failed) return res.status(500).json({ error: failed.error, detail: failed.detail });

    const childContainers = children.map(c => c.containerId);

    // Step 2: สร้าง carousel container ที่รวม children
    const carouselForm = new URLSearchParams();
    carouselForm.set('media_type', 'CAROUSEL');
    carouselForm.set('children', childContainers.join(','));
    carouselForm.set('caption', message);
    carouselForm.set('access_token', pageToken);
    const r2 = await fetch(`${FB_API}/${igUserId}/media`, { method: 'POST', body: carouselForm });
    const d2 = await r2.json();
    if (!r2.ok || d2.error) return res.status(500).json({ error: `IG carousel container error: ${d2.error?.message || r2.status}`, detail: d2 });
    const carouselId = d2.id;

    // Step 2.5: รอ carousel container จน FINISHED (carousel ปกติเร็วกว่า child)
    const cw = await waitForContainer(carouselId, 'carousel', 15);
    if (!cw.ok) return res.status(500).json({ error: cw.error, detail: cw.detail });

    // Step 3: Publish
    const publishForm = new URLSearchParams();
    publishForm.set('creation_id', carouselId);
    publishForm.set('access_token', pageToken);
    const r3 = await fetch(`${FB_API}/${igUserId}/media_publish`, { method: 'POST', body: publishForm });
    const d3 = await r3.json();
    if (!r3.ok || d3.error) return res.status(500).json({ error: `IG carousel publish error: ${d3.error?.message || r3.status}`, detail: d3 });

    res.json({
      ok: true,
      ig_media_id: d3.id,
      carousel_id: carouselId,
      slides: validIds.length,
      permalink: d3.id ? `https://www.instagram.com/p/${d3.id}` : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 🎬 POST /api/instagram/post-carousel-urls — เหมือน /post-carousel แต่รับ image_urls array
//    ใช้ตอน cron post จาก row ที่มี series_images_b64 (1 row หลายรูป) — แต่ละ slide มี public URL
//    จาก /api/public/content-slide/<id>/<index>
router.post('/post-carousel-urls', async (req, res) => {
  const { course, caption = '', image_urls = [], hashtags = [] } = req.body || {};
  if (!Array.isArray(image_urls) || image_urls.length < 2) {
    return res.status(400).json({ error: 'image_urls array (2+) required' });
  }
  if (image_urls.length > 10) return res.status(400).json({ error: 'IG limit 10 images per carousel' });

  const { igUserId, pageToken } = await getCreds(course);
  if (!igUserId || !pageToken) return res.status(400).json({ error: `IG credentials missing for ${course || 'default'}` });

  try {
    const message = [caption, hashtags.length ? '\n' + hashtags.join(' ') : ''].filter(Boolean).join('\n\n');

    const waitForContainer = async (containerId, label, maxSec) => {
      const t0 = Date.now();
      while ((Date.now() - t0) / 1000 < maxSec) {
        const sr = await fetch(`${FB_API}/${containerId}?fields=status_code,status&access_token=${pageToken}`);
        const sd = await sr.json();
        if (sd.status_code === 'FINISHED') return { ok: true };
        if (sd.status_code === 'ERROR' || sd.status_code === 'EXPIRED') {
          return { ok: false, error: `${label} ${sd.status_code}: ${sd.status || 'no detail'}`, detail: sd };
        }
        await new Promise(r => setTimeout(r, 2500));
      }
      return { ok: false, error: `${label} timeout after ${maxSec}s` };
    };

    // Step 1: child container per URL (parallel)
    const createChild = async (url, i) => {
      const form = new URLSearchParams();
      form.set('image_url', url);
      form.set('is_carousel_item', 'true');
      form.set('access_token', pageToken);
      const r = await fetch(`${FB_API}/${igUserId}/media`, { method: 'POST', body: form });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(`child #${i+1} create: ${d.error?.message || r.status}`);
      return { index: i, containerId: d.id };
    };
    let children;
    try { children = await Promise.all(image_urls.map((u, i) => createChild(u, i))); }
    catch (e) { return res.status(500).json({ error: `IG child container error: ${e.message}` }); }

    // Step 2: wait all children FINISHED
    const waits = await Promise.all(children.map(c => waitForContainer(c.containerId, `child #${c.index+1}`, 20)));
    const failed = waits.find(w => !w.ok);
    if (failed) return res.status(500).json({ error: failed.error, detail: failed.detail });

    // Step 3: carousel container + publish
    const carouselForm = new URLSearchParams();
    carouselForm.set('media_type', 'CAROUSEL');
    carouselForm.set('children', children.map(c => c.containerId).join(','));
    carouselForm.set('caption', message);
    carouselForm.set('access_token', pageToken);
    const r2 = await fetch(`${FB_API}/${igUserId}/media`, { method: 'POST', body: carouselForm });
    const d2 = await r2.json();
    if (!r2.ok || d2.error) return res.status(500).json({ error: `IG carousel container error: ${d2.error?.message || r2.status}`, detail: d2 });
    const carouselId = d2.id;

    const cw = await waitForContainer(carouselId, 'carousel', 15);
    if (!cw.ok) return res.status(500).json({ error: cw.error, detail: cw.detail });

    const publishForm = new URLSearchParams();
    publishForm.set('creation_id', carouselId);
    publishForm.set('access_token', pageToken);
    const r3 = await fetch(`${FB_API}/${igUserId}/media_publish`, { method: 'POST', body: publishForm });
    const d3 = await r3.json();
    if (!r3.ok || d3.error) return res.status(500).json({ error: `IG carousel publish error: ${d3.error?.message || r3.status}`, detail: d3 });

    res.json({
      ok: true,
      ig_media_id: d3.id,
      carousel_id: carouselId,
      slides: image_urls.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
