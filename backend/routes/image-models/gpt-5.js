// backend/routes/image-models/gpt-5.js
//
// Dedicated handler for: openai/gpt-5-image
// Mounted at:            POST /api/ai/gen-image/gpt-5
//
// Model: GPT-5 + GPT Image 1 combined — strong instruction following
// and image-editing capability. Best of the GPT family for prompts that
// need precise visual reasoning ("place X at the top-left, Y at the
// bottom-right, make sure Z is visible").
//
// Quirks (shared with the GPT-5.4 sibling):
// - Hidden chain-of-thought BEFORE image gen. We MUST disable that
//   (`reasoning.effort: 'minimal'` + `include_reasoning: false`) or
//   Vercel's 60s function ceiling kills the call → 504 with no payload.
// - OpenRouter pre-charges the full max_tokens budget. Cap at 4096 to
//   keep the reservation around $0.06 per call.

import {
  OPENROUTER_CHAT_URL,
  extractImageFromOpenRouterResponse,
  parseImageUrlToReturn,
  aspectHintFromEnv,
  openRouterHeaders,
} from './_shared.js';

export const MODEL = 'openai/gpt-5-image';
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 55_000;

export async function handler(req, res) {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  const t0 = Date.now();
  const fullPrompt = `Create a high-quality image: ${String(prompt)}.\n\nStyle: warm, professional. Aspect: ${aspectHintFromEnv()}.`;
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
          // Skip the reasoning pass — same lesson as gpt-5.4.js. Without
          // this the GPT family routinely exceeds Vercel's 60s ceiling.
          reasoning: { effort: 'minimal', exclude: true },
          include_reasoning: false,
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
    console.log(`[ai/gen-image/gpt-5] ✓ took=${Date.now()-t0}ms src=${found.source}`);
    res.json({ ok: true, provider: 'openrouter', model: MODEL, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error(`[ai/gen-image/gpt-5] ✗ after ${Date.now()-t0}ms: ${e.message}`);
    res.status(500).json({ error: e.message, model: MODEL });
  }
}
