// backend/routes/image-models/gemini-3-pro.js
//
// Dedicated handler for: google/gemini-3-pro-image-preview
// Mounted at:            POST /api/ai/gen-image/gemini-3-pro
//
// Model: "Nano Banana Pro" — Google's top-tier image model. Supports
// 2K/4K output, multilingual text rendering (Thai included), and fine
// control over composition.
//
// Quirks:
// - Higher latency than the Flash variants (~6-12s typical) — 45s
//   timeout gives headroom without crossing Vercel's 60s ceiling.
// - Larger max_tokens budget (16k) to leave room for the bigger image
//   payload + caption. Google still bills actual usage, no pre-charge.
// - Best Google option for Thai text-on-image (matches GPT-5.4 quality)
//   while typically running faster.
// - No reasoning param — don't pass it.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'google/gemini-3-pro-image-preview';
const MAX_TOKENS = 16384;
const TIMEOUT_MS = 45_000;

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  const t0 = Date.now();
  const fullPrompt = `Create a high-quality image: ${String(prompt)}.\n\nStyle: warm, professional. Aspect: ${aspectHintFromEnv()}.`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout 45s'), TIMEOUT_MS);
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
    console.log(`[ai/gen-image/gemini-3-pro] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/gemini-3-pro] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
