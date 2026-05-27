// backend/routes/image-models/gpt-5.4.js
//
// Dedicated handler for: openai/gpt-5.4-image-2
// Mounted at:            POST /api/ai/gen-image/gpt-5.4
//
// Model quirks (kept isolated to this file — do NOT mix with nano-banana):
//
// 1. GPT-5.4 generates hidden REASONING tokens before producing the image.
//    With default effort, this can push the total call past Vercel's 60s
//    serverless timeout → 504 Gateway Timeout, image never returned. We
//    explicitly set `reasoning: { effort: 'minimal' }` so the model goes
//    straight to image generation. (nano-banana doesn't have this knob —
//    its supported_parameters list it but Gemini doesn't burn the same
//    way on reasoning, so we leave it off for that model.)
//
// 2. OpenRouter PRE-CHARGES the full max_tokens budget at request time
//    (~$0.000015/token output → 16384 tokens reserved ≈ $0.25/call). We
//    cap at 4096 since the image itself is returned as one inline part
//    and 4096 completion tokens is plenty of headroom — also reduces the
//    upfront reservation to ~$0.06.
//
// 3. Set explicit timeout to 55s (just under Vercel's 60s function limit)
//    so we fail with a clean error message rather than Vercel killing the
//    connection mid-stream.
//
// 4. Best Thai-text-on-image rendering of the two OpenRouter image
//    models. Prefer this when the post needs readable Thai copy baked
//    into the image (course covers, infographics with numbered slides).
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

// 4096 completion tokens is plenty for a single image + a one-line text
// caption from the model. Bigger budgets only inflate the pre-charge.
const MAX_TOKENS = 4096;

// Vercel kills serverless functions at 60s. Fail at 55s so we can return
// a useful error before the gateway times us out.
const TIMEOUT_MS = 55_000;

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
          // Disable the heavy reasoning pass — image-gen calls don't
          // need chain-of-thought; skipping it is the main fix that
          // unblocks this model from hitting Vercel's 60s ceiling.
          reasoning: { effort: 'minimal' },
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
