// public/js/data/avatar-bg-scenes.js
//
// Background-scene presets for the Talking Avatar phone preview.
// Each scene maps to a Pexels search query (`q`) used when the user picks
// the preset chip. The 'auto' preset is special-cased in
// resolveAvatarBgQuery() — its q is computed at run time from the active
// brand's bizType. 'off' and 'upload' aren't backed by Pexels at all
// (gradient base / user-supplied video respectively).
//
// `local` (when present) points at a bundled MP4 in /assets/avatar-bg/
// that the preview uses as an instant first candidate before the Pexels
// fetch resolves — no flicker on scene change.

export const AVATAR_BG_SCENES = [
  { id: 'auto',     th: 'อัตโนมัติ', en: 'Auto',     icon: 'sparkles' },
  { id: 'studio',   th: 'สตูดิโอ',   en: 'Studio',   icon: 'image',     q: 'minimal studio backdrop neutral' },
  { id: 'cafe',     th: 'คาเฟ่',     en: 'Cafe',     icon: 'store',     q: 'cafe coffee warm bokeh' },
  { id: 'beach',    th: 'ทะเล',     en: 'Beach',    icon: 'zap',       q: 'beach ocean sunset slow' },
  { id: 'beauty',   th: 'บิวตี้',    en: 'Beauty',   icon: 'wand',      q: 'skincare beauty pink soft' },
  { id: 'mystical', th: 'สายมู',     en: 'Mystical', icon: 'lightbulb', q: 'mystical candle dark smoke',
    local: '/assets/avatar-bg/mystical-portrait.mp4' },                                // bundled: dark mystical 9:16, 15s loop, ~800KB
  { id: 'altar',    th: 'แท่นบูชา',  en: 'Altar',    icon: 'lightbulb',
    local: '/assets/avatar-bg/mystical-square.mp4' },                                  // bundled: square mystical, 30s loop, ~650KB
  { id: 'off',      th: 'ปิด BG',    en: 'Off',      icon: 'x' },
  { id: 'upload',   th: 'อัปโหลด',   en: 'Upload',   icon: 'upload' },
];
