import { Router } from 'express';
import { requireAuth } from './auth.js';
import { supabase, currentTenantId } from '../db.js';

const router = Router();
router.use(requireAuth);

// Expose Supabase URL + anon key + tenant_id ให้ frontend subscribe Realtime
// แบบ filter เฉพาะ row ของ tenant ตัวเอง (tenant_id=eq.N) — ไม่เห็น workspace tenant อื่น.
router.get('/realtime-config', (_req, res) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(503).json({
      error: 'Realtime not configured',
      hint: 'Set SUPABASE_ANON_KEY in Vercel env (Settings → API → anon public key)',
    });
  }
  res.json({
    url: process.env.SUPABASE_URL,
    anon_key: process.env.SUPABASE_ANON_KEY,
    table: 'team_workspace',
    tenant_id: currentTenantId(),
  });
});

// 👥 GET /api/workspace — ดึง workspace row ของ tenant ปัจจุบัน
router.get('/', async (req, res) => {
  if (!supabase) return res.json({ workspace: null });
  try {
    const { data, error } = await supabase
      .from('team_workspace')
      .select('id, tenant_id, state, version, updated_by, updated_at')
      .eq('tenant_id', currentTenantId())
      .maybeSingle();
    if (error) throw new Error(error.message);
    res.json({ workspace: data || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/workspace — แทนที่ shared state ของ tenant ปัจจุบัน (last writer wins)
router.put('/', async (req, res) => {
  const state = req.body?.state;
  if (!state || typeof state !== 'object') {
    return res.status(400).json({ error: 'state object required' });
  }
  if (!supabase) return res.status(400).json({ error: 'Supabase required' });

  const tid = currentTenantId();
  const updated_by = req.user?.email || req.user?.sub || 'unknown';
  try {
    const { data, error } = await supabase
      .from('team_workspace')
      .upsert(
        {
          id: tid,            // id = tenant_id (team_workspace.id ไม่มี default — ต้องระบุ)
          tenant_id: tid,
          state,
          updated_by,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id' }
      )
      .select('id, tenant_id, version, updated_at, updated_by')
      .single();
    if (error) throw new Error(error.message);
    res.json({ ok: true, workspace: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
