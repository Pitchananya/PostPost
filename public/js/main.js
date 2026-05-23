// public/js/main.js
//
// Phase-2 bootstrap. Loads the ES-module page renderers and slots them into
// the PAGES map that the inline router in index.html already owns. This file
// is loaded as <script type="module">, so it runs AFTER the inline classic
// script that defined state, T, I, LOGO_ICON, PAGES, and called render()
// once for the initial paint.
//
// The inline script exposes a bridge object on window.PP that gives the
// modules access to those classic-script globals (and to PAGES + render()
// so we can swap functions in and trigger a re-render). The bridge is a
// Phase-2 hack — it disappears in Phase 3 once state/i18n/icons move to
// their own modules.

import { html, raw, escape } from './html.js';
import { pageLanding } from './pages/landing.js';
import { pageLogin } from './pages/login.js';

// Expose html helpers so future modules / inline code can use them too.
if (window.PP) {
  window.PP.html = html;
  window.PP.raw = raw;
  window.PP.escape = escape;
}

// Swap the inline page renderers for the module versions. PAGES[state.page]
// is read inside render(), so mutating the map here is enough — no need to
// re-bind the router itself.
const PAGES = window.PP && window.PP.PAGES;
if (PAGES) {
  PAGES.landing = pageLanding;
  PAGES.login = pageLogin;
}

// Re-render so the very first paint (which used the inline functions) is
// replaced by the module-rendered version. State is preserved, scroll stays
// put (render() handles same-page scroll continuity).
if (window.PP && typeof window.PP.render === 'function') {
  window.PP.render();
}
