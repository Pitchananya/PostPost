import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, supabase, runWithTenant, DEFAULT_TENANT_ID } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-use-long-random-string';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@oemcontent.co';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

function signToken({ sub, email, role, tenant_id }) {
  return jwt.sign({ sub, email, role, tenant_id }, JWT_SECRET, { expiresIn: '7d' });
}

function slugify(s) {
  const base = String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'workspace';
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// ✨ POST /api/auth/signup — สมัครใช้งานใหม่ → สร้าง tenant + user คนแรก (role owner)
router.post('/signup', async (req, res) => {
  const { email, password, workspace_name, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'ต้องระบุอีเมลและรหัสผ่าน' });
  if (String(password).length < 8) return res.status(400).json({ error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'อีเมลไม่ถูกต้อง' });
  if (!supabase) return res.status(503).json({ error: 'ต้องเชื่อมต่อ Supabase ก่อนจึงจะสมัครได้ (DEMO mode สมัครไม่ได้)' });

  const emailLc = String(email).toLowerCase();
  if (emailLc === ADMIN_EMAIL.toLowerCase()) {
    return res.status(409).json({ error: 'อีเมลนี้สงวนไว้ — ใช้เข้าสู่ระบบแทน' });
  }

  try {
    const existing = await db.users.findByEmail(emailLc);
    if (existing) return res.status(409).json({ error: 'อีเมลนี้ถูกใช้แล้ว — เข้าสู่ระบบแทน' });

    const wsName = (workspace_name && String(workspace_name).trim()) || `${emailLc.split('@')[0]}'s workspace`;
    const tenant = await db.tenants.create({ name: wsName, slug: slugify(wsName), plan: 'free' });

    const password_hash = bcrypt.hashSync(String(password), 10);
    const user = await db.users.create({
      tenant_id: tenant.id, email: emailLc, password_hash, name: name || null, role: 'owner',
    });

    const token = signToken({ sub: user.id, email: emailLc, role: 'owner', tenant_id: tenant.id });
    res.json({
      token,
      user: { id: user.id, email: emailLc, role: 'owner', name: user.name },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    });
  } catch (e) {
    console.error('[signup]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login — users table ก่อน, fallback legacy env admin → tenant 1
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email/password required' });
  const emailLc = String(email).toLowerCase();

  // 1) users table (multi-tenant)
  if (supabase) {
    try {
      const user = await db.users.findByEmail(emailLc);
      if (user && bcrypt.compareSync(String(password), user.password_hash)) {
        const token = signToken({ sub: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id });
        return res.json({
          token,
          user: { id: user.id, email: user.email, role: user.role, name: user.name },
          tenant_id: user.tenant_id,
        });
      }
    } catch (e) { console.error('[login users]', e.message); }
  }

  // 2) legacy env admin → tenant 1 (เจ้าของเดิม)
  if (emailLc === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    const token = signToken({ sub: 'env-admin', email: ADMIN_EMAIL, role: 'admin', tenant_id: DEFAULT_TENANT_ID });
    return res.json({ token, user: { email: ADMIN_EMAIL, role: 'admin' }, tenant_id: DEFAULT_TENANT_ID });
  }

  // 3) legacy admin_users table → tenant 1
  if (supabase) {
    const { data } = await supabase.from('admin_users').select('*').eq('email', emailLc).maybeSingle();
    if (data && bcrypt.compareSync(String(password), data.password_hash)) {
      const token = signToken({ sub: `admin-${data.id}`, email: emailLc, role: data.role || 'admin', tenant_id: DEFAULT_TENANT_ID });
      return res.json({ token, user: { email: emailLc, role: data.role }, tenant_id: DEFAULT_TENANT_ID });
    }
  }

  return res.status(401).json({ error: 'invalid credentials' });
});

// ============================================================
// Google Sign-In (OAuth 2.0) — public routes, popup flow
// Frontend opens /api/auth/google/start in a popup → user consents on
// Google → Google redirects to /api/auth/google/callback → we exchange
// the code for the user's email/name → find-or-create the user + tenant
// → issue our own JWT → a tiny HTML page postMessage's the token back to
// the opener, which stores it and lands in the app.
// ============================================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

function googleRedirectUri(req) {
  const base = process.env.PUBLIC_URL
    || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}`;
  return base.replace(/\/$/, '') + '/api/auth/google/callback';
}

router.get('/google/start', (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(500).send('GOOGLE_OAUTH_CLIENT_ID not configured on the server');
  const nonce = Math.random().toString(36).slice(2, 14);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state: nonce,
    access_type: 'online',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
  const { code, error: oerr, error_description } = req.query;
  if (oerr) return res.send(googlePopupHtml({ error: String(error_description || oerr) }));
  if (!code) return res.send(googlePopupHtml({ error: 'Missing authorization code' }));
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.send(googlePopupHtml({ error: 'GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET not configured on the server' }));
  }
  if (!supabase) return res.send(googlePopupHtml({ error: 'Supabase required for accounts (DEMO mode cannot create users)' }));
  try {
    // 1) code → tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: googleRedirectUri(req),
        grant_type: 'authorization_code',
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      return res.send(googlePopupHtml({ error: `Google token exchange: ${tokenData.error_description || tokenData.error || tokenRes.status}` }));
    }

    // 2) access_token → profile (email + name)
    const profRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const prof = await profRes.json();
    const email = String(prof.email || '').toLowerCase();
    if (!email) return res.send(googlePopupHtml({ error: 'Google did not return an email address' }));
    if (prof.email_verified === false) return res.send(googlePopupHtml({ error: 'Google email is not verified' }));
    const name = prof.name || prof.given_name || email.split('@')[0];

    // 3) find-or-create user + tenant
    let user = await db.users.findByEmail(email);
    let tenant_id;
    if (user) {
      tenant_id = user.tenant_id;
    } else {
      const wsName = `${email.split('@')[0]}'s workspace`;
      const tenant = await db.tenants.create({ name: wsName, slug: slugify(wsName), plan: 'free' });
      // Google-only account: no real password. Store a random hash so the
      // column is never null and the email/password login can't be guessed.
      const randomHash = bcrypt.hashSync('google-oauth:' + Math.random().toString(36).slice(2) + Date.now(), 10);
      user = await db.users.create({ tenant_id: tenant.id, email, password_hash: randomHash, name, role: 'owner' });
      tenant_id = tenant.id;
    }

    const token = signToken({ sub: user.id, email, role: user.role || 'owner', tenant_id });
    res.send(googlePopupHtml({
      token,
      user: { id: user.id, email, role: user.role || 'owner', name: user.name || name },
      tenant_id,
    }));
  } catch (e) {
    console.error('[google-oauth]', e.message);
    res.send(googlePopupHtml({ error: e.message }));
  }
});

function googlePopupHtml(payload) {
  const ok = !payload.error;
  const safe = JSON.stringify(payload).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/>
<title>${ok ? 'เข้าสู่ระบบสำเร็จ' : 'เข้าสู่ระบบไม่สำเร็จ'}</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Prompt,sans-serif;padding:40px;text-align:center;background:${ok ? '#FFF8F0' : '#FEF2F2'};color:${ok ? '#1E1B3A' : '#7F1D1D'}}
h1{font-size:20px;margin:8px 0 4px}.ico{font-size:56px}.msg{background:#fff;border:1px solid ${ok ? '#FFEDD5' : '#FCA5A5'};padding:12px 16px;border-radius:10px;margin:18px auto;max-width:480px;font-size:12.5px;word-break:break-word;text-align:left;${ok ? 'display:none' : ''}}</style>
</head><body>
<div class="ico">${ok ? '✅' : '⚠️'}</div>
<h1>${ok ? 'เข้าสู่ระบบด้วย Google สำเร็จ' : 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ'}</h1>
<p style="color:#7C7393;font-size:13px">${ok ? 'กำลังพาเข้าระบบ… หน้าต่างนี้จะปิดอัตโนมัติ' : 'ปิดหน้าต่างนี้แล้วลองใหม่'}</p>
<div class="msg">${ok ? '' : String(payload.error).replace(/</g, '&lt;')}</div>
<script>
  var payload = ${safe};
  try {
    if (window.opener) {
      window.opener.postMessage({ type: '${ok ? 'pp-google-auth' : 'pp-google-auth-error'}', payload: payload, message: payload.error || '' }, location.origin);
    }
  } catch (e) {}
  setTimeout(function(){ try { window.close(); } catch(_){} }, ${ok ? 600 : 2500});
</script>
</body></html>`;
}

// 🏢 requireAuth — verify JWT แล้ว "ห่อ" downstream ทั้งหมดด้วย tenant context
// → db.* รู้ tenant ปัจจุบันโดยอัตโนมัติ (ไม่ต้องส่ง tenant_id ทุก call site)
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'no token' });

  // cron internal call: scheduled-posts worker เรียก /post-carousel จาก deployment เดียวกัน
  // tenant_id ส่งมาใน body (cron รู้ tenant ของ content row ที่กำลังโพสต์)
  if (
    req.headers['x-cron-internal'] === '1' &&
    process.env.CRON_SECRET &&
    token === process.env.CRON_SECRET
  ) {
    const tid = Number(req.body?.tenant_id) || DEFAULT_TENANT_ID;
    req.user = { email: 'cron@internal', role: 'admin', sub: 'cron', tenant_id: tid };
    return runWithTenant(tid, () => next());
  }

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    if (token === 'demo-token') {
      req.user = { email: ADMIN_EMAIL, role: 'admin', tenant_id: DEFAULT_TENANT_ID };
      return runWithTenant(DEFAULT_TENANT_ID, () => next());
    }
    return res.status(401).json({ error: 'invalid token' });
  }
  req.user = user;
  // token เก่า (ก่อน multi-tenant) ไม่มี tenant_id → fallback tenant 1 (เจ้าของเดิม)
  const tid = Number(user.tenant_id) || DEFAULT_TENANT_ID;
  return runWithTenant(tid, () => next());
}

router.get('/me', requireAuth, async (req, res) => {
  let tenant = null;
  try { tenant = await db.tenants.getById(req.user.tenant_id || DEFAULT_TENANT_ID); } catch {}
  res.json({ user: req.user, tenant });
});

export default router;
