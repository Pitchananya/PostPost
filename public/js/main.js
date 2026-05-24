// public/js/main.js
//
// Phase-3 bootstrap. Loads every extracted module, syncs the module-side
// state copy with the inline-script copy (dual-copy bridge — see state.js
// for the long story), repaints the page, and publishes everything on
// window.PP for the unextracted inline pages to keep finding.
//
// Load order: this file is <script type="module">, so it runs AFTER the
// inline classic script has booted (declared its own state/T/I/BRANDS/…
// and called render() once). That means when we get here:
//   - window.PP.state already exists (the INLINE state)
//   - window.PP.PAGES / window.PP.render already exist
//   - the page has been rendered once with inline functions
//
// What we do, in order:
//   1. Sync the inline state INTO the module state (so any persisted
//      values — last brand, lang preference — survive the bridge).
//   2. Repoint window.PP.state at the MODULE state, so future writes by
//      Phase-2/3 code go to the module copy.
//   3. Bind i18n to the module state.
//   4. Sync mutable arrays (BRANDS, TOPICS, PRODUCTS) from inline to
//      module so any localStorage rehydration the inline boot did is
//      reflected in our module copies.
//   5. Publish everything on window.PP so:
//      a) Inline page functions can read modules via window.PP.X
//      b) Extracted pages can directly import from the modules.
//   6. Swap landing + login renderers for the module versions and
//      re-render.

import { html, raw, escape } from './html.js';
import { escText } from './escape.js';
import * as i18n from './i18n.js';
import { T, t } from './i18n.js';
import { I, LOGO_ICON, ICONS } from './icons.js';
import { toast } from './toast.js';
import { getTok, setTok, clearTok } from './auth.js';
import { api, apiAt, API_BASE } from './api.js';
import { state, loadState, saveStateField } from './state.js';
import { BRANDS, MAX_BRANDS, normalizeBrand, saveBrands, loadBrands } from './data/brands.js';
import { VOICES } from './data/voices.js';
import { AVATARS, loadCustomAvatars, saveCustomAvatars, addCustomAvatar, deleteCustomAvatar, compressAvatarImage } from './data/avatars.js';
import { NAV } from './data/nav.js';
import { ARCHETYPES, findArchetype } from './data/archetypes.js';
import { BUSINESS_TYPES } from './data/business-types.js';
import { TOPICS, PRODUCTS, DEMO_TOPICS, DEMO_PRODUCTS } from './data/topics.js';
import { idbPutImage, idbGetImage, idbDeleteImage, compressImageDataUrl } from './idb.js';
import { pageLanding } from './pages/landing.js';
import { pageLogin } from './pages/login.js';
import { pageOnboarding } from './pages/onboarding.js';
import { pageAutomation } from './pages/automation.js';
import { pageAnalytics } from './pages/analytics.js';
import { pageCalendar } from './pages/calendar.js';
import { pageTopics } from './pages/topics.js';
import { pageLibrary } from './pages/library.js';

// ── Step 1+2: sync state from inline → module on every render ──
// The inline <script> holds its own `const state = {…}` — every inline page
// function + event handler reads/writes that object directly. Extracted
// modules (landing/login, future pages) read from THIS module's state. To
// keep both views consistent we:
//   a) one-shot copy inline → module right now so the module starts with
//      any persisted values (last brand, lang preference) the inline boot
//      block restored from localStorage,
//   b) wrap render() so every subsequent re-render syncs inline → module
//      first — that way an inline lang-button click that mutates inline
//      state.lang is visible to the module's landing page when it renders.
//
// Module-side mutations DON'T propagate back to inline. That's fine for
// Phase 3 because the only module pages so far (landing, login) are
// read-only renderers — every mutation still happens inline. Future
// extracted pages will start writing to the module copy; at that point
// we'll add a two-way sync (or finish the inline-state removal).
const inlineState = (window.PP && window.PP.state) || null;
if (inlineState) {
  Object.assign(state, inlineState);
  // Wrap the GLOBAL render() (function declaration in the inline script —
  // already-wrapped once by the auth-wiring block to inject login form
  // pre-fill). We wrap it again to sync inline → module state on every
  // tick. Both window.render (called by inline event handlers) and
  // window.PP.render (called by module code) get the same wrapper so
  // state stays in sync regardless of who triggers the render.
  if (typeof window.render === 'function') {
    const prevGlobalRender = window.render;
    window.render = function () {
      try { Object.assign(state, inlineState); } catch (_) {}
      return prevGlobalRender.apply(this, arguments);
    };
    window.PP.render = window.render;
  } else if (typeof window.PP.render === 'function') {
    // Fallback: if window.render wasn't exposed (some boot-order edge),
    // at least wrap window.PP.render so module-triggered renders sync.
    const prevPpRender = window.PP.render;
    window.PP.render = function () {
      try { Object.assign(state, inlineState); } catch (_) {}
      return prevPpRender.apply(this, arguments);
    };
  }
}

// ── Step 3: bind i18n to the (now-synced) module state ──
i18n.bindState(state);

// ── Step 4: sync the mutable arrays from inline → module ──
// The inline boot block runs `BRANDS = _pb.map(normalizeBrand)` reassignment
// — it builds a NEW array, not in-place mutation. So our module's BRANDS
// has the SEED list while the inline copy has the persisted list. Copy in
// the persisted values via splice (preserves the module's array reference,
// which is what every other module imported).
try {
  const inlineBRANDS = (window.PP && window.PP.BRANDS) || null;
  if (Array.isArray(inlineBRANDS) && inlineBRANDS.length) {
    BRANDS.splice(0, BRANDS.length, ...inlineBRANDS);
  } else {
    // Inline didn't expose BRANDS yet — fall back to localStorage directly.
    loadBrands();
  }
} catch (_) {}
// Same dance for TOPICS / PRODUCTS — inline reassigns on brand-switch.
try {
  const inlineTOPICS = (window.PP && window.PP.TOPICS) || null;
  if (Array.isArray(inlineTOPICS) && inlineTOPICS.length) {
    TOPICS.splice(0, TOPICS.length, ...inlineTOPICS);
  }
  const inlinePRODUCTS = (window.PP && window.PP.PRODUCTS) || null;
  if (Array.isArray(inlinePRODUCTS) && inlinePRODUCTS.length) {
    PRODUCTS.splice(0, PRODUCTS.length, ...inlinePRODUCTS);
  }
} catch (_) {}
// Custom avatars live on state.customAvatars; inline already loaded them.
// loadCustomAvatars() would re-read localStorage, but since we already
// Object.assign'd from inlineState that's redundant. Leave it as a no-op
// safeguard for the case where the inline boot skipped this field.
if (!Array.isArray(state.customAvatars)) loadCustomAvatars();

// ── Step 5: publish the FULL bridge on window.PP ──
// Both the new modules AND the inline functions still need access.
// window.PP is the single bridge object — inline code reads helpers off it,
// the extracted pages do the same. Once every page is extracted we delete
// the bridge and switch everyone to direct imports.
window.PP = Object.assign(window.PP || {}, {
  // html helpers (Phase 2)
  html, raw, escape,
  // escape + i18n + icons + state (Phase 3a)
  escText,
  T, t,
  I, LOGO_ICON, ICONS,
  toast,
  getTok, setTok, clearTok,
  // expose the OLD shape too so the inline /api/auth wiring keeps working
  token: { get: getTok, set: setTok },
  api, apiAt, API_BASE,
  state,            // ← module state replaces inline state
  loadState, saveStateField,
  // data (Phase 3b)
  BRANDS, MAX_BRANDS, normalizeBrand, saveBrands, loadBrands,
  VOICES,
  AVATARS, loadCustomAvatars, saveCustomAvatars, addCustomAvatar, deleteCustomAvatar, compressAvatarImage,
  NAV,
  ARCHETYPES, findArchetype,
  BUSINESS_TYPES,
  TOPICS, PRODUCTS, DEMO_TOPICS, DEMO_PRODUCTS,
  idbPutImage, idbGetImage, idbDeleteImage, compressImageDataUrl,
  // PAGES + render survive from inline; we re-export here so future page
  // modules can grab them off window.PP without poking at globals.
  // (The inline script wrote these onto window.PP during its own boot block.)
});

// ── Step 6: swap landing + login + extracted-page renderers, repaint ──
const PAGES = window.PP && window.PP.PAGES;
if (PAGES) {
  PAGES.landing = pageLanding;
  PAGES.login = pageLogin;
  // Phase 3c — simple read-only / data-display pages.
  PAGES.onboarding = pageOnboarding;
  PAGES.automation = pageAutomation;
  PAGES.analytics = pageAnalytics;
  PAGES.calendar = pageCalendar;
  PAGES.topics = pageTopics;
  PAGES.library = pageLibrary;
}
if (window.PP && typeof window.PP.render === 'function') {
  window.PP.render();
}
