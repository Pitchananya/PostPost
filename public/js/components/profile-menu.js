// public/js/components/profile-menu.js
//
// The dropdown that pops down from the .profilePill in the topbar, plus
// the openProfileDetail() modal triggered by its "View full profile" /
// "Usage" / "Settings" items.
//
// Visibility is driven by state.profileMenuOpen — the inline event
// delegation toggles that flag and re-renders. The modal is built on the
// fly + appended to <body>, so it doesn't need a render-pass slot.
//
// openProfileDetail() is exported and re-published on window.PP so the
// inline data-profileview click handler (still in index.html) can call
// the module version directly.

import { state } from '../state.js';
import { T } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { BRANDS } from '../data/brands.js';

export function profileMenuHTML() {
  const ab = BRANDS.filter((b) => b.id === state.brand)[0] || BRANDS[0] || {};
  const brandCount = BRANDS.length;
  const draftCount = (state.drafts || []).length;
  const avatarCount = (state.customAvatars || []).length;
  const roleLabel = T('Owner · เจ้าของ workspace', 'Owner · Workspace owner');
  const emailLabel = 'jeffyaitrand@gmail.com';

  const item = (icon, th, en, attr, color) => {
    color = color || 'var(--ink)';
    return '<button class="pmItem" ' + (attr || '') + ' style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;background:none;border:0;cursor:pointer;font-size:13px;color:' + color + ';text-align:left">'
      + '<span style="width:18px;display:inline-flex;justify-content:center">' + I(icon, 15, color) + '</span>'
      + '<span style="flex:1">' + T(th, en) + '</span>'
      + '<span style="color:var(--muted)">' + I('chev_right', 12, 'var(--muted)') + '</span>'
      + '</button>';
  };

  return ''
    + '<div class="profileMenu" style="position:absolute;top:calc(100% + 8px);right:0;width:300px;max-width:calc(100vw - 24px);background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 16px 48px rgba(15,8,30,.18);z-index:60;overflow:hidden;animation:fade .15s ease">'
    + '<div style="padding:18px 16px;background:linear-gradient(135deg,#FFF7ED,#FFE4E6);border-bottom:1px solid var(--line)">'
    +   '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">'
    +     '<div style="width:48px;height:48px;border-radius:99px;background:linear-gradient(135deg,#FF7A1A,#EC4899);color:#fff;display:grid;place-items:center;font-size:20px;font-weight:900;flex-shrink:0">' + T('ป', 'P') + '</div>'
    +     '<div style="flex:1;min-width:0">'
    +       '<div style="font-size:14px;font-weight:800;color:var(--ink)">' + T('ปอย แสงทอง', 'Poy Sangthong') + '</div>'
    +       '<div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + emailLabel + '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,122,26,.15);color:#9A3412;padding:3px 9px;border-radius:99px;font-size:10.5px;font-weight:800">'
    +     I('zap', 10, '#9A3412') + ' ' + roleLabel
    +   '</div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);text-align:center;padding:14px 8px;background:var(--cream2);border-bottom:1px solid var(--line)">'
    +   '<div><div style="font-size:18px;font-weight:900;color:var(--purple)">' + brandCount + '</div><div style="font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">' + T('แบรนด์', 'Brands') + '</div></div>'
    +   '<div><div style="font-size:18px;font-weight:900;color:var(--purple)">' + draftCount + '</div><div style="font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">' + T('ดราฟ', 'Drafts') + '</div></div>'
    +   '<div><div style="font-size:18px;font-weight:900;color:var(--purple)">' + avatarCount + '</div><div style="font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">' + T('อวตาร', 'Avatars') + '</div></div>'
    + '</div>'
    + '<div style="padding:10px 14px;border-bottom:1px solid var(--line)">'
    +   '<div style="font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px">' + T('Workspace ปัจจุบัน', 'Current workspace') + '</div>'
    +   '<div style="display:flex;align-items:center;gap:10px">'
    +     '<div style="width:34px;height:34px;border-radius:9px;background:' + (ab.color || 'linear-gradient(135deg,#FF7A1A,#EC4899)') + ';color:#fff;display:grid;place-items:center;font-size:13px;font-weight:900;flex-shrink:0">' + (ab.mark || 'P') + '</div>'
    +     '<div style="flex:1;min-width:0">'
    +       '<div style="font-size:13px;font-weight:700;color:var(--ink)">' + escText(ab.name || 'HappyPrice Shop') + '</div>'
    +       '<div style="font-size:10.5px;color:var(--muted)">' + T('Pro plan · 2 ที่นั่ง · Shopee sync', 'Pro · 2 seats · Shopee sync') + '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '<div style="padding:6px 0">'
    +   item('user',     'ดูโปรไฟล์เต็ม',          'View full profile',  'data-profileview="1"')
    +   item('users',    'จัดการทีม / สมาชิก',    'Team & members',     'data-go="profile"')
    +   item('zap',      'การใช้งานและเครดิต',     'Usage & credits',    'data-profileview="usage"', '#9A3412')
    +   item('bell',     'การแจ้งเตือน',           'Notifications',      'data-profileview="notif"')
    +   item('settings', 'การตั้งค่าบัญชี',         'Account settings',   'data-profileview="settings"')
    +   item('info',     'ความช่วยเหลือ / คู่มือ', 'Help & guides',      'data-profileview="help"')
    + '</div>'
    + '<div style="border-top:1px solid var(--line);padding:6px 0">'
    +   item('logout', 'ออกจากระบบ', 'Sign out', 'data-signout="1"', '#DC2626')
    + '</div>'
    + '</div>';
}

// Full-profile detail modal — opened by the data-profileview action items
// in the dropdown. `view` selects which section to render (usage | notif |
// settings | help | profile-default).
export function openProfileDetail(view) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,8,30,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(4px);animation:fade .2s ease';
  const ab = BRANDS.filter((b) => b.id === state.brand)[0] || BRANDS[0] || {};

  const section = (title_th, title_en, html) =>
    '<div style="margin-bottom:20px"><div style="font-size:10.5px;font-weight:800;color:var(--purple);letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">' + T(title_th, title_en) + '</div>' + html + '</div>';
  const row = (label_th, label_en, value) =>
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px"><span style="color:var(--muted)">' + T(label_th, label_en) + '</span><span style="color:var(--ink);font-weight:600">' + value + '</span></div>';

  let body = '';
  if (view === 'usage') {
    body += section('การใช้งานเดือนนี้', "This month's usage",
      row('คลิป Talking Avatar', 'Talking Avatar clips', (state.drafts || []).filter((d) => d.kind === 'avatar').length + ' ' + T('คลิป', 'clips')) +
      row('คลิป Text-to-Video', 'Text-to-Video clips', (state.drafts || []).filter((d) => d.kind === 'video').length + ' ' + T('คลิป', 'clips')) +
      row('คอนเทนต์ดราฟ', 'Content drafts', (state.drafts || []).filter((d) => !d.kind || d.kind === 'content').length + ' ' + T('รายการ', 'items')) +
      row('พรีเซนเตอร์ที่บันทึก', 'Saved presenters', (state.customAvatars || []).length + ' ' + T('คน', 'people'))
    );
    body += section('เครดิตคงเหลือ', 'Credits remaining',
      '<div style="background:linear-gradient(135deg,#FF7A1A,#EC4899);color:#fff;border-radius:14px;padding:18px;display:flex;justify-content:space-between;align-items:center">' +
      '<div><div style="font-size:11px;opacity:.9">' + T('Pro Plan', 'Pro Plan') + '</div><div style="font-size:28px;font-weight:900;line-height:1.2">412 / 500</div><div style="font-size:11px;opacity:.85">' + T('รีเซ็ตวันที่ 1 ธ.ค.', 'Resets Dec 1') + '</div></div>' +
      '<div style="font-size:36px;opacity:.4">' + I('zap', 36, '#fff') + '</div>' +
      '</div>'
    );
  } else if (view === 'notif') {
    body += section('การแจ้งเตือน', 'Notifications',
      ['คลิปที่ render เสร็จ', 'คอนเทนต์ที่ตั้งเวลาโพสต์', 'การอนุมัติ FB/IG', 'โควต้าเหลือน้อย', 'สมาชิกทีมใหม่'].map((it, i) => {
        const en = ['Render finished', 'Scheduled posts published', 'FB/IG approval', 'Low credit', 'New team member'][i];
        return '<label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px;cursor:pointer"><input type="checkbox" checked style="width:18px;height:18px;accent-color:var(--orange)"/><span style="flex:1">' + T(it, en) + '</span></label>';
      }).join('')
    );
  } else if (view === 'settings') {
    body += section('บัญชี', 'Account', row('Email', 'Email', 'jeffyaitrand@gmail.com') + row('Role', 'Role', 'Owner') + row('สร้างเมื่อ', 'Joined', '2024-08-12'));
    body += section('Workspace', 'Workspace', row('แผน', 'Plan', 'Pro · ฿590/เดือน') + row('ที่นั่ง', 'Seats', '2 of 5') + row('การชำระเงินรอบถัดไป', 'Next billing', '2026-06-23'));
    body += section('การเชื่อมต่อ', 'Integrations',
      ['Facebook · 2 pages', 'Instagram · 1 account', 'TikTok · 1 shop', 'Shopee · happyprice.sh', 'Azure Speech (TH)', 'fal.ai (lipsync)'].map((s) =>
        '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px"><span style="width:10px;height:10px;border-radius:99px;background:#10B981;flex-shrink:0"></span><span style="flex:1">' + escText(s) + '</span><span style="font-size:11px;color:#10B981;font-weight:700">' + T('เชื่อมแล้ว', 'Connected') + '</span></div>'
      ).join('')
    );
  } else if (view === 'help') {
    body += section('คู่มือ', 'Guides',
      [['คู่มือเริ่มต้น (5 นาที)', 'Getting started (5 min)', '#'], ['Talking Avatar — chroma key + lipsync', 'Talking Avatar — chroma + lipsync', '#'], ['การเชื่อม Facebook + Instagram', 'Connect FB + IG', '#'], ['Shopee sync — ขั้นตอน', 'Shopee sync — steps', '#'], ['Storyboard + bg auto-pick', 'Storyboard + auto bg', '#']].map((g) =>
        '<a href="' + g[2] + '" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px;color:var(--ink);text-decoration:none">' + I('library', 15, 'var(--purple)') + '<span style="flex:1">' + T(g[0], g[1]) + '</span>' + I('chev_right', 13, 'var(--muted)') + '</a>'
      ).join('')
    );
    body += section('ติดต่อ', 'Contact',
      '<a href="mailto:support@postpost.ai" style="display:block;background:var(--cream2);border-radius:10px;padding:12px;color:var(--ink);text-decoration:none;font-size:13px">📩 support@postpost.ai</a>'
    );
  } else {
    body += section('ข้อมูลพื้นฐาน', 'Basic info', row('ชื่อ', 'Name', 'ปอย แสงทอง') + row('Email', 'Email', 'jeffyaitrand@gmail.com') + row('Role', 'Role', 'Owner') + row('Workspace', 'Workspace', escText(ab.name || 'HappyPrice Shop')));
    body += section('สถิติของฉัน', 'My activity',
      row('แบรนด์', 'Brands', BRANDS.length) +
      row('คอนเทนต์ดราฟ', 'Drafts', (state.drafts || []).length) +
      row('คลิปวิดีโอ', 'Video clips', (state.drafts || []).filter((d) => d.kind === 'video' || d.kind === 'avatar').length) +
      row('พรีเซนเตอร์', 'Presenters', (state.customAvatars || []).length)
    );
  }

  ov.innerHTML = '<div style="background:var(--surface);border-radius:20px;max-width:520px;width:100%;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(15,8,30,.45)">'
    + '<div style="padding:18px 22px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;flex-shrink:0">'
    +   '<div style="width:42px;height:42px;border-radius:99px;background:linear-gradient(135deg,#FF7A1A,#EC4899);color:#fff;display:grid;place-items:center;font-size:18px;font-weight:900">ป</div>'
    +   '<div style="flex:1;min-width:0">'
    +     '<div style="font-size:16px;font-weight:800;color:var(--ink)">' + T('โปรไฟล์ของฉัน', 'My profile') + '</div>'
    +     '<div style="font-size:11.5px;color:var(--muted)">' + T('ปอย แสงทอง · Owner', 'Poy Sangthong · Owner') + '</div>'
    +   '</div>'
    +   '<button data-profileclose="1" style="width:32px;height:32px;border-radius:99px;border:0;background:var(--cream2);cursor:pointer;display:grid;place-items:center">' + I('x', 16, 'var(--muted)') + '</button>'
    + '</div>'
    + '<div style="padding:22px;overflow-y:auto">' + body + '</div>'
    + '</div>';
  ov.addEventListener('click', function (e) {
    if (e.target === ov || e.target.closest('[data-profileclose]')) ov.remove();
  });
  document.body.appendChild(ov);
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
  });
}
