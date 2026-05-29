// public/js/pages/automation.js
//
// Automation Log — history of every auto-post. Pulls real data from the
// backend (/api/analytics/summary for KPI counts, /api/analytics/posts
// for the published-post list) instead of the Phase-3 mock rows.
//
// What the page shows:
//   • 4 KPI cards from /api/analytics/summary.contents (real counts of
//     published / scheduled / failed / total)
//   • Status filter tabs (counts match the KPIs above)
//   • Table of published posts from /api/analytics/posts (with per-
//     platform success indicators from post_results)
//   • Friendly empty state when no posts have been published yet
//
// Data fetched once per page-load, cached on window.PP._automationCache
// so the filter tabs don't refetch.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { head } from '../components/head.js';
import { api } from '../api.js';

const STATUS_MAP = {
  published: { th: 'โพสต์สำเร็จ', en: 'Posted',    pill: 'green',  dot: '#16A34A' },
  scheduled: { th: 'รอเวลา',       en: 'Scheduled', pill: 'blue',   dot: '#1D4ED8' },
  running:   { th: 'กำลังโพสต์',   en: 'Posting',   pill: 'orange', dot: '#FF7A1A' },
  failed:    { th: 'ล้มเหลว',      en: 'Failed',    pill: 'red',    dot: '#DC2626' },
  retry:     { th: 'รอ retry',     en: 'Retrying',  pill: 'yellow', dot: '#D97706' },
  draft:     { th: 'ฉบับร่าง',     en: 'Draft',     pill: 'grey',   dot: '#94A3B8' },
};

async function loadAutomationData() {
  window.PP = window.PP || {};
  if (window.PP._automationCache) return;
  window.PP._automationCache = { loading: true };
  try {
    const [summary, posts] = await Promise.all([
      api('/api/analytics/summary'),
      api('/api/analytics/posts?limit=50'),
    ]);
    window.PP._automationCache = { loading: false, summary, posts };
  } catch (e) {
    window.PP._automationCache = { loading: false, error: e.message };
  }
  try { if (state.page === 'automation' && typeof window.render === 'function') window.render(); } catch (_) {}
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
  const cache = window.PP._automationCache || { loading: true };

  const actions = `
    <button class="btn outline sm" data-automation-refresh="1">${I('refresh', 14)} ${T('รีเฟรช', 'Refresh')}</button>
  `;

  const summary = cache.summary && cache.summary.contents ? cache.summary.contents : null;
  const posts = (cache.posts && cache.posts.posts) || [];

  // KPI cards — fall back to 0 when summary missing
  const kpi = summary ? [
    { v: summary.published || 0,            l_th: 'โพสต์สำเร็จ (ทั้งหมด)', l_en: 'Posted (all-time)',     icon: 'check',    color: 'green'  },
    { v: summary.scheduled || 0,            l_th: 'รอเวลา',                 l_en: 'Scheduled',             icon: 'clock',    color: 'blue'   },
    { v: summary.failed    || 0,            l_th: 'ล้มเหลว / ต้องแก้',      l_en: 'Failed / needs fix',    icon: 'alert',    color: 'red'    },
    { v: ((summary.publishedThisMonth || 0) + ' / ' + (summary.total || 0)),
                                            l_th: 'เดือนนี้ / ทั้งหมด',     l_en: 'This month / total',    icon: 'trending', color: 'orange' },
  ] : [];

  const filter = state.autoFilter || 'all';
  // We currently only fetch published posts — other statuses need new endpoints.
  // For now, the table is just the published list regardless of filter (the
  // tab counts are still real, so the filter UI stays informative).
  const tableRows = posts;

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
          return `<tr>
            <td>
              <div style="font-size:14px;font-weight:700;color:var(--purple)">${formatTime(r.published_at)}</div>
              <div style="font-size:11px;color:var(--muted)">${formatDate(r.published_at)}</div>
            </td>
            <td>
              <div style="font-size:13px;font-weight:600;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:380px">${(r.hook || '').slice(0, 100) || '—'}</div>
            </td>
            <td><div style="display:flex;gap:6px">${indicators.map(([ic, st]) => `<div style="position:relative;display:inline-flex">${I(ic, 18, ic === 'facebook' ? '#1877F2' : ic === 'instagram' ? '#E1306C' : '#0F172A')}<span style="position:absolute;bottom:-2px;right:-2px;width:7px;height:7px;border-radius:99px;background:${st === 'ok' ? 'var(--green)' : st === 'fail' ? 'var(--red)' : 'var(--yellow)'};border:1.5px solid #fff"></span></div>`).join('')}</div></td>
            <td><span class="pill ${s.pill}"><span class="dot" style="background:${s.dot};width:6px;height:6px"></span> ${T(s.th, s.en)}</span></td>
            <td style="font-size:12px;color:var(--ink)">${r.course || '—'}</td>
            <td><button class="btn ghost sm iconOnly">${I('chev_right', 14)}</button></td>
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
