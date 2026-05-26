import { Router } from 'express';
import { db, supabase } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

const FB_API = 'https://graph.facebook.com/v21.0';

// ================= SUMMARY =================
// GET /api/analytics/summary — overview ตัวเลขรวม
router.get('/summary', async (req, res) => {
  try {
    const allContents = await db.contents.list();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now.getTime() - 7 * 86400_000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const byStatus = (s) => allContents.filter(c => c.status === s).length;
    const publishedSince = (since) => allContents.filter(c => c.status === 'published' && c.published_at && new Date(c.published_at) >= since).length;

    // platform breakdown
    const byPlatform = {};
    allContents.filter(c => c.status === 'published').forEach(c => {
      (c.platforms || ['facebook']).forEach(p => byPlatform[p] = (byPlatform[p] || 0) + 1);
    });

    // course breakdown
    const byCourse = {};
    allContents.forEach(c => byCourse[c.course] = (byCourse[c.course] || 0) + 1);

    // recent failures
    const recentFailures = allContents
      .filter(c => c.status === 'failed')
      .sort((a, b) => new Date(b.last_attempt_at || b.created_at) - new Date(a.last_attempt_at || a.created_at))
      .slice(0, 5)
      .map(c => ({ id: c.id, hook: c.hook?.slice(0, 60), error: c.last_error?.slice(0, 100), at: c.last_attempt_at }));

    res.json({
      contents: {
        total: allContents.length,
        draft: byStatus('draft'),
        scheduled: byStatus('scheduled'),
        published: byStatus('published'),
        failed: byStatus('failed'),
        publishedToday: publishedSince(todayStart),
        publishedThisWeek: publishedSince(weekStart),
        publishedThisMonth: publishedSince(monthStart),
      },
      by_platform: byPlatform,
      by_course: byCourse,
      recent_failures: recentFailures,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= POSTS WITH METRICS =================
// GET /api/analytics/posts?limit=20 — ดึง published posts + cached metrics
router.get('/posts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  try {
    const all = await db.contents.list();
    const published = all
      .filter(c => c.status === 'published')
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))
      .slice(0, limit);

    res.json({
      count: published.length,
      posts: published.map(c => ({
        id: c.id,
        course: c.course,
        hook: c.hook?.slice(0, 100),
        platforms: c.platforms,
        published_at: c.published_at,
        media_url: c.media_url,
        post_results: c.post_results || {},
        cached_metrics: c.cached_metrics || null,
        metrics_fetched_at: c.metrics_fetched_at || null,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= REFRESH METRICS =================
// POST /api/analytics/refresh-metrics — ดึง insights จาก FB/IG ของ published posts ล่าสุด
router.post('/refresh-metrics', async (req, res) => {
  const limit = Math.min(parseInt(req.body?.limit) || 10, 30);
  const pageToken = process.env.FB_PAGE_TOKEN;
  if (!pageToken) return res.status(400).json({ error: 'FB_PAGE_TOKEN missing' });

  try {
    const all = await db.contents.list();
    const targets = all
      .filter(c => c.status === 'published')
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))
      .slice(0, limit);

    const updated = [];
    for (const c of targets) {
      const fbId = c.post_results?.facebook?.id;
      const igId = c.post_results?.instagram?.id;
      const metrics = {};

      if (fbId) {
        try {
          const fields = 'post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total';
          const r = await fetch(`${FB_API}/${fbId}/insights?metric=${fields}&access_token=${pageToken}`);
          const d = await r.json();
          if (r.ok && d.data) {
            const fb = {};
            for (const m of d.data) fb[m.name] = m.values?.[0]?.value;
            metrics.facebook = fb;
          } else {
            metrics.facebook = { error: d?.error?.message || 'fetch failed' };
          }
        } catch (e) { metrics.facebook = { error: e.message }; }
      }

      if (igId) {
        try {
          const fields = 'impressions,reach,engagement,saved,likes,comments,shares';
          const r = await fetch(`${FB_API}/${igId}/insights?metric=${fields}&access_token=${pageToken}`);
          const d = await r.json();
          if (r.ok && d.data) {
            const ig = {};
            for (const m of d.data) ig[m.name] = m.values?.[0]?.value;
            metrics.instagram = ig;
          } else {
            metrics.instagram = { error: d?.error?.message || 'fetch failed' };
          }
        } catch (e) { metrics.instagram = { error: e.message }; }
      }

      // save cached metrics
      try {
        await db.contents.update(c.id, {
          cached_metrics: metrics,
          metrics_fetched_at: new Date().toISOString(),
        });
        updated.push({ id: c.id, hook: c.hook?.slice(0, 60), metrics });
      } catch (e) {
        updated.push({ id: c.id, error: e.message });
      }

      // ป้องกัน rate limit FB
      await new Promise(r => setTimeout(r, 200));
    }

    res.json({ ok: true, refreshed: updated.length, results: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= TOP POSTS =================
// GET /api/analytics/top?metric=post_impressions&limit=10
router.get('/top', async (req, res) => {
  const metric = String(req.query.metric || 'post_engaged_users');
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  try {
    const all = await db.contents.list();
    const ranked = all
      .filter(c => c.status === 'published' && c.cached_metrics?.facebook?.[metric] != null)
      .map(c => ({
        id: c.id,
        hook: c.hook?.slice(0, 100),
        course: c.course,
        platforms: c.platforms,
        published_at: c.published_at,
        media_url: c.media_url,
        score: c.cached_metrics.facebook[metric] || 0,
        metrics: c.cached_metrics,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json({ metric, count: ranked.length, top: ranked });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= COSTS =================
// GET /api/analytics/costs?days=30
// ประมาณการค่าใช้จ่าย AI gen แยกตาม category — ดึงจาก contents table แล้วจำแนกด้วย
// kind/media_url/platforms. รองรับช่วงเวลาผ่าน query string (default 30 days).
router.get('/costs', async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 86_400_000);
    const all = await db.contents.list();
    const window = all.filter((c) => new Date(c.created_at) >= since);

    // ราคาประมาณการ (USD) — ใช้ provider ที่ถูกที่สุดของแต่ละ category ตามที่ PostPost
    // เลือกใช้จริง (claude haiku สำหรับ text, fal.ai สำหรับ avatar/video, gemini
    // สำหรับ image). ปรับได้ตามที่ผู้ใช้สลับ provider จริง.
    const PRICES = {
      text_per_post:        0.001,   // claude haiku (caption + hashtags + article)
      image_per_unit:       0.04,    // gemini nano banana / replicate flux pro
      avatar_per_clip_30s:  0.20,    // fal-ai/infinitalk 30s clip (default)
      video_per_clip:       0.30,    // fal-ai/wan-v2.2-t2v (default ttv model)
    };

    // จัดประเภทแต่ละ row
    let textOnly = 0, withImage = 0, withVideo = 0, withAvatar = 0;
    for (const c of window) {
      const hasImg = !!c.media_url && !c.video_url;
      const isVideo = !!c.video_url || (c.media_url || '').match(/\.(mp4|mov|webm)/i);
      const isAvatar = !!c.kind && /avatar|talking/i.test(c.kind);
      if (isAvatar) withAvatar++;
      else if (isVideo) withVideo++;
      else if (hasImg) withImage++;
      else textOnly++;
    }

    // คำนวณค่าใช้จ่ายแต่ละ bucket
    const breakdown = {
      text:   { count: textOnly + withImage + withVideo + withAvatar, unit: PRICES.text_per_post,        cost: (textOnly + withImage + withVideo + withAvatar) * PRICES.text_per_post },
      image:  { count: withImage,                                       unit: PRICES.image_per_unit,       cost: withImage * PRICES.image_per_unit },
      video:  { count: withVideo,                                       unit: PRICES.video_per_clip,       cost: withVideo * PRICES.video_per_clip },
      avatar: { count: withAvatar,                                      unit: PRICES.avatar_per_clip_30s,  cost: withAvatar * PRICES.avatar_per_clip_30s },
    };
    const totalUsd = Object.values(breakdown).reduce((s, b) => s + b.cost, 0);

    // เทียบกับ Hedra-equivalent เพื่อให้ user เห็นเงินที่ประหยัดได้
    const HEDRA_PRICES = { text: 0.001, image: 0.07, video: 0.20, avatar: 2.10 };
    const hedraEquivalent =
      breakdown.text.count   * HEDRA_PRICES.text   +
      breakdown.image.count  * HEDRA_PRICES.image  +
      breakdown.video.count  * HEDRA_PRICES.video  +
      breakdown.avatar.count * HEDRA_PRICES.avatar;

    res.json({
      days,
      since: since.toISOString(),
      contents_in_window: window.length,
      breakdown,
      total_usd: Math.round(totalUsd * 100) / 100,
      total_thb: Math.round(totalUsd * 36),
      hedra_equivalent_usd: Math.round(hedraEquivalent * 100) / 100,
      savings_vs_hedra_usd: Math.round((hedraEquivalent - totalUsd) * 100) / 100,
      pricing_notes: PRICES,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
