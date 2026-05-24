// public/js/main.js
//
// Phase-3e bootstrap. Loads every extracted module and wires the
// remaining inline glue together. The dual-copy state hack is GONE —
// inline + modules now share the SAME window.PP.state object (see
// state.js _initState()). This file only has to:
//   1. Bind i18n to the canonical state ref.
//   2. Sync the mutable arrays (BRANDS, TOPICS, PRODUCTS) from inline
//      into the module copies so any localStorage rehydration the
//      inline boot did is reflected in our module-side arrays. This is
//      still needed because the inline script reassigns those `let`
//      bindings (e.g. `BRANDS = _pb.map(normalizeBrand)`) — a separate
//      Phase 3e step removes the inline arrays too.
//   3. Publish helpers on window.PP for the remaining inline call sites.
//   4. Swap renderers in PAGES so module pages take over.
//   5. Repaint.
//
// Load order: this file is <script type="module">, so it runs AFTER the
// two inline classic scripts have booted (state already canonical via
// the pre-boot IIFE in script 1; PAGES/render already populated).

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
import { VIDEO_MODELS, VIDEO_STYLES } from './data/video-models.js';
import { AVATAR_BG_SCENES } from './data/avatar-bg-scenes.js';
import { resolveAvatarBgQuery, fetchAvatarBg, setupAvatarBgRotation } from './components/avatar-bg.js';
import { splitScriptIntoChunks } from './components/storyboard.js';
import { detectChromaMode, makeChromaKeyer } from './components/chroma-key.js';
import { idbPutImage, idbGetImage, idbDeleteImage, compressImageDataUrl } from './idb.js';
import { pageLanding } from './pages/landing.js';
import { pageLogin } from './pages/login.js';
import { pageOnboarding } from './pages/onboarding.js';
import { pageAutomation } from './pages/automation.js';
import { pageAnalytics } from './pages/analytics.js';
import { pageCalendar } from './pages/calendar.js';
import { pageTopics } from './pages/topics.js';
import { pageLibrary } from './pages/library.js';
import { pageCaption } from './pages/caption.js';
import { pageCreative } from './pages/creative.js';
import { pageProfile } from './pages/profile.js';
import { pageTextVideo } from './pages/textvideo.js';
import { pageAvatar } from './pages/avatar.js';
import { sidebarHTML } from './components/sidebar.js';
import { topbarHTML } from './components/topbar.js';
import { profileMenuHTML, openProfileDetail } from './components/profile-menu.js';

// ── Step 1: bind i18n to the (now-canonical) state ──
// state.js's _initState() already returned the same object the inline
// pre-boot stashed on window.PP.state, so i18n's lang lookups + every
// module's state writes hit the SAME ref the inline router reads from.
i18n.bindState(state);

// ── Step 2: sync the mutable arrays from inline → module ──
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

// ── Step 3: publish the FULL bridge on window.PP ──
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
  state,            // canonical state ref — already on window.PP.state since pre-boot
  loadState, saveStateField,
  // data (Phase 3b)
  BRANDS, MAX_BRANDS, normalizeBrand, saveBrands, loadBrands,
  VOICES,
  AVATARS, loadCustomAvatars, saveCustomAvatars, addCustomAvatar, deleteCustomAvatar, compressAvatarImage,
  NAV,
  ARCHETYPES, findArchetype,
  BUSINESS_TYPES,
  TOPICS, PRODUCTS, DEMO_TOPICS, DEMO_PRODUCTS,
  // Phase 3d — video model catalog (Veo + fal-ai t2v) + style presets
  VIDEO_MODELS, VIDEO_STYLES,
  // Phase 3d — Talking-Avatar supporting helpers (data + bg + storyboard + chroma)
  AVATAR_BG_SCENES,
  resolveAvatarBgQuery, fetchAvatarBg, setupAvatarBgRotation,
  splitScriptIntoChunks,
  detectChromaMode, makeChromaKeyer,
  idbPutImage, idbGetImage, idbDeleteImage, compressImageDataUrl,
  // Phase 3e — extracted shell components (sidebar, topbar, profile menu)
  // The inline render() now reads these via window.PP.* so the inline
  // declarations can be deleted.
  sidebarHTML, topbarHTML, profileMenuHTML, openProfileDetail,
  // PAGES + render survive from inline; we re-export here so future page
  // modules can grab them off window.PP without poking at globals.
  // (The inline script wrote these onto window.PP during its own boot block.)
});

// ── Step 4: swap landing + login + extracted-page renderers, repaint ──
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
  PAGES.caption = pageCaption;
  PAGES.creative = pageCreative;
  PAGES.profile = pageProfile;
  // Phase 3d — text-to-video page (smaller, less coupled).
  PAGES.textvideo = pageTextVideo;
  // Phase 3d — Talking Avatar (biggest page).
  PAGES.avatar = pageAvatar;
}
if (window.PP && typeof window.PP.render === 'function') {
  window.PP.render();
}
