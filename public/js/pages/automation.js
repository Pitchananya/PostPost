// public/js/pages/automation.js
//
// Automation Log — history of every post. Pulls real data from the backend
// (/api/analytics/summary for KPI counts, /api/content for the row list)
// instead of the Phase-3 mock rows.
//
// What the page shows:
//   • 4 KPI cards from /api/analytics/summary.contents (real counts of
//     published / scheduled / failed / total)
//   • Status filter tabs (all / posted / scheduled / failed) — each filters
//     the table by content status
//   • Table of ALL contents from /api/content (published, scheduled, failed),
//     timed by published_at (posted) or scheduled_at (pending), with per-
//     platform success indicators from post_results
//   • Friendly empty state when nothing has been created yet
//
// Data fetched once per page-load, cached on window.PP._automationCache
// so the filter tabs don't refetch.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { head } from '../components/head.js';
import { api } from '../api.js';
import { escText, escape as escAttr } from '../escape.js';

const STATUS_MAP = {
  published: { th: 'โพสต์สำเร็จ', en: 'Posted',    pill: 'green',  dot: '#16A34A' },
  scheduled: { th: 'รอเวลา',       en: 'Scheduled', pill: 'blue',   dot: '#1D4ED8' },
  running:   { th: 'กำลังโพสต์',   en: 'Posting',   pill: 'orange', dot: '#FF7A1A' },
  processing:{ th: 'กำลังโพสต์',   en: 'Posting',   pill: 'orange', dot: '#FF7A1A' },
  failed:    { th: 'ล้มเหลว',      en: 'Failed',    pill: 'red',    dot: '#DC2626' },
  retry:     { th: 'รอ retry',     en: 'Retrying',  pill: 'yellow', dot: '#D97706' },
  draft:     { th: 'ฉบับร่าง',     en: 'Draft',     pill: 'grey',   dot: '#94A3B8' },
};

async function loadAutomationData() {
  window.PP = window.PP || {};
  if (window.PP._automationCache) return;
  window.PP._automationCache = { loading: true };
  try {
    // summary → KPI counts; /api/content → the table (ALL statuses, so the
    // scheduled / failed filter tabs have real rows, not just published).
    const [summary, all] = await Promise.all([
      api('/api/analytics/summary'),
      api('/api/content'),
    ]);
    window.PP._automationCache = { loading: false, summary, contents: (all && all.contents) || [] };
  } catch (e) {
    window.PP._automationCache = { loading: false, error: e.message };
  }
  try { if (state.page === 'automation' && typeof window.render === 'function') window.render(); } catch (_) {}
}

// Silent background refresh — refetch WITHOUT flipping to a loading state, so
// the table swaps in place when a scheduled post fires (no flash). Powers the
// real-time status updates.
function refreshAutomationData() {
  Promise.all([api('/api/analytics/summary'), api('/api/content')])
    .then(([summary, all]) => {
      window.PP._automationCache = { loading: false, summary, contents: (all && all.contents) || [] };
      try { if (state.page === 'automation' && typeof window.render === 'function') window.render(); } catch (_) {}
    })
    .catch(() => {});
}

// Real-time: while the Automation Log is open, poll every 15s so statuses
// (scheduled → published / failed) update on their own — whether the change
// came from the in-app due-poller OR the external cron. Bound once.
function startAutoLive() {
  if (window.PP && window.PP._autoLiveTimer) return;
  window.PP = window.PP || {};
  window.PP._autoLiveTimer = setInterval(() => {
    if (state.page !== 'automation') return;   // only refresh while viewing the log
    if (window.PP._automationCache && window.PP._automationCache.loading) return;
    refreshAutomationData();
  }, 15000);
}

// Click a row → detail modal. Reads the cached row (already has last_error +
// post_results), so no extra fetch. Shows WHY a post failed and offers
// Retry / Delete. Bound once on document.
function bindLogView() {
  if (window.PP && window.PP._logViewBound) return;
  window.PP = window.PP || {};
  window.PP._logViewBound = true;
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-logview]');
    if (!el) return;
    e.preventDefault();
    const id = Number(el.getAttribute('data-logview'));
    const row = ((window.PP._automationCache || {}).contents || []).find((c) => c.id === id);
    if (row) openLogDetail(row);
  });
}

function openLogDetail(row) {
  const s = STATUS_MAP[row.status] || STATUS_MAP.published;
  const fmt = (iso) => iso ? new Date(iso).toLocaleString(state.lang === 'th' ? 'th-TH' : 'en-US') : '—';
  const pr = row.post_results || {};
  const plats = (row.platforms && row.platforms.length) ? row.platforms : ['facebook'];

  const metaRow = (th, en, value) =>
    `<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px"><span style="color:var(--muted)">${T(th, en)}</span><span style="color:var(--ink);font-weight:600;text-align:right;word-break:break-word">${value}</span></div>`;

  const platLines = plats.map((p) => {
    const r = pr[p] || {};
    const ok = r.success || r.ok || !!r.post_id || !!r.id;
    const right = ok
      ? (r.permalink ? `<a href="${escAttr(r.permalink)}" target="_blank" rel="noopener" style="color:var(--blue);font-weight:600">${T('ดูโพสต์ ↗', 'View post ↗')}</a>` : `<span style="color:var(--green);font-weight:600">${T('สำเร็จ', 'OK')}</span>`)
      : `<span style="color:${row.status === 'failed' ? 'var(--red)' : 'var(--muted)'};font-weight:600">${escText(r.error || (row.status === 'scheduled' ? T('รอโพสต์', 'pending') : T('—', '—')))}</span>`;
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line);font-size:13px">${I(p, 16, p === 'facebook' ? '#1877F2' : p === 'instagram' ? '#E1306C' : '#0F172A')}<span style="text-transform:capitalize;flex:1">${p}</span>${right}</div>`;
  }).join('');

  const errBox = (row.status === 'failed' && row.last_error)
    ? `<div style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:12px;padding:12px;margin-bottom:14px">
         <div style="font-size:11px;font-weight:800;color:#991B1B;letter-spacing:.04em;margin-bottom:4px">${T('สาเหตุที่ล้มเหลว', 'WHY IT FAILED')}</div>
         <div style="font-size:13px;color:#991B1B;word-break:break-word">${escText(row.last_error)}</div>
       </div>` : '';

  const actions = row.status === 'failed'
    ? `<button class="btn outline sm" data-logretry="${row.id}">${I('refresh', 13)} ${T('ลองใหม่', 'Retry')}</button><button class="btn ghost sm" data-logdelete="${row.id}" style="color:var(--red)">${I('x', 13, '#DC2626')} ${T('ลบ', 'Delete')}</button>`
    : row.status === 'scheduled'
    ? `<button class="btn ghost sm" data-logdelete="${row.id}" style="color:var(--red)">${I('x', 13, '#DC2626')} ${T('ยกเลิกการตั้งเวลา', 'Cancel schedule')}</button>`
    : '';

  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,8,30,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(4px)';
  ov.innerHTML = `<div style="background:var(--surface);border-radius:20px;max-width:560px;width:100%;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(15,8,30,.45)">
    <div style="padding:16px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px">
      <span class="pill ${s.pill}"><span class="dot" style="background:${s.dot};width:6px;height:6px"></span> ${T(s.th, s.en)}</span>
      <div style="flex:1;font-size:13px;color:var(--muted)">${fmt(row.when || row.published_at || row.scheduled_at)}</div>
      <button data-logclose="1" style="width:30px;height:30px;border-radius:99px;border:0;background:var(--cream2);cursor:pointer;display:grid;place-items:center">${I('x', 15, 'var(--muted)')}</button>
    </div>
    <div style="padding:18px 20px;overflow-y:auto">
      ${errBox}
      <div style="font-size:11px;font-weight:800;color:var(--purple);letter-spacing:.04em;margin-bottom:6px">HOOK</div>
      <div style="font-size:14px;font-weight:600;color:var(--ink);margin-bottom:14px;word-break:break-word">${escText(row.hook || '—')}</div>
      ${row.caption ? `<div style="font-size:11px;font-weight:800;color:var(--purple);letter-spacing:.04em;margin-bottom:6px">CAPTION</div><div style="font-size:13px;color:var(--ink2);white-space:pre-wrap;word-break:break-word;background:var(--cream2);border-radius:10px;padding:10px;margin-bottom:14px;max-height:200px;overflow:auto">${escText(row.caption)}</div>` : ''}
      <div style="font-size:11px;font-weight:800;color:var(--purple);letter-spacing:.04em;margin:4px 0 6px">${T('ช่องทาง', 'CHANNELS')}</div>
      ${platLines}
      <div style="margin-top:12px">
        ${metaRow('คอร์ส / แบรนด์', 'Course', escText(row.course || '—'))}
        ${metaRow('ตั้งเวลาไว้', 'Scheduled for', fmt(row.scheduled_at))}
        ${row.published_at ? metaRow('โพสต์เมื่อ', 'Published at', fmt(row.published_at)) : ''}
        ${row.last_attempt_at ? metaRow('พยายามล่าสุด', 'Last attempt', fmt(row.last_attempt_at)) : ''}
        ${row.retry_count ? metaRow('จำนวนครั้งที่ลอง', 'Attempts', row.retry_count) : ''}
      </div>
    </div>
    ${actions ? `<div style="padding:12px 20px;border-top:1px solid var(--line);display:flex;gap:8px;justify-content:flex-end">${actions}</div>` : ''}
  </div>`;
  ov.addEventListener('click', async (e) => {
    if (e.target === ov || e.target.closest('[data-logclose]')) { ov.remove(); return; }
    const rt = e.target.closest('[data-logretry]');
    if (rt) {
      rt.disabled = true;
      try { await api('/api/content/' + row.id + '/retry', { method: 'POST' }); } catch (_) {}
      window.PP._automationCache = null; window.PP._calCache = null;
      ov.remove();
      if (typeof window.render === 'function') window.render();
      return;
    }
    const dl = e.target.closest('[data-logdelete]');
    if (dl) {
      if (!confirm(T('ลบรายการนี้?', 'Delete this entry?'))) return;
      try { await api('/api/content/' + row.id, { method: 'DELETE' }); } catch (_) {}
      window.PP._automationCache = null; window.PP._calCache = null;
      ov.remove();
      if (typeof window.render === 'function') window.render();
      return;
    }
  });
  document.body.appendChild(ov);
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); } });
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString(state.lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(state.lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' });
}

// Derive a per-platform success indicator from post_results so the table
// can show the same icon+badge pattern as the old mock (FB ok / IG fail).
function platformIndicators(post) {
  const results = post.post_results || {};
  return (post.platforms || ['facebook']).map((p) => {
    const r = results[p] || {};
    const ok = r.success || r.ok || !!r.post_id;
    return [p, ok ? 'ok' : (r.error ? 'fail' : 'pending')];
  });
}

export function pageAutomation() {
  loadAutomationData();
  bindLogView();
  startAutoLive();
  const cache = window.PP._automationCache || { loading: true };

  const actions = `
    <span style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--green);font-weight:700;margin-right:4px"><span class="dot" style="width:7px;height:7px;background:var(--green);border-radius:99px"></span>${T('อัปเดตสดทุก 15 วิ', 'Live · 15s')}</span>
    <button class="btn outline sm" data-automation-refresh="1">${I('refresh', 14)} ${T('รีเฟรช', 'Refresh')}</button>
  `;

  const summary = cache.summary && cache.summary.contents ? cache.summary.contents : null;
  // Table rows from the full contents list. Effective time = published_at for
  // posted rows, scheduled_at for everything else (so a scheduled row shows
  // WHEN it will fire, not "—").
  const allRows = (cache.contents || []).map((c) => ({
    ...c,
    when: c.status === 'published' ? (c.published_at || c.scheduled_at) : (c.scheduled_at || c.published_at || c.created_at),
  })).sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));

  // KPI cards — fall back to 0 when summary missing
  const kpi = summary ? [
    { v: summary.published || 0,            l_th: 'โพสต์สำเร็จ (ทั้งหมด)', l_en: 'Posted (all-time)',     icon: 'check',    color: 'green'  },
    { v: summary.scheduled || 0,            l_th: 'รอเวลา',                 l_en: 'Scheduled',             icon: 'clock',    color: 'blue'   },
    { v: summary.failed    || 0,            l_th: 'ล้มเหลว / ต้องแก้',      l_en: 'Failed / needs fix',    icon: 'alert',    color: 'red'    },
    { v: ((summary.publishedThisMonth || 0) + ' / ' + (summary.total || 0)),
                                            l_th: 'เดือนนี้ / ทั้งหมด',     l_en: 'This month / total',    icon: 'trending', color: 'orange' },
  ] : [];

  const filter = state.autoFilter || 'all';
  const tableRows = filter === 'all' ? allRows : allRows.filter((r) => (r.status || 'published') === filter);

  return html`${raw(head('OPERATIONS', 'Automation Log',
    T('ประวัติการโพสต์อัตโนมัติ · ดึงจากระบบจริง', 'Auto-post history · live data'),
    actions
  ))}

  ${cache.loading ? raw(`<div class="card" style="text-align:center;padding:32px;color:var(--muted)">
    ⏳ ${T('กำลังโหลด…', 'Loading…')}
  </div>`) : ''}

  ${cache.error ? raw(`<div class="card" style="background:#FEE2E2;border-color:#FCA5A5;color:#991B1B;padding:14px">
    ⚠ ${T('โหลดข้อมูลไม่สำเร็จ', 'Failed to load')}: ${cache.error}
  </div>`) : ''}

  ${summary ? raw(`<div class="grid g4" style="margin-bottom:18px">
    ${kpi.map((s) => `<div class="card">
      <div class="metric">
        <div class="metricIcon ${s.color}">${I(s.icon, 20)}</div>
        <div style="flex:1">
          <div class="metricVal">${s.v}</div>
          <div class="metricLab">${t({ th: s.l_th, en: s.l_en })}</div>
        </div>
      </div>
    </div>`).join('')}
  </div>`) : ''}

  ${summary ? raw(`<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
    <div class="tabs">
      ${[
        ['all',       'ทั้งหมด',  'All',       summary.total      || 0],
        ['published', 'สำเร็จ',   'Posted',    summary.published  || 0],
        ['scheduled', 'รอเวลา',   'Scheduled', summary.scheduled  || 0],
        ['failed',    'ล้มเหลว',  'Failed',    summary.failed     || 0],
      ].map(([id, th, en, n]) => `<button class="tab ${filter === id ? 'active' : ''}" data-set="autoFilter=${id}">${t({ th, en })} <span style="padding:0 6px;border-radius:99px;background:${filter === id ? 'rgba(255,255,255,.25)' : 'var(--cream2)'};font-size:10px">${n}</span></button>`).join('')}
    </div>
  </div>`) : ''}

  ${(summary && summary.total === 0) ? raw(`<div class="card" style="text-align:center;padding:40px 24px">
    <div style="font-size:42px;margin-bottom:8px">📭</div>
    <h3 class="cardTitle" style="margin-bottom:6px">${T('ยังไม่มีโพสต์', 'No posts yet')}</h3>
    <p class="cardSub" style="max-width:420px;margin:0 auto">
      ${T('สร้างคอนเทนต์ครั้งแรกที่หน้า Caption / Creative / Talking Avatar แล้วตั้งเวลาโพสต์ — รายการจะมาแสดงที่นี่อัตโนมัติ',
         'Create your first content on the Caption / Creative / Talking Avatar pages and schedule a post — entries will appear here automatically.')}
    </p>
  </div>`) : ''}

  ${(summary && summary.total > 0 && tableRows.length === 0) ? raw(`<div class="card" style="text-align:center;padding:24px;color:var(--muted)">
    ${T('ไม่มีโพสต์ในกลุ่มที่เลือก', 'No posts in this filter')}
  </div>`) : ''}

  ${tableRows.length > 0 ? raw(`<div class="card" style="padding:0;overflow:hidden">
    <table class="tbl">
      <thead><tr>
        <th>${T('เวลา', 'Time')}</th>
        <th>${T('Hook', 'Hook')}</th>
        <th>${T('ช่องทาง', 'Channels')}</th>
        <th>${T('สถานะ', 'Status')}</th>
        <th>${T('คอร์ส', 'Course')}</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${tableRows.map((r) => {
          const status = r.status || 'published';
          const s = STATUS_MAP[status] || STATUS_MAP.published;
          const indicators = platformIndicators(r);
          return `<tr data-logview="${r.id}" style="cursor:pointer">
            <td>
              <div style="font-size:14px;font-weight:700;color:var(--purple)">${formatTime(r.when)}</div>
              <div style="font-size:11px;color:var(--muted)">${formatDate(r.when)}</div>
            </td>
            <td>
              <div style="font-size:13px;font-weight:600;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:380px">${escText((r.hook || '').slice(0, 100)) || '—'}</div>
            </td>
            <td><div style="display:flex;gap:6px">${indicators.map(([ic, st]) => `<div style="position:relative;display:inline-flex">${I(ic, 18, ic === 'facebook' ? '#1877F2' : ic === 'instagram' ? '#E1306C' : '#0F172A')}<span style="position:absolute;bottom:-2px;right:-2px;width:7px;height:7px;border-radius:99px;background:${st === 'ok' ? 'var(--green)' : st === 'fail' ? 'var(--red)' : 'var(--yellow)'};border:1.5px solid #fff"></span></div>`).join('')}</div></td>
            <td><span class="pill ${s.pill}"><span class="dot" style="background:${s.dot};width:6px;height:6px"></span> ${T(s.th, s.en)}</span></td>
            <td style="font-size:12px;color:var(--ink)">${escText(r.course || '—')}</td>
            <td><button class="btn ghost sm iconOnly" data-logview="${r.id}">${I('chev_right', 14)}</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:var(--muted)">
    <span>${T('แสดง ' + tableRows.length + ' รายการ', 'Showing ' + tableRows.length)}</span>
  </div>`) : ''}
  `;
}
