// Shopee shop scraper — POST /api/shopee/scrape { url } -> { ok, count, products }
// Spawns backend/scripts/scrape_shopee.py (undetected-chromedriver, reuses the
// persistent .chrome-profile-shopee session).
import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from './auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, '..', 'scripts', 'scrape_shopee.py');
const ROOT = path.join(__dirname, '..', '..');

// Build cloud-mode helpers — used by both /scrape (sync proxy) and the new async pair.
// SHOPEE_SCRAPER_URL expected format: https://shopee-scraper-worker.onrender.com/scrape
// (the route appends/replaces the path as needed for async vs status endpoints).
function cloudBase() {
  const u = process.env.SHOPEE_SCRAPER_URL;
  if (!u) return null;
  // Strip the trailing /scrape (or /scrape-async) so we can compose paths cleanly
  return u.replace(/\/(scrape|scrape-async)\/?$/, '');
}
function cloudHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (process.env.SHOPEE_SCRAPER_KEY) h['Authorization'] = 'Bearer ' + process.env.SHOPEE_SCRAPER_KEY;
  return h;
}

router.post('/scrape', requireAuth, async (req, res) => {
  const { url, force_local } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });

  // ── Decide: cloud vs local ──
  // 1) Vercel serverless (no Python) → always cloud (if configured)
  // 2) Localhost dev → prefer local Python (fast, no Render cold-start)
  // 3) `force_local` body flag → always local (testing override)
  const isVercel = !!process.env.VERCEL;        // Vercel sets this automatically on serverless functions
  const base = cloudBase();
  const useCloud = !force_local && base && isVercel;

  if (useCloud) {
    // ── Cloud mode ── prefer the async pair (returns immediately under Vercel's 60s
    // timeout). The frontend then polls /scrape-status?job_id=X for completion.
    try {
      const r = await fetch(base + '/scrape-async', {
        method: 'POST',
        headers: cloudHeaders(),
        body: JSON.stringify({ url }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.job_id) {
        return res.status(502).json({ error: 'cloud', message: j.message || 'submit failed', detail: j });
      }
      // 202 — frontend should poll /api/shopee/scrape-status?job_id=<j.job_id>
      return res.status(202).json({ ok: true, job_id: j.job_id, status: 'pending' });
    } catch (e) {
      return res.status(502).json({ error: 'cloud', message: 'เชื่อมต่อ cloud scraper ไม่ได้: ' + e.message });
    }
  }

  // ── Local mode ── spawn the Python scraper on this machine.
  const pyCmd = process.env.PYTHON || 'python';
  let py;
  try {
    py = spawn(pyCmd, [SCRIPT, String(url)], { cwd: ROOT });
  } catch (e) {
    return res.status(500).json({ error: 'cannot start python: ' + e.message });
  }

  let out = '', err = '', done = false;
  py.stdout.on('data', (d) => { out += d; });
  py.stderr.on('data', (d) => { err += d; });

  const finish = (status, body) => {
    if (done) return; done = true;
    clearTimeout(timer);
    res.status(status).json(body);
  };
  const timer = setTimeout(() => {
    try { py.kill(); } catch {}
    finish(504, { error: 'timeout', message: 'การดึงข้อมูลใช้เวลานานเกินไป — ลองใหม่อีกครั้ง' });
  }, 170000);

  py.on('error', (e) => {
    finish(500, { error: 'python', message: 'รันสไครเปอร์ไม่ได้ — ต้องติดตั้ง Python + undetected-chromedriver', detail: e.message });
  });
  py.on('close', () => {
    const lastLine = out.trim().split(/\r?\n/).filter(Boolean).pop() || '';
    try {
      const j = JSON.parse(lastLine);
      if (j.error) return finish(502, j);
      return finish(200, j);
    } catch (e) {
      return finish(500, { error: 'scrape_failed', message: 'ดึงข้อมูลไม่สำเร็จ', detail: (err || out).slice(-600) });
    }
  });
});

// ── Poll a cloud-mode scrape job. Returns { status: 'pending' | 'done' | 'error', result? }
// Frontend calls this every few seconds until status !== 'pending'. Each call is small
// (single GET to Render) so it never approaches the 60s Vercel function timeout.
router.get('/scrape-status', requireAuth, async (req, res) => {
  const jobId = String(req.query.job_id || '');
  if (!jobId) return res.status(400).json({ error: 'job_id required' });
  const base = cloudBase();
  if (!base) return res.status(400).json({ error: 'cloud scraper not configured (SHOPEE_SCRAPER_URL missing)' });
  try {
    const r = await fetch(base + '/job/' + encodeURIComponent(jobId), { headers: cloudHeaders() });
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) return res.status(404).json({ status: 'not_found', message: j.message || 'job not found' });
    if (!r.ok) return res.status(502).json({ error: 'cloud', message: j.message || ('cloud status ' + r.status) });
    // Worker shape: { status: 'pending' | 'done' | 'error', result?: { ok, products, count, ... } }
    return res.json(j);
  } catch (e) {
    return res.status(502).json({ error: 'cloud', message: 'poll failed: ' + e.message });
  }
});

export default router;
