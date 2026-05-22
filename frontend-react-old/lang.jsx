// Language module — TH/EN switcher

const LangCtx = React.createContext({ lang: 'th', setLang: () => {} });

const LangProvider = ({ children }) => {
  const [lang, setLang] = React.useState('th');
  return (
    <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>
  );
};

const useLang = () => React.useContext(LangCtx);

// Hook returning a translator function: t({th, en}) -> string
const useT = () => {
  const { lang } = React.useContext(LangCtx);
  return (obj) => (obj == null ? '' : (obj[lang] != null ? obj[lang] : obj.th));
};

// Component form for JSX text
const T = ({ th, en }) => {
  const { lang } = React.useContext(LangCtx);
  return lang === 'en' ? (en != null ? en : th) : th;
};

// Segmented TH / EN switch
const LangToggle = ({ style, compact }) => {
  const { lang, setLang } = React.useContext(LangCtx);
  return (
    <div style={{
      display: 'inline-flex', padding: 3, gap: 2,
      borderRadius: 999, background: 'var(--cf-surface-2)',
      border: '1px solid var(--cf-border)',
      ...style,
    }}>
      {[
        { id: 'th', label: 'ไทย' },
        { id: 'en', label: 'EN' },
      ].map(l => {
        const on = lang === l.id;
        return (
          <button key={l.id} onClick={() => setLang(l.id)} style={{
            padding: compact ? '3px 9px' : '4px 11px',
            borderRadius: 999,
            font: 'inherit', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: 'pointer', border: 'none',
            background: on ? 'white' : 'transparent',
            color: on ? 'var(--cf-ink-0)' : 'var(--cf-ink-2)',
            boxShadow: on ? 'var(--cf-shadow-1)' : 'none',
            transition: 'background .12s, color .12s',
          }}>{l.label}</button>
        );
      })}
    </div>
  );
};

window.LangProvider = LangProvider;
window.useLang = useLang;
window.useT = useT;
window.T = T;
window.LangToggle = LangToggle;
