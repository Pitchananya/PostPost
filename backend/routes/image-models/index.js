// backend/routes/image-models/index.js
//
// Registry of all per-model image-gen handlers. Each model lives in its
// own file in this directory so its quirks (token budget, timeout,
// request shape) stay isolated. To add a new OpenRouter image model:
//
//   1. Create `<model-slug>.js` exporting `{ MODEL, handler }`.
//   2. Import it below and append to the `models` array.
//   3. Add a matching option in public/js/pages/creative.js (dropdown)
//      and a dispatch arm in pickGenImageEndpoint() in public/index.html.
//
// OpenRouter currently serves exactly two image-output models (verified
// against the live /api/v1/models catalog as of this writing).

import * as gpt54 from './gpt-5.4.js';
import * as nanoBanana from './nano-banana.js';

// Each entry: { slug (URL path under /gen-image/), model (full OR id), handler }
export const models = [
  { slug: 'gpt-5.4',     model: gpt54.MODEL,      handler: gpt54.handler },
  { slug: 'nano-banana', model: nanoBanana.MODEL, handler: nanoBanana.handler },
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
