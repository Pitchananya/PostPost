import { h, stripEmoji } from './satori-fonts.js';

const COURSE_THEME = {
  PFB:  { primary: '#9a3412', accent: '#fb923c', tagBg: '#fb923c', tagFg: '#ffffff', label: 'PET FOOD BUSINESS' },
  PHE:  { primary: '#3730a3', accent: '#6366f1', tagBg: '#6366f1', tagFg: '#ffffff', label: 'PET HOTEL ENTREPRENEUR' },
  GURU: { primary: '#4C1D95', accent: '#F59E0B', tagBg: '#F59E0B', tagFg: '#1e1b4b', label: 'GURU THEP · TAROT' },
};

const TH_BODY = '"IBM Plex Sans Thai", "Prompt", sans-serif';
const TH_HEADING = '"Prompt", "IBM Plex Sans Thai", sans-serif';

// ================ Common: footer (course pill + footer text) ================
function footerNode({ course, footer, w, h: H, top }) {
  const c = COURSE_THEME[course] || COURSE_THEME.PFB;
  return h('div', {
    style: {
      position: 'absolute',
      left: 50, right: 50, top,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
    h('div', {
      style: {
        display: 'flex',
        backgroundColor: c.tagBg,
        color: c.tagFg,
        fontFamily: TH_HEADING,
        fontWeight: 700,
        fontSize: 24,
        padding: '12px 28px',
        borderRadius: 28,
        letterSpacing: 0.5,
      },
    }, stripEmoji(c.label)),
    h('div', {
      style: {
        display: 'flex',
        color: 'rgba(255,255,255,0.95)',
        fontFamily: TH_BODY,
        fontSize: 22,
        textShadow: '0 2px 6px rgba(0,0,0,0.6)',
      },
    }, stripEmoji(footer || 'oemcontent.co')),
  );
}

// ================ TEMPLATE 1: hero-poster (1080x1080) ================
export function buildHeroPoster({ title = '', subtitle = '', course = 'PFB', footer = 'oemcontent.co' }) {
  const W = 1080, H = 1080;
  const c = COURSE_THEME[course] || COURSE_THEME.PFB;
  return h('div', {
    style: {
      width: W, height: H,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
  },
    // Top dark fade ให้ ribbon ดูชัด
    h('div', {
      style: {
        position: 'absolute', top: 0, left: 0, width: W, height: 320,
        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0))',
      },
    }),
    // Bottom dark fade ให้ pill+footer ดูชัด
    h('div', {
      style: {
        position: 'absolute', bottom: 0, left: 0, width: W, height: 200,
        backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0))',
      },
    }),
    // Title ribbon
    h('div', {
      style: {
        position: 'absolute', top: 50, left: 40, right: 40,
        display: 'flex',
        backgroundColor: c.primary,
        borderRadius: 22,
        padding: '32px 40px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      },
    },
      h('div', {
        style: {
          width: '100%',
          color: 'white',
          fontFamily: TH_HEADING,
          fontWeight: 800,
          fontSize: 64,
          lineHeight: 1.18,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
        },
      }, title),
    ),
    // Subtitle box (ถ้ามี)
    subtitle ? h('div', {
      style: {
        position: 'absolute', top: 250, left: 80, right: 80,
        display: 'flex',
        backgroundColor: 'rgba(15,23,42,0.78)',
        borderRadius: 16,
        padding: '14px 24px',
      },
    },
      h('div', {
        style: {
          width: '100%',
          color: 'white',
          fontFamily: TH_BODY,
          fontWeight: 600,
          fontSize: 28,
          lineHeight: 1.32,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
        },
      }, subtitle),
    ) : null,
    // Footer
    footerNode({ course, footer, w: W, h: H, top: H - 100 }),
  );
}
buildHeroPoster.size = { width: 1080, height: 1080 };

// ================ TEMPLATE 2: qna-card (1080x1350) ================
export function buildQnaCard({ title = '', question = '', answer = '', course = 'PFB', footer = 'oemcontent.co' }) {
  const W = 1080, H = 1350;
  const c = COURSE_THEME[course] || COURSE_THEME.PFB;

  return h('div', {
    style: { width: W, height: H, display: 'flex', flexDirection: 'column', position: 'relative' },
  },
    // Bottom fade
    h('div', {
      style: {
        position: 'absolute', bottom: 0, left: 0, width: W, height: 180,
        backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))',
      },
    }),
    // Title ribbon
    h('div', {
      style: {
        position: 'absolute', top: 50, left: 40, right: 40,
        display: 'flex',
        backgroundColor: c.primary,
        borderRadius: 22,
        padding: '28px 40px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      },
    },
      h('div', {
        style: {
          width: '100%',
          color: 'white',
          fontFamily: TH_HEADING,
          fontWeight: 800,
          fontSize: 60,
          lineHeight: 1.18,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
        },
      }, title),
    ),
    // Q box
    h('div', {
      style: {
        position: 'absolute', top: 240, left: 40, right: 40,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.primary,
        borderRadius: 20,
        padding: '24px 28px',
        gap: 24,
        boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
      },
    },
      h('div', {
        style: {
          flexShrink: 0,
          width: 64, height: 64,
          borderRadius: 32,
          backgroundColor: 'white',
          color: c.primary,
          fontFamily: 'serif',
          fontWeight: 900,
          fontSize: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }, 'Q'),
      h('div', {
        style: {
          flex: 1,
          color: 'white',
          fontFamily: TH_BODY,
          fontWeight: 600,
          fontSize: 28,
          lineHeight: 1.4,
          display: 'flex',
        },
      }, question),
    ),
    // A box
    h('div', {
      style: {
        position: 'absolute', top: 480, left: 40, right: 40,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15,23,42,0.88)',
        borderRadius: 20,
        padding: '24px 28px',
        gap: 24,
        boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
      },
    },
      h('div', {
        style: {
          flexShrink: 0,
          width: 64, height: 64,
          borderRadius: 32,
          backgroundColor: c.accent,
          color: 'white',
          fontFamily: 'serif',
          fontWeight: 900,
          fontSize: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }, 'A'),
      h('div', {
        style: {
          flex: 1,
          color: 'white',
          fontFamily: TH_BODY,
          fontWeight: 400,
          fontSize: 26,
          lineHeight: 1.45,
          display: 'flex',
        },
      }, answer),
    ),
    // Footer
    footerNode({ course, footer, w: W, h: H, top: H - 100 }),
  );
}
buildQnaCard.size = { width: 1080, height: 1350 };

// ================ TEMPLATE 3: feature-grid (1080x1350) ================
export function buildFeatureGrid({ title = '', subtitle = '', cards = [], course = 'PFB', footer = 'oemcontent.co' }) {
  const W = 1080, H = 1350;
  const c = COURSE_THEME[course] || COURSE_THEME.PFB;
  const items = cards.slice(0, 4);
  while (items.length < 4) items.push({ title: '', description: '' });

  function card(item, idx) {
    const num = idx + 1;
    return h('div', {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      },
    },
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginBottom: 10,
        },
      },
        h('div', {
          style: {
            flexShrink: 0,
            width: 48, height: 48,
            borderRadius: 24,
            backgroundColor: c.tagBg,
            color: c.tagFg,
            fontFamily: 'sans-serif',
            fontWeight: 900,
            fontSize: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }, String(num)),
        h('div', {
          style: {
            flex: 1,
            color: c.primary,
            fontFamily: TH_HEADING,
            fontWeight: 700,
            fontSize: 26,
            lineHeight: 1.2,
            display: 'flex',
          },
        }, item.title || ''),
      ),
      h('div', {
        style: {
          color: 'rgba(15,23,42,0.92)',
          fontFamily: TH_BODY,
          fontWeight: 400,
          fontSize: 20,
          lineHeight: 1.4,
          display: 'flex',
        },
      }, item.description || ''),
    );
  }

  return h('div', {
    style: { width: W, height: H, display: 'flex', flexDirection: 'column', position: 'relative' },
  },
    // Top fade
    h('div', {
      style: {
        position: 'absolute', top: 0, left: 0, width: W, height: 240,
        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0))',
      },
    }),
    // Bottom fade
    h('div', {
      style: {
        position: 'absolute', bottom: 0, left: 0, width: W, height: 180,
        backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))',
      },
    }),
    // Title ribbon
    h('div', {
      style: {
        position: 'absolute', top: 30, left: 40, right: 40,
        display: 'flex',
        backgroundColor: c.primary,
        borderRadius: 22,
        padding: '24px 36px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
      },
    },
      h('div', {
        style: {
          width: '100%',
          color: 'white',
          fontFamily: TH_HEADING,
          fontWeight: 800,
          fontSize: 56,
          lineHeight: 1.18,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
        },
      }, title),
    ),
    // Subtitle (ถ้ามี)
    subtitle ? h('div', {
      style: {
        position: 'absolute', top: 200, left: 80, right: 80,
        display: 'flex',
        backgroundColor: 'rgba(15,23,42,0.78)',
        borderRadius: 14,
        padding: '12px 22px',
      },
    },
      h('div', {
        style: {
          width: '100%',
          color: 'white',
          fontFamily: TH_BODY,
          fontWeight: 600,
          fontSize: 26,
          lineHeight: 1.3,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
        },
      }, subtitle),
    ) : null,
    // 2x2 cards
    h('div', {
      style: {
        position: 'absolute',
        top: subtitle ? 310 : 240,
        bottom: 130,
        left: 40, right: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      },
    },
      h('div', {
        style: { flex: 1, display: 'flex', flexDirection: 'row', gap: 22 },
      },
        card(items[0], 0),
        card(items[1], 1),
      ),
      h('div', {
        style: { flex: 1, display: 'flex', flexDirection: 'row', gap: 22 },
      },
        card(items[2], 2),
        card(items[3], 3),
      ),
    ),
    // Footer
    footerNode({ course, footer, w: W, h: H, top: H - 100 }),
  );
}
buildFeatureGrid.size = { width: 1080, height: 1350 };

export const TEMPLATE_LIST = [
  { id: 'hero-poster',   label: '🎨 Hero Poster (1:1)',           description: 'รูปเต็มจอ + ribbon หัวเรื่อง + footer' },
  { id: 'qna-card',      label: '❓ Q&A Card (4:5)',                description: 'หัวเรื่อง + กล่องคำถาม + กล่องคำตอบ' },
  { id: 'feature-grid',  label: '🔢 Feature Grid 2x2 (4:5)',        description: 'หัวเรื่อง + 4 cards numbered' },
];
