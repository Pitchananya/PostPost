// Login screen — social only (Google + Facebook)

const AuthShell = ({ children, sideTitle, sideQuote }) => {
  const t = useT();
  return (
  <div className="cf" style={{ display: 'flex', overflow: 'hidden' }}>
    {/* Left: form */}
    <div style={{
      flex: '1 1 56%', padding: '36px 56px 36px',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="logo" size={28} />
          <span style={{ fontWeight: 600, fontSize: 17, color: 'var(--cf-ink-0)', letterSpacing: '-0.01em' }}>PostPost</span>
        </div>
        <LangToggle />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {children}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--cf-ink-2)' }}>
        <span>© 2026 PostPost</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}><T th="ความช่วยเหลือ" en="Help" /></a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}><T th="ความเป็นส่วนตัว" en="Privacy" /></a>
        </div>
      </div>
    </div>

    {/* Right: decorative panel with testimonial */}
    <div style={{
      flex: '1 1 44%', position: 'relative',
      background: 'linear-gradient(155deg, #FFEDD5 0%, #FED7AA 45%, #FDBA74 100%)',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -100, right: -80, width: 360, height: 360, borderRadius: 999, background: 'rgba(255,255,255,0.3)', filter: 'blur(8px)' }} />
      <div style={{ position: 'absolute', bottom: -120, left: -100, width: 320, height: 320, borderRadius: 999, background: 'rgba(249,115,22,0.25)', filter: 'blur(4px)' }} />

      <div style={{ position: 'relative', height: '100%', padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="eyebrow" style={{ color: '#9A3412' }}>{sideTitle}</div>

        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: 18, padding: 18,
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: 'var(--cf-shadow-3)',
          maxWidth: 340,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Icon name="sparkles" size={16} style={{ color: 'var(--cf-primary)' }} />
            <span style={{ fontSize: 12, color: '#9A3412', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <T th="AI สร้างให้แล้ว" en="AI generated" />
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--cf-ink-0)', lineHeight: 1.45 }}>
            <T
              th={'"ไม่ต้องคิดเองตอนตี 2 อีกแล้ว AI เขียนให้ตรงโทนแบรนด์ทุกครั้ง"'}
              en={'"I don\'t have to brainstorm at 2am anymore — AI writes it on-brand every time."'}
            />
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '1px dashed var(--cf-border)' }}>
            <div className="ring-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{t({ th: 'ป', en: 'P' })}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                <T th="ปอย · เจ้าของร้าน Siam Rose" en="Poy · Owner of Siam Rose" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>
                <T th="ใช้ PostPost มา 4 เดือน" en="Using PostPost for 4 months" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 32, lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.02em', color: '#7C2D12', maxWidth: 360 }}>
            {sideQuote}
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: '#9A3412', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <Icon name="facebook" size={20} />
              <Icon name="instagram" size={20} />
              <Icon name="tiktok" size={20} />
            </div>
            <T th="โพสต์อัตโนมัติทั้ง 3 ช่องทาง" en="Auto-post to all 3 channels" />
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

const SocialButton = ({ icon, label, primary, onClick, disabled }) => (
  <button
    className="btn"
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%', height: 56, borderRadius: 12,
      fontSize: 15, fontWeight: 500,
      background: 'var(--cf-surface)', color: 'var(--cf-ink-0)',
      border: '1px solid var(--cf-border)',
      boxShadow: primary ? 'var(--cf-shadow-2)' : 'var(--cf-shadow-1)',
      justifyContent: 'center', gap: 12,
    }}
  >
    <Icon name={icon} size={22} />
    {label}
  </button>
);

const Login = () => {
  const app = useApp();
  const t = useT();
  const wantSignup = app.view === 'signup';
  const [mode, setMode] = React.useState(wantSignup ? 'email' : 'social'); // social | email
  const [signup, setSignup] = React.useState(wantSignup);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [workspace, setWorkspace] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  // No Google/Facebook OAuth on the backend yet — social buttons route to email sign-in.
  const social = (provider) => {
    setMode('email');
    app.toast(t({ th: `ยังไม่รองรับ ${provider} OAuth — เข้าสู่ระบบด้วยอีเมลไปก่อนนะ`, en: `${provider} OAuth isn't wired yet — use email sign-in for now` }), 'info');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (signup) await app.signup({ email, password, name, workspace_name: workspace });
      else await app.login(email, password);
    } catch (ex) {
      setErr(ex.message || 'เกิดข้อผิดพลาด');
    } finally { setBusy(false); }
  };

  return (
    <AuthShell
      sideTitle={<T th="ยินดีต้อนรับสู่ PostPost" en="Welcome to PostPost" />}
      sideQuote={<T th="ตอบลูกค้า โพสต์ขาย ครบจบที่เดียว" en="Answer customers, sell, and post — all in one place" />}
    >
      <h1 className="h1" style={{ margin: 0, fontSize: 32 }}>
        {signup ? <T th="สร้างบัญชีใหม่" en="Create account" /> : <T th="เข้าสู่ระบบ" en="Sign in" />}
      </h1>
      <p style={{ margin: '10px 0 32px', color: 'var(--cf-ink-2)', fontSize: 15, lineHeight: 1.55 }}>
        <T
          th="เลือกบัญชีที่คุณใช้อยู่ — เราจะเชื่อมต่อกับ Facebook Page และ Instagram ของคุณให้อัตโนมัติ"
          en="Choose an account you already use — we'll connect your Facebook Page and Instagram automatically."
        />
      </p>

      {mode === 'social' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SocialButton icon="facebook" label={<T th="เข้าสู่ระบบด้วย Facebook" en="Continue with Facebook" />} primary onClick={() => social('Facebook')} />
            <SocialButton icon="google" label={<T th="เข้าสู่ระบบด้วย Google" en="Continue with Google" />} onClick={() => social('Google')} />
          </div>
          <button className="btn btn-ghost" onClick={() => setMode('email')}
            style={{ width: '100%', marginTop: 12, color: 'var(--cf-ink-2)' }}>
            <Icon name="type" size={15} />
            <T th="เข้าสู่ระบบด้วยอีเมล" en="Sign in with email" />
          </button>
        </>
      ) : (
        <form onSubmit={submit}>
          {err && (
            <div style={{ background: 'var(--cf-danger-soft)', border: '1px solid #F5C2C2', color: '#991B1B',
              borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>{err}</div>
          )}
          {signup && (
            <>
              <label className="label">{t({ th: 'ชื่อของคุณ', en: 'Your name' })}</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 12 }} />
              <label className="label">{t({ th: 'ชื่อ Workspace', en: 'Workspace name' })}</label>
              <input className="input" value={workspace} onChange={(e) => setWorkspace(e.target.value)} style={{ marginBottom: 12 }} />
            </>
          )}
          <label className="label">{t({ th: 'อีเมล', en: 'Email' })}</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com" style={{ marginBottom: 12 }} />
          <label className="label">{t({ th: 'รหัสผ่าน', en: 'Password' })}</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" style={{ marginBottom: 18 }} />
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy} style={{ width: '100%' }}>
            {busy ? <T th="กำลังดำเนินการ…" en="Please wait…" />
              : (signup ? <T th="สร้างบัญชี" en="Create account" /> : <T th="เข้าสู่ระบบ" en="Sign in" />)}
          </button>
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--cf-ink-2)', textAlign: 'center' }}>
            <a onClick={() => { setSignup(!signup); setErr(''); }} style={{ color: 'var(--cf-primary)', cursor: 'pointer', fontWeight: 600 }}>
              {signup ? <T th="มีบัญชีแล้ว? เข้าสู่ระบบ" en="Have an account? Sign in" />
                      : <T th="ยังไม่มีบัญชี? สมัครใช้งาน" en="No account? Sign up" />}
            </a>
            <span style={{ margin: '0 8px' }}>·</span>
            <a onClick={() => setMode('social')} style={{ cursor: 'pointer' }}><T th="ใช้ Social" en="Use social" /></a>
          </div>
        </form>
      )}

      <div style={{
        marginTop: 20, padding: '14px 16px', borderRadius: 12,
        background: 'var(--cf-primary-soft)', border: '1px solid #FED7AA',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <Icon name="sparkles" size={18} style={{ color: 'var(--cf-primary)', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.5 }}>
          <T
            th={<>บัญชีทดสอบ: <b>admin@oemcontent.co</b> / <b>ChangeMe123!</b></>}
            en={<>Demo account: <b>admin@oemcontent.co</b> / <b>ChangeMe123!</b></>}
          />
        </div>
      </div>

      <div style={{
        marginTop: 24, paddingTop: 24,
        borderTop: '1px solid var(--cf-border)',
        display: 'flex', alignItems: 'center', gap: 16,
        fontSize: 12, color: 'var(--cf-ink-2)', lineHeight: 1.5,
      }}>
        <Icon name="shield" size={18} style={{ color: 'var(--cf-ink-2)', flexShrink: 0 }} />
        <div>
          <T
            th={<>เราไม่เก็บรหัสผ่านของคุณแบบ plain text — การเข้าสู่ระบบเท่ากับยอมรับ <a href="#" style={{ color: 'var(--cf-accent)', textDecoration: 'none' }}>เงื่อนไขการใช้บริการ</a> และ <a href="#" style={{ color: 'var(--cf-accent)', textDecoration: 'none' }}>นโยบายความเป็นส่วนตัว</a></>}
            en={<>We never store your password as plain text — signing in means you accept our <a href="#" style={{ color: 'var(--cf-accent)', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--cf-accent)', textDecoration: 'none' }}>Privacy Policy</a>.</>}
          />
        </div>
      </div>
    </AuthShell>
  );
};

window.AuthShell = AuthShell;
window.Login = Login;
