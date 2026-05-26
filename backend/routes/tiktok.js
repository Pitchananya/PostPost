import { Router } from 'express';
import { requireAuth } from './auth.js';
import { db } from '../db.js';

const router = Router();

const TT_API = 'https://open.tiktokapis.com/v2';
const TT_OAUTH = 'https://www.tiktok.com/v2/auth/authorize';

async function getCreds(course = null) {
  const c = await db.ttCreds.get(course);
  return {
    clientKey: c.client_key,
    clientSecret: c.client_secret,
    accessToken: c.access_token,
    refreshToken: c.refresh_token,
    openId: c.open_id,
    expiresAt: c.expires_at,
    savedAt: c.saved_at,
    perCourse: c.per_course,
    redirectUri: c.redirect_uri || `${process.env.PUBLIC_URL || 'http://localhost:3000'}/api/tiktok/oauth/callback`,
  };
}

// ส่ง access_token + refresh + ฯลฯ → คำนวณ expires_at ภาคไทย → save DB
async function saveTokenResponse(data, course = null) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = data.expires_in ? now + Number(data.expires_in) : null;
  await db.ttCreds.save({
    course,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    open_id: data.open_id,
    expires_at: expiresAt,
  });
  return expiresAt;
}

// ============== OAUTH FLOW ==============

// GET /api/tiktok/oauth/start?course=PFB|PHE|GURU&state_suffix=POPUP&brand=<id>
// — redirect user ไป TikTok เพื่อขอ permission
// state_suffix=POPUP + brand=<id> ทำให้ callback postMessage กลับไปยัง opener แทนแสดง success page
router.get('/oauth/start', async (req, res) => {
  const { clientKey, redirectUri } = await getCreds();
  if (!clientKey) return res.status(500).send('TIKTOK_CLIENT_KEY ยังไม่ตั้งค่าใน env');
  const course = (req.query.course || '').toUpperCase();
  const popupMode = req.query.state_suffix === 'POPUP';
  const brand = String(req.query.brand || '').slice(0, 32);
  // state เก็บ random + course + popup marker + brand id (TikTok ส่ง state คืนใน callback)
  const nonce = Math.random().toString(36).slice(2, 14);
  const parts = [nonce];
  if (course) parts.push(course);
  if (popupMode) parts.push('POPUP');
  if (brand) parts.push('BRAND:' + encodeURIComponent(brand));
  const state = parts.join('.');
  // scope จาก env (เผื่อ Sandbox ไม่มีบาง scope) — default = ขั้นต่ำที่ Sandbox มักจะมี
  // override ด้วย ?scope=... ใน query ก็ได้
  const scope = req.query.scope || process.env.TIKTOK_SCOPES || 'user.info.basic,video.upload';
  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: 'code',
    scope,
    redirect_uri: redirectUri,
    state,
  });
  res.redirect(`${TT_OAUTH}/?${params.toString()}`);
});

// GET /api/tiktok/oauth/callback — รับ code จาก TikTok แล้วแลก access_token + auto-save
router.get('/oauth/callback', async (req, res) => {
  const { code, error: oauthError, state } = req.query;
  if (oauthError) return res.status(400).send(`TikTok OAuth error: ${oauthError}`);
  if (!code) return res.status(400).send('Missing code');

  // recover scope key จาก state (format: "<nonce>[.COURSE][.POPUP][.BRAND:<id>]")
  // — prefer .BRAND:<id> (multi-tenant brands like kuru, happyprice) over the
  // legacy PFB/PHE/GURU course tags. Falls back to null = default scope.
  const stateParts = (state || '').split('.');
  const brandHit = state && state.includes('.BRAND:')
    ? decodeURIComponent(state.split('.BRAND:')[1].split('.')[0])
    : '';
  const courseHit = stateParts.find(p => ['PFB', 'PHE', 'GURU'].includes(p.toUpperCase()));
  const validCourse = brandHit && /^[A-Za-z0-9_-]{1,32}$/.test(brandHit)
    ? brandHit                            // brand id wins when present
    : (courseHit ? courseHit.toUpperCase() : null);

  const { clientKey, clientSecret, redirectUri } = await getCreds();
  if (!clientKey || !clientSecret) return res.status(500).send('TikTok credentials missing');

  try {
    const r = await fetch(`${TT_API}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).send(`TikTok OAuth error: ${JSON.stringify(data)}`);

    // 💾 auto-save token ลง DB ทันที (ตาม course ที่ใส่ตอน start)
    const expiresAt = await saveTokenResponse(data, validCourse);
    const courseLabel = validCourse || 'default';

    // popup mode — if state contains ".POPUP" suffix, render a thin page that
    // postMessage's the result back to opener + closes itself (PostPost UI flow).
    const isPopup = state && state.includes('.POPUP');
    if (isPopup) {
      const payload = { brand: brandHit, open_id: data.open_id || '', expires_at: expiresAt, course: courseLabel };
      return res.send(`<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/>
<title>เชื่อมต่อ TikTok สำเร็จ</title>
<style>body{font-family:system-ui,Prompt,sans-serif;padding:40px;text-align:center;background:#FFF8F0;color:#1E1B3A}
h1{font-size:22px;margin:6px 0 4px;color:#6B21A8}.ok{font-size:60px}.muted{color:#7C7393;font-size:13px}</style>
</head><body>
<div class="ok">✅</div>
<h1>เชื่อมต่อ TikTok สำเร็จ</h1>
<p class="muted">กำลังบันทึก… หน้าต่างนี้จะปิดอัตโนมัติ</p>
<script>
  var payload = ${JSON.stringify(payload).replace(/</g, '\\u003c')};
  try { if (window.opener) window.opener.postMessage({ type:'pp-tt-oauth', payload: payload }, location.origin); } catch(_){}
  setTimeout(function(){ try { window.close(); } catch(_){} }, 600);
</script>
</body></html>`);
    }

    // แสดงหน้า success — บอกว่า save เรียบร้อย ไม่ต้อง copy/paste แล้ว
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>TikTok Connected</title>
      <style>body{font-family:system-ui,sans-serif;padding:30px;max-width:700px;margin:auto;background:#f5f5f5}
      .box{background:#fff;padding:20px;border-radius:12px;border:2px solid #10b981;margin:10px 0}
      .ok{color:#065f46;font-weight:bold;font-size:18px}
      .info{color:#64748b;font-size:14px}
      code{background:#1e293b;color:#a7f3d0;padding:4px 8px;border-radius:4px;font-family:monospace;font-size:13px}
      a.btn{display:inline-block;background:#1e293b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px}
      h2{color:#0f172a}</style></head><body>
      <h2>✅ TikTok เชื่อมต่อสำเร็จแล้ว</h2>
      <div class="box">
        <div class="ok">🎵 Account: <code>${data.open_id || 'N/A'}</code></div>
        <div class="info" style="margin-top:8px">Course: <code>${courseLabel}</code></div>
        <div class="info">Token หมดอายุ: ${expiresAt ? new Date(expiresAt * 1000).toLocaleString('th-TH') : '?'} (~${data.expires_in || '?'} วินาที)</div>
        <div class="info">Refresh token อายุ: ${data.refresh_expires_in ? Math.floor(data.refresh_expires_in / 86400) + ' วัน' : '?'}</div>
      </div>
      <p>Token ถูกบันทึกลง DB เรียบร้อย — <strong>ไม่ต้อง copy/paste อะไรอีก</strong></p>
      <p>ระบบจะ auto-refresh token ก่อนหมดอายุ — ไม่ต้องทำซ้ำเร็ว ๆ นี้</p>
      <a class="btn" href="/admin">← กลับ Admin</a>
      </body></html>`);
  } catch (e) {
    res.status(500).send('OAuth error: ' + e.message);
  }
});

// ============== POST API (require auth) ==============
router.use(requireAuth);

// DELETE /api/tiktok/credentials?course=<brand-id>
// Clear TT creds for one scope — called by the frontend "ยกเลิก" button so the
// backend doesn't keep posting with a stale access_token after the user
// disconnects the brand's TikTok account.
router.delete('/credentials', async (req, res) => {
  const course = req.query.course || null;
  if (course && !/^[A-Za-z0-9_-]{1,32}$/.test(String(course))) {
    return res.status(400).json({ error: 'course/brand id ต้องเป็นตัวอักษร/ตัวเลข/dash/underscore' });
  }
  try {
    const c = (course || '').toLowerCase();
    const suffix = c ? `_${c}` : '';
    const patch = {};
    ['tt_access_token', 'tt_refresh_token', 'tt_open_id', 'tt_expires_at'].forEach((k) => {
      patch[k + suffix] = '';
    });
    patch[`tt_creds_cleared_at${suffix}`] = new Date().toISOString();
    await db.settings.set(patch);
    res.json({ ok: true, course: course || 'default', cleared_at: patch[`tt_creds_cleared_at${suffix}`] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tiktok/connection?course=PFB|PHE|GURU — ตรวจการเชื่อมต่อ
router.get('/connection', async (req, res) => {
  const course = req.query.course || null;
  const { clientKey, accessToken, expiresAt, savedAt, perCourse } = await getCreds(course);
  if (!clientKey) {
    return res.json({
      connected: false,
      reason: 'TIKTOK_CLIENT_KEY ยังไม่ตั้งค่าใน env',
      hint: '1) สมัคร https://developers.tiktok.com  2) Create app + add Login Kit + Content Posting API  3) ใส่ TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET ใน Vercel env vars',
    });
  }
  if (!accessToken) {
    return res.json({
      connected: false,
      reason: course ? `ยังไม่ได้ OAuth สำหรับ ${course}` : 'ยังไม่ได้ OAuth',
      oauth_url: course ? `/api/tiktok/oauth/start?course=${course}` : '/api/tiktok/oauth/start',
      hint: 'กดปุ่ม OAuth ใน Connect tab',
    });
  }
  try {
    const r = await fetch(`${TT_API}/user/info/?fields=open_id,union_id,avatar_url,display_name`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const data = await r.json();
    if (!r.ok) return res.json({ connected: false, reason: `TT API ${r.status}: ${JSON.stringify(data).slice(0, 200)}`, expires_at: expiresAt });
    res.json({ connected: true, account: data?.data?.user || data, expires_at: expiresAt, expires_at_iso: expiresAt ? new Date(expiresAt * 1000).toISOString() : null, saved_at: savedAt, per_course: perCourse });
  } catch (e) {
    res.json({ connected: false, reason: e.message });
  }
});

// GET /api/tiktok/connections-all — ดูสถานะของทุก course
router.get('/connections-all', async (req, res) => {
  const courses = ['PFB', 'PHE', 'GURU'];
  const result = {};
  for (const co of courses) {
    const { clientKey, accessToken, expiresAt, perCourse } = await getCreds(co);
    if (!clientKey || !accessToken) {
      result[co] = { connected: false, reason: !clientKey ? 'CLIENT_KEY missing' : 'ยังไม่ได้ OAuth', per_course: perCourse };
      continue;
    }
    try {
      const r = await fetch(`${TT_API}/user/info/?fields=open_id,display_name`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await r.json();
      if (!r.ok) { result[co] = { connected: false, reason: `TT ${r.status}`, expires_at: expiresAt, per_course: perCourse }; continue; }
      result[co] = { connected: true, account: data?.data?.user || data, expires_at: expiresAt, expires_at_iso: expiresAt ? new Date(expiresAt * 1000).toISOString() : null, per_course: perCourse };
    } catch (e) { result[co] = { connected: false, reason: e.message }; }
  }
  res.json({ ok: true, courses: result });
});

// GET /api/tiktok/creator-info?course=GURU — TikTok บอกว่า account นี้ post ได้ privacy level ไหนบ้าง (debug Sandbox)
router.get('/creator-info', async (req, res) => {
  const course = req.query.course || null;
  const { accessToken } = await getCreds(course);
  if (!accessToken) return res.status(400).json({ error: 'no access_token' });
  try {
    const r = await fetch(`${TT_API}/post/publish/creator_info/query/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    const data = await r.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/tiktok/token-status?course= — token expiry + refresh availability
router.get('/token-status', async (req, res) => {
  const course = req.query.course || null;
  const c = await db.ttCreds.get(course);
  const now = Math.floor(Date.now() / 1000);
  const expSec = c.expires_at ? Number(c.expires_at) - now : null;
  res.json({
    ok: true,
    course,
    has_access_token: !!c.access_token,
    has_refresh_token: !!c.refresh_token,
    open_id: c.open_id,
    expires_at: c.expires_at,
    expires_at_iso: c.expires_at ? new Date(Number(c.expires_at) * 1000).toISOString() : null,
    seconds_until_expiry: expSec,
    is_expired: expSec !== null && expSec <= 0,
    is_expiring_soon: expSec !== null && expSec > 0 && expSec < 3600, // < 1 hour
    saved_at: c.saved_at,
    per_course: c.per_course,
  });
});

// POST /api/tiktok/post-photo — โพสต์ภาพ + caption (TikTok Photo Mode)
router.post('/post-photo', async (req, res) => {
  const { accessToken } = await getCreds();
  if (!accessToken) return res.status(400).json({ error: 'TIKTOK_ACCESS_TOKEN missing' });

  const { hook = '', caption = '', image_url, hashtags = [] } = req.body || {};
  if (!image_url) return res.status(400).json({ error: 'image_url required (must be public URL)' });
  const title = [hook, caption, hashtags.length ? '\n' + hashtags.join(' ') : ''].filter(Boolean).join('\n\n').slice(0, 2200);

  try {
    const r = await fetch(`${TT_API}/post/publish/content/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title,
          description: caption.slice(0, 4000),
          disable_comment: false,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          auto_add_music: true,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_cover_index: 0,
          photo_images: [image_url],
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data?.error?.message || 'TT post error', detail: data });
    res.json({
      ok: true,
      publish_id: data?.data?.publish_id,
      detail: data,
      note: 'รอ TikTok review ~1-5 นาที — เช็คใน TikTok app หรือ /api/tiktok/status?publish_id=...',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tiktok/post-series-photos — โพสต์ carousel หลายรูป (Series)
// รับ content_ids (preferred — payload เล็ก) หรือ images (legacy, มีข้อจำกัด Vercel 4.5MB)
router.post('/post-series-photos', async (req, res) => {
  const { course, caption = '', images = [], content_ids = [] } = req.body || {};
  const useIds = Array.isArray(content_ids) && content_ids.length > 0;
  const useImages = Array.isArray(images) && images.length > 0;
  if (!useIds && !useImages) return res.status(400).json({ error: 'content_ids หรือ images array required' });

  const count = useIds ? content_ids.length : images.length;
  if (count > 35) return res.status(400).json({ error: 'TikTok limit 35 photos per post' });

  const { accessToken } = await getCreds(course);
  if (!accessToken) return res.status(400).json({ error: `TikTok ไม่ได้ OAuth สำหรับ ${course || 'default'}` });

  const publicBase = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (!publicBase) return res.status(500).json({ error: 'PUBLIC_URL env ยังไม่ตั้งค่า — TikTok ต้องดึงรูปจาก public URL' });

  try {
    let ids;
    if (useIds) {
      // verify content_ids ด้วย targeted query (กัน statement timeout จาก list ใหญ่)
      const rows = await db.contents.getByIds(content_ids);
      if (rows.length !== content_ids.length) return res.status(400).json({ error: 'บาง content_id ไม่พบ' });
      for (const c of rows) {
        if (!c.image_base64) return res.status(400).json({ error: `content_id ${c.id} ไม่มี image_base64` });
      }
      ids = rows.map(c => c.id);
    } else {
      // legacy: บันทึกแต่ละรูปเป็น draft content row → ได้ id (จำกัด ~3 slides เพราะ Vercel)
      ids = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.image_base64) return res.status(400).json({ error: `image[${i}] ไม่มี image_base64` });
        const row = await db.contents.insert({
          course: course || 'PFB',
          topic: `[series-slide-${i+1}]`,
          framework: 'F1',
          hook: '[TikTok carousel slide]',
          caption: caption.slice(0, 4000),
          image_base64: img.image_base64,
          platforms: ['tiktok'],
          status: 'draft',
          scheduled_at: new Date().toISOString(),
        });
        ids.push(row.id);
      }
    }

    // สร้าง public URLs (4:5 สำหรับ TikTok)
    const photoUrls = ids.map(id => `${publicBase}/api/public/content-image/${id}?platform=tiktok`);

    const mode = (process.env.TIKTOK_POST_MODE || 'MEDIA_UPLOAD').toUpperCase();
    const isDirect = mode === 'DIRECT_POST';
    // ใช้ content/init endpoint สำหรับทั้ง 2 mode
    const endpoint = `${TT_API}/post/publish/content/init/`;
    const title = caption.slice(0, 90);

    const privacy = (process.env.TIKTOK_PRIVACY || 'SELF_ONLY').toUpperCase();

    const body = isDirect
      ? {
          post_info: {
            title,
            description: caption.slice(0, 4000),
            privacy_level: privacy,
            disable_comment: false,
            auto_add_music: true,
          },
          source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: photoUrls },
          post_mode: 'DIRECT_POST',
          media_type: 'PHOTO',
        }
      : {
          post_info: {
            title: title || '(draft)',
            privacy_level: privacy,
          },
          source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: photoUrls },
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
    if (!r.ok || (data?.error?.code && data.error.code !== 'ok')) {
      const msg = data?.error?.message || `TT ${r.status}`;
      const code = data?.error?.code || r.status;
      console.error('[tt-carousel] error:', JSON.stringify({ code, msg, detail: data, mode, photo_urls: photoUrls }));
      return res.status(500).json({ error: `${msg} (code: ${code})`, detail: data, photo_urls: photoUrls });
    }

    res.json({
      ok: true,
      publish_id: data?.data?.publish_id,
      mode,
      slides: ids.length,
      content_ids: ids,
      note: isDirect ? 'Posted directly' : '📥 ส่งเป็น draft ใน TikTok inbox — เปิด TikTok app → Inbox → กดแก้ caption + Publish',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tiktok/post-video — โพสต์วิดีโอ
router.post('/post-video', async (req, res) => {
  const { accessToken } = await getCreds();
  if (!accessToken) return res.status(400).json({ error: 'TIKTOK_ACCESS_TOKEN missing' });

  const { hook = '', caption = '', video_url, hashtags = [] } = req.body || {};
  if (!video_url) return res.status(400).json({ error: 'video_url required (must be public URL)' });
  const title = [hook, caption, hashtags.length ? '\n' + hashtags.join(' ') : ''].filter(Boolean).join('\n\n').slice(0, 2200);

  try {
    const r = await fetch(`${TT_API}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url,
        },
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data?.error?.message || 'TT video error', detail: data });
    res.json({ ok: true, publish_id: data?.data?.publish_id, detail: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tiktok/status?publish_id=... — เช็คสถานะ post
router.get('/status', async (req, res) => {
  const course = req.query.course || 'GURU'; // default course
  const { accessToken } = await getCreds(course);
  const { publish_id } = req.query;
  if (!accessToken) return res.status(400).json({ error: `no access_token for ${course} — pass ?course=PFB|PHE|GURU` });
  if (!publish_id) return res.status(400).json({ error: 'publish_id required' });
  try {
    const r = await fetch(`${TT_API}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ publish_id }),
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Internal helper: refresh TikTok token for a given course → auto-save to DB
async function refreshTtToken(course = null) {
  const c = await db.ttCreds.get(course);
  if (!c.client_key || !c.client_secret) throw new Error('TIKTOK_CLIENT_KEY/SECRET ยังไม่ตั้งค่าใน env');
  if (!c.refresh_token) throw new Error('No refresh_token saved — ทำ OAuth ครั้งแรกก่อน');

  const r = await fetch(`${TT_API}/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: c.client_key,
      client_secret: c.client_secret,
      refresh_token: c.refresh_token,
      grant_type: 'refresh_token',
    }).toString(),
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(`TT refresh failed: ${data.error?.message || data.error || r.status}`);
  if (!data.access_token) throw new Error('TT ไม่คืน access_token — refresh_token อาจหมดอายุ (>1 ปี) ต้อง OAuth ใหม่');

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = data.expires_in ? now + Number(data.expires_in) : null;
  await db.ttCreds.save({
    course,
    access_token: data.access_token,
    refresh_token: data.refresh_token || c.refresh_token, // บาง response ไม่คืน refresh ใหม่ — ใช้ตัวเก่า
    open_id: data.open_id || c.open_id,
    expires_at: expiresAt,
  });
  return { open_id: data.open_id || c.open_id, expires_at: expiresAt };
}

// POST /api/tiktok/refresh — refresh access token (อัตโนมัติ save ลง DB)
// body.course = PFB|PHE|GURU (เลือก course หรือเว้นว่าง = default)
router.post('/refresh', async (req, res) => {
  const course = req.body?.course || null;
  try {
    const result = await refreshTtToken(course);
    res.json({
      ok: true,
      course: course || 'default',
      open_id: result.open_id,
      expires_at: result.expires_at,
      expires_at_iso: result.expires_at ? new Date(result.expires_at * 1000).toISOString() : null,
      note: 'Token ใหม่ใช้งานทันที — ไม่ต้อง redeploy',
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Helper: ดึง access token ของ course — ถ้าใกล้หมดอายุก็ refresh ก่อนคืน
export async function getValidTtAccessToken(course = null) {
  const c = await db.ttCreds.get(course);
  if (!c.access_token) return null;
  const now = Math.floor(Date.now() / 1000);
  // ถ้าหมดแล้วหรือเหลือ < 5 นาที → refresh ก่อน
  if (c.expires_at && Number(c.expires_at) - now < 300 && c.refresh_token) {
    try {
      await refreshTtToken(course);
      const fresh = await db.ttCreds.get(course);
      return fresh.access_token;
    } catch (e) {
      console.warn(`[tt] auto-refresh failed (${course || 'default'}):`, e.message);
      return c.access_token; // ยอมใช้ token เดิม — TT จะปฏิเสธให้รู้
    }
  }
  return c.access_token;
}

export default router;
