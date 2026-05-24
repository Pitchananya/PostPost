// public/js/components/head.js
//
// Page section header — the bold title block at the top of every authenticated
// page (Profile, Topics, Caption, Creative, Calendar, Library, Analytics,
// Automation). Mirrors the inline head() function in index.html:
//
//   head('OPERATIONS', 'Automation Log', T('โพสต์อัตโนมัติ','Auto-post log'),
//        raw('<button class="btn primary sm">Export</button>'))
//
// Wrapping rules (matches the html`` safety model):
//   - `kicker` and `title`: plain strings that will appear in <h1>/<div>;
//     auto-escape via html``. Caller passes pre-translated T(...) result.
//   - `sub`: same — plain string, auto-escaped. Pass `''` (or omit) to skip.
//   - `actions`: HTML markup (button list with icons). Must be wrapped in
//     raw() by the caller, OR be a html`` tagged result (which is a plain
//     string ALREADY auto-escaped from interpolation — wrap it in raw() too).
//
// If you want to pass mixed content (e.g. a title with an emoji span), build
// it via html`` then raw() the result.

import { html, raw } from '../html.js';

export function head(kicker, title, sub, actions = '') {
  return html`<div class="sectionHead">
    <div>
      <div class="kicker">${kicker}</div>
      <h1 class="title">${title} <span class="star">☆</span></h1>
      ${sub ? html`<p class="subtitle">${sub}</p>` : ''}
    </div>
    ${actions ? html`<div class="actions">${raw(actions)}</div>` : ''}
  </div>`;
}
