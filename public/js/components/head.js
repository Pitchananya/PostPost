// public/js/components/head.js
//
// Page section header — the bold title block at the top of every authenticated
// page (Profile, Topics, Caption, Creative, Calendar, Library, Analytics,
// Automation). Mirrors the inline head() function in index.html.
//
// Returns a plain string (an html`` result). Callers should wrap the result
// in raw() when interpolating into another html`` template, otherwise the
// outer html`` will re-escape the HTML markup. The Phase-3c pages already
// do `${raw(head(...))}` — keep that convention.
//
// Wrapping rules:
//   - `kicker` / `title` / `sub`: plain strings. The inner html`` auto-escapes
//     them — fine for ASCII + Thai text without HTML entities.
//   - `actions`: pre-rendered HTML markup (button list with icons). Wrapped
//     in raw() inside this fn so caller can pass a plain string built via
//     backtick concat — no need for callers to raw() it themselves.
//
// NOTE on nested html``: an html`` expression returns a STRING, not a raw
// object. Interpolating it into another html`` would re-escape. We avoid
// this by using string concat for the conditional sub/actions fragments
// below — keeps everything in one safe scope.

import { html, raw } from '../html.js';

export function head(kicker, title, sub, actions = '') {
  // Pre-build the optional fragments as raw strings so the outer html``
  // doesn't re-escape them.
  const subFrag = sub ? raw(`<p class="subtitle">${escapeText(sub)}</p>`) : '';
  const actionsFrag = actions ? raw(`<div class="actions">${actions}</div>`) : '';

  return html`<div class="sectionHead">
    <div>
      <div class="kicker">${kicker}</div>
      <h1 class="title">${title} <span class="star">☆</span></h1>
      ${subFrag}
    </div>
    ${actionsFrag}
  </div>`;
}

// Local minimal escape for the sub fragment (text node — no quotes needed).
function escapeText(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
