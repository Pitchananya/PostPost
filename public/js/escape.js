// public/js/escape.js
//
// HTML / text escaping helpers. Kept in their own module so every other
// module can import them without dragging in i18n, state, or icons.
//
//   import { escText } from './escape.js';
//   import { escape }  from './html.js';       // identical for our purposes
//
// `escText` is the original one-liner from the legacy inline script — it
// only escapes &, <, >. That's enough for text-node insertion (which is
// how every call site uses it). For attribute values prefer the stricter
// `escape` re-exported from ./html.js (escapes quotes too).

export const escText = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Re-export the full-fat escape() from html.js for callers that want
// attribute-safe escaping without a second import.
export { escape } from './html.js';
