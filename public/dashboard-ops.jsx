// Automation Log, Analytics, Calendar pages

// ============== STATUS PILL ==============
const StatusPill = ({ status }) => {
  const t = useT();
  const map = {
    published: { bg: 'var(--cf-success-soft)', fg: '#166534', border: '#C8EBD2', dot: 'var(--cf-success)', label: { th: 'โพสต์สำเร็จ', en: 'Posted' } },
    scheduled: { bg: 'var(--cf-accent-soft)', fg: '#1D4ED8', border: '#DBE5FF', dot: 'var(--cf-accent)', label: { th: 'รอเวลา', en: 'Scheduled' } },
    running: { bg: 'var(--cf-primary-soft)', fg: '#9A3412', border: '#FED7AA', dot: 'var(--cf-primary)', label: { th: 'กำลังโพสต์', en: 'Posting' } },
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

// ============== AUTOMATION LOG ==============
const AutomationPage = () => {
  const t = useT();
  const rows = [
    { t: '19:00', date: { th: '11 พ.ย.', en: 'Nov 11' }, topic: { th: 'โปร 11.11 Rose Repair Serum ลด 50%', en: '11.11 sale · Rose Repair Serum 50% off' }, hook: { th: 'ผิวบอบบางใช่ไหมคะ?', en: 'Got sensitive skin?' }, ch: [['facebook','ok'],['instagram','ok']], status: 'published', cost: 4, kind: { th: 'อัลบั้ม 6 ภาพ', en: 'Album · 6 images' } },
    { t: '17:30', date: { th: '11 พ.ย.', en: 'Nov 11' }, topic: { th: 'รีวิวจริง Toner Pad — ลูกค้าใช้จริง', en: 'Real review · Toner Pad' }, hook: { th: 'ใช้แค่ 7 วัน...', en: 'Just 7 days...' }, ch: [['facebook','ok'],['instagram','fail']], status: 'failed', cost: 4, kind: { th: 'รูปเดี่ยว', en: 'Single image' }, err: { th: 'IG · token หมดอายุ — กดเชื่อมต่อใหม่', en: 'IG · token expired — reconnect to fix' } },
    { t: '15:00', date: { th: '11 พ.ย.', en: 'Nov 11' }, topic: { th: 'Rose Mist Spray — ตัวใหม่!', en: 'Rose Mist Spray — new!' }, hook: { th: 'หลังเลิกงานเหนื่อย ๆ', en: 'After a long workday' }, ch: [['facebook','ok'],['instagram','ok'],['tiktok','ok']], status: 'published', cost: 6, kind: { th: 'Reels (อวตาร)', en: 'Reels (avatar)' } },
    { t: '12:00', date: { th: '11 พ.ย.', en: 'Nov 11' }, topic: { th: 'Lunch break — ส่วนผสมในเซรั่ม', en: 'Lunch break · serum ingredients' }, hook: { th: 'รู้ไหม? ดอกกุหลาบเขาใหญ่...', en: 'Did you know? Khao Yai roses...' }, ch: [['facebook','pending'],['instagram','pending']], status: 'running', cost: 4, kind: { th: 'อัลบั้ม 3 ภาพ', en: 'Album · 3 images' } },
    { t: '21:00', date: { th: '11 พ.ย.', en: 'Nov 11' }, topic: { th: 'ปิดท้ายวัน — เคล็ดลับผิวก่อนนอน', en: 'Closing the day · bedtime routine' }, hook: { th: 'ก่อนนอนทำ 3 step นี้', en: 'Try these 3 steps before bed' }, ch: [['facebook','pending'],['instagram','pending']], status: 'scheduled', cost: 4, kind: { th: 'รูปเดี่ยว', en: 'Single image' } },
    { t: '09:00', date: { th: '12 พ.ย.', en: 'Nov 12' }, topic: { th: 'Sheet Mask Monday', en: 'Sheet Mask Monday' }, hook: { th: 'จันทร์ทั้งที ต้อง mask', en: 'It\'s Monday — mask up' }, ch: [['facebook','pending'],['instagram','pending']], status: 'scheduled', cost: 4, kind: { th: 'รูปเดี่ยว', en: 'Single image' } },
    { t: '11:30', date: { th: '11 พ.ย.', en: 'Nov 11' }, topic: { th: 'Set Beauty Trio — Bundle Deal', en: 'Beauty Trio Bundle Deal' }, hook: { th: 'ครบจบทั้งเซตเดียว', en: 'Everything in one set' }, ch: [['facebook','fail']], status: 'retry', cost: 4, kind: { th: 'อัลบั้ม 4 ภาพ', en: 'Album · 4 images' }, err: { th: 'FB · request timeout — retry อัตโนมัติใน 5 นาที', en: 'FB · request timeout — auto-retry in 5 min' } },
  ];

  return (
    <DashShell active="automation" crumb="Automation Log">
      <PageHeader
        title="Automation Log"
        subtitle={<T th="ดูประวัติการโพสต์อัตโนมัติทั้งหมด · เห็นเหตุผลทันทีเมื่อโพสต์ล้มเหลว" en="History of every auto-post · see why a post failed at a glance" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm">
              <Icon name="download" size={15} />
              <T th="Export CSV" en="Export CSV" />
            </button>
            <button className="btn btn-primary btn-sm">
              <Icon name="refresh" size={15} />
              <T th="รีเฟรช" en="Refresh" />
            </button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { v: '218', l: { th: 'โพสต์สำเร็จ (เดือนนี้)', en: 'Posted (this month)' }, icon: 'check-circle', color: 'var(--cf-success)' },
          { v: '12', l: { th: 'รอเวลา', en: 'Scheduled' }, icon: 'clock', color: 'var(--cf-accent)' },
          { v: '2', l: { th: 'ล้มเหลว / ต้องแก้', en: 'Failed / needs attention' }, icon: 'alert', color: 'var(--cf-danger)' },
          { v: '98.4%', l: { th: 'อัตราสำเร็จ', en: 'Success rate' }, icon: 'trending-up', color: 'var(--cf-primary)' },
        ].map((s, i) => (
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
          {[
            { l: { th: 'ทั้งหมด', en: 'All' }, n: 218, on: true },
            { l: { th: 'สำเร็จ', en: 'Posted' }, n: 195 },
            { l: { th: 'รอเวลา', en: 'Scheduled' }, n: 12 },
            { l: { th: 'ล้มเหลว', en: 'Failed' }, n: 2, danger: true },
            { l: { th: 'Retry', en: 'Retry' }, n: 1 },
          ].map((f, i) => (
            <button key={i} style={{
              font: 'inherit', cursor: 'pointer',
              padding: '6px 12px', borderRadius: 7, border: 'none',
              fontSize: 13, fontWeight: 500,
              background: f.on ? 'white' : 'transparent',
              color: f.on ? 'var(--cf-ink-0)' : 'var(--cf-ink-2)',
              boxShadow: f.on ? 'var(--cf-shadow-1)' : 'none',
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
          ))}
        </div>
        <button className="btn btn-secondary btn-sm">
          <Icon name="filter" size={14} />
          <T th="ช่องทาง: ทั้งหมด" en="Channel: All" />
          <Icon name="chev-down" size={12} />
        </button>
        <button className="btn btn-secondary btn-sm">
          <Icon name="calendar" size={14} />
          <T th="7 วันล่าสุด" en="Last 7 days" />
          <Icon name="chev-down" size={12} />
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', width: 260 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--cf-ink-3)' }} />
          <input className="input" placeholder={t({ th: 'ค้นหาตามหัวข้อ / hook', en: 'Search topic / hook' })} style={{ height: 36, paddingLeft: 32, background: 'white' }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '110px 1fr 130px 140px 130px 110px 36px',
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
          <div style={{ textAlign: 'right' }}><T th="เครดิต" en="Credits" /></div>
          <div></div>
        </div>

        {rows.map((r, i) => (
          <div key={i}>
            <div style={{
              display: 'grid', gridTemplateColumns: '110px 1fr 130px 140px 130px 110px 36px',
              padding: '14px 18px', gap: 12, alignItems: 'center',
              borderBottom: i < rows.length - 1 ? '1px solid var(--cf-border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{r.t}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>{t(r.date)}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cf-ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(r.topic)}</div>
                <div style={{ fontSize: 12, color: 'var(--cf-ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{t(r.hook)}"</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {r.ch.map(([ic, st], j) => <ChannelDot key={j} icon={ic} status={st} />)}
              </div>
              <div><StatusPill status={r.status} /></div>
              <div style={{ fontSize: 12, color: 'var(--cf-ink-1)' }}>{t(r.kind)}</div>
              <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--cf-ink-1)', fontWeight: 500 }}>{r.cost}</div>
              <button className="btn btn-ghost btn-sm" style={{ width: 28, padding: 0, color: 'var(--cf-ink-2)' }}>
                <Icon name="chev-right" size={14} />
              </button>
            </div>
            {r.err && (
              <div style={{
                display: 'flex', gap: 10, alignItems: 'center',
                margin: '0 18px 14px 138px',
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--cf-danger-soft)', border: '1px solid #FBCFCE',
                fontSize: 12, color: '#991B1B',
              }}>
                <Icon name="alert" size={14} />
                <span style={{ flex: 1 }}>{t(r.err)}</span>
                <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 8px', fontSize: 11, color: '#991B1B' }}>
                  <Icon name="refresh" size={11} /> <T th="Retry ตอนนี้" en="Retry now" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 12, color: 'var(--cf-ink-2)' }}>
        <span><T th="แสดง 7 จาก 218 รายการ" en="Showing 7 of 218" /></span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5 }}>
            <Icon name="chev-left" size={13} /> <T th="ก่อนหน้า" en="Prev" />
          </button>
          <button className="btn btn-ghost btn-sm">
            <T th="ถัดไป" en="Next" /> <Icon name="chev-right" size={13} />
          </button>
        </div>
      </div>
    </DashShell>
  );
};

// ============== ANALYTICS ==============
const AnalyticsPage = () => {
  const t = useT();
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

  const days = ['1','2','3','4','5','6','7','8','9','10','11'];
  const fb = [12, 8, 16, 14, 22, 18, 20, 26, 32, 28, 38];
  const ig = [8, 6, 10, 12, 14, 11, 14, 18, 22, 21, 27];
  const tt = [2, 3, 4, 5, 6, 4, 8, 9, 12, 14, 19];
  const maxAll = Math.max(...fb, ...ig, ...tt) * 1.2;

  return (
    <DashShell active="analytics" crumb="Analytics">
      <PageHeader
        title="Analytics"
        subtitle={<T th="ภาพรวมประสิทธิภาพคอนเทนต์ · ดึงข้อมูลจาก FB/IG/TikTok โดยตรง" en="Content performance · pulled from FB/IG/TikTok directly" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm">
              <Icon name="calendar" size={15} />
              <T th="30 วันล่าสุด" en="Last 30 days" />
              <Icon name="chev-down" size={12} />
            </button>
            <button className="btn btn-secondary btn-sm">
              <Icon name="download" size={15} />
              <T th="Export" en="Export" />
            </button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { v: '124.8k', l: { th: 'การเข้าถึง (Reach)', en: 'Reach' }, delta: '+18.4%', up: true, color: 'var(--cf-primary)', data: [22, 28, 24, 31, 36, 33, 42, 48, 52, 58, 64] },
          { v: '8,420', l: { th: 'Engagement', en: 'Engagement' }, delta: '+22.1%', up: true, color: 'var(--cf-accent)', data: [14, 18, 16, 20, 22, 24, 26, 28, 32, 36, 42] },
          { v: '2,184', l: { th: 'คลิกที่ลิงก์', en: 'Link clicks' }, delta: '+4.2%', up: true, color: '#16A34A', data: [10, 12, 11, 14, 12, 15, 14, 17, 18, 19, 20] },
          { v: '218', l: { th: 'โพสต์ทั้งหมด', en: 'Total posts' }, delta: '-2.3%', up: false, color: '#94A3B8', data: [22, 20, 24, 22, 26, 24, 22, 20, 22, 21, 20] },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--cf-ink-2)', fontWeight: 500 }}>{t(k.l)}</div>
                <div className="h-display" style={{ fontSize: 30, marginTop: 4 }}>{k.v}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: k.up ? 'var(--cf-success)' : 'var(--cf-danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <Icon name={k.up ? 'trending-up' : 'chart'} size={13} />
                  {k.delta}
                </div>
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
              <p className="micro" style={{ margin: '2px 0 0' }}><T th="1–11 พ.ย. 2026" en="Nov 1–11, 2026" /></p>
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
            <T th="การมีส่วนร่วมตามช่องทาง" en="Engagement by channel" />
          </h3>
          {[
            { icon: 'facebook', name: 'Facebook', v: '4,820', pct: 57, color: '#1877F2' },
            { icon: 'instagram', name: 'Instagram', v: '2,820', pct: 33, color: '#E1306C' },
            { icon: 'tiktok', name: 'TikTok', v: '780', pct: 10, color: '#0F172A' },
          ].map(p => (
            <div key={p.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon name={p.icon} size={18} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--cf-ink-0)' }}>{p.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600 }}>{p.v}</span>
                <span style={{ fontSize: 11, color: 'var(--cf-ink-2)', width: 40, textAlign: 'right' }}>{p.pct}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--cf-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${p.pct}%`, height: '100%', background: p.color, borderRadius: 999 }} />
              </div>
            </div>
          ))}

          <hr className="divider" style={{ margin: '20px 0' }} />

          <h3 className="h3" style={{ marginBottom: 12, fontSize: 14 }}>
            <T th="ประเภทคอนเทนต์ที่ทำผลงานดี" en="Top-performing content types" />
          </h3>
          {[
            { l: { th: 'Reels (Talking Avatar)', en: 'Reels (Talking Avatar)' }, v: '38%', color: 'var(--cf-primary)' },
            { l: { th: 'อัลบั้ม / Carousel', en: 'Album / Carousel' }, v: '32%', color: 'var(--cf-accent)' },
            { l: { th: 'รูปเดี่ยว + แคปชั่นยาว', en: 'Single image + long caption' }, v: '22%', color: '#16A34A' },
            { l: { th: 'Story', en: 'Story' }, v: '8%', color: '#94A3B8' },
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
            <T th="โพสต์ Top 5 — Engagement สูงสุด" en="Top 5 posts — highest engagement" />
          </h3>
          <button className="btn btn-ghost btn-sm"><T th="ดูทั้งหมด" en="View all" /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { rank: 1, topic: { th: 'รีวิวลูกค้าจริง: ผิวบอบบาง 10 ปี เจอตัวช่วย', en: 'Real review: 10 years of sensitive skin, finally fixed' }, ch: 'facebook', reach: '38.2k', eng: '4.2k', clicks: '892' },
            { rank: 2, topic: { th: 'อัลบั้ม Before/After 7 วัน Rose Repair', en: 'Before/After album · 7 days of Rose Repair' }, ch: 'instagram', reach: '24.1k', eng: '2.8k', clicks: '512' },
            { rank: 3, topic: { th: 'Reels: คุยกับน้องโรส — ส่วนผสมลับใน 30 วิ', en: 'Reels: Rose talks · 30-sec secret ingredient' }, ch: 'tiktok', reach: '21.6k', eng: '2.1k', clicks: '— ', kind: 'avatar' },
            { rank: 4, topic: { th: '11.11 Beauty Trio ลด 50%', en: '11.11 Beauty Trio · 50% off' }, ch: 'facebook', reach: '19.4k', eng: '1.8k', clicks: '724' },
            { rank: 5, topic: { th: 'สเปรย์ Rose Mist · เคล็ดลับฉีดก่อนทาครีม', en: 'Rose Mist · the secret spritz before cream' }, ch: 'instagram', reach: '14.2k', eng: '1.2k', clicks: '218' },
          ].map(p => (
            <div key={p.rank} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 90px 90px 90px',
              alignItems: 'center', gap: 14,
              padding: '12px 12px', borderRadius: 10,
              background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)',
            }}>
              <div className="h-display" style={{ fontSize: 22, color: 'var(--cf-ink-3)' }}>{p.rank}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Icon name={p.ch} size={18} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cf-ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t(p.topic)}
                    {p.kind === 'avatar' && <span className="pill pill-blue" style={{ marginLeft: 6, height: 18, fontSize: 10 }}>Avatar</span>}
                  </div>
                </div>
              </div>
              {[['Reach', p.reach], ['Engagement', p.eng], ['Clicks', p.clicks]].map(([l, v]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--cf-ink-2)' }}>{l}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DashShell>
  );
};

// ============== CALENDAR (with day-detail drawer + drafts) ==============

// Centralized event data
const CAL_EVENTS = {
  1: [{ ch: 'facebook', topic: { th: 'เปิดเดือนใหม่ — Hello November', en: 'New month · Hello November' }, time: '10:00', status: 'published', kind: 'single' }],
  2: [
    { ch: 'instagram', topic: { th: 'IG Story โพรโมท', en: 'IG Story promo' }, time: '09:00', status: 'published', kind: 'story' },
    { ch: 'facebook', topic: { th: 'Tip ดูแลผิวยามฝน', en: 'Rainy-day skin tip' }, time: '17:00', status: 'published', kind: 'single' },
  ],
  4: [{ ch: 'tiktok', topic: { th: 'Reels · Talking Avatar น้องโรส', en: 'Reels · Avatar with Rose' }, time: '19:00', status: 'published', kind: 'avatar' }],
  5: [
    { ch: 'facebook', topic: { th: 'รีวิวลูกค้าจริง — 10 ปีผิวบอบบาง', en: 'Real review — 10 years sensitive skin' }, time: '12:00', status: 'published', kind: 'single' },
    { ch: 'instagram', topic: { th: 'Carousel Before/After', en: 'Before/After carousel' }, time: '18:30', status: 'published', kind: 'album' },
  ],
  7: [{ ch: 'facebook', topic: { th: 'โปรพิเศษวันศุกร์', en: 'Friday special' }, time: '15:00', status: 'published', kind: 'single' }],
  8: [{ ch: 'instagram', topic: { th: 'Sheet Mask Sunday', en: 'Sheet Mask Sunday' }, time: '20:00', status: 'published', kind: 'single' }],
  9: [
    { ch: 'facebook', topic: { th: 'Tip ดูแลผิวก่อนนอน', en: 'Bedtime skincare tip' }, time: '21:00', status: 'published', kind: 'single' },
    { ch: 'tiktok', topic: { th: 'Reels ส่วนผสมลับ', en: 'Reels secret ingredient' }, time: '12:30', status: 'published', kind: 'avatar' },
  ],
  10: [
    { ch: 'instagram', topic: { th: 'Pre-launch 11.11 teaser', en: 'Pre-launch 11.11 teaser' }, time: '11:00', status: 'published', kind: 'album' },
    { ch: 'facebook', topic: { th: 'Countdown 11.11 — 1 วัน', en: 'Countdown 11.11 — 1 day' }, time: '20:00', status: 'published', kind: 'single' },
  ],
  11: [
    { ch: 'facebook', topic: { th: '11.11 Big Sale — Rose Repair 50% off', en: '11.11 Big Sale — Rose Repair 50% off' }, time: '00:01', status: 'published', kind: 'album', hot: true },
    { ch: 'instagram', topic: { th: '11.11 Reels — Avatar น้องโรส', en: '11.11 Reels — Rose avatar' }, time: '10:00', status: 'published', kind: 'avatar', hot: true },
    { ch: 'facebook', topic: { th: 'Live 11.11 ตอบคำถาม', en: 'Live 11.11 Q&A' }, time: '15:00', status: 'published', kind: 'single' },
    { ch: 'instagram', topic: { th: 'Toner Pad รีวิวจริง', en: 'Real Toner Pad review' }, time: '17:30', status: 'failed', kind: 'single' },
    { ch: 'facebook', topic: { th: 'Bundle Beauty Trio ลด 50%', en: 'Bundle Beauty Trio 50% off' }, time: '19:00', status: 'published', kind: 'album' },
    { ch: 'facebook', topic: { th: 'ปิดท้ายวัน 11.11', en: 'Closing 11.11 day' }, time: '21:00', status: 'scheduled', kind: 'single' },
  ],
  12: [
    { ch: 'facebook', topic: { th: 'After-sale follow-up', en: 'After-sale follow-up' }, time: '10:00', status: 'scheduled', kind: 'single' },
    { ch: 'instagram', topic: { th: 'Story — ขอบคุณลูกค้า', en: 'Story — thank you customers' }, time: '14:00', status: 'scheduled', kind: 'story' },
  ],
  13: [{ ch: 'tiktok', topic: { th: 'Reels weekend mood', en: 'Reels · weekend mood' }, time: '19:00', status: 'scheduled', kind: 'avatar' }],
  14: [{ ch: 'facebook', topic: { th: 'Weekend tip', en: 'Weekend tip' }, time: '11:00', status: 'scheduled', kind: 'single' }],
  15: [{ ch: 'instagram', topic: { th: 'Carousel skin layering', en: 'Carousel · skin layering' }, time: '18:00', status: 'scheduled', kind: 'album' }],
  17: [
    { ch: 'facebook', topic: { th: 'รีวิวลูกค้า', en: 'Customer review' }, time: '12:00', status: 'scheduled', kind: 'single' },
    { ch: 'instagram', topic: { th: 'IG Reel highlight', en: 'IG Reel highlight' }, time: '20:00', status: 'scheduled', kind: 'avatar' },
  ],
  18: [{ ch: 'tiktok', topic: { th: 'TikTok behind-the-scenes', en: 'TikTok BTS' }, time: '17:00', status: 'scheduled', kind: 'avatar' }],
  19: [{ ch: 'facebook', topic: { th: 'Live Q&A', en: 'Live Q&A' }, time: '20:00', status: 'scheduled', kind: 'single' }],
  21: [
    { ch: 'facebook', topic: { th: 'Tip ผิวแห้ง', en: 'Dry skin tip' }, time: '11:00', status: 'scheduled', kind: 'single' },
    { ch: 'instagram', topic: { th: 'IG carousel routine', en: 'IG carousel · routine' }, time: '18:00', status: 'scheduled', kind: 'album' },
  ],
  22: [{ ch: 'instagram', topic: { th: 'IG Story poll', en: 'IG Story poll' }, time: '15:00', status: 'scheduled', kind: 'story' }],
  24: [{ ch: 'facebook', topic: { th: 'Storytelling แบรนด์เรา', en: 'Brand storytelling' }, time: '19:00', status: 'scheduled', kind: 'single' }],
  25: [{ ch: 'tiktok', topic: { th: 'Reels ตลก ๆ', en: 'Funny Reels' }, time: '17:00', status: 'scheduled', kind: 'avatar' }],
  27: [
    { ch: 'facebook', topic: { th: 'Black Friday Sale', en: 'Black Friday Sale' }, time: '08:00', status: 'scheduled', kind: 'album', hot: true },
    { ch: 'instagram', topic: { th: 'BF carousel', en: 'BF carousel' }, time: '10:00', status: 'scheduled', kind: 'album', hot: true },
    { ch: 'tiktok', topic: { th: 'BF Reels', en: 'BF Reels' }, time: '12:00', status: 'scheduled', kind: 'avatar', hot: true },
  ],
  28: [{ ch: 'facebook', topic: { th: 'Weekend wrap-up', en: 'Weekend wrap-up' }, time: '20:00', status: 'scheduled', kind: 'single' }],
};

const CAL_DRAFTS = [
  { id: 'd1', topic: { th: 'ทำไมต้องเลือก Organic? — ส่วนผสมจากใจ', en: 'Why organic? Ingredients with heart' }, kind: 'album', ch: ['facebook', 'instagram'] },
  { id: 'd2', topic: { th: 'รวมรีวิวลูกค้าเดือนนี้ — 12 รีวิวจริง', en: '12 real customer reviews this month' }, kind: 'single', ch: ['facebook'] },
  { id: 'd3', topic: { th: 'Reels: ส่วนผสม Rose Repair 30 วินาที', en: 'Reels: Rose Repair ingredients in 30s' }, kind: 'avatar', ch: ['tiktok', 'instagram'] },
  { id: 'd4', topic: { th: 'Sheet Mask · 7 step ก่อนนอน', en: 'Sheet Mask · 7-step bedtime routine' }, kind: 'single', ch: ['instagram', 'facebook'] },
  { id: 'd5', topic: { th: 'Tip ป้องกันสิว ๆ ที่คางช่วง PMS', en: 'PMS chin-acne prevention tip' }, kind: 'single', ch: ['facebook'] },
];

const DraftCard = ({ d, onSchedule, onTomorrow }) => {
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
        <button className="btn btn-ghost btn-sm" style={{ width: 26, padding: 0, color: 'var(--cf-ink-3)' }}>
          <Icon name="menu-dots" size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSchedule} className="btn btn-primary btn-sm" style={{ flex: 1, height: 28, fontSize: 12 }}>
          <Icon name="calendar" size={12} />
          <T th="ตั้งเวลาวันนี้" en="Schedule today" />
        </button>
        <button onClick={onTomorrow} className="btn btn-secondary btn-sm" style={{ height: 28, fontSize: 12 }}>
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
          {e.hot && (
            <span className="pill pill-orange" style={{ height: 18, fontSize: 9, fontWeight: 700 }}>
              <Icon name="zap" size={9} />
              HOT
            </span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            <StatusPill status={e.status} />
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cf-ink-0)', lineHeight: 1.4 }}>
          {t(e.topic)}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--cf-ink-2)' }}>
          {e.kind === 'album' ? <T th="อัลบั้ม / Carousel" en="Album / Carousel" />
            : e.kind === 'avatar' ? <T th="Reels · Talking Avatar" en="Reels · Talking Avatar" />
            : e.kind === 'story' ? 'Story'
            : <T th="รูปเดี่ยว" en="Single image" />}
        </div>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const t = useT();
  const [selectedDay, setSelectedDay] = React.useState(11);
  const month = { th: 'พฤศจิกายน 2026', en: 'November 2026' };
  const start = 0; // Sunday
  const daysInMonth = 30;
  const today = 11;
  const chColor = ch => ch === 'facebook' ? '#1877F2' : ch === 'instagram' ? '#E1306C' : '#0F172A';

  const cells = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayEvents = CAL_EVENTS[selectedDay] || [];
  const dayLabel = selectedDay ? `${selectedDay} ${t({ th: 'พฤศจิกายน', en: 'November' })} 2026` : '';
  const weekdayNames = { th: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
  const dayOfWeek = selectedDay ? ((start + selectedDay - 1) % 7) : 0;

  const published = dayEvents.filter(e => e.status === 'published').length;
  const scheduled = dayEvents.filter(e => e.status === 'scheduled').length;
  const failed = dayEvents.filter(e => e.status === 'failed').length;

  return (
    <DashShell active="calendar" crumb="Calendar">
      <PageHeader
        title={<T th="ปฏิทินคอนเทนต์" en="Content Calendar" />}
        subtitle={<T th="ภาพรวมทั้งเดือน · คลิกวันเพื่อดูรายละเอียดและตั้งเวลา Draft" en="Whole-month overview · click a day to see details and schedule drafts" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm">
              <Icon name="filter" size={15} />
              <T th="กรอง" en="Filter" />
            </button>
            <button className="btn btn-primary btn-sm">
              <Icon name="plus" size={15} />
              <T th="สร้างโพสต์ใหม่" en="New post" />
            </button>
          </>
        }
      />

      {/* Top toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button className="btn btn-secondary btn-sm" style={{ width: 38, padding: 0 }}>
          <Icon name="chev-left" size={15} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cf-ink-0)', minWidth: 180, textAlign: 'center' }}>{t(month)}</div>
        <button className="btn btn-secondary btn-sm" style={{ width: 38, padding: 0 }}>
          <Icon name="chev-right" size={15} />
        </button>
        <button className="btn btn-secondary btn-sm"><T th="วันนี้" en="Today" /></button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, padding: 4, background: 'var(--cf-surface-2)', borderRadius: 10, border: '1px solid var(--cf-border)' }}>
          {[
            { l: { th: 'เดือน', en: 'Month' }, on: true },
            { l: { th: 'สัปดาห์', en: 'Week' } },
            { l: { th: 'รายการ', en: 'List' } },
          ].map((v, i) => (
            <button key={i} style={{
              font: 'inherit', cursor: 'pointer',
              padding: '6px 14px', borderRadius: 7, border: 'none',
              fontSize: 13, fontWeight: 500,
              background: v.on ? 'white' : 'transparent',
              color: v.on ? 'var(--cf-ink-0)' : 'var(--cf-ink-2)',
              boxShadow: v.on ? 'var(--cf-shadow-1)' : 'none',
            }}>{t(v.l)}</button>
          ))}
        </div>
      </div>

      {/* Calendar + day detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Month grid */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'flex-start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--cf-border)', background: 'var(--cf-surface-2)' }}>
            {[
              { th: 'อา.', en: 'Sun' },
              { th: 'จ.', en: 'Mon' },
              { th: 'อ.', en: 'Tue' },
              { th: 'พ.', en: 'Wed' },
              { th: 'พฤ.', en: 'Thu' },
              { th: 'ศ.', en: 'Fri' },
              { th: 'ส.', en: 'Sat' },
            ].map((d, i) => (
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
              const evs = d ? (CAL_EVENTS[d] || []) : [];
              return (
                <button key={idx}
                  onClick={() => d && setSelectedDay(d)}
                  disabled={!d}
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
                    outlineOffset: '-2px',
                    position: 'relative',
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
                        {evs.length > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--cf-ink-2)' }}>{evs.length}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {evs.slice(0, 2).map((e, j) => (
                          <div key={j} style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '2px 5px', borderRadius: 4,
                            fontSize: 9, fontWeight: 500,
                            background: e.hot ? chColor(e.ch) : chColor(e.ch) + '15',
                            color: e.hot ? 'white' : chColor(e.ch),
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            <span className="dot" style={{ background: e.hot ? 'white' : chColor(e.ch), width: 4, height: 4, flexShrink: 0 }} />
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

        {/* Day detail panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Day header card */}
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
              <button className="btn btn-primary btn-sm">
                <Icon name="plus" size={13} />
                <T th="เพิ่มโพสต์" en="Add post" />
              </button>
            </div>
            <div style={{
              display: 'flex', gap: 14, paddingTop: 12,
              borderTop: '1px dashed var(--cf-border)',
            }}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cf-success)' }}>{published}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}><T th="โพสต์แล้ว" en="Posted" /></div>
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cf-accent)' }}>{scheduled}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}><T th="รอเวลา" en="Scheduled" /></div>
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: failed ? 'var(--cf-danger)' : 'var(--cf-ink-3)' }}>{failed}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}><T th="ล้มเหลว" en="Failed" /></div>
              </div>
            </div>
          </div>

          {/* Event list */}
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
                  <T th="ลากโพสต์ Draft จากด้านล่างมาวางวันนี้" en="Drag a draft below into this day" />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayEvents.map((e, i) => <DayEvent key={i} e={e} />)}
              </div>
            )}
          </div>

          {/* Drafts panel */}
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
              <button className="btn btn-ghost btn-sm">
                <T th="ดูทั้งหมด" en="See all" />
                <Icon name="chev-right" size={12} />
              </button>
            </div>
            <p className="micro" style={{ marginBottom: 12 }}>
              <T th="ตั้งเวลาให้โพสต์ในวันที่เลือกได้เลย" en="Schedule any draft into the selected day" />
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CAL_DRAFTS.slice(0, 4).map(d => (
                <DraftCard key={d.id} d={d}
                  onSchedule={() => {}}
                  onTomorrow={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 18, fontSize: 12, color: 'var(--cf-ink-2)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: '#1877F2', width: 8, height: 8 }} />Facebook</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: '#E1306C', width: 8, height: 8 }} />Instagram</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: '#0F172A', width: 8, height: 8 }} />TikTok</span>
        <span style={{ marginLeft: 'auto' }}>
          <T th="รวม 38 โพสต์ในเดือนนี้ · 12 รอเวลา · 26 สำเร็จแล้ว" en="38 posts this month · 12 scheduled · 26 posted" />
        </span>
      </div>
    </DashShell>
  );
};

window.AutomationPage = AutomationPage;
window.AnalyticsPage = AnalyticsPage;
window.CalendarPage = CalendarPage;
