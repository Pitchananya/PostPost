// public/js/pages/caption.js
//
// Generate Caption — pick a product → enter topic → AI writes Hook +
// Caption + Hashtags + Long-form article. Mirrors the inline pageCaption()
// exactly.
//
// Phase 3c — the shared cards (productPickerHTML, generateInputHTML,
// postPreviewHTML, publishCardHTML) are still INLINE in index.html and
// reached via window.PP. They get extracted into ../components/* in
// Phase 3e/3f at which point the bridge dependency disappears.
//
// All HTML-emitting helpers (I, head, the bridged cards) wrapped in raw().
// User-facing strings from state (genCaption, genArticle, hashtags) routed
// through escText.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { head } from '../components/head.js';

// Bridge accessors — these helpers still live inline in index.html and are
// exposed via window.PP. Look them up at call time so the bridge can be
// wired BEFORE or AFTER this module first imports (boot order tolerance).
const PP = () => window.PP || {};
const productPickerHTML = () => PP().productPickerHTML ? PP().productPickerHTML() : '';
const generateInputHTML = () => PP().generateInputHTML ? PP().generateInputHTML() : '';
const postPreviewHTML = () => PP().postPreviewHTML ? PP().postPreviewHTML() : '';
const publishCardHTML = () => PP().publishCardHTML ? PP().publishCardHTML() : '';

export function pageCaption() {
  const hooks = (state.genHooks && state.genHooks.length)
    ? state.genHooks.map((h, i) => ({ id: i + 1, text_th: h.text, text_en: h.text, sub_th: h.angle || '', sub_en: h.angle || '' }))
    : [];
  const genEmpty = (msg) => `<div style="padding:30px 20px;text-align:center;color:var(--muted)"><div style="font-size:26px;margin-bottom:6px">✨</div><div style="font-size:13px;line-height:1.6">${msg}</div></div>`;

  const actions = `<button class="btn outline sm">${I('library', 14)} ${T('เทมเพลต', 'Templates')}</button><button class="btn outline sm">${I('clock', 14)} ${T('ประวัติ', 'History')}</button>`;

  return html`${raw(head('CREATE', T('สร้างคอนเทนต์ด้วย AI', 'AI content generator'),
    T('เลือกสินค้า → ใส่หัวข้อ → AI คิด Hook / Caption / Hashtag / รูป / บทความ ครบในคลิกเดียว', 'Pick a product → topic → AI writes hook, caption, hashtags, image, and article in 1 click'),
    actions
  ))}

  ${raw(productPickerHTML())}

  <div class="tabs lg" style="margin-bottom:18px">
    <button class="tab active" data-go="caption">${raw(I('type', 14))} ${raw(T('Caption · Hook · Hashtag · บทความ', 'Caption · Hook · Hashtag · Article'))}</button>
    <button class="tab" data-go="creative">${raw(I('image', 14))} ${raw(T('รูปภาพ · เดี่ยว + อัลบั้ม', 'Images · single + album'))}</button>
  </div>

  ${raw(generateInputHTML())}

  <div class="grid" style="grid-template-columns:1.55fr 1fr;gap:18px">
    <div style="display:flex;flex-direction:column;gap:18px">
      <!-- Hooks -->
      <div class="card">
        <div class="cardHeader">
          <div>
            <h3 class="cardTitle">${raw(T('เลือก Hook ที่ใช่', 'Pick a hook'))}</h3>
            <p class="cardSub">${raw(T('AI สร้าง 3 แนว · เลือก 1 อันเพื่อใช้ในแคปชั่น', 'AI wrote 3 angles · pick one'))}</p>
          </div>
          <button class="btn ghost sm" data-genall="1">${raw(I('refresh', 13))} ${raw(T('สร้างใหม่', 'Regenerate'))}</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${hooks.length
            ? raw(hooks.map((h) => {
              const on = h.id === state.selectedHook;
              return `<button data-set="selectedHook=${h.id}" style="text-align:left;border-radius:14px;padding:14px 16px;border:${on ? '2px solid var(--orange)' : '1px solid var(--line)'};background:${on ? 'var(--orange-soft)' : '#fff'};display:flex;gap:14px;align-items:flex-start;cursor:pointer;width:100%">
                <div style="width:22px;height:22px;border-radius:99px;flex-shrink:0;margin-top:2px;border:${on ? '6px solid var(--orange)' : '2px solid var(--line3)'};background:${on ? '#fff' : 'transparent'};box-sizing:border-box"></div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;color:var(--purple);line-height:1.5;font-weight:${on ? 700 : 500}">${escText(T(h.text_th, h.text_en))}</div>
                  <div class="micro" style="margin-top:5px;font-weight:600">${escText(T(h.sub_th, h.sub_en))}</div>
                </div>
                <button class="btn ghost sm iconOnly">${I('copy', 13)}</button>
              </button>`;
            }).join(''))
            : raw(genEmpty(T('กด "สร้างทั้งหมด" ด้านบน เพื่อให้ AI สร้าง Hook 3 แนว', 'Hit "Generate All" above — AI writes 3 hook angles')))}
        </div>
      </div>

      <!-- Caption -->
      <div class="card">
        <div class="cardHeader">
          <div>
            <h3 class="cardTitle">${raw(T('แคปชั่น', 'Caption'))}</h3>
            <p class="cardSub">${state.genCaption ? (state.genCaption.length + T(' ตัวอักษร · พร้อมโพสต์', ' chars · ready to post')) : T('เหมาะกับ Facebook & Instagram Post', 'For Facebook & Instagram Post')}</p>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn ${state.editingCaption ? 'primary' : 'ghost'} sm iconOnly" data-editcap="1" title="${T(state.editingCaption ? 'เสร็จ' : 'แก้ไข', state.editingCaption ? 'Done' : 'Edit')}">${raw(I(state.editingCaption ? 'check' : 'edit', 13))}</button>
            <button class="btn ghost sm iconOnly" data-copycap="1" title="${T('คัดลอก', 'Copy')}">${raw(I('copy', 13))}</button>
            <button class="btn ghost sm iconOnly" data-genall="1" title="${T('สร้างใหม่', 'Regenerate')}">${raw(I('refresh', 13))}</button>
          </div>
        </div>
        ${raw(state.editingCaption
          ? `<textarea id="ppGenCaption" class="textarea" rows="6" style="background:var(--cream2);border:1.5px solid var(--orange);border-radius:12px;padding:16px;font-size:14px;line-height:1.65;color:var(--ink);width:100%;resize:vertical;white-space:pre-wrap;font-family:inherit" placeholder="${escText(T('พิมพ์แคปชั่นที่นี่…', 'Type caption here…'))}">${escText(state.genCaption || '')}</textarea>`
          : `<div style="background:var(--cream2);border-radius:12px;padding:16px;font-size:14px;line-height:1.65;color:var(--ink);border:1px solid var(--line)${state.genCaption ? ';white-space:pre-wrap' : ''}">${state.genCaption ? escText(state.genCaption) : genEmpty(T('ยังไม่มีแคปชั่น — กด "สร้างทั้งหมด" เพื่อให้ AI เขียนให้', 'No caption yet — hit "Generate All"'))}</div>`
        )}
      </div>

      <!-- Hashtags -->
      <div class="card">
        <div class="cardHeader">
          <h3 class="cardTitle">${raw(T('แฮชแท็ก', 'Hashtags'))}</h3>
          <div style="display:flex;gap:4px">
            <button class="btn ${state.editingHashtags ? 'primary' : 'ghost'} sm iconOnly" data-edithashtags="1" title="${T(state.editingHashtags ? 'เสร็จ' : 'แก้ไข', state.editingHashtags ? 'Done' : 'Edit')}">${raw(I(state.editingHashtags ? 'check' : 'edit', 13))}</button>
            <button class="btn ghost sm" data-genall="1">${raw(I('refresh', 13))} ${raw(T('สร้างใหม่', 'New set'))}</button>
          </div>
        </div>
        ${raw(state.editingHashtags
          ? `<textarea id="ppGenHashtagsEdit" class="textarea" rows="3" style="border:1.5px solid var(--orange);border-radius:12px;padding:12px;font-size:13px;line-height:1.6;width:100%;resize:vertical;font-family:inherit" placeholder="${escText(T('คั่นด้วยช่องว่าง — เช่น #ผิวสวย #สกินแคร์', 'Separate with spaces — e.g. #beauty #skincare'))}">${escText((state.genHashtags || []).join(' '))}</textarea>
            <div class="micro" style="margin-top:6px;color:var(--muted)">${T('คั่นด้วยช่องว่าง · #จะถูกเติมให้อัตโนมัติถ้าไม่ใส่', 'Space-separated · # is auto-prepended')}</div>`
          : `<div style="display:flex;flex-wrap:wrap;gap:6px">${(state.genHashtags && state.genHashtags.length)
              ? state.genHashtags.map((tag) => `<span style="padding:5px 10px;border-radius:99px;background:var(--blue-soft);color:#1D4ED8;font-size:12px;font-weight:600;cursor:pointer">${escText(tag)}</span>`).join('')
              : genEmpty(T('ยังไม่มีแฮชแท็ก — กด "สร้างทั้งหมด"', 'No hashtags yet — hit "Generate All"'))}</div>`
        )}
      </div>

      <!-- Article (long form) -->
      <div class="card">
        <div class="cardHeader">
          <div>
            <h3 class="cardTitle">${raw(T('บทความ (Long-form)', 'Article (Long-form)'))}</h3>
            <p class="cardSub">${raw(T('บทความยาว AI เขียนตาม Brand Voice', 'Long-form article in your Brand Voice'))}</p>
          </div>
          <div style="display:flex;gap:4px;align-items:center">
            <span class="pill blue">${raw(T('สำหรับ Facebook Note / Blog', 'For Facebook Note / Blog'))}</span>
            <button class="btn ${state.editingArticle ? 'primary' : 'ghost'} sm iconOnly" data-editarticle="1" title="${T(state.editingArticle ? 'เสร็จ' : 'แก้ไข', state.editingArticle ? 'Done' : 'Edit')}">${raw(I(state.editingArticle ? 'check' : 'edit', 13))}</button>
            <button class="btn ghost sm iconOnly" data-copyarticle="1" title="${T('คัดลอก', 'Copy')}">${raw(I('copy', 13))}</button>
            <button class="btn ghost sm iconOnly" data-genall="1" title="${T('สร้างใหม่', 'Regenerate')}">${raw(I('refresh', 13))}</button>
          </div>
        </div>
        ${raw(state.editingArticle
          ? `<textarea id="ppGenArticle" class="textarea" rows="14" style="background:#fff;border:1.5px solid var(--orange);border-radius:12px;padding:18px;font-size:13.5px;line-height:1.7;width:100%;min-height:280px;resize:vertical;white-space:pre-wrap;font-family:inherit" placeholder="${escText(T('พิมพ์บทความที่นี่…', 'Type article here…'))}">${escText(state.genArticle || '')}</textarea>`
          : `<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;max-height:280px;overflow-y:auto;font-size:13.5px;line-height:1.7${state.genArticle ? ';white-space:pre-wrap' : ''}">${state.genArticle ? escText(state.genArticle) : genEmpty(T('ยังไม่มีบทความ — กด "สร้างทั้งหมด" เพื่อให้ AI เขียนบทความยาว', 'No article yet — hit "Generate All"'))}</div>`
        )}
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:18px">
      ${raw(postPreviewHTML())}
      ${raw(publishCardHTML())}
    </div>
  </div>`;
}
