// ============================================================
// api.jsx — PostPost frontend runtime
// API client (talks to the oem-content-factory backend that now
// lives in ../backend) + global app store (auth, routing, toasts).
// No build step: loaded as a <script type="text/babel">.
// ============================================================

const API_BASE = ''; // same origin — backend serves this file
const TOKEN_KEY = 'postpost_token';

const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };

// Core request helper — attaches the JWT, parses JSON, throws on error.
async function req(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const tok = getToken();
  if (auth && tok) headers['Authorization'] = `Bearer ${tok}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — backend รันอยู่หรือไม่?');
  }

  if (raw) return res;
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) { try { data = await res.json(); } catch {} }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Public URL for a saved content's rendered image (resized by the backend).
function contentImageUrl(id, { platform = 'facebook', ratio } = {}) {
  const q = new URLSearchParams({ platform });
  if (ratio) q.set('ratio', ratio);
  return `${API_BASE}/api/public/content-image/${id}?${q}`;
}

const API = {
  getToken, setToken, contentImageUrl,

  health: () => req('/api/health', { auth: false }),

  auth: {
    login: (email, password) => req('/api/auth/login', { method: 'POST', auth: false, body: { email, password } }),
    signup: (payload) => req('/api/auth/signup', { method: 'POST', auth: false, body: payload }),
    me: () => req('/api/auth/me'),
  },

  content: {
    list: () => req('/api/content/'),
    get: (id) => req(`/api/content/${id}`),
    create: (body) => req('/api/content/', { method: 'POST', body }),
    update: (id, patch) => req(`/api/content/${id}`, { method: 'PATCH', body: patch }),
    remove: (id) => req(`/api/content/${id}`, { method: 'DELETE' }),
    retry: (id) => req(`/api/content/${id}/retry`, { method: 'POST' }),
    retryAllFailed: () => req('/api/content/retry-all-failed', { method: 'POST' }),
  },

  ai: {
    topics: (body) => req('/api/ai/topics', { method: 'POST', body }),
    caption: (body) => req('/api/ai/caption', { method: 'POST', body }),
    generateAll: (body) => req('/api/ai/generate-all', { method: 'POST', body }),
    image: (body) => req('/api/ai/image', { method: 'POST', body }),
    brandVoiceGet: (course = 'PFB') => req(`/api/ai/brand-voice?course=${course}`),
    brandVoiceSet: (body) => req('/api/ai/brand-voice', { method: 'POST', body }),
    brandDescription: (body) => req('/api/ai/brand-description', { method: 'POST', body }),
    avatarScript: (body) => req('/api/ai/avatar-script', { method: 'POST', body }),
    creditBalance: () => req('/api/ai/credit-balance'),
    imageModels: () => req('/api/ai/image-models'),
  },

  automation: {
    postMulti: (body) => req('/api/automation/post-multi', { method: 'POST', body }),
    logs: () => req('/api/automation/logs'),
    runNow: () => req('/api/automation/run-now', { method: 'POST' }),
    scheduled: () => req('/api/automation/scheduled'),
  },

  analytics: {
    summary: () => req('/api/analytics/summary'),
    posts: (limit = 20) => req(`/api/analytics/posts?limit=${limit}`),
    top: (metric = 'post_engaged_users', limit = 10) => req(`/api/analytics/top?metric=${metric}&limit=${limit}`),
    refreshMetrics: (limit = 10) => req(`/api/analytics/refresh-metrics?limit=${limit}`, { method: 'POST' }),
    costs: () => req('/api/analytics/costs'),
  },

  facebook: { connectionsAll: () => req('/api/facebook/connections-all') },
  instagram: { connection: (course = 'PFB') => req(`/api/instagram/connection?course=${course}`) },
  tiktok: { connectionsAll: () => req('/api/tiktok/connections-all') },

  workspace: {
    get: () => req('/api/workspace/'),
    set: (state) => req('/api/workspace/', { method: 'PUT', body: { state } }),
  },
};

// ============================================================
// App store — auth + routing + toasts
// ============================================================

const AppCtx = React.createContext(null);
const useApp = () => React.useContext(AppCtx);

// Dashboard pages reachable from the sidebar.
const APP_PAGES = ['profile', 'topics', 'generate', 'avatar', 'automation', 'analytics', 'calendar', 'library'];

function parseHash() {
  const h = (location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'app') return { view: 'app', page: APP_PAGES.includes(parts[1]) ? parts[1] : 'generate' };
  if (['landing', 'login', 'signup', 'onboarding'].includes(parts[0])) return { view: parts[0], page: 'generate' };
  return null;
}

const AppProvider = ({ children }) => {
  const [view, setViewState] = React.useState('loading'); // loading|landing|login|signup|onboarding|app
  const [page, setPageState] = React.useState('generate');
  const [auth, setAuth] = React.useState({ token: getToken(), user: null, tenant: null });
  const [toasts, setToasts] = React.useState([]);

  const toast = React.useCallback((msg, kind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  // keep the URL hash in sync so refresh / deep-link works
  const syncHash = (v, p) => {
    const want = v === 'app' ? `#/app/${p}` : `#/${v}`;
    if (location.hash !== want) { try { history.replaceState(null, '', want); } catch {} }
  };

  const navigate = React.useCallback((p) => {
    setPageState(p);
    setViewState('app');
    syncHash('app', p);
    window.scrollTo(0, 0);
  }, []);

  const setView = React.useCallback((v) => {
    setViewState(v);
    syncHash(v, page);
  }, [page]);

  const applySession = (data) => {
    if (data.token) { setToken(data.token); }
    setAuth({ token: data.token || getToken(), user: data.user || null, tenant: data.tenant || null });
  };

  const login = async (email, password) => {
    const data = await API.auth.login(email, password);
    applySession(data);
    navigate('generate');
    toast('เข้าสู่ระบบสำเร็จ', 'success');
    return data;
  };

  const signup = async (payload) => {
    const data = await API.auth.signup(payload);
    applySession(data);
    setViewState('onboarding'); syncHash('onboarding');
    toast('สร้างบัญชีสำเร็จ', 'success');
    return data;
  };

  const logout = React.useCallback(() => {
    setToken('');
    setAuth({ token: '', user: null, tenant: null });
    setViewState('login'); syncHash('login');
  }, []);

  // Boot: validate any stored token, then route.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const hashRoute = parseHash();
      if (getToken()) {
        try {
          const me = await API.auth.me();
          if (!alive) return;
          setAuth((a) => ({ ...a, user: me.user || null, tenant: me.tenant || null }));
          if (hashRoute && hashRoute.view === 'app') { setPageState(hashRoute.page); setViewState('app'); }
          else { setViewState('app'); syncHash('app', page); }
          return;
        } catch {
          setToken('');
        }
      }
      if (!alive) return;
      if (hashRoute && hashRoute.view !== 'app') setViewState(hashRoute.view);
      else setViewState('landing');
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line

  const value = {
    view, page, auth, navigate, setView, login, signup, logout, toast, toasts,
    isAuthed: !!auth.token,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
};

// Toast stack — fixed bottom-right
const Toaster = () => {
  const { toasts } = useApp();
  const color = { success: 'var(--cf-success)', error: 'var(--cf-danger)', info: 'var(--cf-accent)' };
  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: 'var(--cf-surface)', border: '1px solid var(--cf-border)',
          borderLeft: `3px solid ${color[t.kind] || color.info}`,
          borderRadius: 10, padding: '11px 16px', boxShadow: 'var(--cf-shadow-3)',
          fontSize: 13, color: 'var(--cf-ink-0)', maxWidth: 360, fontFamily: 'var(--cf-font)',
        }}>{t.msg}</div>
      ))}
    </div>
  );
};

window.API = API;
window.useApp = useApp;
window.AppProvider = AppProvider;
window.Toaster = Toaster;
window.APP_PAGES = APP_PAGES;
