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

  // Single = exactly 1 image; Album = 2–10. Clamp the count to the format so
  // the dropdown + generation stay in sync when the user switches format.
  const fmt = state.creativeFormat || 'album';
  if (fmt === 'single') { if (state.imageCount !== 1) state.imageCount = 1; }
  else if ((state.imageCount || 0) < 2) { state.imageCount = Math.max(2, state.imageCount || 4); }
  const countOpts = fmt === 'single' ? [1] : [2, 3, 4, 5, 6, 7, 8, 9, 10];

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
          ${raw((() => {
            // All 12 OpenRouter image-output models as of May 2026 —
            // verified by spot-checking individual model pages (the
            // /api/v1/models query truncates results so it falsely
            // reports some as missing; the real catalog has them all).
            // Each model has its own backend route under
            // /api/ai/gen-image/<slug> (file-per-model under backend/
            // routes/image-models/) with a request body tuned for that
            // model's quirks.
            //
            // LEGACY rewrites only cover retired ids (gpt-image-1,
            // dall-e-3, flux-schnell, etc.) — current ids pass through.
            const LEGACY = {
              gemini: 'google/gemini-3.1-flash-image-preview',
              gpt: 'openai/gpt-5.4-image-2',
              'openai/gpt-image-1': 'openai/gpt-5.4-image-2',
              'openai/gpt-image-2': 'openai/gpt-5.4-image-2',
              'openai/dall-e-3': 'openai/gpt-5.4-image-2',
              'google/imagen-4': 'google/gemini-3-pro-image-preview',
              'bytedance/seedream-4': 'bytedance-seed/seedream-4.5',
              'black-forest-labs/flux-schnell': 'black-forest-labs/flux.2-klein-4b',
              'black-forest-labs/flux-1.1-pro': 'black-forest-labs/flux.2-pro',
              'black-forest-labs/flux-kontext-pro': 'black-forest-labs/flux.2-flex',
              'xai/grok-2-image': 'x-ai/grok-imagine-image-quality',
            };
            const cur = LEGACY[state.imageModel] || state.imageModel || 'google/gemini-3.1-flash-image-preview';
            const opts = [
              { group: T('🟦 Google (Nano Banana)', '🟦 Google (Nano Banana)'), items: [
                ['google/gemini-2.5-flash-image',         'Nano Banana — Gemini 2.5 Flash (GA, ถูกสุด)'],
                ['google/gemini-3.1-flash-image-preview', 'Nano Banana 2 — Gemini 3.1 Flash ⭐'],
                ['google/gemini-3-pro-image-preview',     'Nano Banana Pro — Gemini 3 Pro (2K/4K) 🏆'],
              ]},
              { group: T('🟩 OpenAI (GPT)', '🟩 OpenAI (GPT)'), items: [
                ['openai/gpt-5-image-mini',               'GPT-5 Image Mini (เบา/ถูก)'],
                ['openai/gpt-5-image',                    'GPT-5 Image'],
                ['openai/gpt-5.4-image-2',                'GPT-5.4 Image 2 (Thai text ดี)'],
              ]},
              { group: T('🟥 Black Forest Labs (FLUX.2)', '🟥 Black Forest Labs (FLUX.2)'), items: [
                ['black-forest-labs/flux.2-klein-4b',     'FLUX.2 Klein 4B (เร็วสุด)'],
                ['black-forest-labs/flux.2-flex',         'FLUX.2 Flex (typography)'],
                ['black-forest-labs/flux.2-pro',          'FLUX.2 Pro (photoreal)'],
                ['black-forest-labs/flux.2-max',          'FLUX.2 Max (top-tier)'],
              ]},
              { group: T('🟨 ByteDance / xAI', '🟨 ByteDance / xAI'), items: [
                ['bytedance-seed/seedream-4.5',           'Seedream 4.5 ($0.04/รูป)'],
                ['x-ai/grok-imagine-image-quality',       'Grok Imagine (editorial)'],
              ]},
            ];
            return '<select class="select" id="ppImageModel" style="height:32px;width:auto;padding:0 28px 0 10px;font-size:12px">'
              + opts.map(g => '<optgroup label="' + g.group + '">'
                + g.items.map(([id, label]) => '<option value="' + id + '"' + (cur === id ? ' selected' : '') + '>' + label + '</option>').join('')
                + '</optgroup>').join('')
              + '</select>';
          })())}
          <span class="micro" style="font-weight:700;margin-left:6px">${raw(T('จำนวนรูป:', 'Images:'))}</span>
          <select class="select" id="ppImageCount" ${fmt === 'single' ? 'disabled' : ''} title="${fmt === 'single' ? T('รูปเดี่ยว = 1 รูป', 'Single = 1 image') : ''}" style="height:32px;width:auto;padding:0 28px 0 10px;font-size:12px${fmt === 'single' ? ';opacity:.6;cursor:not-allowed' : ''}">
            ${raw(countOpts.map((n) => `<option value="${n}" ${state.imageCount === n ? 'selected' : ''}>${n} ${T('รูป', 'imgs')}</option>`).join(''))}
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
            ${genImages.map((img, i) => {
              const isRegen = state.genImageRegenIdx === i;
              return `<div class="productCard" style="padding:12px;position:relative">
              <div style="position:absolute;top:8px;left:8px;z-index:2;background:var(--purple);color:#fff;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-weight:800;font-size:12px">${i + 1}</div>
              <button class="btn ${img ? 'ghost' : 'primary'} sm iconOnly" data-regenimg="${i}" title="${T('สร้างใหม่', 'Regenerate')}" ${isRegen ? 'disabled' : ''} style="position:absolute;top:8px;right:8px;z-index:2;background:${img ? 'rgba(255,255,255,.92)' : 'var(--orange)'};color:${img ? 'var(--ink)' : '#fff'};box-shadow:0 2px 6px rgba(0,0,0,.12);width:28px;height:28px">${I(isRegen ? 'clock' : 'refresh', 13)}</button>
              <div class="productImg" style="aspect-ratio:1;background:#f3f0ea;overflow:hidden">
                ${img
                  ? `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover${isRegen ? ';opacity:.55' : ''}"/>`
                  : (isRegen
                    ? `<div style="display:grid;place-items:center;height:100%;color:var(--orange);font-size:11px;text-align:center;padding:8px;gap:6px"><div style="font-size:22px">⏳</div>${T('กำลังสร้างใหม่…', 'Regenerating…')}</div>`
                    : `<div style="display:grid;place-items:center;height:100%;color:var(--muted);font-size:11px;text-align:center;padding:8px;gap:6px"><div style="font-size:20px;color:#DC2626">⚠</div>${T('สร้างรูปไม่สำเร็จ — กด ↻ ลองใหม่', 'Image failed — tap ↻ to retry')}</div>`)}
              </div>
              <div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.45;max-height:50px;overflow:hidden">${escText((state.genImagePrompts || [])[i] || '')}</div>
            </div>`;
            }).join('')}
          </div>`)
          : raw(`<div style="padding:32px 20px;text-align:center;color:var(--muted)">
            <div style="font-size:28px;margin-bottom:8px">🖼️</div>
            <div style="font-size:13px;line-height:1.6">${state.genLoading ? T('AI กำลังคิด prompt และสร้างรูป…', 'AI is writing prompts and generating images…') : T('กด "สร้างทั้งหมด" ด้านบน — AI จะคิด prompt แต่ละสไลด์แล้วสร้างรูปอัตโนมัติ', 'Hit "Generate All" — AI writes a prompt per slide and generates images')}</div>
          </div>`)}
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:18px">
      ${raw(postPreviewHTML())}
      ${raw(publishCardHTML())}
    </div>
  </div>`;
}
