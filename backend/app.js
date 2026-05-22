import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import automationRoutes from './routes/automation.js';
import aiRoutes from './routes/ai.js';
import facebookRoutes from './routes/facebook.js';
import instagramRoutes from './routes/instagram.js';
import tiktokRoutes from './routes/tiktok.js';
import analyticsRoutes from './routes/analytics.js';
import workspaceRoutes from './routes/workspace.js';
import publicRoutes from './routes/public.js';
import khuruthephRoutes from './routes/khurutheph.js';

dotenv.config();

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json({ limit: '10mb' }));

  app.set('trust proxy', 1);
  const apiLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true });
  app.use('/api', apiLimiter);

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'oem-content-factory', time: new Date().toISOString(), runtime: process.env.VERCEL ? 'vercel' : 'node' });
  });

  // Vercel Cron endpoint — รัน scheduled posts (no auth — protected by CRON_SECRET)
  app.all('/api/cron/run-scheduled', async (req, res) => {
    const expected = process.env.CRON_SECRET;
    const authz = req.headers['authorization'] || '';
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    if (expected && authz !== `Bearer ${expected}` && !isVercelCron) {
      return res.status(401).json({ error: 'unauthorized — set CRON_SECRET in env or call from Vercel Cron' });
    }
    try {
      const { runDueAutomations } = await import('./routes/automation.js');
      const { db } = await import('./db.js');
      const due = await db.contents.due();
      await runDueAutomations();
      res.json({ ok: true, processed: due.length, time: new Date().toISOString() });
    } catch (e) {
      console.error('[cron]', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Public routes (no auth) — mount BEFORE auth-protected routes
  app.use('/api/public', publicRoutes);

  app.use('/api/auth', authRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/automation', automationRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/facebook', facebookRoutes);
  app.use('/api/instagram', instagramRoutes);
  app.use('/api/tiktok', tiktokRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/khurutheph', khuruthephRoutes);

  app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(err.status || 500).json({ error: err.message || 'internal error' });
  });

  return app;
}

export const app = createApp();
export default app;
