// Automation Log, Analytics, Calendar pages

// ============== STATUS PILL ==============
const StatusPill = ({ status }) => {
  const t = useT();
  const map = {
    published: { bg: 'var(--cf-success-soft)', fg: '#166534', border: '#C8EBD2', dot: 'var(--cf-success)', label: { th: 'โพสต์สำเร็จ', en: 'Posted' } },
    scheduled: { bg: 'var(--cf-accent-soft)', fg: '#1D4ED8', border: '#DBE5FF', dot: 'var(--cf-accent)', label: { th: 'รอเวลา', en: 'Scheduled' } },
    running: { bg: 'var(--cf-primary-soft)', fg: '#9A3412', border: '#FED7AA', dot: 'var(--cf-primary)', label: { th: 'กำลังโพสต์', en: 'Posting' } },
    processing: { bg: 'var(--cf-primary-soft)', fg: '#9A3412', border: '#FED7AA', dot: 'var(--cf-primary)', label: { th: 'กำลังโพสต์', en: 'Posting' } },
    failed: { bg: 'var(--cf-danger-soft)', fg: '#991B1B', border: '#FBCFCE', dot: 'var(--cf-danger)', label: { th: 'ล้มเหลว', en: 'Failed' } },
    retry: { bg: 'var(--cf-warning-soft)', fg: '#92400E', border: '#FCD9A8', dot: 'var(--cf-warning)', label: { th: 'รอ retry', en: 'Retrying' } },
    draft: { bg: 'var(--cf-surface-2)', fg: 'var(--cf-ink-2)', border: 'var(--cf-border)', dot: 'var(--cf-ink-3)', label: { th: 'แบบร่าง', en: 'Draft' } },
  };
  const s = map[status] || map.published;
  return (
    <span className="pill" style={{
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      fontSize: 12, fontWeight: 500,
    }}>
      <span className="dot" style={{ background: s.dot, width: 6, height: 6 }} />
      {t(s.label)}
    </span>
  );
};

const ChannelDot = ({ icon, status }) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <Icon name={icon} size={18} style={{ opacity: status === 'pending' ? 0.4 : 1 }} />
    <span className="dot" style={{
      position: 'absolute', bottom: -2, right: -2,
      width: 7, height: 7, borderRadius: 999,
      background: status === 'ok' ? 'var(--cf-success)'
        : status === 'fail' ? 'var(--cf-danger)'
        : status === 'pending' ? 'var(--cf-warning)' : 'var(--cf-ink-3)',
      border: '1.5px solid white',
    }} />
  </div>
);

// status of a platform inside a content row
function platformDotStatus(contentStatus) {
  if (contentStatus === 'published') return 'ok';
  if (contentStatus === 'failed') return 'fail';
  return 'pending';
}
function fmtTime(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return isNaN(d) ? '--:--' : d.toTimeString().slice(0, 5);
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ============== AUTOMATION LOG ==============
const AutomationPage = () => {
  const t = useT();
  const app = useApp();
  const [contents, setContents] = React.useState(null);
  const [summary, setSummary] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        API.content.list().catch(() => ({ contents: [] })),
        API.analytics.summary().catch(() => null),
      ]);
      setContents(c.contents || []);
      setSummary(s);
    } catch (e) {
      app.toast(t({ th: 'โหลดข้อมูลไม่สำเร็จ: ', en: 'Load failed: ' }) + e.message, 'error');
      setContents([]);
    } finally { setLoading(false); }
  }, []); // eslint-disable-line

  React.useEffect(() => { load(); }, [load]);

  const retry = async (id) => {
    setBusyId(id);
    try {
      await API.content.retry(id);
      app.toast(t({ th: 'สั่ง retry แล้ว — cron จะรันใน 1 นาที', en: 'Retry queued — cron runs within 1 min' }), 'success');
      load();
    } catch (e) {
      app.toast(t({ th: 'retry ไม่สำเร็จ: ', en: 'Retry failed: ' }) + e.message, 'error');
    } finally { setBusyId(null); }
  };

  const runNow = async () => {
    try {
      const r = await API.automation.runNow();
      app.toast(t({ th: `รันแล้ว — ประมวลผล ${r.processed || 0} โพสต์`, en: `Done — processed ${r.processed || 0} posts` }), 'success');
      load();
    } catch (e) {
      app.toast(t({ th: 'รันไม่สำเร็จ: ', en: 'Run failed: ' }) + e.message, 'error');
    }
  };

  const rows = (contents || []).map((c) => ({
    id: c.id,
    time: fmtTime(c.scheduled_at || c.created_at),
    date: fmtDate(c.scheduled_at || c.created_at),
    topic: c.topic || c.hook || '—',
    hook: c.hook || '',
    platforms: c.platforms || [],
    status: c.status === 'processing' ? 'running' : (c.status || 'draft'),
    kind: c.series_images_b64 ? t({ th: 'อัลบั้ม', en: 'Album' }) : t({ th: 'รูปเดี่ยว', en: 'Single image' }),
    error: c.last_error,
  }));
  const filtered = rows.filter((r) => {
    const fOk = filter === 'all'
      || (filter === 'published' && r.status === 'published')
      || (filter === 'scheduled' && r.status === 'scheduled')
      || (filter === 'failed' && r.status === 'failed')
      || (filter === 'draft' && r.status === 'draft');
    const qOk = !q || (r.topic + ' ' + r.hook).toLowerCase().includes(q.toLowerCase());
    return fOk && qOk;
  });

  const cnt = (st) => rows.filter((r) => r.status === st).length;
  const stat = summary && summary.contents ? summary.contents : null;
  const cards = [
    { v: stat ? stat.published : 0, l: { th: 'โพสต์สำเร็จ (เดือนนี้)', en: 'Posted' }, icon: 'check-circle', color: 'var(--cf-success)' },
    { v: stat ? stat.scheduled : 0, l: { th: 'รอเวลา', en: 'Scheduled' }, icon: 'clock', color: 'var(--cf-accent)' },
    { v: stat ? stat.failed : 0, l: { th: 'ล้มเหลว / ต้องแก้', en: 'Failed / needs attention' }, icon: 'alert', color: 'var(--cf-danger)' },
    { v: stat && stat.total ? Math.round((stat.published / stat.total) * 100) + '%' : '—', l: { th: 'อัตราสำเร็จ', en: 'Success rate' }, icon: 'trending-up', color: 'var(--cf-primary)' },
  ];

  const exportCsv = () => {
    const head = 'time,date,topic,hook,platforms,status\n';
    const body = rows.map((r) => [r.time, r.date, r.topic, r.hook, (r.platforms || []).join('|'), r.status]
      .map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([head + body], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'postpost-automation.csv'; a.click();
    URL.revokeObjectURL(a.href);
    app.toast(t({ th: 'ดาวน์โหลด CSV แล้ว', en: 'CSV exported' }), 'success');
  };

  const filterBtns = [
    { id: 'all', l: { th: 'ทั้งหมด', en: 'All' }, n: rows.length },
    { id: 'published', l: { th: 'สำเร็จ', en: 'Posted' }, n: cnt('published') },
    { id: 'scheduled', l: { th: 'รอเวลา', en: 'Scheduled' }, n: cnt('scheduled') },
    { id: 'failed', l: { th: 'ล้มเหลว', en: 'Failed' }, n: cnt('failed'), danger: true },
    { id: 'draft', l: { th: 'แบบร่าง', en: 'Draft' }, n: cnt('draft') },
  ];

  return (
    <DashShell active="automation" crumb="Automation Log">
      <PageHeader
        title="Automation Log"
        subtitle={<T th="ดูประวัติการโพสต์อัตโนมัติทั้งหมด · เห็นเหตุผลทันทีเมื่อโพสต์ล้มเหลว" en="History of every auto-post · see why a post failed at a glance" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
              <Icon name="download" size={15} />
              <T th="Export CSV" en="Export CSV" />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={runNow}>
              <Icon name="play" size={15} />
              <T th="รันคิวตอนนี้" en="Run queue now" />
            </button>
            <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
              <Icon name="refresh" size={15} />
              {loading ? <T th="กำลังโหลด…" en="Loading…" /> : <T th="รีเฟรช" en="Refresh" />}
            </button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {cards.map((s, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: s.color + '15', color: s.color, marginBottom: 10,
            }}>
              <Icon name={s.icon} size={16} />
            </div>
            <div className="h-display" style={{ fontSize: 26 }}>{s.v}</div>
            <div style={{ fontSize: 12, color: 'var(--cf-ink-2)', marginTop: 2 }}>{t(s.l)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--cf-surface-2)', borderRadius: 10, border: '1px solid var(--cf-border)' }}>
          {filterBtns.map((f) => {
            const on = filter === f.id;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                font: 'inherit', cursor: 'pointer',
                padding: '6px 12px', borderRadius: 7, border: 'none',
                fontSize: 13, fontWeight: 500,
                background: on ? 'white' : 'transparent',
                color: on ? 'var(--cf-ink-0)' : 'var(--cf-ink-2)',
                boxShadow: on ? 'var(--cf-shadow-1)' : 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {t(f.l)}
                <span style={{
                  padding: '0 6px', borderRadius: 999,
                  background: f.danger ? 'var(--cf-danger-soft)' : 'var(--cf-surface-2)',
                  color: f.danger ? '#991B1B' : 'var(--cf-ink-2)',
                  fontSize: 11,
                }}>{f.n}</span>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', width: 260 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--cf-ink-3)' }} />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t({ th: 'ค้นหาตามหัวข้อ / hook', en: 'Search topic / hook' })}
            style={{ height: 36, paddingLeft: 32, background: 'white' }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '110px 1fr 130px 140px 130px 36px',
          padding: '12px 18px', gap: 12,
          fontSize: 11, fontWeight: 600, color: 'var(--cf-ink-2)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          background: 'var(--cf-surface-2)',
          borderBottom: '1px solid var(--cf-border)',
        }}>
          <div><T th="เวลา" en="Time" /></div>
          <div><T th="หัวข้อ / Hook" en="Topic / hook" /></div>
          <div><T th="ช่องทาง" en="Channels" /></div>
          <div><T th="สถานะ" en="Status" /></div>
          <div><T th="ประเภท" en="Type" /></div>
          <div></div>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--cf-ink-2)' }}>
            <Icon name="list" size={28} style={{ color: 'var(--cf-ink-3)' }} />
            <p style={{ marginTop: 8 }}>
              {loading ? <T th="กำลังโหลด…" en="Loading…" />
                : <T th="ยังไม่มีคอนเทนต์ — สร้างจากหน้า Generate" en="No content yet — create one from Generate" />}
            </p>
          </div>
        )}

        {filtered.map((r, i) => (
          <div key={r.id}>
            <div style={{
              display: 'grid', gridTemplateColumns: '110px 1fr 130px 140px 130px 36px',
              padding: '14px 18px', gap: 12, alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--cf-border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{r.time}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>{r.date}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cf-ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.topic}</div>
                {r.hook && <div style={{ fontSize: 12, color: 'var(--cf-ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{r.hook}"</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {r.platforms.map((p, j) => <ChannelDot key={j} icon={p} status={platformDotStatus(r.status)} />)}
              </div>
              <div><StatusPill status={r.status} /></div>
              <div style={{ fontSize: 12, color: 'var(--cf-ink-1)' }}>{r.kind}</div>
              <button className="btn btn-ghost btn-sm" style={{ width: 28, padding: 0, color: 'var(--cf-ink-2)' }}>
                <Icon name="chev-right" size={14} />
              </button>
            </div>
            {r.status === 'failed' && (
              <div style={{
                display: 'flex', gap: 10, alignItems: 'center',
                margin: '0 18px 14px 138px',
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--cf-danger-soft)', border: '1px solid #FBCFCE',
                fontSize: 12, color: '#991B1B',
              }}>
                <Icon name="alert" size={14} />
                <span style={{ flex: 1 }}>{r.error || t({ th: 'โพสต์ล้มเหลว — กด retry เพื่อลองใหม่', en: 'Post failed — hit retry to try again' })}</span>
                <button className="btn btn-ghost btn-sm" disabled={busyId === r.id}
                  onClick={() => retry(r.id)}
                  style={{ height: 24, padding: '0 8px', fontSize: 11, color: '#991B1B' }}>
                  <Icon name="refresh" size={11} /> <T th="Retry ตอนนี้" en="Retry now" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--cf-ink-2)' }}>
        <T th="แสดง" en="Showing" /> {filtered.length} / {rows.length} <T th="รายการ" en="items" />
      </div>
    </DashShell>
  );
};

// ============== ANALYTICS ==============
const Spark = ({ data, color }) => {
  const w = 96, h = 30;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h}>
      <polygon points={area} fill={color + '20'} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const AnalyticsPage = () => {
  const t = useT();
  const app = useApp();
  const [summary, setSummary] = React.useState(null);
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [range, setRange] = React.useState(30);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        API.analytics.summary().catch(() => null),
        API.analytics.posts(5).catch(() => ({ posts: [] })),
      ]);
      setSummary(s);
      setPosts(p.posts || []);
    } catch (e) {
      app.toast(t({ th: 'โหลด analytics ไม่สำเร็จ', en: 'Failed to load analytics' }), 'error');
    } finally { setLoading(false); }
  }, []); // eslint-disable-line
  React.useEffect(() => { load(); }, [load]);

  const refreshMetrics = async () => {
    try {
      const r = await API.analytics.refreshMetrics(10);
      app.toast(t({ th: `อัปเดตเมตริก ${r.refreshed || 0} โพสต์`, en: `Refreshed ${r.refreshed || 0} posts` }), 'success');
      load();
    } catch (e) {
      app.toast(t({ th: 'อัปเดตเมตริกไม่สำเร็จ: ', en: 'Refresh failed: ' }) + e.message, 'error');
    }
  };

  const c = summary && summary.contents ? summary.contents : {};
  const byPlat = summary && summary.by_platform ? summary.by_platform : {};
  const platTotal = (byPlat.facebook || 0) + (byPlat.instagram || 0) + (byPlat.tiktok || 0) || 1;

  const days = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const fb = [12, 8, 16, 14, 22, 18, 20, 26, 32, 28, 38];
  const ig = [8, 6, 10, 12, 14, 11, 14, 18, 22, 21, 27];
  const tt = [2, 3, 4, 5, 6, 4, 8, 9, 12, 14, 19];
  const maxAll = Math.max(...fb, ...ig, ...tt) * 1.2;

  const kpis = [
    { v: c.publishedThisMonth != null ? c.publishedThisMonth : 0, l: { th: 'โพสต์เดือนนี้', en: 'Posts this month' }, color: 'var(--cf-primary)', data: [22, 28, 24, 31, 36, 33, 42, 48, 52, 58, 64] },
    { v: c.publishedThisWeek != null ? c.publishedThisWeek : 0, l: { th: 'โพสต์สัปดาห์นี้', en: 'Posts this week' }, color: 'var(--cf-accent)', data: [14, 18, 16, 20, 22, 24, 26, 28, 32, 36, 42] },
    { v: c.scheduled != null ? c.scheduled : 0, l: { th: 'รอโพสต์', en: 'Scheduled' }, color: '#16A34A', data: [10, 12, 11, 14, 12, 15, 14, 17, 18, 19, 20] },
    { v: c.total != null ? c.total : 0, l: { th: 'คอนเทนต์ทั้งหมด', en: 'Total content' }, color: '#94A3B8', data: [22, 20, 24, 22, 26, 24, 22, 20, 22, 21, 20] },
  ];

  return (
    <DashShell active="analytics" crumb="Analytics">
      <PageHeader
        title="Analytics"
        subtitle={<T th="ภาพรวมประสิทธิภาพคอนเทนต์ · ดึงข้อมูลจาก FB/IG/TikTok โดยตรง" en="Content performance · pulled from FB/IG/TikTok directly" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setRange(range === 30 ? 7 : 30)}>
              <Icon name="calendar" size={15} />
              {range === 30 ? <T th="30 วันล่าสุด" en="Last 30 days" /> : <T th="7 วันล่าสุด" en="Last 7 days" />}
              <Icon name="chev-down" size={12} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={refreshMetrics} disabled={loading}>
              <Icon name="refresh" size={15} />
              <T th="อัปเดตเมตริก" en="Refresh metrics" />
            </button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--cf-ink-2)', fontWeight: 500 }}>{t(k.l)}</div>
                <div className="h-display" style={{ fontSize: 30, marginTop: 4 }}>{k.v}</div>
              </div>
              <Spark data={k.data} color={k.color} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 className="h3"><T th="โพสต์ต่อวัน · แยกช่องทาง" en="Posts per day · by channel" /></h3>
              <p className="micro" style={{ margin: '2px 0 0' }}><T th="แนวโน้ม 11 วันล่าสุด" en="Last 11-day trend" /></p>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: '#1877F2', width: 8, height: 8 }} />Facebook</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: '#E1306C', width: 8, height: 8 }} />Instagram</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: '#0F172A', width: 8, height: 8 }} />TikTok</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200, padding: '0 4px' }}>
            {days.map((d, i) => (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', justifyContent: 'center' }}>
                  <div style={{ width: 10, height: `${(fb[i] / maxAll) * 100}%`, background: '#1877F2', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ width: 10, height: `${(ig[i] / maxAll) * 100}%`, background: '#E1306C', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ width: 10, height: `${(tt[i] / maxAll) * 100}%`, background: '#0F172A', borderRadius: '4px 4px 0 0' }} />
                </div>
                <span style={{ fontSize: 11, color: i === 10 ? 'var(--cf-primary)' : 'var(--cf-ink-2)', fontWeight: i === 10 ? 700 : 500 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h3 className="h3" style={{ marginBottom: 16 }}>
            <T th="คอนเทนต์ตามช่องทาง" en="Content by channel" />
          </h3>
          {[
            { icon: 'facebook', name: 'Facebook', key: 'facebook', color: '#1877F2' },
            { icon: 'instagram', name: 'Instagram', key: 'instagram', color: '#E1306C' },
            { icon: 'tiktok', name: 'TikTok', key: 'tiktok', color: '#0F172A' },
          ].map(p => {
            const v = byPlat[p.key] || 0;
            const pct = Math.round((v / platTotal) * 100);
            return (
              <div key={p.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Icon name={p.icon} size={18} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--cf-ink-0)' }}>{p.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600 }}>{v}</span>
                  <span style={{ fontSize: 11, color: 'var(--cf-ink-2)', width: 40, textAlign: 'right' }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--cf-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: p.color, borderRadius: 999 }} />
                </div>
              </div>
            );
          })}

          <hr className="divider" style={{ margin: '20px 0' }} />

          <h3 className="h3" style={{ marginBottom: 12, fontSize: 14 }}>
            <T th="สถานะคอนเทนต์" en="Content status" />
          </h3>
          {[
            { l: { th: 'โพสต์แล้ว', en: 'Published' }, v: c.published || 0, color: 'var(--cf-success)' },
            { l: { th: 'รอเวลา', en: 'Scheduled' }, v: c.scheduled || 0, color: 'var(--cf-accent)' },
            { l: { th: 'แบบร่าง', en: 'Draft' }, v: c.draft || 0, color: '#94A3B8' },
            { l: { th: 'ล้มเหลว', en: 'Failed' }, v: c.failed || 0, color: 'var(--cf-danger)' },
          ].map((tt2, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
              <span className="dot" style={{ background: tt2.color, width: 8, height: 8 }} />
              <span style={{ flex: 1, color: 'var(--cf-ink-1)' }}>{t(tt2.l)}</span>
              <b style={{ color: 'var(--cf-ink-0)' }}>{tt2.v}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="h3">
            <T th="โพสต์ล่าสุด" en="Recent posts" />
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => app.navigate('library')}><T th="ดูทั้งหมด" en="View all" /></button>
        </div>
        {posts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--cf-ink-2)', fontSize: 13 }}>
            <T th="ยังไม่มีโพสต์ที่เผยแพร่" en="No published posts yet" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {posts.map((p, idx) => (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 120px',
                alignItems: 'center', gap: 14,
                padding: '12px 12px', borderRadius: 10,
                background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)',
              }}>
                <div className="h-display" style={{ fontSize: 22, color: 'var(--cf-ink-3)' }}>{idx + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {(p.platforms || []).slice(0, 1).map((ch) => <Icon key={ch} name={ch} size={18} />)}
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cf-ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.hook || p.topic || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--cf-ink-2)' }}>{fmtDate(p.published_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashShell>
  );
};

// ============== CALENDAR ==============
const CAL_DRAFTS = [
  { id: 'd1', topic: { th: 'ทำไมต้องเลือก Organic? — ส่วนผสมจากใจ', en: 'Why organic? Ingredients with heart' }, kind: 'album', ch: ['facebook', 'instagram'] },
  { id: 'd2', topic: { th: 'รวมรีวิวลูกค้าเดือนนี้ — 12 รีวิวจริง', en: '12 real customer reviews this month' }, kind: 'single', ch: ['facebook'] },
  { id: 'd3', topic: { th: 'Reels: ส่วนผสม Rose Repair 30 วินาที', en: 'Reels: Rose Repair ingredients in 30s' }, kind: 'avatar', ch: ['tiktok', 'instagram'] },
  { id: 'd4', topic: { th: 'Sheet Mask · 7 step ก่อนนอน', en: 'Sheet Mask · 7-step bedtime routine' }, kind: 'single', ch: ['instagram', 'facebook'] },
  { id: 'd5', topic: { th: 'Tip ป้องกันสิว ๆ ที่คางช่วง PMS', en: 'PMS chin-acne prevention tip' }, kind: 'single', ch: ['facebook'] },
];

const DraftCard = ({ d, onSchedule, onTomorrow, busy }) => {
  const t = useT();
  const kindIcon = d.kind === 'album' ? 'layers' : d.kind === 'avatar' ? 'video' : 'square';
  return (
    <div style={{
      padding: 12, borderRadius: 10,
      background: 'var(--cf-surface)',
      border: '1px solid var(--cf-border)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: 'var(--cf-surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cf-primary)',
        }}>
          <Icon name={kindIcon} size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cf-ink-0)', lineHeight: 1.4 }}>
            {t(d.topic)}
          </div>
          <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
            {d.ch.map(c => <Icon key={c} name={c} size={12} />)}
            <span style={{ fontSize: 10, color: 'var(--cf-ink-3)', marginLeft: 4 }}>
              {d.kind === 'album' ? <T th="อัลบั้ม" en="Album" /> : d.kind === 'avatar' ? 'Reels' : <T th="รูปเดี่ยว" en="Single" />}
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSchedule} disabled={busy} className="btn btn-primary btn-sm" style={{ flex: 1, height: 28, fontSize: 12 }}>
          <Icon name="calendar" size={12} />
          <T th="ตั้งเวลาวันนี้" en="Schedule today" />
        </button>
        <button onClick={onTomorrow} disabled={busy} className="btn btn-secondary btn-sm" style={{ height: 28, fontSize: 12 }}>
          <T th="พรุ่งนี้" en="Tomorrow" />
        </button>
      </div>
    </div>
  );
};

const DayEvent = ({ e }) => {
  const t = useT();
  const chColor = e.ch === 'facebook' ? '#1877F2' : e.ch === 'instagram' ? '#E1306C' : '#0F172A';
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '12px 14px', borderRadius: 10,
      background: 'var(--cf-surface)', border: '1px solid var(--cf-border)',
    }}>
      <div style={{
        width: 56, textAlign: 'center', flexShrink: 0,
        padding: '6px 0', borderRadius: 8,
        background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{e.time}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Icon name={e.ch} size={14} />
          <span style={{ fontSize: 11, color: chColor, fontWeight: 600, textTransform: 'capitalize' }}>{e.ch}</span>
          <span style={{ marginLeft: 'auto' }}>
            <StatusPill status={e.status} />
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cf-ink-0)', lineHeight: 1.4 }}>
          {t(e.topic)}
        </div>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const t = useT();
  const app = useApp();
  const now = new Date();
  const [cursor, setCursor] = React.useState({ y: now.getFullYear(), m: now.getMonth() }); // m: 0-11
  const [selectedDay, setSelectedDay] = React.useState(now.getDate());
  const [view, setView] = React.useState('month');
  const [contents, setContents] = React.useState([]);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const d = await API.content.list();
      setContents(d.contents || []);
    } catch (e) { setContents([]); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const monthNames = { th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
  const monthLabel = `${t(monthNames)[cursor.m]} ${cursor.y}`;
  const start = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const isThisMonth = cursor.y === now.getFullYear() && cursor.m === now.getMonth();
  const today = isThisMonth ? now.getDate() : -1;
  const chColor = ch => ch === 'facebook' ? '#1877F2' : ch === 'instagram' ? '#E1306C' : '#0F172A';

  // build events keyed by day-of-month from real content
  const events = {};
  contents.forEach((c) => {
    const iso = c.scheduled_at || c.created_at;
    if (!iso) return;
    const d = new Date(iso);
    if (isNaN(d) || d.getFullYear() !== cursor.y || d.getMonth() !== cursor.m) return;
    const day = d.getDate();
    (events[day] = events[day] || []).push({
      ch: (c.platforms && c.platforms[0]) || 'facebook',
      topic: { th: c.topic || c.hook || '—', en: c.topic || c.hook || '—' },
      time: fmtTime(iso),
      status: c.status === 'processing' ? 'running' : (c.status || 'draft'),
    });
  });

  const cells = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayEvents = events[selectedDay] || [];
  const dayLabel = selectedDay ? `${selectedDay} ${t(monthNames)[cursor.m]} ${cursor.y}` : '';
  const weekdayNames = { th: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
  const dayOfWeek = selectedDay ? new Date(cursor.y, cursor.m, selectedDay).getDay() : 0;

  const published = dayEvents.filter(e => e.status === 'published').length;
  const scheduled = dayEvents.filter(e => e.status === 'scheduled').length;
  const failed = dayEvents.filter(e => e.status === 'failed').length;

  const shiftMonth = (delta) => {
    let m = cursor.m + delta, y = cursor.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCursor({ y, m });
  };
  const goToday = () => { setCursor({ y: now.getFullYear(), m: now.getMonth() }); setSelectedDay(now.getDate()); };

  const scheduleDraft = async (d, dayOffset) => {
    setBusy(true);
    try {
      const when = new Date(cursor.y, cursor.m, selectedDay || now.getDate());
      when.setDate(when.getDate() + (dayOffset || 0));
      when.setHours(19, 0, 0, 0);
      await API.content.create({
        course: 'PFB',
        hook: t(d.topic),
        topic: t(d.topic),
        platforms: d.ch,
        status: 'scheduled',
        scheduled_at: when.toISOString(),
      });
      app.toast(t({ th: 'ตั้งเวลาโพสต์แล้ว', en: 'Scheduled' }), 'success');
      load();
    } catch (e) {
      app.toast(t({ th: 'ตั้งเวลาไม่สำเร็จ: ', en: 'Schedule failed: ' }) + e.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <DashShell active="calendar" crumb="Calendar">
      <PageHeader
        title={<T th="ปฏิทินคอนเทนต์" en="Content Calendar" />}
        subtitle={<T th="ภาพรวมทั้งเดือน · คลิกวันเพื่อดูรายละเอียดและตั้งเวลา Draft" en="Whole-month overview · click a day to see details and schedule drafts" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={load}>
              <Icon name="refresh" size={15} />
              <T th="รีเฟรช" en="Refresh" />
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => app.navigate('generate')}>
              <Icon name="plus" size={15} />
              <T th="สร้างโพสต์ใหม่" en="New post" />
            </button>
          </>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button className="btn btn-secondary btn-sm" style={{ width: 38, padding: 0 }} onClick={() => shiftMonth(-1)}>
          <Icon name="chev-left" size={15} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cf-ink-0)', minWidth: 180, textAlign: 'center' }}>{monthLabel}</div>
        <button className="btn btn-secondary btn-sm" style={{ width: 38, padding: 0 }} onClick={() => shiftMonth(1)}>
          <Icon name="chev-right" size={15} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={goToday}><T th="วันนี้" en="Today" /></button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, padding: 4, background: 'var(--cf-surface-2)', borderRadius: 10, border: '1px solid var(--cf-border)' }}>
          {[
            { id: 'month', l: { th: 'เดือน', en: 'Month' } },
            { id: 'list', l: { th: 'รายการ', en: 'List' } },
          ].map((v) => {
            const on = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                font: 'inherit', cursor: 'pointer',
                padding: '6px 14px', borderRadius: 7, border: 'none',
                fontSize: 13, fontWeight: 500,
                background: on ? 'white' : 'transparent',
                color: on ? 'var(--cf-ink-0)' : 'var(--cf-ink-2)',
                boxShadow: on ? 'var(--cf-shadow-1)' : 'none',
              }}>{t(v.l)}</button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Month grid OR list */}
        {view === 'month' ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--cf-border)', background: 'var(--cf-surface-2)' }}>
              {[{ th: 'อา.', en: 'Sun' }, { th: 'จ.', en: 'Mon' }, { th: 'อ.', en: 'Tue' }, { th: 'พ.', en: 'Wed' }, { th: 'พฤ.', en: 'Thu' }, { th: 'ศ.', en: 'Fri' }, { th: 'ส.', en: 'Sat' }].map((d, i) => (
                <div key={i} style={{
                  padding: '10px 10px', fontSize: 11, fontWeight: 600,
                  color: (i === 0 || i === 6) ? 'var(--cf-primary)' : 'var(--cf-ink-2)',
                  textAlign: 'left',
                  borderRight: i < 6 ? '1px solid var(--cf-border)' : 'none',
                }}>{t(d)}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {cells.map((d, idx) => {
                const isToday = d === today;
                const isSelected = d === selectedDay;
                const isWeekend = idx % 7 === 0 || idx % 7 === 6;
                const evs = d ? (events[d] || []) : [];
                return (
                  <button key={idx} onClick={() => d && setSelectedDay(d)} disabled={!d}
                    style={{
                      font: 'inherit', textAlign: 'left',
                      cursor: d ? 'pointer' : 'default',
                      minHeight: 96, padding: 8,
                      borderRight: (idx % 7 !== 6) ? '1px solid var(--cf-border)' : 'none',
                      borderBottom: idx < cells.length - 7 ? '1px solid var(--cf-border)' : 'none',
                      background: !d ? 'var(--cf-surface-2)'
                        : isSelected ? 'var(--cf-primary-soft)'
                        : isWeekend ? 'rgba(246,245,241,0.5)' : 'white',
                      border: 'none',
                      outline: isSelected ? '2px solid var(--cf-primary)' : 'none',
                      outlineOffset: '-2px', position: 'relative',
                    }}>
                    {d && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{
                            fontSize: 12, fontWeight: isToday ? 700 : 500,
                            color: isToday ? 'white' : 'var(--cf-ink-1)',
                            width: 22, height: 22, borderRadius: 999,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: isToday ? 'var(--cf-primary)' : 'transparent',
                          }}>{d}</span>
                          {evs.length > 0 && <span style={{ fontSize: 10, color: 'var(--cf-ink-2)' }}>{evs.length}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {evs.slice(0, 2).map((e, j) => (
                            <div key={j} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '2px 5px', borderRadius: 4,
                              fontSize: 9, fontWeight: 500,
                              background: chColor(e.ch) + '15', color: chColor(e.ch),
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              <span className="dot" style={{ background: chColor(e.ch), width: 4, height: 4, flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.time}</span>
                            </div>
                          ))}
                          {evs.length > 2 && (
                            <div style={{ fontSize: 9, color: 'var(--cf-ink-2)', padding: '0 5px' }}>
                              +{evs.length - 2} <T th="อื่นๆ" en="more" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 14, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.keys(events).length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--cf-ink-2)', fontSize: 13 }}>
                <T th="ไม่มีโพสต์ในเดือนนี้" en="No posts this month" />
              </div>
            )}
            {Object.keys(events).sort((a, b) => a - b).map((day) => (
              <div key={day}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cf-ink-2)', margin: '6px 0' }}>{day} {t(monthNames)[cursor.m]}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {events[day].map((e, i) => <DayEvent key={i} e={e} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Day detail panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 18, borderColor: 'var(--cf-primary)', borderWidth: '1.5px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--cf-primary)', marginBottom: 4 }}>
                  {t(weekdayNames)[dayOfWeek]}
                </div>
                <h3 className="h2" style={{ margin: 0, fontSize: 24 }}>{dayLabel}</h3>
                {selectedDay === today && (
                  <span style={{ fontSize: 12, color: 'var(--cf-primary)', fontWeight: 600 }}>
                    <T th="วันนี้" en="Today" />
                  </span>
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => app.navigate('generate')}>
                <Icon name="plus" size={13} />
                <T th="เพิ่มโพสต์" en="Add post" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 14, paddingTop: 12, borderTop: '1px dashed var(--cf-border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cf-success)' }}>{published}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}><T th="โพสต์แล้ว" en="Posted" /></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cf-accent)' }}>{scheduled}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}><T th="รอเวลา" en="Scheduled" /></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: failed ? 'var(--cf-danger)' : 'var(--cf-ink-3)' }}>{failed}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}><T th="ล้มเหลว" en="Failed" /></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="h3"><T th="โพสต์ในวันนี้" en="Posts on this day" /></h3>
              {dayEvents.length > 0 && <span className="micro">{dayEvents.length} <T th="โพสต์" en="posts" /></span>}
            </div>
            {dayEvents.length === 0 ? (
              <div style={{
                padding: '40px 24px', textAlign: 'center',
                background: 'var(--cf-surface-2)', borderRadius: 10,
                border: '1px dashed var(--cf-border-2)',
              }}>
                <Icon name="calendar" size={32} style={{ color: 'var(--cf-ink-3)', marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cf-ink-1)', marginBottom: 4 }}>
                  <T th="ยังไม่มีโพสต์ในวันนี้" en="No posts scheduled" />
                </div>
                <div style={{ fontSize: 12, color: 'var(--cf-ink-2)' }}>
                  <T th="กดตั้งเวลา Draft จากด้านล่าง" en="Schedule a draft below" />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayEvents.map((e, i) => <DayEvent key={i} e={e} />)}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 18, background: 'linear-gradient(180deg, var(--cf-surface) 0%, #FFFBEB 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 className="h3">
                <T th="คอนเทนต์ Draft" en="Drafts" />
                <span style={{
                  marginLeft: 8, padding: '1px 8px', borderRadius: 999,
                  background: 'var(--cf-primary-soft)', color: '#9A3412',
                  fontSize: 11, fontWeight: 600,
                }}>{CAL_DRAFTS.length}</span>
              </h3>
            </div>
            <p className="micro" style={{ marginBottom: 12 }}>
              <T th="ตั้งเวลาให้โพสต์ในวันที่เลือกได้เลย" en="Schedule any draft into the selected day" />
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CAL_DRAFTS.slice(0, 4).map(d => (
                <DraftCard key={d.id} d={d} busy={busy}
                  onSchedule={() => scheduleDraft(d, 0)}
                  onTomorrow={() => scheduleDraft(d, 1)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashShell>
  );
};

window.AutomationPage = AutomationPage;
window.AnalyticsPage = AnalyticsPage;
window.CalendarPage = CalendarPage;
