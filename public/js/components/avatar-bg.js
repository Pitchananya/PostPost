// public/js/components/avatar-bg.js
//
// Talking-Avatar phone-preview background helpers.
//
//   resolveAvatarBgQuery() → string
//     Picks the Pexels search query for the current `state.avatarBgScene`.
//     'auto' falls back to the active brand's bizType (preserves the
//     original behavior). Free-text `state.avatarBgSearch` ALWAYS wins
//     when set.
//
//   fetchAvatarBg(opts) → void (effectful — mutates state, schedules render)
//     Pre-pins a local bundled MP4 as candidate[0] (no flicker), then
//     fetches 8 Pexels candidates for the picker grid. Toggles
//     `state.avatarBgLoading` and re-renders on completion.
//
//   setupAvatarBgRotation() → void (effectful — wires DOM timer)
//     Re-wires the rotation timer on every render so it stays in sync
//     with scene/interval changes. Idempotent — safe to call from the
//     render() tick AND from the canvas loop's periodic light-touch.
//
// Bridge: also re-exposed on window.PP so the inline event handlers that
// haven't been extracted yet (Phase 3e) can keep calling these by name.
// The inline copies in index.html now delegate to window.PP.* for
// consistency (single source of truth).

import { state } from '../state.js';
import { BRANDS } from '../data/brands.js';
import { AVATAR_BG_SCENES } from '../data/avatar-bg-scenes.js';

// Pull api + render at call time — both live on window.PP, both can swap
// across the dual-copy state bridge.
function api(...args) { return window.PP.api(...args); }
function render() { return window.PP.render && window.PP.render(); }

export function resolveAvatarBgQuery() {
  const custom = (state.avatarBgSearch || '').trim();
  if (custom) return custom;
  const sceneId = state.avatarBgScene || 'auto';
  if (sceneId === 'auto') {
    const ab = BRANDS.filter((b) => b.id === state.brand)[0] || BRANDS[0];
    const biz = (ab && ab.bizType || '').toLowerCase();
    return /ดูดวง|สายมู|tarot/.test(biz) ? 'mystical candle dark'
      : /สกินแคร์|ความงาม|beauty/.test(biz) ? 'skincare beauty pink'
      : /อาหาร|food|กาแฟ|coffee/.test(biz) ? 'cafe coffee warm'
      : /ฟิตเนส|fit|sport/.test(biz) ? 'gym workout fitness'
      : 'lifestyle aesthetic';
  }
  const sc = AVATAR_BG_SCENES.filter((s) => s.id === sceneId)[0];
  return (sc && sc.q) || 'lifestyle aesthetic';
}

export function fetchAvatarBg(opts) {
  opts = opts || {};
  if (!window.PP) return;
  const sceneId = state.avatarBgScene || 'auto';
  if (sceneId === 'off' || sceneId === 'upload') return;
  const hasCustom = !!(state.avatarBgSearch || '').trim();

  // ── Step 1: instant local-pin candidate (no flicker) ──
  let localPin = null;
  if (!hasCustom) {
    const sc = AVATAR_BG_SCENES.filter((s) => s.id === sceneId)[0];
    if (sc && sc.local) {
      localPin = { url: sc.local, preview: '', user: 'PostPost', page: '', isLocal: true,
        label_th: sc.th, label_en: sc.en, duration: 0 };
    } else if (sceneId === 'auto') {
      const ab = BRANDS.filter((b) => b.id === state.brand)[0] || BRANDS[0];
      const biz = (ab && ab.bizType || '').toLowerCase();
      if (/ดูดวง|สายมู|tarot/.test(biz)) {
        localPin = { url: '/assets/avatar-bg/mystical-portrait.mp4', preview: '',
          user: 'PostPost', page: '', isLocal: true,
          label_th: 'สายมู (built-in)', label_en: 'Mystical (built-in)', duration: 0 };
      }
    }
  }
  if (localPin) {
    state.avatarPreviewBgUrl = localPin.url;
    if (!opts.keepPicked) state.avatarBgPickedUrl = '';
    state.avatarBgCandidates = [localPin];
  }

  // ── Step 2: fetch 8 Pexels candidates ──
  state.avatarBgLoading = true;
  const query = resolveAvatarBgQuery();
  api('/api/ai/pexels-video-search?q=' + encodeURIComponent(query) + '&per_page=8&orientation=portrait')
    .then((r) => {
      const vids = (r && r.videos) || [];
      state.avatarBgCandidates = localPin ? [localPin].concat(vids) : vids;
      if (!state.avatarBgCandidates.length) {
        state.avatarPreviewBgUrl = '/assets/avatar-bg/mystical-portrait.mp4';
      } else if (!opts.keepPicked && !state.avatarBgPickedUrl) {
        state.avatarPreviewBgUrl = state.avatarBgCandidates[0].url;
      }
    })
    .catch(() => {
      // Pexels failed — keep just the local pin (or fall back to bundled mystical)
      if (!state.avatarBgCandidates.length) {
        state.avatarBgCandidates = localPin ? [localPin] : [];
        state.avatarPreviewBgUrl = (localPin && localPin.url) || '/assets/avatar-bg/mystical-portrait.mp4';
      }
    })
    .then(() => { state.avatarBgLoading = false; render(); });
}

// Module-level so we can clear across renders.
let _avatarBgRotateTimer = null;
export function setupAvatarBgRotation() {
  if (_avatarBgRotateTimer) { clearInterval(_avatarBgRotateTimer); _avatarBgRotateTimer = null; }
  const interval = state.avatarBgInterval || 0;
  const cands = (state.avatarBgCandidates || []).filter((c) => c && c.url);
  if (interval <= 0 || cands.length < 2) return;
  const vid = document.querySelector('video[data-rotate-bg]');
  if (!vid) return;
  // Start the cycle at whichever candidate matches the current src — keeps the
  // visual continuous when the interval was just toggled on.
  let idx = Math.max(0, cands.findIndex((c) => c.url === vid.getAttribute('src')));
  if (idx < 0) idx = 0;
  _avatarBgRotateTimer = setInterval(() => {
    idx = (idx + 1) % cands.length;
    const next = cands[idx].url;
    vid.style.opacity = '0';
    setTimeout(() => {
      try {
        vid.src = next;
        vid.load();
        vid.play().catch(() => {});
        state.avatarBgRotateIdx = idx;
      } catch (_) {}
      vid.style.opacity = '1';
    }, 220);
  }, interval * 1000);
}
