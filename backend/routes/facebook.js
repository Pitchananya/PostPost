import { Router } from 'express';
import { requireAuth } from './auth.js';
import { resizeForPlatform } from './public.js';
import { db } from '../db.js';

const router = Router();

const FB_API = 'https://graph.facebook.com/v21.0';

// ============================================================
// Public OAuth flow (NO requireAuth — Facebook hits these directly with the user's browser).
// Pattern: frontend opens /api/facebook/oauth/start in a popup → user consents on facebook.com
// → Facebook redirects to /api/facebook/oauth/callback → we exchange code for tokens + list pages
// → HTML page postMessage's the result to opener + closes itself.
// The opener (authenticated frontend) then saves the picked page into the brand's channelInfo.
// ============================================================
const FB_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_manage_posts',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
].join(',');

function fbRedirectUri(req) {
  // Use the configured PUBLIC_URL when set (production), otherwise derive from the request
  const base = process.env.PUBLIC_URL
    || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}`;
  return base.replace(/\/$/, '') + '/api/facebook/oauth/callback';
}

router.get('/oauth/start', async (req, res) => {
  const appId = process.env.FB_APP_ID;
  if (!appId) return res.status(500).send('FB_APP_ID not configured');
  const brand = String(req.query.brand || '').slice(0, 32);
  const nonce = Math.random().toString(36).slice(2, 14);
  const state = brand ? `${nonce}.${encodeURIComponent(brand)}` : nonce;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: fbRedirectUri(req),
    state,
    scope: FB_OAUTH_SCOPES,
    response_type: 'code',
    display: 'popup',
  });
  res.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`);
});

router.get('/oauth/callback', async (req, res) => {
  const { code, error: oauthErr, error_description, state } = req.query;
  if (oauthErr) {
    return res.send(popupErrorHtml(error_description || oauthErr));
  }
  if (!code) return res.send(popupErrorHtml('Missing code'));
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) return res.send(popupErrorHtml('FB_APP_ID / FB_APP_SECRET not configured on the server'));
  const brand = state && state.includes('.') ? decodeURIComponent(state.split('.').slice(1).join('.')) : '';
  try {
    // 1) code → short-lived user token
    const tokParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: fbRedirectUri(req),
      code: String(code),
    });
    const tokRes = await fetch(`${FB_API}/oauth/access_token?${tokParams.toString()}`);
    const tokData = await tokRes.json();
    if (!tokRes.ok || tokData.error) {
      return res.send(popupErrorHtml(`FB code exchange: ${tokData.error?.message || tokRes.status}`));
    }
    // 2) short-lived → long-lived user token (~60 days)
    const longParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: tokData.access_token,
    });
    const longRes = await fetch(`${FB_API}/oauth/access_token?${longParams.toString()}`);
    const longData = await longRes.json();
    const userToken = longData.access_token || tokData.access_token;
    // 3) list pages — include IG business account field so the frontend can show IG too
    const pagesParams = new URLSearchParams({
      fields: 'id,name,access_token,category,fan_count,instagram_business_account{id,username}',
      access_token: userToken,
      limit: '50',
    });
    const pagesRes = await fetch(`${FB_API}/me/accounts?${pagesParams.toString()}`);
    const pagesData = await pagesRes.json();
    const pages = Array.isArray(pagesData.data) ? pagesData.data : [];
    res.send(popupSuccessHtml({
      brand,
      userToken,                       // long-lived user token (~60 days)
      pages,                           // [{ id, name, access_token, instagram_business_account?, ... }]
    }));
  } catch (e) {
    res.send(popupErrorHtml(e.message));
  }
});

function popupSuccessHtml(payload) {
  // Render a tiny page that bounces the data back to the opener via postMessage.
  // We narrow the postMessage target to the current origin to prevent leakage to other sites.
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/>
<title>เชื่อมต่อ Facebook สำเร็จ</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Prompt,sans-serif;padding:40px;text-align:center;background:#FFF8F0;color:#1E1B3A}
h1{font-size:22px;margin:6px 0 4px;color:#6B21A8}.ok{font-size:60px}.muted{color:#7C7393;font-size:13px}</style>
</head><body>
<div class="ok">✅</div>
<h1>เชื่อมต่อ Facebook สำเร็จ</h1>
<p class="muted">กำลังบันทึก… หน้าต่างนี้จะปิดอัตโนมัติ</p>
<script>
  var payload = ${JSON.stringify(payload).replace(/</g, '\\u003c')};
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'pp-fb-oauth', payload: payload }, location.origin);
    }
  } catch (e) {}
  setTimeout(function(){ try { window.close(); } catch(_){} }, 600);
</script>
</body></html>`;
}
function popupErrorHtml(msg) {
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/>
<title>เชื่อมต่อไม่สำเร็จ</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Prompt,sans-serif;padding:40px;text-align:center;background:#FEF2F2;color:#7F1D1D}
h1{font-size:20px;margin:6px 0 4px}.err{font-size:60px}.msg{background:#fff;border:1px solid #FCA5A5;padding:14px;border-radius:10px;margin:20px auto;max-width:520px;text-align:left;font-family:monospace;font-size:12px;word-break:break-word}</style>
</head><body>
<div class="err">⚠️</div>
<h1>เชื่อมต่อ Facebook ไม่สำเร็จ</h1>
<div class="msg">${String(msg).replace(/</g, '&lt;')}</div>
<p><a href="#" onclick="window.close();return false">ปิดหน้าต่างนี้</a></p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'pp-fb-oauth-error', message: ${JSON.stringify(String(msg))} }, location.origin);
    }
  } catch (e) {}
</script>
</body></html>`;
}

// ============================================================
// Authenticated endpoints below
// ============================================================
router.use(requireAuth);

// อ่านจาก DB ก่อน → fallback ไป env vars (ทำให้เปลี่ยน token โดยไม่ต้อง redeploy)
// รับ course เพื่อหา credentials ของแต่ละหลักสูตร (PFB / PHE / GURU)
async function getCreds(course = null) {
  const c = await db.fbCreds.get(course);
  return {
    pageId: c.page_id,
    pageToken: c.page_token,
    longLivedUserToken: c.long_lived_user_token,
    igBusinessId: c.ig_business_id,
    savedAt: c.saved_at,
    perCourse: c.per_course,
  };
}

// ตรวจ permissions ของ Page Token ปัจจุบัน — ช่วย debug error #200
// ?course=PFB|PHE|GURU — ใช้ app credentials per-course (รองรับ 3 เพจอยู่คนละ app)
router.get('/debug-token', async (req, res) => {
  const course = req.query.course || null;
  const c = await db.fbCreds.get(course);
  const pageToken = c.page_token;
  const appId = c.app_id;
  const appSecret = c.app_secret;
  if (!pageToken || !appId || !appSecret) return res.status(400).json({ error: `FB credentials missing for ${course || 'default'} — ต้อง Exchange ก่อน` });

  try {
    // 1. ตรวจ token info via debug_token
    const appAccessToken = `${appId}|${appSecret}`;
    const r1 = await fetch(`${FB_API}/debug_token?input_token=${pageToken}&access_token=${appAccessToken}`);
    const d1 = await r1.json();

    // 2. ตรวจ permissions ของ token
    const r2 = await fetch(`${FB_API}/me/permissions?access_token=${pageToken}`);
    const d2 = await r2.json();
    const granted = (d2.data || []).filter(p => p.status === 'granted').map(p => p.permission);
    const declined = (d2.data || []).filter(p => p.status === 'declined').map(p => p.permission);
    const required = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'];
    const missing = required.filter(p => !granted.includes(p));

    res.json({
      token_info: d1.data,
      granted,
      declined,
      missing_required: missing,
      can_post_to_page: missing.length === 0,
      hint: missing.length === 0 ? '✅ Token ถูกต้อง พร้อมใช้' : `❌ ขาด permission: ${missing.join(', ')} → กลับ Graph API Explorer ขออันนี้`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/connection', async (req, res) => {
  const course = req.query.course || null;
  const { pageId, pageToken, perCourse } = await getCreds(course);
  if (!pageId || !pageToken) {
    return res.json({ connected: false, reason: course ? `ยังไม่ตั้งค่า FB Page สำหรับ ${course}` : 'FB_PAGE_ID / FB_PAGE_TOKEN ยังไม่ตั้งค่า' });
  }
  try {
    const r = await fetch(`${FB_API}/${pageId}?fields=id,name,fan_count,picture&access_token=${pageToken}`);
    if (!r.ok) {
      const err = await r.text();
      return res.json({ connected: false, reason: `FB API ${r.status}: ${err.slice(0, 150)}` });
    }
    const data = await r.json();
    res.json({ connected: true, page: data, per_course: perCourse });
  } catch (e) {
    res.json({ connected: false, reason: e.message });
  }
});

// GET /api/facebook/connections-all — สถานะของทุกหลักสูตร (PFB, PHE, GURU)
// ตอนนี้รวม IG info ของแต่ละ course ด้วย (ต้องการทราบว่าโพสจะไปที่ IG ไหน)
router.get('/connections-all', async (req, res) => {
  try {
    const summary = await db.fbCreds.listAll();
    const courses = ['PFB', 'PHE', 'GURU'];
    const result = {};
    for (const co of courses) {
      const { pageId, pageToken, igBusinessId } = await getCreds(co);
      if (!pageId || !pageToken) {
        result[co] = { connected: false, reason: 'ยังไม่ตั้งค่า', per_course: !!summary.per_course[co], ig: null };
        continue;
      }
      let pageData = null;
      let pageError = null;
      try {
        // ดึง FB Page + IG Business Account ที่ link กับ Page นี้ใน 1 API call (cost optimization)
        const r = await fetch(`${FB_API}/${pageId}?fields=id,name,fan_count,instagram_business_account{id,username,followers_count}&access_token=${pageToken}`);
        if (!r.ok) {
          const err = await r.text();
          pageError = `FB ${r.status}: ${err.slice(0, 100)}`;
        } else {
          pageData = await r.json();
        }
      } catch (e) {
        pageError = e.message;
      }

      // IG info: ใช้ IG ที่ save ใน DB ก่อน (per-course) → fallback ไป instagram_business_account ที่ link กับ FB Page
      const linkedIg = pageData?.instagram_business_account;
      const savedIgId = igBusinessId || null;
      const linkedIgId = linkedIg?.id || null;
      const igMatch = savedIgId && linkedIgId ? (String(savedIgId) === String(linkedIgId)) : null;

      result[co] = pageError
        ? { connected: false, reason: pageError, per_course: !!summary.per_course[co], ig: { saved_id: savedIgId, linked: linkedIg || null, match: igMatch } }
        : {
            connected: true,
            page: { id: pageData.id, name: pageData.name, fan_count: pageData.fan_count },
            per_course: !!summary.per_course[co],
            ig: { saved_id: savedIgId, linked: linkedIg || null, match: igMatch },
          };
    }
    res.json({ ok: true, courses: result, has_long_lived_user_token: summary.has_long_lived_user_token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/post', async (req, res) => {
  const { pageId, pageToken } = await getCreds();
  if (!pageId || !pageToken) return res.status(400).json({ error: 'FB credentials missing' });

  const { hook = '', caption = '', image_url, image_base64, hashtags = [], scheduled_at } = req.body || {};
  const message = [hook, caption, hashtags.length ? '\n' + hashtags.join(' ') : ''].filter(Boolean).join('\n\n');

  try {
    const params = new URLSearchParams();
    params.set('access_token', pageToken);

    let endpoint;
    if (image_url) {
      endpoint = `${FB_API}/${pageId}/photos`;
      params.set('url', image_url);
      params.set('caption', message);
    } else if (image_base64) {
      const rawBuf = Buffer.from(image_base64, 'base64');
      // 🖼️ Resize → 1:1 (1080×1080) สำหรับ Facebook
      const buf = await resizeForPlatform(rawBuf, 'facebook').catch(() => rawBuf);
      const form = new FormData();
      form.append('source', new Blob([buf], { type: 'image/png' }), 'image.png');
      form.append('caption', message);
      form.append('access_token', pageToken);
      if (scheduled_at) {
        const ts = Math.floor(new Date(scheduled_at).getTime() / 1000);
        form.append('published', 'false');
        form.append('scheduled_publish_time', String(ts));
      }
      const r = await fetch(`${FB_API}/${pageId}/photos`, { method: 'POST', body: form });
      const data = await r.json();
      if (!r.ok) return res.status(500).json({ error: data?.error?.message || 'FB API error', detail: data });
      return res.json({ ok: true, ...data });
    } else {
      endpoint = `${FB_API}/${pageId}/feed`;
      params.set('message', message);
    }

    if (scheduled_at) {
      const ts = Math.floor(new Date(scheduled_at).getTime() / 1000);
      params.set('published', 'false');
      params.set('scheduled_publish_time', String(ts));
    }

    const r = await fetch(endpoint, { method: 'POST', body: params });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data?.error?.message || 'FB API error', detail: data });
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook/save-credentials — เก็บ Page Token + IG ID ลง DB (ไม่ต้อง redeploy)
// body.course เป็น scope key — รับได้ทั้งหลักสูตรเก่า (PFB/PHE/GURU) และ brand id ใหม่
// (kuru, happyprice, etc.) ที่ frontend OAuth flow ส่งมาหลังจาก connect FB Page เสร็จ
router.post('/save-credentials', async (req, res) => {
  const { course, page_id, page_token, long_lived_user_token, ig_business_id } = req.body || {};
  if (!page_token && !ig_business_id && !long_lived_user_token) {
    return res.status(400).json({ error: 'ต้องระบุอย่างน้อย 1 ตัว: page_token / ig_business_id / long_lived_user_token' });
  }
  // Validate scope key — allow alphanumeric/dash/underscore (covers brand ids + legacy courses).
  // Migration 016 dropped the contents.course CHECK constraint so brand ids work as scope keys.
  if (course && !/^[A-Za-z0-9_-]{1,32}$/.test(String(course))) {
    return res.status(400).json({ error: 'course/brand id ต้องเป็นตัวอักษร/ตัวเลข/dash/underscore (1-32 ตัว)' });
  }
  try {
    // Pre-flight: ถ้าให้ page_token มา → verify ว่าเป็น PAGE type จริง ๆ (กัน paste User Token ผิด)
    // ใช้ app credentials per-course (จาก db) — ตรงกับ app ที่สร้าง page token นั้น
    if (page_token) {
      const credsForDebug = course ? await db.fbCreds.get(course) : await db.fbCreds.get();
      const appId = credsForDebug.app_id;
      const appSecret = credsForDebug.app_secret;
      if (appId && appSecret) {
        const appAccessToken = `${appId}|${appSecret}`;
        const r = await fetch(`${FB_API}/debug_token?input_token=${encodeURIComponent(page_token)}&access_token=${encodeURIComponent(appAccessToken)}`);
        const d = await r.json();
        const type = d?.data?.type;
        if (type && type !== 'PAGE') {
          return res.status(400).json({
            error: `❌ Token นี้เป็น ${type} ไม่ใช่ PAGE — จะหมดอายุเร็ว ใช้ Exchange แล้ว copy "FB_PAGE_TOKEN" ใต้ชื่อ Page เท่านั้น (ไม่ใช่ long_lived_user_token)`
          });
        }
      }
    }
    await db.fbCreds.save({ course, page_id, page_token, long_lived_user_token, ig_business_id });
    res.json({
      ok: true,
      course: course || 'default',
      saved_at: new Date().toISOString(),
      note: course
        ? `ใช้ได้ทันทีสำหรับ course ${course} — ไม่ต้อง redeploy`
        : 'ใช้ได้ทันที (default) — ไม่ต้อง redeploy'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/facebook/credentials?course=<brand-id>
// Clear FB/IG creds for one scope. Called by the frontend "ยกเลิก" button after
// the user disconnects a brand's Facebook Page — without this the backend
// would keep the stale page_token in db.settings and try to post with it.
router.delete('/credentials', async (req, res) => {
  const course = req.query.course || null;
  if (course && !/^[A-Za-z0-9_-]{1,32}$/.test(String(course))) {
    return res.status(400).json({ error: 'course/brand id ต้องเป็นตัวอักษร/ตัวเลข/dash/underscore' });
  }
  try {
    const c = (course || '').toLowerCase();
    const suffix = c ? `_${c}` : '';
    // Overwrite with empty strings — db.settings.set ignores empty values for new
    // keys, so write an explicit null/'' to clear.  Iterate the same key list
    // that db.fbCreds.save writes to keep the two in lock-step.
    const patch = {};
    ['fb_page_id', 'fb_page_token', 'ig_business_id', 'fb_long_lived_user_token'].forEach((k) => {
      patch[k + suffix] = '';
    });
    patch[`fb_creds_cleared_at${suffix}`] = new Date().toISOString();
    await db.settings.set(patch);
    res.json({ ok: true, course: course || 'default', cleared_at: patch[`fb_creds_cleared_at${suffix}`] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/facebook/token-status — ดูสถานะ Page Token ปัจจุบัน + source (DB หรือ env)
// ?course=PFB|PHE|GURU — ดู status ของหลักสูตรเฉพาะ; เว้นว่าง = default
router.get('/token-status', async (req, res) => {
  try {
    const course = req.query.course || null;
    const c = await db.fbCreds.get(course);
    if (!c.page_token) return res.json({ ok: false, reason: 'no token set', course });

    // ใช้ app credentials per-course (จาก db.fbCreds.get) — รองรับ 3 เพจอยู่คนละ FB App
    // เพราะ debug_token ต้องการ app token ของ "App ที่สร้าง page token นั้น" — env ตัวเดียวจะเข้าได้แค่ app เดียว
    const appId = c.app_id;
    const appSecret = c.app_secret;
    let type = null, expires_at = null, is_valid = null, debug_error = null;
    if (appId && appSecret) {
      const appAccessToken = `${appId}|${appSecret}`;
      const r = await fetch(`${FB_API}/debug_token?input_token=${encodeURIComponent(c.page_token)}&access_token=${encodeURIComponent(appAccessToken)}`);
      const d = await r.json();
      if (d?.error) {
        debug_error = `${d.error.code || '?'}: ${d.error.message?.slice(0, 100) || 'unknown'}`;
      } else {
        type = d?.data?.type;
        expires_at = d?.data?.expires_at;
        is_valid = d?.data?.is_valid;
      }
    } else {
      debug_error = 'no app credentials — Exchange ใหม่เพื่อ save app_id/app_secret per course';
    }
    const allSettings = await db.settings.getAll();
    const source = allSettings.fb_page_token ? 'db' : (process.env.FB_PAGE_TOKEN ? 'env' : 'none');

    res.json({
      ok: true,
      course,
      type, // "PAGE" = ✅, "USER" = ❌
      is_valid,
      expires_at,
      expires_at_iso: expires_at ? new Date(expires_at * 1000).toISOString() : null,
      never_expires: type === 'PAGE' && (!expires_at || expires_at === 0),
      debug_error,
      source,
      per_course: c.per_course,
      saved_at: c.saved_at,
      page_id: c.page_id,
      ig_business_id: c.ig_business_id,
      has_long_lived_user_token: !!c.long_lived_user_token,
      has_app_credentials: !!(c.app_id && c.app_secret),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook/refresh-page-token — re-derive Page Token จาก long-lived user token ที่เก็บไว้
// body.course = PFB|PHE|GURU (เลือก course ที่จะ refresh — เว้นว่าง = default)
router.post('/refresh-page-token', async (req, res) => {
  try {
    const course = req.body?.course || null;
    const c = await db.fbCreds.get(course);
    if (!c.long_lived_user_token) return res.status(400).json({ error: 'No long_lived_user_token saved — ทำ Exchange + Save ครั้งแรกก่อน' });
    if (!c.page_id) return res.status(400).json({ error: `No page_id สำหรับ ${course || 'default'} — กด Save & Activate Page ของหลักสูตรนั้นก่อน` });

    const params = new URLSearchParams({
      fields: 'id,name,access_token,fan_count',
      access_token: c.long_lived_user_token,
    });
    const r = await fetch(`${FB_API}/${c.page_id}?${params.toString()}`);
    const d = await r.json();
    if (!r.ok || d.error) return res.status(400).json({ error: `FB refresh failed: ${d.error?.message || r.status}` });
    if (!d.access_token) return res.status(400).json({ error: 'FB ไม่คืน access_token — long_lived_user_token อาจหมดอายุแล้ว ต้อง Exchange ใหม่' });

    await db.fbCreds.save({ course, page_id: d.id, page_token: d.access_token });
    res.json({ ok: true, course: course || 'default', page_id: d.id, page_name: d.name, fresh_token_preview: `${d.access_token.slice(0, 20)}...` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/facebook/my-pages — ใช้ FB_PAGE_TOKEN ใน .env หา list pages + page access tokens
router.get('/my-pages', async (req, res) => {
  const c = await db.fbCreds.get();
  const token = c.long_lived_user_token || c.page_token || process.env.FB_PAGE_TOKEN;
  if (!token) return res.status(400).json({ error: 'FB_PAGE_TOKEN missing' });
  try {
    const r = await fetch(`${FB_API}/me/accounts?fields=id,name,access_token,category,fan_count&access_token=${token}`);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json({
      ok: true,
      pages: data.data || [],
      hint: 'copy access_token ของ Page ที่ต้องใช้ → paste ใน .env แทน FB_PAGE_TOKEN ปัจจุบัน → restart',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook/post-carousel — โพสต์หลายรูปเป็น carousel
// รับ content_ids (preferred, payload เล็ก) หรือ images (legacy, มี Vercel 4.5MB limit)
router.post('/post-carousel', async (req, res) => {
  const { course, caption = '', images = [], content_ids = [], scheduled_at } = req.body || {};
  const { pageId, pageToken } = await getCreds(course);
  if (!pageId || !pageToken) return res.status(400).json({ error: `FB credentials missing for ${course || 'default'}` });

  const useIds = Array.isArray(content_ids) && content_ids.length > 0;
  const useImages = Array.isArray(images) && images.length > 0;
  if (!useIds && !useImages) return res.status(400).json({ error: 'content_ids หรือ images array required' });

  try {
    // ถ้า useIds → resolve image_base64 จาก DB (targeted query, ไม่ใช่ list)
    let imgList = images;
    if (useIds) {
      const rows = await db.contents.getByIds(content_ids);
      if (rows.length !== content_ids.length) return res.status(400).json({ error: 'บาง content_id ไม่พบ' });
      imgList = rows.map(c => {
        if (!c.image_base64 && !c.media_url) throw new Error(`content_id ${c.id} ไม่มี image`);
        return { image_base64: c.image_base64, image_url: c.media_url };
      });
    }

    // Step 1: upload แต่ละรูปเป็น unpublished photo → ได้ photo_id (+ resize 1:1)
    const photoIds = [];
    for (const img of imgList) {
      let photoId;
      if (img.image_base64) {
        const rawBuf = Buffer.from(img.image_base64, 'base64');
        const buf = await resizeForPlatform(rawBuf, 'facebook').catch(() => rawBuf);
        const form = new FormData();
        form.append('source', new Blob([buf], { type: 'image/png' }), 'photo.png');
        form.append('published', 'false');
        form.append('access_token', pageToken);
        const r = await fetch(`${FB_API}/${pageId}/photos`, { method: 'POST', body: form });
        const d = await r.json();
        if (!r.ok) return res.status(500).json({ error: 'photo upload failed', detail: d, step: 'base64' });
        photoId = d.id;
      } else if (img.image_url) {
        const form = new URLSearchParams();
        form.set('url', img.image_url);
        form.set('published', 'false');
        form.set('access_token', pageToken);
        const r = await fetch(`${FB_API}/${pageId}/photos`, { method: 'POST', body: form });
        const d = await r.json();
        if (!r.ok) return res.status(500).json({ error: 'photo upload failed', detail: d, step: 'url' });
        photoId = d.id;
      } else continue;
      if (photoId) photoIds.push(photoId);
    }

    if (photoIds.length === 0) return res.status(500).json({ error: 'no photos uploaded' });

    // Step 2: create feed post ที่ attach photos ทั้งหมด
    const params = new URLSearchParams();
    params.set('message', caption);
    params.set('access_token', pageToken);
    photoIds.forEach((id, i) => params.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));

    if (scheduled_at && new Date(scheduled_at) > new Date()) {
      const ts = Math.floor(new Date(scheduled_at).getTime() / 1000);
      params.set('published', 'false');
      params.set('scheduled_publish_time', String(ts));
    }

    const r2 = await fetch(`${FB_API}/${pageId}/feed`, { method: 'POST', body: params });
    const d2 = await r2.json();
    if (!r2.ok) return res.status(500).json({ error: d2?.error?.message || 'feed post failed', detail: d2 });

    res.json({
      ok: true,
      id: d2.id,
      photos_uploaded: photoIds.length,
      photo_ids: photoIds,
      permalink_url: d2.id ? `https://www.facebook.com/${d2.id}` : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /facebook/exchange-token
// body: { user_token, course?, app_id?, app_secret? }
// - app_id/secret ใน body จะ override env (รองรับ 3 เพจอยู่คนละ FB App)
// - ถ้าระบุ course → long_lived_user_token + app credentials จะถูกเก็บ per-course
//   (ทำให้ refresh-page-token ครั้งถัดไปใช้ user token ของ course นั้นได้ถูก)
router.post('/exchange-token', async (req, res) => {
  let { user_token, course, app_id, app_secret } = req.body || {};

  // ลบ whitespace ทั้งหมด (รวม \n \r \t ที่อาจติดมาจาก paste) — FB tokens ไม่มี whitespace
  user_token = (user_token || '').replace(/\s+/g, '');
  app_id = (app_id || '').toString().trim();
  app_secret = (app_secret || '').toString().trim();

  if (course && !['PFB', 'PHE', 'GURU'].includes(course)) {
    return res.status(400).json({ error: 'course ต้องเป็น PFB / PHE / GURU' });
  }

  // ลำดับ: body > per-course DB > default DB > env
  const dbCreds = course ? await db.fbCreds.get(course) : null;
  const appId = app_id || dbCreds?.app_id || process.env.FB_APP_ID;
  const appSecret = app_secret || dbCreds?.app_secret || process.env.FB_APP_SECRET;

  const missing = [];
  if (!user_token) missing.push('user_token (paste User Token)');
  if (!appId) missing.push('app_id (paste ลงฟอร์ม หรือตั้ง FB_APP_ID ใน env)');
  if (!appSecret) missing.push('app_secret (paste ลงฟอร์ม หรือตั้ง FB_APP_SECRET ใน env)');
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });

  // App ID ต้องเป็นตัวเลขเท่านั้น — กัน browser autofill เอา email/username มาใส่
  if (!/^\d+$/.test(String(appId))) {
    return res.status(400).json({ error: `app_id "${String(appId).slice(0, 40)}" ไม่ใช่ตัวเลข — App ID ต้องเป็นตัวเลข 15-16 หลัก (browser อาจ autofill email ผิดช่อง — เคลียร์แล้ว paste ใหม่จาก developers.facebook.com/apps → App → Settings → Basic)` });
  }

  // FB token ขึ้นด้วย "EA" + ตัวอักษร (prefix เข้ารหัสจาก App ID) — ตรวจคร่าวๆ ก่อนยิง API
  if (!/^EA[A-Z0-9]/i.test(user_token)) {
    return res.status(400).json({ error: `Token ไม่ใช่รูปแบบ FB Access Token — ขึ้นต้นว่า "${user_token.slice(0, 12)}..." len=${user_token.length} → ลอง copy ใหม่จาก Graph Explorer` });
  }

  try {
    // 1. Exchange short-lived User Token → long-lived (~60 days)
    //    ใช้ URLSearchParams เพื่อ URL-encode ทุก param ถูกต้อง (กัน special char ใน token)
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: user_token,
    });
    const r = await fetch(`${FB_API}/oauth/access_token?${params.toString()}`);
    const data = await r.json();
    if (!r.ok || data.error) {
      const fbErr = data.error || {};
      const msg = fbErr.message || 'unknown FB error';
      const code = fbErr.code || r.status;
      let hint = '';
      if (/Malformed access token/i.test(msg)) hint = ` → token format ผิด (ขึ้นต้น "${user_token.slice(0, 12)}..." len=${user_token.length}) — ลอง copy ใหม่จาก Graph Explorer ทั้งสตริง อย่าตัด หรือเช็คว่า App ID ที่ใส่ตรงกับ App ที่ generate token`;
      else if (/Session has expired/i.test(msg)) hint = ' → token หมดอายุแล้ว — Generate ใหม่จาก Graph Explorer';
      else if (/Invalid app|Application/i.test(msg)) hint = ' → app_id/app_secret ไม่ตรงกับ App ที่ generate token (เช็คว่าใช้ App เดียวกันใน Graph Explorer)';
      else if (code === 100) hint = ' → User Token ไม่ถูกต้อง (อาจ paste ไม่ครบ หรือ paste Page Token แทน User Token)';
      return res.status(400).json({ error: `FB ${code}: ${msg}${hint}` });
    }

    // 2. ใช้ long-lived User Token → list pages (Page Tokens จากนี่จะ never-expire)
    const pageParams = new URLSearchParams({
      fields: 'id,name,access_token,category,fan_count',
      access_token: data.access_token,
    });
    const pagesRes = await fetch(`${FB_API}/me/accounts?${pageParams.toString()}`);
    const pagesJson = await pagesRes.json();
    if (!pagesRes.ok || pagesJson.error) {
      return res.status(400).json({ error: `FB /me/accounts: ${pagesJson.error?.message || 'failed'} — token อาจไม่มี pages_show_list permission` });
    }

    let pages = pagesJson.data || [];

    // 3. Fallback: granular scopes ทำให้ /me/accounts ว่าง — query Page ตรง ๆ ด้วย FB_PAGE_ID ใน env
    if (pages.length === 0 && process.env.FB_PAGE_ID) {
      const directParams = new URLSearchParams({
        fields: 'id,name,access_token,category,fan_count',
        access_token: data.access_token,
      });
      const directRes = await fetch(`${FB_API}/${process.env.FB_PAGE_ID}?${directParams.toString()}`);
      const directJson = await directRes.json();
      if (directRes.ok && directJson.id && directJson.access_token) {
        pages = [directJson];
      } else if (directJson.error) {
        return res.status(400).json({ error: `FB direct page query: ${directJson.error.message} — granular scope อาจ block FB_PAGE_ID=${process.env.FB_PAGE_ID}` });
      }
    }

    if (pages.length === 0) {
      return res.status(400).json({ error: 'ไม่พบ Page — granular scopes ของ token อาจไม่ให้ access; ลอง regenerate token ใน Graph Explorer และในหน้า popup ติ๊ก Page ที่ต้องการ' });
    }

    // เก็บ long_lived_user_token + app credentials ลง DB ทันที (per-course ถ้าระบุ)
    // → refresh-page-token ใช้ได้ในอนาคต โดยไม่ต้อง Exchange ใหม่ + ระบบจำได้ว่า course นี้อยู่ใน app ไหน
    try {
      await db.fbCreds.save({
        course: course || null,
        long_lived_user_token: data.access_token,
        // เก็บ app credentials เฉพาะตอนผู้ใช้ paste เอง (ไม่ได้ override ด้วย env)
        app_id: app_id || undefined,
        app_secret: app_secret || undefined,
      });
    } catch (e) { console.warn('[exchange-token] save creds failed:', e.message); }

    res.json({
      ok: true,
      course: course || null,
      long_lived_user_token: data.access_token,
      pages,
      note: course
        ? `เก็บ user token + app credentials ของ course ${course} ลง DB แล้ว — refresh ครั้งถัดไปใช้ user token นี้อัตโนมัติ`
        : 'Page tokens จาก long-lived user token = never-expiring · long_lived_user_token เก็บใน DB (default) → 60 วันถัด refresh ได้ผ่านปุ่ม',
    });
  } catch (e) {
    res.status(500).json({ error: `network/server: ${e.message}` });
  }
});

export default router;
