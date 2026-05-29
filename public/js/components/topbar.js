// public/js/components/topbar.js
//
// The fixed top bar above every authenticated page. Renders the
// hamburger (mobile drawer toggle), breadcrumb, channel widget, search,
// language picker, and the profile pill that pops the profile menu.
//
// Profile menu (drop-down + detail modal) lives in its own module
// (components/profile-menu.js) — this file just embeds the result.
//
// Pure render. All clicks are dispatched from the inline event-delegation
// block via data-* (data-mobilemenu, data-profilemenu, data-lang, etc.).

import { state } from '../state.js';
import { T } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { BRANDS } from '../data/brands.js';
import { profileMenuHTML, accountIdentity } from './profile-menu.js';

export function topbarHTML() {
  const crumb = (() => {
    const map = {
      profile: T('Profile', 'Profile'), topics: 'Topic Bank',
      caption: T('สร้าง Caption', 'Generate Caption'),
      creative: T('สร้าง Creative', 'Generate Creative'),
      avatar: 'Talking Avatar', textvideo: 'Text to Video',
      automation: 'Automation Log', analytics: 'Analytics',
      calendar: T('ปฏิทิน', 'Calendar'), library: T('คลังคอนเทนต์', 'Library'),
    };
    return map[state.page] || '';
  })();
  const acct = accountIdentity();
  return `<div class="topbar">
    <div class="topLeft" style="display:flex;align-items:center;gap:10px;min-width:0;flex:1">
      <!-- Hamburger — only visible ≤768px via CSS — opens the sidebar drawer -->
      <button class="mobileMenuBtn" data-mobilemenu="1" aria-label="${T('เมนู', 'Menu')}">
        ${I('menu', 20, '#5B21B6')}
      </button>
      <div class="breadcrumb">
        <span>Workspace</span>
        ${I('chev_right', 12)}
        <span class="crumb-current">${crumb}</span>
      </div>
    </div>
    <div class="topRight">
      <div class="search">
        ${I('search', 16, '#6B6473')}
        <input placeholder="${T('ค้นหาโพสต์, สินค้า, หัวข้อ...', 'Search posts, products, topics...')}" />
        <span class="searchKbd">⌘K</span>
      </div>
      <div class="chWidget" title="${T('เชื่อมต่อ ช่องทางโพสต์', 'Connected channels')}">
        ${(function () {
          const ab = BRANDS.find((b) => b.id === state.brand) || BRANDS[0];
          const ch = (ab && ab.ch) || [];
          const cols = { facebook: '#1877F2', instagram: '#E1306C', tiktok: '#0F172A' };
          const icons = ['facebook', 'instagram', 'tiktok'].map((k) => {
            const on = ch.indexOf(k) >= 0;
            return '<div' + (on ? '' : ' class="off"') + '>' + I(k, 16, cols[k]) + '<span class="chDot' + (on ? '' : ' warn') + '"></span></div>';
          }).join('');
          return '<div class="chStack">' + icons + '</div>'
            + '<div><span>' + T(ch.length + ' จาก 3', ch.length + ' of 3') + '</span><small>' + T('เชื่อมต่อแล้ว', 'connected') + '</small></div>';
        })()}
        ${I('chev_down', 12)}
      </div>
      <div class="lang"><button class="${state.lang === 'th' ? 'active' : ''}" data-lang="th">ไทย</button><button class="${state.lang === 'en' ? 'active' : ''}" data-lang="en">EN</button></div>
      <button class="iconBtn bell">${I('bell', 18)}</button>
      <div style="position:relative">
        <button class="profilePill" data-profilemenu="1">
          <div class="av">${escText(acct.initial)}</div>
          <div><span>${escText(acct.name)}</span><small>${escText(acct.roleLabel)}</small></div>
          ${I('chev_down', 12)}
        </button>
        ${state.profileMenuOpen ? profileMenuHTML() : ''}
      </div>
    </div>
  </div>`;
}
