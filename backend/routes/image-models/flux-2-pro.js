// backend/routes/image-models/flux-2-pro.js
//
// Dedicated handler for: black-forest-labs/flux.2-pro
// Mounted at:            POST /api/ai/gen-image/flux-2-pro
//
// Model: FLUX.2 Pro — high quality, stable lighting, sharp textures.
// Supports up to 4MP output. Best at photorealistic product shots and
// detailed scenes. Weak at text-on-image (use a different model for
// that — FLUX.2 Flex or any GPT/Gemini variant).
//
// Quirks (different from the chat-completion models above):
// - FLUX models are diffusion-based — no reasoning step, just image
//   sampling. Faster than the GPT family. ~5-10s typical.
// - No `reasoning` param (would be ignored or error).
// - No `modalities` either in some cases — FLUX responds with raw image
//   output. We still pass modalities for OpenRouter consistency; the
//   model ignores fields it doesn't use.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'black-forest-labs/flux.2-pro';
const MAX_TOKENS = 4096;  // FLUX response is mostly image, tiny text envelope
const TIMEOUT_MS = 40_000;

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  const t0 = Date.now();
  // FLUX prompts work best with comma-separated stylistic tags rather
  // than full sentences. Keep the user prompt verbatim and append a
  // short style hint.
  const fullPrompt = `${String(prompt)}, ${aspectHintFromEnv()} aspect, high quality, sharp detail, professional lighting`;
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
    console.log(`[ai/gen-image/flux-2-pro] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/flux-2-pro] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
