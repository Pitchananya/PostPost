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
import { ARCHETYPES } from '../data/archetypes.js';
import { VOICES } from '../data/voices.js';

const KIND_MAP = {
  // Core 6 (เดิม)
  knowledge: { th: 'ให้ความรู้',     en: 'Knowledge',  pill: 'blue'     },
  promo:     { th: 'ขายตรง',         en: 'Promo',      pill: 'orange'   },
  review:    { th: 'รีวิว',           en: 'Review',     pill: 'green'    },
  story:     { th: 'เล่าเรื่อง',       en: 'Story',      pill: 'yellow'   },
  tip:       { th: 'Tip',             en: 'Tip',        pill: 'lavender' },
  engage:    { th: 'ถาม-ตอบ',        en: 'Engage',     pill: ''         },
  // 8 ใหม่ — ครอบ angle เนื้อหาที่หลากหลายขึ้น
  myth:      { th: 'ไขความเชื่อ',     en: 'Myth-bust',  pill: 'blue'     },  // debunk misconceptions
  case:      { th: 'เคสจริง',         en: 'Case study', pill: 'green'    },  // customer transformations
  howto:     { th: 'How-to',          en: 'How-to',     pill: 'lavender' },  // step-by-step tutorial
  list:      { th: 'ลิสต์/อันดับ',     en: 'Listicle',   pill: 'yellow'   },  // top 5/10 rankings
  trend:     { th: 'เทรนด์',          en: 'Trend',      pill: 'orange'   },  // what's hot now
  behind:    { th: 'เบื้องหลัง',       en: 'BTS',        pill: 'yellow'   },  // behind-the-scenes
  compare:   { th: 'เปรียบเทียบ',     en: 'Compare',    pill: 'blue'     },  // vs / before-after
  inspire:   { th: 'แรงบันดาลใจ',     en: 'Inspire',    pill: 'green'    },  // quotes / motivational
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

  <!-- Topics grid OR empty state with brand-profile preview -->
  ${TOPICS.length === 0 ? raw((() => {
    const ab = BRANDS.find(b => b.id === state.brand) || {};
    const archObj = ARCHETYPES.find(a => a.id === state.archetype);
    const voiceLabels = (state.voice || []).map(id => {
      const v = VOICES.find(x => x.id === id);
      return v ? (state.lang === 'th' ? v.th : v.en) : id;
    });
    // Field row helper — green check if filled, yellow ⚠ if missing
    const row = (label_th, label_en, value, isImportant) => {
      const filled = value && String(value).trim();
      const icon = filled ? '<span style="color:#10B981">✓</span>' : (isImportant ? '<span style="color:#F59E0B">⚠</span>' : '<span style="color:var(--muted)">○</span>');
      return `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);font-size:12.5px;line-height:1.5">
        <div style="width:18px;flex-shrink:0;text-align:center">${icon}</div>
        <div style="width:130px;color:var(--muted);flex-shrink:0">${T(label_th, label_en)}</div>
        <div style="flex:1;color:${filled ? 'var(--ink)' : '#F59E0B'};font-weight:${filled ? '600' : '500'}">${filled ? value : T('— ยังไม่ได้ตั้ง (แนะนำให้ใส่ใน /profile)', '— not set (recommended in /profile)')}</div>
      </div>`;
    };
    const hasAllImportant = ab.name && ab.bizType && (ab.desc || '').trim();
    return `
    <div style="background:linear-gradient(135deg,#FFF7ED,#FAE8FF);border-radius:18px;padding:28px;border:1px solid var(--line)">
      <div style="text-align:center;margin-bottom:20px">
        ${I('sparkles', 42, '#9C8BB8')}
        <div style="font-size:18px;font-weight:800;color:var(--ink);margin:10px 0 4px">${T('ยังไม่มีหัวข้อสำหรับ', 'No topics yet for')} <span style="color:var(--orange)">${ab.name || ''}</span></div>
        <div style="font-size:12.5px;color:var(--muted);max-width:520px;margin:0 auto;line-height:1.6">${T('AI จะวางแผน 30 หัวข้อโดยอิงจากโปรไฟล์แบรนด์ของคุณด้านล่าง — กรอกให้ครบเพื่อให้ผลลัพธ์แม่นและเข้ากับแบรนด์ที่สุด', 'AI will plan 30 topics from your brand profile below — fill them in for the most on-brand results')}</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px 18px;margin-bottom:18px">
        <div style="font-size:10.5px;font-weight:800;color:var(--purple);letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">${T('AI จะใช้ข้อมูลพวกนี้', "What AI will use")}</div>
        ${row('ชื่อแบรนด์', 'Brand name', ab.name, true)}
        ${row('ประเภทธุรกิจ', 'Business type', ab.bizType, true)}
        ${row('คำอธิบายแบรนด์', 'Brand description', (ab.desc || '').slice(0, 80) + ((ab.desc || '').length > 80 ? '…' : ''), true)}
        ${row('Brand Voice', 'Brand Voice', voiceLabels.join(', '), false)}
        ${row('Brand Archetype', 'Brand Archetype', archObj ? (state.lang === 'th' ? archObj.th : archObj.en) : '', false)}
        ${row('ธีมเดือนนี้', 'Theme', state.topicTheme || '', false)}
      </div>
      ${!hasAllImportant ? `<div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:10px 13px;margin-bottom:14px;font-size:11.5px;color:#92400E;line-height:1.5;display:flex;align-items:flex-start;gap:8px">
        ${I('info', 14, '#92400E')}
        <div><b>${T('ยังกรอกไม่ครบ', 'Profile incomplete')}</b> — ${T('AI สามารถสร้างได้ แต่หัวข้อจะกว้างและทั่วไปขึ้น แนะนำเปิด', 'AI can still generate but topics will be more generic — recommend opening')} <a href="#" data-go="profile" style="color:var(--purple);font-weight:800">/profile</a> ${T('กรอกเพิ่มก่อน', 'first')}</div>
      </div>` : ''}
      <div style="display:flex;justify-content:center">
        <button class="btn primary" data-gentopics="1" ${state.topicGenLoading ? 'disabled' : ''} style="padding:13px 32px;font-size:14px">
          ${I('sparkles', 16)} ${state.topicGenLoading ? T('AI กำลังสร้าง…', 'Generating…') : T('🪄 ให้ AI สร้างหัวข้อให้แบรนด์นี้', '🪄 Generate topics for this brand')}
        </button>
      </div>
    </div>`;
  })()) : raw(`
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
