// public/js/pages/onboarding.js
//
// Onboarding wizard (3 steps). Mirrors the inline pageOnboarding() —
// pixel-identical output, only mechanical changes:
//   - backtick template → html`` tagged template (auto-escaped interpolation)
//   - helpers that emit HTML (T, I, LOGO_ICON, .map().join('')) wrapped in raw()
//
// businessOptions() helper is still inline in index.html and exposed via
// window.PP — we route through that. Once Phase 3e extracts BUSINESS_TYPES
// formatting into a helper module we can switch to a direct import.

import { html, raw } from '../html.js';
import { state } from '../state.js';
import { T } from '../i18n.js';
import { I, LOGO_ICON } from '../icons.js';
import { BUSINESS_TYPES } from '../data/business-types.js';

// Local copy of the inline businessOptions() helper — same behavior as
// window.PP.businessOptions but avoids the bridge round-trip.
function businessOptions(sel) {
  return BUSINESS_TYPES.map((b) => {
    const label = T(b.th, b.en);
    return `<option${label === sel ? ' selected' : ''}>${label}</option>`;
  }).join('');
}

export function pageOnboarding() {
  const step = state.onboardStep;
  const steps = [
    { id: 1, label: T('ตั้งค่า Workspace', 'Workspace') },
    { id: 2, label: T('เชื่อมต่อช่องทาง', 'Connect channels') },
    { id: 3, label: T('พร้อมเริ่มงาน', 'Ready') },
  ];
  const stepper = html`<div class="stepper">${raw(steps.map((s, i) => `
    <div class="stepDot ${step === s.id ? 'active' : step > s.id ? 'done' : ''}">
      <div class="stepCircle">${step > s.id ? '✓' : s.id}</div>
      <div class="stepLab">${s.label}</div>
    </div>
    ${i < 2 ? `<div class="stepLine ${step > s.id ? 'done' : ''}"></div>` : ''}
  `).join(''))}</div>`;

  let content = '';
  if (step === 1) {
    content = html`
    <div class="kicker">${raw(T('ขั้นที่ 1 จาก 3', 'Step 1 of 3'))}</div>
    <h1 class="title">${raw(T('สร้างบัญชีของคุณ', 'Create your account'))}</h1>
    <p class="subtitle">${raw(T('กรอกอีเมล + รหัสผ่านเพื่อสร้างบัญชีและ Workspace ใหม่', 'Enter an email + password to create your account and Workspace.'))}</p>
    <div class="card" style="margin-top:24px;padding:28px">
      <div class="grid g2">
        <div class="field">
          <label class="label">${raw(T('อีเมล', 'Email'))} <span style="color:var(--red)">*</span></label>
          <input class="input" id="ppSignupEmail" type="email" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div class="field">
          <label class="label">${raw(T('รหัสผ่าน (อย่างน้อย 8 ตัว)', 'Password (min 8 chars)'))} <span style="color:var(--red)">*</span></label>
          <input class="input" id="ppSignupPassword" type="password" placeholder="••••••••" autocomplete="new-password" />
        </div>
      </div>
      <div class="field">
        <label class="label">${raw(T('ชื่อ Workspace (ไม่บังคับ)', 'Workspace name (optional)'))}</label>
        <input class="input" id="ppSignupWorkspace" placeholder="${T('เช่น ร้านของฉัน', 'e.g. My Shop')}" />
        <div class="hint">${raw(T('เว้นว่างได้ — ระบบจะตั้งให้อัตโนมัติจากอีเมล', 'Leave blank — we name it from your email'))}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
        <div style="flex:1;height:1px;background:var(--line)"></div>
        <span class="micro">${raw(T('หรือ', 'or'))}</span>
        <div style="flex:1;height:1px;background:var(--line)"></div>
      </div>
      <button class="btn outline" style="width:100%;height:46px;margin-top:12px" data-google-signin="1">${raw(I('google', 16))} ${raw(T('สมัครด้วย Google', 'Sign up with Google'))}</button>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:24px">
      <button class="btn outline" data-go="login">${raw(I('chev_left', 14))} ${raw(T('มีบัญชีแล้ว? เข้าสู่ระบบ', 'Have an account? Sign in'))}</button>
      <button class="btn primary lg" data-set-step="2">${raw(T('สมัคร', 'Create account'))} ${raw(I('chev_right', 16))}</button>
    </div>`;
  } else if (step === 2) {
    content = html`
    <div class="kicker">${raw(T('ขั้นที่ 2 จาก 3', 'Step 2 of 3'))}</div>
    <h1 class="title">${raw(T('เชื่อมต่อช่องทางโพสต์', 'Connect your channels'))}</h1>
    <p class="subtitle">${raw(T('PostPost ใช้ OAuth ของ Meta และ TikTok ในการโพสต์ คุณควบคุมสิทธิ์ได้ตลอด', 'Connects via Meta and TikTok OAuth. You control permissions at any time.'))}</p>
    <div class="card" style="margin-top:24px;padding:14px">
      ${raw([
        { icon: 'facebook',  color: '#1877F2', name: 'Facebook Page',      desc_th: 'โพสต์ลง Facebook อัตโนมัติ',     desc_en: 'Auto-post to your Facebook page',  connected: true,  sub: 'HappyPrice · 24.3k' },
        { icon: 'instagram', color: '#E1306C', name: 'Instagram Business', desc_th: 'ต้องเชื่อม Business Account',     desc_en: 'Requires an IG Business Account',  connected: true,  sub: '@happyprice.sh · 18.1k' },
        { icon: 'tiktok',    color: '#0F172A', name: 'TikTok for Business',desc_th: 'รองรับโพสต์วิดีโอและภาพ',         desc_en: 'Supports video and image posts',   connected: false },
      ].map((ch) => `<div style="display:flex;gap:14px;align-items:center;padding:16px;border-radius:14px;${ch.connected ? 'background:var(--green-soft)' : ''}">
        <div style="width:44px;height:44px;border-radius:12px;background:${ch.color};display:grid;place-items:center;color:#fff">${I(ch.icon, 22)}</div>
        <div style="flex:1">
          <b style="font-size:14px;color:var(--purple)">${ch.name}</b>
          ${ch.connected ? `<div style="font-size:12px;color:var(--green);font-weight:700;margin-top:2px">${I('check', 12, '#16A34A')} ${T('เชื่อมแล้ว', 'Connected')} · ${ch.sub}</div>` : `<div style="font-size:12px;color:var(--muted);margin-top:2px">${T(ch.desc_th, ch.desc_en)}</div>`}
        </div>
        ${ch.connected ? `<button class="btn outline sm">${T('จัดการ', 'Manage')}</button>` : `<button class="btn primary">${I('link', 14)} ${T('เชื่อมต่อ', 'Connect')}</button>`}
      </div>`).join(''))}
    </div>
    <div class="card" style="margin-top:16px;padding:14px;background:var(--blue-soft);border-color:#DBE5FF">
      <div style="display:flex;gap:10px;align-items:flex-start">
        ${raw(I('info', 18, '#1D4ED8'))}
        <div style="flex:1;font-size:12.5px;color:#1E40AF;line-height:1.55">
          <b>${raw(T('ปลอดภัย:', 'Safe & secure:'))}</b> ${raw(T('PostPost ใช้ OAuth และ Meta tokens มาตรฐาน คุณสามารถถอนสิทธิ์เมื่อใดก็ได้', 'PostPost uses standard OAuth and Meta tokens. You can revoke access anytime.'))}
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:24px">
      <button class="btn outline" data-set-step="1">${raw(I('chev_left', 14))} ${raw(T('ย้อนกลับ', 'Back'))}</button>
      <div style="display:flex;gap:10px">
        <button class="btn ghost" data-set-step="3">${raw(T('ข้ามไปก่อน', 'Skip for now'))}</button>
        <button class="btn primary lg" data-set-step="3">${raw(T('ถัดไป', 'Continue'))} ${raw(I('chev_right', 16))}</button>
      </div>
    </div>`;
  } else {
    content = html`
    <div style="text-align:center;padding:32px 0">
      <div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,var(--green),#10b981);display:grid;place-items:center;margin:0 auto 24px;box-shadow:0 16px 40px rgba(22,163,74,.25)">${raw(I('check', 44, '#fff'))}</div>
      <div class="kicker">${raw(T('ขั้นที่ 3 จาก 3 · เสร็จเรียบร้อย', 'Step 3 of 3 · All set'))}</div>
      <h1 class="title" style="font-size:42px">${raw(T('พร้อมสร้างคอนเทนต์แล้ว 🎉', "You're ready 🎉"))}</h1>
      <p class="subtitle" style="margin:0 auto">${raw(T('AI จะใช้ Brand Voice + สินค้า + Topic Bank เพื่อสร้าง Hook, Caption, Creative และตั้งเวลาให้อัตโนมัติ', 'AI uses your Brand Voice, products, and Topic Bank to make hooks, captions, creatives, and schedules — automatically.'))}</p>
    </div>
    <div class="grid g3" style="margin-top:8px">
      ${raw([
        { icon: 'lightbulb', th: 'หา 30 หัวข้อ',          en: 'Get 30 topics',      desc_th: 'AI วางแผนหัวข้อทั้งเดือน',           desc_en: 'AI plans a month of topics',     go: 'topics' },
        { icon: 'wand',      th: 'สร้างคอนเทนต์แรก',     en: 'Make first post',    desc_th: 'Hook + Caption + รูป ใน 1 คลิก',     desc_en: 'Hook + caption + image in 1 click', go: 'caption' },
        { icon: 'package',   th: 'นำเข้าสินค้า Shopee', en: 'Import Shopee',      desc_th: 'ดึงรูป ราคา ชื่อจาก Shopee',         desc_en: 'Pulls images, prices, names',    go: 'profile' },
      ].map((s) => `<button class="card solid" style="cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:10px;padding:24px" data-go="${s.go}">
        <div class="featIcon">${I(s.icon, 22)}</div>
        <b style="font-size:16px;color:var(--purple)">${T(s.th, s.en)}</b>
        <div class="micro">${T(s.desc_th, s.desc_en)}</div>
        <div style="margin-top:auto;color:var(--orange);font-weight:700;font-size:13px;display:flex;align-items:center;gap:4px">${T('เริ่มเลย', 'Start now')} ${I('chev_right', 14, '#FF7A1A')}</div>
      </button>`).join(''))}
    </div>
    <div style="display:flex;justify-content:center;margin-top:36px">
      <button class="btn primary lg" data-go="profile">${raw(T('ไปที่ Dashboard', 'Go to Dashboard'))} ${raw(I('chev_right', 16))}</button>
    </div>`;
  }

  return html`<div style="max-width:880px;margin:0 auto;padding:48px 32px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;cursor:pointer" data-go="landing">
      ${raw(LOGO_ICON(40))}
      <div class="logoWord lg"><span class="a">Post</span><span class="b">Post</span></div>
    </div>
    ${raw(stepper)}
    ${raw(content)}
  </div>`;
}
