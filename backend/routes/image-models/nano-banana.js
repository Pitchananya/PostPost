// backend/routes/image-models/nano-banana.js
//
// Dedicated handler for: google/gemini-3.1-flash-image-preview
// Mounted at:            POST /api/ai/gen-image/nano-banana
//
// Model quirks (kept isolated to this file — do NOT mix with gpt-5.4):
// - Google does NOT pre-charge the token budget — billing is actual
//   usage (~$0.01/image), so we can run with a smaller max_tokens of
//   8192 without reserving anything extra.
// - Faster than GPT-5.4 (~3-5s typical). Tighter 30s timeout matches.
// - Slightly weaker at Thai text-on-image but better at photographic
//   scenes (product photography, lifestyle shots, real people).
// - Cheaper per image — good default for high-volume bulk generation.
//
// Request: { prompt: string }
// Response: { ok, provider, model, image_base64, image_url }

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'google/gemini-3.1-flash-image-preview';
const MAX_TOKENS = 8192;  // Google bills actual usage, no pre-charge → smaller budget is fine
const TIMEOUT_MS = 30_000;  // tighter timeout — this model is significantly faster

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'prompt required' });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  }
  const t0 = Date.now();
  const fullPrompt = `Create a high-quality image: ${String(prompt)}.\n\nStyle: warm, professional. Aspect: ${aspectHintFromEnv()}.`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout 30s'), TIMEOUT_MS);
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
    } finally {
      clearTimeout(timer);
    }
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
    console.log(`[ai/gen-image/nano-banana] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({
      ok: true,
      provider: 'openrouter',
      model: MODEL,
      image_base64: out.image_base64 || null,
      image_url: out.image_url || null,
    });
  } catch (e) {
    console.error(`[ai/gen-image/nano-banana] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
