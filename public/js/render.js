// public/js/render.js
//
// The big router — picks the page renderer for state.page, builds the
// shell (sidebar + topbar) when the page is private, swaps DOM into
// #root, restores scroll position on same-page re-renders, and re-wires
// the Talking-Avatar bg rotation timer.
//
// PAGES is exposed on window.PP so the inline event handlers in
// index.html can still mutate it (in particular, the inline boot path
// builds PAGES once, then main.js overrides each entry — Phase 3e
// onward, PAGES is the single canonical map).
//
// The exported render() function is wired into window.PP.render +
// window.render so:
//   - inline event-delegation handlers (the only remaining inline code
//     that re-renders) keep calling render() by bare identifier
//   - the auth-wiring inline script can wrap window.render to inject
//     the demo-login pre-fill on the login page
//   - main.js fires the first paint once modules are ready
//
// Phase 4 (scoped re-render) will replace this whole-page innerHTML
// rebuild with per-page-block patches — for now the existing "mutate
// state then re-render the world" pattern is preserved.

import { state } from './state.js';
import { sidebarHTML } from './components/sidebar.js';
import { topbarHTML } from './components/topbar.js';
import { setupAvatarBgRotation } from './components/avatar-bg.js';
import { trackPageView } from './track.js';

// PAGES map — page id → renderer function. Mutable by main.js (which
// fills in every module renderer) + by the inline script (until it's
// deleted in the final cleanup).
export const PAGES = {};

// Public pages render without sidebar + topbar. The inline router needs
// this set to decide between "shell + page" and "page only" layouts.
export const PUBLIC_PAGES = new Set(['landing', 'login', 'onboarding']);

let _ppLastPage = null;

export function render() {
  const root = document.getElementById('root');
  if (!root) return;
  const isPublic = PUBLIC_PAGES.has(state.page);
  root.className = 'app' + (isPublic ? ' no-shell' : '');
  const pageFn = PAGES[state.page] || PAGES.landing;
  if (typeof pageFn !== 'function') {
    // Defensive: if main.js hasn't filled PAGES yet (race during the boot
    // window), bail without clobbering the existing DOM. The next render
    // tick after main.js loads will paint normally.
    return;
  }

  // Same-page re-renders (button clicks) must keep the scroll position;
  // only a real page change scrolls back to the top.
  const _samePage = (state.page === _ppLastPage);
  const _keepY = _samePage ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;

  if (isPublic) {
    root.innerHTML = `<main class="main"><div class="page">${pageFn()}</div></main>`;
  } else {
    // Mobile drawer: sidebar gets `.open` class when state.sidebarOpen is true;
    // backdrop overlay shows + closes the drawer on tap.
    const sideClass = state.sidebarOpen ? ' open' : '';
    const backdropClass = state.sidebarOpen ? ' show' : '';
    root.innerHTML = sidebarHTML().replace('class="sidebar"', 'class="sidebar' + sideClass + '"')
      + '<div class="mobileBackdrop' + backdropClass + '" data-mobilebackdrop="1"></div>'
      + '<main class="main"><div class="mainInner">' + topbarHTML() + '<div class="page">' + pageFn() + '</div></div></main>';
  }
  window.scrollTo({ top: _keepY, behavior: 'instant' });
  // Telemetry: only fire on real page changes, not button-click re-renders
  // of the same page. trackPageView() does its own de-dupe but we gate at
  // the render boundary too to keep the queue tight.
  if (!_samePage) trackPageView(state.page);
  _ppLastPage = state.page;
  // Talking Avatar bg rotation — cycle the preview <video src> through
  // avatarBgCandidates every `avatarBgInterval` seconds. Re-wired on
  // every render so it stays in sync with state changes (interval
  // picker, candidate list, page leave).
  setupAvatarBgRotation();
  // One-shot TTS autoplay — consumed by the very next render after
  // audio is ready, so subsequent progress-update renders don't restart
  // playback from 0:00.
  if (state.ttsAutoplayPending) state.ttsAutoplayPending = false;
}
