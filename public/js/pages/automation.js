// public/js/pages/automation.js
//
// Automation Log — history table of every auto-post (success, scheduled,
// failed, retry). Mirrors the inline pageAutomation() — pixel-identical
// output, only mechanical changes:
//   - backtick template → html`` tagged template
//   - helpers that emit HTML (I, head) wrapped in raw()
//
// AUTO_ROWS + STATUS_MAP are page-local demo data (same shape as the inline
// copy). They're not mutated elsewhere — when Phase 4 wires real data from
// the backend these become a state field instead.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { head } from '../components/head.js';

const AUTO_ROWS = [
  { t: '19:00', date_th: '11 พ.ย.', date_en: 'Nov 11', topic_th: 'โปร 11.11 Marine Collagen ลด 50%',    topic_en: '11.11 sale · Marine Collagen 50% off', hook_th: 'อายุ 30+ ใช่ไหมคะ?',  hook_en: 'Are you 30+?',          ch: [['facebook', 'ok'], ['instagram', 'ok']],                          status: 'published', cost: 4, kind_th: 'อัลบั้ม 6 ภาพ', kind_en: 'Album · 6 images' },
  { t: '17:30', date_th: '11 พ.ย.', date_en: 'Nov 11', topic_th: 'รีวิวจริง Toner Pad — ลูกค้าใช้จริง',   topic_en: 'Real review · Toner Pad',              hook_th: 'ใช้แค่ 7 วัน...',     hook_en: 'Just 7 days...',        ch: [['facebook', 'ok'], ['instagram', 'fail']],                        status: 'failed',    cost: 4, kind_th: 'รูปเดี่ยว',     kind_en: 'Single image', err_th: 'IG · token หมดอายุ — กดเชื่อมต่อใหม่', err_en: 'IG · token expired — reconnect to fix' },
  { t: '15:00', date_th: '11 พ.ย.', date_en: 'Nov 11', topic_th: 'Rose Mist Spray — ตัวใหม่!',          topic_en: 'Rose Mist Spray — new!',               hook_th: 'หลังเลิกงานเหนื่อย ๆ', hook_en: 'After a long workday',  ch: [['facebook', 'ok'], ['instagram', 'ok'], ['tiktok', 'ok']],        status: 'published', cost: 6, kind_th: 'Reels (Avatar)', kind_en: 'Reels (Avatar)' },
  { t: '12:00', date_th: '11 พ.ย.', date_en: 'Nov 11', topic_th: 'Lunch break — ส่วนผสมในเซรั่ม',       topic_en: 'Lunch break · serum ingredients',      hook_th: 'รู้ไหม? ดอกกุหลาบเขาใหญ่...', hook_en: 'Did you know? Khao Yai roses...', ch: [['facebook', 'pending'], ['instagram', 'pending']], status: 'running', cost: 4, kind_th: 'อัลบั้ม 3 ภาพ', kind_en: 'Album · 3 images' },
  { t: '21:00', date_th: '11 พ.ย.', date_en: 'Nov 11', topic_th: 'ปิดท้ายวัน — เคล็ดลับผิวก่อนนอน',      topic_en: 'Closing the day · bedtime tip',        hook_th: 'ก่อนนอนทำ 3 step นี้', hook_en: '3 steps before bed',    ch: [['facebook', 'pending'], ['instagram', 'pending']],                status: 'scheduled', cost: 4, kind_th: 'รูปเดี่ยว',     kind_en: 'Single image' },
  { t: '09:00', date_th: '12 พ.ย.', date_en: 'Nov 12', topic_th: 'Sheet Mask Monday',                  topic_en: 'Sheet Mask Monday',                    hook_th: 'จันทร์ทั้งที ต้อง mask',  hook_en: "It's Monday — mask up", ch: [['facebook', 'pending'], ['instagram', 'pending']],                status: 'scheduled', cost: 4, kind_th: 'รูปเดี่ยว',     kind_en: 'Single image' },
  { t: '11:30', date_th: '11 พ.ย.', date_en: 'Nov 11', topic_th: 'Set Beauty Trio — Bundle Deal',      topic_en: 'Beauty Trio Bundle Deal',              hook_th: 'ครบจบทั้งเซตเดียว',  hook_en: 'Everything in one set', ch: [['facebook', 'fail']],                                             status: 'retry',     cost: 4, kind_th: 'อัลบั้ม 4 ภาพ', kind_en: 'Album · 4 images', err_th: 'FB · request timeout — retry อัตโนมัติใน 5 นาที', err_en: 'FB · request timeout — auto-retry in 5 min' },
];

const STATUS_MAP = {
  published: { th: 'โพสต์สำเร็จ', en: 'Posted',    pill: 'green'  },
  scheduled: { th: 'รอเวลา',      en: 'Scheduled', pill: 'blue'   },
  running:   { th: 'กำลังโพสต์',  en: 'Posting',   pill: 'orange' },
  failed:    { th: 'ล้มเหลว',     en: 'Failed',    pill: 'red'    },
  retry:     { th: 'รอ retry',    en: 'Retrying',  pill: 'yellow' },
};

export function pageAutomation() {
  const actions = `<button class="btn outline sm">${I('download', 14)} Export CSV</button>
     <button class="btn primary sm">${I('refresh', 14)} ${T('รีเฟรช', 'Refresh')}</button>`;

  return html`${raw(head('OPERATIONS', 'Automation Log',
    T('ดูประวัติการโพสต์อัตโนมัติทั้งหมด · เห็นเหตุผลทันทีเมื่อโพสต์ล้มเหลว', 'History of every auto-post · see why a post failed at a glance'),
    actions
  ))}

  <div class="grid g4" style="margin-bottom:18px">
    ${raw([
      { v: '218',   l_th: 'โพสต์สำเร็จ (เดือนนี้)', l_en: 'Posted (this month)',     icon: 'check',    color: 'green',  delta: '+12%' },
      { v: '12',    l_th: 'รอเวลา',                l_en: 'Scheduled',                icon: 'clock',    color: 'blue',   delta: '+3'   },
      { v: '2',     l_th: 'ล้มเหลว / ต้องแก้',     l_en: 'Failed / needs attention', icon: 'alert',    color: 'red',    delta: '-1'   },
      { v: '98.4%', l_th: 'อัตราสำเร็จ',           l_en: 'Success rate',             icon: 'trending', color: 'orange', delta: '+0.6%', up: true },
    ].map((s) => `<div class="card">
      <div class="metric">
        <div class="metricIcon ${s.color}">${I(s.icon, 20)}</div>
        <div style="flex:1">
          <div class="metricVal">${s.v}</div>
          <div class="metricLab">${t({ th: s.l_th, en: s.l_en })}</div>
          <div class="delta up">${I('chev_up', 12)} ${s.delta}</div>
        </div>
      </div>
    </div>`).join(''))}
  </div>

  <!-- Filters -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
    <div class="tabs">
      ${raw([['all', 'ทั้งหมด', 'All', AUTO_ROWS.length], ['published', 'สำเร็จ', 'Posted', 195], ['scheduled', 'รอเวลา', 'Scheduled', 12], ['failed', 'ล้มเหลว', 'Failed', 2]]
        .map(([id, th, en, n]) => `<button class="tab ${state.autoFilter === id ? 'active' : ''}" data-set="autoFilter=${id}">${T(th, en)} <span style="padding:0 6px;border-radius:99px;background:${state.autoFilter === id ? 'rgba(255,255,255,.25)' : 'var(--cream2)'};font-size:10px">${n}</span></button>`).join(''))}
    </div>
    <button class="btn outline sm">${raw(I('filter', 14))} ${raw(T('ช่องทาง: ทั้งหมด', 'Channel: All'))} ${raw(I('chev_down', 12))}</button>
    <button class="btn outline sm">${raw(I('calendar', 14))} ${raw(T('7 วันล่าสุด', 'Last 7 days'))} ${raw(I('chev_down', 12))}</button>
    <div style="flex:1"></div>
    <div class="search" style="height:36px;width:240px">${raw(I('search', 13))} <input placeholder="${T('ค้นหา', 'Search')}" /></div>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <table class="tbl">
      <thead><tr>
        <th>${raw(T('เวลา', 'Time'))}</th>
        <th>${raw(T('หัวข้อ / Hook', 'Topic / Hook'))}</th>
        <th>${raw(T('ช่องทาง', 'Channels'))}</th>
        <th>${raw(T('สถานะ', 'Status'))}</th>
        <th>${raw(T('ประเภท', 'Type'))}</th>
        <th style="text-align:right">${raw(T('เครดิต', 'Credits'))}</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${raw(AUTO_ROWS.map((r) => {
          const s = STATUS_MAP[r.status];
          return `<tr>
            <td>
              <div style="font-size:14px;font-weight:700;color:var(--purple)">${r.t}</div>
              <div style="font-size:11px;color:var(--muted)">${t({ th: r.date_th, en: r.date_en })}</div>
            </td>
            <td>
              <div style="font-size:13px;font-weight:600;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px">${t({ th: r.topic_th, en: r.topic_en })}</div>
              <div style="font-size:12px;color:var(--muted);font-style:italic">"${t({ th: r.hook_th, en: r.hook_en })}"</div>
              ${r.err_th ? `<div style="margin-top:8px;padding:8px 12px;border-radius:8px;background:var(--red-soft);border:1px solid #FBCFCE;font-size:11.5px;color:#991B1B;display:flex;gap:8px;align-items:center">${I('alert', 13, '#991B1B')} <span style="flex:1">${t({ th: r.err_th, en: r.err_en })}</span> <button class="btn ghost sm" style="height:24px;padding:0 8px;font-size:11px;color:#991B1B">${I('refresh', 11)} ${T('Retry ตอนนี้', 'Retry now')}</button></div>` : ''}
            </td>
            <td><div style="display:flex;gap:6px">${r.ch.map(([ic, st]) => `<div style="position:relative;display:inline-flex">${I(ic, 18, ic === 'facebook' ? '#1877F2' : ic === 'instagram' ? '#E1306C' : '#0F172A')}<span style="position:absolute;bottom:-2px;right:-2px;width:7px;height:7px;border-radius:99px;background:${st === 'ok' ? 'var(--green)' : st === 'fail' ? 'var(--red)' : 'var(--yellow)'};border:1.5px solid #fff"></span></div>`).join('')}</div></td>
            <td><span class="pill ${s.pill}"><span class="dot" style="background:${s.pill === 'green' ? '#16A34A' : s.pill === 'blue' ? '#1D4ED8' : s.pill === 'red' ? '#DC2626' : s.pill === 'yellow' ? '#D97706' : '#FF7A1A'};width:6px;height:6px"></span> ${T(s.th, s.en)}</span></td>
            <td style="font-size:12px;color:var(--ink)">${t({ th: r.kind_th, en: r.kind_en })}</td>
            <td style="text-align:right;font-size:13px;font-weight:700;color:var(--purple)">${r.cost}</td>
            <td><button class="btn ghost sm iconOnly">${I('chev_right', 14)}</button></td>
          </tr>`;
        }).join(''))}
      </tbody>
    </table>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:var(--muted)">
    <span>${raw(T('แสดง 7 จาก 218 รายการ', 'Showing 7 of 218'))}</span>
    <div style="display:flex;gap:4px">
      <button class="btn ghost sm" disabled style="opacity:.5">${raw(I('chev_left', 13))} ${raw(T('ก่อนหน้า', 'Prev'))}</button>
      <button class="btn ghost sm">${raw(T('ถัดไป', 'Next'))} ${raw(I('chev_right', 13))}</button>
    </div>
  </div>`;
}
