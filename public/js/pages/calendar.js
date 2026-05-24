// public/js/pages/calendar.js
//
// Content Calendar — month grid + day detail panel + drafts queue. Mirrors
// the inline pageCalendar() exactly. CAL_EVENTS is empty {} for now (real
// scheduled posts will populate it via Phase 4 backend wiring); CAL_DRAFTS
// is the demo draft list (replaced by state.drafts when the user makes a
// real draft).
//
// All HTML-emitting helpers (I, head) wrapped in raw(). User-facing text
// fields (draft.topic, draft.brandName) routed through escText for safety.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { head } from '../components/head.js';

// Empty until real scheduled posts populate it (Phase 4 backend wiring).
const CAL_EVENTS = {};

// Shared with Automation page — same status enum.
const STATUS_MAP = {
  published: { th: 'โพสต์สำเร็จ', en: 'Posted',    pill: 'green'  },
  scheduled: { th: 'รอเวลา',      en: 'Scheduled', pill: 'blue'   },
  running:   { th: 'กำลังโพสต์',  en: 'Posting',   pill: 'orange' },
  failed:    { th: 'ล้มเหลว',     en: 'Failed',    pill: 'red'    },
  retry:     { th: 'รอ retry',    en: 'Retrying',  pill: 'yellow' },
};

export function pageCalendar() {
  const month_th = 'พฤศจิกายน 2026', month_en = 'November 2026';
  const start = 0, days = 30, today = 11;
  const cells = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayEvents = CAL_EVENTS[state.calDay] || [];
  const weekdays_th = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const weekdays_en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = state.calDay ? ((start + state.calDay - 1) % 7) : 0;
  const published = dayEvents.filter((e) => e.status === 'published').length;
  const scheduled = dayEvents.filter((e) => e.status === 'scheduled').length;
  const failed = dayEvents.filter((e) => e.status === 'failed').length;

  const actions = `<button class="btn outline sm">${I('filter', 14)} ${T('กรอง', 'Filter')}</button>
     <button class="btn primary sm" data-go="creative">${I('plus', 14)} ${T('สร้างโพสต์ใหม่', 'New post')}</button>`;

  return html`${raw(head('OPERATIONS', T('ปฏิทินคอนเทนต์', 'Content Calendar'),
    T('ภาพรวมทั้งเดือน · คลิกวันเพื่อดูรายละเอียดและตั้งเวลา Draft', 'Whole-month overview · click a day to see details and schedule drafts'),
    actions
  ))}

  <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
    <button class="btn outline iconOnly sm">${raw(I('chev_left', 15))}</button>
    <div style="font-size:18px;font-weight:800;color:var(--purple);min-width:180px;text-align:center;letter-spacing:-.01em">${T(month_th, month_en)}</div>
    <button class="btn outline iconOnly sm">${raw(I('chev_right', 15))}</button>
    <button class="btn outline sm">${raw(T('วันนี้', 'Today'))}</button>
    <div style="margin-left:auto" class="tabs">
      <button class="tab active">${raw(T('เดือน', 'Month'))}</button>
      <button class="tab">${raw(T('สัปดาห์', 'Week'))}</button>
      <button class="tab">${raw(T('รายการ', 'List'))}</button>
    </div>
  </div>

  <div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px">
    <!-- Month grid -->
    <div class="calGrid">
      ${raw(['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => `<div class="calHead" style="color:${(i === 0 || i === 6) ? 'var(--orange)' : 'var(--muted)'}">${T(d, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i])}</div>`).join(''))}
      ${raw(cells.map((d) => {
        if (!d) return `<div class="calDay muted"></div>`;
        const isToday = d === today;
        const isSelected = d === state.calDay;
        const evs = CAL_EVENTS[d] || [];
        const dDrafts = (state.drafts || []).filter(function (x) { return x.scheduledDay === d; });
        const total = evs.length + dDrafts.length;
        return `<button class="calDay ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-set="calDay=${d}">
          <div class="dateNum"><span>${d}</span>${total ? `<span style="font-size:10px;color:var(--muted)">${total}</span>` : ''}</div>
          ${evs.slice(0, 2).map((e) => `<span class="calEvent ${e.ch === 'instagram' ? 'ig' : e.ch === 'tiktok' ? 'tt' : ''} ${e.hot ? 'hot' : ''}">${e.time}</span>`).join('')}
          ${dDrafts.slice(0, 2).map((dr) => `<span class="calEvent" style="background:var(--orange-soft);color:var(--orange3);border:1px solid var(--orange);padding:0 5px">${I('type', 9, '#9A3412')} ${escText((dr.topic || '').slice(0, 14))}</span>`).join('')}
          ${total > 4 ? `<span style="font-size:9px;color:var(--muted);padding:0 5px">+${total - 4} ${T('อื่นๆ', 'more')}</span>` : ''}
        </button>`;
      }).join(''))}
    </div>

    <!-- Day detail -->
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="border:1.5px solid var(--orange)">
        <div class="split" style="align-items:flex-start;margin-bottom:14px">
          <div>
            <div class="eyebrow" style="color:var(--orange);margin-bottom:4px">${T(weekdays_th[dayOfWeek], weekdays_en[dayOfWeek])}</div>
            <h3 class="cardTitle" style="font-size:22px;margin:0">${state.calDay} ${T('พ.ย.', 'Nov')} 2026</h3>
            ${state.calDay === today ? raw(`<span style="font-size:12px;color:var(--orange);font-weight:700">${T('วันนี้', 'Today')}</span>`) : ''}
          </div>
          <button class="btn primary sm" data-addtoday="1">${raw(I('plus', 13))} ${raw(T('เพิ่มโพสต์', 'Add'))}</button>
        </div>
        <div style="display:flex;gap:14px;padding-top:12px;border-top:1px dashed var(--line)">
          <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--green)">${published}</div><div style="font-size:11px;color:var(--muted)">${T('โพสต์แล้ว', 'Posted')}</div></div>
          <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--blue)">${scheduled}</div><div style="font-size:11px;color:var(--muted)">${T('รอเวลา', 'Scheduled')}</div></div>
          <div style="flex:1"><div style="font-size:22px;font-weight:800;color:${failed ? 'var(--red)' : 'var(--muted)'}">${failed}</div><div style="font-size:11px;color:var(--muted)">${T('ล้มเหลว', 'Failed')}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="cardHeader" style="margin-bottom:10px">
          <h3 class="cardTitle">${raw(T('โพสต์ในวันนี้', 'Posts on this day'))}</h3>
          ${dayEvents.length ? raw(`<span class="micro">${dayEvents.length} ${T('โพสต์', 'posts')}</span>`) : ''}
        </div>
        ${dayEvents.length === 0
          ? raw(`<div style="padding:32px 24px;text-align:center;background:var(--cream2);border-radius:12px;border:1px dashed var(--line3)">${I('calendar', 32, '#A39BAE')}<div style="font-size:13px;font-weight:600;color:var(--ink);margin:8px 0 4px">${T('ยังไม่มีโพสต์ในวันนี้', 'No posts scheduled')}</div><div class="micro">${T('ลากโพสต์ Draft มาวางวันนี้', 'Drag a draft here')}</div></div>`)
          : raw(`<div style="display:flex;flex-direction:column;gap:8px">${dayEvents.map((e) => {
              const s = STATUS_MAP[e.status];
              const chColor = e.ch === 'facebook' ? '#1877F2' : e.ch === 'instagram' ? '#E1306C' : '#0F172A';
              return `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid var(--line)">
                <div style="width:52px;text-align:center;padding:6px 0;border-radius:8px;background:var(--cream2);border:1px solid var(--line);font-size:12px;font-weight:800;color:var(--purple)">${e.time}</div>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                    ${I(e.ch, 14, chColor)}
                    <span style="font-size:11px;color:${chColor};font-weight:700;text-transform:capitalize">${e.ch}</span>
                    ${e.hot ? `<span class="pill orange" style="height:18px;font-size:9px;font-weight:800">${I('zap', 9)} HOT</span>` : ''}
                    <span style="margin-left:auto"><span class="pill ${s.pill}" style="height:20px;font-size:10.5px">${T(s.th, s.en)}</span></span>
                  </div>
                  <div style="font-size:13px;font-weight:600;color:var(--purple);line-height:1.4">${t({ th: e.topic_th, en: e.topic_en })}</div>
                </div>
              </div>`;
            }).join('')}</div>`)}
      </div>

      <div class="card" style="background:linear-gradient(180deg,var(--surface) 0%,#FFFBEB 100%)">
        <div class="split" style="align-items:baseline;margin-bottom:4px">
          <h3 class="cardTitle">${raw(T('คอนเทนต์ Draft', 'Drafts'))} <span class="pill orange">${(state.drafts || []).length}</span></h3>
          <button class="btn ghost sm" data-go="library">${raw(T('ดูทั้งหมด', 'See all'))} ${raw(I('chev_right', 12))}</button>
        </div>
        <p class="cardSub" style="margin-bottom:12px">${raw(T('ตั้งเวลาให้โพสต์ในวันที่เลือกได้เลย', 'Schedule any draft into the selected day'))}</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${(state.drafts || []).length
            ? raw(state.drafts.map((d) => `<div style="padding:10px;border-radius:10px;background:#fff;border:1px solid var(--line)">
              <div style="display:flex;gap:10px;align-items:flex-start">
                <div style="width:28px;height:28px;border-radius:7px;background:var(--cream2);display:grid;place-items:center;color:var(--orange);flex-shrink:0">${I('type', 14)}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12.5px;font-weight:600;color:var(--purple);line-height:1.4">${escText(d.topic || '')}</div>
                  <div style="margin-top:4px;font-size:10px;color:var(--muted)">${escText(d.brandName || '')}${d.scheduledDay ? ' · ' + T('ตั้งเวลาวันที่ ', 'day ') + d.scheduledDay : ''}</div>
                </div>
                <button class="btn ghost sm iconOnly" data-deletedraft="${d.id}" title="${T('ลบดราฟ', 'Delete draft')}" style="color:var(--red);width:24px;height:24px">${I('x', 12, '#DC2626')}</button>
              </div>
              <div style="display:flex;gap:6px;margin-top:8px">
                <button class="btn primary sm" data-schedule="${d.id}:${state.calDay || today}" style="flex:1;height:28px;font-size:11.5px">${I('calendar', 12)} ${T('ตั้งวันที่เลือก', 'To selected day')}</button>
                <button class="btn outline sm" data-schedule="${d.id}:${(state.calDay || today) + 1}" style="height:28px;font-size:11.5px">${T('พรุ่งนี้', 'Day +1')}</button>
              </div>
            </div>`).join(''))
            : raw(`<div style="padding:22px;text-align:center;color:var(--muted);font-size:12px">${T('ยังไม่มีดราฟ — สร้างคอนเทนต์แล้วกดปุ่ม Draft', 'No drafts yet — generate content, then hit Draft')}</div>`)}
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top:14px;display:flex;gap:18px;font-size:12px;color:var(--muted)">
    <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:#1877F2;width:8px;height:8px"></span>Facebook</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:#E1306C;width:8px;height:8px"></span>Instagram</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:#0F172A;width:8px;height:8px"></span>TikTok</span>
    <span style="margin-left:auto">${T('รวม 38 โพสต์ในเดือนนี้ · 12 รอเวลา · 26 สำเร็จแล้ว', '38 posts this month · 12 scheduled · 26 posted')}</span>
  </div>`;
}
