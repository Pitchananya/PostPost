// backend/routes/events.js
//
// UI telemetry ingest + summary. Two endpoints:
//
//   POST /api/events              — batched ingest (1..100 events per call)
//     body: { events: [{ name, props?, page?, session_id? }, ...] }
//          OR a single event shape (no `events:` wrapper)
//     auth: required — tenant_id + user_id are pulled from the JWT, not
//           the body, so clients can't spoof attribution
//     returns: { ok: true, inserted: N }
//
//   GET  /api/events/summary?days=7
//     returns: { days, total, by_name: {...}, by_day: {...}, by_page: {...},
//                recent: [last 50 raw events] }
//
// Schema in backend/scripts/migration-017-events.sql.

import { Router } from 'express';
import { supabase } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

const MAX_BATCH = 100;
const MAX_NAME = 100;

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const tenantId = req.user?.tenant_id || 1;
    const userId = req.user?.id || null;
    const items = Array.isArray(body.events) ? body.events
                : (body.name ? [body] : []);
    if (!items.length) return res.json({ ok: true, inserted: 0 });

    const rows = items.slice(0, MAX_BATCH).map((e) => ({
      tenant_id: tenantId,
      user_id: userId,
      name: String(e?.name || e?.event || '').slice(0, MAX_NAME).trim(),
      props: (e?.props && typeof e.props === 'object') ? e.props : {},
      page: e?.page ? String(e.page).slice(0, 60) : null,
      session_id: e?.session_id ? String(e.session_id).slice(0, 60) : null,
    })).filter((r) => r.name);

    if (!rows.length) return res.status(400).json({ error: 'no valid events' });

    const { error } = await supabase.from('events').insert(rows);
    if (error) {
      console.error('[events] insert failed:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json({ ok: true, inserted: rows.length });
  } catch (e) {
    console.error('[events] handler error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const days = Math.max(1, Math.min(90, parseInt(req.query.days, 10) || 7));
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const tenantId = req.user?.tenant_id || 1;

    const { data, error } = await supabase
      .from('events')
      .select('name, page, props, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('[events/summary] query failed:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const events = data || [];
    const byName = {};
    const byDay = {};
    const byPage = {};

    for (const ev of events) {
      byName[ev.name] = (byName[ev.name] || 0) + 1;
      const day = (ev.created_at || '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
      if (ev.page) byPage[ev.page] = (byPage[ev.page] || 0) + 1;
    }

    res.json({
      days,
      total: events.length,
      by_name: byName,
      by_day: byDay,
      by_page: byPage,
      recent: events.slice(0, 50),
    });
  } catch (e) {
    console.error('[events/summary] handler error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
