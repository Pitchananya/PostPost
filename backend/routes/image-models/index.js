// backend/routes/image-models/index.js
//
// Registry of every per-model image-gen handler. Each model lives in
// its own file so its specific quirks (request body params, max_tokens,
// timeout, prompt shaping, reasoning toggle) stay isolated. To add a
// new OpenRouter image model:
//
//   1. Create `<slug>.js` exporting `{ MODEL, handler }`.
//   2. Import + append it to the `models` array below.
//   3. Add the dropdown option in public/js/pages/creative.js.
//   4. Add a dispatch arm in pickGenImageEndpoint() in public/index.html.
//
// Catalog source: openrouter.ai/collections/image-models (12 models as
// of May 2026). Verified each id against the live API where possible.

import * as gemini25     from './gemini-2.5.js';
import * as nanoBanana   from './nano-banana.js';       // gemini-3.1-flash-image-preview
import * as gemini3Pro   from './gemini-3-pro.js';
import * as gpt5         from './gpt-5.js';
import * as gpt5Mini     from './gpt-5-mini.js';
import * as gpt54        from './gpt-5.4.js';
import * as flux2Pro     from './flux-2-pro.js';
import * as flux2Max     from './flux-2-max.js';
import * as flux2Flex    from './flux-2-flex.js';
import * as flux2Klein   from './flux-2-klein.js';
import * as seedream45   from './seedream-4.5.js';
import * as grokImagine  from './grok-imagine.js';

// Each entry: { slug (URL path under /gen-image/), model (full OR id),
// handler }. Order here also drives dropdown order in the UI when
// auto-grouping by provider.
export const models = [
  // ── Google ──
  { slug: 'gemini-2.5',   model: gemini25.MODEL,    handler: gemini25.handler },
  { slug: 'nano-banana',  model: nanoBanana.MODEL,  handler: nanoBanana.handler },
  { slug: 'gemini-3-pro', model: gemini3Pro.MODEL,  handler: gemini3Pro.handler },
  // ── OpenAI ──
  { slug: 'gpt-5',        model: gpt5.MODEL,        handler: gpt5.handler },
  { slug: 'gpt-5-mini',   model: gpt5Mini.MODEL,    handler: gpt5Mini.handler },
  { slug: 'gpt-5.4',      model: gpt54.MODEL,       handler: gpt54.handler },
  // ── Black Forest Labs ──
  { slug: 'flux-2-pro',   model: flux2Pro.MODEL,    handler: flux2Pro.handler },
  { slug: 'flux-2-max',   model: flux2Max.MODEL,    handler: flux2Max.handler },
  { slug: 'flux-2-flex',  model: flux2Flex.MODEL,   handler: flux2Flex.handler },
  { slug: 'flux-2-klein', model: flux2Klein.MODEL,  handler: flux2Klein.handler },
  // ── ByteDance ──
  { slug: 'seedream-4.5', model: seedream45.MODEL,  handler: seedream45.handler },
  // ── xAI ──
  { slug: 'grok-imagine', model: grokImagine.MODEL, handler: grokImagine.handler },
];

// Mount every registered model under POST /<base>/gen-image/<slug>.
// `router` is the parent Express router (passed in by routes/ai.js).
export function mount(router) {
  for (const m of models) {
    router.post(`/gen-image/${m.slug}`, m.handler);
  }
}

// Look up the slug for a given full OpenRouter model id. Used by the
// legacy `/gen-image` dispatcher to forward to the right per-model route.
export function slugForModel(modelId) {
  const m = models.find((x) => x.model === modelId);
  return m ? m.slug : null;
}
