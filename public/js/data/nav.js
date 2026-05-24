// public/js/data/nav.js
//
// Sidebar navigation taxonomy — split into "workspace" (creator tools) and
// "ops" (analytics / scheduling / inventory). Each item:
//   { id, icon, label: { th, en }, [tag], [badge] }
//
// `id` doubles as the state.page key, so renaming requires updating the
// PAGES router map too. `tag` shows a small uppercase pill (NEW); `badge`
// shows a numeric count (notifications / pending items).

export const NAV = {
  workspace: [
    { id: 'profile',  icon: 'users',     label: { th: 'Profile', en: 'Profile' } },
    { id: 'topics',   icon: 'lightbulb', label: { th: 'Topic Bank', en: 'Topic Bank' } },
    { id: 'caption',  icon: 'wand',      label: { th: 'สร้าง Caption', en: 'Generate Caption' } },
    { id: 'creative', icon: 'image',     label: { th: 'สร้าง Creative', en: 'Generate Creative' } },
    { id: 'avatar',   icon: 'bot',       label: { th: 'Talking Avatar', en: 'Talking Avatar' }, tag: 'NEW' },
    { id: 'textvideo',icon: 'video',     label: { th: 'Text to Video', en: 'Text to Video' }, tag: 'NEW' },
  ],
  ops: [
    { id: 'automation', icon: 'play-circle', label: { th: 'Automation Log', en: 'Automation Log' }, badge: 3 },
    { id: 'analytics',  icon: 'trending',    label: { th: 'Analytics', en: 'Analytics' } },
    { id: 'calendar',   icon: 'calendar',    label: { th: 'ปฏิทิน', en: 'Calendar' }, badge: 12 },
    { id: 'library',    icon: 'library',     label: { th: 'คลังคอนเทนต์', en: 'Library' } },
  ],
};
