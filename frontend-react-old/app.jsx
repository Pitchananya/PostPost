// app.jsx — real application entry: auth gate + router
// (replaces the old design-canvas mock mount)

// ---- Library page (content archive) — wired to /api/content ----
const LibraryPage = () => {
  const t = useT();
  const app = useApp();
  const [items, setItems] = React.useState(null);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    API.content.list()
      .then((d) => setItems(d.contents || []))
      .catch((e) => { setErr(e.message); setItems([]); });
  }, []);

  return (
    <DashShell active="library" crumb={t({ th: 'คลังคอนเทนต์', en: 'Library' })}>
      <PageHeader
        title={<T th="คลังคอนเทนต์" en="Content Library" />}
        subtitle={<T th="คอนเทนต์ทั้งหมดที่สร้างและบันทึกไว้" en="Everything you've generated and saved" />}
      />
      {items === null && <p className="muted"><T th="กำลังโหลด…" en="Loading…" /></p>}
      {err && <div className="card" style={{ padding: 16, color: 'var(--cf-danger)' }}>{err}</div>}
      {items && items.length === 0 && !err && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Icon name="library" size={28} style={{ color: 'var(--cf-ink-3)' }} />
          <p className="muted" style={{ marginTop: 10 }}><T th="ยังไม่มีคอนเทนต์ — ลองสร้างจากหน้า Generate" en="No content yet — create one from Generate" /></p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => app.navigate('generate')}>
            <Icon name="wand" size={15} /> <T th="ไปสร้างคอนเทนต์" en="Generate content" />
          </button>
        </div>
      )}
      {items && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {items.map((c) => (
            <div key={c.id} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1/1', background: 'var(--cf-surface-2)' }}>
                <img src={API.contentImageUrl(c.id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                     onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.hook || c.topic || '—'}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="pill" style={{ fontSize: 10 }}>{c.status}</span>
                  {(c.platforms || []).map((p) => <Icon key={p} name={p} size={14} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashShell>
  );
};
window.LibraryPage = LibraryPage;

// ---- Router ----
const PAGE_COMPONENTS = {
  profile: () => <ProfilePage />,
  topics: () => <TopicsPage />,
  generate: () => <GeneratePage />,
  avatar: () => <AvatarPage />,
  automation: () => <AutomationPage />,
  analytics: () => <AnalyticsPage />,
  calendar: () => <CalendarPage />,
  library: () => <LibraryPage />,
};

const FullScreenLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 14, fontFamily: 'var(--cf-font)', background: 'var(--cf-bg)' }}>
    <div style={{ width: 38, height: 38, borderRadius: 999, border: '3px solid var(--cf-border)',
      borderTopColor: 'var(--cf-primary)', animation: 'pp-spin .7s linear infinite' }} />
    <style>{`@keyframes pp-spin{to{transform:rotate(360deg)}}`}</style>
    <span style={{ fontSize: 13, color: 'var(--cf-ink-2)' }}>PostPost</span>
  </div>
);

// Error boundary — one bad page must not blank the whole app
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[PostPost] page error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 48, fontFamily: 'var(--cf-font)' }}>
          <div className="card" style={{ padding: 28, maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
            <Icon name="alert" size={30} style={{ color: 'var(--cf-danger)' }} />
            <h2 className="h2" style={{ marginTop: 12 }}>หน้านี้เกิดข้อผิดพลาด</h2>
            <p className="muted" style={{ fontSize: 13 }}>{String(this.state.error && this.state.error.message || this.state.error)}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => location.reload()}>โหลดใหม่</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Root = () => {
  const { view, page } = useApp();
  let content;
  if (view === 'loading') content = <FullScreenLoader />;
  else if (view === 'landing') content = <Landing />;
  else if (view === 'login' || view === 'signup') content = <Login />;
  else if (view === 'onboarding') content = <Onboarding />;
  else content = (PAGE_COMPONENTS[page] || PAGE_COMPONENTS.generate)();
  return <><ErrorBoundary key={view + ':' + page}>{content}</ErrorBoundary><Toaster /></>;
};

const App = () => (
  <LangProvider>
    <AppProvider>
      <Root />
    </AppProvider>
  </LangProvider>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
