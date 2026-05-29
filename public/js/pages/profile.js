// public/js/pages/profile.js
//
// Brand Profile — switcher (multi-brand), brand metadata editor (name,
// business type, AI description), Brand Voice picker, Brand Archetype
// picker, posting channels, Shopee scraper, manual product entry,
// product grid. Mirrors the inline pageProfile() exactly — biggest page
// in Phase 3c.
//
// Bridges (still inline in index.html, reached via window.PP):
//   - brandMark(b), productImgHTML(p, opts)
//   These return HTML strings; wrap raw() at call sites.
//
// Direct imports from data modules:
//   - BRANDS, MAX_BRANDS — multi-brand catalog (shared mutable array)
//   - VOICES — 11-tone picker source
//   - ARCHETYPES — 12-archetype Jungian picker
//   - PRODUCTS — current brand's product list (shared mutable array)
//   - BUSINESS_TYPES — business-type dropdown options
//
// All HTML-emitting helpers (I, head) wrapped in raw(). User-facing
// strings (brand.name, channel handle, product names) routed through
// escText where they're inserted directly into HTML body content.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { escText } from '../escape.js';
import { head } from '../components/head.js';
import { BRANDS, MAX_BRANDS } from '../data/brands.js';
import { VOICES } from '../data/voices.js';
import { ARCHETYPES } from '../data/archetypes.js';
import { PRODUCTS } from '../data/topics.js';
import { BUSINESS_TYPES } from '../data/business-types.js';

// Bridge accessors — these helpers still live inline. Look up at call
// time so we tolerate either boot order.
const PP = () => window.PP || {};
const brandMark = (b) => PP().brandMark ? PP().brandMark(b) : (b.mark || '');
const productImgHTML = (p, opts) => PP().productImgHTML ? PP().productImgHTML(p, opts) : '';

// Local copy of the inline businessOptions() — also exposed via window.PP
// (the inline pages still call it), but we use the module copy here so
// the bridge is one-way (inline → module reads, module doesn't depend on
// the bridge for what it could compute directly).
function businessOptions(sel) {
  return BUSINESS_TYPES.map((b) => {
    const label = T(b.th, b.en);
    return `<option${label === sel ? ' selected' : ''}>${label}</option>`;
  }).join('');
}

// ── AI Instruction builder — pick from buttons, no typing ──────────────
// Each section's chosen options compile into brand.aiInstruction (what the
// backend actually reads). ctitle is the language-neutral compile heading.
const AI_INS_SECTIONS = [
  { key: 'identity',   th: 'บทบาท (Identity)',       en: 'Identity',         ctitle: 'IDENTITY',        single: true, opts: ['ผู้เชี่ยวชาญ Content Creative', 'Copywriter สายขาย', 'ครีเอเตอร์สายไวรัล', 'ที่ปรึกษาแบรนด์', 'ที่ปรึกษาการเงิน', 'นักพยากรณ์สายมู'] },
  { key: 'persona',    th: 'โทนการสื่อสาร (Tone)',    en: 'Tone',             ctitle: 'PERSONA & TONE',  opts: ['เป็นกันเอง', 'ทางการ', 'สนุกสนาน', 'หรูหรา', 'จริงจัง', 'อบอุ่น', 'น่าเชื่อถือ', 'ขลัง/ศักดิ์สิทธิ์'] },
  { key: 'goals',      th: 'เป้าหมาย (Goals)',        en: 'Goals',            ctitle: 'GOALS',           opts: ['เพิ่ม engagement', 'เพิ่มยอดขาย', 'สร้าง awareness', 'สร้าง community', 'คิดหัวข้อ 30/เดือน'] },
  { key: 'platform',   th: 'แพลตฟอร์ม',               en: 'Platform',         ctitle: 'PLATFORM',        opts: ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'LINE'] },
  { key: 'rules',      th: 'กฎ (Rules)',              en: 'Rules',            ctitle: 'RULES',           opts: ['ห้ามคำเสี่ยงโดนแบน', 'ห้ามหัวข้อซ้ำ', 'ห้ามการันตี 100%', 'ลงท้ายด้วย CTA', 'ห้ามเคลมเกินจริง', 'ใส่ disclaimer ความเสี่ยง'] },
  { key: 'frameworks', th: 'Hook Frameworks',         en: 'Hook frameworks',  ctitle: 'HOOK FRAMEWORKS', opts: ['ขยี้ปัญหา + ผลลัพธ์ + เวลา', 'ความโลภ + ความกลัว', 'ตั้งคำถามชวนสงสัย', 'ตัวเลขช็อก', 'before / after', 'storytelling'] },
  { key: 'style',      th: 'สไตล์การตอบ (Style)',     en: 'Style',            ctitle: 'STYLE',           opts: ['bullet points', 'numbering', 'ตาราง', 'ย่อหน้าสั้น', 'อ้างอิงแหล่งข้อมูล'] },
  { key: 'length',     th: 'ความยาว',                 en: 'Length',           ctitle: 'LENGTH',          single: true, opts: ['สั้นกระชับ', 'ปานกลาง', 'ละเอียด'] },
  { key: 'visual',     th: 'แนวภาพ (Visual)',         en: 'Visual style',     ctitle: 'VISUAL STYLE',    opts: ['premium', 'clean', 'minimal', 'luxury', 'สดใส', 'อบอุ่น', 'Korean premium wellness', 'glassmorphism cards', 'sage-green + cream + gold', 'อินโฟกราฟิกหลายกล่อง', 'ขนสัตว์สมจริง', 'แสง glow + sparkle', '4K ultra detailed', 'มงคล ทอง-ม่วง ประกาย'] },
  { key: 'safety',     th: 'ความปลอดภัย (Safety)',    en: 'Safety',           ctitle: 'SAFETY',          opts: ['ไม่เปิดเผยข้อมูลภายใน', 'ไม่ให้คำแนะนำผิดกฎหมาย'] },
];

// Compile the picked options (+ auto business info from the brand profile)
// into the instruction string the AI receives. Sections are numbered in order.
function compileAiIns(brand) {
  const ch = (brand && brand.aiInsChoices) || {};
  const lines = ['[INSTRUCTION]', ''];
  let n = 0;
  AI_INS_SECTIONS.forEach((sec) => {
    const vals = ch[sec.key] || [];
    if (!vals.length) return;
    n += 1;
    lines.push(`${n}. ${sec.ctitle}: ${vals.join(' · ')}`);
  });
  const biz = [brand && brand.bizType, (brand && brand.desc) || ''].map((x) => (x || '').trim()).filter(Boolean).join(' · ');
  if (biz) { n += 1; lines.push(`${n}. ข้อมูลธุรกิจ: ${biz}`); }
  return n ? lines.join('\n') : '';
}

// Quick-start presets — option strings MUST match AI_INS_SECTIONS opts exactly.
const AI_INS_PRESETS = {
  'content-creative': { identity: ['ผู้เชี่ยวชาญ Content Creative'], persona: ['เป็นกันเอง', 'สนุกสนาน'], goals: ['เพิ่ม engagement', 'คิดหัวข้อ 30/เดือน'], rules: ['ห้ามคำเสี่ยงโดนแบน', 'ห้ามหัวข้อซ้ำ'], frameworks: ['ตั้งคำถามชวนสงสัย', 'storytelling'], style: ['bullet points'], length: ['ปานกลาง'] },
  'sales-focused':    { identity: ['Copywriter สายขาย'], persona: ['จริงจัง'], goals: ['เพิ่มยอดขาย'], rules: ['ลงท้ายด้วย CTA', 'ห้ามการันตี 100%', 'ห้ามเคลมเกินจริง'], frameworks: ['ความโลภ + ความกลัว', 'ตัวเลขช็อก'], length: ['สั้นกระชับ'] },
  'storytelling':     { identity: ['ครีเอเตอร์สายไวรัล'], persona: ['อบอุ่น'], goals: ['สร้าง awareness'], frameworks: ['storytelling', 'before / after'], style: ['ย่อหน้าสั้น'], length: ['ปานกลาง'] },
  'educational':      { identity: ['ที่ปรึกษาแบรนด์'], persona: ['ทางการ'], goals: ['สร้าง awareness'], style: ['numbering', 'อ้างอิงแหล่งข้อมูล'], length: ['ละเอียด'] },
  'viral-short':      { identity: ['ครีเอเตอร์สายไวรัล'], persona: ['สนุกสนาน'], platform: ['TikTok', 'Instagram'], frameworks: ['ตัวเลขช็อก', 'ตั้งคำถามชวนสงสัย'], length: ['สั้นกระชับ'] },
  'luxury-premium':   { identity: ['ที่ปรึกษาแบรนด์'], persona: ['หรูหรา'], rules: ['ห้ามเคลมเกินจริง'], visual: ['luxury', 'minimal', 'premium'], length: ['สั้นกระชับ'] },
  'community':        { identity: ['ครีเอเตอร์สายไวรัล'], persona: ['เป็นกันเอง', 'อบอุ่น'], goals: ['สร้าง community', 'เพิ่ม engagement'], frameworks: ['ตั้งคำถามชวนสงสัย'] },
  // Premium Korean pet-wellness infographic look (per user's poster brief) —
  // pre-selects the rich VISUAL STYLE so AI image prompts follow the aesthetic.
  'infographic-premium': { identity: ['ที่ปรึกษาแบรนด์'], persona: ['หรูหรา'], goals: ['สร้าง awareness'], style: ['numbering'], length: ['ละเอียด'], visual: ['Korean premium wellness', 'glassmorphism cards', 'sage-green + cream + gold', 'อินโฟกราฟิกหลายกล่อง', 'ขนสัตว์สมจริง', 'แสง glow + sparkle', '4K ultra detailed', 'premium', 'clean'] },
  // สายมู — ดูดวง / เครื่องราง / วัตถุมงคล / ฮวงจุ้ย. Mystical but compliant:
  // no 100% guarantees, no ban-risk wording (FB/TikTok police superstition claims).
  'mystic':           { identity: ['นักพยากรณ์สายมู'], persona: ['ขลัง/ศักดิ์สิทธิ์', 'อบอุ่น'], goals: ['สร้าง community', 'เพิ่ม engagement'], rules: ['ห้ามการันตี 100%', 'ห้ามคำเสี่ยงโดนแบน'], frameworks: ['storytelling', 'ตั้งคำถามชวนสงสัย', 'ความโลภ + ความกลัว'], style: ['ย่อหน้าสั้น'], length: ['ปานกลาง'], visual: ['มงคล ทอง-ม่วง ประกาย', 'อบอุ่น'] },
  // การเงิน — ลงทุน / ประกัน / สินเชื่อ / วางแผนการเงิน. Trust-first: numbers,
  // sources, and a risk disclaimer; never guarantee returns.
  'finance':          { identity: ['ที่ปรึกษาการเงิน'], persona: ['น่าเชื่อถือ', 'ทางการ'], goals: ['สร้าง awareness', 'เพิ่มยอดขาย'], rules: ['ห้ามการันตี 100%', 'ห้ามเคลมเกินจริง', 'ใส่ disclaimer ความเสี่ยง', 'ลงท้ายด้วย CTA'], frameworks: ['ตัวเลขช็อก', 'ขยี้ปัญหา + ผลลัพธ์ + เวลา'], style: ['numbering', 'อ้างอิงแหล่งข้อมูล'], length: ['ละเอียด'], visual: ['clean', 'minimal', 'premium'] },
};
function aiInsPreset(kind) { return AI_INS_PRESETS[kind] ? JSON.parse(JSON.stringify(AI_INS_PRESETS[kind])) : null; }

// Expose for the inline click/change handlers in index.html.
try { if (typeof window !== 'undefined') { window.PP = window.PP || {}; window.PP.compileAiIns = compileAiIns; window.PP.aiInsPreset = aiInsPreset; } } catch (_) {}

// Inline PRODUCT_CATEGORIES — only used by the Profile "Add product manually"
// form. Keeping it local until/unless another page needs it.
const PRODUCT_CATEGORIES = [
  { th: 'สกินแคร์',            en: 'Skincare' },
  { th: 'เครื่องสำอาง',         en: 'Cosmetics' },
  { th: 'อาหารเสริม & วิตามิน', en: 'Supplements & Vitamins' },
  { th: 'สุขภาพ & ความงาม',    en: 'Health & Beauty' },
  { th: 'อาหาร & เครื่องดื่ม',   en: 'Food & Drink' },
  { th: 'แฟชั่น & เสื้อผ้า',     en: 'Fashion & Apparel' },
  { th: 'เครื่องประดับ',         en: 'Jewelry & Accessories' },
  { th: 'ของใช้ในบ้าน & ไลฟ์สไตล์', en: 'Home & Living' },
  { th: 'แม่ & เด็ก',           en: 'Mom & Baby' },
  { th: 'สัตว์เลี้ยง',           en: 'Pet Products' },
  { th: 'แกดเจ็ต & ไอที',       en: 'Gadgets & IT' },
  { th: 'ของมงคล / สายมู',     en: 'Spiritual & Lucky' },
  { th: 'งานฝีมือ & DIY',       en: 'Handmade & DIY' },
  { th: 'อื่นๆ',                en: 'Other' },
];

export function pageProfile() {
  const activeBrand = BRANDS.find((b) => b.id === state.brand) || BRANDS[0];
  const aiOpen = state.aiAssistOpen;
  const manualOpen = state.manualOpen;

  const aiSuggestions = [
    { tag_th: 'ละเอียด',     tag_en: 'Detailed',         text_th: 'แบรนด์สกินแคร์ออร์แกนิคจากดอกกุหลาบเขาใหญ่ที่ผลิตเองทั้งหมด เน้นผิวบอบบางและแพ้ง่าย กลุ่มลูกค้าผู้หญิงวัยทำงาน 25-40 ปี ที่ให้ความสำคัญกับความปลอดภัยและส่วนผสมธรรมชาติมากกว่าราคา จุดเด่นคือสูตรอ่อนโยน ไม่มีน้ำหอม และสามารถใช้ได้ทั้งครอบครัว', text_en: 'An organic skincare brand made from hand-picked Khao Yai roses. Targets sensitive, easily-irritated skin in women aged 25-40 who value safety and natural ingredients over price. Hero traits: gentle formula, fragrance-free, family-safe.' },
    { tag_th: 'สั้นและตรง',   tag_en: 'Short & punchy',   text_th: 'HappyPrice เป็นร้านที่ตั้งใจให้ทุกคนเข้าถึงสกินแคร์คุณภาพได้ในราคาเป็นมิตร เน้นความโปร่งใสของส่วนผสม รีวิวลูกค้าจริง 4.9 ดาวจาก 3,200 รีวิว สโลแกน "ผิวสวย ไม่ต้องแพง"', text_en: 'HappyPrice makes quality skincare accessible at fair prices. Transparent ingredients, 4.9 stars from 3,200 verified reviews. Tagline: "Glow without the price tag."' },
    { tag_th: 'เล่าเรื่อง',    tag_en: 'Storytelling',     text_th: 'แบรนด์ที่เกิดจากความเชื่อว่าผิวบอบบางสมควรได้รับการดูแลที่ดีกว่านี้ ใช้กุหลาบออร์แกนิกจากฟาร์มของเราเอง ทดสอบทุก batch โดยเภสัชกร',                                                                                                                                  text_en: 'Born from the belief that sensitive skin deserves better. Roses from our own organic farm, every batch tested by pharmacists.' },
  ];

  // product carousel — filter & sort view
  let viewProducts = PRODUCTS.slice();
  if (state.productInStockOnly) viewProducts = viewProducts.filter((p) => (p.stock || 0) > 0);
  if (state.productSort === 'sold') viewProducts.sort((a, b) => (b.sold || 0) - (a.sold || 0));
  else if (state.productSort === 'price_asc') viewProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (state.productSort === 'price_desc') viewProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (state.productSort === 'rating') viewProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const filterOn = !!(state.productSort || state.productInStockOnly);

  const actions = `<button class="btn outline sm">${I('info', 14)} ${T('ดูสคริปต์ AI', 'View AI prompt')}</button>
     <button class="btn primary sm" data-savebrand="1">${I('check', 14)} ${T('บันทึก', 'Save')}</button>`;

  return html`${raw(head(
    T('WORKSPACE', 'WORKSPACE'),
    T('Profile ของแบรนด์', 'Brand profile'),
    T('จัดการแบรนด์ทั้งหมดของคุณ · ตั้ง Brand Voice · เลือกสินค้าที่ AI จะใช้', 'Manage all your brands · set brand voice · pick products AI uses'),
    actions
  ))}

  <!-- === Brand switcher === -->
  <div class="card" style="margin-bottom:18px">
    <div class="cardHeader">
      <div>
        <h3 class="cardTitle">${raw(T('แบรนด์ของคุณ', 'Your brands'))}</h3>
        <p class="cardSub">${raw(T('แต่ละแบรนด์มี Brand Voice, สินค้า, และช่องทางของตัวเอง', 'Each brand has its own voice, products, and channels'))}</p>
      </div>
      <div style="display:flex;gap:8px">
        <span class="pill blue">${raw(T('แผน Pro · ได้สูงสุด 5 แบรนด์', 'Pro · up to 5 brands'))}</span>
        <button class="btn outline sm" data-addbrand="1">${raw(I('plus', 14))} ${raw(T('เพิ่มแบรนด์', 'Add brand'))}</button>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:14px;max-width:460px;margin-bottom:16px">
      <div>
        <label class="label">${raw(T('รูป Workspace', 'Logo'))}</label>
        <button data-changewslogo="1" title="${T('เปลี่ยนรูป', 'Change logo')}" style="width:56px;height:56px;border-radius:14px;border:1px solid var(--line);background:${state.workspaceLogo ? '#fff' : 'linear-gradient(135deg,#FF7A1A,#EC4899)'};color:#fff;display:grid;place-items:center;font-size:18px;font-weight:900;cursor:pointer;overflow:hidden;padding:0">
          ${state.workspaceLogo
            ? raw(`<img src="${escText(state.workspaceLogo)}" alt="" style="width:100%;height:100%;object-fit:cover"/>`)
            : escText((state.workspaceName || 'HappyPrice Shop').trim().slice(0, 2).toUpperCase())}
        </button>
        ${state.workspaceLogo ? raw(`<button class="btn ghost sm" data-clearwslogo="1" style="color:var(--red);height:24px;padding:0 6px;font-size:10.5px;margin-top:4px;width:56px">${I('x', 10, '#DC2626')} ${T('ลบ', 'Remove')}</button>`) : ''}
      </div>
      <div class="field" style="flex:1;margin-bottom:0">
        <label class="label">${raw(T('ชื่อ Workspace (โปรไฟล์รวม)', 'Workspace name'))}</label>
        <input class="input" id="ppWorkspaceName" value="${state.workspaceName || ''}" placeholder="${T('เช่น HappyPrice Shop', 'e.g. HappyPrice Shop')}" />
        <div class="hint">${raw(T('ชื่อ + รูปนี้แสดงบนแถบด้านซ้าย · บันทึกลง cloud อัตโนมัติ', 'Name + logo show in the left sidebar · auto-saved to cloud'))}</div>
      </div>
    </div>
    <div class="grid g4">
      ${raw(BRANDS.map((b) => `<button class="brandTile ${b.id === state.brand ? 'active' : ''}" data-brand="${b.id}">
        <div class="bInfo">
          <div class="bMark" style="background:${b.color};overflow:hidden">${brandMark(b)}</div>
          <div>
            <b>${escText(b.name || t({ th: b.name_th, en: b.name_en }))}</b>
            <div class="bSub">${escText(t({ th: b.sub_th, en: b.sub_en }))}</div>
          </div>
          ${b.id === state.brand ? `<span class="pill orange" style="height:20px;padding:2px 8px;font-size:10px">${T('กำลังแก้', 'Editing')}</span>` : ''}
        </div>
        ${(function () {
          // Count REAL connections (tokens in channelInfo), not seed `ch`
          // membership — so a demo brand with no OAuth doesn't claim
          // "เชื่อมแล้ว". Show the connected channels' icons + a count.
          const ci = b.channelInfo || {};
          const live = [];
          if (ci.facebook && ci.facebook.page_token) live.push('facebook');
          if (ci.instagram && ci.instagram.ig_business_id) live.push('instagram');
          if (ci.tiktok && ci.tiktok.open_id) live.push('tiktok');
          const color = (c) => c === 'facebook' ? '#1877F2' : c === 'instagram' ? '#E1306C' : '#0F172A';
          return `<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted)">
            ${live.length
              ? `<div style="display:flex;gap:4px">${live.map((c) => I(c, 14, color(c))).join('')}</div><span>·</span><span style="color:var(--green);font-weight:700">${T('เชื่อมแล้ว ' + live.length, live.length + ' connected')}</span>`
              : `<span>${T('ยังไม่ได้เชื่อมช่องทาง', 'No channels connected')}</span>`}
          </div>`;
        })()}
      </button>`).join(''))}
      ${BRANDS.length < MAX_BRANDS ? raw(`<button class="brandTile add" data-addbrand="1">
        ${I('plus', 22)}
        <b style="color:var(--ink2);font-size:13px;margin-top:6px">${T('เพิ่มแบรนด์', 'Add brand')}</b>
        <div class="bSub">${T('ใช้ได้อีก ' + (MAX_BRANDS - BRANDS.length) + ' แบรนด์', (MAX_BRANDS - BRANDS.length) + ' slots left')}</div>
      </button>`) : ''}
    </div>
  </div>

  <div class="grid" style="grid-template-columns:1fr 1fr;gap:18px">
    <!-- === Workspace info === -->
    <div class="card">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div style="width:60px;height:60px;border-radius:14px;overflow:hidden;background:${activeBrand.color};display:grid;place-items:center;color:#fff;font-weight:800;font-size:20px;box-shadow:var(--shadow3)">${raw(brandMark(activeBrand))}</div>
        <div style="flex:1">
          <h3 class="cardTitle" style="font-size:20px">${activeBrand.name}</h3>
          <p class="cardSub">${T('ID: ' + activeBrand.id + ' · ', 'ID: ' + activeBrand.id + ' · ')}${t({ th: activeBrand.sub_th, en: activeBrand.sub_en })}</p>
        </div>
        <button class="btn ghost sm" data-changelogo="1">${raw(I('edit', 13))} ${raw(T('เปลี่ยนโลโก้', 'Logo'))}</button>
      </div>
      <div class="field">
        <label class="label">${raw(T('ชื่อแบรนด์', 'Brand name'))}</label>
        <input class="input" id="ppBrandNameEdit" value="${activeBrand.name}" />
      </div>
      <div class="field">
        <label class="label">${raw(T('ประเภทธุรกิจ', 'Business type'))}</label>
        <select class="select" id="ppBizType">${raw(businessOptions(activeBrand.bizType))}</select>
      </div>
      <div class="field">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <label class="label">${raw(T('คำอธิบายแบรนด์', 'Brand description'))}</label>
          <button class="btn ghost sm" data-aiwrite="1" style="color:var(--blue);height:26px;padding:0 8px">${raw(I('sparkles', 12, '#2563EB'))} ${raw(T('ให้ AI ช่วยเขียน', 'AI write for me'))}</button>
        </div>
        <textarea class="textarea" rows="4" id="ppBrandDesc" placeholder="${T('เช่น ร้าน HappyPrice ขายสกินแคร์ออร์แกนิคจากดอกกุหลาบเขาใหญ่ เน้นผิวบอบบางแพ้ง่าย กลุ่มลูกค้าหญิงวัย 25-40 ปี', 'e.g. HappyPrice sells organic skincare from Khao Yai roses — sensitive skin, women aged 25-40.')}">${state.brandDesc || activeBrand.desc || ''}</textarea>
        <div class="hint" style="display:flex;justify-content:space-between">
          <span>${T('AI ใช้ข้อความนี้ทุกครั้งที่สร้างคอนเทนต์', 'AI reads this on every generation')}</span>
        </div>
        ${aiOpen ? raw(`<div style="margin-top:12px;padding:14px;border-radius:14px;background:var(--blue-soft);border:1px solid #DBE5FF">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            ${I('sparkles', 14, '#2563EB')}
            <span style="font-size:12px;font-weight:700;color:#1E40AF">${state.aiDescLoading ? T('AI กำลังเขียน…', 'AI is writing…') : T('AI เขียนให้จากชื่อแบรนด์ + ประเภทธุรกิจ', 'AI drafts from your brand name + business type')}</span>
            <button class="btn ghost sm" data-aiwrite="1" style="margin-left:auto;height:24px;padding:0 6px;color:var(--blue)">${I('refresh', 11)} ${T('เขียนใหม่', 'Regenerate')}</button>
          </div>
          ${state.aiDescLoading
            ? `<div style="padding:16px;text-align:center;font-size:12px;color:#1E40AF">${T('AI กำลังเขียนคำอธิบายแบรนด์ให้…', 'AI is writing your brand descriptions…')}</div>`
            : (state.aiDescs && state.aiDescs.length
              ? state.aiDescs.map((d, i) => `<button data-usedesc="${i}" style="width:100%;text-align:left;padding:10px;border-radius:10px;background:#fff;border:1px solid #DBE5FF;font-size:12px;line-height:1.5;color:var(--ink);margin-bottom:8px;cursor:pointer">
                  <div style="margin-bottom:4px"><span class="pill blue" style="padding:1px 7px;font-size:10px">${T('แบบที่ ', 'Draft ')}${i + 1}</span></div>${escText(d)}
                </button>`).join('')
              : aiSuggestions.map((s, i) => `<button data-usedesc-s="${i}" style="width:100%;text-align:left;padding:10px;border-radius:10px;background:#fff;border:1px solid #DBE5FF;font-size:12px;line-height:1.5;color:var(--ink);margin-bottom:8px;cursor:pointer">
                  <div style="margin-bottom:4px"><span class="pill blue" style="padding:1px 7px;font-size:10px">${T(s.tag_th, s.tag_en)}</span></div>${T(s.text_th, s.text_en)}
                </button>`).join('')) }
        </div>`) : ''}
      </div>
      ${BRANDS.length > 1 ? raw(`<hr class="divider" style="margin-top:18px">
      <button class="btn ghost sm" data-delbrand="1" style="color:var(--red)">
        ${I('x', 13, '#DC2626')} ${T('ลบแบรนด์นี้', 'Delete this brand')}
      </button>`) : ''}
    </div>

    <!-- === Brand voice === -->
    <div class="card">
      <div class="cardHeader">
        <div>
          <h3 class="cardTitle">${raw(T('Brand Voice', 'Brand voice'))}</h3>
          <p class="cardSub">${raw(T('11 โทนพร้อมตัวอย่าง · ผสมได้สูงสุด 3 โทน · เลือกแล้ว ' + state.voice.length + '/3', '11 tones with samples · combine up to 3 · ' + state.voice.length + '/3 picked'))}</p>
        </div>
        <span class="pill blue">${raw(T('เลือกได้หลายโทน', 'Mix multiple'))}</span>
      </div>
      <div class="grid g2" style="gap:8px;max-height:440px;overflow-y:auto;padding-right:6px">
        ${raw(VOICES.map((v) => `<button class="toneTile ${state.voice.includes(v.id) ? 'active' : ''}" data-voice="${v.id}">
          <div class="toneEmoji">${v.emoji}</div>
          <div class="tInfo">
            <div class="tName">${T(v.th, v.en)} <span style="font-size:10px;color:var(--muted);font-weight:500">${T(v.alt_th, v.alt_en)}</span></div>
            <div class="tSamp">"${T(v.sample_th, v.sample_en)}"</div>
          </div>
          ${state.voice.includes(v.id) ? '<span style="position:absolute;top:8px;right:8px;width:18px;height:18px;border-radius:99px;background:var(--orange);color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900">✓</span>' : ''}
        </button>`).join(''))}
      </div>
      <hr class="divider" style="margin-top:14px"/>
      <label class="label">${raw(T('คำอธิบายเสียงเพิ่มเติม (ไม่จำเป็น)', 'Free-form voice notes (optional)'))}</label>
      <textarea class="textarea" rows="2" id="ppVoiceNotes" placeholder="${T('เช่น ใช้คำว่า "คุณลูกค้า" แทน "คุณ" · ลงท้ายด้วย "ค่ะ" เกือบทุกครั้ง · ห้ามใช้ "การันตี 100%" · ใส่ emoji 🌸 ตอนพูดถึงสินค้า', 'e.g. use "dear customer" · end politely · never say "100% guaranteed" · add 🌸 when mentioning products')}">${activeBrand.voiceNotes || ''}</textarea>
    </div>
  </div>

  <!-- === Brand Archetype === -->
  <div class="card" style="margin-top:18px">
    <div class="cardHeader">
      <div>
        <div style="display:flex;align-items:center;gap:10px">
          <h3 class="cardTitle">${raw(T('Brand Archetype', 'Brand Archetype'))}</h3>
          <span class="pill orange">${raw(T('เลือกได้ 1 แบบ', 'Pick 1'))}</span>
        </div>
        <p class="cardSub">${raw(T('บุคลิกหลักของแบรนด์ตามทฤษฎี Jungian — AI จะใช้กำหนดมุมมองและภาษาในทุกคอนเทนต์', "Your brand's Jungian archetype — AI uses this to shape voice in every post"))}</p>
      </div>
      <button class="btn ghost sm" style="color:var(--blue)" data-archeguide="1">${raw(I('info', 13, '#2563EB'))} ${raw(T('อ่านคู่มือ', 'Read guide'))}</button>
    </div>
    <div class="grid g4" style="gap:10px">
      ${raw(ARCHETYPES.map((a) => `<button class="brandTile ${a.id === state.archetype ? 'active' : ''}" data-archetype="${a.id}" style="min-height:88px;padding:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:32px;height:32px;border-radius:9px;background:${a.id === state.archetype ? '#fff' : 'var(--cream2)'};display:grid;place-items:center;font-size:17px">${a.icon}</div>
          <b style="flex:1;font-size:13px;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${T(a.th, a.en)}</b>
          ${a.id === state.archetype ? '<span style="width:18px;height:18px;border-radius:99px;background:var(--orange);color:#fff;display:grid;place-items:center;font-size:11px;font-weight:900;flex-shrink:0">✓</span>' : ''}
        </div>
        <div style="font-size:11px;color:var(--muted)">${t({ th: a.sub_th, en: a.sub_en })}</div>
      </button>`).join(''))}
    </div>
  </div>

  <!-- === AI Instruction (Advanced) === -->
  <div class="card" style="margin-top:18px">
    <details ${activeBrand.aiInstruction ? 'open' : ''}>
      <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:12px;padding:4px 0">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:10px">
            <h3 class="cardTitle">${raw(T('AI Instruction (Advanced)', 'AI Instruction (Advanced)'))}</h3>
            <span class="pill purple">${raw(T('Power user', 'Power user'))}</span>
            ${activeBrand.aiInstruction
              ? raw(`<span class="pill green" style="font-size:10px">${T('ตั้งแล้ว', 'Set')} · ${activeBrand.aiInstruction.length} ${T('ตัวอักษร', 'chars')}</span>`)
              : raw(`<span class="pill orange" style="font-size:10px">${T('⭐ ควรตั้งค่า', '⭐ Recommended')}</span>`)}
          </div>
          <p class="cardSub">${raw(T(
            'คุมพฤติกรรม AI ลึกกว่า Brand Voice — เลือกจากปุ่มทีละหัวข้อ (บทบาท / โทน / เป้าหมาย / กฎ / ฯลฯ) ไม่ต้องพิมพ์เอง · <b style="color:var(--orange3)">ควรตั้งส่วนนี้ก่อนสร้างคอนเทนต์</b> เพื่อให้ AI เขียนตรงแบรนด์ที่สุด',
            'Finer control than Brand Voice — pick options per section (identity / tone / goals / rules / …), no typing required · <b style="color:var(--orange3)">Set this before generating</b> so AI matches your brand best'
          ))}</p>
        </div>
        <span class="micro" style="color:var(--muted)">▼</span>
      </summary>

      <div style="margin-top:14px">
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center">
          ${raw(I('sparkles', 13, '#2563EB'))}
          <select class="select" id="ppAiInsTemplate" style="height:32px;font-size:12.5px;width:auto;max-width:260px;padding:0 10px">
            <option value="">${T('ชุดสำเร็จรูป (เลือกให้ทั้งชุด)…', 'Quick preset…')}</option>
            <option value="content-creative">${T('สาย Content Creative', 'Content Creative')}</option>
            <option value="sales-focused">${T('สายขาย (Direct Response)', 'Sales / Direct Response')}</option>
            <option value="storytelling">${T('เล่าเรื่องแบรนด์ (Storytelling)', 'Brand Storytelling')}</option>
            <option value="educational">${T('ให้ความรู้ / SEO', 'Educational / SEO')}</option>
            <option value="viral-short">${T('ไวรัลสายสั้น (TikTok/Reels)', 'Short-form Viral')}</option>
            <option value="luxury-premium">${T('แบรนด์พรีเมียม (Luxury)', 'Luxury / Premium')}</option>
            <option value="community">${T('สร้างคอมมูนิตี้ (Engagement)', 'Community & Engagement')}</option>
            <option value="mystic">${T('สายมู (ดูดวง/เครื่องราง)', 'Mystic / Fortune')}</option>
            <option value="finance">${T('การเงิน (ลงทุน/ประกัน)', 'Finance / Investment')}</option>
            <option value="infographic-premium">${T('อินโฟกราฟิกพรีเมียม (เกาหลี/สัตว์เลี้ยง)', 'Premium Korean infographic')}</option>
          </select>
          <button class="btn ghost sm" style="color:var(--red)" data-aiins-clear="1">${raw(I('x', 12, '#DC2626'))} ${T('ล้างทั้งหมด', 'Clear all')}</button>
        </div>
        <div class="micro" style="color:var(--muted);margin-bottom:12px">${raw(I('check', 11, '#16A34A'))} ${T('เลือกจากปุ่มได้เลย ไม่ต้องพิมพ์ — ระบบรวมเป็น instruction ให้อัตโนมัติ', 'Just tap the buttons — no typing. We compile the instruction for you.')}</div>
        ${raw(AI_INS_SECTIONS.map((sec) => {
          const sel = (activeBrand.aiInsChoices && activeBrand.aiInsChoices[sec.key]) || [];
          return `<div style="margin-bottom:12px">
            <div class="micro" style="font-weight:800;color:var(--purple);margin-bottom:5px">${T(sec.th, sec.en)}${sec.single ? ` <span style="color:var(--muted);font-weight:500">(${T('เลือก 1', 'pick 1')})</span>` : ''}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${sec.opts.map((o) => {
                const on = sel.indexOf(o) >= 0;
                return `<button class="pill ${on ? 'orange' : ''}" data-aiins-pick="${sec.key}" data-aiins-val="${escText(o)}"${sec.single ? ' data-aiins-single="1"' : ''} style="height:28px;font-size:11.5px;padding:0 10px">${on ? '✓ ' : ''}${escText(o)}</button>`;
              }).join('')}
            </div>
          </div>`;
        }).join(''))}
        <details style="margin-top:10px">
          <summary class="micro" style="cursor:pointer;color:var(--blue)">${T('ดูข้อความที่ AI จะได้รับ', 'Preview what the AI receives')}</summary>
          <pre style="white-space:pre-wrap;font-family:var(--mono);font-size:11.5px;line-height:1.6;background:var(--cream2);border:1px solid var(--line);border-radius:10px;padding:12px;margin-top:8px;color:var(--ink)">${activeBrand.aiInstruction || T('(ยังไม่ได้เลือกหัวข้อใด)', '(nothing selected yet)')}</pre>
        </details>
        <div class="micro" style="margin-top:6px;color:var(--muted);line-height:1.55">
          💡 ${raw(T(
            'ระบบส่ง brand profile + voice + archetype + ตัวเลือกเหล่านี้ ให้ AI · "ข้อมูลธุรกิจ" ดึงจากโปรไฟล์แบรนด์อัตโนมัติ',
            'Brand profile + voice + archetype + these picks are sent to the AI · business info is pulled from your brand profile automatically'
          ))}
        </div>
      </div>
    </details>
  </div>

  <!-- === Posting channels (per brand) === -->
  <div class="card" style="margin-top:18px">
    <div class="cardHeader">
      <div>
        <h3 class="cardTitle">${raw(T('เชื่อมต่อช่องทางโพสต์', 'Connect posting channels'))}</h3>
        <p class="cardSub">${raw(T('แต่ละแบรนด์เชื่อมเพจ Facebook / IG ของตัวเอง', 'Each brand connects its own Facebook / IG pages'))} · <b style="color:var(--purple)">${escText(activeBrand.name)}</b></p>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${raw([
        { key: 'facebook',  name: 'Facebook Page',      color: '#1877F2' },
        { key: 'instagram', name: 'Instagram Business', color: '#E1306C' },
        { key: 'tiktok',    name: 'TikTok',             color: '#0F172A' },
      ].map((c) => {
        const info = (activeBrand.channelInfo || {})[c.key] || {};
        // "Connected" means a REAL OAuth credential exists in channelInfo —
        // not just that the channel is listed in the brand's `ch` array.
        // Seed/demo brands ship with ch:['facebook','instagram','tiktok']
        // but no tokens, which used to show a misleading "เชื่อมแล้ว".
        // Each provider stores a different identifying token after OAuth:
        //   facebook  → page_token (from /me/accounts)
        //   instagram → ig_business_id (linked IG business account)
        //   tiktok    → open_id (from TikTok OAuth)
        const connected = c.key === 'facebook'  ? !!info.page_token
                        : c.key === 'instagram' ? !!info.ig_business_id
                        : c.key === 'tiktok'    ? !!info.open_id
                        : false;
        return `<div style="display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:14px;padding:12px 14px">
          <div style="width:40px;height:40px;border-radius:10px;background:${c.color}1a;display:grid;place-items:center;flex-shrink:0">${I(c.key, 20, c.color)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${connected && info.handle ? escText(info.handle) : c.name}</div>
            ${connected
              ? `<div style="font-size:11.5px;color:var(--green);font-weight:700">${I('check', 11, '#16A34A')} ${c.name} · ${T('เชื่อมแล้ว', 'Connected')}</div>`
              : `<div style="font-size:11.5px;color:var(--muted)">${T('ยังไม่ได้เชื่อมกับแบรนด์นี้', 'Not connected for this brand')}</div>`}
          </div>
          ${connected
            ? `<button class="btn ghost sm" data-chdisconnect="${c.key}" style="color:var(--red)">${I('x', 12, '#DC2626')} ${T('ยกเลิก', 'Disconnect')}</button>`
            : `<button class="btn primary sm" data-chconnect="${c.key}">${I('link', 13)} ${T('เชื่อมต่อ', 'Connect')}</button>`}
        </div>`;
      }).join(''))}
    </div>
  </div>

  <!-- === Shopee scraper === -->
  <div class="card" style="margin-top:18px">
    <div class="cardHeader">
      <div>
        <div style="display:flex;align-items:center;gap:10px">
          <h3 class="cardTitle">${raw(T('สินค้าจากร้านของคุณ', 'Products from your store'))}</h3>
        </div>
        <p class="cardSub">${raw(T('วาง URL ร้าน Shopee/Lazada/TikTok Shop — AI จะดึงรูป ราคา ชื่อสินค้ามาใช้สร้างคอนเทนต์', 'Paste your Shopee/Lazada URL — AI pulls images, prices, names into every post'))}</p>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:12px">
      <div style="position:relative;flex:1">
        <div style="position:absolute;left:12px;top:0;bottom:0;display:flex;align-items:center;gap:6px;font-size:12px;pointer-events:none">
          ${raw(I('store', 14, '#6B6473'))}
          <span style="padding:2px 7px;border-radius:5px;background:#FFEDD5;color:#9A3412;font-size:10.5px;font-weight:800">Shopee</span>
        </div>
        <input class="input" id="ppShopUrl" value="${state.shopUrl || 'https://shopee.co.th/happyprice.sh#product_list'}" style="padding-left:120px;padding-right:96px;font-family:var(--mono);font-size:12px;border-color:var(--green)" />
        <div style="position:absolute;right:12px;top:11px;display:flex;align-items:center;gap:4px;color:var(--green);font-size:11px;font-weight:700">${raw(I('check', 12, '#16A34A'))} ${raw(T('ถูกต้อง', 'Valid'))}</div>
      </div>
      <button class="btn ${state.shopScraping ? 'outline' : 'primary'}" data-shopeesync="1" ${state.shopScraping ? 'disabled' : ''}>${raw(I('refresh', 14))} ${state.shopScraping ? T('กำลังดึง…', 'Syncing…') : T('ดึงข้อมูลใหม่', 'Re-sync')}</button>
      <button class="btn outline iconOnly">${raw(I('external', 14))}</button>
    </div>
    ${raw((function () {
      // Hint where the scrape will actually run + toggle to force-use the local Python agent.
      const alive = state.localAgentAlive;
      const useLocal = state.useLocalScraper;
      const onVercel = (typeof location !== 'undefined') && (location.hostname.indexOf('vercel.app') >= 0 || location.protocol === 'https:');
      // Only render the toggle on production (Vercel) since local dev already runs locally
      if (!onVercel) return '';
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:' + (useLocal ? '#ECFDF5' : '#F8FAFC') + ';border:1px solid ' + (useLocal ? '#10B981' : 'var(--line))') + ';margin-bottom:16px;font-size:12.5px">'
        + I(useLocal ? 'check' : 'package', 14, useLocal ? '#059669' : '#6B6473')
        + '<div style="flex:1">'
        +   '<b style="color:' + (useLocal ? '#065F46' : 'var(--purple)') + '">' + T('ใช้เครื่องของคุณ scrape', 'Use your machine to scrape') + '</b>'
        +   ' <span class="micro" style="margin-left:6px">' + (alive === true ? T('🟢 localhost:3000 พร้อม', '🟢 localhost:3000 ready') : alive === false ? T('🔴 localhost:3000 ปิดอยู่ — เปิด `npm run dev` ก่อน', '🔴 localhost:3000 down — run npm run dev') : T('🟡 กำลังตรวจ localhost…', '🟡 checking localhost…')) + '</span>'
        +   '<div class="micro" style="line-height:1.45;margin-top:2px">' + T('เปิดได้เมื่อรัน PostPost ที่เครื่อง (npm run dev) — เร็ว 14 วินาที, ผ่าน session Chrome ที่ login Shopee ไว้แล้ว', 'Only available when you run PostPost locally (npm run dev) — fast 14s scrape via your already-logged-in Chrome profile') + '</div>'
        + '</div>'
        + '<div class="toggle ' + (useLocal ? 'on' : '') + '" data-locallocaltoggle="1" ' + (alive !== true ? 'style="opacity:.4;pointer-events:none"' : '') + '></div>'
        + '</div>';
    })())}
    <div style="background:var(--blue-soft);border:1px solid #DBE5FF;border-radius:14px;padding:14px 16px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        ${raw(I('info', 14, '#2563EB'))}
        <span style="font-size:12.5px;font-weight:800;color:#1E40AF">${raw(T('วิธีหาลิงก์ร้าน Shopee ของคุณ', 'How to get your Shopee shop link'))}</span>
        <button data-shopguide="1" class="btn sm" style="margin-left:auto;height:26px;background:#2563EB;color:#fff;font-size:11px">${raw(I('eye', 12, '#fff'))} ${raw(T('ดูวิธีแบบละเอียด + รูป', 'Full guide + images'))}</button>
      </div>
      ${raw([
        [T('เปิดหน้าร้านของคุณบน Shopee (เว็บหรือแอป)', 'Open your shop page on Shopee (web or app)'), ''],
        [T('กดที่คำว่า "Products" (ตัวเลขจำนวนสินค้า) บนหน้าโปรไฟล์ร้าน', 'Tap "Products" — the product count — on the shop profile'), ''],
        [T('URL บนแถบที่อยู่จะเปลี่ยนเป็นรูปแบบนี้', 'The address-bar URL changes to this format:'), 'https://shopee.co.th/&lt;' + T('ชื่อร้าน', 'shop-name') + '&gt;#product_list'],
        [T('คัดลอก URL นั้นมาวางในช่องด้านบน แล้วกด "ดึงข้อมูลใหม่"', 'Copy that URL into the box above, then hit "Re-sync"'), ''],
      ].map((s, i) => `<div style="display:flex;gap:10px;margin-bottom:7px">
        <span style="flex-shrink:0;width:20px;height:20px;border-radius:99px;background:#2563EB;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center">${i + 1}</span>
        <div style="font-size:12px;color:#1E3A8A;line-height:1.55">${s[0]}${s[1] ? `<div class="mono" style="margin-top:4px;font-size:11px;color:#1E40AF;background:#fff;border:1px solid #DBE5FF;border-radius:6px;padding:3px 8px;display:inline-block">${s[1]}</div>` : ''}</div>
      </div>`).join(''))}
      <div style="font-size:11px;color:#1E40AF;margin-top:8px;padding-top:8px;border-top:1px dashed #DBE5FF">
        ${raw(T('ตัวอย่างลิงก์ที่ถูกต้อง', 'Example of a valid link'))}: <span class="mono" style="color:var(--purple)">https://shopee.co.th/ajarnnuengkuruthep#product_list</span>
      </div>
    </div>
    <div class="card flat" style="padding:0;background:var(--cream2);margin-bottom:16px;display:flex">
      ${raw((function () {
        const st = state.shopStats, ps = PRODUCTS;
        const sel = (state.selectedProducts || []).length;
        let total, avgP, avgR;
        if (st) {
          total = st.count; avgP = st.avgPrice; avgR = st.rating || '—';
        } else {
          total = ps.length;
          const priced = ps.filter((p) => p.price > 0);
          avgP = priced.length ? Math.round(priced.reduce((s, p) => s + p.price, 0) / priced.length).toLocaleString() : '0';
          const rated = ps.filter((p) => p.rating > 0);
          avgR = rated.length ? (rated.reduce((s, p) => s + (p.rating || 0), 0) / rated.length).toFixed(1) : '—';
        }
        return [[String(total), T('สินค้าทั้งหมด', 'Products')],
                [String(sel),   T('เลือกใช้กับ AI', 'Picked for AI')],
                ['฿' + avgP,    T('ราคาเฉลี่ย', 'Avg price')],
                [String(avgR),  T('เรทติ้งเฉลี่ย', 'Avg rating')]];
      })().map((s, i) => `<div style="flex:1;padding:14px 18px;${i > 0 ? 'border-left:1px solid var(--line)' : ''}"><div style="font-size:20px;font-weight:800;color:var(--purple);letter-spacing:-.02em">${s[0]}</div><div style="font-size:11.5px;color:var(--muted);font-weight:600">${s[1]}</div></div>`).join(''))}
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 class="cardTitle">${raw(T('เลือกสินค้าที่ให้ AI ใช้สร้างคอนเทนต์', 'Pick products AI may feature'))}</h3>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="micro"><b style="color:var(--purple)">${viewProducts.filter((p) => (state.selectedProducts || []).indexOf(p.id) >= 0).length}</b> / ${viewProducts.length} ${T('เลือกแล้ว', 'selected')}</span>
        <button class="btn ${filterOn ? 'primary' : 'ghost'} sm" data-filter="1">${raw(I('filter', 12, filterOn ? '#fff' : '#6B6473'))} ${raw(T('กรอง', 'Filter'))}</button>
        <button class="btn outline sm" data-toggle="manualOpen">${raw(I(manualOpen ? 'x' : 'plus', 13))} ${raw(T('เพิ่มสินค้าเอง', 'Add manually'))}</button>
      </div>
    </div>

    ${manualOpen ? raw(`<div class="card flat" style="padding:18px;margin-bottom:14px;background:linear-gradient(180deg,#FFFBEB,#FFF7ED);border:1.5px solid #FED7AA">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 class="cardTitle">${I('edit', 16, '#FF7A1A')} ${T('เพิ่มสินค้าเอง', 'Add product manually')}</h3>
        <button class="btn ghost iconOnly sm" data-toggle="manualOpen">${I('x', 14)}</button>
      </div>
      <div style="display:grid;grid-template-columns:160px 1fr;gap:18px">
        <div>
          <label class="label">${T('รูปสินค้า', 'Photo')}</label>
          <div id="ppNewImgBox" data-newimg="1" style="aspect-ratio:1;border-radius:12px;border:1.5px dashed var(--line3);background:rgba(255,255,255,.6);display:grid;place-items:center;color:var(--muted);text-align:center;padding:10px;cursor:pointer;overflow:hidden">
            ${state.newProductImg
              ? `<img src="${state.newProductImg}" alt="" style="width:100%;height:100%;object-fit:cover"/>`
              : `${I('upload', 24)}
                 <div style="font-size:11px;font-weight:600;margin-top:4px">${T('คลิกเพื่ออัปโหลดรูป', 'Click to upload')}</div>
                 <div style="font-size:10px;color:var(--muted)">JPG · PNG · 5MB</div>`}
          </div>
          <input type="file" accept="image/*" id="ppNewImgInput" style="display:none"/>
          ${state.newProductImg ? `<button class="btn ghost sm" data-newimgclear="1" style="margin-top:6px;color:var(--red);font-size:11px;height:24px;width:100%">${I('x', 11, '#DC2626')} ${T('ลบรูป', 'Remove photo')}</button>` : ''}
        </div>
        <div>
          <div class="field"><label class="label">${T('ชื่อสินค้า', 'Product name')} <span style="color:var(--red)">*</span></label><input class="input" id="ppNewName" placeholder="${T('เช่น Rose Repair Serum 30ml', 'e.g. Rose Repair Serum 30ml')}"/></div>
          <div class="grid g3" style="gap:10px">
            <div><label class="label">${T('ราคา', 'Price')} *</label><input class="input" id="ppNewPrice" type="number" min="0" placeholder="690"/></div>
            <div><label class="label">${T('ราคาก่อนลด', 'Original')}</label><input class="input" id="ppNewBefore" type="number" min="0" placeholder="990"/></div>
            <div><label class="label">${T('หมวด', 'Category')}</label><select class="select" id="ppNewCat">${PRODUCT_CATEGORIES.map((c) => `<option>${T(c.th, c.en)}</option>`).join('')}</select></div>
          </div>
          <div class="field" style="margin-top:10px">
            <label class="label">${T('คำอธิบาย / จุดเด่น', 'Description')}</label>
            <textarea class="textarea" rows="2" id="ppNewDesc" placeholder="${T('เซรั่มสกัดเย็น เห็นผลใน 7 วัน', 'Cold-pressed serum · 7-day results')}"></textarea>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)">
        <span class="micro">${T('ช่อง * จำเป็น', '* required')}</span>
        <div style="display:flex;gap:8px">
          <button class="btn outline sm" data-toggle="manualOpen">${T('ยกเลิก', 'Cancel')}</button>
          <button class="btn outline sm" data-saveproduct="again">${I('plus', 13)} ${T('บันทึก + เพิ่มอีก', 'Save + add another')}</button>
          <button class="btn primary sm" data-saveproduct="close">${I('check', 13)} ${T('บันทึก', 'Save')}</button>
        </div>
      </div>
    </div>`) : ''}

    <div class="grid" style="grid-template-columns:repeat(5,1fr);gap:10px">
      ${raw((state.productsExpanded ? viewProducts : viewProducts.slice(0, 5)).map((p) => `<div class="productCard ${(state.selectedProducts || []).indexOf(p.id) >= 0 ? 'active' : ''}" data-product="${p.id}">
        <span class="checkBadge">✓</span>
        ${productImgHTML(p, { badge: true })}
        <div class="pName">${t({ th: p.name_th, en: p.name_en })}</div>
        <div class="split"><span class="pPrice">฿${p.price}</span><span style="font-size:10px;color:var(--muted)">${T('ขายแล้ว', 'Sold')} ${p.sales}</span></div>
        <button class="ppProdView" data-prodview="${p.id}">${I('eye', 12)} ${T('ดูรายละเอียด', 'View details')}</button>
      </div>`).join(''))}
    </div>
    ${viewProducts.length > 5 ? raw(`<div style="display:flex;justify-content:center;margin-top:18px">
      <button class="btn ghost sm" data-toggle="productsExpanded">${state.productsExpanded
        ? `${T('ย่อรายการสินค้า', 'Show less')} ${I('chev_up', 14)}`
        : `${T('ดูสินค้าอีก ' + (viewProducts.length - 5) + ' รายการ', 'Show ' + (viewProducts.length - 5) + ' more')} ${I('chev_down', 14)}`}</button>
    </div>`) : ''}
  </div>`;
}
