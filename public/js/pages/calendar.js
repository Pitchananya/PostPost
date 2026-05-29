// public/js/pages/calendar.js
//
// Content Calendar — real month grid + day detail panel + drafts queue.
// Pulls live rows from /api/content (scheduled / published / failed) and
// buckets them by their effective date (published_at for posted, scheduled_at
// for everything else). Local drafts (state.drafts) still render on their
// assigned scheduledDay. Days are clickable; month nav (‹ › Today) is wired
// via the data-calnav handler bound once below.
//
// Data is fetched once per page-load and cached on window.PP._calCache so a
// re-render (day click, month nav) doesn't refetch. publishPost() clears the
// cache after creating a row so a new scheduled/posted item shows immediately.
//
// All HTML-emitting helpers (I, head) wrapped in raw(). User-facing text
// fields (hook, draft.topic, draft.brandName) routed through escText.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { head } from '../components/head.js';
import { api } from '../api.js';

const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_TH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_MAP = {
  published: { th: 'โพสต์สำเร็จ', en: 'Posted',    pill: 'green'  },
  scheduled: { th: 'รอเวลา',      en: 'Scheduled', pill: 'blue'   },
  processing:{ th: 'กำลังโพสต์',  en: 'Posting',   pill: 'orange' },
  failed:    { th: 'ล้มเหลว',     en: 'Failed',    pill: 'red'    },
  retry:     { th: 'รอ retry',    en: 'Retrying',  pill: 'yellow' },
  draft:     { th: 'ฉบับร่าง',    en: 'Draft',     pill: 'grey'   },
};

const pad2 = (n) => String(n).padStart(2, '0');
const dkey = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

// Load all contents once; bucket scheduled/published/failed by effective date.
function loadCalendarData() {
  window.PP = window.PP || {};
  if (window.PP._calCache) return;
  window.PP._calCache = { loading: true };
  api('/api/content')
    .then((r) => {
      window.PP._calCache = { loading: false, contents: (r && r.contents) || [] };
      try { if (state.page === 'calendar' && typeof window.render === 'function') window.render(); } catch (_) {}
    })
    .catch((e) => {
      window.PP._calCache = { loading: false, error: e.message, contents: [] };
      try { if (state.page === 'calendar' && typeof window.render === 'function') window.render(); } catch (_) {}
    });
}

// Month navigation (‹ / › / Today). Bound once — survives re-renders.
function bindCalNav() {
  if (window.PP && window.PP._calNavBound) return;
  window.PP = window.PP || {};
  window.PP._calNavBound = true;
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-calnav]');
    if (!nav) return;
    e.preventDefault();
    const dir = nav.getAttribute('data-calnav');
    if (dir === 'today') {
      const n = new Date();
      state.calYear = n.getFullYear(); state.calMonth = n.getMonth(); state.calDay = n.getDate();
    } else {
      let m = state.calMonth + (dir === 'next' ? 1 : -1);
      let y = state.calYear;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      state.calMonth = m; state.calYear = y;
      const dim = new Date(y, m + 1, 0).getDate();
      if (state.calDay > dim) state.calDay = dim;
    }
    try { if (typeof window.render === 'function') window.render(); } catch (_) {}
  });
}

export function pageCalendar() {
  loadCalendarData();
  bindCalNav();

  // Lazy-init the displayed month to "today" on first visit (calDay defaults
  // to a legacy 11 in state.js — override it once so today is selected).
  const now = new Date();
  if (state.calYear == null) state.calYear = now.getFullYear();
  if (state.calMonth == null) state.calMonth = now.getMonth();
  if (!state._calReady) { state.calDay = now.getDate(); state._calReady = true; }

  const Y = state.calYear, M = state.calMonth;
  const cache = window.PP._calCache || { loading: true };
  const contents = cache.contents || [];

  // Bucket rows by effective local date. published → published_at;
  // everything else → scheduled_at. Drafts (no real date) are skipped here —
  // local state.drafts render separately on their assigned scheduledDay.
  const byDate = {};
  contents.forEach((c) => {
    if (!['scheduled', 'published', 'failed', 'processing', 'retry'].includes(c.status)) return;
    const iso = c.status === 'published' ? (c.published_at || c.scheduled_at) : (c.scheduled_at || c.published_at);
    if (!iso) return;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return;
    const key = dkey(d.getFullYear(), d.getMonth(), d.getDate());
    (byDate[key] || (byDate[key] = [])).push({
      time: d.toLocaleTimeString(state.lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      ts: d.getTime(),
      status: c.status,
      hook: c.hook || c.caption || '',
      platforms: (c.platforms && c.platforms.length) ? c.platforms : ['facebook'],
      course: c.course,
    });
  });
  Object.values(byDate).forEach((list) => list.sort((a, b) => a.ts - b.ts));

  // Build the month grid (lead with blank cells for the first weekday).
  const firstDow = new Date(Y, M, 1).getDay();
  const days = new Date(Y, M + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isCurMonth = (Y === now.getFullYear() && M === now.getMonth());
  const todayD = now.getDate();
  const selKey = dkey(Y, M, state.calDay);
  const dayEvents = byDate[selKey] || [];
  const dayDrafts = (state.drafts || []).filter((x) => x.scheduledDay === state.calDay);

  const weekdays_th = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const weekdays_en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dowSel = new Date(Y, M, state.calDay).getDay();
  const published = dayEvents.filter((e) => e.status === 'published').length;
  const scheduled = dayEvents.filter((e) => e.status === 'scheduled').length;
  const failed = dayEvents.filter((e) => e.status === 'failed').length;

  const totalThisMonth = Object.keys(byDate).reduce((n, k) => k.startsWith(`${Y}-${pad2(M + 1)}-`) ? n + byDate[k].length : n, 0);
  const schedMonth = Object.keys(byDate).reduce((n, k) => k.startsWith(`${Y}-${pad2(M + 1)}-`) ? n + byDate[k].filter((e) => e.status === 'scheduled').length : n, 0);
  const pubMonth = totalThisMonth - schedMonth;

  const chColor = (p) => p === 'facebook' ? '#1877F2' : p === 'instagram' ? '#E1306C' : '#0F172A';
  const evColor = (s) => s === 'published' ? 'var(--green)' : s === 'failed' ? 'var(--red)' : s === 'scheduled' ? 'var(--blue)' : 'var(--orange)';

  const actions = `<button class="btn outline sm" data-go="automation">${I('clock', 14)} ${T('ดู Log', 'View Log')}</button>
     <button class="btn primary sm" data-go="creative">${I('plus', 14)} ${T('สร้างโพสต์ใหม่', 'New post')}</button>`;

  return html`${raw(head('OPERATIONS', T('ปฏิทินคอนเทนต์', 'Content Calendar'),
    T('ภาพรวมทั้งเดือน · คลิกวันเพื่อดูโพสต์ที่ตั้งเวลาไว้ · ข้อมูลจริงจากระบบ', 'Whole-month overview · click a day to see scheduled posts · live data'),
    actions
  ))}

  ${cache.loading ? raw(`<div class="card" style="text-align:center;padding:18px;color:var(--muted)">⏳ ${T('กำลังโหลดปฏิทิน…', 'Loading calendar…')}</div>`) : ''}
  ${cache.error ? raw(`<div class="card" style="background:#FEE2E2;border-color:#FCA5A5;color:#991B1B;padding:12px">⚠ ${T('โหลดข้อมูลไม่สำเร็จ', 'Failed to load')}: ${cache.error}</div>`) : ''}

  <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
    <button class="btn outline iconOnly sm" data-calnav="prev" title="${T('เดือนก่อน', 'Prev month')}">${raw(I('chev_left', 15))}</button>
    <div style="font-size:18px;font-weight:800;color:var(--purple);min-width:180px;text-align:center;letter-spacing:-.01em">${T(MONTHS_TH[M] + ' ' + (Y + 543), MONTHS_EN[M] + ' ' + Y)}</div>
    <button class="btn outline iconOnly sm" data-calnav="next" title="${T('เดือนถัดไป', 'Next month')}">${raw(I('chev_right', 15))}</button>
    <button class="btn outline sm" data-calnav="today">${raw(T('วันนี้', 'Today'))}</button>
    <div style="margin-left:auto;font-size:12px;color:var(--muted)">${T(totalThisMonth + ' โพสต์เดือนนี้', totalThisMonth + ' posts this month')}</div>
  </div>

  <div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px">
    <!-- Month grid -->
    <div class="calGrid">
      ${raw(['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => `<div class="calHead" style="color:${(i === 0 || i === 6) ? 'var(--orange)' : 'var(--muted)'}">${T(d, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i])}</div>`).join(''))}
      ${raw(cells.map((d) => {
        if (!d) return `<div class="calDay muted"></div>`;
        const isToday = isCurMonth && d === todayD;
        const isSelected = d === state.calDay;
        const evs = byDate[dkey(Y, M, d)] || [];
        const dDrafts = (state.drafts || []).filter((x) => x.scheduledDay === d);
        const total = evs.length + dDrafts.length;
        return `<button class="calDay ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-set="calDay=${d}">
          <div class="dateNum"><span>${d}</span>${total ? `<span style="font-size:10px;color:var(--muted)">${total}</span>` : ''}</div>
          ${evs.slice(0, 2).map((e) => `<span class="calEvent" style="background:#fff;border:1px solid var(--line);color:${chColor(e.platforms[0])};padding:0 5px;display:inline-flex;align-items:center;gap:3px"><span class="dot" style="width:5px;height:5px;background:${evColor(e.status)}"></span>${e.time}</span>`).join('')}
          ${dDrafts.slice(0, 1).map((dr) => `<span class="calEvent" style="background:var(--orange-soft);color:var(--orange3);border:1px solid var(--orange);padding:0 5px">${I('type', 9, '#9A3412')} ${escText((dr.topic || '').slice(0, 12))}</span>`).join('')}
          ${total > 3 ? `<span style="font-size:9px;color:var(--muted);padding:0 5px">+${total - 3} ${T('อื่นๆ', 'more')}</span>` : ''}
        </button>`;
      }).join(''))}
    </div>

    <!-- Day detail -->
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="border:1.5px solid var(--orange)">
        <div class="split" style="align-items:flex-start;margin-bottom:14px">
          <div>
            <div class="eyebrow" style="color:var(--orange);margin-bottom:4px">${T(weekdays_th[dowSel], weekdays_en[dowSel])}</div>
            <h3 class="cardTitle" style="font-size:22px;margin:0">${state.calDay} ${T(MONTHS_TH_SHORT[M], MONTHS_EN_SHORT[M])} ${T(Y + 543, Y)}</h3>
            ${(isCurMonth && state.calDay === todayD) ? raw(`<span style="font-size:12px;color:var(--orange);font-weight:700">${T('วันนี้', 'Today')}</span>`) : ''}
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
          ? raw(`<div style="padding:32px 24px;text-align:center;background:var(--cream2);border-radius:12px;border:1px dashed var(--line3)">${I('calendar', 32, '#A39BAE')}<div style="font-size:13px;font-weight:600;color:var(--ink);margin:8px 0 4px">${T('ยังไม่มีโพสต์ในวันนี้', 'No posts on this day')}</div><div class="micro">${T('ไปหน้า Creative สร้างแล้วตั้งเวลาโพสต์', 'Create on the Creative page, then schedule a post')}</div></div>`)
          : raw(`<div style="display:flex;flex-direction:column;gap:8px">${dayEvents.map((e) => {
              const s = STATUS_MAP[e.status] || STATUS_MAP.scheduled;
              const p = e.platforms[0];
              return `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid var(--line)">
                <div style="width:52px;text-align:center;padding:6px 0;border-radius:8px;background:var(--cream2);border:1px solid var(--line);font-size:12px;font-weight:800;color:var(--purple)">${e.time}</div>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                    ${I(p, 14, chColor(p))}
                    <span style="font-size:11px;color:${chColor(p)};font-weight:700;text-transform:capitalize">${p}</span>
                    <span style="margin-left:auto"><span class="pill ${s.pill}" style="height:20px;font-size:10.5px">${T(s.th, s.en)}</span></span>
                  </div>
                  <div style="font-size:13px;font-weight:600;color:var(--purple);line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escText((e.hook || '').slice(0, 80)) || '—'}</div>
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
                <button class="btn primary sm" data-schedule="${d.id}:${state.calDay}" style="flex:1;height:28px;font-size:11.5px">${I('calendar', 12)} ${T('ตั้งวันที่เลือก', 'To selected day')}</button>
                <button class="btn outline sm" data-schedule="${d.id}:${state.calDay + 1}" style="height:28px;font-size:11.5px">${T('พรุ่งนี้', 'Day +1')}</button>
              </div>
            </div>`).join(''))
            : raw(`<div style="padding:22px;text-align:center;color:var(--muted);font-size:12px">${T('ยังไม่มีดราฟ — สร้างคอนเทนต์แล้วกดปุ่ม Draft', 'No drafts yet — generate content, then hit Draft')}</div>`)}
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top:14px;display:flex;gap:18px;font-size:12px;color:var(--muted);flex-wrap:wrap">
    <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:var(--green);width:8px;height:8px"></span>${T('โพสต์แล้ว', 'Posted')}</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:var(--blue);width:8px;height:8px"></span>${T('รอเวลา', 'Scheduled')}</span>
    <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:var(--orange);width:8px;height:8px"></span>${T('ดราฟ', 'Draft')}</span>
    <span style="margin-left:auto">${T('รวม ' + totalThisMonth + ' โพสต์ · ' + schedMonth + ' รอเวลา · ' + pubMonth + ' สำเร็จ', totalThisMonth + ' posts · ' + schedMonth + ' scheduled · ' + pubMonth + ' posted')}</span>
  </div>`;
}
