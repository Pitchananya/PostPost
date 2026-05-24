// public/js/icons.js
//
// Inline-SVG icon set. `I(name, size, color)` returns the HTML string for
// a 24×24 stroke-based icon; `LOGO_ICON(size, fg, bg)` returns the PostPost
// wordmark glyph. Pure module — no state dependency.
//
// Output is HTML, so call sites must wrap the return value in `raw()` when
// passing to the html`` tagged template:
//
//   import { html, raw } from './html.js';
//   import { I, LOGO_ICON } from './icons.js';
//   html`<span>${raw(I('bell', 18))}</span>`;

// Path map kept exported so future tooling (icon picker, validation) can
// enumerate available names without parsing source.
export const ICONS = {
  home: '<path d="M3 11l9-8 9 8M5 9.5V21h14V9.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  logout: '<path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M3 21c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="3"/><path d="M15 21c0-2 1.5-4 4-4s3 1 3 3"/>',
  lightbulb: '<path d="M9 18h6M10 21h4M12 2a6 6 0 016 6c0 2.5-1 4-2.5 5.5C14 14.5 13.5 16 13.5 17.5h-3c0-1.5-.5-3-2-4C7 12 6 10.5 6 8a6 6 0 016-6z"/>',
  wand: '<path d="M3 21l9-9M9 5l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM19 13l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><circle cx="9" cy="14" r="1.5"/><circle cx="15" cy="14" r="1.5"/><path d="M12 8V4M9 4h6"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/>',
  'play-circle': '<circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>',
  trending: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  chart: '<path d="M3 21V3M3 21h18M7 17v-6M11 17V9M15 17v-4M19 17V7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  library: '<path d="M4 4v16M4 4h12a3 3 0 010 6H4M4 10h14a3 3 0 010 6H4M4 16h12"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1l1.5 3.5L17 6l-1 3 3 2-3 2 1 3-3.5.5L12 20l-1.5-3.5L7 16l1-3-3-2 3-2-1-3 3.5-.5z"/>',
  bell: '<path d="M6 17V11a6 6 0 0112 0v6l2 2H4l2-2zM10 21h4"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M21 21l-5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<polyline points="4 12 10 18 20 6"/>',
  x: '<path d="M5 5l14 14M19 5L5 19"/>',
  chev_down: '<polyline points="6 9 12 15 18 9"/>',
  chev_right: '<polyline points="9 6 15 12 9 18"/>',
  chev_left: '<polyline points="15 6 9 12 15 18"/>',
  chev_up: '<polyline points="18 15 12 9 6 15"/>',
  sparkles: '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8L16.5 18.5l1.8-.7z"/>',
  facebook: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" fill="currentColor" stroke="none"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
  tiktok: '<path d="M16 8c2 1 4 1 5 1V5c-1 0-3-1-4-2h-4v13a3 3 0 11-3-3v-4a7 7 0 107 7V9z" fill="currentColor" stroke="none"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="3"/><polygon points="10 9 16 12 10 15" fill="currentColor" stroke="none"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  refresh: '<path d="M3 12a9 9 0 0115-6l3 3M21 3v6h-6M21 12a9 9 0 01-15 6l-3-3M3 21v-6h6"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  external: '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>',
  rocket: '<path d="M5 19l-2-2 3-3-2-2 9-9 4 4-9 9-2-2-3 3zM14 5l5 5M3 14l3 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
  package: '<path d="M21 8v8a2 2 0 01-1 1.7l-7 4a2 2 0 01-2 0l-7-4A2 2 0 013 16V8a2 2 0 011-1.7l7-4a2 2 0 012 0l7 4A2 2 0 0121 8z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
  store: '<path d="M3 9l1-5h16l1 5M3 9v11h18V9M3 9h18M9 14h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h0"/>',
  alert: '<path d="M12 2L2 21h20zM12 9v5M12 18h0"/>',
  type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="9" r="2"/><polyline points="21 15 16 10 4 21"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  link: '<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  google: '<path d="M22 12a10 10 0 11-3-7l-3 3a6 6 0 100 8h-6v-4h10z" fill="currentColor" stroke="none"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6"/>',
};

export const I = (name, size = 16, color = 'currentColor') => {
  const path = ICONS[name] || ICONS.x;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
};

// PP wordmark — orange P + purple P + play triangle + document outline.
// Default colors match the brand palette (orange + dark purple); login screen
// passes white-on-orange overrides for the dark sidebar.
export const LOGO_ICON = (size = 36, orangeColor = '#FF7A1A', purpleColor = '#261447') =>
  `<span class="logoIcon"><svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 6h13a11 11 0 010 22h-6v18h-7V6zm7 7v8h6a4 4 0 000-8h-6z" fill="${orangeColor}"/>
  <path d="M22 6h13a11 11 0 010 22h-6v18h-7V6zm7 7v8h6a4 4 0 000-8h-6z" fill="${purpleColor}"/>
  <path d="M48 10l9 5.5-9 5.5z" fill="${orangeColor}"/>
  <rect x="38" y="40" width="22" height="16" rx="2.5" stroke="${orangeColor}" stroke-width="2.4" fill="none"/>
  <line x1="42" y1="46" x2="56" y2="46" stroke="${orangeColor}" stroke-width="2" stroke-linecap="round"/>
  <line x1="42" y1="50" x2="54" y2="50" stroke="${orangeColor}" stroke-width="2" stroke-linecap="round"/>
</svg></span>`;
