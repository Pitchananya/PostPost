// public/js/pages/textvideo.js
//
// Text to Video — prompt + reference + style + duration + model picker,
// plus the right-rail video preview with download / Save draft / generate
// controls. Mirrors the inline pageTextVideo() in index.html.
//
// Bridges (still inline in index.html, reached via window.PP):
//   - genVideoPrompt   → AI Veo prompt generator (Claude)
//   - genVeoVideo      → submit + poll the picked Veo / fal-t2v endpoint
//   - saveVideoDraft   → store the current ttvVideo as a draft (IDB + localStorage)
//   - pickRefProductModal → open the product picker modal
//   - videoPosterDataUrl, compressImageDataUrl — used downstream by saveVideoDraft;
//     not referenced from this page directly.
//
// Direct imports:
//   - VIDEO_MODELS, VIDEO_STYLES — data/video-models.js
//
// All HTML-emitting helpers (I, head) wrapped in raw(). User-facing strings
// inserted into body text use escText. Per Phase-3c lesson: every nested
// `${cond ? <html> : ''}` returns markup, so we wrap in raw() to bypass the
// outer html``'s auto-escape.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { head } from '../components/head.js';
import { VIDEO_MODELS, VIDEO_STYLES } from '../data/video-models.js';

export function pageTextVideo() {
  const styles = VIDEO_STYLES;
  const models = VIDEO_MODELS;
  const picked = models.filter((m) => m.id === state.ttvModel)[0] || models[0];
  const providerName = picked.name;
  const aspect = state.ttvAspect || '9:16';
  const aspectFrac = aspect.replace(':', '/');

  const headActions = `<button class="btn outline sm">${I('library', 14)} ${T('คลิปที่สร้างไว้', 'Past clips')}</button>`;

  // Step 1: prompt card — AI write button + textarea + quick-idea pills
  const promptCard = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 1 · คำสั่ง', 'Step 1 · Prompt')}</div>
    <div class="cardHeader">
      <h3 class="cardTitle">${T('บรรยายวิดีโอที่คุณต้องการ', 'Describe the video')}</h3>
      <button class="btn ghost sm" data-genvideoprompt="1" style="color:var(--blue)" ${state.ttvPromptLoading ? 'disabled' : ''}>${I('sparkles', 13, '#2563EB')} ${state.ttvPromptLoading ? T('AI กำลังเขียน…', 'Writing…') : T('ให้ AI ปั้น Prompt', 'AI write prompt')}</button>
    </div>
    <textarea class="textarea" rows="5" id="ppTtvPrompt" placeholder="${escText(T('บรรยายวิดีโอ — เช่น "กล้องเลื่อนช้า ๆ ผ่านสวนกุหลาบ แสงทอง สโลโมชั่น"', 'Describe the video — e.g. "slow camera through rose garden, golden light, slow motion"'))}" style="font-size:14px;line-height:1.65">${escText(state.ttvPrompt || '')}</textarea>
    <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">
      <span class="micro" style="width:100%;font-weight:700">${T('ไอเดียด่วน:', 'Quick ideas:')}</span>
      ${[
        { th: 'B-roll สินค้าหมุนรอบ 360°', en: 'Product 360° spin' },
        { th: 'Lifestyle ลูกค้าใช้สินค้าจริง', en: 'Lifestyle · real customer' },
        { th: 'Stop-motion เปิดกล่อง',       en: 'Stop-motion unboxing' },
        { th: 'Cinematic ใส่ส่วนผสม',         en: 'Cinematic ingredient pour' },
        { th: 'โฆษณาตลาดสด vintage',          en: 'Vintage market ad' },
      ].map((s) => `<button class="pill" style="font-size:11px;height:26px;cursor:pointer;background:var(--cream2);border:1px dashed var(--line3);color:var(--ink)">${I('sparkles', 10, '#2563EB')} ${t(s)}</button>`).join('')}
    </div>
  </div>`;

  // Step 2: reference image — preview + upload / pick-from-products buttons
  const refCard = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 2 · รูปอ้างอิง', 'Step 2 · Reference image')}</div>
    <h3 class="cardTitle" style="margin-bottom:10px">${T('รูปสินค้า (ไม่จำเป็น)', 'Product photo (optional)')}</h3>
    <div class="grid" style="grid-template-columns:140px 1fr;gap:14px">
      <div class="productImg" style="${state.ttvReference ? 'background:#f3f0ea' : 'background:linear-gradient(135deg,#FFEDD5,#FECDD3)'};overflow:hidden;display:grid;place-items:center;color:var(--muted);text-align:center;padding:8px">
        ${state.ttvReference
          ? `<img src="${escText(state.ttvReference)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"/>`
          : `<div style="position:relative;z-index:1">${I('image', 26, '#9C8BB8')}<div style="font-size:10px;font-weight:600;margin-top:6px">${T('ยังไม่ได้เลือกรูป', 'No reference yet')}</div></div>`}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn outline sm" data-pickrefproduct="1" style="width:fit-content">${I('package', 13)} ${T('เลือกจากสินค้า', 'Pick from products')}</button>
        <button class="btn outline sm" data-uploadref="1" style="width:fit-content">${I('upload', 13)} ${T('อัปโหลดรูปอื่น', 'Upload other')}</button>
        <input type="file" accept="image/*" id="ppTtvRefInput" style="display:none"/>
        ${state.ttvReference ? `<button class="btn ghost sm" data-clearref="1" style="width:fit-content;color:var(--red)">${I('x', 12, '#DC2626')} ${T('ลบรูป', 'Remove')}</button>` : ''}
        <div class="micro" style="margin-top:auto;line-height:1.5">${T('ใส่รูปอ้างอิงเพื่อช่วยให้ AI เขียน prompt ตรงสินค้า', 'Add a reference so AI writes a prompt matching the product')}</div>
        ${state.ttvReference && (state.ttvModel || '').indexOf('veo-2') === 0
          ? `<div class="micro" style="line-height:1.5;color:#92400E;background:#FEF3C7;padding:8px 10px;border-radius:8px;border:1px solid #FDE68A">${I('zap', 11, '#92400E')} ${T('Veo 2 จะ "ใกล้เคียง" รูปอ้างอิง — ถ้าอยากให้ตรงเป๊ะ ๆ ใช้ Veo 3 Fast/Pro (ต้องเปิด billing)', 'Veo 2 approximates the reference — for exact match use Veo 3 Fast/Pro (needs billing)')}</div>`
          : ''}
      </div>
    </div>
  </div>`;

  // Step 3: style picker + duration + aspect
  const styleCard = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 3 · สไตล์ & ความยาว', 'Step 3 · Style & duration')}</div>
    <label class="label">${T('สไตล์ภาพ', 'Visual style')}</label>
    <div class="grid g4" style="gap:8px;margin-bottom:16px">
      ${styles.map((s, i) => {
        const on = i === state.ttvStyle;
        return `<button class="brandTile ${on ? 'active' : ''}" data-set="ttvStyle=${i}" style="padding:0;overflow:hidden">
          <div style="aspect-ratio:4/3;background:${s.bg};position:relative">${on ? `<div style="position:absolute;top:6px;right:6px;width:18px;height:18px;border-radius:99px;background:var(--orange);color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900">✓</div>` : ''}</div>
          <div style="padding:8px;text-align:left">
            <b style="font-size:12px;color:var(--purple);display:block">${T(s.th, s.en)}</b>
            <div style="font-size:10px;color:var(--muted)">${t({ th: s.sub_th, en: s.sub_en })}</div>
          </div>
        </button>`;
      }).join('')}
    </div>
    <div class="grid g2" style="gap:14px">
      <div>
        <label class="label">${T('ความยาว', 'Duration')}</label>
        <div style="display:flex;gap:4px">
          ${['8s', '10s', '15s'].map((d) => `<button class="pill ${(state.ttvDuration || '8s') === d ? 'orange' : ''}" data-set="ttvDuration=${d}" style="flex:1;justify-content:center;height:32px;font-size:11.5px;cursor:pointer">${d}${d === '8s' ? ' · ' + T('Veo', 'Veo') : ''}</button>`).join('')}
        </div>
      </div>
      <div>
        <label class="label">${T('สัดส่วน', 'Aspect')}</label>
        <div style="display:flex;gap:4px">
          ${[{ r: '9:16', sub: 'Reels/TikTok' }, { r: '16:9', sub: 'YouTube' }].map((a) => {
            const on = a.r === state.ttvAspect;
            return `<button class="pill ${on ? 'orange' : ''}" data-set="ttvAspect=${a.r}" style="flex:1;flex-direction:column;height:auto;padding:4px;font-size:11px;cursor:pointer">${a.r}<span style="font-size:9px;opacity:.8">${a.sub}</span></button>`;
          }).join('')}
        </div>
      </div>
    </div>
  </div>`;

  // Step 4: model picker tiles
  const modelCard = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 4 · โมเดล', 'Step 4 · Model')}</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${models.map((m) => {
        const on = m.id === state.ttvModel;
        const badgeColor = m.badge === 'FREE' ? { bg: '#DCFCE7', fg: '#166534' }
          : m.badge === 'BEST DEAL' ? { bg: '#FFE4E6', fg: '#9F1239' }
          : { bg: '#FEF3C7', fg: '#92400E' };
        return `<button class="toneTile ${on ? 'active' : ''}" data-set="ttvModel=${m.id}" style="padding:12px 14px;align-items:center">
          <div class="toneEmoji" style="background:${on ? '#fff' : 'var(--cream2)'};color:${on ? 'var(--orange)' : 'var(--muted)'}">${I('video', 14)}</div>
          <div class="tInfo">
            <div class="tName" style="display:flex;align-items:center;gap:6px">
              ${m.name}
              ${m.badge ? `<span style="background:${badgeColor.bg};color:${badgeColor.fg};font-size:9px;font-weight:800;padding:2px 6px;border-radius:99px;letter-spacing:.04em">${m.badge}</span>` : ''}
            </div>
            <div style="font-size:11px;color:var(--muted)">${t({ th: m.sub_th, en: m.sub_en })}</div>
          </div>
          <div style="font-size:11px;color:var(--muted);text-align:right">${T('เรนเดอร์', 'Render')} ${t({ th: m.time_th, en: m.time_en })}</div>
          ${on ? `<span style="color:var(--orange);font-size:14px;margin-left:4px">${I('check', 14, '#FF7A1A')}</span>` : ''}
        </button>`;
      }).join('')}
    </div>
  </div>`;

  // Right rail: preview box + actions + variants
  const previewBlock = state.ttvVideo
    ? `<div style="aspect-ratio:${aspectFrac};border-radius:14px;overflow:hidden;background:#000;border:1px solid var(--line)"><video controls autoplay loop muted playsinline src="${escText(state.ttvVideo)}" style="width:100%;height:100%;object-fit:contain;display:block"></video></div>`
    : state.ttvGenLoading
      ? `<div style="aspect-ratio:${aspectFrac};border-radius:14px;background:linear-gradient(135deg,#1F2937,#4F46E5);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px;border:1px solid var(--line)">
          <div style="width:48px;height:48px;border-radius:99px;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:spin 1s linear infinite"></div>
          <div style="margin-top:14px;font-size:14px;font-weight:700">${T(providerName + ' กำลังสร้างวิดีโอ…', providerName + ' is generating…')}</div>
          <div style="margin-top:4px;font-size:12px;opacity:.85">${T(providerName + ' ใช้เวลาประมาณ ' + (picked.time_th || '1-2 นาที'), providerName + ' takes ~' + (picked.time_en || '1-2 min'))}</div>
          ${state.ttvGenStatus ? `<div style="margin-top:8px;font-size:11px;opacity:.7">${escText(state.ttvGenStatus)}</div>` : ''}
          <div style="margin-top:14px;display:flex;gap:6px;align-items:center;font-size:11px;color:rgba(255,255,255,.7)">
            ${I('clock', 11, 'rgba(255,255,255,.7)')} ${T('ห้ามปิดหน้านี้ระหว่างรอ', 'Keep this tab open')}
          </div>
          <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </div>`
      : `<div style="aspect-ratio:${aspectFrac};border-radius:14px;background:linear-gradient(135deg,#FFEDD5,#FED7AA 40%,#FB923C);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#7C2D12;text-align:center;padding:24px;border:1px solid var(--line)">
          ${I('video', 36, '#9A3412')}
          <div style="margin-top:10px;font-size:14px;font-weight:700">${T('วิดีโอจะแสดงที่นี่', 'Your video appears here')}</div>
          <div style="margin-top:4px;font-size:12px;opacity:.85">${T('ใส่คำสั่ง แล้วกด "สร้างวิดีโอ"', 'Type a prompt and hit "Generate"')}</div>
          <button class="btn ghost sm" data-pastevideourl="1" style="margin-top:14px;color:#9A3412;background:rgba(255,255,255,.6)">${I('link', 12, '#9A3412')} ${T('หรือ paste URL วิดีโอเอง', 'Or paste a video URL')}</button>
        </div>`;

  const downloadBtn = state.ttvVideo
    ? `<a class="btn outline" style="flex:1;min-width:90px;text-decoration:none;justify-content:center" href="${escText(state.ttvVideo)}" download="postpost-video.mp4">${I('download', 14)} MP4</a>`
    : `<button class="btn outline" style="flex:1;min-width:90px" disabled>${I('download', 14)} MP4</button>`;

  const saveBtn = state.ttvVideo
    ? `<button class="btn outline" data-savevideodraft="1" style="flex:1;min-width:140px" ${state.ttvSavingDraft ? 'disabled' : ''}>${I('library', 14)} ${state.ttvSavingDraft ? T('กำลังบันทึก…', 'Saving…') : T('บันทึกดราฟ', 'Save draft')}</button>`
    : '';

  const previewCard = `
  <div class="card">
    <div class="cardHeader">
      <h3 class="cardTitle">${T('ตัวอย่างวิดีโอ', 'Video preview')}</h3>
      <span class="pill blue">${I('sparkles', 11)} ${picked.name} · ${aspect} · ${state.ttvDuration}</span>
    </div>
    ${previewBlock}
    <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
      ${downloadBtn}
      ${saveBtn}
      <button class="btn primary" data-veogen="1" style="flex:2;min-width:170px" ${state.ttvGenLoading ? 'disabled' : ''}>${I('sparkles', 14)} ${state.ttvGenLoading ? T('AI กำลังสร้าง…', 'Generating…') : (state.ttvVideo ? T('สร้างใหม่', 'Regenerate') : T('สร้างวิดีโอ', 'Generate video'))}</button>
    </div>
  </div>`;

  const variantsCard = `
  <div class="card tight">
    <div class="cardHeader">
      <h3 class="cardTitle" style="font-size:14px">${T('เวอร์ชั่นอื่น ๆ', 'Other variants')}</h3>
      <button class="btn ghost sm" style="height:26px;padding:0 8px;color:var(--muted)">${I('plus', 12)} ${T('สร้างเพิ่ม', 'Create more')}</button>
    </div>
    <div class="grid g3" style="gap:8px">
      ${[
        { bg: 'linear-gradient(135deg,#FFEDD5,#FB923C)', label: 'v1' },
        { bg: 'linear-gradient(135deg,#FECACA,#DC2626)', label: 'v2' },
        { bg: 'linear-gradient(135deg,#FBCFE8,#DB2777)', label: 'v3' },
      ].map((v) => `<div style="aspect-ratio:1;border-radius:10px;position:relative;background:${v.bg};border:1px solid var(--line);cursor:pointer">
        <div style="position:absolute;bottom:6px;left:6px;font-size:9px;font-weight:800;color:#fff;padding:2px 6px;border-radius:99px;background:rgba(0,0,0,.4)">${v.label}</div>
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:99px;background:rgba(255,255,255,.85);display:grid;place-items:center;color:var(--purple)">${I('play', 11)}</div>
      </div>`).join('')}
    </div>
  </div>`;

  return html`${raw(head(
    'CREATE',
    T('สร้างวิดีโอจากข้อความ', 'Text to Video'),
    T('พิมพ์คำสั่ง · เลือกสไตล์ · ให้ AI สร้างวิดีโอ MP4 พร้อมโพสต์', 'Type a prompt · pick a style · AI renders an MP4 ready to post'),
    headActions
  ))}

  <div class="grid" style="grid-template-columns:1fr 1.05fr;gap:20px;align-items:flex-start">
    <div style="display:flex;flex-direction:column;gap:18px">
      ${raw(promptCard)}
      ${raw(refCard)}
      ${raw(styleCard)}
      ${raw(modelCard)}
    </div>

    <div style="position:sticky;top:0;display:flex;flex-direction:column;gap:18px">
      ${raw(previewCard)}
      ${raw(variantsCard)}
    </div>
  </div>`;
}
