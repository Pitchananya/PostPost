// Inline Lucide-style outline icons. 1.75 stroke, currentColor.
const Icon = ({ name, size = 18, stroke = 1.75, className, style }) => {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: stroke,
    strokeLinecap: "round", strokeLinejoin: "round",
    className, style,
  };
  switch (name) {
    case "sparkles": return (
      <svg {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2.2"/></svg>
    );
    case "wand": return (
      <svg {...p}><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15.8 7.8 17 9M3 21l9-9M12.2 6.2 13 7"/></svg>
    );
    case "calendar": return (
      <svg {...p}><rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/></svg>
    );
    case "library": return (
      <svg {...p}><path d="M3 4h4v16H3zM10 6h4v14h-4zM17 9l3 1 -3 11"/></svg>
    );
    case "settings": return (
      <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
    );
    case "search": return (
      <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
    );
    case "bell": return (
      <svg {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
    );
    case "chev-down": return (<svg {...p}><path d="m6 9 6 6 6-6"/></svg>);
    case "chev-right": return (<svg {...p}><path d="m9 6 6 6-6 6"/></svg>);
    case "chev-left": return (<svg {...p}><path d="m15 6-6 6 6 6"/></svg>);
    case "check": return (<svg {...p}><path d="M20 6 9 17l-5-5"/></svg>);
    case "check-circle": return (<svg {...p}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>);
    case "x": return (<svg {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>);
    case "plus": return (<svg {...p}><path d="M12 5v14M5 12h14"/></svg>);
    case "image": return (<svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>);
    case "send": return (<svg {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>);
    case "clock": return (<svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>);
    case "refresh": return (<svg {...p}><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/></svg>);
    case "copy": return (<svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
    case "edit": return (<svg {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>);
    case "link": return (<svg {...p}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>);
    case "play": return (<svg {...p}><polygon points="6 4 20 12 6 20 6 4"/></svg>);
    case "rocket": return (<svg {...p}><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2 2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 22 2a12.9 12.9 0 0 1-3.05 11.05A21 21 0 0 1 15 15zM9 12H4s.55-3 2-4h4M12 15v5s3-.55 4-2v-4"/></svg>);
    case "shield": return (<svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
    case "facebook": return (<svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style}><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85V15.47H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.96h-1.52c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12"/></svg>);
    case "instagram": return (<svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style}><defs><linearGradient id="igg" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FED576"/><stop offset="26%" stopColor="#F47133"/><stop offset="61%" stopColor="#BC3081"/><stop offset="100%" stopColor="#4C63D2"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#igg)"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="white" strokeWidth="1.6"/><circle cx="17.4" cy="6.6" r="1.1" fill="white"/></svg>);
    case "tiktok": return (<svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style}><path fill="#000" d="M19.6 6.7c-1.5-.3-2.8-1.2-3.6-2.4-.3-.5-.5-1-.6-1.6h-3.2v12.5c-.1 1.3-1.2 2.3-2.5 2.3-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c.3 0 .5 0 .8.1V9.5a5.9 5.9 0 0 0-6.4 5.9 5.9 5.9 0 0 0 5.9 5.9 5.9 5.9 0 0 0 5.9-5.9V9.7c1.2.9 2.6 1.4 4.1 1.4V7.9c-.2 0-.3-.1-.4-.1z"/><path fill="#25F4EE" d="M18 5.3c-.3-.5-.5-1-.6-1.6h-1.3c.4 1.7 1.4 3.1 2.8 4-.4-.7-.7-1.5-.9-2.4z"/><path fill="#FE2C55" d="M9.7 11.4a5.9 5.9 0 0 0-5.6 5.9 5.9 5.9 0 0 0 5.9 5.9 5.9 5.9 0 0 0 5.9-5.9V9.7c1.2.9 2.6 1.4 4.1 1.4V7.9c-.9 0-1.7-.3-2.4-.7-1.4-.9-2.4-2.3-2.8-4h-1.7v12.5c-.1 1.3-1.2 2.3-2.5 2.3-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c.3 0 .5 0 .8.1v-1.7z"/></svg>);
    case "google": return (<svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style}><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.3-4.9 3.3-7.9z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.3 1-3.6 1a6.3 6.3 0 0 1-5.9-4.3H2.4v2.7C4.2 20.6 7.9 23 12 23z"/><path fill="#FBBC05" d="M6.1 14.4a6.4 6.4 0 0 1 0-4l-3.7-2.8a11 11 0 0 0 0 9.5l3.7-2.7z"/><path fill="#EA4335" d="M12 5.7c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 12 1C7.9 1 4.2 3.4 2.4 6.7l3.7 2.7A6.3 6.3 0 0 1 12 5.7z"/></svg>);
    case "logo": return (
      <svg viewBox="0 0 28 28" width={size} height={size} className={className} style={style}>
        <rect x="2" y="2" width="24" height="24" rx="7" fill="#F97316"/>
        <path d="M9 11.5C9 9.6 10.6 8 12.5 8h3a3.5 3.5 0 0 1 0 7H12c-.3 0-.5.2-.5.5v3a1 1 0 0 1-2 0v-7z" fill="#fff"/>
        <circle cx="17.5" cy="17.5" r="1.6" fill="#FFF7ED"/>
      </svg>
    );
    case "menu-dots": return (<svg {...p}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>);
    case "globe": return (<svg {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>);
    case "zap": return (<svg {...p}><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg>);
    case "heart": return (<svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.7 1-1a5.5 5.5 0 0 0 0-7.7z"/></svg>);
    case "comment": return (<svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.5 8.5 0 1 1 21 11.5z"/></svg>);
    case "share": return (<svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>);
    case "users": return (<svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>);
    case "bot": return (<svg {...p}><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 4v4M8 14h.01M16 14h.01M9 18h6"/><circle cx="12" cy="2" r="1"/></svg>);
    case "video": return (<svg {...p}><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/></svg>);
    case "play-circle": return (<svg {...p}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>);
    case "mic": return (<svg {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>);
    case "chart": return (<svg {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-6"/></svg>);
    case "trending-up": return (<svg {...p}><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>);
    case "store": return (<svg {...p}><path d="M3 9 4 4h16l1 5M5 9v11h14V9M9 13h6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></svg>);
    case "package": return (<svg {...p}><path d="m7.5 4.27 9 5.15M21 8 12 13 3 8M3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8z"/></svg>);
    case "layers": return (<svg {...p}><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>);
    case "list": return (<svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>);
    case "alert": return (<svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>);
    case "info": return (<svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>);
    case "external": return (<svg {...p}><path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>);
    case "upload": return (<svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>);
    case "download": return (<svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>);
    case "trash": return (<svg {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>);
    case "drag": return (<svg {...p}><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>);
    case "filter": return (<svg {...p}><polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5"/></svg>);
    case "type": return (<svg {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>);
    case "wand2": return (<svg {...p}><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15.8 7.8 17 9M3 21l9-9"/></svg>);
    case "grid": return (<svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>);
    case "square": return (<svg {...p}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>);
    case "newspaper": return (<svg {...p}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V8h4M18 14H10M18 18H10M10 6h8v4h-8z"/></svg>);
    case "lightbulb": return (<svg {...p}><path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c1 1 1.5 2 1.5 3.5h5c0-1.5.5-2.5 1.5-3.5A6 6 0 0 0 12 2z"/></svg>);
    case "tag": return (<svg {...p}><path d="M20.6 13.4 13.4 20.6a1.5 1.5 0 0 1-2.1 0L2 11.3V2h9.3l9.3 9.3a1.5 1.5 0 0 1 0 2.1z"/><circle cx="7" cy="7" r="1.2"/></svg>);
    case "thumbs-up": return (<svg {...p}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>);
    default: return null;
  }
};

window.Icon = Icon;
