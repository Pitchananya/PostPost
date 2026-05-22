// Dashboard shell — sidebar, top bar with FB/IG permissions, page header

const DashSidebar = ({ active }) => {
  const t = useT();
  const app = useApp();
  const sections = [
    {
      title: { th: 'WORKSPACE', en: 'WORKSPACE' },
      items: [
        { id: 'profile', icon: 'users', label: { th: 'Profile', en: 'Profile' } },
        { id: 'topics', icon: 'lightbulb', label: { th: 'Topic Bank', en: 'Topic Bank' } },
        { id: 'generate', icon: 'wand', label: { th: 'สร้างคอนเทนต์', en: 'Generate' } },
        { id: 'avatar', icon: 'bot', label: { th: 'Talking Avatar', en: 'Talking Avatar' }, tag: 'NEW' },
      ],
    },
    {
      title: { th: 'OPERATIONS', en: 'OPERATIONS' },
      items: [
        { id: 'automation', icon: 'play-circle', label: { th: 'Automation Log', en: 'Automation Log' }, badge: '3' },
        { id: 'analytics', icon: 'trending-up', label: { th: 'Analytics', en: 'Analytics' } },
        { id: 'calendar', icon: 'calendar', label: { th: 'ปฏิทิน', en: 'Calendar' }, badge: '12' },
        { id: 'library', icon: 'library', label: { th: 'คลังคอนเทนต์', en: 'Library' } },
      ],
    },
  ];
  return (
    <aside style={{
      width: 248, flex: '0 0 248px',
      background: 'var(--cf-surface)',
      borderRight: '1px solid var(--cf-border)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 14px' }}>
        <Icon name="logo" size={26} />
        <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--cf-ink-0)' }}>PostPost</span>
      </div>

      <button style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 12px', borderRadius: 10,
        background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)',
        cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #FED7AA, #FDBA74)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#7C2D12', fontWeight: 700, fontSize: 13,
        }}>HP</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>HappyPrice Shop</div>
          <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>{t({ th: 'Pro · 2 ทีม', en: 'Pro · 2 seats' })}</div>
        </div>
        <Icon name="chev-down" size={14} style={{ color: 'var(--cf-ink-2)' }} />
      </button>

      <nav style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>
        {sections.map(sec => (
          <div key={sec.title.en} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div className="eyebrow" style={{ padding: '4px 12px 6px', fontSize: 10 }}>{t(sec.title)}</div>
            {sec.items.map(n => (
              <div key={n.id} onClick={() => app.navigate(n.id)} className={`navrow ${active === n.id ? 'is-active' : ''}`}>
                <Icon name={n.icon} size={18} style={{ color: active === n.id ? 'var(--cf-primary)' : 'var(--cf-ink-2)' }} />
                <span style={{ flex: 1 }}>{t(n.label)}</span>
                {n.tag && (
                  <span className="pill pill-blue" style={{ height: 18, fontSize: 9, padding: '0 6px', fontWeight: 700, letterSpacing: '0.04em' }}>{n.tag}</span>
                )}
                {n.badge && <span className="pill" style={{ height: 20, fontSize: 11, padding: '0 8px', background: 'var(--cf-surface)', color: 'var(--cf-ink-2)' }}>{n.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '0 4px' }}>
        <div className="navrow" style={{ padding: '8px 10px', fontSize: 13 }}>
          <Icon name="settings" size={16} style={{ color: 'var(--cf-ink-2)' }} />
          <span><T th="ตั้งค่า" en="Settings" /></span>
        </div>
      </div>
    </aside>
  );
};

const ChannelPerm = ({ icon, name, status, sub }) => {
  const isOk = status === 'connected';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 12px 6px 10px', borderRadius: 999,
      background: isOk ? 'var(--cf-surface)' : 'var(--cf-warning-soft)',
      border: `1px solid ${isOk ? 'var(--cf-border)' : '#FCD9A8'}`,
      cursor: 'pointer',
    }}>
      <Icon name={icon} size={18} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{name}</span>
        <span style={{ fontSize: 10, color: isOk ? 'var(--cf-success)' : 'var(--cf-warning)', fontWeight: 500 }}>{sub}</span>
      </div>
      <span className="dot" style={{
        width: 7, height: 7, marginLeft: 2,
        background: isOk ? 'var(--cf-success)' : 'var(--cf-warning)',
        boxShadow: isOk ? '0 0 0 3px rgba(22,163,74,0.18)' : '0 0 0 3px rgba(217,119,6,0.18)',
      }} />
    </div>
  );
};

const DashTopbar = ({ crumb }) => {
  const t = useT();
  const app = useApp();
  const [menu, setMenu] = React.useState(false);
  const user = app.auth.user || {};
  const displayName = user.name || user.email || t({ th: 'ผู้ใช้งาน', en: 'User' });
  const initial = (displayName.trim()[0] || 'P').toUpperCase();
  return (
  <header style={{
    height: 68, flex: '0 0 68px',
    background: 'var(--cf-surface)',
    borderBottom: '1px solid var(--cf-border)',
    display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--cf-ink-2)' }}>
      <span>Workspace</span>
      <Icon name="chev-right" size={13} />
      <span style={{ color: 'var(--cf-ink-0)', fontWeight: 500 }}>{crumb}</span>
    </div>

    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="eyebrow" style={{ marginRight: 4, fontSize: 10 }}>
        <T th="เชื่อมต่อแล้ว" en="Connected" />
      </span>
      <ChannelPerm icon="facebook" name="HappyPrice" sub={t({ th: 'Page · 24.3k', en: 'Page · 24.3k' })} status="connected" />
      <ChannelPerm icon="instagram" name="@happyprice.sh" sub={t({ th: 'Business · 18.1k', en: 'Business · 18.1k' })} status="connected" />
      <ChannelPerm icon="tiktok" name={t({ th: 'ยังไม่เชื่อม', en: 'Not connected' })} sub={t({ th: 'คลิกเพื่อเชื่อม', en: 'Click to connect' })} status="off" />
    </div>

    <div style={{ width: 1, height: 26, background: 'var(--cf-border)', margin: '0 4px' }} />

    <LangToggle />

    <button className="btn btn-ghost btn-sm" style={{ position: 'relative', width: 38, padding: 0 }}>
      <Icon name="bell" size={18} />
      <span style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, borderRadius: 999, background: 'var(--cf-primary)' }} />
    </button>

    <div style={{ position: 'relative' }}>
      <div onClick={() => setMenu(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div className="ring-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{initial}</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>{user.role || 'Owner'}</div>
        </div>
        <Icon name="chev-down" size={14} style={{ color: 'var(--cf-ink-2)' }} />
      </div>
      {menu && (
        <div style={{
          position: 'absolute', right: 0, top: 46, width: 220, zIndex: 50,
          background: 'var(--cf-surface)', border: '1px solid var(--cf-border)',
          borderRadius: 12, boxShadow: 'var(--cf-shadow-3)', padding: 6,
        }}>
          <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--cf-ink-2)', borderBottom: '1px solid var(--cf-border)', marginBottom: 4 }}>
            {user.email || displayName}
          </div>
          <div className="navrow" style={{ fontSize: 13 }} onClick={() => { setMenu(false); app.navigate('profile'); }}>
            <Icon name="users" size={16} style={{ color: 'var(--cf-ink-2)' }} />
            <span><T th="โปรไฟล์แบรนด์" en="Brand profile" /></span>
          </div>
          <div className="navrow" style={{ fontSize: 13, color: 'var(--cf-danger)' }} onClick={() => { setMenu(false); app.logout(); }}>
            <Icon name="x" size={16} />
            <span><T th="ออกจากระบบ" en="Sign out" /></span>
          </div>
        </div>
      )}
    </div>
  </header>
  );
};

const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, gap: 16 }}>
    <div>
      <h1 className="h-display" style={{ fontSize: 30, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ margin: '6px 0 0', color: 'var(--cf-ink-2)', fontSize: 14 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => {
  const t = useT();
  return (
  <div style={{
    display: 'inline-flex', gap: 4, padding: 4,
    background: 'var(--cf-surface-2)', borderRadius: 12,
    border: '1px solid var(--cf-border)',
    marginBottom: 22,
  }}>
    {tabs.map(tab => {
      const on = tab.id === active;
      return (
        <button key={tab.id} onClick={() => onChange && onChange(tab.id)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 9,
          font: 'inherit', fontSize: 13, fontWeight: 500,
          background: on ? 'white' : 'transparent',
          color: on ? 'var(--cf-ink-0)' : 'var(--cf-ink-2)',
          border: 'none', cursor: 'pointer',
          boxShadow: on ? 'var(--cf-shadow-1)' : 'none',
        }}>
          {tab.icon && <Icon name={tab.icon} size={15} style={{ color: on ? 'var(--cf-primary)' : 'var(--cf-ink-2)' }} />}
          {typeof tab.label === 'object' && tab.label.th ? t(tab.label) : tab.label}
        </button>
      );
    })}
  </div>
  );
};

const DashShell = ({ active, crumb, children }) => (
  <div className="cf" style={{ display: 'flex', flexDirection: 'row' }}>
    <DashSidebar active={active} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DashTopbar crumb={crumb} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--cf-bg)' }}>
        {children}
      </main>
    </div>
  </div>
);

window.DashShell = DashShell;
window.PageHeader = PageHeader;
window.TabBar = TabBar;
