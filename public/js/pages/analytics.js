// public/js/pages/analytics.js
//
// Analytics dashboard — replaces the Phase-3 hand-rolled mock with real
// data from /api/events/summary. Three views:
//
//   • 4 KPI cards: total events, unique pages, top event, top page
//   • Events-per-day bar chart (last N days)
//   • "Most used features" leaderboard (event-name counts)
//   • Recent activity feed (last 50 raw events)
//
// Data flow:
//   render() → empty shell with loading state
//   loadAnalyticsData() → fetch + cache in window.PP._analyticsCache
//                      → trigger a re-render so values fill in
//
// The cache is keyed by the time-window selector (7 / 30 / 90 days) so
// switching windows doesn't refetch when we already have the data.

import { html, raw } from '../html.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { head } from '../components/head.js';
import { state } from '../state.js';
import { api } from '../api.js';

// Human-friendly labels for the event names emitted by track().
// New event types fall back to the snake_case name.
const EVENT_LABELS = {
  page_view:           { th: 'เปิดหน้า',              en: 'Page view' },
  brand_switched:      { th: 'สลับแบรนด์',             en: 'Brand switched' },
  voice_changed:       { th: 'เปลี่ยน Brand Voice',     en: 'Voice changed' },
  archetype_changed:   { th: 'เปลี่ยน Archetype',       en: 'Archetype changed' },
  topics_generated:    { th: 'AI สร้างหัวข้อ',          en: 'Topics generated' },
  topic_used:          { th: 'ใช้หัวข้อจาก Topic Bank',  en: 'Topic used' },
  content_generated:   { th: 'สร้างคอนเทนต์',           en: 'Content generated' },
  post_published:      { th: 'โพสต์ออก',                en: 'Post published' },
  post_scheduled:      { th: 'ตั้งเวลาโพสต์',           en: 'Post scheduled' },
};

const PAGE_LABELS = {
  profile:    { th: 'โปรไฟล์',           en: 'Profile' },
  topics:     { th: 'Topic Bank',        en: 'Topic Bank' },
  caption:    { th: 'สร้าง Caption',     en: 'Caption' },
  creative:   { th: 'สร้างรูปภาพ',       en: 'Create images' },
  avatar:     { th: 'Talking Avatar',    en: 'Talking Avatar' },
  textvideo:  { th: 'Text to Video',     en: 'Text to Video' },
  automation: { th: 'Automation Log',    en: 'Automation' },
  analytics:  { th: 'Analytics',         en: 'Analytics' },
  calendar:   { th: 'ปฏิทิน',            en: 'Calendar' },
  library:    { th: 'คลังคอนเทนต์',       en: 'Library' },
};

function labelEvent(name) {
  const e = EVENT_LABELS[name];
  return e ? t(e) : name;
}
function labelPage(page) {
  const p = PAGE_LABELS[page];
  return p ? t(p) : (page || '—');
}

// ── Data fetching ───────────────────────────────────────────────────
// Kicks off a fetch IF we don't already have data for the chosen window.
// Re-renders when the response lands. Tolerant of API failure → leaves
// the cached state empty so the UI shows the "no data yet" empty state.
async function loadAnalyticsData(days) {
  window.PP = window.PP || {};
  window.PP._analyticsCache = window.PP._analyticsCache || {};
  if (window.PP._analyticsCache[days]) return;
  window.PP._analyticsCache[days] = { loading: true };
  try {
    // Fetch events summary + cost breakdown in parallel — the Analytics page
    // shows both side-by-side, no point waterfalling them.
    const [summary, costs] = await Promise.all([
      api(`/api/events/summary?days=${days}`),
      api(`/api/analytics/costs?days=${days}`).catch(() => null),  // costs is optional
    ]);
    window.PP._analyticsCache[days] = { loading: false, data: summary, costs };
  } catch (e) {
    window.PP._analyticsCache[days] = { loading: false, error: e.message };
  }
  // Re-render only if we're still on the Analytics page when the fetch lands.
  try { if (state.page === 'analytics' && typeof window.render === 'function') window.render(); } catch (_) {}
}

function topEntries(obj, n) {
  return Object.entries(obj || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function relativeTime(iso) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

// HTML escape for raw error messages/stacks that go into innerHTML —
// stack traces contain `<` `>` `&` from generic types / file paths and would
// break layout / open injection holes without escaping.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function pageAnalytics() {
  const days = state.analyticsDays || 7;

  // Kick off the fetch (idempotent — won't re-fire if data already cached).
  loadAnalyticsData(days);

  const cache = (window.PP && window.PP._analyticsCache && window.PP._analyticsCache[days]) || { loading: true };
  const data = cache.data;
  const costs = cache.costs;

  const total      = data ? data.total : 0;
  const byName     = data ? data.by_name : {};
  const byDay      = data ? data.by_day : {};
  const byPage     = data ? data.by_page : {};
  const recent     = data ? data.recent : [];
  const uniquePages = Object.keys(byPage).length;
  const topEventEntry = topEntries(byName, 1)[0];
  const topPageEntry  = topEntries(byPage, 1)[0];

  // Build a continuous date axis (oldest → newest), filling missing days w/ 0.
  const dayKeys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const dayValues = dayKeys.map((k) => byDay[k] || 0);
  const maxDay = Math.max(1, ...dayValues);

  const actions = `
    <div style="display:flex;gap:6px">
      ${[7, 30, 90].map((d) => `<button class="btn ${d === days ? 'outline' : 'ghost'} sm" data-analytics-days="${d}">
        ${T(d + ' วัน', d + 'd')}
      </button>`).join('')}
    </div>
  `;

  const empty = !cache.loading && total === 0;

  return html`${raw(head('OPERATIONS', 'Analytics',
    T('ภาพรวมการใช้งานจริง — เก็บจากปุ่มกด/หน้าที่เปิดในแอป', 'Real usage — tracked from in-app actions'),
    raw(actions)
  ))}

  ${cache.loading ? raw(`<div class="card" style="text-align:center;padding:32px;color:var(--muted)">
    ⏳ ${T('กำลังโหลดข้อมูล…', 'Loading…')}
  </div>`) : ''}

  ${cache.error ? raw(`<div class="card" style="background:#FEE2E2;border-color:#FCA5A5;color:#991B1B;padding:14px">
    ⚠ ${T('โหลดข้อมูลไม่สำเร็จ', 'Failed to load')}: ${cache.error}
  </div>`) : ''}

  ${empty ? raw(`<div class="card" style="text-align:center;padding:40px 24px">
    <div style="font-size:42px;margin-bottom:8px">📊</div>
    <h3 class="cardTitle" style="margin-bottom:6px">${T('ยังไม่มีข้อมูลกิจกรรม', 'No activity yet')}</h3>
    <p class="cardSub" style="max-width:420px;margin:0 auto">
      ${T('ระบบเพิ่งเริ่มเก็บ events — ลองใช้ฟีเจอร์ต่างๆ (สลับแบรนด์ · เปลี่ยน Voice · ปั่นหัวข้อ · ใช้หัวข้อ) แล้วกลับมาดูใหม่ในไม่กี่นาที',
         'Tracking just started — use a few features (switch brand, change voice, generate topics, use a topic), then refresh.')}
    </p>
  </div>`) : ''}

  ${data && total > 0 ? raw(`
  <div class="grid g4" style="margin-bottom:20px">
    ${[
      { v: total.toLocaleString(),         l_th: 'กิจกรรมทั้งหมด',  l_en: 'Total events',  color: '#FF7A1A', icon: 'sparkles' },
      { v: uniquePages.toLocaleString(),   l_th: 'หน้าที่เข้าใช้',   l_en: 'Unique pages',  color: '#2563EB', icon: 'home' },
      { v: topEventEntry ? labelEvent(topEventEntry[0]) : '—',
        sub: topEventEntry ? (topEventEntry[1] + ' ครั้ง') : '',
        l_th: 'กิจกรรมที่ใช้บ่อยสุด', l_en: 'Top event',     color: '#16A34A', icon: 'trending' },
      { v: topPageEntry ? labelPage(topPageEntry[0]) : '—',
        sub: topPageEntry ? (topPageEntry[1] + ' ครั้ง') : '',
        l_th: 'หน้าที่เข้ามากสุด',     l_en: 'Top page',      color: '#9F1239', icon: 'chart' },
    ].map((k) => `<div class="card">
      <div style="display:flex;align-items:center;gap:8px;color:${k.color};margin-bottom:6px">
        ${I(k.icon, 14, k.color)}
        <div class="metricLab">${t({ th: k.l_th, en: k.l_en })}</div>
      </div>
      <div class="metricVal" style="font-size:26px;line-height:1.2;color:var(--purple);word-break:break-word">${k.v}</div>
      ${k.sub ? `<div class="micro" style="margin-top:4px;color:var(--muted)">${k.sub}</div>` : ''}
    </div>`).join('')}
  </div>

  <!-- Daily bar chart -->
  <div class="card" style="margin-bottom:18px">
    <div class="cardHeader">
      <div>
        <h3 class="cardTitle">${T('กิจกรรมรายวัน', 'Events per day')}</h3>
        <p class="cardSub">${T(days + ' วันล่าสุด', 'Last ' + days + ' days')}</p>
      </div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:6px;height:180px;padding:8px 4px;overflow-x:auto">
      ${dayKeys.map((k, i) => {
        const v = dayValues[i];
        const h = (v / maxDay) * 100;
        const isLast = (i === dayKeys.length - 1);
        return `<div style="flex:1;min-width:14px;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div class="micro" style="font-weight:700;color:${isLast ? 'var(--orange)' : 'var(--muted)'}">${v || ''}</div>
          <div style="flex:1;width:100%;display:flex;align-items:flex-end">
            <div style="width:100%;height:${h}%;background:linear-gradient(180deg, var(--orange), #F97316);border-radius:4px 4px 0 0;min-height:${v > 0 ? 2 : 0}px"></div>
          </div>
          <span style="font-size:10px;color:${isLast ? 'var(--orange)' : 'var(--muted)'};font-weight:${isLast ? 800 : 500};white-space:nowrap">${k.slice(5)}</span>
        </div>`;
      }).join('')}
    </div>
  </div>

  ${(() => {
    // Surface client-side errors captured via window.onerror /
    // unhandledrejection (see public/js/track.js trackError). These are the
    // user-facing crashes we can't see from the server side — usually a
    // bug in a render function, a null property access, or a failing fetch.
    const errors = (recent || []).filter((ev) => ev.name === 'client_error');
    if (errors.length === 0) return '';
    return `<div class="card" style="margin-bottom:18px;background:#FEF2F2;border-color:#FCA5A5">
      <div class="cardHeader">
        <div>
          <h3 class="cardTitle" style="color:#991B1B">⚠ ${T('Client errors', 'Client errors')} (${errors.length})</h3>
          <p class="cardSub" style="color:#7F1D1D">${T('JavaScript crash บนเบราว์เซอร์ — ดึงจาก window.onerror', 'JavaScript crashes — captured from window.onerror')}</p>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto">
        ${errors.slice(0, 10).map((ev) => {
          const p = ev.props || {};
          return `<details style="padding:10px 12px;border-radius:8px;background:#fff;border:1px solid #FCA5A5">
            <summary style="cursor:pointer;display:flex;align-items:center;gap:8px;list-style:none">
              <span style="font-size:12.5px;font-weight:700;color:#991B1B;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.message || 'unknown')}</span>
              <span class="micro" style="color:#7F1D1D;white-space:nowrap">${relativeTime(ev.created_at)}</span>
            </summary>
            ${p.stack ? `<pre style="margin-top:8px;padding:8px;background:#FEF2F2;border-radius:6px;font-size:10.5px;color:#7F1D1D;overflow-x:auto;max-height:180px;font-family:var(--mono)">${esc(p.stack)}</pre>` : ''}
            ${p.url ? `<div class="micro" style="margin-top:4px;color:#7F1D1D">${esc(p.url)}</div>` : ''}
          </details>`;
        }).join('')}
      </div>
    </div>`;
  })()}

  ${costs ? `
  <!-- AI Cost & Savings -->
  <div class="card" style="margin-bottom:18px;background:linear-gradient(135deg,#FFF7ED 0%,#FFEDD5 100%);border-color:#FED7AA">
    <div class="cardHeader">
      <div>
        <h3 class="cardTitle">💰 ${T('ค่าใช้จ่าย AI', 'AI Cost')}</h3>
        <p class="cardSub">${T(days + ' วันล่าสุด · ' + (costs.contents_in_window || 0) + ' โพสต์', 'Last ' + days + ' days · ' + (costs.contents_in_window || 0) + ' posts')}</p>
      </div>
      ${costs.savings_vs_hedra_usd > 0.01 ? `<span class="pill green" style="height:28px;padding:0 12px;font-size:11.5px">
        ${T('ประหยัด', 'Saved')} $${costs.savings_vs_hedra_usd} ${T('เทียบกับ Hedra', 'vs Hedra')}
      </span>` : ''}
    </div>

    <div class="grid g4" style="gap:12px;margin-top:14px">
      <!-- Total -->
      <div style="padding:14px;border-radius:12px;background:#fff;border:2px solid var(--orange)">
        <div class="micro" style="color:var(--muted);font-weight:700">${T('รวมทั้งหมด', 'Total')}</div>
        <div style="font-size:28px;font-weight:900;color:var(--purple);line-height:1.1;margin-top:4px">
          $${costs.total_usd}
        </div>
        <div class="micro" style="margin-top:2px;color:var(--muted)">฿${costs.total_thb.toLocaleString()}</div>
      </div>
      <!-- Per-category -->
      ${[
        { key: 'text',   icon: '📝', label_th: 'ข้อความ',  label_en: 'Text' },
        { key: 'image',  icon: '🎨', label_th: 'รูปภาพ',   label_en: 'Image' },
        { key: 'video',  icon: '🎬', label_th: 'วิดีโอ',   label_en: 'Video' },
        { key: 'avatar', icon: '🗣',  label_th: 'Avatar',  label_en: 'Avatar' },
      ].slice(0, 3).map((cat) => {
        const b = costs.breakdown[cat.key] || { count: 0, cost: 0, unit: 0 };
        return `<div style="padding:14px;border-radius:12px;background:#fff;border:1px solid var(--line)">
          <div class="micro" style="color:var(--muted);font-weight:700">${cat.icon} ${t({ th: cat.label_th, en: cat.label_en })}</div>
          <div style="font-size:18px;font-weight:800;color:var(--purple);line-height:1.1;margin-top:4px">
            $${b.cost.toFixed(2)}
          </div>
          <div class="micro" style="margin-top:2px;color:var(--muted)">${b.count} × $${b.unit}</div>
        </div>`;
      }).join('')}
    </div>

    ${costs.breakdown.avatar && costs.breakdown.avatar.count > 0 ? `
    <div style="margin-top:14px;padding:12px 14px;background:#fff;border:1px solid var(--line);border-radius:10px;display:flex;align-items:center;gap:12px">
      <div style="font-size:24px">🗣</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--purple)">
          Avatar · ${costs.breakdown.avatar.count} ${T('คลิป', 'clips')}
        </div>
        <div class="micro" style="color:var(--muted)">
          ${T('ใช้ fal-ai/infinitalk @ $0.20/30s · ถ้าใช้ Hedra Avatar จะแพงกว่า 10x ($2.10/30s)', 'Using fal-ai/infinitalk @ $0.20/30s · Hedra Avatar would be 10x more ($2.10/30s)')}
        </div>
      </div>
      <div style="font-size:16px;font-weight:800;color:var(--green)">
        $${costs.breakdown.avatar.cost.toFixed(2)}
      </div>
    </div>` : ''}

    <div class="micro" style="margin-top:10px;color:var(--muted);font-size:10.5px">
      💡 ${T('ราคาประเมินจาก provider ที่ใช้จริง (Claude Haiku / Gemini / fal.ai). ตัวเลขจริงอาจต่างเล็กน้อยจากการสลับ model', 'Estimates use the cheapest provider per category (Claude Haiku / Gemini / fal.ai). Actual cost may vary if model is switched.')}
    </div>
  </div>
  ` : ''}

  <!-- Top features + recent activity -->
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:18px">
    <div class="card">
      <h3 class="cardTitle" style="margin-bottom:14px">${T('ฟีเจอร์ที่ใช้บ่อยสุด', 'Most used features')}</h3>
      ${topEntries(byName, 8).map(([name, count]) => {
        const pct = Math.round((count / total) * 100);
        return `<div style="margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:12.5px;color:var(--purple);font-weight:700;flex:1">${labelEvent(name)}</span>
            <span style="font-size:13px;font-weight:800;color:var(--purple)">${count}</span>
            <span style="font-size:10.5px;color:var(--muted);width:38px;text-align:right">${pct}%</span>
          </div>
          <div style="height:6px;background:var(--cream2);border-radius:99px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:var(--orange);border-radius:99px"></div>
          </div>
        </div>`;
      }).join('')}
      ${topEntries(byName, 8).length === 0 ? '<div class="micro" style="color:var(--muted);text-align:center;padding:20px">—</div>' : ''}
    </div>

    <div class="card">
      <h3 class="cardTitle" style="margin-bottom:14px">${T('กิจกรรมล่าสุด', 'Recent activity')}</h3>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto">
        ${(recent || []).slice(0, 30).map((ev) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--cream2);font-size:12px">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${labelEvent(ev.name)}</div>
            <div class="micro" style="color:var(--muted)">${ev.page ? labelPage(ev.page) : ''}</div>
          </div>
          <span class="micro" style="color:var(--muted);white-space:nowrap">${relativeTime(ev.created_at)}</span>
        </div>`).join('')}
        ${(!recent || recent.length === 0) ? '<div class="micro" style="color:var(--muted);text-align:center;padding:20px">—</div>' : ''}
      </div>
    </div>
  </div>
  `) : ''}
  `;
}
