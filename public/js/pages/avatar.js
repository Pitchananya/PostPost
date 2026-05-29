// public/js/pages/avatar.js
//
// Talking Avatar — biggest single page in the app. Two-column layout:
//   Left: Step 1 (Mode) → Step 2 (Presenter) → Step 3 (Voice) →
//         Step 4 (Length & pacing) → Step 5 (Script).
//   Right: Clip preview (phone frame OR rendering overlay OR generated
//          video) + Storyboard (per-slot bg picker) + action row
//          (Create MP4 / Save draft / Post).
//
// Mirrors the inline pageAvatar() in index.html, including ALL recent
// bug fixes (audio routing, blob URL download, OmniHuman v1.5 default,
// chroma-key compositor, storyboard per-slot picker, phone-preview live
// bg rotation, save-draft → "วิดีโอ" Library category).
//
// Bridges (still inline in index.html, reached via window.PP):
//   - genAvatarScript, genTts, genAvatarVideo  — the three big effectful
//     workhorses. Hooked through the inline event-delegation router via
//     data-avatarscript / data-tts / data-avatarvideo. Phase 3e will
//     move them into this module with their own event delegation.
//   - saveAvatarDraft, removeAvatarBg, createAvatarWithAI — same story,
//     wired through data-saveavatardraft / data-rmbgavatar / data-newavatar.
//
// Direct imports:
//   - AVATARS — built-in 8-preset gallery (data/avatars.js)
//   - BRANDS, PRODUCTS — used for the phone-preview gradient + product CTA
//
// Helpers via window.PP (Phase 3d bridge):
//   - fetchAvatarBg — lazy-fetch on first render when scene is auto/preset
//
// Phase-3c nested-html`` trap: every conditional yielding markup is built
// with plain backticks and wrapped in raw() before reaching the outer
// html`` template. The big composition uses raw(cardN) for each card body.
//
// Critical data-* attributes preserved EXACTLY (the inline router routes
// by these — any rename breaks click handling):
//   - data-set, data-newavatar, data-avatarscript, data-tts,
//     data-avatarvideo, data-avatarabort, data-saveavatardraft,
//     data-rmbgavatar, data-uploadavatar, data-delavatar,
//     data-bgscene, data-bgsearch, data-bgpick, data-bgsearchclear,
//     data-bginterval, data-clipdur,
//     data-genstoryboard, data-slottoggle, data-slotsearch,
//     data-slotsearchin, data-slotpickurl
//   - id="ppAvatarScript", id="ppTtsAudio", id="ppAvatarBgSearch",
//     id="ppUploadAvatarInput", id="ppAvatarBgUploadInput", id="ppAvatarVoice"
//   - data-progress-pct (canvas render loop patches these directly via DOM)
//   - data-rotate-bg (setupAvatarBgRotation finds this <video>)

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { head } from '../components/head.js';
import { AVATARS } from '../data/avatars.js';
import { BRANDS } from '../data/brands.js';
import { PRODUCTS } from '../data/topics.js';

// Bridge accessor for the lazy bg fetch — module copy lives in
// components/avatar-bg.js (re-published on window.PP by main.js).
function fetchAvatarBg() {
  if (window.PP && typeof window.PP.fetchAvatarBg === 'function') {
    return window.PP.fetchAvatarBg();
  }
}

export function pageAvatar() {
  // Lazy-fetch a looping Pexels stock video for the phone preview on first
  // visit. Subsequent fetches are driven by user picks on the BG scene row.
  // Phase 3e: state is canonical (shared with inline) — plain assignment
  // propagates everywhere, no mirror needed.
  if (!state.avatarPreviewBgUrl && !state.avatarPreviewBgLoaded && typeof window !== 'undefined' && window.PP) {
    state.avatarPreviewBgLoaded = true;
    if ((state.avatarBgScene || 'auto') !== 'off' && (state.avatarBgScene || 'auto') !== 'upload') {
      fetchAvatarBg();
    }
  }

  const headActions = `<button class="btn outline sm">${I('library', 14)} ${T('คลิปที่สร้างไว้', 'Past clips')} <span style="padding:0 6px;height:18px;border-radius:99px;background:var(--orange-soft);color:#9A3412;font-size:10px;font-weight:800;display:inline-grid;place-items:center">14</span></button>
     <button class="btn outline sm">${I('info', 14)} ${T('คู่มือ', 'Guide')}</button>`;

  // ── Step 1: Mode tiles + sub-pickers ────────────────────────────────
  // 3 หมวดชัดๆ: ทันใจ (audio-reactive) / ฟรี+ปากขยับ (HF Spaces) / พรีเมียม (fal.ai)
  const modeTiles = [
    { id: 'free',  th: 'ทันใจ ฟรี',     en: 'Instant',     sub_th: 'หน้าไม่ขยับ · แค่หายใจ + ขยับตามเสียง',           sub_en: 'Face stays still · breathing + audio reaction',          time_th: '~30 วินาที', time_en: '~30 sec',  icon: 'mic',      tagTh: 'ฟรี',     tagEn: 'FREE',  tagBg: '#10B981' },
    { id: 'hfree', th: 'ฟรี + ปากขยับ', en: 'Free real',   sub_th: 'หน้า+ปากขยับจริง · ใช้ HF Spaces (one-click)',   sub_en: 'Real face + mouth · via HF Spaces (one-click)',          time_th: '1-5 นาที',  time_en: '1-5 min',  icon: 'sparkles', tagTh: 'ฟรี',     tagEn: 'FREE',  tagBg: '#065F46' },
    { id: 'real',  th: 'พรีเมียม',       en: 'Premium',     sub_th: 'คุณภาพสูงสุด · หน้า+ตัว+มือขยับ · ผ่าน fal.ai',  sub_en: 'Top quality · full face+body+hands · via fal.ai',         time_th: '1-3 นาที',  time_en: '1-3 min',  icon: 'sparkles', tagTh: 'เสียเงิน', tagEn: 'PAID',  tagBg: '#9F1239' },
  ];
  const lipsyncModels = [
    { id: 'fal-ai/sadtalker',                       name: 'SadTalker',        price: '$0.10', desc_th: 'ปากอย่างเดียว · ถูกสุด',         desc_en: 'Mouth only · cheapest' },
    { id: 'fal-ai/infinitalk',                      name: 'Infinitalk',       price: '$0.20', desc_th: 'หน้า+ปาก ขยับเบาๆ (ไม่มีท่าทางตัว)', desc_en: 'Face+mouth only (no body gestures)' },
    { id: 'veed/fabric-1.0',                        name: 'VEED Fabric 1.0',  price: '$0.30', desc_th: 'หน้า ลื่นสมูท',                desc_en: 'Face · smooth' },
    { id: 'fal-ai/bytedance/omnihuman',             name: 'OmniHuman',        price: '$0.50', desc_th: 'หน้า + ตัว + มือ ขยับจริง',     desc_en: 'Face + body + hand gestures' },
    { id: 'fal-ai/bytedance/omnihuman/v1.5',        name: 'OmniHuman v1.5',   price: '$0.50', desc_th: 'แนะนำ · หน้า+ตัว+มือ เหมือนคนพูดจริง', desc_en: 'Recommended · full body realistic talking', badge: 'BEST' },
  ];

  // ── HF Spaces (one-click free) catalog ──
  const oneClickHfModels = [
    { kind: 'joyhallo',  emoji: '🌏', name: 'JoyHallo',     stars: 5, speed: '🐢',     badge: { txt: 'BEST FOR THAI', bg: '#DC2626' }, descTh: 'Hallo + Chinese fine-tuning · ดีที่สุดสำหรับเสียงไทย · diffusion-based',  descEn: 'Hallo + Chinese fine-tuning · BEST for Thai voice · diffusion-based' },
    { kind: 'musetalk',  emoji: '⚡', name: 'MuseTalk',     stars: 4, speed: '⚡⚡⚡', badge: { txt: 'FASTEST',       bg: '#10B981' }, descTh: 'Tencent · real-time · Chinese-trained · เร็วสุด (~1-3 นาที)',           descEn: 'Tencent · real-time · Chinese-trained · fastest (~1-3 min)' },
    { kind: 'latent',    emoji: '⭐', name: 'LatentSync 1.5', stars: 4, speed: '⚡',    badge: { txt: 'BALANCED',      bg: '#7C3AED' }, descTh: 'ByteDance · คุณภาพดี · queue สั้น · Chinese training',                  descEn: 'ByteDance · solid quality · short queue · Chinese training' },
    { kind: 'hallo3',    emoji: '✨', name: 'Hallo3',       stars: 5, speed: '🐢🐢', badge: { txt: 'TOP QUALITY',   bg: '#9F1239' }, descTh: 'Diffusion · expression รายละเอียดสูงสุด · ช้า 15-30 นาที',              descEn: 'Diffusion · richest expression · slow 15-30 min' },
    { kind: 'wav2lip',   emoji: '🤗', name: 'Wav2Lip',      stars: 2, speed: '⚡⚡⚡', badge: { txt: 'QUICK',         bg: '#0EA5E9' }, descTh: 'เร็วมาก · ปากอย่างเดียว (ไม่ทั้งหน้า)',                                 descEn: 'Very fast · mouth-only (no face)' },
  ];

  // โหมด 'free' (audio-reactive): แค่ note สั้นๆ บอกข้อจำกัด — ไม่ต้องซ่อนตัวเลือกฟรีจริงไว้ที่นี่อีก
  const modeAudioReactiveHint = state.avatarMode === 'free' ? `
    <div style="margin-top:12px;padding:11px 13px;border-radius:10px;background:#FEF3C7;border:1px solid #FDE68A;display:flex;align-items:flex-start;gap:9px;font-size:11.5px;line-height:1.55;color:#92400E">
      ${I('info', 14, '#92400E')}
      <div>
        <b>${T('โหมดนี้หน้าจะไม่ขยับจริง', 'Face stays static in this mode')}</b> — ${T('แค่หายใจ + ขยับเล็กตามเสียง · ไม่มีค่าใช้จ่าย', 'just breathing + audio reaction · zero cost')}<br>
        ${T('อยากให้ปากขยับจริงแบบฟรี? → กดแท็บ', 'Want real mouth animation for free? → tap')} <b>${T('ฟรี + ปากขยับ', 'Free real')}</b> ${T('ด้านบน', 'above')}
      </div>
    </div>` : '';

  // โหมด 'hfree' (HF Spaces ฟรีจริง): โผล่ขึ้นมาเลย ไม่ต้องคลิกเปิด details
  const modeHfreeSubpicker = state.avatarMode === 'hfree' ? `
    <div style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)" data-hflipsync-grid="1">
      <div class="micro" style="font-weight:700;color:var(--purple);margin-bottom:6px;display:flex;align-items:center;gap:6px">
        ${I('sparkles', 12, '#065F46')} ${T('โมเดลฟรี · One-click', 'Free models · One-click')}
        <span style="margin-left:auto;background:#065F46;color:#fff;font-size:9px;padding:1px 7px;border-radius:99px;font-weight:800">${oneClickHfModels.length}</span>
      </div>
      <div class="micro" style="color:var(--muted);margin-bottom:10px;line-height:1.5">
        ${T('กดปุ่ม ⚡ "ใช้เลย" → PostPost upload รูป+เสียงให้ + เปิด HF Space → กด Generate → copy URL ผลลัพธ์ → paste ที่ "วาง URL" ด้านล่าง', 'Tap ⚡ "Go" → PostPost uploads + opens HF Space → Generate → copy result URL → paste below')}
      </div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${oneClickHfModels.map((m, i) => `<div style="background:#fff;border-radius:10px;padding:10px 12px;border:${i === 0 ? '2px solid #DC2626' : '1px solid var(--line)'};display:flex;align-items:center;gap:10px;${state.hfLipsyncLoading ? 'opacity:.6;' : ''}">
          <div style="font-size:22px;line-height:1;flex-shrink:0">${m.emoji}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
              <b style="color:var(--purple);font-size:12.5px">${m.name}</b>
              <span style="background:${m.badge.bg};color:#fff;font-size:8.5px;padding:1px 6px;border-radius:99px;font-weight:800;letter-spacing:.03em">${m.badge.txt}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--muted);margin-bottom:3px">
              <span style="color:#F59E0B;letter-spacing:1px">${'★'.repeat(m.stars) + '☆'.repeat(5 - m.stars)}</span>
              <span>${m.speed}</span>
            </div>
            <div class="micro" style="line-height:1.4">${t({ th: m.descTh, en: m.descEn })}</div>
          </div>
          <button class="btn primary" data-hflipsync="${m.kind}" style="background:${i === 0 ? 'linear-gradient(135deg,#DC2626,#7C2D12)' : 'linear-gradient(135deg,#065F46,#047857)'};color:#fff;border:0;flex-shrink:0;height:36px;padding:0 13px;font-size:11.5px;font-weight:800;white-space:nowrap;border-radius:8px;cursor:pointer" ${state.hfLipsyncLoading ? 'disabled' : ''}>${state.hfLipsyncLoading ? '⏳' : '⚡ ' + T('ใช้เลย', 'Go')}</button>
        </div>`).join('')}
      </div>
      ${!state.ttsAudio ? `<div style="margin-top:10px;font-size:10.5px;color:#92400E;background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:7px 10px;line-height:1.45">${T('💡 ยังไม่มีเสียง TTS? — ปุ่ม "ใช้เลย" จะสร้างให้อัตโนมัติก่อน (ต้องมีสคริปต์ที่ Step 5)','💡 No TTS yet? — Go button will auto-generate it first (needs a script at Step 5)')}</div>` : ''}
    </div>` : '';

  // Paste-URL block — ใช้ได้ทั้ง 'hfree' (รับ URL จาก HF) และ 'real' (รับ URL จาก fal.ai playground)
  const pasteUrlBlock = (state.avatarMode === 'hfree' || state.avatarMode === 'real') ? `
    <div style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)">
      <div class="micro" style="font-weight:700;color:var(--purple);margin-bottom:6px;display:flex;align-items:center;gap:6px">
        ${I('upload', 12, '#5B21B6')} ${T('วาง URL วิดีโอ lip-sync ที่ทำเสร็จแล้ว', 'Paste a finished lip-sync video URL')}
      </div>
      <div class="micro" style="color:var(--muted);margin-bottom:10px;line-height:1.5">
        ${state.avatarMode === 'hfree'
          ? T('จาก HF Space ที่กด Generate เสร็จ → copy video URL → วางที่นี่', 'From the HF Space after Generate → copy video URL → paste here')
          : T('รัน Infinitalk/OmniHuman บน fal.ai เอง → copy URL → วางที่นี่ → ระบบจะข้ามขั้นเรียก fal.ai แล้วประกอบกับ Pexels bg ให้เลย', 'Run on fal.ai directly → copy URL → paste here → PostPost skips the backend call and composites with the Pexels bg')}
      </div>
      <div style="display:flex;gap:6px">
        <input class="input" id="ppLipsyncPasteUrl" placeholder="https://v3b.fal.media/files/..." value="${state.avatarLipsyncRawVideo || ''}" style="flex:1;font-size:11.5px;height:34px;font-family:var(--mono)"/>
        <button class="btn outline" data-pastelipsyncurl="1" style="height:34px;font-size:11.5px;padding:0 14px">${I('check', 12)} ${T('ใช้คลิปนี้', 'Use this')}</button>
      </div>
      ${state.avatarLipsyncRawVideo ? `<div style="margin-top:8px;padding:8px 10px;background:#D1FAE5;border:1px solid #6EE7B7;border-radius:8px;font-size:11px;color:#065F46;display:flex;align-items:center;gap:6px">
        ${I('check', 12, '#065F46')} <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${T('พร้อมแล้ว: ', 'Ready: ')}${state.avatarLipsyncRawVideo.split('/').pop().slice(0, 40)}…</span>
        <button data-clearlipsyncurl="1" style="background:none;border:0;color:#065F46;cursor:pointer;padding:0;display:flex;align-items:center">${I('x', 12, '#065F46')}</button>
      </div>` : ''}
    </div>` : '';

  const modeInfinitalkWarning = (state.avatarMode === 'real' && (state.avatarLipsyncModel || '').indexOf('infinitalk') >= 0) ? `
    <div style="margin-top:12px;padding:11px 13px;border-radius:10px;background:#FEE2E2;border:1px solid #FCA5A5;display:flex;align-items:flex-start;gap:9px;font-size:11.5px;line-height:1.55;color:#991B1B">
      ${I('info', 14, '#991B1B')}
      <div><b>${T('Infinitalk = ขยับแค่ปาก/หน้าเบาๆ', 'Infinitalk = mouth + slight face only')}</b><br>
      ${T('อยากให้ขยับตัว+ทำท่าเหมือนคนพูดจริง → เลือก', 'Want body + hand gestures like a real speaker? Pick')} <b>OmniHuman v1.5</b> ${T('ด้านล่าง', 'below')}</div>
    </div>` : '';

  const modeRealSubpicker = state.avatarMode === 'real' ? `
    <div style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)">
      <div class="micro" style="font-weight:700;color:var(--purple);margin-bottom:8px;display:flex;align-items:center;gap:6px">
        ${I('sparkles', 12, '#9F1239')} ${T('โมเดล lip-sync · fal.ai', 'Lip-sync model · fal.ai')}
        <span style="margin-left:auto;background:#9F1239;color:#fff;font-size:9px;padding:1px 7px;border-radius:99px;font-weight:800">${lipsyncModels.length}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${lipsyncModels.map((m) => {
          const on = (state.avatarLipsyncModel || 'fal-ai/bytedance/omnihuman/v1.5') === m.id;
          const badgeColor = m.badge === 'BEST' ? { bg: '#FFE4E6', fg: '#9F1239' } : m.badge === 'TOP' ? { bg: '#EDE9FE', fg: '#5B21B6' } : null;
          return `<button class="toneTile ${on ? 'active' : ''}" data-set="avatarLipsyncModel=${m.id}" style="padding:10px 12px;align-items:center;gap:10px">
            <div class="toneEmoji" style="background:${on ? '#fff' : 'var(--cream2)'};color:${on ? 'var(--orange)' : 'var(--muted)'};width:28px;height:28px">${I('sparkles', 12)}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--purple)">
                ${m.name}
                ${badgeColor ? `<span style="background:${badgeColor.bg};color:${badgeColor.fg};font-size:9px;font-weight:800;padding:1px 5px;border-radius:99px">${m.badge}</span>` : ''}
              </div>
              <div class="micro" style="line-height:1.4">${t({ th: m.desc_th, en: m.desc_en })}</div>
            </div>
            <div style="font-size:11.5px;font-weight:800;color:${on ? 'var(--orange)' : 'var(--muted)'}">${m.price}</div>
            ${on ? `<span style="color:var(--orange)">${I('check', 13)}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
      <div class="micro" style="margin-top:8px;font-size:10.5px;color:var(--muted);line-height:1.4">${T('ราคาต่อคลิป 30 วินาที — fal.ai bill ตามจริง', 'Per 30s clip — fal.ai bills usage')}</div>
    </div>` : '';

  const card1Mode = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 1 · โหมด', 'Step 1 · Mode')}</div>
    <h3 class="cardTitle" style="margin-bottom:14px">${T('เลือกระดับคุณภาพ', 'Pick quality level')}</h3>
    <div class="grid g3" style="gap:10px">
      ${modeTiles.map((m) => {
        const on = m.id === state.avatarMode;
        return `<button class="toneTile ${on ? 'active' : ''}" data-set="avatarMode=${m.id}" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px;position:relative">
          <span style="position:absolute;top:8px;right:8px;background:${m.tagBg};color:#fff;font-size:8.5px;font-weight:800;letter-spacing:.04em;padding:2px 7px;border-radius:99px">${T(m.tagTh, m.tagEn)}</span>
          <div style="display:flex;align-items:center;gap:10px;width:100%;padding-right:42px">
            <div class="toneEmoji" style="background:${on ? '#fff' : 'var(--cream2)'};color:${on ? 'var(--orange)' : 'var(--muted)'}">${I(m.icon, 16)}</div>
            <b style="font-size:13px;color:var(--purple);line-height:1.2">${T(m.th, m.en)}</b>
            ${on ? `<span style="margin-left:auto;color:var(--orange)">${I('check', 14)}</span>` : ''}
          </div>
          <div class="micro" style="line-height:1.45">${t({ th: m.sub_th, en: m.sub_en })}</div>
          <div class="micro" style="font-weight:700">${T('เรนเดอร์', 'Render')} ${t({ th: m.time_th, en: m.time_en })}</div>
        </button>`;
      }).join('')}
    </div>
    ${modeAudioReactiveHint}
    ${modeInfinitalkWarning}
    ${modeHfreeSubpicker}
    ${modeRealSubpicker}
    ${pasteUrlBlock}
  </div>`;

  // ── Step 2: Presenter gallery (built-ins + custom) + upload tile ────
  const allAvatars = AVATARS.concat(state.customAvatars || []);
  const presenterTiles = allAvatars.map((a) => {
    const on = a.id === state.avatar;
    const bg = a.bg || 'linear-gradient(180deg,#E0E7FF,#818CF8)';
    const uploadLabel = (a.sub_th === 'อัปโหลดเอง' || a.sub_en === 'Uploaded') ? T('UPLOAD', 'UPLOAD') : T('AI', 'AI');
    return `<button class="brandTile ${on ? 'active' : ''}" data-set="avatar=${a.id}" style="padding:8px;gap:4px">
      <div style="aspect-ratio:3/4;border-radius:10px;background:${bg};position:relative;overflow:hidden;display:flex;align-items:flex-end;justify-content:center">
        ${a.image
          ? `<img src="${a.image}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"/>`
          : `<div style="width:42px;height:42px;border-radius:99px;background:rgba(255,255,255,.85);margin-bottom:8px;display:grid;place-items:center;color:var(--purple);font-weight:800;font-size:20px;position:relative;z-index:1">${T(a.initial_th || '?', a.initial_en || '?')}</div>`}
        ${on ? `<span style="position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:99px;background:var(--orange);color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900;z-index:2">✓</span>` : ''}
        ${a.isCustom ? `<span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,.55);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:5px;z-index:2">${uploadLabel}</span>` : ''}
        ${a.isCustom ? `<span data-delavatar="${a.id}" title="${T('ลบ', 'Delete')}" style="position:absolute;bottom:6px;right:6px;width:22px;height:22px;border-radius:99px;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;cursor:pointer;z-index:3;font-size:14px;line-height:1">×</span>` : ''}
        ${a.isCustom && a.image && !a.bgRemoved ? `<span data-rmbgavatar="${a.id}" title="${T('ลบพื้นหลังออก', 'Remove background')}" style="position:absolute;bottom:6px;left:6px;background:rgba(91,33,182,.85);color:#fff;font-size:9px;font-weight:800;padding:3px 7px;border-radius:6px;cursor:pointer;z-index:3;display:flex;align-items:center;gap:3px">${I('wand', 10, '#fff')} ${state.avatarRmBgLoadingId === a.id ? T('…', ' …') : T('ลบ bg', 'RM-BG')}</span>` : ''}
        ${a.isCustom && a.image && a.bgRemoved ? `<span data-rmbgavatar="${a.id}" title="${T('ซ่อมพื้นหลัง (re-run RM-BG เก็บเป็น PNG รักษา alpha)', 'Repair background (re-run RM-BG, save as PNG with alpha)')}" style="position:absolute;bottom:6px;left:6px;background:rgba(220,38,38,.92);color:#fff;font-size:9px;font-weight:800;padding:3px 7px;border-radius:6px;cursor:pointer;z-index:3;display:flex;align-items:center;gap:3px">${I('wand', 10, '#fff')} ${state.avatarRmBgLoadingId === a.id ? T('…', ' …') : T('🔧 ซ่อม bg', '🔧 FIX-BG')}</span>` : ''}
      </div>
      <b style="font-size:12px;color:var(--purple);margin-top:6px">${t({ th: a.name_th, en: a.name_en })}</b>
      <div style="font-size:10px;color:var(--muted)">${t({ th: a.sub_th, en: a.sub_en })}</div>
    </button>`;
  }).join('');

  const card2Presenter = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 2 · เลือกผู้บรรยาย', 'Step 2 · Pick presenter')}</div>
    <div class="cardHeader">
      <h3 class="cardTitle">Presenter</h3>
      <button class="btn ghost sm" data-newavatar="1" style="color:var(--blue)" ${state.avatarGenLoading ? 'disabled' : ''}>${I('sparkles', 13, '#2563EB')} ${state.avatarGenLoading ? T('AI กำลังสร้าง…', 'Generating…') : T('สร้างคนใหม่ด้วย AI', 'Create new with AI')}</button>
    </div>
    <div class="grid g4" style="gap:10px">
      ${presenterTiles}
      <button class="brandTile add" data-uploadavatar="1" style="aspect-ratio:auto;min-height:0;align-self:stretch;flex-direction:column">
        ${I('upload', 20)}
        <span style="font-size:11px;font-weight:700;margin-top:6px;text-align:center">${T('อัปโหลด<br>รูปคน', 'Upload<br>photo')}</span>
      </button>
      <input type="file" accept="image/*" id="ppUploadAvatarInput" style="display:none"/>
    </div>
  </div>`;

  // ── Step 3: Voice (Azure TTS dropdown + speed/pitch pills) ─────────
  // Mirror the inline IIFE — also writes state.avatarVoices for genAvatarScript/genTts.
  const voices = [
    { id: 'premwadee', name: 'Premwadee', g: 'หญิง', tone: 'อบอุ่น',         desc: 'สกินแคร์ · ความงาม',    az: 'th-TH-PremwadeeNeural' },
    { id: 'achara',    name: 'Achara',    g: 'หญิง', tone: 'เป็นมิตร',         desc: 'lifestyle · แม่และเด็ก', az: 'th-TH-AcharaNeural' },
    { id: 'niwat',     name: 'Niwat',     g: 'ชาย',  tone: 'มืออาชีพ',         desc: 'ธุรกิจ · การเงิน',       az: 'th-TH-NiwatNeural' },
    { id: 'guru',      name: 'อาจารย์เทพ', g: 'ชาย',  tone: 'ขรึม น่าเชื่อถือ',  desc: 'สายมู · ดูดวง',          az: 'th-TH-NiwatNeural' },
    { id: 'casual',    name: 'พี่ตี้',     g: 'ชาย',  tone: 'เป็นกันเอง',       desc: 'casual · บันเทิง',       az: 'th-TH-NiwatNeural' },
  ];
  state.avatarVoices = voices;   // inline genTts/genAvatarScript/genAvatarVideo read this off the shared state
  const selVoice = state.avatarVoice || 'premwadee';
  const selVoiceObj = voices.filter((v) => v.id === selVoice)[0] || voices[0];
  const voiceSelect = `<select class="select" id="ppAvatarVoice" style="width:100%;font-size:13px;padding:10px 36px 10px 12px">`
    + voices.map((v) => `<option value="${v.id}"${v.id === selVoice ? ' selected' : ''}>${v.name} — ${v.g} · ${v.tone} (${v.desc})</option>`).join('')
    + `</select>`
    + `<div style="margin-top:6px;font-size:11px;color:var(--muted)">Azure TTS · ${selVoiceObj.az}</div>`;

  const speedPitch = [
    { l_th: 'ความเร็ว', l_en: 'Speed', opts: [{ th: 'ช้า', en: 'Slow' }, { th: 'ปกติ', en: 'Normal' }, { th: 'เร็ว', en: 'Fast' }] },
    { l_th: 'ระดับเสียง', l_en: 'Pitch', opts: [{ th: 'ต่ำ', en: 'Low' }, { th: 'ปกติ', en: 'Normal' }, { th: 'สูง', en: 'High' }] },
  ];
  const card3Voice = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 3 · เสียง', 'Step 3 · Voice')}</div>
    <h3 class="cardTitle" style="margin-bottom:12px">${T('เสียงพากย์ (TTS ภาษาไทย)', 'Voice (Thai TTS)')}</h3>
    ${voiceSelect}
    <div class="grid g2" style="margin-top:12px;gap:12px">
      ${speedPitch.map((g) => `<div>
        <label class="label">${t({ th: g.l_th, en: g.l_en })}</label>
        <div style="display:flex;gap:4px">
          ${g.opts.map((s, i) => `<button class="pill ${i === 1 ? 'orange' : ''}" style="flex:1;justify-content:center;height:32px;font-size:11.5px;cursor:pointer">${t(s)}</button>`).join('')}
        </div>
      </div>`).join('')}
    </div>
  </div>`;

  // ── Step 4: Length & pacing ────────────────────────────────────────
  const totalDurs = [
    { v: 15,  th: '15 วิ',  en: '15 sec' },
    { v: 30,  th: '30 วิ',  en: '30 sec' },
    { v: 45,  th: '45 วิ',  en: '45 sec' },
    { v: 60,  th: '1 นาที', en: '1 min' },
    { v: 90,  th: '1:30',   en: '1:30' },
    { v: 120, th: '2 นาที', en: '2 min' },
    { v: 180, th: '3 นาที', en: '3 min' },
    { v: 300, th: '5 นาที', en: '5 min' },
    { v: 0,   th: 'ตามเสียง', en: 'Match audio' },
  ];
  const switchIvls = [
    { v: 0,  th: 'ไม่เปลี่ยน', en: 'No switch' },
    { v: 3,  th: '3 วิ',      en: '3 sec' },
    { v: 5,  th: '5 วิ',      en: '5 sec' },
    { v: 8,  th: '8 วิ',      en: '8 sec' },
    { v: 12, th: '12 วิ',     en: '12 sec' },
    { v: 20, th: '20 วิ',     en: '20 sec' },
  ];
  const dur4 = state.avatarClipDuration || 0;
  const ivl4 = state.avatarBgInterval || 0;
  // A value the user typed in the "custom seconds" box = one that isn't any preset.
  const isCustomDur = dur4 > 0 && !totalDurs.some((o) => o.v === dur4);
  const isCustomIvl = ivl4 > 0 && !switchIvls.some((o) => o.v === ivl4);
  const slots4 = (dur4 > 0 && ivl4 > 0) ? Math.ceil(dur4 / ivl4) : (dur4 > 0 ? 1 : 0);
  let slotsLine = '';
  if (!dur4) {
    slotsLine = `<div style="margin-top:14px;padding:10px 12px;border-radius:10px;background:#FEF3C7;border:1px solid #FDE68A;font-size:11.5px;color:#9A3412;line-height:1.5">${I('info', 12, '#9A3412')} ${T('ใช้ความยาวเสียง TTS เป็นตัวกำหนด — ตั้งเวลาเองเพื่อให้ AI ช่วยจัดสรร bg ได้แม่นยำขึ้น', 'Will use TTS audio length — pick a fixed time to let AI plan bg slots precisely')}</div>`;
  } else {
    const minStr = dur4 >= 60
      ? Math.floor(dur4 / 60) + ' ' + T('นาที', 'min') + (dur4 % 60 ? ' ' + (dur4 % 60) + ' ' + T('วิ', 'sec') : '')
      : dur4 + ' ' + T('วิ', 'sec');
    slotsLine = `<div style="margin-top:14px;padding:12px 14px;border-radius:10px;background:linear-gradient(135deg,#EDE9FE,#FAE8FF);border:1px solid #DDD6FE;font-size:13px;color:var(--purple);line-height:1.5;display:flex;align-items:center;gap:8px">${I('sparkles', 14, '#5B21B6')}<span><b style="font-size:14.5px">${minStr}</b> ${ivl4 > 0 ? T('· สลับ bg ทุก ', '· bg switches every ') + ivl4 + T(' วินาที', ' sec') + ' = <b style="font-size:14.5px;color:var(--orange)">' + slots4 + '</b> ' + T('ฉาก', 'scenes') : T('· ใช้ bg เดียวตลอด', '· one bg throughout')}</span></div>`;
  }
  const card4Length = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 4 · ความยาว & จังหวะ', 'Step 4 · Length & Pacing')}</div>
    <h3 class="cardTitle" style="margin-bottom:14px">${T('ตั้งเวลาก่อน — แล้ว AI จะเขียนสคริปต์ + เลือก bg ให้พอดี', 'Set the time first — AI will write the script + pick bgs to fit')}</h3>
    <div style="margin-bottom:14px">
      <div style="font-size:10.5px;font-weight:800;color:var(--purple);letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:5px">
        ${I('play', 11, '#5B21B6')} ${T('ความยาวคลิป', 'Total clip length')}
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
        ${totalDurs.map((o) => {
          const on = (state.avatarClipDuration || 0) === o.v;
          return `<button class="pill ${on ? 'orange' : ''}" data-clipdur="${o.v}" style="height:30px;font-size:11.5px;padding:0 12px">${t({ th: o.th, en: o.en })}</button>`;
        }).join('')}
        <span style="display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 10px;border-radius:99px;border:1px solid ${isCustomDur ? 'var(--orange)' : 'var(--line)'};background:${isCustomDur ? 'var(--orange-soft)' : '#fff'}">
          <input type="number" min="1" max="600" inputmode="numeric" id="ppClipDurCustom" value="${isCustomDur ? dur4 : ''}" placeholder="${T('กี่วิ', 'sec')}" style="width:48px;border:0;background:transparent;font-size:11.5px;font-weight:700;color:var(--purple);text-align:center;outline:none"/>
          <span style="font-size:10.5px;color:var(--muted)">${T('วิ', 'sec')}</span>
        </span>
      </div>
    </div>
    <div>
      <div style="font-size:10.5px;font-weight:800;color:var(--purple);letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:5px">
        ${I('refresh', 11, '#5B21B6')} ${T('สลับฉากบ่อยแค่ไหน', 'Switch scene every')}
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
        ${switchIvls.map((o) => {
          const on = (state.avatarBgInterval || 0) === o.v;
          return `<button class="pill ${on ? 'orange' : ''}" data-bginterval="${o.v}" style="height:30px;font-size:11.5px;padding:0 12px">${t({ th: o.th, en: o.en })}</button>`;
        }).join('')}
        <span style="display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 10px;border-radius:99px;border:1px solid ${isCustomIvl ? 'var(--orange)' : 'var(--line)'};background:${isCustomIvl ? 'var(--orange-soft)' : '#fff'}">
          <input type="number" min="1" max="600" inputmode="numeric" id="ppBgIntervalCustom" value="${isCustomIvl ? ivl4 : ''}" placeholder="${T('กี่วิ', 'sec')}" style="width:48px;border:0;background:transparent;font-size:11.5px;font-weight:700;color:var(--purple);text-align:center;outline:none"/>
          <span style="font-size:10.5px;color:var(--muted)">${T('วิ', 'sec')}</span>
        </span>
      </div>
    </div>
    ${slotsLine}
  </div>`;

  // ── Step 5: Script ──────────────────────────────────────────────────
  const scriptLen = (state.avatarScript || '').length;
  const scriptSec = Math.max(1, Math.round(scriptLen / 15));
  const placeholderScript = escText(T(`สคริปต์ที่จะให้ผู้บรรยายพูด — กด 'ให้ AI เขียนให้' หรือพิมพ์เอง`, `Script for the presenter — hit AI write, or type it yourself`));

  // TTS audio display — locked notice during rendering OR playable audio
  let ttsBlock = '';
  if (state.ttsAudio) {
    if (state.avatarVideoLoading) {
      // Preview <audio> would fight the render's internal audioEl — show a locked notice instead.
      ttsBlock = `<div style="height:36px;flex:1;min-width:200px;border-radius:12px;background:#FFF7ED;border:1px solid #FED7AA;display:flex;align-items:center;gap:8px;padding:0 12px;font-size:11.5px;color:#9A3412;font-weight:700">
        ${I('mic', 13, '#9A3412')} ${T('กำลังบันทึกเสียงลงคลิป — preview ปิดชั่วคราว', 'Recording audio into the video — preview paused')}
      </div>
      <a class="btn ghost sm" href="${state.ttsAudio}" download="postpost-tts.mp3" style="flex:0 0 auto;color:var(--blue)">${I('download', 12)} MP3</a>`;
    } else {
      ttsBlock = `<audio id="ppTtsAudio" controls ${state.ttsAutoplayPending ? 'autoplay' : ''} style="height:36px;flex:1;min-width:200px"><source src="${state.ttsAudio}" type="audio/mp3"/></audio>
      <a class="btn ghost sm" href="${state.ttsAudio}" download="postpost-tts.mp3" style="flex:0 0 auto;color:var(--blue)">${I('download', 12)} MP3</a>`;
    }
  }

  const card5Script = `
  <div class="card">
    <div class="eyebrow" style="margin-bottom:8px">${T('ขั้นที่ 5 · สคริปต์', 'Step 5 · Script')}</div>
    <div class="cardHeader">
      <h3 class="cardTitle">${T('สคริปต์พูด (Thai)', 'Speaking script')}</h3>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
        ${state.ttsAudio ? `<button class="btn ghost sm" data-transcribe="1" style="color:var(--purple)" ${state.transcribeLoading ? 'disabled' : ''}>${state.transcribeLoading ? I('refresh', 13, '#7C3AED') : I('mic', 13, '#7C3AED')} ${state.transcribeLoading ? T('กำลังถอดเสียง…', 'Transcribing…') : T('ถอดจากเสียง', 'From audio')}</button>` : ''}
        <button class="btn ghost sm" data-avatarscript="1" style="color:var(--blue)" ${state.avatarScriptLoading ? 'disabled' : ''}>${I('sparkles', 13, '#2563EB')} ${state.avatarScriptLoading ? T('AI กำลังเขียน…', 'AI is writing…') : T('ให้ AI เขียนให้', 'AI write for me')}</button>
      </div>
    </div>
    <textarea class="textarea" rows="5" id="ppAvatarScript" placeholder="${placeholderScript}" style="font-size:14px;line-height:1.65">${escText(state.avatarScript || '')}</textarea>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--muted)">
      <span>${scriptLen} ${T('ตัวอักษร · ประมาณ ', 'chars · ~')}<b style="color:var(--purple)">${scriptSec}${T(' วินาที', ' sec')}</b></span>
      <span>${T('เหมาะกับ Reels (≤ 60 วินาที)', 'Fits Reels (≤ 60 sec)')}</span>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;align-items:center;flex-wrap:wrap">
      <button class="btn primary sm" data-tts="1" ${state.ttsLoading ? 'disabled' : ''} style="flex:0 0 auto">
        ${state.ttsLoading ? I('refresh', 13) : I('play', 13)} ${state.ttsLoading ? T('กำลังสังเคราะห์เสียง…', 'Synthesizing…') : T('ฟังเสียง (Azure TTS)', 'Listen (Azure TTS)')}
      </button>
      <button class="btn ghost sm" data-uploadttsaudio="1" style="flex:0 0 auto;color:var(--blue)">
        ${I('upload', 13)} ${T('อัปโหลดเสียงเอง', 'Upload your own audio')}
      </button>
      <input type="file" accept="audio/*" id="ppTtsAudioUploadInput" style="display:none"/>
      ${ttsBlock}
    </div>
  </div>`;

  // ── Right rail: phone preview (3 modes) ────────────────────────────
  const activeBrand = BRANDS.filter((b) => b.id === state.brand)[0] || BRANDS[0];
  const pickedAvatar = allAvatars.filter((a) => a.id === state.avatar)[0];
  const biz = (activeBrand && activeBrand.bizType || '').toLowerCase();
  const grad = /ดูดวง|สายมู|tarot/.test(biz) ? 'linear-gradient(180deg,#1a0033 0%,#4A0E2C 50%,#7C2D12 100%)'
    : /สกินแคร์|ความงาม|beauty/.test(biz) ? 'linear-gradient(180deg,#FDF2F8 0%,#FBCFE8 50%,#DB2777 100%)'
    : /อาหาร|food|กาแฟ|coffee/.test(biz) ? 'linear-gradient(180deg,#FFF7ED 0%,#FED7AA 50%,#9A3412 100%)'
    : /ฟิตเนส|fit|sport/.test(biz) ? 'linear-gradient(180deg,#0F172A 0%,#1E40AF 50%,#06B6D4 100%)'
    : 'linear-gradient(180deg,#FFEDD5 0%,#FED7AA 50%,#FB923C 100%)';
  const pickedProduct = PRODUCTS.filter((p) => (state.selectedProducts || []).indexOf(p.id) >= 0)[0];
  const prodName = pickedProduct ? (pickedProduct.name_th || pickedProduct.name_en || '').slice(0, 30) : (activeBrand ? activeBrand.name : '');
  const prodPrice = pickedProduct ? (pickedProduct.price ? '฿' + pickedProduct.price : '') : '';

  // Auto-pick the latest saved video draft for preview when no fresh render yet.
  let displayVideo = state.avatarVideo;
  if (!displayVideo && !state.avatarVideoLoading) {
    const videoDrafts = (state.drafts || [])
      .filter((d) => d.kind === 'video' && (d.videoUrl || d.video_url))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (videoDrafts.length) {
      displayVideo = videoDrafts[0].videoUrl || videoDrafts[0].video_url;
    }
  }

  // Background layer: Pexels stock video / user upload / nothing.
  // Marks the <video> with data-rotate-bg when interval > 0 + multiple candidates.
  function bgLayer() {
    const scene = state.avatarBgScene || 'auto';
    if (scene === 'off') return '';
    const src = (scene === 'upload') ? (state.avatarBgUploadUrl || '') : (state.avatarPreviewBgUrl || '');
    if (!src) return '';
    const rotate = (state.avatarBgInterval || 0) > 0 && (state.avatarBgCandidates || []).length > 1 && scene !== 'upload';
    const isImg = /^data:image\//i.test(src) || /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(src);
    const layer = isImg
      ? `<img src="${src}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transition:opacity .35s ease"/>`
      : `<video src="${src}" autoplay loop muted playsinline ${rotate ? 'data-rotate-bg="1" ' : ''}style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transition:opacity .35s ease"></video>`;
    return layer
      + `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.1) 25%,rgba(0,0,0,.1) 60%,rgba(0,0,0,.75) 100%);z-index:1"></div>`;
  }

  let phonePreview = '';
  if (displayVideo) {
    phonePreview = `<div class="phone" style="background:#000;overflow:hidden">`
      + `<video src="${displayVideo}" controls autoplay loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:1" onerror="console.warn('[avatar] video preview load failed:', this.src, this.error)"></video>`
      + (state.avatarVideo ? '' : `<div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,.65);color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:99px;z-index:2;backdrop-filter:blur(8px)">${T('คลิปล่าสุด', 'Latest clip')}</div>`)
      + `</div>`;
  } else if (state.avatarVideoLoading) {
    phonePreview = `<div class="phone" style="background:${grad}">`
      + bgLayer()
      + `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px;z-index:3">`
      +   `<div style="width:54px;height:54px;border-radius:99px;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:spin 1s linear infinite"></div>`
      +   `<div style="margin-top:18px;font-size:14px;font-weight:700">${T('กำลังสร้างวิดีโอ…', 'Rendering…')}</div>`
      +   `<div style="margin-top:6px;font-size:24px;font-weight:900"><span data-progress-pct>${state.avatarVideoProgress || 0}</span>%</div>`
      +   `<div style="margin-top:8px;font-size:11px;opacity:.8">${T('ใช้เวลา ~1-3 นาที', '~1-3 minutes')}</div>`
      +   `<button data-avatarabort="1" style="margin-top:18px;height:34px;padding:0 18px;border-radius:99px;border:1px solid rgba(255,255,255,.4);background:rgba(0,0,0,.45);color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;backdrop-filter:blur(6px)">`
      +     I('x', 12, '#fff') + ' ' + T('หยุดการสร้างคลิป', 'Stop rendering')
      +   `</button>`
      + `</div>`
      + `<style>@keyframes spin{to{transform:rotate(360deg)}}</style>`
      + `</div>`;
  } else {
    // ── Empty preview — themed placeholder ─────────────────────────────
    const avHTML = (pickedAvatar && pickedAvatar.image)
      ? `<img src="${pickedAvatar.image}" alt="" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-30%);width:55%;height:auto;border-radius:99px;object-fit:cover;aspect-ratio:1;border:4px solid rgba(255,255,255,.85);box-shadow:0 12px 32px rgba(0,0,0,.3);z-index:2"/>`
      : `<div class="phoneFace" style="z-index:2"><div class="eye eyeL"></div><div class="eye eyeR"></div><div class="lips"></div></div>`;
    phonePreview = `<div class="phone" style="background:${grad}">`
      + bgLayer()
      + `<div class="phoneHead" style="z-index:3"><span>19:00</span><span>● ● ●</span></div>`
      + (prodName ? `<div class="phoneTitle" style="z-index:3"><span style="color:${/ดูดวง|สายมู/.test(biz) ? '#FCD34D' : 'var(--orange)'}">${escText(prodName)}</span>${prodPrice ? ' · ' + prodPrice : ''}<br><span style="font-size:11px;font-weight:700;color:rgba(255,255,255,.75)">${escText((activeBrand && activeBrand.name) || '')}</span></div>` : '')
      + avHTML
      + `<div class="phoneCaption" style="z-index:3">${T(`กด 'สร้างวิดีโอ MP4' เพื่อเริ่ม`, `Hit 'Create MP4' to start`)}</div>`
      + `<div class="phonePlay" style="z-index:3">${I('play', 22)}</div>`
      + `<div class="phoneCtrls" style="z-index:3"><div class="pBar"><div></div></div><div class="pTime"><span>0:00</span><span>--</span></div></div>`
      + `</div>`;
  }

  // ── Storyboard panel ───────────────────────────────────────────────
  const storyboardScriptReady = !!(state.avatarScript || '').trim();
  const storyboardBtnLabel = state.storyboardLoading
    ? T('AI กำลังจัด…', 'AI is planning…')
    : ((state.avatarStoryboard && state.avatarStoryboard.length) ? T('สร้างใหม่', 'Re-plan') : T('ให้ AI จัด bg ทั้งหมด', 'AI plan all bgs'));
  const storyboardBtnIcon = state.storyboardLoading ? I('refresh', 12) : I('sparkles', 12);

  let storyboardBody = '';
  if (!state.avatarStoryboard || state.avatarStoryboard.length === 0) {
    storyboardBody = `<div style="padding:20px;text-align:center;background:#fff;border-radius:10px;border:1px dashed var(--line);font-size:12px;color:var(--muted);line-height:1.7">
      ${I('info', 16, 'var(--muted)')}
      <div style="margin-top:6px">${T('เขียนสคริปต์ + ตั้งความยาวก่อน — แล้วกด "ให้ AI จัด bg ทั้งหมด"', 'Write a script + set duration first — then hit "AI plan all bgs"')}</div>
      <div style="font-size:10.5px;margin-top:4px;opacity:.8">${T('AI จะแยก script เป็น N ช่วง และเลือก Pexels bg ที่เข้ากันให้แต่ละช่วง', 'AI splits the script into N segments and picks a matching Pexels bg for each')}</div>
      <div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px"><div style="flex:1;height:1px;background:var(--line)"></div><span style="font-size:10px;font-weight:700;color:var(--muted)">${T('หรือ ใส่สื่อของคุณเอง', 'OR add your own media')}</span><div style="flex:1;height:1px;background:var(--line)"></div></div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn outline" data-addmediaimg="1" style="height:32px;font-size:11px;padding:0 14px;color:var(--blue)">${I('plus', 12)} ${T('เพิ่มรูป', 'Add image')}</button>
        <button class="btn outline" data-addmediavid="1" style="height:32px;font-size:11px;padding:0 14px;color:var(--blue)">${I('video', 12)} ${T('เพิ่มวิดีโอ', 'Add video')}</button>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:6px">${T('เพิ่มได้หลายรูป/วิดีโอ · เรียงลำดับ + ตั้งวินาทีของแต่ละอันได้', 'Add multiple images/videos · reorder + set per-item seconds')}</div>
    </div>`;
  } else {
    const slotRows = state.avatarStoryboard.map((slot, i) => {
      const open = state.storyboardOpenSlot === i;
      const startM = Math.floor(slot.start_at_sec / 60);
      const startS = String(slot.start_at_sec % 60).padStart(2, '0');
      const endSec = slot.start_at_sec + slot.duration_sec;
      const endM = Math.floor(endSec / 60);
      const endS = String(endSec % 60).padStart(2, '0');
      const thumb = slot.preview || '';
      const slotIsVid = /^data:video\//i.test(slot.bg_url || '') || /^data:video\//i.test(thumb);
      let row = '<div style="background:#fff;border-radius:10px;border:1px solid var(--line);overflow:hidden">';
      row += '<div style="display:flex;align-items:center;gap:10px;padding:10px">';
      if (slotIsVid) {
        row += '<video src="' + (slot.bg_url || thumb) + '" muted playsinline style="width:46px;aspect-ratio:9/16;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid var(--line)"></video>';
      } else {
        const thumbStyle = thumb
          ? 'background-image:url(' + thumb + ');background-size:cover;background-position:center'
          : 'background:linear-gradient(135deg,#1a0033,#4A0E2C)';
        row += '<div style="width:46px;aspect-ratio:9/16;border-radius:6px;' + thumbStyle + ';flex-shrink:0;position:relative">';
        if (!slot.bg_url) row += '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#fff">' + I('image', 12, '#fff') + '</div>';
        row += '</div>';
      }
      row += '<div style="flex:1;min-width:0">';
      row += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">';
      row += '<span style="font-size:10px;font-weight:800;color:var(--orange);background:var(--orange-soft);padding:2px 7px;border-radius:99px">⏱ ' + startM + ':' + startS + '-' + endM + ':' + endS + '</span>';
      row += '<span style="font-size:9.5px;color:var(--muted)">' + slot.duration_sec + T(' วิ', ' s') + '</span>';
      row += '</div>';
      row += '<div style="font-size:11.5px;color:var(--ink2);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">';
      if (slot.script_chunk_th) row += '💬 ' + escText(slot.script_chunk_th);
      else if (slot.manual) row += '<span style="color:var(--ink2)">' + (slotIsVid ? T('วิดีโอของคุณ', 'Your video') : T('รูปของคุณ', 'Your image')) + '</span>';
      else row += '<span style="color:var(--muted);font-style:italic">' + T('ไม่มีสคริปต์ในช่วงนี้', 'No script for this slot') + '</span>';
      row += '</div>';
      if (slot.bg_query_en) row += '<div style="font-size:9.5px;color:var(--muted);margin-top:3px">🔍 ' + escText(slot.bg_query_en) + '</div>';
      row += '</div>';
      row += '<button class="btn outline" data-slottoggle="' + i + '" style="height:28px;font-size:10.5px;padding:0 10px;flex-shrink:0">';
      row += (open ? I('x', 11) + ' ' + T('ปิด', 'Close') : I('refresh', 11) + ' ' + T('เปลี่ยน', 'Change'));
      row += '</button>';
      row += '</div>';
      // ── Controls bar: duration (sec) + reorder + delete ──────────────
      row += '<div style="display:flex;align-items:center;gap:6px;padding:0 10px 10px">';
      row += '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;color:var(--muted)">' + I('clock', 12, '#9C8BB8')
        + '<input type="number" min="1" max="120" step="1" value="' + slot.duration_sec + '" data-slotdur="' + i + '" class="input" style="width:54px;height:28px;font-size:11px;padding:0 6px;text-align:center"/>' + T('วิ', 'sec') + '</span>';
      row += '<span style="flex:1"></span>';
      row += '<button class="btn outline" data-slotmove="' + i + '|up"' + (i === 0 ? ' disabled' : '') + ' style="height:28px;min-width:30px;padding:0 8px;font-size:13px;font-weight:800">↑</button>';
      row += '<button class="btn outline" data-slotmove="' + i + '|down"' + (i === state.avatarStoryboard.length - 1 ? ' disabled' : '') + ' style="height:28px;min-width:30px;padding:0 8px;font-size:13px;font-weight:800">↓</button>';
      row += '<button class="btn outline" data-slotdel="' + i + '" style="height:28px;min-width:30px;padding:0 8px;color:#DC2626">' + I('x', 12, '#DC2626') + '</button>';
      row += '</div>';
      if (open) {
        row += '<div style="padding:10px;border-top:1px dashed var(--line);background:#FAF6EF">';
        row += '<div style="display:flex;gap:6px;margin-bottom:8px">';
        row += '<div style="position:relative;flex:1">';
        row += '<span style="position:absolute;top:50%;left:10px;transform:translateY(-50%);pointer-events:none;display:inline-flex">' + I('search', 12, '#9C8BB8') + '</span>';
        const ssVal = (state.storyboardSearch && state.storyboardSearch[i] != null) ? state.storyboardSearch[i] : (slot.bg_query_en || '');
        row += '<input class="input" data-slotsearchin="' + i + '" placeholder="' + T('ค้นหา Pexels…', 'Search Pexels…') + '" value="' + escText(ssVal) + '" style="height:30px;font-size:11px;padding-left:28px;padding-right:10px;width:100%"/>';
        row += '</div>';
        row += '<button class="btn outline" data-slotsearch="' + i + '" style="height:30px;font-size:10.5px;padding:0 10px">' + T('ค้นหา', 'Go') + '</button>';
        row += '</div>';
        row += '<button class="btn outline" data-slotuploadimg="' + i + '" style="width:100%;height:30px;font-size:10.5px;margin-bottom:8px;color:var(--blue)">' + I('upload', 12) + ' ' + T('อัปโหลดรูปเอง', 'Upload your own image') + '</button>';
        const cands = (state.storyboardSlotCands && state.storyboardSlotCands[i]) || [];
        if (state.storyboardSlotCands && state.storyboardSlotCands['_loading_' + i]) {
          row += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">'
            + Array(4).fill(0).map(() => '<div style="aspect-ratio:9/16;border-radius:6px;background:linear-gradient(135deg,#EDE9FE,#FAE8FF);animation:ppBgPulse 1.4s ease-in-out infinite"></div>').join('')
            + '<style>@keyframes ppBgPulse{0%,100%{opacity:.55}50%{opacity:1}}</style>'
            + '</div>';
        } else if (!cands.length) {
          row += '<div style="font-size:10.5px;color:var(--muted);padding:8px;text-align:center;background:#fff;border-radius:8px;border:1px dashed var(--line)">' + T('กดค้นหาเพื่อโหลด Pexels', 'Hit Go to load Pexels') + '</div>';
        } else {
          row += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">';
          cands.slice(0, 8).forEach((v) => {
            const isPicked = (slot.bg_url === v.url);
            const ts = v.preview ? 'background-image:url(' + v.preview + ');background-size:cover;background-position:center' : 'background:linear-gradient(135deg,#1a0033,#4A0E2C)';
            row += '<button data-slotpickurl="' + i + '|' + escText(v.url || '') + '|' + escText(v.preview || '') + '" '
              + 'style="position:relative;aspect-ratio:9/16;border-radius:6px;border:' + (isPicked ? '2px solid var(--orange)' : '1px solid var(--line)') + ';padding:0;cursor:pointer;overflow:hidden;' + ts + '">';
            if (isPicked) row += '<span style="position:absolute;top:3px;right:3px;width:14px;height:14px;border-radius:99px;background:var(--orange);color:#fff;display:grid;place-items:center;font-size:8px;font-weight:800">✓</span>';
            if (v.duration) row += '<span style="position:absolute;bottom:2px;right:2px;font-size:7.5px;font-weight:800;color:#fff;background:rgba(0,0,0,.55);padding:1px 4px;border-radius:3px">' + Math.round(v.duration) + 's</span>';
            row += '</button>';
          });
          row += '</div>';
        }
        row += '</div>';
      }
      row += '</div>';
      return row;
    }).join('');
    const totalDur = state.avatarStoryboard.reduce((a, s) => a + (s.duration_sec || 0), 0);
    storyboardBody = '<div style="display:flex;flex-direction:column;gap:8px">' + slotRows + '</div>'
      + '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap">'
      +   '<button class="btn outline" data-addmediaimg="1" style="height:30px;font-size:10.5px;padding:0 12px;color:var(--blue)">' + I('plus', 12) + ' ' + T('เพิ่มรูป', 'Add image') + '</button>'
      +   '<button class="btn outline" data-addmediavid="1" style="height:30px;font-size:10.5px;padding:0 12px;color:var(--blue)">' + I('video', 12) + ' ' + T('เพิ่มวิดีโอ', 'Add video') + '</button>'
      + '</div>'
      + '<div style="font-size:9.5px;color:var(--muted);margin-top:8px;text-align:right">' + T('รวม ', 'Total ') + totalDur + T(' วิ', 's') + ' · ' + T('คลิป Pexels เครดิต pexels.com', 'Pexels clips · credit pexels.com') + '</div>';
  }

  const storyboardPanel = `
  <div style="margin-top:14px;padding:14px;border-radius:12px;background:var(--cream2);border:1px solid var(--line)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:11px;font-weight:800;color:var(--purple);letter-spacing:.04em;text-transform:uppercase;display:inline-flex;align-items:center;gap:5px">
          ${I('video', 12, '#5B21B6')} ${T('Storyboard — bg ตามจังหวะ', 'Storyboard — bg per scene')}
        </span>
        <span style="padding:1px 6px;border-radius:99px;background:#EDE9FE;color:#5B21B6;font-size:9px;font-weight:800;letter-spacing:.03em">${T('Pexels', 'Pexels')}</span>
      </div>
      <button class="btn ${storyboardScriptReady ? 'primary' : 'outline'}" data-genstoryboard="1" style="height:32px;font-size:11px;padding:0 14px" ${(!storyboardScriptReady || state.storyboardLoading) ? 'disabled' : ''}>
        ${storyboardBtnIcon} ${storyboardBtnLabel}
      </button>
    </div>
    ${storyboardBody}
    <input type="file" accept="video/*" id="ppAvatarBgUploadInput" style="display:none"/>
    <input type="file" accept="image/*" id="ppStoryboardImgInput" style="display:none"/>
    <input type="file" accept="video/*" id="ppStoryboardVidInput" style="display:none"/>
  </div>`;

  // ── Action row ─────────────────────────────────────────────────────
  const renderBtnLabel = state.avatarVideoLoading
    ? T(`กำลังสร้าง… <span data-progress-pct>${state.avatarVideoProgress || 0}</span>%`, `Rendering… <span data-progress-pct>${state.avatarVideoProgress || 0}</span>%`)
    : (state.avatarVideo ? T('สร้างวิดีโอใหม่', 'Re-render') : T('สร้างวิดีโอ MP4', 'Create MP4'));

  const downloadBtn = state.avatarVideo
    ? `<a class="btn outline" style="flex:1;min-width:100px;text-decoration:none;justify-content:center" href="${state.avatarVideo}" download="postpost-avatar.${state.avatarVideoExt || 'mp4'}">${I('download', 14)} ${(state.avatarVideoExt || 'mp4').toUpperCase()}</a>`
    : `<button class="btn outline" style="flex:1;min-width:100px" disabled>${I('download', 14)} MP4</button>`;

  const actionRow = `
  <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
    <button class="btn primary" data-avatarvideo="1" style="flex:1.6;min-width:170px" ${state.avatarVideoLoading ? 'disabled' : ''}>
      ${state.avatarVideoLoading ? I('refresh', 14) : I('video', 14)}
      ${renderBtnLabel}
    </button>
    ${downloadBtn}
    <button class="btn outline" data-saveavatardraft="1" style="flex:1;min-width:130px" ${(!state.avatarVideo || state.avatarSavingDraft) ? 'disabled' : ''}>${state.avatarSavingDraft ? I('refresh', 14) : I('library', 14)} ${state.avatarSavingDraft ? T('กำลังบันทึก…', 'Saving…') : T('บันทึกดราฟ', 'Save draft')}</button>
    <button class="btn outline" style="flex:1;min-width:100px">${I('send', 14)} ${T('โพสต์', 'Post')}</button>
  </div>
  <div style="margin-top:14px;padding:12px;border-radius:12px;background:var(--blue-soft);border:1px solid #DBE5FF;display:flex;align-items:center;gap:10px">
    ${I('sparkles', 14, '#2563EB')}
    <div style="flex:1;font-size:11.5px;line-height:1.5;color:#1E40AF"><b>${T('AI แนะนำ:', 'AI tip:')}</b> ${T('คลิปนี้เหมาะกับโพสต์ช่วงค่ำ — engagement สูงสุด 19:00-21:00', 'This clip works best in the evening — engagement peaks 7-9 PM.')}</div>
  </div>`;

  const rightRail = `
  <div style="position:sticky;top:0;display:flex;flex-direction:column;gap:18px">
    <div class="card">
      <div class="cardHeader">
        <h3 class="cardTitle">${T('ตัวอย่างคลิป', 'Clip preview')}</h3>
        <span class="pill blue">${I('video', 11)} 9:16 · Reels / TikTok</span>
      </div>
      <div style="display:flex;justify-content:center">
        ${phonePreview}
      </div>
      ${storyboardPanel}
      ${actionRow}
    </div>
  </div>`;

  return html`${raw(head(
    'CREATE',
    'Talking Avatar',
    T('เลือกผู้บรรยาย AI · ใส่สคริปต์ภาษาไทย · ได้คลิป MP4 พร้อมโพสต์ Reels / TikTok', 'Pick a presenter · type a Thai script · get an MP4 for Reels / TikTok'),
    headActions
  ))}

  <div class="grid" style="grid-template-columns:1fr 1.05fr;gap:20px;align-items:flex-start">
    <div style="display:flex;flex-direction:column;gap:18px">
      ${raw(card1Mode)}
      ${raw(card2Presenter)}
      ${raw(card3Voice)}
      ${raw(card4Length)}
      ${raw(card5Script)}
    </div>
    ${raw(rightRail)}
  </div>`;
}
