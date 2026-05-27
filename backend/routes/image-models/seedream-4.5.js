// backend/routes/image-models/seedream-4.5.js
//
// Dedicated handler for: bytedance-seed/seedream-4.5
// Mounted at:            POST /api/ai/gen-image/seedream-4.5
//
// Model: ByteDance Seedream 4.5 — strong at portraits, text rendering,
// and multi-image composition. ~$0.04/image. Often the best
// price/quality tradeoff for product + person shots.
//
// Quirks:
// - ByteDance namespace uses `bytedance-seed/` (NOT `bytedance/`) on
//   OpenRouter. Easy typo if you're copy-pasting from elsewhere.
// - No reasoning step — diffusion-style. ~4-8s typical.
// - Comma-separated prompt style works best.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'bytedance-seed/seedream-4.5';
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 40_000;

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  const t0 = Date.now();
  const fullPrompt = `${String(prompt)}, ${aspectHintFromEnv()} aspect, sharp focus, detailed`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout 40s'), TIMEOUT_MS);
  try {
    let r;
    try {
      r = await fetch(OPENROUTER_CHAT_URL, {
        method: 'POST',
        signal: ctrl.signal,
        headers: openRouterHeaders(),
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: fullPrompt }],
          modalities: ['image', 'text'],
          max_tokens: MAX_TOKENS,
        }),
      });
    } finally { clearTimeout(timer); }
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`${r.status}: ${err.slice(0, 240)}`);
    }
    const data = await r.json();
    const found = extractImageFromOpenRouterResponse(data);
    if (!found?.url) {
      throw new Error(found?.error === 'model_refused' ? `refused: ${found.refusal}` : 'no image in response');
    }
    const out = parseImageUrlToReturn(found.url);
    console.log(`[ai/gen-image/seedream-4.5] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/seedream-4.5] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
