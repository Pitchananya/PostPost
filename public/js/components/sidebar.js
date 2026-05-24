// public/js/components/sidebar.js
//
// The persistent left-rail navigation. Renders the brand workspace card,
// the two nav groups (Workspace + Operations), and the bottom credits +
// sign-out footer. Pure render — no event handlers (clicks are dispatched
// from the inline event-delegation block via data-* attributes).
//
// Mirrors the inline sidebarHTML() in index.html exactly. The render()
// function wraps the returned string with `class="sidebar open"` (mobile
// drawer state) before injecting into #root.

import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I, LOGO_ICON } from '../icons.js';
import { NAV } from '../data/nav.js';

export function sidebarHTML() {
  const navItem = (n) => `<button class="navBtn ${state.page === n.id ? 'active' : ''}" data-go="${n.id}">
    <span class="navIco">${I(n.icon, 14)}</span>
    <span class="navLab">${t(n.label)}</span>
    ${n.tag ? `<span class="tag">${n.tag}</span>` : ''}
    ${n.badge ? `<span class="badge">${n.badge}</span>` : ''}
  </button>`;
  return `<aside class="sidebar">
    <div class="brand" style="flex-direction:column;align-items:flex-start;gap:6px;padding:8px 6px 14px">
      <div style="display:flex;align-items:center;gap:10px">
        ${LOGO_ICON(32, '#FF7A1A', '#FFFFFF')}
        <div class="logoWord" style="font-size:22px"><span class="a">Post</span><span class="b">Post</span></div>
      </div>
      <div style="color:#9C8BB8;font-size:10.5px;letter-spacing:.05em;font-weight:600;padding-left:2px">${T('AI Content Command Center', 'AI Content Command Center')}</div>
    </div>
    <div class="workspace" data-go="profile">
      <div class="mark">HP</div>
      <div class="wsInfo">
        <b>HappyPrice Shop</b>
        <small>${T('Pro · 2 ทีม · Shopee sync', 'Pro · 2 seats · Shopee sync')}</small>
      </div>
      ${I('chev_down', 14, '#CFC3DF')}
    </div>
    <div class="navScroll">
      <div class="navGroup">
        <div class="navLabel">${T('Workspace', 'Workspace')}</div>
        <nav class="nav">${NAV.workspace.map(navItem).join('')}</nav>
      </div>
      <div class="navGroup">
        <div class="navLabel">${T('Operations', 'Operations')}</div>
        <nav class="nav">${NAV.ops.map(navItem).join('')}</nav>
      </div>
    </div>
    <div class="sidebarFoot">
      <div class="credCard">
        <div class="credLabel">
          <span>${T('เครดิตคงเหลือ', 'Credits left')}</span>
          ${I('zap', 12, '#FFD1A4')}
        </div>
        <div class="credNum">342 <span style="font-size:11px;color:#CFC3DF;font-weight:600">/ 500</span></div>
        <div class="credBar"><div class="credFill"></div></div>
        <div class="credSub">${T('รีเซ็ต 1 ธ.ค.', 'Resets Dec 1')}</div>
      </div>
      <button class="logout" data-go="landing">
        ${I('chev_left', 14)}
        <span>${T('ออกจากระบบ', 'Sign out')}</span>
      </button>
    </div>
  </aside>`;
}
