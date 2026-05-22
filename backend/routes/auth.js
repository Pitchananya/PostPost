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
