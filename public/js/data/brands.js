// public/js/data/brands.js
//
// Multi-brand catalog — the workspace switcher chips in the sidebar +
// every page that scopes to a brand reads from this list. The exported
// `BRANDS` is the SAME mutable array reference across all importers, so
// cross-module pushes/splices stay in sync (we share the array, not a
// snapshot — Object.freeze would break the brand-edit flow).
//
//   import { BRANDS, saveBrands } from './data/brands.js';
//   BRANDS.push(normalizeBrand({ name: 'New Brand' }));
//   saveBrands();   // localStorage + cloud push
//
// Phase-3 bridge: `saveBrands()` needs to trigger schedCloudPush(), which
// is still inline in index.html (cloud-sync extraction is a later phase).
// We look it up on window.PP at call-time so the bridge can be wired up
// AFTER this module first loads. If the hook isn't present (e.g. before
// the inline script finishes booting) we just skip the cloud push — the
// next mutation will retry.

import { normalizeBrand } from './brand-normalize.js';
export { normalizeBrand };

// Seed = one neutral starter brand. The old demo brands (HappyPrice /
// MintNature / คาเฟ่บ้านน้ำใจ / คุรุเทพ) were removed; the inline boot in
// index.html (stripDemoBrands) also clears them from persisted/cloud state.
// The inline BRANDS is the source of truth and syncs into this module via
// main.js, so this seed only shows for a brand-new session before that sync.
const SEED_BRANDS = [
  { id: 'mybrand', name: 'แบรนด์ของฉัน', sub_th: 'ตั้งค่าแบรนด์ของคุณ', sub_en: 'Set up your brand', mark: 'MY', color: 'linear-gradient(135deg,#FB923C,#F97316)', ch: [], bizType: '' },
];

export const MAX_BRANDS = 5;

// Single mutable array — importers share this reference. To replace contents
// in-place (e.g. after loadBrands() pulls from localStorage), use
// BRANDS.splice(0, BRANDS.length, ...newArray). That keeps every existing
// reference pointing at the same array.
export const BRANDS = SEED_BRANDS.map(normalizeBrand);

// Read the persisted brand list out of localStorage (if any) and splice it
// into the mutable BRANDS array. Called once during main.js boot before any
// page renders. Returns the resulting BRANDS reference for convenience.
export function loadBrands() {
  try {
    const saved = localStorage.getItem('postpost_brands');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        BRANDS.splice(0, BRANDS.length, ...parsed.map(normalizeBrand));
      }
    }
  } catch (_) {}
  return BRANDS;
}

// Write the current BRANDS array to localStorage and schedule a cloud
// push. The cloud-sync function is still inline (window.PP.schedCloudPush);
// once cloud-sync gets extracted (later phase) this becomes a direct import.
export function saveBrands() {
  try { localStorage.setItem('postpost_brands', JSON.stringify(BRANDS)); }
  catch (_) {}
  try {
    if (window.PP && typeof window.PP.schedCloudPush === 'function') {
      window.PP.schedCloudPush();
    }
  } catch (_) {}
}
