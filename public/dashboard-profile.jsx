// Profile page — multi-brand switcher, AI-assist description, expanded brand voices

const BrandTile = ({ name, sub, mark, color, active, ch, onClick }) => (
  <button onClick={onClick} style={{
    font: 'inherit', textAlign: 'left', cursor: 'pointer',
    padding: 14, borderRadius: 12,
    border: active ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
    background: active ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
    display: 'flex', flexDirection: 'column', gap: 10,
    minWidth: 0, position: 'relative',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 700, fontSize: 14,
        boxShadow: 'var(--cf-shadow-1)',
      }}>{mark}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cf-ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--cf-ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
      </div>
      {active && (
        <span className="pill pill-orange" style={{ height: 20, fontSize: 10 }}>
          <T th="กำลังแก้" en="Editing" />
        </span>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--cf-ink-2)' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {ch.map(c => <Icon key={c} name={c} size={14} />)}
      </div>
      <span>·</span>
      <span><T th="เชื่อมแล้ว" en="connected" /></span>
    </div>
  </button>
);

const VoiceCard = ({ tone, active, onClick }) => {
  const t = useT();
  return (
    <button onClick={onClick} style={{
      font: 'inherit', textAlign: 'left', cursor: 'pointer',
      padding: '12px 14px', borderRadius: 12,
      border: active ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
      background: active ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      position: 'relative',
    }}>
      <div style={{
        fontSize: 18, width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: active ? 'white' : 'var(--cf-surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{tone.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{t(tone.label)}</span>
          <span style={{ fontSize: 11, color: 'var(--cf-ink-3)' }}>{t(tone.alt)}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--cf-ink-2)', marginTop: 3, lineHeight: 1.45, fontStyle: 'italic' }}>
          "{t(tone.sample)}"
        </div>
      </div>
      {active && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 999, background: 'var(--cf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={11} stroke={3} style={{ color: 'white' }} />
        </div>
      )}
    </button>
  );
};

const ProductCard = ({ name, price, sales, image, active }) => (
  <div className="card" style={{
    padding: 12, cursor: 'pointer',
    borderColor: active ? 'var(--cf-primary)' : 'var(--cf-border)',
    boxShadow: active ? '0 0 0 4px rgba(249,115,22,0.10)' : 'var(--cf-shadow-1)',
    position: 'relative',
  }}>
    {active && (
      <div style={{
        position: 'absolute', top: 8, right: 8, zIndex: 2,
        width: 22, height: 22, borderRadius: 999, background: 'var(--cf-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="check" size={13} stroke={3} style={{ color: 'white' }} />
      </div>
    )}
    <div style={{
      aspectRatio: '1 / 1', borderRadius: 8, overflow: 'hidden', position: 'relative',
      background: image.bg, border: '1px solid var(--cf-border)',
    }}>
      <div style={{ position: 'absolute', top: 14, right: 14, width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.5)' }} />
      <div style={{ position: 'absolute', bottom: -10, left: -10, width: 60, height: 60, borderRadius: 999, background: image.accent }} />
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        width: 54, height: 70, borderRadius: 10,
        background: 'linear-gradient(180deg, #FFFBEB, #FED7AA)',
        boxShadow: '0 4px 10px -2px rgba(124,45,18,0.30)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#7C2D12', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      }}>{image.label}</div>
    </div>
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cf-ink-0)', lineHeight: 1.35, height: 32, overflow: 'hidden' }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cf-primary)' }}>฿{price}</span>
        <span style={{ fontSize: 10, color: 'var(--cf-ink-2)' }}>
          <T th="ขายแล้ว" en="Sold" /> {sales}
        </span>
      </div>
    </div>
  </div>
);

// ===== Brand Archetype guide (Jungian 12) =====
// Source of truth: "12 Brand archetypes — PROMPT for Branding" reference sheet.
const ARCHETYPE_GUIDE = [
  { id: 'hero', icon: '🛡️', color: '#DC2626',
    name: { th: 'The Hero — วีรบุรุษ', en: 'The Hero' },
    tone: { th: 'สร้างแรงบันดาลใจ ปลุกใจ มั่นใจ', en: 'Inspiring, motivating, confident' },
    emotion: { th: 'ความกล้าหาญ ความมุ่งมั่น', en: 'Courage, determination' },
    persuasion: { th: 'จุดประกายผ่านการฝ่าฟันอุปสรรคและชัยชนะ', en: 'Inspiring through challenges and triumphs' },
    cta: { th: 'รับคำท้า กล้าที่จะลงมือ', en: 'Take on a challenge, be brave' },
    thai: { th: 'วีรบุรุษจากประวัติศาสตร์/ตำนานไทย', en: 'Heroic figures from Thai history or myth' },
    persona: { th: 'พี่เลี้ยงผู้กล้า ผู้นำที่จุดไฟ', en: 'Courageous mentor, inspiring leader' },
    brands: ['Nike', 'Adidas'] },
  { id: 'rebel', icon: '🔥', color: '#111827',
    name: { th: 'The Outlaw — ขบถ', en: 'The Outlaw' },
    tone: { th: 'ขบถ กล้า ท้าทาย', en: 'Rebellious, bold, daring' },
    emotion: { th: 'การปลดปล่อย ความเป็นตัวของตัวเอง', en: 'Liberation, individuality' },
    persuasion: { th: 'กระตุ้นความอยากเปลี่ยนแปลงและอิสรภาพ', en: 'Provoking desire for change and freedom' },
    cta: { th: 'แหกกฎ ยืนยันความเป็นตัวเอง', en: 'Break the rules, assert independence' },
    thai: { th: 'องค์ประกอบสายต้านกระแสของไทย', en: 'Subversive elements of Thai counterculture' },
    persona: { th: 'ขบถผู้กล้า นักคิดนอกกรอบ', en: 'Daring rebel, unconventional thinker' },
    brands: ['Harley-Davidson'] },
  { id: 'magician', icon: '✨', color: '#8B5CF6',
    name: { th: 'The Magician — นักมายากล', en: 'The Magician' },
    tone: { th: 'ลึกลับ ชวนค้นหา เปี่ยมปัญญา', en: 'Mysterious, intriguing, wise' },
    emotion: { th: 'ความอัศจรรย์ ความเป็นไปได้', en: 'Wonder, possibilities' },
    persuasion: { th: 'เสนอทางออกและข้อค้นพบที่เปลี่ยนแปลงทุกอย่าง', en: 'Offering transformative solutions and insights' },
    cta: { th: 'ค้นความลับ ปลดล็อกศักยภาพ', en: 'Discover secrets, unlock potential' },
    thai: { th: 'ความเชื่อ/สิ่งศักดิ์สิทธิ์สายมูของไทย', en: 'Thai spiritual or mystical traditions' },
    persona: { th: 'ผู้นำทางผู้รู้ลึก วิชวลผู้มีวิสัยทัศน์', en: 'Wise guide, enigmatic visionary' },
    brands: ['Disney', 'Apple'] },
  { id: 'jester', icon: '🎭', color: '#F59E0B',
    name: { th: 'The Jester — ตัวตลก', en: 'The Jester' },
    tone: { th: 'ตลก ขี้เล่น เสียดสี', en: 'Humorous, playful, satirical' },
    emotion: { th: 'ความสุข ความสนุก', en: 'Joy, amusement' },
    persuasion: { th: 'ใช้อารมณ์ขันและไหวพริบดึงดูดและโน้มน้าว', en: 'Using humor and wit to engage and persuade' },
    cta: { th: 'สนุกไปกับมัน อยู่กับปัจจุบัน', en: 'Embrace humor, enjoy the moment' },
    thai: { th: 'มุกตลก การเล่นคำแบบไทย', en: 'Thai wordplay, puns, or jokes' },
    persona: { th: 'เพื่อนที่ทำให้สนุก นักวิจารณ์ติดตลก', en: 'Entertaining friend, witty commentator' },
    brands: ['M&M’s', 'Deadpool'] },
  { id: 'lover', icon: '💗', color: '#BE185D',
    name: { th: 'The Lover — คนรัก', en: 'The Lover' },
    tone: { th: 'โรแมนติก เย้ายวน เปี่ยมอารมณ์', en: 'Romantic, sensual, passionate' },
    emotion: { th: 'ความรัก ความปรารถนา', en: 'Love, desire' },
    persuasion: { th: 'ตอบสนองความอยากเชื่อมโยงและถูกชื่นชม', en: 'Appealing to connection and appreciation' },
    cta: { th: 'ดื่มด่ำกับความรัก แสดงความรู้สึก', en: 'Indulge in romance, express affection' },
    thai: { th: 'เพลงรัก กวี ภาพโรแมนติกแบบไทย', en: 'Thai love songs, poetry, romantic imagery' },
    persona: { th: 'ผู้ชื่นชมที่เปี่ยมใจ คู่ที่ทุ่มเท', en: 'Passionate admirer, devoted partner' },
    brands: ['Chanel', 'Victoria’s Secret'] },
  { id: 'caregiver', icon: '🤍', color: '#EC4899',
    name: { th: 'The Caregiver — ผู้ดูแล', en: 'The Caregiver' },
    tone: { th: 'โอบอุ้ม อ่อนโยน เห็นอกเห็นใจ', en: 'Nurturing, gentle, compassionate' },
    emotion: { th: 'ความเมตตา ความปลอดภัย', en: 'Compassion, security' },
    persuasion: { th: 'เน้นการดูแล สนับสนุน และความเข้าใจ', en: 'Emphasizing care, support, and understanding' },
    cta: { th: 'มองหาที่พึ่ง ดูแลตัวเองก่อน', en: 'Seek support, prioritize self-care' },
    thai: { th: 'ค่านิยมครอบครัวไทย บทบาทการดูแล', en: 'Thai family values, caregiving roles' },
    persona: { th: 'ผู้สนับสนุนที่อบอุ่น ที่ปรึกษาที่ไว้ใจ', en: 'Nurturing supporter, trusted confidant' },
    brands: ['Johnson & Johnson'] },
  { id: 'innocent', icon: '☀️', color: '#FBBF24',
    name: { th: 'The Innocent — ผู้บริสุทธิ์', en: 'The Innocent' },
    tone: { th: 'บริสุทธิ์ มองโลกแง่ดี เรียบง่าย', en: 'Pure, optimistic, simple' },
    emotion: { th: 'ความสุข ความไว้ใจ ความคิดถึง', en: 'Happiness, trust, nostalgia' },
    persuasion: { th: 'เน้นความเรียบง่ายและความดีงาม', en: 'Emphasizing simplicity and goodness' },
    cta: { th: 'โอบรับความเรียบง่าย ความเชื่อ และความหวัง', en: 'Embrace simplicity, trust, and hope' },
    thai: { th: 'การละเล่นเด็กไทย ความสุขเล็ก ๆ', en: 'Thai childhood games, simple pleasures' },
    persona: { th: 'เด็กผู้บริสุทธิ์ ผู้มองโลกใสซื่อ', en: 'Innocent child, pure-hearted optimist' },
    brands: ['Dove'] },
  { id: 'sage', icon: '📖', color: '#2563EB',
    name: { th: 'The Sage — ปราชญ์', en: 'The Sage' },
    tone: { th: 'เปี่ยมปัญญา รอบรู้ ใคร่ครวญ', en: 'Wise, knowledgeable, reflective' },
    emotion: { th: 'ปัญญา การรู้แจ้ง ความจริง', en: 'Wisdom, enlightenment, truth' },
    persuasion: { th: 'ส่งต่อความรู้และข้อค้นพบ', en: 'Sharing knowledge and insights' },
    cta: { th: 'แสวงหาความรู้ ทบทวนปัญญา', en: 'Seek knowledge, reflect on wisdom' },
    thai: { th: 'สุภาษิตไทย คำสอนทางพุทธ', en: 'Thai proverbs, Buddhist teachings' },
    persona: { th: 'ครูผู้รู้ ผู้นำทางที่รอบรู้', en: 'Wise teacher, knowledgeable guide' },
    brands: ['Google', 'TED'] },
  { id: 'explorer', icon: '🧭', color: '#0891B2',
    name: { th: 'The Explorer — นักสำรวจ', en: 'The Explorer' },
    tone: { th: 'ชอบผจญภัย เป็นอิสระ ไม่กลัว', en: 'Adventurous, independent, fearless' },
    emotion: { th: 'ความตื่นเต้น อิสรภาพ ความอยากรู้', en: 'Excitement, freedom, curiosity' },
    persuasion: { th: 'กระตุ้นการออกสำรวจและค้นพบ', en: 'Encouraging exploration and discovery' },
    cta: { th: 'ออกสำรวจขอบฟ้าใหม่ โอบรับอิสรภาพ', en: 'Explore new horizons, embrace freedom' },
    thai: { th: 'จุดหมายท่องเที่ยวไทย การผจญภัยในท้องถิ่น', en: 'Thai travel destinations, local adventures' },
    persona: { th: 'นักสำรวจผู้กล้า จิตวิญญาณอิสระ', en: 'Adventurous explorer, independent spirit' },
    brands: ['The North Face', 'Patagonia'] },
  { id: 'ruler', icon: '👑', color: '#7C2D12',
    name: { th: 'The Ruler — ผู้ปกครอง', en: 'The Ruler' },
    tone: { th: 'มีอำนาจ ประณีต น่าเชื่อถือ', en: 'Authoritative, refined, commanding' },
    emotion: { th: 'อำนาจ ความเคารพ ความชื่นชม', en: 'Power, respect, admiration' },
    persuasion: { th: 'แสดงภาวะผู้นำและความน่าเชื่อถือ', en: 'Demonstrating leadership and authority' },
    cta: { th: 'กุมบังเหียน มุ่งสู่ความยิ่งใหญ่', en: 'Take charge, aspire to greatness' },
    thai: { th: 'ราชวงศ์ไทย ผู้นำในประวัติศาสตร์', en: 'Thai royalty, historical leaders' },
    persona: { th: 'ผู้นำที่มั่นใจ ผู้มีอำนาจที่ได้รับการเคารพ', en: 'Confident leader, respected authority' },
    brands: ['Rolex', 'Mercedes-Benz'] },
  { id: 'creator', icon: '🎨', color: '#F97316',
    name: { th: 'The Creator — นักสร้างสรรค์', en: 'The Creator' },
    tone: { th: 'สร้างนวัตกรรม แสดงออก เปี่ยมจินตนาการ', en: 'Innovative, expressive, imaginative' },
    emotion: { th: 'แรงบันดาลใจ ความคิดสร้างสรรค์ การเห็นคุณค่า', en: 'Inspiration, creativity, appreciation' },
    persuasion: { th: 'โชว์ความเป็นต้นฉบับและนวัตกรรม', en: 'Showcasing originality and innovation' },
    cta: { th: 'สร้างสรรค์ แสดงตัวตน ชื่นชมศิลปะ', en: 'Create, express yourself, appreciate art' },
    thai: { th: 'ศิลปะไทย ประเพณีงานสร้างสรรค์', en: 'Thai art forms, creative traditions' },
    persona: { th: 'ศิลปินสร้างสรรค์ ผู้มีวิสัยทัศน์', en: 'Creative artist, expressive visionary' },
    brands: ['Lego', 'Adobe'] },
  { id: 'regular', icon: '🙂', color: '#16A34A',
    name: { th: 'The Everyman — คนธรรมดา', en: 'The Everyman' },
    tone: { th: 'เข้าถึงง่าย จริงใจ ติดดิน', en: 'Relatable, honest, down-to-earth' },
    emotion: { th: 'ความเป็นพวกเดียวกัน ความสบายใจ ความเรียบง่าย', en: 'Belonging, comfort, simplicity' },
    persuasion: { th: 'เชื่อมโยงกับประสบการณ์และค่านิยมร่วม', en: 'Relating to common experiences and values' },
    cta: { th: 'เชื่อมโยงกับผู้อื่น ฉลองความธรรมดา', en: 'Connect with others, celebrate the ordinary' },
    thai: { th: 'ชีวิตประจำวันของคนไทย ประสบการณ์ร่วม', en: 'Thai everyday life, common experiences' },
    persona: { th: 'เพื่อนที่เข้าถึงง่าย คู่หูในทุกวัน', en: 'Relatable friend, everyday companion' },
    brands: ['IKEA', 'Levi’s'] },
];

const ArchetypeGuideModal = ({ open, onClose }) => {
  const t = useT();
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(11,18,32,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      fontFamily: 'var(--cf-font)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--cf-surface)', borderRadius: 'var(--cf-r-lg)',
        boxShadow: 'var(--cf-shadow-3)', width: '100%', maxWidth: 760,
        maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--cf-border)',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'var(--cf-primary-soft)', color: 'var(--cf-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="lightbulb" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="h2" style={{ margin: 0 }}>
              <T th="คู่มือ Brand Archetype" en="Brand Archetype Guide" />
            </h2>
            <p className="micro" style={{ margin: '3px 0 0' }}>
              <T th="12 บุคลิกแบรนด์ตามทฤษฎีของ Carl Jung — เลือกตัวที่ใกล้เคียงแบรนด์คุณที่สุด AI จะใช้กำหนดมุมมองและน้ำเสียงทุกคอนเทนต์"
                 en="12 brand personalities from Carl Jung's theory — pick the closest fit; AI uses it to shape voice and angle in every post" />
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ width: 30, padding: 0, flexShrink: 0 }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* body */}
        <div style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ARCHETYPE_GUIDE.map((a) => (
            <div key={a.id} style={{
              border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-r)',
              padding: 16, display: 'flex', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11, flexShrink: 0, fontSize: 22,
                background: a.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{a.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{t(a.name)}</div>
                <div style={{ fontSize: 13, color: 'var(--cf-ink-1)', marginTop: 3, lineHeight: 1.5, fontStyle: 'italic' }}>{t(a.tone)}</div>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  {[
                    { l: { th: 'อารมณ์ที่สื่อ', en: 'Emotional appeal' }, v: a.emotion },
                    { l: { th: 'วิธีโน้มน้าว', en: 'Persuasion' }, v: a.persuasion },
                    { l: { th: 'Call-to-action', en: 'Call-to-action' }, v: a.cta },
                    { l: { th: 'เปอร์โซนา', en: 'Persona' }, v: a.persona },
                    { l: { th: 'อ้างอิงวัฒนธรรมไทย', en: 'Thai cultural cue' }, v: a.thai },
                  ].map((row, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--cf-ink-2)', lineHeight: 1.5 }}>
                      <b style={{ color: 'var(--cf-ink-1)' }}>{t(row.l)}: </b>{t(row.v)}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--cf-ink-3)' }}><T th="แบรนด์ตัวอย่าง:" en="Example brands:" /></span>
                  {a.brands.map((b) => (
                    <span key={b} className="pill" style={{ height: 22, fontSize: 11 }}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--cf-border)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            <T th="เข้าใจแล้ว" en="Got it" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Business types — diverse set for Thai SME / online sellers
const BUSINESS_TYPES = [
  { th: 'ความงาม & สกินแคร์', en: 'Beauty & Skincare' },
  { th: 'อาหารเสริม & สุขภาพ', en: 'Supplements & Health' },
  { th: 'แฟชั่น & เสื้อผ้า', en: 'Fashion & Apparel' },
  { th: 'อาหาร & เครื่องดื่ม', en: 'Food & Beverage' },
  { th: 'คาเฟ่ & ร้านอาหาร', en: 'Café & Restaurant' },
  { th: 'เครื่องประดับ & แอคเซสซอรี่', en: 'Jewelry & Accessories' },
  { th: 'ของแต่งบ้าน & ไลฟ์สไตล์', en: 'Home & Lifestyle' },
  { th: 'แม่และเด็ก', en: 'Mom & Baby' },
  { th: 'สัตว์เลี้ยง', en: 'Pet Products' },
  { th: 'อิเล็กทรอนิกส์ & แกดเจ็ต', en: 'Electronics & Gadgets' },
  { th: 'กีฬา & ฟิตเนส', en: 'Sports & Fitness' },
  { th: 'ท่องเที่ยว & ที่พัก', en: 'Travel & Hospitality' },
  { th: 'การศึกษา & คอร์สเรียน', en: 'Education & Courses' },
  { th: 'บริการ & ที่ปรึกษา', en: 'Services & Consulting' },
  { th: 'การเงิน & ลงทุน', en: 'Finance & Investment' },
  { th: 'สายมู & ดูดวง', en: 'Spiritual & Fortune' },
  { th: 'งานฝีมือ & DIY', en: 'Handmade & Crafts' },
  { th: 'รถยนต์ & ยานยนต์', en: 'Automotive' },
  { th: 'อสังหาริมทรัพย์', en: 'Real Estate' },
  { th: 'เกม & บันเทิง', en: 'Gaming & Entertainment' },
  { th: 'การเกษตร & ออร์แกนิค', en: 'Agriculture & Organic' },
  { th: 'อื่น ๆ', en: 'Other' },
];

// ===== Add-brand modal =====
const BRAND_COLORS = [
  'linear-gradient(135deg, #FB923C, #F97316)',
  'linear-gradient(135deg, #818CF8, #4F46E5)',
  'linear-gradient(135deg, #34D399, #059669)',
  'linear-gradient(135deg, #F472B6, #DB2777)',
  'linear-gradient(135deg, #38BDF8, #0284C7)',
  'linear-gradient(135deg, #FBBF24, #D97706)',
];

const BrandModal = ({ open, onClose, onAdd }) => {
  const t = useT();
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('Beauty & Skincare');
  const [arch, setArch] = React.useState('creator');

  React.useEffect(() => {
    if (open) { setName(''); setType('Beauty & Skincare'); setArch('creator'); }
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;

  const submit = () => {
    const nm = name.trim();
    if (!nm) return;
    const mark = nm.replace(/\s+/g, '').slice(0, 2).toUpperCase();
    const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
    onAdd({ id: 'b' + Date.now(), name: nm, mark, color, type, archetype: arch, ch: [] });
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(11,18,32,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      fontFamily: 'var(--cf-font)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--cf-surface)', borderRadius: 'var(--cf-r-lg)',
        boxShadow: 'var(--cf-shadow-3)', width: '100%', maxWidth: 520,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cf-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'var(--cf-primary-soft)', color: 'var(--cf-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="plus" size={20} /></div>
          <h2 className="h2" style={{ margin: 0, flex: 1 }}><T th="เพิ่มแบรนด์ใหม่" en="Add a new brand" /></h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ width: 30, padding: 0 }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label"><T th="ชื่อแบรนด์" en="Brand name" /> <span style={{ color: 'var(--cf-danger)' }}>*</span></label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus
              placeholder={t({ th: 'เช่น Rose Garden Beauty', en: 'e.g. Rose Garden Beauty' })} />
          </div>
          <div>
            <label className="label"><T th="ประเภทธุรกิจ" en="Business type" /></label>
            <div style={{ position: 'relative' }}>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}
                style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}>
                {BUSINESS_TYPES.map((b) => <option key={b.en} value={b.en}>{t(b)}</option>)}
              </select>
              <Icon name="chev-down" size={14} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--cf-ink-2)', pointerEvents: 'none' }} />
            </div>
          </div>
          <div>
            <label className="label"><T th="Brand Archetype" en="Brand archetype" /></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {ARCHETYPE_GUIDE.map((a) => {
                const on = arch === a.id;
                return (
                  <button key={a.id} onClick={() => setArch(a.id)} style={{
                    font: 'inherit', cursor: 'pointer', padding: '10px 4px', borderRadius: 10,
                    border: on ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                    background: on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ fontSize: 18 }}>{a.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cf-ink-1)', textAlign: 'center', lineHeight: 1.2 }}>
                      {t(a.name).split('—')[0].replace('The ', '').trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--cf-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><T th="ยกเลิก" en="Cancel" /></button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={!name.trim()}>
            <Icon name="check" size={14} />
            <T th="เพิ่มแบรนด์" en="Add brand" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MAX_BRANDS = 5;
const DEFAULT_BRANDS = [
  { id: 'happyprice', name: 'HappyPrice Shop', mark: 'HP', color: 'linear-gradient(135deg, #FB923C, #F97316)', type: 'Beauty & Skincare', sub: { th: 'สกินแคร์ · 34 สินค้า', en: 'Skincare · 34 products' }, ch: ['facebook', 'instagram'] },
  { id: 'mintnature', name: 'MintNature', mark: 'MN', color: 'linear-gradient(135deg, #818CF8, #4F46E5)', type: 'Food & Beverage', sub: { th: 'ชาสมุนไพร · 12 สินค้า', en: 'Herbal tea · 12 products' }, ch: ['facebook', 'tiktok'] },
  { id: 'baancafe', name: 'Baan Café', mark: 'คา', color: 'linear-gradient(135deg, #34D399, #059669)', type: 'Café & Restaurant', sub: { th: 'คาเฟ่ · 8 สาขา', en: 'Café · 8 locations' }, ch: ['facebook', 'instagram', 'tiktok'] },
];

const ProfilePage = () => {
  const t = useT();
  const app = useApp();
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [brandModalOpen, setBrandModalOpen] = React.useState(false);
  const [businessType, setBusinessType] = React.useState('Beauty & Skincare');
  const [brands, setBrands] = React.useState(() => {
    try { const s = localStorage.getItem('postpost_brands'); if (s) return JSON.parse(s); } catch (e) {}
    return DEFAULT_BRANDS;
  });
  const saveBrands = (list) => {
    setBrands(list);
    try { localStorage.setItem('postpost_brands', JSON.stringify(list)); } catch (e) {}
  };
  const addBrand = (b) => {
    saveBrands(brands.concat(b));
    setActiveBrand(b.name);
    setBrandModalOpen(false);
    app.toast(t({ th: `เพิ่มแบรนด์ "${b.name}" แล้ว`, en: `Brand "${b.name}" added` }), 'success');
  };
  const openBrandModal = () => {
    if (brands.length >= MAX_BRANDS) {
      app.toast(t({ th: 'แผน Pro เพิ่มได้สูงสุด 5 แบรนด์', en: 'Pro plan allows up to 5 brands' }), 'error');
      return;
    }
    setBrandModalOpen(true);
  };
  const [aiAssistOpen, setAiAssistOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [activeBrand, setActiveBrand] = React.useState('HappyPrice Shop');
  const [selectedVoices, setSelectedVoices] = React.useState(['friendly', 'fun']);
  const [archetype, setArchetype] = React.useState('sage');
  const [voiceNotes, setVoiceNotes] = React.useState(t({
    th: 'ใช้คำว่า "คุณลูกค้า" แทน "คุณ" / ลงท้ายด้วย "ค่ะ" เกือบทุกครั้ง / ห้ามใช้ "การันตี 100%" / ใส่ emoji 🌸 ตอนพูดถึงสินค้า',
    en: 'Use "dear customer" instead of "you" / end sentences politely / never say "100% guaranteed" / add 🌸 when mentioning products',
  }));
  const [saving, setSaving] = React.useState(false);

  const toggleVoice = (id) => setSelectedVoices(v =>
    v.includes(id) ? v.filter(x => x !== id) : (v.length >= 3 ? v : v.concat(id)));

  const saveProfile = async () => {
    setSaving(true);
    try {
      const composed = [
        desc,
        'ประเภทธุรกิจ / Business: ' + businessType,
        'โทนเสียง / Voice tones: ' + selectedVoices.join(', '),
        'Brand archetype: ' + archetype,
        voiceNotes,
      ].filter(Boolean).join('\n');
      await API.ai.brandVoiceSet({ course: 'PFB', text: composed, brand_voice: composed, archetype });
      app.toast(t({ th: 'บันทึกโปรไฟล์แบรนด์แล้ว', en: 'Brand profile saved' }), 'success');
    } catch (e) {
      app.toast(t({ th: 'บันทึกไม่สำเร็จ: ', en: 'Save failed: ' }) + e.message, 'error');
    } finally { setSaving(false); }
  };
  const [desc, setDesc] = React.useState(t({
    th: 'ร้าน HappyPrice ขายสกินแคร์ออร์แกนิคจากดอกกุหลาบเขาใหญ่ เน้นผิวบอบบางแพ้ง่าย กลุ่มลูกค้าหญิงวัย 25-40 ปี',
    en: "HappyPrice sells organic skincare from Khao Yai roses, focused on sensitive skin, for women aged 25-40.",
  }));

  // Voices — much more varied than before
  const voices = [
    { id: 'friendly', emoji: '🤗', label: { th: 'เป็นกันเอง', en: 'Friendly' }, alt: { th: 'Friendly', en: 'เป็นกันเอง' }, sample: { th: 'สวัสดีค่าคุณลูกค้า วันนี้พีร์มีของดีมาฝาก ✨', en: 'Hey! We picked something just for you today ✨' }, on: true },
    { id: 'pro', emoji: '👔', label: { th: 'มืออาชีพ', en: 'Professional' }, alt: { th: 'Professional', en: 'มืออาชีพ' }, sample: { th: 'ผลิตภัณฑ์ผ่านการรับรองจากผู้เชี่ยวชาญ', en: 'Dermatologist-tested and certified safe.' } },
    { id: 'lux', emoji: '💎', label: { th: 'พรีเมียม', en: 'Luxury' }, alt: { th: 'Luxury', en: 'พรีเมียม' }, sample: { th: 'สัมผัสประสบการณ์ความหรูที่คุณคู่ควร', en: 'Indulge in the luxury you deserve.' } },
    { id: 'fun', emoji: '✨', label: { th: 'สนุกสดใส', en: 'Playful' }, alt: { th: 'Playful', en: 'สนุกสดใส' }, sample: { th: 'หยิบเลย! ผิวสวยรอไม่ไหวแล้ว 🌸', en: 'Snag it now! Your skin won\'t wait 🌸' }, on: true },
    { id: 'warm', emoji: '🤍', label: { th: 'อบอุ่น ใส่ใจ', en: 'Warm & caring' }, alt: { th: 'Warm', en: 'อบอุ่น' }, sample: { th: 'เข้าใจเลยว่าผิวบอบบางเลือกของยากแค่ไหน', en: 'We get it — sensitive skin makes choosing hard.' } },
    { id: 'min', emoji: '◻︎', label: { th: 'มินิมอล', en: 'Minimal' }, alt: { th: 'Minimal', en: 'มินิมอล' }, sample: { th: 'น้อย แต่พอ. ทุกหยดมีเหตุผล', en: 'Less, but enough. Every drop matters.' } },
    { id: 'story', emoji: '📖', label: { th: 'เล่าเรื่อง', en: 'Storyteller' }, alt: { th: 'Storyteller', en: 'เล่าเรื่อง' }, sample: { th: 'มันเริ่มจากดอกกุหลาบดอกหนึ่งบนเขาใหญ่...', en: 'It started with a single rose on Khao Yai...' } },
    { id: 'bold', emoji: '🔥', label: { th: 'มั่นใจ ขายตรง', en: 'Bold seller' }, alt: { th: 'Bold', en: 'ขายตรง' }, sample: { th: 'ของจริง ราคาจริง 690 บาท หมดเร็วแน่นอน', en: 'Real product, real price ฿690 — going fast.' } },
    { id: 'genz', emoji: '🫶', label: { th: 'สไตล์ Gen Z', en: 'Gen Z vibes' }, alt: { th: 'Gen Z', en: 'สไตล์ Gen Z' }, sample: { th: 'no cap ครีมนี้คือ slay จริง 🫶', en: 'no cap this serum is literally slay 🫶' } },
    { id: 'edu', emoji: '🧪', label: { th: 'ให้ความรู้', en: 'Educational' }, alt: { th: 'Educational', en: 'ให้ความรู้' }, sample: { th: 'รู้ไหม? วิตามินซีในกุหลาบสูงกว่าส้ม 3 เท่า', en: 'Did you know? Rose vitamin C beats orange 3×.' } },
    { id: 'witty', emoji: '😄', label: { th: 'มีอารมณ์ขัน', en: 'Witty' }, alt: { th: 'Witty', en: 'อารมณ์ขัน' }, sample: { th: 'ขนาดดอกกุหลาบยังต้องบำรุง ผิวเราก็เหมือนกัน', en: 'Even roses need care — your skin does too.' } },
    { id: 'custom', emoji: '✏️', label: { th: 'กำหนดเอง', en: 'Custom' }, alt: { th: 'Custom', en: 'กำหนดเอง' }, sample: { th: 'เขียนสไตล์ของคุณเอง', en: 'Write your own voice' } },
  ];

  const aiSuggestions = [
    { th: 'แบรนด์สกินแคร์ออร์แกนิคจากดอกกุหลาบเขาใหญ่ที่ผลิตเองทั้งหมด เน้นผิวบอบบางและแพ้ง่าย กลุ่มลูกค้าผู้หญิงวัยทำงาน 25-40 ปี ที่ให้ความสำคัญกับความปลอดภัยและส่วนผสมธรรมชาติมากกว่าราคา จุดเด่นคือสูตรอ่อนโยน ไม่มีน้ำหอม และสามารถใช้ได้ทั้งครอบครัว', en: "An organic skincare brand made from hand-picked Khao Yai roses. Targets sensitive, easily-irritated skin in women aged 25-40 who value safety and natural ingredients over price. Hero traits: gentle formula, fragrance-free, family-safe." },
    { th: 'HappyPrice เป็นร้านที่ตั้งใจให้ทุกคนเข้าถึงสกินแคร์คุณภาพได้ในราคาเป็นมิตร เน้นความโปร่งใสของส่วนผสม รีวิวลูกค้าจริง 4.9 ดาวจาก 3,200 รีวิว สโลแกน "ผิวสวย ไม่ต้องแพง"', en: 'HappyPrice makes quality skincare accessible at fair prices. Transparent ingredients, 4.9 stars from 3,200 verified reviews. Tagline: "Glow without the price tag."' },
    { th: 'แบรนด์ที่เกิดจากความเชื่อว่าผิวบอบบางสมควรได้รับการดูแลที่ดีกว่านี้ ใช้กุหลาบออร์แกนิกจากฟาร์มของเราเอง ทดสอบทุก batch โดยเภสัชกร เน้นกลุ่มผู้หญิงที่เคยลองสกินแคร์มาหลายแบรนด์แล้วยังหาตัวที่ใช่ไม่เจอ', en: 'Born from the belief that sensitive skin deserves better. Roses from our own organic farm, every batch tested by pharmacists. For women who\'ve tried it all and still haven\'t found "the one".' },
  ];

  return (
    <DashShell active="profile" crumb="Profile">
      <PageHeader
        title={<T th="Profile ของแบรนด์" en="Brand profile" />}
        subtitle={<T th="จัดการแบรนด์ทั้งหมดของคุณ · ตั้ง Brand Voice · เลือกสินค้าที่ AI จะใช้" en="Manage all your brands · set brand voice · pick products AI uses" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm">
              <Icon name="info" size={15} />
              <T th="ดูสคริปต์ที่ AI ใช้" en="View AI system prompt" />
            </button>
            <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>
              <Icon name="check" size={15} />
              {saving ? <T th="กำลังบันทึก…" en="Saving…" /> : <T th="บันทึก" en="Save" />}
            </button>
          </>
        }
      />

      {/* === Brand switcher === */}
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3 className="h3"><T th="แบรนด์ของคุณ" en="Your brands" /></h3>
            <p className="micro" style={{ margin: '2px 0 0' }}>
              <T th="แต่ละแบรนด์มี Brand Voice, สินค้า, และช่องทางของตัวเอง" en="Each brand has its own voice, products, and channels" />
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="pill pill-blue" style={{ height: 24, fontSize: 11 }}>
              <T th="แผน Pro · ได้สูงสุด 5 แบรนด์" en="Pro · up to 5 brands" />
            </span>
            <button className="btn btn-secondary btn-sm" onClick={openBrandModal}>
              <Icon name="plus" size={14} />
              <T th="เพิ่มแบรนด์ใหม่" en="Add brand" />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {brands.map((b) => (
            <BrandTile key={b.id} mark={b.mark} color={b.color}
              active={activeBrand === b.name} onClick={() => setActiveBrand(b.name)}
              name={b.name}
              sub={b.sub ? t(b.sub) : t((BUSINESS_TYPES.find(x => x.en === b.type)) || { th: b.type, en: b.type })}
              ch={b.ch || []} />
          ))}
          {brands.length < MAX_BRANDS && (
            <button onClick={openBrandModal} style={{
              font: 'inherit', cursor: 'pointer',
              padding: 14, borderRadius: 12,
              border: '1.5px dashed var(--cf-border-2)',
              background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cf-ink-2)',
              minHeight: 96,
            }}>
              <Icon name="plus" size={20} />
              <span style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>
                <T th="เพิ่มแบรนด์" en="Add brand" />
              </span>
              <span style={{ fontSize: 11, color: 'var(--cf-ink-3)', marginTop: 2 }}>
                <T th={`ใช้ได้อีก ${MAX_BRANDS - brands.length} แบรนด์`} en={`${MAX_BRANDS - brands.length} slots left`} />
              </span>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* === Workspace info === */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 14,
              background: 'linear-gradient(135deg, #FED7AA, #FDBA74)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#7C2D12', fontWeight: 700, fontSize: 22,
              boxShadow: 'var(--cf-shadow-1)',
            }}>HP</div>
            <div style={{ flex: 1 }}>
              <h3 className="h2" style={{ margin: 0 }}>HappyPrice Shop</h3>
              <p className="micro" style={{ margin: '2px 0 0' }}>
                <T th="ID: happyprice-sh · สร้างเมื่อ มี.ค. 2026" en="ID: happyprice-sh · created Mar 2026" />
              </p>
            </div>
            <button className="btn btn-ghost btn-sm">
              <Icon name="edit" size={13} />
              <T th="เปลี่ยนโลโก้" en="Logo" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label"><T th="ชื่อแบรนด์" en="Brand name" /></label>
              <input className="input" defaultValue="HappyPrice Shop" />
            </div>
            <div>
              <label className="label"><T th="ประเภทธุรกิจ" en="Business type" /></label>
              <div style={{ position: 'relative' }}>
                <select
                  className="input"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}
                >
                  {BUSINESS_TYPES.map((b) => (
                    <option key={b.en} value={b.en}>{t(b)}</option>
                  ))}
                </select>
                <Icon name="chev-down" size={14} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--cf-ink-2)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="label" style={{ marginBottom: 0 }}><T th="คำอธิบายแบรนด์" en="Brand description" /></label>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAiAssistOpen(o => !o)}
                  style={{ height: 26, padding: '0 8px', color: 'var(--cf-accent)' }}
                >
                  <Icon name="sparkles" size={13} />
                  <T th="ให้ AI ช่วยเขียน" en="AI write for me" />
                </button>
              </div>
              <textarea className="textarea" rows={4} value={desc} onChange={e => setDesc(e.target.value)} />
              <div className="hint" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><T th="AI ใช้ข้อความนี้ทุกครั้งที่สร้างคอนเทนต์" en="AI reads this on every generation" /></span>
                <span>{desc.length} <T th="ตัวอักษร" en="chars" /></span>
              </div>

              {/* AI suggestions */}
              {aiAssistOpen && (
                <div style={{
                  marginTop: 12, padding: 14, borderRadius: 10,
                  background: 'var(--cf-accent-soft)', border: '1px solid #DBE5FF',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon name="sparkles" size={14} style={{ color: 'var(--cf-accent)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1E40AF' }}>
                      <T th="AI เขียนให้ 3 แบบ — เลือกหรือผสมก็ได้" en="3 AI drafts — pick one or remix" />
                    </span>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', height: 24, padding: '0 6px', color: 'var(--cf-accent)' }}>
                      <Icon name="refresh" size={11} />
                      <T th="ใหม่" en="New" />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {aiSuggestions.map((s, i) => (
                      <button key={i} onClick={() => setDesc(t(s))} style={{
                        font: 'inherit', textAlign: 'left', cursor: 'pointer',
                        padding: 12, borderRadius: 8,
                        background: 'white', border: '1px solid #DBE5FF',
                        fontSize: 12, lineHeight: 1.5, color: 'var(--cf-ink-1)',
                      }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'var(--cf-accent-soft)', color: '#1E40AF', fontWeight: 600 }}>
                            {i === 0 ? <T th="ละเอียด" en="Detailed" /> : i === 1 ? <T th="สั้นและตรง" en="Short & punchy" /> : <T th="เล่าเรื่อง" en="Storytelling" />}
                          </span>
                        </div>
                        {t(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === Brand Archetype (pick 1) — placed last in grid to span row 2 === */}
        <div className="card" style={{ padding: 24, gridColumn: '1 / -1', gridRow: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className="h2" style={{ margin: 0 }}><T th="Brand Archetype" en="Brand Archetype" /></h3>
                <span className="pill pill-orange" style={{ height: 22 }}>
                  <T th="เลือกได้ 1 แบบ" en="Pick 1" />
                </span>
              </div>
              <p className="micro" style={{ margin: '4px 0 0' }}>
                <T
                  th="บุคลิกหลักของแบรนด์ตามทฤษฎี Jungian archetype — AI จะใช้กำหนดมุมมองและภาษาในทุกคอนเทนต์"
                  en="Your brand's core personality (Jungian archetypes) — AI uses this to shape voice and angle in every post"
                />
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setGuideOpen(true)} style={{ color: 'var(--cf-accent)', flexShrink: 0 }}>
              <Icon name="info" size={13} />
              <T th="อ่านคู่มือ archetypes" en="Read the guide" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { id: 'creator', icon: '🎨', name: { th: 'The Creator', en: 'The Creator' }, sub: { th: 'สร้างสรรค์ · จินตนาการ', en: 'Imaginative · expressive' }, color: '#F97316' },
              { id: 'sage', icon: '📖', name: { th: 'The Sage', en: 'The Sage' }, sub: { th: 'รู้ลึก · ให้ความจริง', en: 'Wise · truth-seeking' }, color: '#2563EB', on: true },
              { id: 'caregiver', icon: '🤍', name: { th: 'The Caregiver', en: 'The Caregiver' }, sub: { th: 'ใส่ใจ · ห่วงใย', en: 'Nurturing · caring' }, color: '#EC4899' },
              { id: 'innocent', icon: '☀️', name: { th: 'The Innocent', en: 'The Innocent' }, sub: { th: 'บริสุทธิ์ · ดีงาม', en: 'Pure · optimistic' }, color: '#FBBF24' },
              { id: 'jester', icon: '🎭', name: { th: 'The Jester', en: 'The Jester' }, sub: { th: 'สนุก · ฮา', en: 'Playful · funny' }, color: '#F59E0B' },
              { id: 'magician', icon: '✨', name: { th: 'The Magician', en: 'The Magician' }, sub: { th: 'เปลี่ยนแปลง · มหัศจรรย์', en: 'Transformative · visionary' }, color: '#8B5CF6' },
              { id: 'ruler', icon: '👑', name: { th: 'The Ruler', en: 'The Ruler' }, sub: { th: 'มั่นใจ · ผู้นำ', en: 'Authoritative · leader' }, color: '#7C2D12' },
              { id: 'hero', icon: '🛡️', name: { th: 'The Hero', en: 'The Hero' }, sub: { th: 'กล้าหาญ · เอาชนะ', en: 'Brave · triumphant' }, color: '#DC2626' },
              { id: 'regular', icon: '🙂', name: { th: 'The Regular Guy', en: 'The Regular Guy' }, sub: { th: 'เพื่อนบ้าน · เข้าถึงง่าย', en: 'Relatable · friendly' }, color: '#16A34A' },
              { id: 'rebel', icon: '🔥', name: { th: 'The Rebel', en: 'The Rebel' }, sub: { th: 'ต่อต้านกฎ · แหวกแนว', en: 'Disruptive · bold' }, color: '#111827' },
              { id: 'explorer', icon: '🧭', name: { th: 'The Explorer', en: 'The Explorer' }, sub: { th: 'ผจญภัย · อิสระ', en: 'Adventurous · free' }, color: '#0891B2' },
              { id: 'lover', icon: '💗', name: { th: 'The Lover', en: 'The Lover' }, sub: { th: 'สัมพันธ์ · ใกล้ชิด', en: 'Intimate · sensual' }, color: '#BE185D' },
            ].map(a => {
              const on = archetype === a.id;
              return (
                <button key={a.id} onClick={() => setArchetype(a.id)} style={{
                  font: 'inherit', textAlign: 'left', cursor: 'pointer',
                  padding: 12, borderRadius: 12,
                  border: on ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                  background: on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  position: 'relative', minHeight: 96,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: on ? 'white' : a.color + '15',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>{a.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(a.name)}</div>
                    </div>
                    {on && (
                      <div style={{ width: 18, height: 18, borderRadius: 999, background: 'var(--cf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="check" size={11} stroke={3} style={{ color: 'white' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cf-ink-2)', lineHeight: 1.4 }}>{t(a.sub)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* === Brand voice (expanded) === */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 className="h2" style={{ margin: 0 }}><T th="Brand Voice" en="Brand voice" /></h3>
            <span className="pill pill-blue" style={{ height: 22, marginLeft: 'auto' }}>
              <T th="เลือกได้หลายโทน" en="Mix multiple" />
            </span>
          </div>
          <p className="micro" style={{ marginBottom: 14 }}>
            <T th="11 โทนพร้อมตัวอย่างจริง · ผสมได้สูงสุด 3 โทน" en="11 tones with real samples · combine up to 3" />
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
            {voices.map(v => <VoiceCard key={v.id} tone={v}
              active={selectedVoices.includes(v.id)} onClick={() => toggleVoice(v.id)} />)}
          </div>

          <hr className="divider" style={{ margin: '16px 0' }} />

          <label className="label"><T th="คำอธิบายเสียงเพิ่มเติม (ไม่จำเป็น)" en="Free-form voice notes (optional)" /></label>
          <textarea className="textarea" rows={2} value={voiceNotes} onChange={(e) => setVoiceNotes(e.target.value)} />
        </div>
      </div>

      {/* === Shopee scraper === */}
      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 className="h2" style={{ margin: 0 }}>
                <T th="สินค้าจากร้านของคุณ" en="Products from your store" />
              </h3>
              <span className="pill pill-green" style={{ height: 22 }}>
                <span className="dot" style={{ background: 'var(--cf-success)', width: 6, height: 6 }} />
                <T th="ซิงค์ล่าสุด 12 นาทีที่แล้ว" en="Synced 12 min ago" />
              </span>
            </div>
            <p className="micro" style={{ margin: '4px 0 0' }}>
              <T
                th="วาง URL ร้าน Shopee/Lazada/TikTok Shop ของคุณ — AI จะดึงรูป ราคา ชื่อสินค้ามาใช้สร้างคอนเทนต์"
                en="Paste your Shopee/Lazada/TikTok Shop URL — AI pulls product images, prices, and names into every post."
              />
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{
              position: 'absolute', left: 12, top: 0, bottom: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'var(--cf-ink-2)', fontSize: 13, pointerEvents: 'none',
            }}>
              <Icon name="store" size={16} />
              <span style={{
                padding: '2px 8px', borderRadius: 6,
                background: '#FFEDD5', color: '#9A3412', fontSize: 11, fontWeight: 600,
              }}>Shopee</span>
            </div>
            <input
              className="input"
              defaultValue="https://shopee.co.th/happyprice.sh#product_list"
              style={{ paddingLeft: 130, paddingRight: 100, fontFamily: 'var(--cf-font-mono)', fontSize: 13, borderColor: 'var(--cf-success)' }}
            />
            <div style={{ position: 'absolute', right: 12, top: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--cf-success)', fontSize: 11, fontWeight: 600 }}>
              <Icon name="check-circle" size={14} />
              <T th="ถูกต้อง" en="Valid" />
            </div>
          </div>
          <button className="btn btn-secondary"
            onClick={() => app.toast(t({ th: 'กำลังดึงข้อมูลสินค้าจาก Shopee…', en: 'Syncing products from Shopee…' }), 'info')}>
            <Icon name="refresh" size={15} />
            <T th="ดึงข้อมูลใหม่" en="Re-sync" />
          </button>
          <button className="btn btn-secondary" style={{ width: 38, padding: 0 }}
            onClick={() => window.open('https://shopee.co.th/happyprice.sh', '_blank')}>
            <Icon name="external" size={15} />
          </button>
        </div>

        {/* URL format helper */}
        <div style={{
          padding: '12px 14px', borderRadius: 10,
          background: 'var(--cf-accent-soft)', border: '1px solid #DBE5FF',
          display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18,
        }}>
          <Icon name="info" size={16} style={{ color: 'var(--cf-accent)', marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              <T th="รองรับเฉพาะรูปแบบนี้ — หน้า Product List ของร้าน" en="Only this URL format works — the shop's Product List page" />
            </div>
            <div className="mono" style={{ fontSize: 12, color: '#1E3A8A' }}>
              https://shopee.co.th/<b style={{ color: 'var(--cf-primary)' }}>&lt;{t({ th: 'ชื่อร้าน', en: 'shop-name' })}&gt;</b>#product_list
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#1E40AF' }}><T th="ตัวอย่าง:" en="Examples:" /></span>
              {[
                'https://shopee.co.th/happyprice.sh#product_list',
                'https://shopee.co.th/nivea_official_store#product_list',
              ].map(ex => (
                <button key={ex} className="pill" style={{
                  fontFamily: 'var(--cf-font-mono)', fontSize: 11, cursor: 'pointer',
                  background: 'white', color: '#1E3A8A', border: '1px solid #DBE5FF',
                  height: 24, padding: '0 8px',
                }}>{ex}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 0,
          background: 'var(--cf-surface-2)', borderRadius: 10,
          border: '1px solid var(--cf-border)', marginBottom: 18,
        }}>
          {[
            { v: '34', l: { th: 'สินค้าทั้งหมด', en: 'Total products' } },
            { v: '12', l: { th: 'AI ใช้บ่อย', en: 'AI uses often' } },
            { v: '฿590', l: { th: 'ราคาเฉลี่ย', en: 'Avg. price' } },
            { v: '4.9', l: { th: 'เรทติ้งร้าน', en: 'Shop rating' } },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '14px 18px',
              borderLeft: i > 0 ? '1px solid var(--cf-border)' : 'none',
            }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{s.v}</div>
              <div style={{ fontSize: 12, color: 'var(--cf-ink-2)' }}>{t(s.l)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 className="h3">
            <T th="เลือกสินค้าที่ให้ AI ใช้สร้างคอนเทนต์" en="Pick products AI may feature" />
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="micro">
              <T th={<>เลือกแล้ว <b style={{ color: 'var(--cf-ink-0)' }}>4</b> / 34</>} en={<><b style={{ color: 'var(--cf-ink-0)' }}>4</b> / 34 selected</>} />
            </span>
            <button className="btn btn-ghost btn-sm">
              <Icon name="filter" size={13} />
              <T th="กรอง" en="Filter" />
            </button>
            <button className="btn btn-ghost btn-sm">
              <Icon name="check" size={13} />
              <T th="เลือกทั้งหมด" en="Select all" />
            </button>
            <div style={{ width: 1, height: 18, background: 'var(--cf-border)', margin: '0 4px' }} />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setManualOpen(o => !o)}
              style={{ background: manualOpen ? 'var(--cf-primary-soft)' : undefined, borderColor: manualOpen ? '#FED7AA' : undefined, color: manualOpen ? '#9A3412' : undefined }}
            >
              <Icon name={manualOpen ? 'x' : 'plus'} size={13} />
              <T th="เพิ่มสินค้าเอง" en="Add manually" />
            </button>
          </div>
        </div>

        {/* Manual entry form */}
        {manualOpen && (
          <div className="card" style={{
            padding: 18, marginBottom: 14,
            background: 'linear-gradient(180deg, #FFFBEB, #FFF7ED)',
            borderColor: '#FED7AA', borderWidth: '1.5px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 className="h3" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="edit" size={16} style={{ color: 'var(--cf-primary)' }} />
                  <T th="เพิ่มสินค้าเอง" en="Add product manually" />
                </h3>
                <p className="micro" style={{ margin: '2px 0 0' }}>
                  <T th="พิมพ์ข้อมูลสินค้าด้วยตัวเอง — เหมาะกับร้านที่ขายนอก Shopee หรือสินค้าที่ยังไม่ขึ้น marketplace" en="Type product details manually — for items sold outside Shopee or not on a marketplace yet" />
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setManualOpen(false)} style={{ width: 28, padding: 0, color: 'var(--cf-ink-2)' }}>
                <Icon name="x" size={15} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 18 }}>
              {/* Image upload */}
              <div>
                <label className="label"><T th="รูปสินค้า" en="Product photo" /></label>
                <div style={{
                  aspectRatio: '1/1', borderRadius: 10,
                  border: '1.5px dashed var(--cf-border-2)',
                  background: 'rgba(255,255,255,0.6)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: 'pointer', color: 'var(--cf-ink-2)',
                }}>
                  <Icon name="upload" size={22} />
                  <div style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                    <T th={<>คลิกหรือลากรูปมาวาง<br/>(สูงสุด 5 รูป)</>} en={<>Click or drag<br/>(up to 5 photos)</>} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cf-ink-3)' }}>JPG · PNG · max 5MB</div>
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="label"><T th="ชื่อสินค้า" en="Product name" /> <span style={{ color: 'var(--cf-danger)' }}>*</span></label>
                  <input className="input" placeholder={t({ th: 'เช่น Rose Repair Serum 30ml', en: 'e.g. Rose Repair Serum 30ml' })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="label"><T th="ราคา (บาท)" en="Price (THB)" /> <span style={{ color: 'var(--cf-danger)' }}>*</span></label>
                    <input className="input" placeholder="690" />
                  </div>
                  <div>
                    <label className="label"><T th="ราคาก่อนลด" en="Original price" /></label>
                    <input className="input" placeholder="990" />
                  </div>
                  <div>
                    <label className="label"><T th="หมวดหมู่" en="Category" /></label>
                    <button className="input" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--cf-ink-3)' }}><T th="เลือก…" en="Pick…" /></span>
                      <Icon name="chev-down" size={13} style={{ color: 'var(--cf-ink-2)' }} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">
                    <T th="คำอธิบายสินค้า / จุดเด่น" en="Description / selling points" />
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6, height: 22, padding: '0 6px', color: 'var(--cf-accent)', fontSize: 11 }}>
                      <Icon name="sparkles" size={11} />
                      <T th="ให้ AI ช่วย" en="AI assist" />
                    </button>
                  </label>
                  <textarea className="textarea" rows={3} placeholder={t({
                    th: 'เช่น เซรั่มสกัดเย็นจากกุหลาบเขาใหญ่ออร์แกนิค เหมาะกับผิวบอบบาง · เห็นผลใน 7 วัน · ปลอดสาร 12 ชนิด',
                    en: 'e.g. Cold-pressed serum from organic Khao Yai roses · gentle on sensitive skin · 7-day results · free of 12 chemicals',
                  })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="label"><T th="ลิงก์สินค้า (Shopee/อื่นๆ)" en="Product link (optional)" /></label>
                    <input className="input" placeholder="https://shopee.co.th/..." style={{ fontFamily: 'var(--cf-font-mono)', fontSize: 12 }} />
                  </div>
                  <div>
                    <label className="label"><T th="SKU / รหัสสินค้า" en="SKU" /></label>
                    <input className="input" placeholder="RR-SER-30" style={{ fontFamily: 'var(--cf-font-mono)', fontSize: 12 }} />
                  </div>
                  <div>
                    <label className="label"><T th="สถานะ" en="Status" /></label>
                    <div style={{ display: 'flex', gap: 4, padding: 3, background: 'white', borderRadius: 8, border: '1px solid var(--cf-border)' }}>
                      {[{ l: { th: 'พร้อม', en: 'Active' }, on: true }, { l: { th: 'หมด', en: 'Out' } }].map((s, i) => (
                        <button key={i} style={{
                          flex: 1, font: 'inherit', cursor: 'pointer',
                          padding: '6px 4px', borderRadius: 5, border: 'none',
                          fontSize: 11, fontWeight: 500,
                          background: s.on ? 'var(--cf-primary-soft)' : 'transparent',
                          color: s.on ? '#9A3412' : 'var(--cf-ink-2)',
                        }}>{t(s.l)}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--cf-ink-1)', cursor: 'pointer', marginTop: 4 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--cf-primary)' }} />
                  <T th="ให้ AI ใช้สินค้านี้สร้างคอนเทนต์ทันที" en="Let AI use this product in content right away" />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--cf-border)' }}>
              <span className="micro">
                <T th="ช่อง * จำเป็น · ที่เหลือเลือกใส่ได้" en="* required · the rest optional" />
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setManualOpen(false)}>
                  <T th="ยกเลิก" en="Cancel" />
                </button>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => app.toast(t({ th: 'บันทึกสินค้าแล้ว — เพิ่มรายการถัดไปได้เลย', en: 'Product saved — add the next one' }), 'success')}>
                  <Icon name="plus" size={13} />
                  <T th="บันทึก + เพิ่มอีก" en="Save + add another" />
                </button>
                <button className="btn btn-primary btn-sm"
                  onClick={() => { app.toast(t({ th: 'บันทึกสินค้าแล้ว', en: 'Product saved' }), 'success'); setManualOpen(false); }}>
                  <Icon name="check" size={13} />
                  <T th="บันทึกสินค้า" en="Save product" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          <ProductCard
            name={t({ th: 'Rose Repair Serum 30ml — ออร์แกนิคแท้', en: 'Rose Repair Serum 30ml — pure organic' })}
            price="690" sales="2.1k" active
            image={{ bg: 'linear-gradient(135deg, #FFEDD5, #FECDD3)', accent: 'rgba(249,115,22,0.20)', label: 'SERUM' }}
          />
          <ProductCard
            name={t({ th: 'Rose Hydrating Cream 50g', en: 'Rose Hydrating Cream 50g' })}
            price="490" sales="1.4k" active
            image={{ bg: 'linear-gradient(135deg, #FFE4E6, #FECACA)', accent: 'rgba(220,38,38,0.20)', label: 'CREAM' }}
          />
          <ProductCard
            name={t({ th: 'Rose Toner Pad 60 ชิ้น', en: 'Rose Toner Pads · 60 ct' })}
            price="350" sales="980" active
            image={{ bg: 'linear-gradient(135deg, #FFFBEB, #FED7AA)', accent: 'rgba(245,158,11,0.18)', label: 'TONER' }}
          />
          <ProductCard
            name={t({ th: 'Set 11.11 Beauty Trio ลด 50%', en: '11.11 Beauty Trio · 50% off' })}
            price="990" sales="3.2k" active
            image={{ bg: 'linear-gradient(135deg, #FED7AA, #FDBA74)', accent: 'rgba(124,45,18,0.20)', label: '11.11' }}
          />
          <ProductCard
            name={t({ th: 'Rose Mist Spray 100ml', en: 'Rose Mist Spray 100ml' })}
            price="290" sales="640"
            image={{ bg: 'linear-gradient(135deg, #FFE4E6, #E0E7FF)', accent: 'rgba(59,130,246,0.16)', label: 'MIST' }}
          />
          <ProductCard
            name={t({ th: 'Rose Sheet Mask 5 แผ่น', en: 'Rose Sheet Mask · 5 pcs' })}
            price="190" sales="1.1k"
            image={{ bg: 'linear-gradient(135deg, #E0E7FF, #FECDD3)', accent: 'rgba(99,102,241,0.18)', label: 'MASK' }}
          />
          {/* + Add manually tile */}
          <button
            onClick={() => setManualOpen(true)}
            style={{
              font: 'inherit', cursor: 'pointer',
              padding: 12, borderRadius: 12,
              border: '1.5px dashed var(--cf-border-2)',
              background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: 'var(--cf-ink-2)',
              minHeight: 200,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 999,
              background: 'var(--cf-primary-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cf-primary)',
            }}>
              <Icon name="plus" size={20} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-1)' }}>
              <T th="เพิ่มสินค้าเอง" en="Add manually" />
            </span>
            <span style={{ fontSize: 11, color: 'var(--cf-ink-3)', textAlign: 'center', lineHeight: 1.4 }}>
              <T th={<>พิมพ์ชื่อ + ราคา<br/>+ รูปด้วยตัวเอง</>} en={<>Type name + price<br/>+ upload images</>} />
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <button className="btn btn-ghost btn-sm">
            <T th="ดูสินค้าอีก 28 รายการ" en="Show 28 more" />
            <Icon name="chev-down" size={14} />
          </button>
        </div>
      </div>

      <ArchetypeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      <BrandModal open={brandModalOpen} onClose={() => setBrandModalOpen(false)} onAdd={addBrand} />
    </DashShell>
  );
};

window.ProfilePage = ProfilePage;
