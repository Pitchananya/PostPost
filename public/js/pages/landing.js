// public/js/pages/landing.js
//
// Landing-page renderer — ES-module port of the inline pageLanding() from
// index.html. Pixel-identical output; the only changes are mechanical:
//   - backtick template -> html`` tagged template
//   - icon helpers (I/LOGO_ICON) and i18n helpers (T) emit HTML, so we wrap
//     their results in raw() to opt out of escaping
//   - .map(...).join('') results are also wrapped in raw()
//
// Phase-2 bridge: state / T / I / LOGO_ICON still live on the global inline
// script. We read them via window.PP.* so we don't have to refactor those
// helpers yet. This bridge goes away in Phase 3 once icons/state/i18n move
// to their own modules.

import { html, raw } from '../html.js';

export function pageLanding() {
  const { state, T, I, LOGO_ICON } = window.PP;

  return html`<div class="landingNav"><div class="landingNavInner">
    <div class="navBrand">
      ${raw(LOGO_ICON(40))}
      <div class="logoWord lg"><span class="a">Post</span><span class="b">Post</span></div>
    </div>
    <nav>
      <a href="#features">${raw(T('ฟีเจอร์','Features'))}</a>
      <a href="#how">${raw(T('วิธีใช้','How it works'))}</a>
      <a href="#pricing">${raw(T('ราคา','Pricing'))}</a>
      <a href="#customers">${raw(T('ลูกค้า','Customers'))}</a>
    </nav>
    <div style="margin-left:auto;display:flex;gap:10px;align-items:center">
      <div class="lang"><button class="${state.lang==='th'?'active':''}" data-lang="th">ไทย</button><button class="${state.lang==='en'?'active':''}" data-lang="en">EN</button></div>
      <button class="btn ghost" data-go="login">${raw(T('เข้าสู่ระบบ','Sign in'))}</button>
      <button class="btn primary" data-go="login">${raw(T('สมัครใช้ฟรี','Start free'))}</button>
    </div>
  </div></div>

  <div class="landingMain" style="padding-top:20px">
    <section class="hero">
      <div class="heroOrb o1"></div>
      <div class="heroOrb o2"></div>
      <div style="display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:start">
        <div>
          <div class="heroPill"><span class="dot"></span>${raw(T('ใหม่ · เชื่อมต่อ TikTok ได้แล้ว','New · TikTok integration is live'))}</div>
          <div class="heroLogo"><span>Post</span><span>Post</span></div>
          <h1 class="heroH1">${raw(T(`AI สร้างคอนเทนต์ครบลูป<br/><em>โพสต์อัตโนมัติ</em> ทุกช่องทาง`,`End-to-end AI content,<br/><em>auto-posted</em> for you`))}</h1>
          <p class="heroLead">${raw(T('ตั้งแต่หาไอเดีย เขียนแคปชั่น เลือกแฮชแท็ก สร้างรูป/วิดีโอ ไปจนถึงโพสต์ลง Facebook, Instagram และ TikTok — ให้ AI ทำให้ครบในที่เดียว','From idea to caption to hashtag to AI image/video to posting on Facebook, Instagram and TikTok — done in one place.'))}</p>
          <div class="heroCtas">
            <button class="btn primary lg" data-go="login">${raw(T('เริ่มใช้ฟรี','Start free'))} ${raw(I('chev_right',16))}</button>
            <button class="btn outline lg">${raw(I('play',14))} ${raw(T('ดู Demo 2 นาที','Watch 2-min demo'))}</button>
          </div>
          <div class="heroTrust">
            <span>${raw(T('ฟรี 14 วัน ไม่ต้องใช้บัตรเครดิต','Free 14 days, no card'))}</span>
            <span>${raw(T('ตั้งค่าเสร็จใน 5 นาที','5-minute setup'))}</span>
          </div>
        </div>
        <div class="heroPreview">
          <div class="floatPill top">
            ${raw(I('sparkles',14,'#FF7A1A'))}
            <span><span class="micro">${raw(T('หัวข้อ:','Topic:'))}</span> <b>${raw(T('โปร 11.11 Marine Collagen','11.11 Marine Collagen'))}</b></span>
          </div>
          <div class="previewCard">
            <div class="previewHead">
              <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px">${raw(I('instagram',18,'#E1306C'))} Instagram</div>
              <span class="pill green"><span class="dot" style="background:#16A34A"></span>${raw(T('พร้อมโพสต์','Ready'))}</span>
            </div>
            <div class="previewBody">
              <div class="previewImg">
                <div class="previewBottle">
                  <div style="font-size:9px;letter-spacing:.2em;font-weight:700">SIAM ROSE</div>
                  <b>11.11</b>
                  <div style="font-size:10px;margin-top:2px">${raw(T('ลด 50%','50% OFF'))}</div>
                </div>
              </div>
              <div style="margin-top:14px;font-size:13px;line-height:1.55">
                <b>happyprice.sh</b> ${raw(T('เปิดศักราชความสวย ✨ Marine Collagen <b>ลดทันที 50%</b> เฉพาะวันที่ 11.11 เท่านั้น สั่งเลยก่อนของหมด 🌸','Glow up this season ✨ Marine Collagen <b>50% off</b> — only on 11.11. Order before it sells out 🌸'))}
              </div>
              <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">
                ${raw(['#skincare','#1111sale','#happyprice','#glowup','#beautythailand'].map(x=>`<span style="font-size:11.5px;color:var(--blue);font-weight:600">${x}</span>`).join(''))}
              </div>
            </div>
          </div>
          <div class="floatPill bot">
            ${raw(I('facebook',16,'#1877F2'))}${raw(I('instagram',16,'#E1306C'))}${raw(I('tiktok',16,'#0F172A'))}
            <span>${raw(T('โพสต์ 3 ช่องทางพร้อมกัน','3 channels at once'))}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- social proof -->
    <section style="margin:48px 0">
      <div style="text-align:center;font-size:11px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin-bottom:20px">
        ${raw(T('ใช้งานแล้วโดยร้านค้าออนไลน์กว่า 3,200 ร้านทั่วประเทศ','Trusted by 3,200+ online shops across Thailand'))}
      </div>
      <div style="display:flex;justify-content:space-between;gap:32px;opacity:.7;color:var(--muted);flex-wrap:wrap">
        ${raw([['Siam Rose','Beauty'],['HappyPrice','Skincare'],['KhaoMan','Food'],['Lookbook BKK','Fashion'],['TukTuk Studio','Agency'],['Baan Café','Café']].map(([n,s])=>`<div style="text-align:center"><div style="font-weight:800;font-size:18px;color:var(--purple);letter-spacing:-.01em">${n}</div><div style="font-size:10px;letter-spacing:.15em;text-transform:uppercase">${s}</div></div>`).join(''))}
      </div>
    </section>

    <!-- features -->
    <section id="features" style="margin-top:72px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:end;margin-bottom:36px">
        <div>
          <div class="kicker">${raw(T('ครบในที่เดียว','All in one'))}</div>
          <h2 class="title" style="font-size:42px">${raw(T(`3 ขั้นตอน<br/>ในแอปเดียวจบ`,`Three steps,<br/>one app.`))}</h2>
        </div>
        <p style="color:var(--ink2);font-size:16px;line-height:1.6;margin:0">${raw(T('จากไอเดียถึงโพสต์จริง โดยไม่ต้องสลับ ChatGPT, Canva, Buffer หรือเปิดมือถือมาโพสต์เอง','From idea to live post — without juggling ChatGPT, Canva, Buffer, or opening your phone to post manually.'))}</p>
      </div>
      <div class="grid g3">
        ${raw([
          {icon:'wand',n:'01',cls:'',titEn:'Generate',titTh:'สร้างคอนเทนต์',thDesc:'ป้อนหัวข้อสั้น ๆ AI สร้างให้ครบ ทั้ง Hook, แคปชั่น, แฮชแท็ก และรูปภาพ ตามโทนของแบรนด์คุณ',enDesc:'Type a short topic and AI generates a hook, caption, hashtags, and on-brand images.',tag:'GPT-4o · DALL·E 3'},
          {icon:'calendar',n:'02',cls:'b',titEn:'Schedule',titTh:'จัดตารางโพสต์',thDesc:'ลากคอนเทนต์ใส่ปฏิทินรายเดือน AI แนะนำเวลาที่คนเข้าถึงสูงสุดของแต่ละช่อง',enDesc:'Drag posts into a monthly calendar — AI recommends the best time per channel.',tag:'AI Smart Time'},
          {icon:'send',n:'03',cls:'g',titEn:'Auto-post',titTh:'โพสต์อัตโนมัติ',thDesc:'เชื่อม Facebook, IG, TikTok ครั้งเดียว โพสต์พร้อมกันได้ทุกช่อง พร้อมรายงานยอด Engagement',enDesc:'Connect Facebook, IG, and TikTok once. Post everywhere at once. See engagement instantly.',tag:'3 platforms'},
        ].map(f=>`<div class="featCard ${f.cls}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div class="featIcon">${I(f.icon,22)}</div>
            <span class="num">${f.n}</span>
          </div>
          <div class="eyebrow">${f.titEn}</div>
          <h3>${T(f.titTh,f.titEn)}</h3>
          <p style="color:var(--ink2);font-size:14px;line-height:1.6;margin:0 0 18px">${T(f.thDesc,f.enDesc)}</p>
          <div style="padding-top:14px;border-top:1px dashed var(--line)"><span class="pill orange">${I('sparkles',11)} ${f.tag}</span></div>
        </div>`).join(''))}
      </div>
    </section>

    <!-- final CTA -->
    <section class="finalCta">
      <div>
        <h2>${raw(T(`เริ่มสร้างคอนเทนต์แรกของคุณ<br/>ใน <em>5 นาที</em>`,`Create your first post<br/>in <em>5 minutes</em>`))}</h2>
        <p>${raw(T('สมัครฟรี ใช้ครบทุกฟีเจอร์ 14 วัน ยกเลิกเมื่อไหร่ก็ได้','Free trial · all features · cancel anytime'))}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;align-items:flex-end">
        <button class="btn primary lg" style="padding:0 28px" data-go="login">${raw(T('สมัครใช้ฟรี','Start free'))} ${raw(I('chev_right',16))}</button>
        <span style="font-size:12px;color:#D7CEE6">${raw(T('ไม่ต้องใช้บัตรเครดิต','No credit card needed'))}</span>
      </div>
    </section>
  </div>

  <div class="landingFoot">
    <div style="display:flex;align-items:center;gap:8px">${raw(LOGO_ICON(22))}<div class="logoWord"><span class="a">Post</span><span class="b">Post</span></div>© 2026 · Bangkok</div>
    <div style="display:flex;gap:20px"><a>${raw(T('นโยบายความเป็นส่วนตัว','Privacy'))}</a><a>${raw(T('เงื่อนไข','Terms'))}</a><a>${raw(T('ติดต่อ','Contact'))}</a></div>
  </div>`;
}
