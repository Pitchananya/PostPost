// public/js/pages/analytics.js
//
// Analytics dashboard — KPI cards, daily bar chart, channel breakdown,
// Top-5 posts. Mirrors the inline pageAnalytics() exactly; the data is
// hand-rolled mock data (also matches the inline copy). When Phase 4 pulls
// real metrics from FB/IG/TikTok this becomes a fetch().
//
// All HTML-emitting helpers (I, head, sparkPath) wrapped in raw() per the
// html`` safety model.

import { html, raw } from '../html.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { head } from '../components/head.js';

export function pageAnalytics() {
  const sparkPath = (data, color, h = 36, w = 100) => {
    const max = Math.max(...data), min = Math.min(...data);
    const pts = data.map((v, i) => { const x = (i / (data.length - 1)) * w; const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2; return `${x},${y}`; }).join(' ');
    return `<svg width="${w}" height="${h}" style="overflow:visible">
      <polygon points="0,${h} ${pts} ${w},${h}" fill="${color}22"/>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  };

  const days = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const fb = [12, 8, 16, 14, 22, 18, 20, 26, 32, 28, 38];
  const ig = [8, 6, 10, 12, 14, 11, 14, 18, 22, 21, 27];
  const tt = [2, 3, 4, 5, 6, 4, 8, 9, 12, 14, 19];
  const maxAll = Math.max(...fb, ...ig, ...tt) * 1.2;

  const actions = `<button class="btn outline sm">${I('calendar', 14)} ${T('30 วันล่าสุด', 'Last 30 days')} ${I('chev_down', 12)}</button>
     <button class="btn outline sm">${I('download', 14)} Export</button>`;

  return html`${raw(head('OPERATIONS', 'Analytics',
    T('ภาพรวมประสิทธิภาพคอนเทนต์ · ดึงข้อมูลจาก FB/IG/TikTok โดยตรง', 'Content performance · pulled directly from FB/IG/TikTok'),
    actions
  ))}

  <div class="grid g4" style="margin-bottom:20px">
    ${raw([
      { v: '124.8k', l_th: 'การเข้าถึง (Reach)', l_en: 'Reach',       delta: '+18.4%', color: '#FF7A1A', data: [22, 28, 24, 31, 36, 33, 42, 48, 52, 58, 64] },
      { v: '8,420',  l_th: 'Engagement',          l_en: 'Engagement',  delta: '+22.1%', color: '#2563EB', data: [14, 18, 16, 20, 22, 24, 26, 28, 32, 36, 42] },
      { v: '2,184',  l_th: 'คลิกที่ลิงก์',          l_en: 'Link clicks', delta: '+4.2%',  color: '#16A34A', data: [10, 12, 11, 14, 12, 15, 14, 17, 18, 19, 20] },
      { v: '218',    l_th: 'โพสต์ทั้งหมด',         l_en: 'Total posts', delta: '-2.3%',  color: '#94A3B8', down: true, data: [22, 20, 24, 22, 26, 24, 22, 20, 22, 21, 20] },
    ].map((k) => `<div class="card">
      <div class="split" style="align-items:flex-start">
        <div>
          <div class="metricLab">${t({ th: k.l_th, en: k.l_en })}</div>
          <div class="metricVal" style="font-size:32px;margin-top:4px">${k.v}</div>
          <div class="delta ${k.down ? 'down' : 'up'}">${I(k.down ? 'chev_down' : 'chev_up', 12)} ${k.delta}</div>
        </div>
        <div class="sparkBox">${sparkPath(k.data, k.color)}</div>
      </div>
    </div>`).join(''))}
  </div>

  <div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px;margin-bottom:18px">
    <!-- bar chart -->
    <div class="card">
      <div class="cardHeader">
        <div>
          <h3 class="cardTitle">${raw(T('โพสต์ต่อวัน · แยกช่องทาง', 'Posts per day · by channel'))}</h3>
          <p class="cardSub">${raw(T('1–11 พ.ย. 2026', 'Nov 1–11, 2026'))}</p>
        </div>
        <div style="display:flex;gap:12px;font-size:12px">
          <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:#1877F2;width:8px;height:8px"></span>Facebook</span>
          <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:#E1306C;width:8px;height:8px"></span>Instagram</span>
          <span style="display:inline-flex;align-items:center;gap:6px"><span class="dot" style="background:#0F172A;width:8px;height:8px"></span>TikTok</span>
        </div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:14px;height:200px;padding:0 4px">
        ${raw(days.map((d, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="flex:1;display:flex;align-items:flex-end;gap:3px;width:100%;justify-content:center">
            <div style="width:10px;height:${(fb[i] / maxAll) * 100}%;background:#1877F2;border-radius:4px 4px 0 0"></div>
            <div style="width:10px;height:${(ig[i] / maxAll) * 100}%;background:#E1306C;border-radius:4px 4px 0 0"></div>
            <div style="width:10px;height:${(tt[i] / maxAll) * 100}%;background:#0F172A;border-radius:4px 4px 0 0"></div>
          </div>
          <span style="font-size:11px;color:${i === 10 ? 'var(--orange)' : 'var(--muted)'};font-weight:${i === 10 ? 800 : 500}">${d}</span>
        </div>`).join(''))}
      </div>
    </div>

    <!-- engagement by channel -->
    <div class="card">
      <h3 class="cardTitle" style="margin-bottom:16px">${raw(T('การมีส่วนร่วมตามช่องทาง', 'Engagement by channel'))}</h3>
      ${raw([
        { icon: 'facebook',  name: 'Facebook',  v: '4,820', pct: 57, color: '#1877F2' },
        { icon: 'instagram', name: 'Instagram', v: '2,820', pct: 33, color: '#E1306C' },
        { icon: 'tiktok',    name: 'TikTok',    v: '780',   pct: 10, color: '#0F172A' },
      ].map((p) => `<div style="margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${I(p.icon, 18, p.color)}
          <span style="font-size:13px;font-weight:700;color:var(--purple)">${p.name}</span>
          <span style="margin-left:auto;font-size:14px;font-weight:800;color:var(--purple)">${p.v}</span>
          <span style="font-size:11px;color:var(--muted);width:36px;text-align:right">${p.pct}%</span>
        </div>
        <div style="height:8px;background:var(--cream2);border-radius:99px;overflow:hidden"><div style="width:${p.pct}%;height:100%;background:${p.color};border-radius:99px"></div></div>
      </div>`).join(''))}
      <hr class="divider"/>
      <h3 class="cardTitle" style="font-size:13.5px;margin-bottom:10px">${raw(T('ประเภทคอนเทนต์ที่ทำผลงานดี', 'Top-performing content types'))}</h3>
      ${raw([
        { l_th: 'Reels (Talking Avatar)',     l_en: 'Reels (Talking Avatar)',     v: '38%', color: '#FF7A1A' },
        { l_th: 'อัลบั้ม / Carousel',          l_en: 'Album / Carousel',           v: '32%', color: '#2563EB' },
        { l_th: 'รูปเดี่ยว + แคปยาว',          l_en: 'Single image + long caption', v: '22%', color: '#16A34A' },
        { l_th: 'Story',                      l_en: 'Story',                       v: '8%',  color: '#94A3B8' },
      ].map((t2) => `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:13px">
        <span class="dot" style="background:${t2.color};width:8px;height:8px"></span>
        <span style="flex:1;color:var(--ink)">${t({ th: t2.l_th, en: t2.l_en })}</span>
        <b style="color:var(--purple)">${t2.v}</b>
      </div>`).join(''))}
    </div>
  </div>

  <!-- top posts -->
  <div class="card">
    <div class="cardHeader">
      <h3 class="cardTitle">${raw(T('โพสต์ Top 5 — Engagement สูงสุด', 'Top 5 posts — highest engagement'))}</h3>
      <button class="btn ghost sm">${raw(T('ดูทั้งหมด', 'View all'))}</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${raw([
        { rank: 1, topic_th: 'รีวิวจริง: ผิวบอบบาง 10 ปี เจอตัวช่วย',          topic_en: 'Real review: 10 years sensitive skin, finally fixed', ch: 'facebook',  reach: '38.2k', eng: '4.2k', clicks: '892' },
        { rank: 2, topic_th: 'อัลบั้ม Before/After 7 วัน Rose Repair',         topic_en: 'Before/After album · 7 days of Rose Repair',           ch: 'instagram', reach: '24.1k', eng: '2.8k', clicks: '512' },
        { rank: 3, topic_th: 'Reels: คุยกับน้องโรส — ส่วนผสมลับใน 30 วิ',     topic_en: 'Reels: Rose talks · 30-sec secret ingredient',         ch: 'tiktok',    reach: '21.6k', eng: '2.1k', clicks: '—', kind: 'avatar' },
        { rank: 4, topic_th: '11.11 Marine Collagen ลด 50%',                topic_en: '11.11 Marine Collagen 50% off',                        ch: 'facebook',  reach: '19.4k', eng: '1.8k', clicks: '724' },
        { rank: 5, topic_th: 'Toner Pad · เคล็ดลับใช้ก่อนทาครีม',             topic_en: 'Toner Pad · the secret before cream',                  ch: 'instagram', reach: '14.2k', eng: '1.2k', clicks: '218' },
      ].map((p) => `<div style="display:grid;grid-template-columns:40px 1fr 90px 90px 90px;align-items:center;gap:14px;padding:12px;border-radius:12px;background:var(--cream2);border:1px solid var(--line)">
        <div style="font-size:24px;font-weight:800;color:var(--muted);letter-spacing:-.02em">${p.rank}</div>
        <div style="display:flex;align-items:center;gap:10px;min-width:0">
          ${I(p.ch, 18, p.ch === 'facebook' ? '#1877F2' : p.ch === 'instagram' ? '#E1306C' : '#0F172A')}
          <div style="min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t({ th: p.topic_th, en: p.topic_en })} ${p.kind === 'avatar' ? '<span class="pill blue" style="margin-left:6px;height:18px;font-size:10px">Avatar</span>' : ''}</div>
          </div>
        </div>
        ${[['Reach', p.reach], ['Engagement', p.eng], ['Clicks', p.clicks]].map(([l, v]) => `<div style="text-align:center"><div style="font-size:14px;font-weight:800;color:var(--purple)">${v}</div><div style="font-size:10px;color:var(--muted)">${l}</div></div>`).join('')}
      </div>`).join(''))}
    </div>
  </div>`;
}
