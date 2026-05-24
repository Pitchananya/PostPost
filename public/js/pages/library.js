// public/js/pages/library.js
//
// Content Library — grid of every draft/scheduled/published asset. Mirrors
// the inline pageLibrary() exactly. The list is built from state.drafts;
// each draft is classified as image/album/video/avatar/caption based on its
// kind + imageCount.
//
// All HTML-emitting helpers (I, head) wrapped in raw() per the html``
// safety model. Asset title (from draft.topic) auto-escapes via html``.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { head } from '../components/head.js';

export function pageLibrary() {
  const draftCards = (state.drafts || []).map(function (d) {
    let dt = '';
    try { dt = new Date(d.createdAt).toLocaleDateString(state.lang === 'th' ? 'th-TH' : 'en-US', { day: '2-digit', month: 'short' }); } catch (e) {}
    // Talking Avatar drafts (kind:'avatar') belong in the Videos bucket too — they
    // ARE videos, just produced via a different pipeline than Veo.
    const isAvatar = d.kind === 'avatar';
    const isVideo = d.kind === 'video' || isAvatar;
    // Count images BEFORE deriving kind — legacy drafts may not have `imageCount` field
    const imgCount = isVideo ? 0
      : (typeof d.imageCount === 'number' ? d.imageCount
        : Array.isArray(d.imageIds) ? d.imageIds.filter(Boolean).length
        : Array.isArray(d.images) ? d.images.filter(Boolean).length
        : 0);
    const kind = isVideo ? 'video' : (imgCount > 1 ? 'album' : imgCount === 1 ? 'image' : 'caption');
    const videoTitleDefault = isAvatar ? 'Talking Avatar' : 'วิดีโอ Veo';
    return {
      kind: kind,
      title_th: d.topic || (isVideo ? videoTitleDefault : 'คอนเทนต์ดราฟ'),
      title_en: d.topic || (isVideo ? (isAvatar ? 'Talking Avatar' : 'Veo video') : 'Content draft'),
      date: dt,
      status: 'draft',
      // Distinguish Avatar drafts visually — purple-pink gradient vs Veo's blue-black
      bg: isAvatar ? 'linear-gradient(135deg,#5B21B6,#EC4899)'
        : isVideo ? 'linear-gradient(135deg,#1F2937,#4F46E5)'
          : 'linear-gradient(135deg,#FFE4E6,#FED7AA)',
      label: isAvatar ? (state.lang === 'th' ? 'อวตาร' : 'AVATAR')
        : isVideo ? (state.lang === 'th' ? 'วิดีโอ' : 'VIDEO')
          : 'DRAFT',
      isDraft: true,
      draftId: d.id,
      // Avatar thumbnail = the captured poster, else the avatar photo
      image: d.thumb || (isAvatar ? (d.avatarThumb || '') : isVideo ? (d.referenceImage || '') : ''),
      imageCount: imgCount,
    };
  });
  const ASSETS = draftCards;

  const KINDS = [
    { id: 'all',     th: 'ทั้งหมด', en: 'All',      n: ASSETS.length,                                   icon: 'library' },
    { id: 'image',   th: 'รูปภาพ',  en: 'Images',   n: ASSETS.filter((a) => a.kind === 'image').length, icon: 'image'   },
    { id: 'album',   th: 'อัลบั้ม',  en: 'Albums',   n: ASSETS.filter((a) => a.kind === 'album').length, icon: 'layers'  },
    { id: 'video',   th: 'วิดีโอ',   en: 'Videos',   n: ASSETS.filter((a) => a.kind === 'video').length, icon: 'video'   },
    { id: 'caption', th: 'แคปชั่น',  en: 'Captions', n: ASSETS.filter((a) => a.kind === 'caption').length, icon: 'type'  },
  ];

  const filtered = state.libraryFilter === 'all' ? ASSETS : ASSETS.filter((a) => a.kind === state.libraryFilter);

  const actions = `<button class="btn outline sm">${I('filter', 14)} ${T('กรอง', 'Filter')}</button>
     <button class="btn outline sm">${I('upload', 14)} ${T('อัปโหลด', 'Upload')}</button>
     <button class="btn primary sm">${I('sparkles', 14)} ${T('สร้างใหม่', 'Create new')}</button>`;

  return html`${raw(head('OPERATIONS', T('คลังคอนเทนต์', 'Library'),
    T('คอนเทนต์ทั้งหมดที่ AI เคยสร้าง · แยกตามประเภทและสถานะ · ใช้ซ้ำได้เสมอ', 'Every asset AI made · by type & status · reusable forever'),
    actions
  ))}

  <!-- Kind filter cards -->
  <div class="grid g5" style="margin-bottom:18px;gap:12px">
    ${raw(KINDS.map((k) => `<button class="card ${state.libraryFilter === k.id ? '' : ''}" data-set="libraryFilter=${k.id}" style="padding:16px;cursor:pointer;text-align:left;border:${state.libraryFilter === k.id ? '2px solid var(--orange)' : '1px solid var(--line)'};background:${state.libraryFilter === k.id ? 'var(--orange-soft)' : 'var(--surface)'}">
      <div class="metric">
        <div class="metricIcon ${state.libraryFilter === k.id ? 'orange' : ''}">${I(k.icon, 18)}</div>
        <div>
          <div class="metricVal" style="font-size:22px">${k.n}</div>
          <div class="metricLab">${T(k.th, k.en)}</div>
        </div>
      </div>
    </button>`).join(''))}
  </div>

  <!-- Toolbar -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
    <div class="tabs">
      ${raw([['all', 'ทั้งหมด', 'All'], ['published', 'เผยแพร่แล้ว', 'Published'], ['scheduled', 'รอเวลา', 'Scheduled'], ['draft', 'Draft', 'Draft']].map(([id, th, en]) => `<button class="tab ${id === 'all' ? 'active' : ''}">${T(th, en)}</button>`).join(''))}
    </div>
    <button class="btn outline sm">${raw(I('calendar', 13))} ${raw(T('30 วันล่าสุด', 'Last 30 days'))} ${raw(I('chev_down', 12))}</button>
    <div style="flex:1"></div>
    <div class="search" style="height:36px;width:220px">${raw(I('search', 13))}<input placeholder="${T('ค้นหา', 'Search')}"/></div>
    <div class="tabs" style="padding:3px">
      <button class="tab active" style="padding:5px 8px">${raw(I('layers', 13))}</button>
      <button class="tab" style="padding:5px 8px">${raw(I('type', 13))}</button>
    </div>
  </div>

  <!-- Grid -->
  ${filtered.length === 0
    ? html`<div style="padding:48px 24px;text-align:center;background:var(--cream2);border-radius:16px;border:1px dashed var(--line3)">
        ${raw(I('library', 36, '#A39BAE'))}
        <div style="font-size:14px;font-weight:700;color:var(--ink);margin:10px 0 4px">${T('ยังไม่มีคอนเทนต์', 'No content yet')}</div>
        <div class="micro">${T('สร้างคอนเทนต์แล้วกด "Draft" — จะมาแสดงที่นี่', 'Generate content and hit "Draft" — it shows up here')}</div>
      </div>`
    : raw(`<div class="grid g4">
      ${filtered.map((a) => {
        const statusPill = a.status === 'published' ? 'green' : a.status === 'scheduled' ? 'blue' : 'orange';
        const statusLabel = a.status === 'published' ? T('เผยแพร่แล้ว', 'Published') : a.status === 'scheduled' ? T('รอเวลา', 'Scheduled') : 'Draft';
        return `<div class="productCard" ${a.isDraft ? `data-editdraft="${a.draftId}"` : ''} style="padding:12px;${a.isDraft ? 'cursor:pointer' : ''}">
          <div style="aspect-ratio:4/3;border-radius:10px;background:${a.bg};position:relative;overflow:hidden;display:grid;place-items:center">
            ${a.image ? `<img src="${a.image}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"/>` : ''}
            ${a.imageCount && a.imageCount > 1 ? `<div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:6px;z-index:1">${I('layers', 10, '#fff')} ${a.imageCount}</div>` : ''}
            ${a.kind === 'video' || a.kind === 'avatar' ? `<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:99px;background:rgba(255,255,255,.9);display:grid;place-items:center;color:var(--purple);box-shadow:0 6px 18px rgba(0,0,0,.20);z-index:1">${I('play', 18)}</div>` : ''}
            <div style="position:relative;z-index:1;background:rgba(255,255,255,.85);backdrop-filter:blur(6px);padding:4px 10px;border-radius:99px;font-size:10px;font-weight:800;color:#7C2D12;letter-spacing:.08em">${a.label}</div>
          </div>
          <b style="display:block;margin-top:10px;font-size:13px;color:var(--purple);line-height:1.35;min-height:36px;overflow:hidden">${escText(t({ th: a.title_th, en: a.title_en }))}</b>
          <div class="split">
            <span class="pill ${statusPill}" style="font-size:10.5px;height:20px">${statusLabel}</span>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:11px;color:var(--muted)">${a.date}</span>
              ${a.isDraft ? `<button data-deletedraft="${a.draftId}" title="${T('ลบดราฟ', 'Delete draft')}" style="background:none;border:none;cursor:pointer;color:var(--red);width:22px;height:22px;padding:0;display:grid;place-items:center;border-radius:6px">${I('x', 13, '#DC2626')}</button>` : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`)}`;
}
