// public/js/pages/topics.js
//
// Topic Bank — 30-topic content planner. Mirrors the inline pageTopics()
// exactly. KIND_MAP is page-local (same data as inline; defines pill color
// + bilingual label per topic kind). TOPICS comes from data/topics.js —
// the same mutable array reference inline pages also read.
//
// All HTML-emitting helpers (I, head) wrapped in raw() per the html``
// safety model. Topic text + brand name auto-escape via html`` since they
// can contain user-entered strings after Phase-4 AI generation.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { head } from '../components/head.js';
import { TOPICS } from '../data/topics.js';
import { BRANDS } from '../data/brands.js';

const KIND_MAP = {
  knowledge: { th: 'ให้ความรู้', en: 'Knowledge', pill: 'blue'     },
  promo:     { th: 'ขายตรง',     en: 'Promo',     pill: 'orange'   },
  review:    { th: 'รีวิว',       en: 'Review',    pill: 'green'    },
  story:     { th: 'เล่าเรื่อง',   en: 'Story',     pill: 'yellow'   },
  tip:       { th: 'Tip',         en: 'Tip',       pill: 'lavender' },
  engage:    { th: 'ถาม-ตอบ',    en: 'Engage',    pill: ''         },
};

export function pageTopics() {
  const filtered = state.topicFilter === 'all' ? TOPICS : TOPICS.filter((tp) => tp.kind === state.topicFilter);
  const counts = Object.fromEntries(Object.keys(KIND_MAP).map((k) => [k, TOPICS.filter((tp) => tp.kind === k).length]));

  const actions = `<button class="btn outline sm">${I('download', 14)} ${T('Export', 'Export')}</button>
     <button class="btn primary sm" data-gentopics="1" ${state.topicGenLoading ? 'disabled' : ''}>${I('sparkles', 14)} ${state.topicGenLoading ? T('AI กำลังสร้าง…', 'Generating…') : T('ปั่นหัวข้อใหม่ด้วย AI', 'Generate with AI')}</button>`;

  return html`${raw(head('WORKSPACE', 'Topic Bank',
    T('ให้ AI วางแผนหัวข้อทั้งเดือน 30 หัวข้อ · เลือกธีม + สินค้า แล้วกดสร้าง', 'Let AI plan 30 topics · pick a theme, then generate'),
    actions
  ))}

  <!-- Controls -->
  <div class="card" style="margin-bottom:18px">
    <div class="grid" style="grid-template-columns:1fr 2fr 110px;gap:12px;align-items:end">
      <div>
        <label class="label">${raw(T('แบรนด์', 'Brand'))}</label>
        <select class="select" id="ppTopicBrand">
          ${raw(BRANDS.map((b) => `<option value="${b.id}" ${b.id === state.brand ? 'selected' : ''}>${b.name}</option>`).join(''))}
        </select>
      </div>
      <div>
        <label class="label">${raw(T('ธีมเดือนนี้', 'Theme for this month'))}</label>
        <input class="input" id="ppTopicTheme" value="${state.topicTheme || ''}" placeholder="${T('เช่น โปรโมชั่น 11.11, เคล็ดลับสำหรับลูกค้า…', 'e.g. 11.11 promo, customer tips…')}"/>
      </div>
      <div>
        <label class="label">${raw(T('จำนวน', 'How many'))}</label>
        <input class="input" id="ppTopicCount" value="${state.topicCount || 30}" type="number" min="5" max="60"/>
      </div>
    </div>
    <div style="margin-top:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span class="micro" style="font-weight:700">${raw(T('จุดมุ่งหมาย:', 'Goals:'))}</span>
      ${raw([
        { key: 'sales',     th: 'เพิ่มยอดขาย',     en: 'Drive sales'      },
        { key: 'awareness', th: 'สร้าง Awareness', en: 'Brand awareness'  },
        { key: 'educate',   th: 'ให้ความรู้',       en: 'Educate'          },
        { key: 'community', th: 'สร้าง Community', en: 'Build community'  },
        { key: 'feedback',  th: 'รับ Feedback',    en: 'Get feedback'     },
      ].map((g) => {
        const on = (state.topicGoals || ['sales', 'awareness']).indexOf(g.key) >= 0;
        return `<span class="pill ${on ? 'orange' : ''}" data-topicgoal="${g.key}" style="cursor:pointer;height:28px">${on ? '✓ ' : ''}${T(g.th, g.en)}</span>`;
      }).join(''))}
    </div>
  </div>

  <!-- Filter pills -->
  <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
    <button class="pill ${state.topicFilter === 'all' ? 'dark' : ''}" data-set="topicFilter=all" style="cursor:pointer;height:34px;padding:0 14px">
      ${raw(T('ทั้งหมด', 'All'))} <span style="color:${state.topicFilter === 'all' ? '#FFD1A4' : 'var(--orange)'}">${TOPICS.length}</span>
    </button>
    ${raw(Object.entries(KIND_MAP).map(([k, v]) => `<button class="pill ${state.topicFilter === k ? 'dark' : (v.pill || '')}" data-set="topicFilter=${k}" style="cursor:pointer;height:34px;padding:0 14px">${T(v.th, v.en)} <span>${counts[k]}</span></button>`).join(''))}
    <div style="flex:1"></div>
    <span class="pill" style="height:34px">${raw(T('ใช้ไปแล้ว', 'Used'))} <b>${TOPICS.filter((tp) => tp.used).length}</b> / ${TOPICS.length}</span>
  </div>

  <!-- Topics grid OR empty state for brands without topics yet -->
  ${TOPICS.length === 0 ? raw(`
    <div style="padding:60px 24px;text-align:center;background:var(--cream2);border-radius:18px;border:1px dashed var(--line3)">
      ${I('sparkles', 48, '#9C8BB8')}
      <div style="font-size:17px;font-weight:800;color:var(--ink);margin:14px 0 6px">${T('ยังไม่มีหัวข้อสำหรับ ' + (BRANDS.find(b => b.id === state.brand)?.name || ''), 'No topics yet for ' + (BRANDS.find(b => b.id === state.brand)?.name || ''))}</div>
      <div style="font-size:13px;color:var(--muted);max-width:480px;margin:0 auto 22px;line-height:1.6">${T('แต่ละแบรนด์มีหัวข้อของตัวเอง — กดปุ่มด้านล่างให้ AI วางแผน 30 หัวข้อตามแบรนด์ จุดมุ่งหมาย และธีมที่ตั้งไว้ข้างบน', 'Each brand has its own topics — hit the button below to let AI plan 30 topics matched to this brand, its goals, and the theme above')}</div>
      <button class="btn primary" data-gentopics="1" ${state.topicGenLoading ? 'disabled' : ''} style="padding:12px 28px;font-size:14px">
        ${I('sparkles', 16)} ${state.topicGenLoading ? T('AI กำลังสร้าง…', 'Generating…') : T('🪄 ให้ AI สร้างหัวข้อให้แบรนด์นี้', '🪄 Generate topics for this brand')}
      </button>
    </div>
  `) : raw(`
    <div class="grid g3">
      ${filtered.map((tp) => {
        const k = KIND_MAP[tp.kind];
        return `<div class="topicCard ${tp.used ? 'used' : ''}">
          <div class="split">
            <span class="pill ${k.pill}">${T(k.th, k.en)}</span>
            <span style="font-family:var(--mono);font-size:10.5px;color:var(--muted)">${tp.f}</span>
          </div>
          <div class="topicText">${T(tp.th, tp.en)}</div>
          <div class="split" style="padding-top:10px;border-top:1px dashed var(--line)">
            <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted)">
              <span style="display:inline-flex;align-items:center;gap:3px">${I('type', 11)} ${t({ th: tp.len_th, en: tp.len_en })}</span>
              ${tp.used ? `<span class="pill green" style="height:18px;font-size:10px">✓ ${T('ใช้แล้ว', 'Used')}</span>` : ''}
            </div>
            <button class="btn ghost sm" style="color:var(--orange);height:26px;padding:0 8px;font-size:11.5px" data-usetopic="${TOPICS.indexOf(tp)}">${T('ใช้หัวข้อนี้', 'Use this')} ${I('chev_right', 11, '#FF7A1A')}</button>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div style="margin-top:24px;display:flex;justify-content:center">
      <button class="btn outline" data-gentopics="1">${I('sparkles', 14)} ${T('คิดเพิ่มอีก 30 หัวข้อ', 'Generate 30 more')}</button>
    </div>
  `)}`;
}
