// backend/routes/image-models/flux-2-flex.js
//
// Dedicated handler for: black-forest-labs/flux.2-flex
// Mounted at:            POST /api/ai/gen-image/flux-2-flex
//
// Model: FLUX.2 Flex — best in the FLUX family at TEXT RENDERING and
// typography. Pick this when you need readable text baked into the
// image (posters, infographics, social cards with copy). Otherwise the
// Pro/Max variants give slightly better non-text quality.
//
// Same FLUX request quirks — diffusion-based, no reasoning. Prompt
// style: comma-separated tags; explicitly call out the text you want
// rendered ("text reads: 'Hello'") for best typography results.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'black-forest-labs/flux.2-flex';
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 45_000;

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  const t0 = Date.now();
  // Flex is text-strong — keep the user prompt verbatim so embedded
  // text instructions ("text reads:...") pass through unchanged.
  const fullPrompt = `${String(prompt)}, ${aspectHintFromEnv()} aspect, crisp typography, clean text rendering`;
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
    console.log(`[ai/gen-image/flux-2-flex] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/flux-2-flex] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
