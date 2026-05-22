// Onboarding wizard — 3 steps shown as separate artboards

const Stepper = ({ active }) => {
  const steps = [
    { n: 1, label: { th: 'ตั้งค่า Workspace', en: 'Set up workspace' } },
    { n: 2, label: { th: 'เชื่อมต่อโซเชียล', en: 'Connect social' } },
    { n: 3, label: { th: 'พร้อมใช้งาน', en: 'Ready to go' } },
  ];
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 640, margin: '0 auto' }}>
      {steps.map((s, i) => {
        const isDone = s.n < active;
        const isActive = s.n === active;
        return (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
                background: isDone ? 'var(--cf-success)' : isActive ? 'var(--cf-primary)' : 'var(--cf-surface-2)',
                color: isDone || isActive ? 'white' : 'var(--cf-ink-2)',
                border: isActive ? '4px solid var(--cf-primary-soft)' : 'none',
                boxSizing: 'content-box',
              }}>
                {isDone ? <Icon name="check" size={16} stroke={2.5} /> : s.n}
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--cf-ink-0)' : isDone ? 'var(--cf-ink-1)' : 'var(--cf-ink-2)',
              }}>{t(s.label)}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: s.n < active ? 'var(--cf-success)' : 'var(--cf-border-2)', borderRadius: 999 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OnboardShell = ({ step, children, onSkip }) => (
  <div className="cf" style={{ overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '22px 40px', borderBottom: '1px solid var(--cf-border)',
      background: 'var(--cf-surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="logo" size={26} />
        <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--cf-ink-0)' }}>PostPost</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <LangToggle />
        <a onClick={onSkip} style={{ fontSize: 13, color: 'var(--cf-ink-2)', textDecoration: 'none', cursor: 'pointer' }}>
          <T th="ข้ามการตั้งค่า →" en="Skip setup →" />
        </a>
      </div>
    </header>

    <div style={{ padding: '36px 40px 16px', background: 'var(--cf-surface)' }}>
      <Stepper active={step} />
    </div>

    <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '36px 40px 56px' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        {children}
      </div>
    </main>
  </div>
);

const OnboardStep1 = ({ onNext, onBack, onSkip }) => {
  const t = useT();
  const tones = [
    { id: 'friendly', emoji: '🤗', th: 'เป็นกันเอง', en: 'Friendly', descTh: 'พูดเหมือนคุยกับเพื่อน เน้นใกล้ชิด', descEn: 'Talks like a friend — warm and close' },
    { id: 'pro', emoji: '👔', th: 'มืออาชีพ', en: 'Professional', descTh: 'น้ำเสียงสุภาพ ทางการพอประมาณ', descEn: 'Polite, balanced, business-ready' },
    { id: 'fun', emoji: '✨', th: 'สนุกสดใส', en: 'Playful', descTh: 'มีอารมณ์ขัน ใช้คำเล่นๆ ดึงดูดวัยรุ่น', descEn: 'Witty and light — appeals to younger crowd' },
    { id: 'lux', emoji: '💎', th: 'พรีเมียม', en: 'Luxury', descTh: 'หรู มีระดับ เหมาะกับสินค้าราคาสูง', descEn: 'Refined and elevated — for premium goods' },
  ];
  const selected = 'friendly';
  return (
    <OnboardShell step={1} onSkip={onSkip}>
      <div style={{ marginBottom: 8 }}>
        <div className="eyebrow" style={{ color: 'var(--cf-primary)' }}>
          <T th="ขั้นตอนที่ 1 จาก 3" en="Step 1 of 3" />
        </div>
        <h1 className="h-display" style={{ fontSize: 32, margin: '8px 0 8px' }}>
          <T th="เริ่มต้นด้วย Workspace ของคุณ" en="Start with your workspace" />
        </h1>
        <p style={{ color: 'var(--cf-ink-2)', fontSize: 15, margin: 0 }}>
          <T
            th="AI จะใช้ข้อมูลนี้ในการสร้างคอนเทนต์ให้ตรงสไตล์แบรนด์ คุณเปลี่ยนภายหลังได้"
            en="AI uses this info to generate on-brand content. You can change it later."
          />
        </p>
      </div>

      <div className="card" style={{ padding: 28, marginTop: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <label className="label"><T th="ชื่อ Workspace" en="Workspace name" /></label>
            <input className="input" defaultValue="Siam Rose Beauty" />
          </div>
          <div>
            <label className="label"><T th="ประเภทธุรกิจ" en="Business type" /></label>
            <div style={{ position: 'relative' }}>
              <input className="input" defaultValue={t({ th: 'ความงาม & สกินแคร์', en: 'Beauty & Skincare' })} />
              <Icon name="chev-down" size={16} style={{ position: 'absolute', right: 12, top: 13, color: 'var(--cf-ink-3)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <label className="label"><T th="คำอธิบายแบรนด์สั้น ๆ" en="Short brand description" /></label>
          <textarea className="textarea" rows={3} defaultValue={t({
            th: 'แบรนด์สกินแคร์ออร์แกนิคจากดอกกุหลาบเขาใหญ่ เน้นผิวบอบบางแพ้ง่าย กลุ่มลูกค้าวัย 25-40 ปี',
            en: 'An organic skincare brand made from Khao Yai roses, targeting sensitive skin, for women age 25-40.',
          })} />
        </div>

        <hr className="divider" style={{ margin: '24px 0' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <label className="label" style={{ marginBottom: 0 }}>
              <T th="เลือกโทนเสียงของแบรนด์ (Brand voice)" en="Pick your brand voice" />
            </label>
            <span className="micro">
              <T th="เลือกอย่างน้อย 1 โทน · เปลี่ยนภายหลังได้" en="Pick at least one — change later" />
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 10 }}>
            {tones.map(tn => {
              const active = tn.id === selected;
              return (
                <button key={tn.id} style={{
                  textAlign: 'left',
                  border: active ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                  background: active ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                  borderRadius: 12, padding: 14,
                  display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                  font: 'inherit', color: 'inherit', position: 'relative',
                }}>
                  <div style={{
                    fontSize: 22, width: 40, height: 40, borderRadius: 10,
                    background: active ? 'white' : 'var(--cf-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{tn.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--cf-ink-0)' }}>
                        {t({ th: tn.th, en: tn.en })}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>
                        {t({ th: tn.en, en: tn.th })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cf-ink-2)', marginTop: 4, lineHeight: 1.45 }}>
                      {t({ th: tn.descTh, en: tn.descEn })}
                    </div>
                  </div>
                  {active && (
                    <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 999, background: 'var(--cf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" size={12} stroke={3} style={{ color: 'white' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <label className="label" style={{ marginBottom: 0 }}>
            <T th="Brand Archetype — บุคลิกหลักของแบรนด์" en="Brand Archetype — your brand's persona" />
          </label>
          <span className="micro">
            <T th="เลือก 1 แบบ · เปลี่ยนภายหลังได้" en="Pick 1 · change later" />
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {[
            { id: 'creator', icon: '🎨', name: { th: 'Creator', en: 'Creator' } },
            { id: 'sage', icon: '📖', name: { th: 'Sage', en: 'Sage' }, on: true },
            { id: 'caregiver', icon: '🤍', name: { th: 'Caregiver', en: 'Caregiver' } },
            { id: 'innocent', icon: '☀️', name: { th: 'Innocent', en: 'Innocent' } },
            { id: 'jester', icon: '🎭', name: { th: 'Jester', en: 'Jester' } },
            { id: 'magician', icon: '✨', name: { th: 'Magician', en: 'Magician' } },
            { id: 'ruler', icon: '👑', name: { th: 'Ruler', en: 'Ruler' } },
            { id: 'hero', icon: '🛡️', name: { th: 'Hero', en: 'Hero' } },
            { id: 'regular', icon: '🙂', name: { th: 'Regular Guy', en: 'Regular Guy' } },
            { id: 'rebel', icon: '🔥', name: { th: 'Rebel', en: 'Rebel' } },
            { id: 'explorer', icon: '🧭', name: { th: 'Explorer', en: 'Explorer' } },
            { id: 'lover', icon: '💗', name: { th: 'Lover', en: 'Lover' } },
          ].map(a => {
            const on = a.on;
            return (
              <button key={a.id} style={{
                font: 'inherit', cursor: 'pointer',
                padding: '12px 6px', borderRadius: 10,
                border: on ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                background: on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                position: 'relative',
              }}>
                {on && (
                  <div style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: 999, background: 'var(--cf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={9} stroke={3} style={{ color: 'white' }} />
                  </div>
                )}
                <div style={{ fontSize: 22 }}>{a.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-ink-0)', lineHeight: 1.2 }}>The {t(a.name)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-ghost" onClick={onBack}>
          <Icon name="chev-left" size={16} />
          <T th="ย้อนกลับ" en="Back" />
        </button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>
          <T th="ถัดไป" en="Next" />
          <Icon name="chev-right" size={18} />
        </button>
      </div>
    </OnboardShell>
  );
};

const OnboardStep2 = ({ onNext, onBack, onSkip }) => {
  const t = useT();
  const channels = [
    { id: 'fb', icon: 'facebook', name: 'Facebook Page', descTh: 'โพสต์ขึ้นเพจ Facebook อัตโนมัติ', descEn: 'Auto-post to your Facebook Page', ctaTh: 'เชื่อมต่อ', ctaEn: 'Connect', primary: true },
    { id: 'ig', icon: 'instagram', name: 'Instagram Business', descTh: 'ต้องเป็น Business Account', descEn: 'Requires a Business account', ctaTh: 'เชื่อมต่อ', ctaEn: 'Connect' },
    { id: 'tt', icon: 'tiktok', name: 'TikTok for Business', descTh: 'รองรับโพสต์วิดีโอและรูปภาพ', descEn: 'Posts both video and photo', ctaTh: 'เชื่อมต่อ', ctaEn: 'Connect' },
  ];
  return (
    <OnboardShell step={2} onSkip={onSkip}>
      <div style={{ marginBottom: 8 }}>
        <div className="eyebrow" style={{ color: 'var(--cf-primary)' }}>
          <T th="ขั้นตอนที่ 2 จาก 3" en="Step 2 of 3" />
        </div>
        <h1 className="h-display" style={{ fontSize: 32, margin: '8px 0 8px' }}>
          <T th="เชื่อมต่อ Facebook Page" en="Connect your Facebook Page" />
        </h1>
        <p style={{ color: 'var(--cf-ink-2)', fontSize: 15, margin: 0 }}>
          <T
            th={<>เริ่มจาก Facebook ก่อน คุณจะเชื่อมช่องทางอื่นภายหลังได้ในหน้า <b>ตั้งค่า → ช่องทาง</b></>}
            en={<>Start with Facebook — you can connect other channels later under <b>Settings → Channels</b>.</>}
          />
        </p>
      </div>

      <div className="card" style={{ padding: 8, marginTop: 28 }}>
        {channels.map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '18px 20px',
            borderBottom: i < channels.length - 1 ? '1px solid var(--cf-border)' : 'none',
          }}>
            <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={c.icon} size={32} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--cf-ink-0)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {c.name}
                {c.primary && <span className="pill pill-orange" style={{ height: 22 }}>
                  <T th="เริ่มที่นี่" en="Start here" />
                </span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--cf-ink-2)', marginTop: 2 }}>{t({ th: c.descTh, en: c.descEn })}</div>
            </div>
            {c.primary ? (
              <button className="btn btn-primary">
                <Icon name="link" size={15} />
                {t({ th: c.ctaTh, en: c.ctaEn })} Facebook
              </button>
            ) : (
              <button className="btn btn-secondary">
                {t({ th: c.ctaTh, en: c.ctaEn })}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: '14px 16px', borderRadius: 12,
        background: 'var(--cf-accent-soft)', border: '1px solid #DBE5FF',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <Icon name="shield" size={18} style={{ color: 'var(--cf-accent)', marginTop: 2 }} />
        <div style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.5 }}>
          <T
            th={<><b>ปลอดภัย:</b> PostPost ใช้ OAuth ของ Meta โดยตรง ไม่เก็บรหัสผ่านของคุณ คุณยกเลิกการเชื่อมต่อเมื่อไหร่ก็ได้</>}
            en={<><b>Secure:</b> PostPost uses Meta's standard OAuth — we never store your password. Disconnect any time.</>}
          />
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-ghost" onClick={onBack}>
          <Icon name="chev-left" size={16} />
          <T th="ย้อนกลับ" en="Back" />
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary btn-lg" onClick={onNext}><T th="ทำภายหลัง" en="Do it later" /></button>
          <button className="btn btn-primary btn-lg" onClick={onNext}>
            <T th="ถัดไป" en="Next" />
            <Icon name="chev-right" size={18} />
          </button>
        </div>
      </div>
    </OnboardShell>
  );
};

const OnboardStep3 = ({ onNext, onSkip }) => {
  const t = useT();
  return (
    <OnboardShell step={3} onSkip={onSkip}>
      <div style={{ textAlign: 'center', maxWidth: 540, margin: '0 auto', paddingTop: 24 }}>
        <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 28px' }}>
          <div style={{
            width: 110, height: 110, borderRadius: 999,
            background: 'var(--cf-success-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '8px solid white',
            boxShadow: '0 0 0 4px var(--cf-success-soft), var(--cf-shadow-2)',
          }}>
            <Icon name="check" size={48} stroke={3} style={{ color: 'var(--cf-success)' }} />
          </div>
          <div style={{ position: 'absolute', top: -8, right: -10, color: 'var(--cf-primary)' }}><Icon name="sparkles" size={20}/></div>
          <div style={{ position: 'absolute', bottom: 0, left: -16, color: 'var(--cf-accent)' }}><Icon name="sparkles" size={16}/></div>
          <div style={{ position: 'absolute', top: 10, left: -22, color: 'var(--cf-primary)' }}><Icon name="sparkles" size={14}/></div>
        </div>

        <h1 className="h-display" style={{ fontSize: 36, margin: '0 0 12px' }}>
          <T th="ทุกอย่างพร้อมแล้ว! 🎉" en="You're all set! 🎉" />
        </h1>
        <p style={{ color: 'var(--cf-ink-2)', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          <T
            th={<><b style={{ color: 'var(--cf-ink-0)' }}>Siam Rose Beauty</b> ของคุณตั้งค่าเรียบร้อย เชื่อมต่อ Facebook Page แล้ว ลองสร้างคอนเทนต์แรกกันเลย</>}
            en={<>Your <b style={{ color: 'var(--cf-ink-0)' }}>Siam Rose Beauty</b> workspace is set up and Facebook is connected — let's make your first post.</>}
          />
        </p>

        <div className="card" style={{ marginTop: 32, padding: 4, display: 'flex' }}>
          {[
            { v: '14', l: { th: 'วัน', en: 'days' }, s: { th: 'ทดลองฟรี', en: 'Free trial' }, icon: 'clock' },
            { v: '500', l: { th: 'เครดิต', en: 'credits' }, s: { th: 'สำหรับสร้างคอนเทนต์', en: 'For generating content' }, icon: 'zap' },
            { v: '1', l: { th: 'ช่องทาง', en: 'channel' }, s: { th: 'เชื่อมต่อแล้ว', en: 'Connected' }, icon: 'link' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: '18px 20px',
              borderLeft: i > 0 ? '1px solid var(--cf-border)' : 'none',
              textAlign: 'left',
            }}>
              <div style={{ color: 'var(--cf-primary)', marginBottom: 6 }}><Icon name={stat.icon} size={18}/></div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="h-display" style={{ fontSize: 28 }}>{stat.v}</span>
                <span style={{ fontSize: 13, color: 'var(--cf-ink-2)' }}>{t(stat.l)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--cf-ink-2)', marginTop: 2 }}>{t(stat.s)}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-lg" onClick={onNext}>
            <Icon name="play" size={16} />
            <T th="ดู Tutorial 2 นาที" en="Watch 2-min tutorial" />
          </button>
          <button className="btn btn-primary btn-lg" onClick={onNext}>
            <Icon name="sparkles" size={16} />
            <T th="สร้างคอนเทนต์แรก" en="Create your first post" />
            <Icon name="chev-right" size={18} />
          </button>
        </div>
      </div>
    </OnboardShell>
  );
};

// Wizard wrapper — drives the 3 onboarding steps in the real app
const Onboarding = () => {
  const app = useApp();
  const [step, setStep] = React.useState(1);
  const finish = () => app.navigate('generate');
  const next = () => (step >= 3 ? finish() : setStep(step + 1));
  const back = () => (step <= 1 ? app.setView('login') : setStep(step - 1));
  if (step === 1) return <OnboardStep1 onNext={next} onBack={back} onSkip={finish} />;
  if (step === 2) return <OnboardStep2 onNext={next} onBack={back} onSkip={finish} />;
  return <OnboardStep3 onNext={finish} onSkip={finish} />;
};

window.OnboardStep1 = OnboardStep1;
window.OnboardStep2 = OnboardStep2;
window.OnboardStep3 = OnboardStep3;
window.Onboarding = Onboarding;
