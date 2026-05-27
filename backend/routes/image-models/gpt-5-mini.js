// backend/routes/image-models/gpt-5-mini.js
//
// Dedicated handler for: openai/gpt-5-image-mini
// Mounted at:            POST /api/ai/gen-image/gpt-5-mini
//
// Model: lighter / cheaper GPT-5 Image variant. Same instruction-
// following as the full GPT-5 Image but with reduced quality budget,
// good for high-volume scale work where exact composition matters less
// than throughput.
//
// Quirks (same family as gpt-5.js and gpt-5.4.js):
// - Same reasoning skip is required to avoid Vercel timeouts.
// - Smaller token budget than the full GPT-5 since this model returns
//   images faster and uses fewer reasoning tokens.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'openai/gpt-5-image-mini';
const MAX_TOKENS = 2048;
const TIMEOUT_MS = 45_000;  // mini is faster than full GPT-5

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
          // Belt + braces — see gpt-5.4.js comment for the full rationale.
          reasoning_effort: 'minimal',
          reasoning: { effort: 'minimal' },
          provider: { sort: 'throughput', allow_fallbacks: true },
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
    console.log(`[ai/gen-image/gpt-5-mini] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/gpt-5-mini] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
