// public/js/state.js
//
// Global UI state object. Single mutable reference — every importer gets
// the SAME object, so updates from one page are immediately visible to
// every other page (no observers, no setState, no diffing). The inline
// router in index.html re-renders the whole page tree on every state
// mutation, so this matches the existing "mutate-then-render()" idiom.
//
//   import { state } from './state.js';
//   state.page = 'topics';
//   render();   // (from window.PP for now)
//
// PHASE-3e — SINGLE CANONICAL REF
// --------------------------------
// The inline <script> in index.html no longer declares its own state. It
// hoists window.PP.state from a tiny pre-boot IIFE that runs BEFORE any
// other script, and `const state = window.PP.state` is the inline binding.
// This module mirrors that pattern: if a window.PP.state already exists
// (set up by inline pre-boot), we adopt it as our own export. Otherwise
// we create the defaults here and publish them onto window.PP.state so
// the inline code can adopt OURS. Either way, ONE object reference is
// shared across every importer + every inline call site — no more dual
// copy, no more sync wrapper, no more mirrorToInline() bandaid.
//
// `loadState()` / `saveStateField()` are minimal façades for the boot-time
// localStorage rehydration (last-active brand, drafts list, custom avatars).
// They DON'T sync the whole state object — only the keys that the inline
// boot block already persists. As more pages migrate, persisted-key list
// grows here and shrinks inline.

const DEFAULTS = {
  page: 'landing',         // landing | login | onboarding | profile | topics | caption | creative | avatar | textvideo | automation | analytics | calendar | library
  lang: 'th',              // th | en
  onboardStep: 1,          // 1-3
  brand: 'hp',             // active brand id
  product: 'p1',           // active product
  voice: ['friendly', 'fun'],
  archetype: 'sage',
  topicFilter: 'all',
  topicGenerated: true,
  genTab: 'caption',
  selectedHook: 1,
  avatar: 'mintra',
  textModel: 'anthropic/claude-haiku-4.5',                // default text model for caption/topic gen — full OpenRouter id (see TEXT_MODEL_METADATA in backend/routes/ai.js)
  imageModel: 'google/gemini-3.1-flash-image-preview',    // default image model — Nano Banana 2 (fast, cheap, reliable). 12 models in total registered in backend/routes/image-models/index.js; user can pick others from the Creative dropdown.
  avatarMode: 'free',      // ⚠️ DEFAULT SAFE — 'free' (no fal.ai charge). User explicitly opts-in to 'real' to enable lipsync.
  avatarLipsyncModel: 'fal-ai/bytedance/omnihuman/v1.5',  // default: OmniHuman v1.5 (face + body gestures, $0.50) — Infinitalk = face only
  ttvStyle: 0,                                          // index into the styles[] array on the Text-to-Video page (0 = Creator/UGC)
  ttvModel: 'fal-ai/wan/v2.2-a14b/text-to-video',       // default to Wan 2.2 — cheapest reliable ($0.30/clip, no quota gamble)
  ttvDuration: '8s',
  ttvAspect: '9:16',     // Veo supports 9:16 / 16:9 only
  calDay: 11,
  autoFilter: 'all',
  libraryFilter: 'all',
  channels: { facebook: true, instagram: true, tiktok: false },
  aiAssistOpen: false,
  manualOpen: false,
  aiDescs: [],
  aiDescLoading: false,
  brandDesc: '',
  shopUrl: '',
  shopScraping: false,
  shopStats: null,
  useLocalScraper: false,     // when ON, /api/shopee/scrape calls go to http://localhost:3000 directly
  localAgentAlive: null,      // null = unchecked, true/false = ping result for localhost:3000
  avatarPreviewBgUrl: '',     // looping Pexels stock video shown behind the avatar in the phone preview
  avatarPreviewBgLoaded: false, // ensures we only fetch the bg once per session/brand
  avatarBgScene: 'auto',      // picked bg scene id (auto | studio | cafe | beach | mystical | beauty | off | upload)
  avatarBgUploadUrl: '',      // dataURL of user-uploaded bg video (used when avatarBgScene==='upload')
  avatarBgLoading: false,     // true while fetching a Pexels video for the picked scene
  avatarBgCandidates: [],     // full Pexels result set (last fetch) — OEM-style thumbnail picker grid
  avatarBgPickedUrl: '',      // when user clicks a specific thumbnail, that URL is locked (overrides "first result")
  avatarBgSearch: '',         // custom free-text query (overrides scene preset when non-empty)
  avatarBgInterval: 5,        // bg rotation interval in seconds (0 = no rotation; default 5s = 6 slots for 30s clip)
  avatarBgRotateIdx: 0,       // current index in avatarBgCandidates used by the preview rotation timer
  avatarClipDuration: 30,     // total output clip length in seconds (0 = match TTS audio duration; default 30s for Reels)
  // ── Storyboard — one bg per time slot, each slot semantically matched to its script chunk ──
  avatarStoryboard: [],       // [{ idx, start_at_sec, duration_sec, script_chunk_th, bg_query_en, bg_url, preview }]
  storyboardLoading: false,   // true while /api/ai/avatar-scenes is splitting the script
  storyboardOpenSlot: -1,     // which slot's Pexels picker is expanded (-1 = none)
  storyboardSlotCands: {},    // { [slotIdx]: [pexels videos] } — cached candidate sets per slot
  storyboardSearch: {},       // { [slotIdx]: 'free-text query' } — per-slot custom search override
  previewAspect: '4:5',    // 1:1 | 4:5 | 9:16  — aspect for post preview + PNG download
  previewIndex: 0,         // current slide in carousel
  sidebarOpen: false,      // mobile drawer state (≤768px) — toggled by the hamburger button
  profileMenuOpen: false,  // topbar profile dropdown — opened by clicking the .profilePill
};

// If a pre-boot IIFE in index.html already published window.PP.state, adopt
// THAT reference so the inline script + the modules share one object. If
// not (e.g. running in a test environment or before the inline pre-boot
// landed), create the defaults here and publish them so the inline boot
// adopts ours when it runs. Either branch ends with a single shared ref.
// Deep-clone the defaults so mutations to state.channels / state.voice / …
// don't leak back into DEFAULTS (which would corrupt a second _initState()
// call in a fresh test harness). structuredClone handles nested objects
// + arrays uniformly; falls back to JSON for older runtimes.
function _cloneDefaults() {
  if (typeof structuredClone === 'function') return structuredClone(DEFAULTS);
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function _initState() {
  if (typeof window !== 'undefined') {
    window.PP = window.PP || {};
    if (window.PP.state && typeof window.PP.state === 'object') {
      // Pre-boot already created the canonical object. Fill in any missing
      // defaults (so a forgotten key on the inline side doesn't break us)
      // and adopt the reference.
      for (const k in DEFAULTS) {
        if (!(k in window.PP.state)) window.PP.state[k] = _cloneDefaults()[k];
      }
      return window.PP.state;
    }
    // No pre-boot — we own the canonical object. Publish it.
    const fresh = _cloneDefaults();
    window.PP.state = fresh;
    return fresh;
  }
  return _cloneDefaults();
}

export const state = _initState();

// Boot-time localStorage rehydration. Mirrors the inline IIFE in index.html
// (postpost_active_brand, postpost_drafts, postpost_custom_avatars). The
// brand-validation step is omitted here — main.js calls loadState() AFTER
// importing BRANDS, so the inline copy handles brand-existence checking.
// This module's job is just to populate the persisted fields.
export function loadState() {
  try {
    const sb = localStorage.getItem('postpost_active_brand');
    if (sb) state.brand = sb;
  } catch (_) {}
  try {
    const dr = localStorage.getItem('postpost_drafts');
    if (dr) state.drafts = JSON.parse(dr) || [];
  } catch (_) {}
  try {
    const ca = localStorage.getItem('postpost_custom_avatars');
    if (ca) state.customAvatars = JSON.parse(ca) || [];
  } catch (_) {}
}

// Convenience: persist a single state key. Currently only used by the
// brand-switcher (postpost_active_brand). Extracted-page code routes
// through saveBrands() / saveCustomAvatars() in data/* instead.
export function saveStateField(key) {
  try {
    const lsKey = 'postpost_' + key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
    localStorage.setItem(lsKey, JSON.stringify(state[key]));
  } catch (_) {}
}
