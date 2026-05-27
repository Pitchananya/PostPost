// backend/routes/image-models/gemini-2.5.js
//
// Dedicated handler for: google/gemini-2.5-flash-image
// Mounted at:            POST /api/ai/gen-image/gemini-2.5
//
// Model: "Nano Banana" — Google's GA image-gen model. Older sibling of
// nano-banana-2 (gemini-3.1). Generally available, stable, cheap.
//
// Quirks:
// - GA model (stable) — preferred when you want consistent output
//   versus the still-preview 3.1.
// - Google does NOT pre-charge tokens — billing is actual usage,
//   typical cost ~$0.005/image (cheapest of the Google trio).
// - Fast (~2-4s typical). 25s timeout is plenty.
// - Output is multimodal: produces both an image AND a short caption.
// - No reasoning tokens — don't pass `reasoning` here.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'google/gemini-2.5-flash-image';
const MAX_TOKENS = 8192;
const TIMEOUT_MS = 25_000;

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  const t0 = Date.now();
  const fullPrompt = `Create a high-quality image: ${String(prompt)}.\n\nStyle: warm, professional. Aspect: ${aspectHintFromEnv()}.`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout 25s'), TIMEOUT_MS);
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
    console.log(`[ai/gen-image/gemini-2.5] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/gemini-2.5] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
