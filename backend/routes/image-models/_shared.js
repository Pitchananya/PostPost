// backend/routes/image-models/_shared.js
//
// Shared helpers for the per-model image-gen handlers in this directory.
// Each model gets its own file (gpt-5.4.js, nano-banana.js) so its quirks
// stay isolated — but these helpers are identical across models because
// they parse OpenRouter's unified response shape.
//
// OpenRouter currently serves exactly two image-output models (verified
// against the live /api/v1/models catalog):
//   - openai/gpt-5.4-image-2
//   - google/gemini-3.1-flash-image-preview
// If OpenRouter adds more, add one new file per model, mount it in
// index.js, add the dropdown option in creative.js + dispatch in
// pickGenImageEndpoint().

export const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Walks the OpenRouter chat-completions response and pulls the image out
// of whichever field the provider chose to put it in. Different image
// models embed the image in different keys (message.images[], an inline
// content part, a tool_call result, a data URL in content, etc.) — this
// is the union of every shape we've actually seen returned from
// OpenRouter image-gen calls.
export function extractImageFromOpenRouterResponse(data) {
  const message = data?.choices?.[0]?.message;
  if (!message) return null;

  // (1) Standard: message.images[] — Gemini-style
  const images = message.images || [];
  if (images[0]) {
    const url = images[0]?.image_url?.url || images[0]?.url;
    if (url) return { url, source: 'message.images[0]' };
  }

  // (2) message.content as array of parts (multimodal)
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part?.type === 'image_url' && part?.image_url?.url) return { url: part.image_url.url, source: 'message.content[].image_url' };
      if (part?.type === 'image' && part?.source?.data) return { url: `data:${part.source.media_type || 'image/png'};base64,${part.source.data}`, source: 'message.content[].image.source' };
      if (part?.image_url) return { url: typeof part.image_url === 'string' ? part.image_url : part.image_url.url, source: 'message.content[].image_url(loose)' };
      if (part?.b64_json) return { url: `data:image/png;base64,${part.b64_json}`, source: 'message.content[].b64_json' };
    }
  }

  // (3) message.content as a string that's a data URL or http URL
  if (typeof message.content === 'string') {
    if (message.content.startsWith('data:image')) return { url: message.content, source: 'message.content(data-url)' };
    const urlMatch = message.content.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)(\?\S*)?/i);
    if (urlMatch) return { url: urlMatch[0], source: 'message.content(extracted-url)' };
  }

  // (4) tool_calls → image_generation result
  const toolCalls = message.tool_calls || [];
  for (const tc of toolCalls) {
    const args = tc?.function?.arguments;
    if (typeof args === 'string') {
      try {
        const parsed = JSON.parse(args);
        if (parsed.image_url) return { url: parsed.image_url, source: 'tool_calls[].arguments.image_url' };
        if (parsed.image_base64) return { url: `data:image/png;base64,${parsed.image_base64}`, source: 'tool_calls[].arguments.image_base64' };
      } catch {}
    }
  }

  // (5) message.attachments[]
  const attachments = message.attachments || [];
  for (const att of attachments) {
    if (att?.image_url) return { url: att.image_url, source: 'message.attachments[].image_url' };
    if (att?.url && /image/i.test(att.type || '')) return { url: att.url, source: 'message.attachments[].url' };
  }

  // (6) data.images[] — top-level
  if (Array.isArray(data.images) && data.images[0]) {
    const url = data.images[0]?.url || data.images[0]?.image_url?.url || data.images[0]?.b64_json;
    if (url) return { url: url.startsWith('data:') || url.startsWith('http') ? url : `data:image/png;base64,${url}`, source: 'data.images[0]' };
  }

  // (7) model refusal
  if (message.refusal) return { error: 'model_refused', refusal: message.refusal };

  return null;
}

// Splits a returned image URL into { image_base64, image_url } — base64
// for data: URLs, plain url otherwise. Matches the shape the frontend
// expects from /api/ai/gen-image/*.
export function parseImageUrlToReturn(url) {
  if (url.startsWith('data:')) {
    const b64 = url.split(',')[1];
    return { image_base64: b64, image_url: null };
  }
  return { image_url: url, image_base64: null };
}

// Maps the OPENROUTER_IMAGE_SIZE env var to a short prompt-friendly aspect
// hint. Kept here so both models tag the prompt the same way.
export function aspectHintFromEnv() {
  const size = process.env.OPENROUTER_IMAGE_SIZE || '';
  if (size === '1024x1536') return 'portrait 2:3';
  if (size === '1536x1024') return 'landscape 3:2';
  if (size === '1024x1350') return 'vertical 4:5 portrait';
  if (size === '1024x1920') return 'tall vertical 9:16 portrait';
  // No forced square — the per-request "IMAGE FORMAT" line in the prompt now
  // drives the aspect (4:5 / 9:16 / 1:1), so the model composes for it instead
  // of always rendering a square that later gets cropped.
  return '';
}

// Shared headers — auth + the metadata OpenRouter recommends sending so
// they can attribute requests to this app on their dashboard.
export function openRouterHeaders() {
  return {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.PUBLIC_URL || 'https://postpost.adsventure.ltd',
    'X-Title': 'PostPost',
  };
}
