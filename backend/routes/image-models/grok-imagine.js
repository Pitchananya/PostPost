// backend/routes/image-models/grok-imagine.js
//
// Dedicated handler for: x-ai/grok-imagine-image-quality
// Mounted at:            POST /api/ai/gen-image/grok-imagine
//
// Model: xAI's Grok Imagine — image-quality tier. Different aesthetic
// than the GPT / Gemini / FLUX families. Tends toward bolder, more
// stylized results; good for editorial / illustration-style outputs.
//
// Quirks:
// - x-ai namespace (note the dash) on OpenRouter.
// - No reasoning param.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'x-ai/grok-imagine-image-quality';
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 40_000;

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  const t0 = Date.now();
  const fullPrompt = `Create a high-quality image: ${String(prompt)}.\n\nStyle: bold, expressive. Aspect: ${aspectHintFromEnv()}.`;
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
    console.log(`[ai/gen-image/grok-imagine] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/grok-imagine] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
