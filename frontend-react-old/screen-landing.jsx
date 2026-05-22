// Landing page
const Landing = () => {
  const t = useT();
  const app = useApp();
  return (
    <div className="cf" style={{ overflowY: 'auto' }}>
      {/* ===== Top nav ===== */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(250, 250, 247, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--cf-border)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="logo" size={28} />
            <span style={{ fontWeight: 600, fontSize: 17, color: 'var(--cf-ink-0)', letterSpacing: '-0.01em' }}>PostPost</span>
          </div>
          <nav style={{ display: 'flex', gap: 28, marginLeft: 24 }}>
            {[
              { th: 'ฟีเจอร์', en: 'Features' },
              { th: 'ราคา', en: 'Pricing' },
              { th: 'ตัวอย่างผลลัพธ์', en: 'Examples' },
              { th: 'ลูกค้าของเรา', en: 'Customers' },
            ].map(l => (
              <a key={l.en} href="#" style={{ color: 'var(--cf-ink-1)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{t(l)}</a>
            ))}
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <LangToggle />
            <button className="btn btn-ghost btn-sm" style={{ height: 38, padding: '0 14px' }} onClick={() => app.setView('login')}>
              <T th="เข้าสู่ระบบ" en="Sign in" />
            </button>
            <button className="btn btn-primary btn-sm" style={{ height: 38, padding: '0 18px' }} onClick={() => app.setView('signup')}>
              <T th="สมัครใช้ฟรี" en="Start free" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 24px', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div className="pill pill-orange" style={{ marginBottom: 20 }}>
            <Icon name="sparkles" size={14} />
            <T th="ใหม่ · เชื่อมต่อ TikTok ได้แล้ว" en="New · TikTok integration is live" />
          </div>
          <h1 className="h-display" style={{
            fontSize: 60, lineHeight: 1.04, margin: 0,
            fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--cf-ink-0)',
          }}>
            <T
              th={<>AI สร้างคอนเทนต์<br />ครบลูป <span style={{ color: 'var(--cf-primary)' }}>โพสต์อัตโนมัติ</span></>}
              en={<>End-to-end AI content,<br /><span style={{ color: 'var(--cf-primary)' }}>auto-posted</span> for you</>}
            />
          </h1>
          <p style={{ marginTop: 22, fontSize: 18, lineHeight: 1.55, color: 'var(--cf-ink-2)', maxWidth: 520 }}>
            <T
              th="ตั้งแต่หาไอเดีย เขียนแคปชั่น เลือกแฮชแท็ก ไปจนถึงโพสต์ลง Facebook, Instagram และ TikTok — ให้ AI ทำให้ครบในที่เดียว ไม่ต้องสลับหลายแอปอีกต่อไป"
              en="From idea to caption to hashtag to posting on Facebook, Instagram, and TikTok — AI handles the whole loop in one place. No more app-hopping."
            />
          </p>
          <div style={{ marginTop: 30, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-primary btn-lg" style={{ fontWeight: 500 }} onClick={() => app.setView('signup')}>
              <T th="สมัครใช้ฟรี" en="Start free" />
              <Icon name="chev-right" size={18} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => app.setView('login')}>
              <Icon name="play" size={16} />
              <T th="ดู Demo 2 นาที" en="Watch 2-min demo" />
            </button>
          </div>
          <div style={{ marginTop: 22, display: 'flex', gap: 24, fontSize: 13, color: 'var(--cf-ink-2)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={15} style={{ color: 'var(--cf-success)' }} />
              <T th="ฟรี 14 วัน ไม่ต้องใช้บัตรเครดิต" en="Free 14 days, no card required" />
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={15} style={{ color: 'var(--cf-success)' }} />
              <T th="ตั้งค่าเสร็จใน 5 นาที" en="5-minute setup" />
            </span>
          </div>
        </div>

        {/* Sample output preview card */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: -40, zIndex: 0,
            background: 'radial-gradient(60% 60% at 60% 40%, rgba(249,115,22,0.18), transparent 70%)',
            filter: 'blur(20px)', pointerEvents: 'none',
          }} />

          {/* Floating "topic" chip */}
          <div style={{
            position: 'absolute', top: -16, left: -12, zIndex: 2,
            background: 'white', border: '1px solid var(--cf-border)',
            borderRadius: 10, padding: '8px 12px',
            boxShadow: 'var(--cf-shadow-2)',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="sparkles" size={14} style={{ color: 'var(--cf-primary)' }} />
            <span className="muted" style={{ fontWeight: 500 }}><T th="หัวข้อ:" en="Topic:" /></span>
            <span style={{ color: 'var(--cf-ink-0)', fontWeight: 500 }}>
              <T th="โปรโมชั่น 11.11 ครีมบำรุงผิว" en="11.11 sale · skincare cream" />
            </span>
          </div>

          <div className="card" style={{
            position: 'relative', zIndex: 1, padding: 18, borderRadius: 18,
            boxShadow: 'var(--cf-shadow-3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="instagram" size={20} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Instagram</span>
                <span className="pill pill-green" style={{ height: 22, fontSize: 11, padding: '0 8px' }}>
                  <span className="dot" style={{ background: 'var(--cf-success)', width: 6, height: 6 }} />
                  <T th="พร้อมโพสต์" en="Ready to post" />
                </span>
              </div>
              <button className="btn btn-ghost" style={{ height: 28, padding: '0 8px' }}>
                <Icon name="refresh" size={14} />
              </button>
            </div>

            <div style={{
              aspectRatio: '4 / 3', borderRadius: 12, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, #FFEDD5, #FED7AA 50%, #FECDD3)',
              border: '1px solid var(--cf-border)',
            }}>
              <div style={{ position: 'absolute', top: 24, right: 28, width: 90, height: 90, borderRadius: 999, background: 'rgba(255,255,255,0.55)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -30, width: 170, height: 170, borderRadius: 999, background: 'rgba(249,115,22,0.18)' }} />
              <div style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                width: 120, height: 150, borderRadius: 18,
                background: 'linear-gradient(180deg, #FFFBEB, #FED7AA)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 14px 40px -10px rgba(124, 45, 18, 0.30)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#7C2D12',
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 600 }}>SIAM ROSE</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>11.11</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  <T th="ลด 50%" en="50% OFF" />
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 10, padding: '4px 8px', borderRadius: 999, backdropFilter: 'blur(6px)' }}>
                AI generated · v2
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.55, color: 'var(--cf-ink-1)' }}>
              <span style={{ fontWeight: 600 }}>siamrose.co</span>
              {' '}
              <T
                th={<>เปิดศักราชความสวย ✨ ครีมบำรุงผิวสูตรเข้มข้น <b>ลดทันที 50%</b> เฉพาะวันที่ 11.11 เท่านั้น สั่งเลยก่อนของหมด 🌸</>}
                en={<>Glow up this season ✨ Our concentrated skincare cream is <b>50% off</b> — only on 11.11. Order before it sells out 🌸</>}
              />
            </div>

            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['#skincare', '#1111sale', '#siamrose', '#glowup', '#beautythailand'].map(tag => (
                <span key={tag} style={{ fontSize: 12, color: 'var(--cf-accent)', fontWeight: 500 }}>{tag}</span>
              ))}
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--cf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--cf-ink-2)' }}>
                <Icon name="clock" size={13} />
                <T th="ตั้งเวลา: วันนี้ 19:00 น." en="Scheduled: today 7:00 PM" />
              </div>
              <button className="btn btn-primary btn-sm" style={{ height: 32 }}>
                <Icon name="send" size={13} />
                <T th="โพสต์เลย" en="Post now" />
              </button>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: -18, right: -8, zIndex: 2,
            display: 'flex', gap: 8,
            background: 'white', borderRadius: 999, padding: '8px 14px',
            border: '1px solid var(--cf-border)',
            boxShadow: 'var(--cf-shadow-2)',
            alignItems: 'center', fontSize: 12, color: 'var(--cf-ink-1)', fontWeight: 500,
          }}>
            <Icon name="facebook" size={18} />
            <Icon name="instagram" size={18} />
            <Icon name="tiktok" size={18} />
            <span style={{ marginLeft: 4 }}>
              <T th="โพสต์พร้อมกัน 3 ช่องทาง" en="Posts to all 3 channels at once" />
            </span>
          </div>
        </div>
      </section>

      {/* ===== Logos / social proof ===== */}
      <section style={{ maxWidth: 1200, margin: '40px auto 0', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--cf-ink-2)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
          <T
            th="ใช้งานแล้วโดยร้านค้าออนไลน์กว่า 3,200 ร้านทั่วประเทศ"
            en="Trusted by 3,200+ online shops across Thailand"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, opacity: 0.7, color: 'var(--cf-ink-2)' }}>
          {[
            { name: 'Siam Rose', sub: 'Beauty' },
            { name: 'KhaoMan', sub: 'Food & Bev' },
            { name: 'Lookbook BKK', sub: 'Fashion' },
            { name: 'TukTuk Studio', sub: 'Agency' },
            { name: 'Baan Café', sub: 'Lifestyle' },
            { name: 'Pet Pet Pet', sub: 'Retail' },
          ].map(b => (
            <div key={b.name} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 18, fontFamily: 'Prompt', color: 'var(--cf-ink-1)', letterSpacing: '-0.01em' }}>{b.name}</div>
              <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{b.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section style={{ maxWidth: 1200, margin: '64px auto 0', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'end', marginBottom: 36 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--cf-primary)' }}>
              <T th="ครบในที่เดียว" en="All in one" />
            </div>
            <h2 className="h-display" style={{ fontSize: 38, marginTop: 8, marginBottom: 0 }}>
              <T
                th={<>ทำงาน 3 ขั้นตอน<br />ในแอปเดียวจบ</>}
                en={<>Three steps,<br />one app.</>}
              />
            </h2>
          </div>
          <p style={{ color: 'var(--cf-ink-2)', fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 480 }}>
            <T
              th="จากไอเดียถึงโพสต์จริง โดยไม่ต้องสลับ ChatGPT, Canva, Buffer หรือเปิดมือถือมาโพสต์เอง"
              en="From idea to live post — without juggling ChatGPT, Canva, Buffer, or opening your phone to post manually."
            />
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            {
              n: '01', icon: 'wand', title: 'Generate',
              thTitle: 'สร้างคอนเทนต์', enTitle: 'Make content',
              thDesc: 'ป้อนหัวข้อสั้น ๆ AI สร้างให้ครบ ทั้ง Hook, แคปชั่น, แฮชแท็ก และรูปภาพ ตามโทนของแบรนด์คุณ',
              enDesc: 'Type a short topic and AI generates a hook, caption, hashtags, and on-brand images.',
              thTag: 'GPT-4o · DALL·E 3', enTag: 'GPT-4o · DALL·E 3', color: 'orange',
            },
            {
              n: '02', icon: 'calendar', title: 'Schedule',
              thTitle: 'จัดตารางโพสต์', enTitle: 'Schedule it',
              thDesc: 'ลากคอนเทนต์ใส่ปฏิทินรายสัปดาห์ AI แนะนำเวลาที่คนเข้าถึงสูงสุดของแต่ละช่อง',
              enDesc: 'Drag posts into a weekly calendar — AI recommends the highest-reach time per channel.',
              thTag: 'AI Smart Time', enTag: 'AI Smart Time', color: 'blue',
            },
            {
              n: '03', icon: 'send', title: 'Auto-post',
              thTitle: 'โพสต์อัตโนมัติ', enTitle: 'Post automatically',
              thDesc: 'เชื่อม Facebook, IG, TikTok ครั้งเดียว โพสต์พร้อมกันได้ทุกช่อง พร้อมรายงานยอด Engagement',
              enDesc: 'Connect Facebook, IG, and TikTok once. Post to all of them at once and see engagement.',
              thTag: '3 แพลตฟอร์ม', enTag: '3 platforms', color: 'green',
            },
          ].map((f, i) => (
            <div key={f.n} className="card" style={{
              padding: 28, borderRadius: 16,
              borderColor: i === 0 ? 'var(--cf-primary)' : 'var(--cf-border)',
              boxShadow: i === 0 ? '0 1px 2px rgba(16,24,40,.04), 0 0 0 4px rgba(249,115,22,0.08)' : 'var(--cf-shadow-1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--cf-primary-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--cf-primary)',
                }}>
                  <Icon name={f.icon} size={22} />
                </div>
                <span className="mono" style={{ fontSize: 12, color: 'var(--cf-ink-3)' }}>{f.n}</span>
              </div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{f.title}</div>
              <h3 className="h2" style={{ margin: '0 0 10px', fontSize: 22 }}>
                {t({ th: f.thTitle, en: f.enTitle })}
              </h3>
              <p style={{ margin: 0, color: 'var(--cf-ink-2)', fontSize: 14, lineHeight: 1.6 }}>
                {t({ th: f.thDesc, en: f.enDesc })}
              </p>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed var(--cf-border)' }}>
                <span className={`pill pill-${f.color}`}>
                  <Icon name="sparkles" size={11} />
                  {t({ th: f.thTag, en: f.enTag })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section style={{ maxWidth: 1200, margin: '72px auto 64px', padding: '0 32px' }}>
        <div style={{
          borderRadius: 24, padding: '44px 56px',
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 60%, #FED7AA 100%)',
          border: '1px solid #FED7AA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32,
        }}>
          <div>
            <h2 className="h-display" style={{ fontSize: 32, margin: 0 }}>
              <T
                th={<>เริ่มสร้างคอนเทนต์แรกของคุณ<br />ใน <span style={{ color: 'var(--cf-primary)' }}>5 นาที</span></>}
                en={<>Create your first post<br />in <span style={{ color: 'var(--cf-primary)' }}>5 minutes</span></>}
              />
            </h2>
            <p style={{ margin: '12px 0 0', color: 'var(--cf-ink-2)', fontSize: 15 }}>
              <T th="สมัครฟรี ใช้ครบทุกฟีเจอร์ 14 วัน ยกเลิกเมื่อไหร่ก็ได้" en="Free trial · all features · cancel anytime" />
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" style={{ paddingLeft: 28, paddingRight: 28 }} onClick={() => app.setView('signup')}>
              <T th="สมัครใช้ฟรี" en="Start free" />
              <Icon name="chev-right" size={18} />
            </button>
            <span style={{ fontSize: 12, color: 'var(--cf-ink-2)' }}>
              <T th="ไม่ต้องใช้บัตรเครดิต" en="No credit card needed" />
            </span>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--cf-border)', padding: '20px 32px', maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--cf-ink-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="logo" size={18} />
          © 2026 PostPost · Bangkok, Thailand
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}><T th="นโยบายความเป็นส่วนตัว" en="Privacy" /></a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}><T th="เงื่อนไขการใช้บริการ" en="Terms" /></a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}><T th="ติดต่อเรา" en="Contact" /></a>
        </div>
      </footer>
    </div>
  );
};

window.Landing = Landing;
