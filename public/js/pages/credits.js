// public/js/pages/credits.js
//
// "ราคา AI / Credits" — reference page (Hedra-style) listing every AI model
// PostPost can call + its credit cost. Tabs: Text / Image / Video / Avatar /
// Utility. Pure data display — no API calls, no state mutation. Helps users
// understand what each action costs BEFORE they click Generate.
//
// Pricing source of truth = same numbers fed to the credit deduction
// middleware (when implemented). Keep this file in sync with the
// per-action credit math in the "credit-system" design doc.
//
// Tab state stored in state.creditsTab — defaults to 'image' (most common).

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T, t } from '../i18n.js';
import { I } from '../icons.js';
import { head } from '../components/head.js';

// ──────────────────────────────────────────────────────────────────────────
// Pricing catalog — MUST stay in sync with backend/services/credit-pricer.js
// when that file lands. For now this is the source of truth users see.
// ──────────────────────────────────────────────────────────────────────────
const CATALOG = {
  text: {
    unit_th: 'ต่อ caption + hooks + hashtags 1 ชุด (≈ 1.5K input + 3K output tokens)',
    unit_en: 'per caption + hooks + hashtags batch (~1.5K input + 3K output tokens)',
    note_th: 'คิดจากราคา OpenRouter จริง × markup 1.4 (margin ~30-90%) · ยิ่งโมเดลแพง credits ยิ่งสูง',
    note_en: 'Based on real OpenRouter cost × 1.4 markup (30-90% margin) · pricier models = more credits',
    items: [
      // Cheap tier — sub-cent cost, all round up to 1-2 credits
      { id: 'deepseek/deepseek-v3',         label: 'DeepSeek V3',          tier: 'cheap',     cost: 1 },
      { id: 'qwen/qwen-2.5-72b-instruct',   label: 'Qwen 2.5 72B',         tier: 'cheap',     cost: 1 },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B',   tier: 'cheap',     cost: 1 },
      { id: 'openai/gpt-5-mini',            label: 'GPT-5 Mini',           tier: 'cheap',     cost: 1 },
      { id: 'google/gemini-2.5-flash',      label: 'Gemini 2.5 Flash',     tier: 'cheap',     cost: 2 },
      { id: 'anthropic/claude-haiku-4.5',   label: 'Claude Haiku 4.5',     tier: 'cheap',     cost: 2, default: true },
      // Balanced — solid quality without breaking the bank
      { id: 'mistralai/mistral-large-2',    label: 'Mistral Large 2',      tier: 'balanced',  cost: 3 },
      { id: 'google/gemini-2.5-pro',        label: 'Gemini 2.5 Pro',       tier: 'balanced',  cost: 4 },
      // Premium — best Thai quality, costly OpenRouter rates
      { id: 'anthropic/claude-sonnet-4.6',  label: 'Claude Sonnet 4.6',    tier: 'premium',   cost: 7 },
      { id: 'openai/gpt-5',                 label: 'GPT-5',                tier: 'premium',   cost: 7 },
      { id: 'anthropic/claude-opus-4.7',    label: 'Claude Opus 4.7',      tier: 'premium',   cost: 32 },
      // Reasoning — chain-of-thought tokens make output cost ~3× normal
      { id: 'deepseek/deepseek-r1',         label: 'DeepSeek R1',          tier: 'reasoning', cost: 3 },
    ],
  },
  image: {
    unit_th: 'ต่อรูป 1 ใบ', unit_en: 'per generation',
    note_th: 'รูปคุณภาพสูง (HD) คิดเครดิตมากกว่าเพราะต้นทุน provider แพงกว่า',
    note_en: 'HD images cost more credits because provider rates are higher',
    items: [
      // Cheap
      { id: 'google/gemini-2.5-flash-image',        label: 'Gemini Nano Banana',     tier: 'cheap',    cost: 5,  default: true },
      { id: 'google/gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image', tier: 'cheap',   cost: 5 },
      { id: 'bytedance/seedream-4',                  label: 'Seedream 4.0',           tier: 'cheap',   cost: 3 },
      { id: 'black-forest-labs/flux-schnell',        label: 'Flux Schnell',           tier: 'cheap',   cost: 1 },
      // Balanced
      { id: 'google/imagen-4',                       label: 'Imagen 4',               tier: 'balanced', cost: 6 },
      { id: 'black-forest-labs/flux-1.1-pro',        label: 'Flux 1.1 Pro',           tier: 'balanced', cost: 5 },
      { id: 'black-forest-labs/flux-kontext-pro',    label: 'Flux Kontext Pro',       tier: 'balanced', cost: 5 },
      { id: 'xai/grok-2-image',                      label: 'Grok 2 Image',           tier: 'balanced', cost: 5 },
      // Premium
      { id: 'openai/gpt-image-1',                    label: 'GPT Image 1 / DALL-E HD', tier: 'premium', cost: 10 },
      { id: 'openai/gpt-image-2',                    label: 'GPT Image 2 Medium',     tier: 'premium', cost: 15 },
      { id: 'openai/dall-e-3',                       label: 'DALL-E 3',               tier: 'premium', cost: 10 },
      { id: 'openai/gpt-5.4-image-2',                label: 'GPT-5.4 Image 2',        tier: 'premium', cost: 30 },
    ],
  },
  video: {
    unit_th: 'ต่อ 1 วินาที',  unit_en: 'per second',
    cost_suffix_th: ' / วินาที', cost_suffix_en: ' / sec',
    note_th: 'คูณตามจำนวนวินาทีจริง — เช่น Veo 3 Fast 8 วิ = 25 × 8 = 200 เครดิต',
    note_en: 'Multiply by clip length — e.g. Veo 3 Fast 8s = 25 × 8 = 200 credits',
    items: [
      // Cheap
      { id: 'fal-ai/wan/v2.2-a14b/text-to-video',    label: 'Wan 2.2 t2v',       tier: 'cheap',    cost: 5,  default: true },
      { id: 'replicate/seedance-lite',               label: 'Seedance Lite',     tier: 'cheap',    cost: 5 },
      { id: 'replicate/seedance-1-5-pro',            label: 'Seedance 1.5 Pro',  tier: 'cheap',    cost: 6 },
      { id: 'replicate/hunyuan-video',               label: 'Hunyuan Video',     tier: 'cheap',    cost: 9 },
      // Balanced
      { id: 'fal-ai/kling-video/v2.5-turbo',         label: 'Kling 2.5 Turbo',   tier: 'balanced', cost: 13 },
      { id: 'fal-ai/kling-video/v2.6-pro',           label: 'Kling 2.6 Pro',     tier: 'balanced', cost: 25 },
      { id: 'replicate/seedance-2-0',                label: 'Seedance 2.0',      tier: 'balanced', cost: 6 },
      // Premium
      { id: 'fal-ai/veo3-fast',                      label: 'Veo 3.1 Fast',      tier: 'premium',  cost: 25 },
      { id: 'fal-ai/veo3',                           label: 'Veo 3 (full)',      tier: 'premium',  cost: 63 },
      { id: 'fal-ai/kling-video/v2.6-master',        label: 'Kling 2.6 Master',  tier: 'premium',  cost: 50 },
    ],
  },
  avatar: {
    unit_th: 'ต่อ 1 วินาที (รวม TTS + lipsync + compositing)',
    unit_en: 'per second (TTS + lipsync + compositing included)',
    cost_suffix_th: ' / วินาที', cost_suffix_en: ' / sec',
    note_th: 'คูณตามจำนวนวินาทีจริง — เช่น OmniHuman v1.5 30 วิ = 1.3 × 30 ≈ 40 เครดิต · โหมด "ทันใจ ฟรี" (browser) = ฟรี ไม่จำกัด',
    note_en: 'Multiply by clip length — e.g. OmniHuman v1.5 30s = 1.3 × 30 ≈ 40 credits · "Instant" (browser) mode = unlimited free',
    items: [
      { id: 'free-audio-reactive',              label: 'Audio-reactive (browser)',   tier: 'cheap',    cost: 0,   default: true },
      { id: 'hf-joyhallo',                       label: 'HF Spaces — JoyHallo (Thai)', tier: 'cheap',   cost: 0.2 },
      { id: 'hf-musetalk',                       label: 'HF Spaces — MuseTalk',        tier: 'cheap',   cost: 0.2 },
      { id: 'hf-latentsync',                     label: 'HF Spaces — LatentSync 1.5',  tier: 'cheap',   cost: 0.2 },
      { id: 'fal-ai/sadtalker',                  label: 'fal.ai SadTalker',            tier: 'balanced', cost: 0.3 },
      { id: 'fal-ai/infinitalk',                 label: 'fal.ai Infinitalk',           tier: 'balanced', cost: 0.6 },
      { id: 'veed/fabric-1.0',                   label: 'VEED Fabric 1.0',             tier: 'balanced', cost: 0.8 },
      { id: 'fal-ai/bytedance/omnihuman',        label: 'fal.ai OmniHuman',            tier: 'premium',  cost: 1.3 },
      { id: 'fal-ai/bytedance/omnihuman/v1.5',   label: 'fal.ai OmniHuman v1.5',       tier: 'premium',  cost: 1.3 },
    ],
  },
  utility: {
    unit_th: 'ต่อ 1 ครั้ง', unit_en: 'per action',
    note_th: 'Caption / Topic Bank คิดตามโมเดล Text ที่เลือก (ดูแท็บ Text) · TTS / BG remove / utilities ราคาคงที่',
    note_en: 'Caption / Topic Bank cost depends on Text model picked (see Text tab) · TTS / BG remove / utilities are flat-priced',
    items: [
      { id: 'shopee-scrape',          label: 'Shopee shop scrape',           tier: 'cheap', cost: 0, default: true },
      { id: 'schedule-publish',       label: 'Schedule + Auto-publish',      tier: 'cheap', cost: 0 },
      { id: 'pexels-bg-search',       label: 'Pexels background search',     tier: 'cheap', cost: 0 },
      { id: 'tts-azure-preview',      label: 'TTS preview (Azure ≤10s)',     tier: 'cheap', cost: 0 },
      { id: 'image-upscale-2x',       label: 'Image upscale (1024 → 2048)',  tier: 'cheap', cost: 1 },
      { id: 'bg-remove',              label: 'Background remove (avatar photo)', tier: 'cheap', cost: 2 },
      { id: 'tts-azure-100char',      label: 'TTS Azure (per 100 chars)',    tier: 'balanced', cost: 2 },
      { id: 'avatar-portrait-gen',    label: 'AI gen avatar portrait',       tier: 'balanced', cost: 10 },
      { id: 'video-upscale-topaz',    label: 'Video upscale (Topaz)',        tier: 'premium', cost: 15 },
      { id: 'tts-elevenlabs-100char', label: 'TTS ElevenLabs premium (per 100 chars)', tier: 'premium', cost: 30 },
    ],
  },
};

const TAB_LABELS = {
  text:    { th: 'Text', en: 'Text', icon: 'wand' },
  image:   { th: 'Image', en: 'Image', icon: 'image' },
  video:   { th: 'Video', en: 'Video', icon: 'video' },
  avatar:  { th: 'Avatar', en: 'Avatar', icon: 'bot' },
  utility: { th: 'Utility', en: 'Utility', icon: 'settings' },
};

const TIER_PILL = {
  cheap:     { bg: '#DCFCE7', fg: '#15803D', label_th: '⚡ ถูก/ฟรี', label_en: '⚡ Cheap/Free' },
  balanced:  { bg: '#DBEAFE', fg: '#1E40AF', label_th: '🎨 ปานกลาง', label_en: '🎨 Balanced' },
  premium:   { bg: '#FECDD3', fg: '#9F1239', label_th: '💎 พรีเมียม', label_en: '💎 Premium' },
  reasoning: { bg: '#EDE9FE', fg: '#5B21B6', label_th: '🧠 Reasoning', label_en: '🧠 Reasoning' },
};

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function pageCredits() {
  const tab = state.creditsTab || 'image';
  const cat = CATALOG[tab];
  const credits = (typeof state.creditsBalance === 'number') ? state.creditsBalance : 342;   // placeholder until DB-backed
  const planCap = state.planCredits || 500;
  const planName = state.planName || 'Pro Image';

  const actions = `
    <div style="display:flex;align-items:center;gap:10px">
      <span class="pill orange" style="height:30px;padding:0 12px;font-size:11.5px">
        🪙 ${T('เครดิตคงเหลือ', 'Credits balance')}: <b style="margin-left:4px">${credits.toLocaleString()}</b> / ${planCap.toLocaleString()}
      </span>
      <button class="btn primary sm">${I('plus', 13)} ${T('เติมเครดิต', 'Top-up')}</button>
    </div>
  `;

  // Group items by tier within the active tab for visual grouping
  const grouped = {};
  for (const item of cat.items) {
    (grouped[item.tier] = grouped[item.tier] || []).push(item);
  }
  const tierOrder = ['cheap', 'balanced', 'reasoning', 'premium'].filter((k) => grouped[k]);

  return html`${raw(head('OPERATIONS', T('ราคา AI / Credits', 'AI Pricing / Credits'),
    T('ดูราคาเครดิตของทุกโมเดล AI ที่ PostPost ใช้ · เปรียบเทียบก่อนเลือก',
      'Credit cost for every AI model PostPost supports · compare before you pick'),
    raw(actions)
  ))}

  <!-- Plan info banner -->
  <div class="card" style="margin-bottom:18px;background:linear-gradient(135deg,#FFF7ED 0%,#FFEDD5 100%);border-color:#FED7AA;display:flex;align-items:center;gap:14px;padding:14px 18px">
    <div style="font-size:34px">🪙</div>
    <div style="flex:1">
      <div style="font-size:14px;font-weight:800;color:var(--purple)">
        ${T('แพ็คเกจปัจจุบัน:', 'Current plan:')} <span style="color:var(--orange)">${planName}</span>
        · <span style="font-weight:600">${credits.toLocaleString()} / ${planCap.toLocaleString()} ${T('เครดิต', 'credits')}</span>
      </div>
      <div class="micro" style="margin-top:2px">
        ${T('1 credit ≈ ฿0.40 · เครดิตคืนทุก reset day ของแพ็คเกจ · roll-over ได้สูงสุด 1× ของ plan',
            '1 credit ≈ ฿0.40 · resets monthly on plan day · rolls over up to 1× plan amount')}
      </div>
    </div>
    <button class="btn outline sm">${T('เปลี่ยนแพ็คเกจ', 'Change plan')}</button>
  </div>

  <!-- Tab strip -->
  <div class="tabs" style="margin-bottom:14px">
    ${raw(Object.keys(CATALOG).map((k) => {
      const lbl = TAB_LABELS[k];
      const count = CATALOG[k].items.length;
      const on = k === tab;
      return `<button class="tab ${on ? 'active' : ''}" data-set="creditsTab=${k}">
        ${I(lbl.icon, 13)} ${T(lbl.th, lbl.en)}
        <span style="padding:0 6px;border-radius:99px;background:${on ? 'rgba(255,255,255,.25)' : 'var(--cream2)'};font-size:10px">${count}</span>
      </button>`;
    }).join(''))}
  </div>

  <!-- Tab description -->
  <div style="margin-bottom:14px;font-size:12.5px;color:var(--muted);line-height:1.55">
    <b style="color:var(--purple)">${T('คิดราคา:', 'Pricing unit:')}</b> ${t({ th: cat.unit_th, en: cat.unit_en })}
    ${raw(cat.note_th ? `<br><span style="color:var(--orange)">💡 ${escHtml(t({ th: cat.note_th, en: cat.note_en }))}</span>` : '')}
  </div>

  <!-- Models table (Hedra-style) -->
  <div class="card" style="padding:0;overflow:hidden">
    <table class="tbl" style="width:100%">
      <thead><tr>
        <th style="padding:14px 18px">${raw(T('โมเดล', 'Model'))}</th>
        <th>${raw(T('Model ID', 'Model ID'))}</th>
        <th>${raw(T('กลุ่ม', 'Tier'))}</th>
        <th style="text-align:right;padding-right:24px">${raw(T('เครดิต', 'Cost'))}</th>
      </tr></thead>
      <tbody>
        ${raw(tierOrder.map((tierKey) => {
          const tierPill = TIER_PILL[tierKey];
          return grouped[tierKey].map((item) => {
            const isDefault = item.default;
            return `<tr style="border-top:1px solid var(--line)">
              <td style="padding:14px 18px">
                <div style="display:flex;align-items:center;gap:8px">
                  <b style="font-size:13.5px;color:var(--purple)">${escHtml(item.label)}</b>
                  ${isDefault ? '<span class="pill orange" style="height:18px;font-size:9.5px;padding:0 7px">DEFAULT</span>' : ''}
                </div>
              </td>
              <td>
                <code style="background:var(--cream2);padding:3px 8px;border-radius:6px;font-family:var(--mono);font-size:11px;color:var(--muted)">${escHtml(item.id)}</code>
              </td>
              <td>
                <span class="pill" style="height:22px;font-size:10.5px;padding:0 8px;background:${tierPill.bg};color:${tierPill.fg}">${t({ th: tierPill.label_th, en: tierPill.label_en })}</span>
              </td>
              <td style="text-align:right;padding-right:24px;font-weight:800;color:${item.cost === 0 ? 'var(--green)' : 'var(--purple)'};font-size:14px;white-space:nowrap">
                ${item.cost === 0
                  ? T('ฟรี', 'FREE')
                  : `<b>${item.cost}</b> <span style="font-size:11px;font-weight:600;color:var(--muted)">${T('เครดิต', 'credits')}${cat.cost_suffix_th ? t({ th: cat.cost_suffix_th, en: cat.cost_suffix_en }) : ''}</span>`}
              </td>
            </tr>`;
          }).join('');
        }).join(''))}
      </tbody>
    </table>
  </div>

  <!-- Footer hints -->
  <div style="margin-top:18px;padding:14px 18px;background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;font-size:12px;color:#075985;line-height:1.65">
    <b>${T('วิธีคิดเครดิต:', 'How credits work:')}</b>
    <ul style="margin:6px 0 0 18px;padding:0">
      <li>${T('สร้าง 1 โพสต์ (caption Haiku 2 cr + 4 รูป Gemini 20 cr) =', 'One post (caption Haiku 2 cr + 4 Gemini images 20 cr) =')}
        <b>${T('22 เครดิต', '22 credits')}</b></li>
      <li>${T('สร้างด้วย Opus 4.7 + รูป GPT Image 1 (HD) =', 'With Opus 4.7 + GPT Image 1 HD =')}
        <b>${T('32 + 4×10 = 72 เครดิต', '32 + 4×10 = 72 credits')}</b></li>
      <li>${T('Avatar OmniHuman v1.5 = 1.3 cr/วินาที · คลิป 30 วิ ≈', 'Avatar OmniHuman v1.5 = 1.3 cr/sec · 30-sec clip ≈')}
        <b>${T('40 เครดิต', '40 credits')}</b></li>
      <li>${T('Avatar Infinitalk = 0.6 cr/วินาที · คลิป 30 วิ ≈', 'Avatar Infinitalk = 0.6 cr/sec · 30-sec clip ≈')}
        <b>${T('18 เครดิต', '18 credits')}</b></li>
      <li>${T('Text-to-Video Wan 2.2 = 5 cr/วินาที · คลิป 8 วิ =', 'Text-to-Video Wan 2.2 = 5 cr/sec · 8-sec clip =')}
        <b>${T('40 เครดิต', '40 credits')}</b></li>
      <li>${T('Veo 3 Fast = 25 cr/วินาที · คลิป 8 วิ =', 'Veo 3 Fast = 25 cr/sec · 8-sec clip =')}
        <b>${T('200 เครดิต', '200 credits')}</b></li>
      <li>${T('Caption + Topic Bank gen — คิดตามโมเดล Text ที่เลือก (Haiku 2 cr · Sonnet 7 cr · Opus 32 cr)',
              'Caption + Topic Bank gen — depends on Text model picked (Haiku 2 cr · Sonnet 7 cr · Opus 32 cr)')}</li>
      <li>${T('เครดิตจาก Top-up pack ไม่หมดอายุ — เครดิตจากแพ็คเกจ reset ทุก 30 วัน',
              'Top-up pack credits never expire · plan credits reset every 30 days')}</li>
    </ul>
  </div>
  `;
}
