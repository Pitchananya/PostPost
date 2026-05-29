import { Router } from 'express';
import { db, supabase, currentTenantId } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try { res.json({ contents: await db.contents.list() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/content/:id — รายละเอียดเต็ม รวม image_base64 (list endpoint exclude เพื่อ performance)
router.get('/:id', async (req, res) => {
  try {
    const c = await db.contents.getById(Number(req.params.id));
    if (!c) return res.status(404).json({ error: 'not found' });
    res.json({ content: c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { course, topic, framework, hook, caption, media_url, image_base64, series_images_b64, series_group_id, platforms, scheduled_at, status, image_prompt, image_job_id, published_at, post_results } = req.body || {};
  if (!course || !hook) return res.status(400).json({ error: 'course, hook required' });

  const { series_meta } = req.body || {};
  const finalStatus = ['draft', 'scheduled', 'processing', 'published', 'failed'].includes(status) ? status : 'draft';
  const row = {
    // course = legacy course key (PFB/PHE/GURU) OR a brand id. fbCreds.get()
    // resolves per-key creds (fb_page_token_<course>) and falls back to the
    // default page — so the cron can post per-brand. Don't force PFB here or
    // brand-scoped scheduled posts would route to the wrong Page.
    course: course ? String(course).slice(0, 60) : 'PFB',
    topic: topic || null,
    framework: framework || 'F1',
    hook: String(hook).slice(0, 500),
    caption: caption ? String(caption).slice(0, 5000) : null,
    media_url: media_url ? String(media_url).slice(0, 1000) : null,
    image_base64: image_base64 || null,
    platforms: Array.isArray(platforms) ? platforms : ['facebook'],
    scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : new Date().toISOString(),
    status: finalStatus,
    published_at: published_at ? new Date(published_at).toISOString() : (finalStatus === 'published' ? new Date().toISOString() : null),
    series_group_id: series_group_id || null,
    image_prompt: image_prompt ? String(image_prompt).slice(0, 10000) : null,
    image_job_id: image_job_id ? Number(image_job_id) : null,
    series_meta: series_meta && typeof series_meta === 'object' ? series_meta : null,
  };
  // post_results = per-platform outcome blob (set by cron; also recorded by the
  // app when it posts "now" directly, so the Log shows a green success badge).
  if (post_results && typeof post_results === 'object') row.post_results = post_results;
  // series_images_b64 = JSON array string (กรณี Series carousel — เก็บทุกรูปใน row เดียว)
  if (series_images_b64) {
    if (Array.isArray(series_images_b64)) row.series_images_b64 = JSON.stringify(series_images_b64);
    else if (typeof series_images_b64 === 'string') row.series_images_b64 = series_images_b64;
  }

  try { res.json({ content: await db.contents.insert(row) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/content/bulk?status=draft&course=GURU — ลบหลาย row ตาม filter
router.delete('/bulk', async (req, res) => {
  if (!supabase) return res.status(400).json({ error: 'Supabase required' });
  const { status, course } = req.query;
  if (!status && !course) return res.status(400).json({ error: 'ต้องระบุ ?status=... หรือ ?course=... อย่างน้อย 1 ตัว' });
  try {
    let q = supabase.from('contents').delete({ count: 'exact' }).eq('tenant_id', currentTenantId());
    if (status) {
      const list = String(status).split(',').filter(s => ['draft','scheduled','processing','published','failed'].includes(s));
      if (list.length === 0) return res.status(400).json({ error: 'status ไม่ถูกต้อง' });
      q = q.in('status', list);
    }
    if (course) q = q.eq('course', course);
    const { error, count } = await q;
    if (error) throw new Error(error.message);
    res.json({ ok: true, deleted: count || 0, filter: { status, course } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE scheduled post (ยกเลิก)
router.delete('/:id', async (req, res) => {
  if (!supabase) return res.status(400).json({ error: 'Supabase required for delete' });
  try {
    const { error } = await supabase.from('contents').delete().eq('id', Number(req.params.id)).eq('tenant_id', currentTenantId());
    if (error) throw new Error(error.message);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 🔁 Retry failed post — reset status back to scheduled + clear error
router.post('/:id/retry', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const list = await db.contents.list();
    const c = list.find(x => x.id === id);
    if (!c) return res.status(404).json({ error: 'not found' });
    if (c.status !== 'failed') return res.status(400).json({ error: 'only failed posts can retry' });

    // ตั้งเวลาใหม่ — 1 นาทีจากตอนนี้ (cron จะ pick ทันที)
    const newScheduledAt = new Date(Date.now() + 60_000).toISOString();
    const updated = await db.contents.update(id, {
      status: 'scheduled',
      scheduled_at: newScheduledAt,
      last_error: null,
    });
    res.json({ ok: true, content: updated, hint: 'cron จะรันใน 1 นาที — หรือกด "⚡ Run Scheduled ตอนนี้"' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 🔁 Retry ALL failed posts
router.post('/retry-all-failed', async (req, res) => {
  try {
    const list = await db.contents.list();
    const failed = list.filter(c => c.status === 'failed');
    let updated = 0;
    for (const c of failed) {
      const newAt = new Date(Date.now() + (updated * 30 + 60) * 1000).toISOString(); // ห่างกัน 30 วิ
      await db.contents.update(c.id, { status: 'scheduled', scheduled_at: newAt, last_error: null });
      updated++;
    }
    res.json({ ok: true, retried: updated, hint: 'ตั้งเวลาห่างกัน 30 วิ — cron จะ pick ทุกอันใน ~10 นาที' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const updated = await db.contents.update(Number(req.params.id), req.body || {});
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json({ content: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
