// public/js/pages/creative.js
//
// Generate Creative — pick a product → topic → AI writes prompts +
// generates images (single or album). Mirrors the inline pageCreative()
// exactly.
//
// Same Phase-3c bridge as caption.js: the shared cards live inline in
// index.html and are reached via window.PP. Extracted in Phase 3e/3f.
//
// All HTML-emitting helpers (I, head, the bridged cards) wrapped in raw().
// state.genImagePrompts entries auto-escape via escText (user-controlled
// once Phase 4 surface the prompt-editor).

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { head } from '../components/head.js';

// Bridge accessors — see caption.js notes.
const PP = () => window.PP || {};
const productPickerHTML = () => PP().productPickerHTML ? PP().productPickerHTML() : '';
const generateInputHTML = () => PP().generateInputHTML ? PP().generateInputHTML() : '';
const postPreviewHTML = () => PP().postPreviewHTML ? PP().postPreviewHTML() : '';
const publishCardHTML = () => PP().publishCardHTML ? PP().publishCardHTML() : '';

export function pageCreative() {
  const genImages = state.genImages || [];

  const actions = `<button class="btn outline sm">${I('library', 14)} ${T('เทมเพลต', 'Templates')}</button>`;

  return html`${raw(head('CREATE', T('สร้าง Creative · รูป + อัลบั้ม', 'Generate creative · image + album'),
    T('สร้างรูปเดี่ยวหรืออัลบั้ม 6 ภาพพร้อมแคปชั่นต่อสไลด์', 'Single image or 6-slide album with per-slide caption'),
    actions
  ))}

  ${raw(productPickerHTML())}

  <div class="tabs lg" style="margin-bottom:18px">
    <button class="tab" data-go="caption">${raw(I('type', 14))} ${raw(T('Caption · Hook · Hashtag · บทความ', 'Caption · Hook · Hashtag · Article'))}</button>
    <button class="tab active">${raw(I('image', 14))} ${raw(T('Creative · รูป + อัลบั้ม', 'Creative · Image + album'))}</button>
  </div>

  ${raw(generateInputHTML())}

  <div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px">
    <div style="display:flex;flex-direction:column;gap:18px">
      <!-- Format -->
      <div class="card">
        <div class="cardHeader">
          <h3 class="cardTitle">${raw(T('รูปแบบ', 'Format'))}</h3>
          <span class="pill blue">${raw(T('AI คิดเลย์เอาท์ให้', 'AI auto-layout'))}</span>
        </div>
        <div class="grid g2" style="gap:10px">
          ${raw([
            { id: 'single', th: 'รูปเดี่ยว', en: 'Single', sub_th: '1 ภาพ · เน้น hero shot',  sub_en: '1 image · hero shot',         icon: 'image'  },
            { id: 'album',  th: 'อัลบั้ม',  en: 'Album',  sub_th: 'หลายสไลด์ · 1 รูปต่อสไลด์', sub_en: 'multi-slide · 1 image each',  icon: 'layers' },
          ].map((f) => `<button class="toneTile ${(state.creativeFormat || 'album') === f.id ? 'active' : ''}" data-set="creativeFormat=${f.id}" style="flex-direction:column;gap:6px;text-align:center;padding:14px">
            <div class="toneEmoji" style="width:38px;height:38px">${I(f.icon, 18)}</div>
            <b style="font-size:13px;color:var(--purple)">${T(f.th, f.en)}</b>
            <span class="micro">${t({ th: f.sub_th, en: f.sub_en })}</span>
          </button>`).join(''))}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line);flex-wrap:wrap">
          <span class="micro" style="font-weight:700">${raw(T('โมเดล AI สร้างรูป:', 'Image AI model:'))}</span>
          <select class="select" id="ppImageModel" style="height:32px;width:auto;padding:0 28px 0 10px;font-size:12px">
            <option value="gemini" ${(state.imageModel || 'gemini') === 'gemini' ? 'selected' : ''}>${T('Gemini · เร็ว', 'Gemini · fast')}</option>
            <option value="gpt" ${state.imageModel === 'gpt' ? 'selected' : ''}>${T('GPT · gpt-5.4 (ช้า/คมชัด)', 'GPT · gpt-5.4 (slow/sharp)')}</option>
          </select>
          <span class="micro" style="font-weight:700;margin-left:6px">${raw(T('จำนวนรูป:', 'Images:'))}</span>
          <select class="select" id="ppImageCount" style="height:32px;width:auto;padding:0 28px 0 10px;font-size:12px">
            ${raw([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${(state.imageCount || 4) === n ? 'selected' : ''}>${n} ${T('รูป', 'imgs')}</option>`).join(''))}
          </select>
        </div>
      </div>

      <!-- AI-generated images -->
      <div class="card">
        <div class="cardHeader">
          <div>
            <h3 class="cardTitle">${raw(T('รูปที่ AI สร้าง', 'AI-generated images'))} <span class="pill orange">${genImages.length}</span></h3>
            <p class="cardSub">${raw(T('AI คิด prompt + สร้างรูปอัตโนมัติเมื่อกด "สร้างทั้งหมด"', 'AI writes prompts + generates images on "Generate All"'))}</p>
          </div>
        </div>
        ${genImages.length
          ? raw(`<div class="grid g2" style="gap:14px">
            ${genImages.map((img, i) => `<div class="productCard" style="padding:12px">
              <div style="position:absolute;top:8px;left:8px;z-index:2;background:var(--purple);color:#fff;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-weight:800;font-size:12px">${i + 1}</div>
              <div class="productImg" style="aspect-ratio:1;background:#f3f0ea;overflow:hidden">
                ${img
                  ? `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover"/>`
                  : `<div style="display:grid;place-items:center;height:100%;color:var(--muted);font-size:11px;text-align:center;padding:8px">${T('สร้างรูปไม่สำเร็จ', 'Image failed')}</div>`}
              </div>
              <div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.45;max-height:50px;overflow:hidden">${escText((state.genImagePrompts || [])[i] || '')}</div>
            </div>`).join('')}
          </div>`)
          : html`<div style="padding:32px 20px;text-align:center;color:var(--muted)">
            <div style="font-size:28px;margin-bottom:8px">🖼️</div>
            <div style="font-size:13px;line-height:1.6">${state.genLoading ? T('AI กำลังคิด prompt และสร้างรูป…', 'AI is writing prompts and generating images…') : T('กด "สร้างทั้งหมด" ด้านบน — AI จะคิด prompt แต่ละสไลด์แล้วสร้างรูปอัตโนมัติ', 'Hit "Generate All" — AI writes a prompt per slide and generates images')}</div>
          </div>`}
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:18px">
      ${raw(postPreviewHTML())}
      ${raw(publishCardHTML())}
    </div>
  </div>`;
}
