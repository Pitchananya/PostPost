// Generate page — shell, product picker, generator input
// Tab content lives in separate files: Caption tab here, Creative tab in dashboard-creative.jsx

// === Real Shopee products from happyprice.sh ===
const SHOPEE_PRODUCTS = [
  { id: 'p1', name: 'Marine Collagen from New Zealand 100g', short: 'Marine Collagen NZ', price: 550, sales: '1.4k', rating: 4.9, badge: 'ขายดี', hue: { from: '#FFE4E6', to: '#FECACA' }, label: 'COLLAGEN', selected: true },
  { id: 'p2', name: 'iCON FACE iSERUM เซรั่มผิวกระจก สยบริ้วรอย 30ml', short: 'iCON Face iSerum', price: 690, sales: '2.1k', rating: 4.8, badge: 'แนะนำ', hue: { from: '#FFEDD5', to: '#FECDD3' }, label: 'SERUM', selected: true },
  { id: 'p3', name: 'BellaCare Collagen Tripeptide Super Premium', short: 'BellaCare Collagen', price: 599, sales: '980', rating: 4.7, hue: { from: '#FFE4E6', to: '#FED7AA' }, label: 'BELLA' },
  { id: 'p4', name: 'Amado Face Night Sleeping Mask 100g', short: 'Amado Sleeping Mask', price: 300, sales: '640', rating: 4.6, hue: { from: '#E0E7FF', to: '#FECDD3' }, label: 'MASK' },
  { id: 'p5', name: 'CmaX Cordyceps Coffee กาแฟซีแม็คซ์ ถั่งเช่า', short: 'CmaX Coffee', price: 235, sales: '320', rating: 4.5, hue: { from: '#FEF3C7', to: '#FED7AA' }, label: 'COFFEE' },
  { id: 'p6', name: 'JOJU COLLAGEN ปรับผิว เจจูคอลลาเจน', short: 'Joju Collagen', price: 490, sales: '1.1k', rating: 4.8, hue: { from: '#FED7AA', to: '#FECACA' }, label: 'JOJU' },
  { id: 'p7', name: 'Linhzhimin หลินจือมิน สารสกัดเห็ดหลินจือแดง 60 เม็ด', short: 'Linhzhimin', price: 1120, sales: '420', rating: 4.9, badge: 'พรีเมียม', hue: { from: '#FEF3C7', to: '#FCD9A8' }, label: 'LINH' },
  { id: 'p8', name: 'Kumiko Collagen สเต็มเซลล์จากรกปลาแซลม่อน 15ซอง', short: 'Kumiko Collagen', price: 250, sales: '880', rating: 4.6, hue: { from: '#FFE4E6', to: '#E0E7FF' }, label: 'KUMI' },
  { id: 'p9', name: 'Bio Astin สาหร่ายแดง ไบโอแอสติน 60 เม็ด', short: 'Bio Astin', price: 690, sales: '180', rating: 5, hue: { from: '#FECACA', to: '#FFE4E6' }, label: 'BIO' },
  { id: 'p10', name: 'CHATIER Premium Collagen น้องฉัตร 7 ซอง', short: 'Chatier Collagen', price: 390, sales: '740', rating: 4.7, hue: { from: '#FED7AA', to: '#FFFBEB' }, label: 'CHAT' },
  { id: 'p11', name: 'Mahad Facial Cream ครีมมะหาด หน้าใส 30g', short: 'Mahad Cream', price: 390, sales: '510', rating: 4.5, hue: { from: '#FEF3C7', to: '#FFE4E6' }, label: 'MAHAD' },
  { id: 'p12', name: 'Black Sesame Oil 1000mg Smartlife Plus', short: 'Black Sesame Oil', price: 580, sales: '230', rating: 4.6, hue: { from: '#FCD9A8', to: '#FECACA' }, label: 'SESAME' },
];

const ProductPicker = ({ active, onChange }) => {
  const t = useT();
  const selectedCount = SHOPEE_PRODUCTS.filter(p => p.selected).length;
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cf-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cf-primary)' }}>
            <Icon name="package" size={16} />
          </div>
          <div>
            <h3 className="h3"><T th="เลือกสินค้าที่จะโพสต์" en="Pick a product to post about" /></h3>
            <p className="micro" style={{ margin: 0 }}>
              <T th={<>ดึงจาก Shopee · happyprice.sh · <b style={{ color: 'var(--cf-ink-1)' }}>{selectedCount}</b> สินค้าพร้อมใช้</>}
                 en={<>From Shopee · happyprice.sh · <b style={{ color: 'var(--cf-ink-1)' }}>{selectedCount}</b> products ready</>} />
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--cf-ink-3)' }} />
            <input className="input" placeholder={t({ th: 'ค้นหาสินค้า', en: 'Search products' })} style={{ height: 32, paddingLeft: 28, fontSize: 12, background: 'var(--cf-surface-2)' }} />
          </div>
          <button className="btn btn-ghost btn-sm">
            <Icon name="external" size={13} />
            <T th="จัดการสินค้า" en="Manage" />
          </button>
        </div>
      </div>

      {/* Horizontal product scroll */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {SHOPEE_PRODUCTS.map(p => {
          const on = p.id === active;
          return (
            <button key={p.id} onClick={() => onChange && onChange(p.id)} style={{
              font: 'inherit', textAlign: 'left', cursor: 'pointer',
              padding: 8, borderRadius: 10, flexShrink: 0, width: 140,
              border: on ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
              background: on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
              position: 'relative',
            }}>
              {on && (
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 20, height: 20, borderRadius: 999, background: 'var(--cf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={11} stroke={3} style={{ color: 'white' }} />
                </div>
              )}
              {p.badge && !on && (
                <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, padding: '1px 7px', borderRadius: 999, background: 'var(--cf-primary)', color: 'white', fontSize: 9, fontWeight: 700 }}>{p.badge}</div>
              )}
              <div style={{
                aspectRatio: '1 / 1', borderRadius: 7, overflow: 'hidden', position: 'relative',
                background: `linear-gradient(135deg, ${p.hue.from}, ${p.hue.to})`,
                border: '1px solid var(--cf-border)', marginBottom: 8,
              }}>
                <div style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 999, background: 'rgba(255,255,255,0.5)' }} />
                <div style={{ position: 'absolute', bottom: -10, left: -10, width: 50, height: 50, borderRadius: 999, background: 'rgba(249,115,22,0.18)' }} />
                <div style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                  width: 48, height: 60, borderRadius: 8,
                  background: 'linear-gradient(180deg, #FFFBEB, #FED7AA)',
                  boxShadow: '0 4px 10px -2px rgba(124,45,18,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#7C2D12', fontSize: 8, fontWeight: 700, letterSpacing: '0.05em',
                }}>{p.label}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--cf-ink-0)', lineHeight: 1.35, height: 30, overflow: 'hidden' }}>{p.short}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cf-primary)' }}>฿{p.price}</span>
                <span style={{ fontSize: 9, color: 'var(--cf-ink-2)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  ⭐ {p.rating}
                </span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--cf-ink-3)', marginTop: 1 }}>{t({ th: 'ขายแล้ว', en: 'Sold' })} {p.sales}</div>
            </button>
          );
        })}
        {/* + add */}
        <button style={{
          font: 'inherit', cursor: 'pointer',
          flexShrink: 0, width: 140, padding: 8, borderRadius: 10,
          border: '1px dashed var(--cf-border-2)',
          background: 'var(--cf-surface-2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cf-ink-2)',
        }}>
          <Icon name="plus" size={20} />
          <span style={{ fontSize: 11, fontWeight: 500, marginTop: 6, textAlign: 'center', lineHeight: 1.3 }}>
            <T th={<>เพิ่มสินค้า<br/>จาก Shopee</>} en={<>Add from<br/>Shopee</>} />
          </span>
        </button>
      </div>
    </div>
  );
};

const GenerateInput = () => {
  const t = useT();
  const gen = useGen();
  return (
    <div className="card" style={{ padding: 22, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <label className="label" style={{ marginBottom: 0 }}><T th="หัวข้อ / สิ่งที่อยากจะโพสต์" en="Topic — what to post about" /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pill" style={{ height: 26, padding: '0 10px', cursor: 'pointer', fontSize: 11, color: 'var(--cf-accent)' }}>
            <Icon name="lightbulb" size={11} />
            <T th="ดู Topic Bank" en="Topic Bank" />
          </button>
          <button className="pill" style={{ height: 26, padding: '0 10px', cursor: 'pointer', fontSize: 11, color: 'var(--cf-accent)' }}>
            <Icon name="sparkles" size={11} />
            <T th="คิดหัวข้อให้" en="Suggest topic" />
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          className="textarea"
          rows={3}
          value={gen.topic || ''}
          onChange={(e) => gen.setTopic && gen.setTopic(e.target.value)}
          placeholder={t({
            th: 'เช่น: โปรโมชั่น 11.11 ลด 50% — เน้นกลุ่มคุณแม่วัย 30-45 ที่อยากเริ่มดูแลผิว',
            en: 'e.g. 11.11 sale 50% off — for moms 30-45 starting their skincare journey',
          })}
          style={{ paddingRight: 110, fontSize: 14 }}
        />
        <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', bottom: 12, right: 12, color: 'var(--cf-ink-2)' }}>
          <Icon name="sparkles" size={14} />
          <T th="ปรับให้สั้น" en="Shorten" />
        </button>
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="micro" style={{ fontWeight: 500 }}><T th="โทน:" en="Tone:" /></span>
          <button className="pill" style={{ background: 'var(--cf-primary-soft)', color: '#9A3412', border: '1px solid #FED7AA', height: 30, padding: '0 10px', cursor: 'pointer', fontSize: 12 }}>
            🤗 <T th="เป็นกันเอง" en="Friendly" />
            <Icon name="chev-down" size={12} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="micro" style={{ fontWeight: 500 }}><T th="ภาษา:" en="Lang:" /></span>
          <button className="pill" style={{ height: 30, padding: '0 10px', cursor: 'pointer', fontSize: 12 }}>
            <T th="ไทย" en="Thai" />
            <Icon name="chev-down" size={12} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="micro" style={{ fontWeight: 500 }}><T th="ความยาว:" en="Length:" /></span>
          <button className="pill" style={{ height: 30, padding: '0 10px', cursor: 'pointer', fontSize: 12 }}>
            <T th="ปานกลาง (150 คำ)" en="Medium (150 words)" />
            <Icon name="chev-down" size={12} />
          </button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary">
            <Icon name="upload" size={15} />
            <T th="อัปโหลดรูป" en="Upload image" />
          </button>
          <button className="btn btn-primary" style={{ paddingLeft: 20, paddingRight: 20 }}
                  onClick={() => gen.generate && gen.generate()} disabled={gen.loading}>
            <Icon name={gen.loading ? 'refresh' : 'sparkles'} size={16} />
            {gen.loading ? <T th="กำลังสร้าง…" en="Generating…" /> : <>✨ <T th="Generate All" en="Generate All" /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

// Channel + Schedule sidebar card — used by both tabs
const PublishCard = () => {
  const t = useT();
  const gen = useGen();
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon name="rocket" size={18} style={{ color: 'var(--cf-primary)' }} />
        <h3 className="h3" style={{ margin: 0 }}><T th="โพสต์ครั้งนี้" en="Publish this post" /></h3>
      </div>

      {/* Channel picker — explicit toggles */}
      <label className="label" style={{ fontSize: 12 }}><T th="ช่องทางที่จะโพสต์" en="Post to which channels" /></label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {[
          { icon: 'facebook', name: 'HappyPrice', sub: { th: 'Facebook Page · 24.3k ผู้ติดตาม', en: 'Facebook Page · 24.3k followers' }, on: true },
          { icon: 'instagram', name: '@happyprice.sh', sub: { th: 'IG Business · 18.1k ผู้ติดตาม', en: 'IG Business · 18.1k followers' }, on: true },
          { icon: 'tiktok', name: t({ th: '— ไม่ได้เชื่อม —', en: '— not connected —' }), sub: { th: 'คลิกเพื่อเชื่อม TikTok for Business', en: 'Click to connect TikTok for Business' }, off: true },
        ].map((ch, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: ch.on ? 'var(--cf-primary-soft)' : ch.off ? 'var(--cf-surface-2)' : 'var(--cf-surface)',
            border: ch.on ? '1px solid var(--cf-primary)' : '1px solid var(--cf-border)',
            opacity: ch.off ? 0.7 : 1,
          }}>
            <Icon name={ch.icon} size={22} style={{ opacity: ch.off ? 0.55 : 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{ch.name}</div>
              <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>{t(ch.sub)}</div>
            </div>
            {ch.off ? (
              <button className="btn btn-ghost btn-sm" style={{ height: 28, padding: '0 10px', color: 'var(--cf-accent)' }}>
                <Icon name="link" size={12} />
                <T th="เชื่อม" en="Connect" />
              </button>
            ) : (
              <div style={{
                width: 36, height: 22, borderRadius: 999,
                background: ch.on ? 'var(--cf-primary)' : 'var(--cf-border-2)',
                position: 'relative', cursor: 'pointer',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 999, background: 'white',
                  position: 'absolute', top: 3, left: ch.on ? 17 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule */}
      <label className="label" style={{ fontSize: 12 }}><T th="ตั้งเวลาโพสต์" en="Schedule" /></label>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--cf-surface-2)', borderRadius: 10, border: '1px solid var(--cf-border)', marginBottom: 12 }}>
        {[
          { l: { th: 'โพสต์ทันที', en: 'Post now' } },
          { l: { th: 'ตั้งเวลา', en: 'Schedule' }, on: true },
          { l: { th: 'AI เลือกเวลา', en: 'AI pick time' } },
        ].map((m, i) => (
          <button key={i} style={{
            flex: 1, font: 'inherit', cursor: 'pointer',
            padding: '7px 10px', borderRadius: 7, border: 'none',
            fontSize: 12, fontWeight: 500,
            background: m.on ? 'white' : 'transparent',
            color: m.on ? 'var(--cf-ink-0)' : 'var(--cf-ink-2)',
            boxShadow: m.on ? 'var(--cf-shadow-1)' : 'none',
          }}>{t(m.l)}</button>
        ))}
      </div>

      {/* Date + time + repeat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <button className="input" style={{ height: 38, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Icon name="calendar" size={14} style={{ color: 'var(--cf-ink-2)' }} />
            <T th="11 พ.ย. 2026" en="Nov 11, 2026" />
            <Icon name="chev-down" size={12} style={{ color: 'var(--cf-ink-3)', marginLeft: 'auto' }} />
          </button>
        </div>
        <div>
          <button className="input" style={{ height: 38, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Icon name="clock" size={14} style={{ color: 'var(--cf-ink-2)' }} />
            <span style={{ flex: 1 }}>19:00</span>
            <Icon name="chev-down" size={12} style={{ color: 'var(--cf-ink-3)' }} />
          </button>
        </div>
      </div>

      {/* Recurring options */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <span className="micro" style={{ width: '100%', marginBottom: 2 }}><T th="ทำซ้ำ:" en="Repeat:" /></span>
        {[
          { l: { th: 'โพสต์ครั้งเดียว', en: 'One-time' }, on: true },
          { l: { th: 'รายวัน', en: 'Daily' } },
          { l: { th: 'รายสัปดาห์', en: 'Weekly' } },
          { l: { th: 'แบบกำหนดเอง', en: 'Custom' } },
        ].map((r, i) => (
          <span key={i} className="pill" style={{
            fontSize: 11, cursor: 'pointer', height: 24,
            background: r.on ? 'var(--cf-primary-soft)' : 'var(--cf-surface-2)',
            color: r.on ? '#9A3412' : 'var(--cf-ink-2)',
            border: r.on ? '1px solid #FED7AA' : '1px solid var(--cf-border)',
            fontWeight: 500,
          }}>{t(r.l)}</span>
        ))}
      </div>

      {/* AI hint */}
      <div style={{
        padding: '10px 12px', borderRadius: 10,
        background: 'var(--cf-accent-soft)', border: '1px solid #DBE5FF',
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
      }}>
        <Icon name="sparkles" size={14} style={{ color: 'var(--cf-accent)' }} />
        <div style={{ flex: 1, fontSize: 11, lineHeight: 1.5, color: '#1E40AF' }}>
          <T th={<><b>AI แนะนำ:</b> 19:00 น. คือเวลาที่ผู้ติดตามของคุณ active สูงสุด</>}
             en={<><b>AI suggests:</b> 7:00 PM is when your followers are most active.</>} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} disabled={gen.saving}
                onClick={() => gen.save && gen.save('draft')}>
          <Icon name="library" size={14} />
          <T th="บันทึก Draft" en="Save draft" />
        </button>
        <button className="btn btn-primary" style={{ flex: 1.3 }} disabled={gen.saving}
                onClick={() => gen.save && gen.save('scheduled')}>
          <Icon name="send" size={14} />
          {gen.saving ? <T th="กำลังบันทึก…" en="Saving…" /> : <T th="ตั้งเวลาโพสต์" en="Schedule post" />}
        </button>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--cf-border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--cf-ink-2)' }}>
        <span><T th="ใช้เครดิต:" en="Credits used:" /> <b style={{ color: 'var(--cf-ink-0)' }}>4</b></span>
        <span><T th="คงเหลือ 338" en="338 left" /></span>
      </div>
    </div>
  );
};

window.SHOPEE_PRODUCTS = SHOPEE_PRODUCTS;
window.ProductPicker = ProductPicker;
window.GenerateInput = GenerateInput;
window.PublishCard = PublishCard;

// Generate page — assembles input + product picker + tab content
// GenerateCaption / GenerateCreative are global consts from dashboard-generate-tabs.jsx

// Shared generation state for the Generate page (input + tab content + publish card)
const GenCtx = React.createContext(null);
const useGen = () => React.useContext(GenCtx) || {};
window.GenCtx = GenCtx;
window.useGen = useGen;

const GeneratePage = ({ tab = 'caption' }) => {
  const t = useT();
  const app = useApp();
  const [tabState, setTabState] = React.useState(tab);
  const [productId, setProductId] = React.useState('p1');
  // Topic may be handed off from the Topic Bank page
  const [topic, setTopic] = React.useState(() => {
    const h = window.PP_HANDOFF;
    if (h && h.topic) { window.PP_HANDOFF = null; return h.topic; }
    return '';
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [selectedHook, setSelectedHook] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const course = 'PFB';

  const product = SHOPEE_PRODUCTS.find(p => p.id === productId);

  const generate = async () => {
    const tp = topic.trim() || (product ? `โปรโมต ${product.name}` : '');
    if (!tp) { app.toast(t({ th: 'ใส่หัวข้อก่อนนะ', en: 'Enter a topic first' }), 'error'); return; }
    setLoading(true); setError('');
    try {
      const r = await API.ai.generateAll({ course, topic: tp, framework: 'F1', generateImage: true });
      setResult(r); setSelectedHook(0);
      app.toast(t({ th: 'AI สร้างคอนเทนต์เสร็จแล้ว ✨', en: 'AI content ready ✨' }), 'success');
    } catch (e) {
      setError(e.message);
      app.toast(t({ th: 'สร้างไม่สำเร็จ: ', en: 'Failed: ' }) + e.message, 'error');
    } finally { setLoading(false); }
  };

  const save = async (status = 'draft', platforms = ['facebook', 'instagram']) => {
    if (!result) { app.toast(t({ th: 'กด Generate ก่อนนะ', en: 'Generate something first' }), 'error'); return null; }
    setSaving(true);
    try {
      const hooks = result.hook_options || (result.hook ? [result.hook] : []);
      const img = result.image || {};
      const body = {
        course, topic: topic.trim() || (product ? product.name : ''),
        hook: hooks[selectedHook] || result.hook || '',
        caption: result.caption || '',
        image_base64: img.image_base64 || null,
        media_url: img.image_url || null,
        image_prompt: result.image_prompt || null,
        platforms, status,
      };
      const d = await API.content.create(body);
      app.toast(status === 'draft'
        ? t({ th: 'บันทึก Draft แล้ว', en: 'Draft saved' })
        : t({ th: 'ตั้งเวลาโพสต์แล้ว', en: 'Scheduled' }), 'success');
      return d.content;
    } catch (e) {
      app.toast(t({ th: 'บันทึกไม่สำเร็จ: ', en: 'Save failed: ' }) + e.message, 'error');
      return null;
    } finally { setSaving(false); }
  };

  const ctx = { topic, setTopic, course, product, productId, setProductId,
    loading, error, result, generate, selectedHook, setSelectedHook, save, saving };

  return (
    <GenCtx.Provider value={ctx}>
    <DashShell active="generate" crumb={t({ th: 'สร้างคอนเทนต์', en: 'Generate' })}>
      <PageHeader
        title={<T th="สร้างคอนเทนต์ด้วย AI" en="AI content generator" />}
        subtitle={<T th="เลือกสินค้า → ใส่หัวข้อ → AI คิด Hook / Caption / Hashtag / รูป / บทความ ครบในคลิกเดียว" en="Pick a product → topic → AI writes the hook, caption, hashtags, image, and article in one click" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => app.navigate('topics')}>
              <Icon name="lightbulb" size={15} />
              <T th="Topic Bank" en="Topic Bank" />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => app.navigate('library')}>
              <Icon name="clock" size={15} />
              <T th="ประวัติ" en="History" />
            </button>
          </>
        }
      />

      <ProductPicker active={productId} onChange={setProductId} />

      <TabBar
        active={tabState}
        onChange={setTabState}
        tabs={[
          { id: 'caption', label: { th: 'Caption · Hook · Hashtag · บทความ', en: 'Caption · Hook · Hashtag · Article' }, icon: 'type' },
          { id: 'creative', label: { th: 'Creative · รูป + อัลบั้ม + แคปชั่นต่อสไลด์', en: 'Creative · Image + album + per-slide captions' }, icon: 'image' },
        ]}
      />

      <GenerateInput />

      {tabState === 'caption' ? <GenerateCaption /> : <GenerateCreative />}
    </DashShell>
    </GenCtx.Provider>
  );
};

window.GeneratePage = GeneratePage;
