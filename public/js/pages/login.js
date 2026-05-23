// public/js/pages/login.js
//
// Login-page renderer — ES-module port of the inline pageLogin() from
// index.html. Pixel-identical output; conversion notes match landing.js
// (icon/i18n helper output is HTML, so it goes through raw()).
//
// Phase-2 bridge: reads state / T / I / LOGO_ICON from window.PP. This
// bridge goes away in Phase 3 once those helpers move to their own modules.

import { html, raw } from '../html.js';

export function pageLogin() {
  const { T, I, LOGO_ICON } = window.PP;

  return html`<div class="authShell">
    <div class="authForm">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;cursor:pointer" data-go="landing">
        ${raw(LOGO_ICON(40))}
        <div class="logoWord lg"><span class="a">Post</span><span class="b">Post</span></div>
      </div>
      <div class="kicker">${raw(T('ยินดีต้อนรับกลับ','Welcome back'))}</div>
      <h1 style="font-size:38px;color:var(--purple);font-weight:800;letter-spacing:-.03em;margin:6px 0 8px;line-height:1.1">${raw(T('เข้าสู่ระบบ PostPost','Sign in to PostPost'))}</h1>
      <p style="color:var(--muted);font-size:14.5px;margin:0 0 32px">${raw(T('จัดการหลายแบรนด์ สินค้าจาก Shopee และ workflow โพสต์อัตโนมัติ','Manage multi-brand workspaces, Shopee products, and auto-posting workflows.'))}</p>

      <div class="authSocial">
        <button class="btn outline" style="height:46px">${raw(I('google',16))} Google</button>
        <button class="btn outline" style="height:46px">${raw(I('facebook',16,'#1877F2'))} Facebook</button>
      </div>
      <div class="authDivider">${raw(T('หรือใช้อีเมล','or with email'))}</div>

      <div class="field">
        <label class="label">${raw(T('อีเมล','Email'))}</label>
        <input class="input" type="email" value="poy@happyprice.sh" />
      </div>
      <div class="field">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <label class="label">${raw(T('รหัสผ่าน','Password'))}</label>
          <a style="font-size:11.5px;font-weight:700;color:var(--orange);cursor:pointer">${raw(T('ลืมรหัสผ่าน?','Forgot?'))}</a>
        </div>
        <input class="input" type="password" value="••••••••••" />
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink2);margin:0 0 22px;cursor:pointer">
        <span class="check on"></span>
        <span>${raw(T('จดจำการเข้าสู่ระบบ','Remember me'))}</span>
      </label>
      <button class="btn primary lg" style="width:100%" data-go="onboarding" data-set-step="1">${raw(T('เข้าสู่ระบบ','Sign in'))} ${raw(I('chev_right',16))}</button>
      <p style="text-align:center;margin:18px 0 0;font-size:13px;color:var(--muted)">
        ${raw(T('ยังไม่มีบัญชี?','No account yet?'))} <a style="color:var(--orange);font-weight:700;cursor:pointer" data-go="onboarding" data-set-step="1">${raw(T('สมัครใช้ฟรี 14 วัน','Start 14-day free trial'))}</a>
      </p>
    </div>

    <div class="authSide">
      <div style="display:flex;align-items:center;gap:10px">${raw(LOGO_ICON(40, '#FF7A1A', '#FFFFFF'))}<div class="logoWord lg"><span class="a">Post</span><span class="b">Post</span></div></div>
      <div style="margin:auto 0">
        <div class="kicker" style="color:#FFD1A4">${raw(T('ใช้งานจริงโดย','Live testimonial'))}</div>
        <p class="authQuote">${raw(T('"จากเดิมโพสต์อาทิตย์ละ 3 ครั้ง <em>ตอนนี้โพสต์วันละ 2 โพสต์</em> โดยไม่ต้องคิดเอง — เครดิตที่ใช้คุ้มมาก ยอดขายเพิ่ม 2.3 เท่า"','"From 3 posts a week to <em>2 a day</em>, no thinking required. Sales went up 2.3×."'))}</p>
        <div style="display:flex;align-items:center;gap:12px;margin-top:22px">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#FCD9A8,#F97316);display:grid;place-items:center;color:#7C2D12;font-weight:800">${raw(T('ปอ','P'))}</div>
          <div>
            <b style="display:block;color:#fff">${raw(T('ปอย แสงทอง','Poy Sangthong'))}</b>
            <small style="color:#D7CEE6">${raw(T('ผู้ก่อตั้ง · HappyPrice Shop','Founder · HappyPrice Shop'))}</small>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;font-size:12.5px;color:#D7CEE6">
        <div><div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-.02em">3,200+</div>${raw(T('ร้านค้าออนไลน์','Online shops'))}</div>
        <div><div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-.02em">2.1M+</div>${raw(T('โพสต์ที่สร้าง','Posts generated'))}</div>
        <div><div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-.02em">98.4%</div>${raw(T('อัตราโพสต์สำเร็จ','Success rate'))}</div>
      </div>
    </div>
  </div>`;
}
