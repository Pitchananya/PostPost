import { Router } from 'express';
import sharp from 'sharp';
import { db, supabase } from '../db.js';

const router = Router();

export const PLATFORM_RATIOS = {
  tiktok:    { w: 1080, h: 1920, format: 'jpeg' }, // 9:16 vertical (TikTok native) + JPG (TikTok ไม่รับ PNG บางกรณี)
  facebook:  { w: 1080, h: 1350, format: 'png' },  // 4:5 portrait — matches the in-app preview + FB feed best practice (was 1:1, which squished posts)
  instagram: { w: 1080, h: 1350, format: 'png' },  // 4:5 portrait (IG feed max portrait)
};

export async function resizeForPlatform(buffer, platform) {
  const t = PLATFORM_RATIOS[platform];
  if (!t) return buffer;
  let pipe = sharp(buffer).resize(t.w, t.h, { fit: 'cover', position: 'center' });
  if (t.format === 'jpeg') pipe = pipe.jpeg({ quality: 90, mozjpeg: true });
  else pipe = pipe.png({ compressionLevel: 9, quality: 92 });
  return pipe.toBuffer();
}

// อัตราส่วนที่ผู้ใช้เลือก save (manual download)
const RATIO_PRESETS = {
  '1x1':  { w: 1080, h: 1080, format: 'jpeg' },  // FB/IG
  '4x5':  { w: 1080, h: 1350, format: 'jpeg' },  // IG portrait
  '9x16': { w: 1080, h: 1920, format: 'jpeg' },  // TikTok / Reels / Stories
  '16x9': { w: 1920, h: 1080, format: 'jpeg' },  // landscape
  '3x4':  { w: 1080, h: 1440, format: 'jpeg' },  // 3:4 portrait
};

// GET /api/public/content-image/:id?platform=tiktok|facebook|instagram
//                                ?ratio=1x1|4x5|9x16|16x9|3x4
//                                ?format=png|jpeg (override)
//                                ?download=1 (force download instead of inline)
router.get('/content-image/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send('invalid id');
    const platform = String(req.query.platform || '').toLowerCase();
    const ratio = String(req.query.ratio || '').toLowerCase();
    const downloadParam = req.query.download === '1';

    const c = await db.contents.getById(id);
    if (!c) return res.status(404).send('not found');

    // 🔗 Fallback chain: image_base64 → image_jobs.image_base64 → media_url proxy
    //    IG carousel fetches นี้ → ถ้า return 404 HTML, IG reject "Only photo/video"
    //    เลย try ทุก source ก่อน fail
    let b64 = c.image_base64 || null;
    if (!b64 && c.image_job_id && supabase) {
      const { data: job } = await supabase
        .from('image_jobs')
        .select('image_base64, image_url')
        .eq('id', c.image_job_id)
        .maybeSingle();
      if (job?.image_base64) b64 = job.image_base64;
      else if (job?.image_url && /^https?:\/\//.test(job.image_url)) {
        return res.redirect(302, job.image_url);
      }
    }
    if (!b64 && c.media_url && /^https?:\/\//.test(c.media_url)) {
      return res.redirect(302, c.media_url);
    }
    if (!b64) {
      // ส่งรูป placeholder 1x1 ดำ แทน 404 HTML — IG จะไม่ reject media_type
      const transparent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      res.set('Content-Type', 'image/png');
      res.set('X-Image-Source', 'placeholder-1x1');
      return res.status(200).send(transparent);
    }

    let src;
    try {
      src = Buffer.from(b64, 'base64');
      if (src.length < 100) throw new Error('image too small (corrupt base64?)');
    } catch (e) {
      console.error(`[content-image] id=${id} base64 parse failed:`, e.message);
      // ส่ง placeholder แทน 500 HTML — IG จะ accept ไม่ reject media_type
      const transparent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      res.set('Content-Type', 'image/png');
      res.set('X-Image-Source', 'placeholder-corrupt-b64');
      return res.status(200).send(transparent);
    }

    // ratio override > platform — ratio ใช้สำหรับ manual save (ผู้ใช้เลือกได้)
    let target = null;
    if (ratio && RATIO_PRESETS[ratio]) target = RATIO_PRESETS[ratio];
    else if (platform && PLATFORM_RATIOS[platform]) target = PLATFORM_RATIOS[platform];

    // fit mode:
    //   cover   = crop edges to fill (default for platform posting)
    //   contain = preserve full image with bg padding (default for manual save with ?ratio=)
    //   fill    = stretch to fill (distorts aspect, but no crop + no padding)
    const fit = String(req.query.fit || (ratio ? 'fill' : 'cover')).toLowerCase();

    // bg color เมื่อ fit=contain: ?bg=black|white|blur — default = black
    const bgParam = String(req.query.bg || 'black').toLowerCase();

    let out, fmt;
    try {
    if (target) {
      if (fit === 'fill') {
        // stretch ให้เต็ม — distorts aspect แต่ไม่มี crop/padding
        let pipe = sharp(src).resize(target.w, target.h, { fit: 'fill' });
        if (target.format === 'jpeg') pipe = pipe.jpeg({ quality: 90, mozjpeg: true });
        else pipe = pipe.png({ compressionLevel: 9 });
        out = await pipe.toBuffer();
      } else if (fit === 'contain') {
        let pipe;
        if (bgParam === 'blur') {
          // blur bg
          const fg = await sharp(src).resize(target.w, target.h, { fit: 'inside', position: 'center' }).toBuffer();
          const bg = await sharp(src).resize(target.w, target.h, { fit: 'cover', position: 'center' }).blur(40).toBuffer();
          pipe = sharp(bg).composite([{ input: fg, gravity: 'center' }]);
        } else {
          // solid color (default black) — sharp's fit: contain + background
          const bgColor = bgParam === 'white'
            ? { r: 255, g: 255, b: 255, alpha: 1 }
            : { r: 0, g: 0, b: 0, alpha: 1 };
          pipe = sharp(src).resize(target.w, target.h, { fit: 'contain', position: 'center', background: bgColor });
          if (target.format !== 'jpeg') pipe = pipe.flatten({ background: bgColor });
        }
        if (target.format === 'jpeg') pipe = pipe.jpeg({ quality: 90, mozjpeg: true });
        else pipe = pipe.png({ compressionLevel: 9 });
        out = await pipe.toBuffer();
      } else {
        // cover — ตัดขอบเพื่อ fill (default สำหรับ platform posting)
        let pipe = sharp(src).resize(target.w, target.h, { fit: 'cover', position: 'center' });
        if (target.format === 'jpeg') pipe = pipe.jpeg({ quality: 90, mozjpeg: true });
        else pipe = pipe.png({ compressionLevel: 9, quality: 92 });
        out = await pipe.toBuffer();
      }
      fmt = target.format || 'png';
    } else {
      out = src;
      fmt = 'png';
    }
    } catch (sharpErr) {
      console.error(`[content-image] id=${id} sharp processing failed:`, sharpErr.message);
      // ส่ง source raw แทน — ดีกว่าทิ้ง 500 HTML ที่จะให้ IG reject
      out = src;
      fmt = 'png';
    }

    res.set('Content-Type', fmt === 'jpeg' ? 'image/jpeg' : 'image/png');
    res.set('Cache-Control', 'public, max-age=600');
    if (downloadParam) {
      const ext = fmt === 'jpeg' ? 'jpg' : 'png';
      const label = ratio || platform || 'original';
      res.set('Content-Disposition', `attachment; filename="oem-${id}-${label}.${ext}"`);
    }
    res.send(out);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// 🎬 GET /api/public/content-slide/:id/:index — เสิร์ฟรูปสไลด์ N จาก contents.series_images_b64
// ใช้กรณี cron post carousel จาก single-row save (มี series_images_b64 array แต่ไม่มี series_group_id)
// IG ต้องการ public URL ต่อ slide → endpoint นี้ extract slide ทีละรูปจาก JSONB array
router.get('/content-slide/:id/:index', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = Number(req.params.index);
    if (!id || isNaN(index) || index < 0) return res.status(400).send('invalid id/index');
    if (!supabase) return res.status(503).send('Supabase not configured');

    const { data, error } = await supabase
      .from('contents')
      .select('series_images_b64')
      .eq('id', id)
      .maybeSingle();
    if (error || !data?.series_images_b64) return res.status(404).send('not found or no series_images_b64');

    let arr;
    try {
      arr = typeof data.series_images_b64 === 'string'
        ? JSON.parse(data.series_images_b64)
        : data.series_images_b64;
    } catch { return res.status(500).send('parse error'); }
    if (!Array.isArray(arr) || index >= arr.length) return res.status(404).send('index out of range');

    const b64 = arr[index];
    if (!b64) return res.status(404).send('slide is empty');

    const platform = String(req.query.platform || '').toLowerCase();
    const src = Buffer.from(b64, 'base64');
    let out = src, fmt = 'png';
    if (platform && PLATFORM_RATIOS[platform]) {
      const t = PLATFORM_RATIOS[platform];
      out = await resizeForPlatform(src, platform);
      fmt = t.format;
    }
    res.set('Content-Type', fmt === 'jpeg' ? 'image/jpeg' : 'image/png');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(out);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// 👥 GET /api/public/image-job/:id — เสิร์ฟรูปจาก image_jobs.image_base64
// ใช้เป็น "public URL" ให้ shared workspace (Realtime payload <1MB ไม่ได้รวม base64)
// ทุก browser อ้างถึงรูปด้วย URL เดียวกัน → เห็นรูปเดียวกันทันทีโดยไม่ต้อง sync base64
router.get('/image-job/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send('invalid id');
    if (!supabase) return res.status(503).send('Supabase not configured');

    const { data, error } = await supabase
      .from('image_jobs')
      .select('image_base64, image_url, status')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return res.status(404).send('not found');

    // ถ้ามี external URL (เช่น OpenRouter return URL ตรง) → redirect
    if (data.image_url && /^https?:\/\//.test(data.image_url)) {
      return res.redirect(302, data.image_url);
    }
    if (!data.image_base64) return res.status(404).send('no image yet (status=' + data.status + ')');

    const buf = Buffer.from(data.image_base64, 'base64');
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(buf);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export default router;
