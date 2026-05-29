import { Router } from 'express';
import { db, supabase, currentTenantId, runWithTenant } from '../db.js';
import { requireAuth } from './auth.js';
import { resizeForPlatform, PLATFORM_RATIOS } from './public.js';

const router = Router();
router.use(requireAuth);

// สร้าง public URL ให้ TikTok ดึงรูป 4:5 (PULL_FROM_URL ต้อง verify domain ใน TikTok Dev Portal)
function buildPublicImageUrl(contentId, platform) {
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (!base || !contentId) return null;
  return `${base}/api/public/content-image/${contentId}?platform=${platform}`;
}

// Multi-platform dispatcher — รับ content + รายการ platforms → call แต่ละ platform pa
const PLATFORM_HANDLERS = {
  facebook: postToFacebook,
  instagram: postToInstagram,
  tiktok: postToTiktok,
};

router.post('/post-multi', async (req, res) => {
  const { content_id, platforms = ['facebook'], image_base64 } = req.body || {};
  if (!content_id) return res.status(400).json({ error: 'content_id required' });

  const content = await db.contents.getById(Number(content_id));
  if (!content) return res.status(404).json({ error: 'content not found' });

  // ถ้า client ส่ง image_base64 มา (composed image) → แนบเข้า content เพื่อ post handler ใช้
  // และเซฟลง DB ด้วย เพื่อให้ public endpoint (TikTok 4:5) ดึงรูปได้
  if (image_base64) {
    content.image_base64 = image_base64;
    try { await db.contents.update(content.id, { image_base64 }); }
    catch (e) { console.warn('[post-multi] save image_base64 to DB failed:', e.message); }
  }

  const results = {};
  let fbImageUrl = null;
  for (const p of platforms) {
    const handler = PLATFORM_HANDLERS[p];
    if (!handler) { results[p] = { ok: false, error: `unsupported platform: ${p}` }; continue; }
    try {
      // IG (1:1) + TikTok (4:5) ต้องการ public URL — ใช้ public endpoint ของเรา (resize per-platform)
      // fallback: ถ้าไม่มี image_base64 ใน DB → ใช้ FB image URL (หลัง FB โพสเสร็จ)
      const ctx = { ...content };
      if (p === 'instagram') {
        if (ctx.image_base64) {
          const igUrl = buildPublicImageUrl(ctx.id, 'instagram');
          if (igUrl) ctx.media_url = igUrl;
        }
        if (!ctx.media_url && fbImageUrl) ctx.media_url = fbImageUrl;
      } else if (p === 'tiktok') {
        if (ctx.image_base64) {
          const ttUrl = buildPublicImageUrl(ctx.id, 'tiktok');
          if (ttUrl) ctx.media_url = ttUrl;
        }
        if (!ctx.media_url && fbImageUrl) ctx.media_url = fbImageUrl;
      }
      const r = await handler(ctx);
      results[p] = r;
      if (p === 'facebook' && r.ok && r.image_url) fbImageUrl = r.image_url;
      await logAttempt(content.id, p, r);
    } catch (e) {
      results[p] = { ok: false, error: e.message };
      await logAttempt(content.id, p, { ok: false, error: e.message });
    }
  }
  res.json({ content_id, results });
});

async function logAttempt(contentId, platform, result) {
  if (!supabase) return;
  try {
    await supabase.from('automation_logs').insert({
      content_id: contentId,
      tenant_id: currentTenantId(),
      platform,
      success: !!result.ok,
      message: result.ok ? (result.id || result.publish_id || 'posted') : (result.error || 'failed'),
      payload: result,
    });
  } catch (e) { console.error('[automation_logs]', e.message); }
}

const FB_API = 'https://graph.facebook.com/v21.0';

async function postToFacebook(content) {
  // route ตาม course (PFB/PHE/GURU มีคนละ Page) — fallback ไป default ถ้าไม่เคยตั้งค่า per-course
  const c = await db.fbCreds.get(content.course);
  const pageId = c.page_id;
  const pageToken = c.page_token;
  if (!pageId || !pageToken) return { ok: false, error: `FB credentials missing for course ${content.course || 'default'} — ตั้งค่าใน Connect tab` };

  const message = [content.hook, content.caption].filter(Boolean).join('\n\n');
  const isScheduled = content.scheduled_at && new Date(content.scheduled_at) > new Date();
  const scheduleTs = isScheduled ? Math.floor(new Date(content.scheduled_at).getTime() / 1000) : null;

  // Path 1: base64 image → multipart /photos endpoint
  if (content.image_base64) {
    const rawBuf = Buffer.from(content.image_base64, 'base64');
    // 🖼️ Resize → 1:1 (1080×1080) สำหรับ Facebook
    const buf = await resizeForPlatform(rawBuf, 'facebook').catch(() => rawBuf);
    const form = new FormData();
    form.append('source', new Blob([buf], { type: 'image/png' }), 'image.png');
    form.append('caption', message);
    form.append('access_token', pageToken);
    if (isScheduled) {
      form.append('published', 'false');
      form.append('scheduled_publish_time', String(scheduleTs));
    }
    const r = await fetch(`${FB_API}/${pageId}/photos`, { method: 'POST', body: form });
    const data = await r.json();
    if (!r.ok) return { ok: false, error: data?.error?.message || 'FB photo error', detail: data };
    // หลัง upload — ดึง permalink + image_url ของ photo
    let permalink = null, image_url = null;
    if (data.id) {
      try {
        const r2 = await fetch(`${FB_API}/${data.id}?fields=permalink_url,images&access_token=${pageToken}`);
        const d2 = await r2.json();
        permalink = d2.permalink_url;
        image_url = d2?.images?.[0]?.source;
      } catch {}
    }
    return { ok: true, id: data.post_id || data.id, permalink, image_url };
  }

  // Path 2: image URL or text-only
  const params = new URLSearchParams();
  params.set('access_token', pageToken);

  let endpoint;
  if (content.media_url) {
    endpoint = `${FB_API}/${pageId}/photos`;
    params.set('url', content.media_url);
    params.set('caption', message);
  } else {
    endpoint = `${FB_API}/${pageId}/feed`;
    params.set('message', message);
  }
  if (isScheduled) {
    params.set('published', 'false');
    params.set('scheduled_publish_time', String(scheduleTs));
  }
  const r = await fetch(endpoint, { method: 'POST', body: params });
  const data = await r.json();
  if (!r.ok) return { ok: false, error: data?.error?.message || 'FB error', detail: data };
  let permalink = null, image_url = null;
  if (data.id && content.media_url) {
    try {
      const r2 = await fetch(`${FB_API}/${data.id}?fields=permalink_url,images&access_token=${pageToken}`);
      const d2 = await r2.json();
      permalink = d2.permalink_url;
      image_url = d2?.images?.[0]?.source;
    } catch {}
  }
  return { ok: true, id: data.id || data.post_id, permalink: permalink || data.permalink_url, image_url };
}

async function postToInstagram(content) {
  const c = await db.fbCreds.get(content.course);
  const igUserId = c.ig_business_id;
  const pageToken = c.page_token;
  if (!igUserId || !pageToken) return { ok: false, error: 'IG_BUSINESS_ID/FB_PAGE_TOKEN missing' };
  if (!content.media_url) return { ok: false, error: 'IG ต้องการ media_url ที่ public' };

  const message = [content.hook, content.caption].filter(Boolean).join('\n\n');

  // Step 1: container
  const f1 = new URLSearchParams();
  f1.set('image_url', content.media_url);
  f1.set('caption', message);
  f1.set('access_token', pageToken);
  const r1 = await fetch(`${FB_API}/${igUserId}/media`, { method: 'POST', body: f1 });
  const d1 = await r1.json();
  if (!r1.ok) return { ok: false, error: d1?.error?.message || 'IG container error', detail: d1 };

  // Step 1.5: รอ container FINISHED ก่อน publish — ไม่งั้นได้ "Media ID is not available"
  // IG ต้องการเวลา ~3-15 วิ ดึงรูปจาก image_url + transcode
  const containerId = d1.id;
  const tStart = Date.now();
  const maxSec = 25;
  while ((Date.now() - tStart) / 1000 < maxSec) {
    const sr = await fetch(`${FB_API}/${containerId}?fields=status_code,status&access_token=${pageToken}`);
    const sd = await sr.json().catch(() => ({}));
    if (sd.status_code === 'FINISHED') break;
    if (sd.status_code === 'ERROR' || sd.status_code === 'EXPIRED') {
      return { ok: false, error: `IG container ${sd.status_code}: ${sd.status || 'no detail'}`, detail: sd };
    }
    await new Promise(r => setTimeout(r, 2500));
  }

  // Step 2: publish
  const f2 = new URLSearchParams();
  f2.set('creation_id', containerId);
  f2.set('access_token', pageToken);
  const r2 = await fetch(`${FB_API}/${igUserId}/media_publish`, { method: 'POST', body: f2 });
  const d2 = await r2.json();
  if (!r2.ok) return { ok: false, error: d2?.error?.message || 'IG publish error', detail: d2 };
  return { ok: true, id: d2.id };
}

async function postToTiktok(content) {
  // ใช้ token จาก DB (per-course) + auto-refresh ถ้าใกล้หมดอายุ
  const { getValidTtAccessToken } = await import('./tiktok.js');
  const accessToken = await getValidTtAccessToken(content.course);
  if (!accessToken) return { ok: false, error: `TikTok ไม่ได้ OAuth สำหรับ ${content.course || 'default'} — ทำใน Connect tab` };
  if (!content.media_url) return { ok: false, error: 'TT photo mode ต้องการ media_url' };

  const title = [content.hook, content.caption].filter(Boolean).join('\n\n').slice(0, 2200);

  // mode: MEDIA_UPLOAD = draft (ต้องการแค่ video.upload scope) — DIRECT_POST = auto-post (ต้อง video.publish)
  const mode = (process.env.TIKTOK_POST_MODE || 'MEDIA_UPLOAD').toUpperCase();
  const isDirect = mode === 'DIRECT_POST';

  // ใช้ content/init endpoint สำหรับทั้ง 2 mode — TikTok docs บอกว่าใช้ได้ทั้งคู่
  const endpoint = 'https://open.tiktokapis.com/v2/post/publish/content/init/';

  // privacy_level: unaudited app → ใช้ได้แค่ SELF_ONLY; Production review แล้วใช้ PUBLIC_TO_EVERYONE
  const privacy = (process.env.TIKTOK_PRIVACY || 'SELF_ONLY').toUpperCase();

  const body = isDirect
    ? {
        post_info: {
          title,
          description: (content.caption || '').slice(0, 4000),
          privacy_level: privacy,
          disable_comment: false,
          auto_add_music: true,
        },
        source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: [content.media_url] },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      }
    : {
        // MEDIA_UPLOAD — ต้องมี post_info.title + privacy_level (TikTok validate ทั้งคู่)
        post_info: {
          title: title.slice(0, 90) || '(draft)',
          privacy_level: privacy,
        },
        source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: [content.media_url] },
        post_mode: 'MEDIA_UPLOAD',
        media_type: 'PHOTO',
      };

  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  // TikTok success = HTTP 200 + error.code === 'ok'. ทุก case อื่น (รวม 200 ที่มี error.code อื่น) = fail
  if (!r.ok || (data?.error?.code && data.error.code !== 'ok')) {
    const msg = data?.error?.message || `TT ${r.status}`;
    const code = data?.error?.code || r.status;
    console.error('[tt] post error:', JSON.stringify({ code, msg, detail: data, mode, photo_url: content.media_url }));
    return { ok: false, error: `${msg} (code: ${code})`, detail: data, mode };
  }
  return {
    ok: true,
    publish_id: data?.data?.publish_id,
    mode,
    note: isDirect ? 'Posted directly' : '📥 ส่งเป็น draft ใน TikTok inbox — เปิด TikTok app → Inbox → กดแก้ caption + Publish',
  };
}

router.post('/trigger', async (req, res) => {
  const { content_id, action } = req.body || {};
  const webhook = process.env.N8N_WEBHOOK_URL;

  if (action === 'test') {
    if (!webhook) return res.json({ ok: false, message: 'N8N_WEBHOOK_URL ยังไม่ตั้งค่า — ใช้ FB direct post แทน' });
    try {
      const r = await fetch(webhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, time: new Date().toISOString() })
      });
      return res.json({ ok: r.ok, message: r.ok ? '✅ ส่ง test webhook สำเร็จ' : `❌ webhook ${r.status}` });
    } catch (e) { return res.json({ ok: false, message: '❌ ' + e.message }); }
  }

  if (!content_id) return res.status(400).json({ error: 'content_id required' });
  const content = await db.contents.getById(Number(content_id));
  if (!content) return res.status(404).json({ error: 'content not found' });

  const result = await dispatchToN8n(content);
  res.json(result);
});

router.get('/logs', async (req, res) => {
  if (!supabase) return res.json({ logs: [] });
  try {
    const { data, error } = await supabase.from('automation_logs')
      .select('*').eq('tenant_id', currentTenantId())
      .order('created_at', { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    res.json({ logs: data || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 🚀 Manual trigger — รัน scheduled posts ที่ถึงเวลาแล้วทันที (ไม่ต้องรอ cron)
router.post('/run-now', async (req, res) => {
  try {
    const due = await db.contents.due();
    if (!due.length) return res.json({ ok: true, message: 'ไม่มี post ที่ถึงเวลา', count: 0 });
    await runDueAutomations();
    res.json({ ok: true, processed: due.length, message: `รัน ${due.length} posts แล้ว — เช็คผลที่ /api/automation/logs` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ดู scheduled posts ที่กำลังรอ
router.get('/scheduled', async (req, res) => {
  try {
    const all = await db.contents.list();
    const scheduled = all.filter(c => c.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    res.json({ count: scheduled.length, scheduled });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Resolve a content's image source — pull from image_jobs if the row still
// references a running gen, so a user who scheduled mid-generation still ends
// up with the finished bytes posted at the right time.
// Returns:
//   { ready: true, content }      → posting can proceed (image_base64/media_url ready)
//   { ready: false, retry: true } → image still processing — leave row 'scheduled' for next tick
//   { ready: false, failed: true, error } → linked gen failed — propagate to content row
async function resolveContentImage(c) {
  if (c.image_base64 || c.media_url) return { ready: true, content: c };
  if (!c.image_job_id || !supabase) return { ready: true, content: c }; // no async ref to wait on

  const { data: job } = await supabase
    .from('image_jobs')
    .select('image_base64, image_url, status, error')
    .eq('id', c.image_job_id)
    .eq('tenant_id', currentTenantId())
    .maybeSingle();

  if (!job) return { ready: true, content: c };

  if (job.status === 'done') {
    return {
      ready: true,
      content: { ...c, image_base64: job.image_base64 || c.image_base64, media_url: job.image_url || c.media_url },
    };
  }
  if (job.status === 'failed') {
    return { ready: false, failed: true, error: `image gen #${c.image_job_id} failed: ${job.error || 'unknown'}` };
  }
  // pending / processing → wait
  return { ready: false, retry: true };
}

export async function runDueAutomations() {
  const due = await db.contents.due();
  if (!due.length) return;
  console.log(`[cron] found ${due.length} due posts to publish`);

  // 🔒 Race-condition guard: cron-job.org อาจยิงซ้อนกัน 2 ticks → 2 invocations
  //    ดึง due() พร้อมกัน → process row เดียวกัน 2 ครั้ง → double post
  //
  //    Solution: atomically mark rows 'scheduled' → 'processing' (.update().eq().select())
  //    เฉพาะ rows ที่ตอบกลับมาคือ rows ที่เรา "claim" ได้ — invocation อื่นจะได้ empty
  let claimed = due;
  if (supabase) {
    const ids = due.map(r => r.id);
    const { data: claimedRows, error } = await supabase
      .from('contents')
      .update({ status: 'processing', last_attempt_at: new Date().toISOString() })
      .in('id', ids)
      .eq('status', 'scheduled')  // only claim rows still scheduled (not already taken)
      .select('*');
    if (error) {
      console.error('[cron] claim failed, falling back to non-atomic:', error.message);
    } else {
      claimed = claimedRows || [];
      const lost = due.length - claimed.length;
      if (lost > 0) console.log(`[cron] lost race on ${lost} rows (another tick claimed them)`);
    }
  }
  if (!claimed.length) return;

  // Group rows by series_group_id so we can post a carousel for ทั้ง group ใน 1 ครั้ง
  // (ก่อนหน้านี้ post ทีละแถว = 3-slide carousel กลายเป็น 3 single posts)
  const groups = new Map();
  for (const c of claimed) {
    const key = c.series_group_id ? `series:${c.series_group_id}` : `single:${c.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }

  for (const [key, rows] of groups) {
    // 🏢 ประมวลผลแต่ละ post ภายใน tenant context ของ content row นั้น —
    //    db.fbCreds / db.contents.update รู้ว่าโพสต์ของ tenant ไหน
    const tid = rows[0].tenant_id || 1;
    await runWithTenant(tid, async () => {
      if (rows.length > 1) {
        // sort เรียงตาม id เพื่อให้สไลด์ออกตามลำดับที่ user save
        rows.sort((a, b) => a.id - b.id);
        await processCarouselGroup(rows);
      } else {
        await processSingle(rows[0]);
      }
    });
  }
}

async function processSingle(c) {
  try {
    // ✨ Pre-flight: ถ้า row ผูกกับ image_jobs ที่ยังไม่เสร็จ → รอ tick ต่อไป
    const resolved = await resolveContentImage(c);
    if (!resolved.ready) {
      if (resolved.failed) {
        console.warn(`[cron] content #${c.id} → marking failed: ${resolved.error}`);
        await db.contents.update(c.id, {
          status: 'failed',
          last_error: resolved.error,
          last_attempt_at: new Date().toISOString(),
        });
      } else {
        console.log(`[cron] content #${c.id} image_job still processing — retry next tick`);
      }
      return;
    }
    c = resolved.content;

    // 🎬 Safety net: ถ้า row มี series_images_b64 หลายรูป (saveDraft รุ่นเก่า → 1 row หลายรูป)
    //    cron จะ post เป็น carousel จริง ๆ ไม่ใช่ single image
    let seriesImages = null;
    if (c.series_images_b64) {
      try {
        seriesImages = typeof c.series_images_b64 === 'string'
          ? JSON.parse(c.series_images_b64)
          : c.series_images_b64;
      } catch {}
    }
    if (Array.isArray(seriesImages) && seriesImages.length > 1) {
      console.log(`[cron] content #${c.id} has ${seriesImages.length} slides → posting as carousel`);
      return processSingleRowCarousel(c, seriesImages);
    }

    const platforms = (c.platforms && c.platforms.length) ? c.platforms : ['facebook'];
    console.log(`[cron] posting content #${c.id} to [${platforms.join(', ')}]`);

    const results = {};
    let anyFail = false;
    let fbImageUrl = null;

    for (const p of platforms) {
      const handler = PLATFORM_HANDLERS[p];
      if (!handler) { results[p] = { ok: false, error: 'unsupported' }; anyFail = true; continue; }
      try {
        let ctx = c;
        if (p === 'instagram') {
          if (ctx.image_base64) {
            const igUrl = buildPublicImageUrl(ctx.id, 'instagram');
            if (igUrl) ctx = { ...ctx, media_url: igUrl };
          }
          if (!ctx.media_url && fbImageUrl) ctx = { ...ctx, media_url: fbImageUrl };
        } else if (p === 'tiktok') {
          if (ctx.image_base64) {
            const ttUrl = buildPublicImageUrl(ctx.id, 'tiktok');
            if (ttUrl) ctx = { ...ctx, media_url: ttUrl };
          }
          if (!ctx.media_url && fbImageUrl) ctx = { ...ctx, media_url: fbImageUrl };
        }
        const r = await handler(ctx);
        results[p] = r;
        if (!r.ok) anyFail = true;
        if (p === 'facebook' && r.ok && r.image_url) fbImageUrl = r.image_url;
        await logAttempt(c.id, p, r);
      } catch (e) {
        results[p] = { ok: false, error: e.message };
        anyFail = true;
        await logAttempt(c.id, p, { ok: false, error: e.message });
      }
    }

    const status = anyFail ? 'failed' : 'published';
    const lastErr = anyFail ? Object.entries(results).filter(([_, r]) => !r.ok).map(([p, r]) => `${p}:${r.error}`).join('; ') : null;
    const update = {
      status,
      last_error: lastErr,
      published_at: anyFail ? null : new Date().toISOString(),
      last_attempt_at: new Date().toISOString(),
      retry_count: (c.retry_count || 0) + 1,
    };
    if (supabase) update.post_results = results;
    await db.contents.update(c.id, update);

    console.log(`[cron] content #${c.id} → ${status}${lastErr ? ' (' + lastErr + ')' : ''}`);
  } catch (e) { console.error('[cron]', c.id, e.message); }
}

// Single row with series_images_b64 array → post as carousel (legacy support).
// FB ใช้ images array (base64) ผ่าน /post-carousel, IG ใช้ public URL ต่อ slide
// ผ่าน /api/public/content-slide/<id>/<index>
async function processSingleRowCarousel(c, images) {
  const platforms = (c.platforms && c.platforms.length) ? c.platforms : ['facebook'];
  const caption = [c.hook, c.caption].filter(Boolean).join('\n\n');
  const baseUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  const results = {};
  let anyFail = false;

  for (const p of platforms) {
    try {
      if (p === 'facebook') {
        const r = await fetch(`${baseUrl}/api/facebook/post-carousel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
            'x-cron-internal': '1',
          },
          body: JSON.stringify({
            course: c.course,
            caption,
            // Each entry may be a hosted http(s) URL (async/Supabase images) OR
            // a base64/data string (sync models) — route each to the field the
            // /post-carousel handler expects so URL-based carousels also post.
            images: images.map(s => /^https?:\/\//.test(s)
              ? { image_url: s }
              : { image_base64: String(s).replace(/^data:[^;]+;base64,/, '') }),
            tenant_id: currentTenantId(),
          }),
        });
        const d = await r.json().catch(() => ({}));
        results[p] = r.ok ? { ok: true, ...d } : { ok: false, error: d.error || `HTTP ${r.status}` };
        if (!r.ok) anyFail = true;
      } else if (p === 'instagram') {
        // IG needs public URL per slide — use content-slide endpoint
        const slideUrls = images.map((_, i) => `${baseUrl}/api/public/content-slide/${c.id}/${i}?platform=instagram`);
        const r = await fetch(`${baseUrl}/api/instagram/post-carousel-urls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
            'x-cron-internal': '1',
          },
          body: JSON.stringify({
            course: c.course,
            caption,
            image_urls: slideUrls,
            tenant_id: currentTenantId(),
          }),
        });
        const d = await r.json().catch(() => ({}));
        results[p] = r.ok ? { ok: true, ...d } : { ok: false, error: d.error || `HTTP ${r.status}` };
        if (!r.ok) anyFail = true;
      } else if (p === 'tiktok') {
        // TikTok ไม่มี carousel → ใช้ cover เป็น single
        const handler = PLATFORM_HANDLERS[p];
        let ctx = c;
        if (ctx.image_base64) {
          const ttUrl = buildPublicImageUrl(ctx.id, 'tiktok');
          if (ttUrl) ctx = { ...ctx, media_url: ttUrl };
        }
        results[p] = await handler(ctx);
        if (!results[p].ok) anyFail = true;
      }
      await logAttempt(c.id, p, results[p]);
    } catch (e) {
      results[p] = { ok: false, error: e.message };
      anyFail = true;
      await logAttempt(c.id, p, { ok: false, error: e.message });
    }
  }

  const status = anyFail ? 'failed' : 'published';
  const lastErr = anyFail ? Object.entries(results).filter(([_, r]) => !r.ok).map(([p, r]) => `${p}:${r.error}`).join('; ') : null;
  const update = {
    status,
    last_error: lastErr,
    published_at: anyFail ? null : new Date().toISOString(),
    last_attempt_at: new Date().toISOString(),
    retry_count: (c.retry_count || 0) + 1,
  };
  if (supabase) update.post_results = results;
  await db.contents.update(c.id, update);
  console.log(`[cron] content #${c.id} carousel → ${status}${lastErr ? ' (' + lastErr + ')' : ''}`);
}

// Group of scheduled rows that share a series_group_id → post as single carousel
// reusing the existing /post-carousel handlers (FB attached_media + IG media children)
async function processCarouselGroup(rows) {
  // ✨ Pre-flight: resolve image_jobs สำหรับแต่ละ row — รอถ้ายัง processing,
  //    mark failed ถ้า gen fail. ถ้ามี row ไหนต้องรอ → defer ทั้งกลุ่มไป tick หน้า
  const resolvedRows = [];
  for (const r of rows) {
    const res = await resolveContentImage(r);
    if (!res.ready) {
      if (res.failed) {
        console.warn(`[cron] carousel row #${r.id} → marking failed: ${res.error}`);
        await db.contents.update(r.id, {
          status: 'failed',
          last_error: res.error,
          last_attempt_at: new Date().toISOString(),
        });
      } else {
        console.log(`[cron] carousel row #${r.id} image_job still processing — defer group`);
      }
      // ถ้ามี row ใน group ที่ยัง pending → defer ทั้งกลุ่ม (ตัด carousel ครึ่งๆ ไม่ได้)
      return;
    }
    resolvedRows.push(res.content);
  }
  rows = resolvedRows;
  const cover = rows[0];
  const ids = rows.map(r => r.id);
  const platforms = (cover.platforms && cover.platforms.length) ? cover.platforms : ['facebook'];
  // ใช้ caption ของ row แรก — series ปกติเก็บ master caption ที่ slide แรก
  const caption = [cover.hook, cover.caption].filter(Boolean).join('\n\n');
  console.log(`[cron] posting CAROUSEL (${ids.length} slides) #${ids.join(',')} to [${platforms.join(', ')}]`);

  const results = {};
  let anyFail = false;
  const baseUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

  for (const p of platforms) {
    try {
      if (p === 'facebook' || p === 'instagram') {
        const endpoint = p === 'facebook' ? '/api/facebook/post-carousel' : '/api/instagram/post-carousel';
        const r = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Use CRON_SECRET as a service-to-service bypass (or JWT in future).
            // Currently /post-carousel uses requireAuth — for cron we hit the same
            // server in-process via a self-call with the cron secret header.
            'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
            'x-cron-internal': '1',
          },
          body: JSON.stringify({ course: cover.course, caption, content_ids: ids, tenant_id: currentTenantId() }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          results[p] = { ok: false, error: d.error || `HTTP ${r.status}` };
          anyFail = true;
        } else {
          results[p] = { ok: true, ...d };
        }
      } else if (p === 'tiktok') {
        // TikTok ไม่มี carousel — โพสรูปแรกเป็น single image แทน
        const handler = PLATFORM_HANDLERS[p];
        let ctx = cover;
        if (ctx.image_base64) {
          const ttUrl = buildPublicImageUrl(ctx.id, 'tiktok');
          if (ttUrl) ctx = { ...ctx, media_url: ttUrl };
        }
        results[p] = await handler(ctx);
        if (!results[p].ok) anyFail = true;
      }
      for (const id of ids) await logAttempt(id, p, results[p]);
    } catch (e) {
      results[p] = { ok: false, error: e.message };
      anyFail = true;
      for (const id of ids) await logAttempt(id, p, { ok: false, error: e.message });
    }
  }

  // Mark ALL rows in the group with the same outcome — carousel posts atomically
  const status = anyFail ? 'failed' : 'published';
  const lastErr = anyFail ? Object.entries(results).filter(([_, r]) => !r.ok).map(([p, r]) => `${p}:${r.error}`).join('; ') : null;
  for (const c of rows) {
    const update = {
      status,
      last_error: lastErr,
      published_at: anyFail ? null : new Date().toISOString(),
      last_attempt_at: new Date().toISOString(),
      retry_count: (c.retry_count || 0) + 1,
    };
    if (supabase) update.post_results = results;
    await db.contents.update(c.id, update);
  }

  console.log(`[cron] carousel #${ids.join(',')} → ${status}${lastErr ? ' (' + lastErr + ')' : ''}`);
}

async function dispatchToN8n(content) {
  const webhook = process.env.N8N_WEBHOOK_URL;
  if (!webhook) return { ok: false, message: 'N8N_WEBHOOK_URL not configured' };

  const payload = {
    id: content.id, course: content.course, hook: content.hook,
    caption: content.caption, media_url: content.media_url,
    platforms: content.platforms || ['facebook'], scheduled_at: content.scheduled_at,
  };

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OEM-Source': 'content-factory' },
      body: JSON.stringify(payload)
    });
    return { ok: r.ok, message: r.ok ? '✅ dispatched to n8n' : `❌ webhook ${r.status}` };
  } catch (e) { return { ok: false, message: e.message }; }
}

export default router;
