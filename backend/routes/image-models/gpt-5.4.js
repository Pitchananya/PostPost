// backend/routes/image-models/gpt-5.4.js
//
// Dedicated handler for: openai/gpt-5.4-image-2
// Mounted at:            POST /api/ai/gen-image/gpt-5.4
//
// Model quirks (kept isolated to this file — do NOT mix with nano-banana):
// - OpenRouter PRE-CHARGES the full max_tokens budget at request time
//   (default 65536 ≈ $1.30 reserved per call). We cap at 16384 so each
//   call only reserves ~$0.25; actual billed cost ~$0.04-0.08/image.
// - Higher latency than nano-banana (~8-15s). Use a 45s timeout.
// - Best Thai-text-on-image rendering of the two OpenRouter image models;
//   prefer this when the post needs readable Thai copy baked into the
//   image (e.g. course covers, infographics with numbered slides).
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

export const MODEL = 'openai/gpt-5.4-image-2';
const MAX_TOKENS = 16384;  // cap the pre-charge; OpenRouter reserves the full budget upfront for this model
const TIMEOUT_MS = 45_000;

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
    console.log(`[ai/gen-image/gpt-5.4] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({
      ok: true,
      provider: 'openrouter',
      model: MODEL,
      image_base64: out.image_base64 || null,
      image_url: out.image_url || null,
    });
  } catch (e) {
    console.error(`[ai/gen-image/gpt-5.4] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
