// public/js/data/avatars.js
//
// Talking-Avatar presenter catalog — four built-in synthetic faces plus a
// localStorage-persisted slot for user-uploaded / AI-generated portraits
// (`state.customAvatars`). The built-ins live forever in this module; the
// custom list lives on state.customAvatars and is mirrored to localStorage.
//
// Image compression: portraits are downscaled to 480×480 JPEG @ 0.82
// quality before saving so a handful fit inside the ~5MB localStorage
// budget (a raw camera shot is easily 3MB on its own).
//
// Cloud sync: saveCustomAvatars() pokes window.PP.schedCloudPush() if the
// inline cloud-push helper has been wired up. Same bridge pattern as
// data/brands.js — the hook is optional and silently no-ops when missing.

import { compressImageDataUrl } from '../idb.js';
import { state } from '../state.js';

export const AVATARS = [
  { id: 'mintra', name_th: 'มินตรา',      name_en: 'Mintra', sub_th: 'หญิงไทย 28', sub_en: 'Thai F · 28', bg: 'linear-gradient(180deg,#FCD9A8,#F97316)', initial_th: 'ม', initial_en: 'M' },
  { id: 'phum',   name_th: 'ภูมิ',         name_en: 'Phum',   sub_th: 'ชายไทย 35', sub_en: 'Thai M · 35', bg: 'linear-gradient(180deg,#C7D2FE,#4F46E5)', initial_th: 'ภ', initial_en: 'P' },
  { id: 'rose',   name_th: 'น้องโรส',      name_en: 'Rose',   sub_th: 'หญิง 22',     sub_en: 'F · 22',     bg: 'linear-gradient(180deg,#FBCFE8,#DB2777)', initial_th: 'ร', initial_en: 'R' },
  { id: 'wuth',   name_th: 'อาจารย์วุฒิ',  name_en: 'Wuth',   sub_th: 'อาวุโส 55',   sub_en: 'Senior · 55',bg: 'linear-gradient(180deg,#FEF3C7,#92400E)', initial_th: 'ว', initial_en: 'W' },
];

// 480×480 JPEG @ 0.82 — small enough that 4-5 portraits fit in localStorage
// alongside drafts + brands, big enough to look crisp in the avatar tile
// and the TTS preview frame.
export async function compressAvatarImage(src) {
  try { return await compressImageDataUrl(src, 480, 0.82); }
  catch (_) { return src; }
}

// Pull the persisted custom-avatar list out of localStorage into
// state.customAvatars. Called once at boot from main.js (alongside the
// brand + draft rehydration).
export function loadCustomAvatars() {
  try {
    const raw = localStorage.getItem('postpost_custom_avatars');
    if (raw) state.customAvatars = JSON.parse(raw) || [];
  } catch (_) {}
}

// Persist state.customAvatars to localStorage. If we hit a quota error
// (typically: user has too many big portraits), drop the oldest and try
// once more — preserving the most recent uploads is the friendlier UX.
// The toast import would cause a circular edge (toast → no edges, but
// we keep this dependency-free by using a bridge); if window.PP.toast
// exists we use it, else we silently swallow the error.
export function saveCustomAvatars() {
  const arr = state.customAvatars || [];
  try {
    localStorage.setItem('postpost_custom_avatars', JSON.stringify(arr));
  } catch (_) {
    try {
      if (arr.length > 1) {
        const trimmed = arr.slice(1);
        state.customAvatars = trimmed;
        localStorage.setItem('postpost_custom_avatars', JSON.stringify(trimmed));
      }
    } catch (_) {
      try {
        if (window.PP && typeof window.PP.toast === 'function') {
          const lang = state.lang;
          window.PP.toast(
            lang === 'th'
              ? 'พื้นที่เก็บใกล้เต็ม — บันทึกผู้บรรยายไม่สำเร็จ'
              : 'Storage full — could not save presenter',
            'error',
          );
        }
      } catch (_) {}
    }
  }
  try {
    if (window.PP && typeof window.PP.schedCloudPush === 'function') {
      window.PP.schedCloudPush();
    }
  } catch (_) {}
}

// Add a new custom avatar (after compressing its image), then persist.
// Also flips state.avatar to the new one so the UI shows it as selected.
export async function addCustomAvatar(av) {
  av.image = await compressAvatarImage(av.image);
  state.customAvatars = (state.customAvatars || []).concat([av]);
  state.avatar = av.id;
  saveCustomAvatars();
}

// Remove a custom avatar by id (with confirm prompt). If the deleted one
// was the active avatar, fall back to the first built-in. Caller is
// responsible for triggering a re-render after this returns true.
export function deleteCustomAvatar(id) {
  const lang = state.lang;
  if (!confirm(lang === 'th' ? 'ลบผู้บรรยายนี้?' : 'Delete this presenter?')) return false;
  state.customAvatars = (state.customAvatars || []).filter((x) => x.id !== id);
  if (state.avatar === id) {
    state.avatar = AVATARS[0] ? AVATARS[0].id : '';
  }
  saveCustomAvatars();
  return true;
}
