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

router.post('/scrape', requireAuth, async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });

  // ── Cloud mode ── if a hosted scraper is configured, proxy to it.
  // Set SHOPEE_SCRAPER_URL (and optional SHOPEE_SCRAPER_KEY) in env.
  const cloudUrl = process.env.SHOPEE_SCRAPER_URL;
  if (cloudUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.SHOPEE_SCRAPER_KEY) headers['Authorization'] = 'Bearer ' + process.env.SHOPEE_SCRAPER_KEY;
      const r = await fetch(cloudUrl, { method: 'POST', headers, body: JSON.stringify({ url }) });
      const j = await r.json().catch(() => ({}));
      return res.status(r.ok ? 200 : 502).json(j && (j.products || j.error) ? j
        : { error: 'cloud', message: 'cloud scraper returned an unexpected response' });
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

export default router;
