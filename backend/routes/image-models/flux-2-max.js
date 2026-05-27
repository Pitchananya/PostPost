// backend/routes/image-models/flux-2-max.js
//
// Dedicated handler for: black-forest-labs/flux.2-max
// Mounted at:            POST /api/ai/gen-image/flux-2-max
//
// Model: FLUX.2 Max — top-tier quality of the FLUX.2 family. Slowest
// and most expensive but produces the cleanest results. Pick this when
// quality matters more than speed/cost (hero shots, campaign assets).
//
// Same FLUX request quirks as flux-2-pro.js — no reasoning, comma-
// separated prompt style. Just bumps the timeout since Max is slower.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'black-forest-labs/flux.2-max';
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 55_000;  // Max is the slowest in the FLUX family

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  const t0 = Date.now();
  const fullPrompt = `${String(prompt)}, ${aspectHintFromEnv()} aspect, ultra detailed, premium quality, cinematic lighting`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout 55s'), TIMEOUT_MS);
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
    console.log(`[ai/gen-image/flux-2-max] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/flux-2-max] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
