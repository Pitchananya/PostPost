// Topic Bank — AI plans a month of content topics

const Topic = ({ topic, framework, kind, length, used, onUse }) => {
  const t = useT();
  const kindMap = {
    knowledge: { th: 'ให้ความรู้', en: 'Knowledge', color: '#1D4ED8', bg: 'var(--cf-accent-soft)', border: '#DBE5FF' },
    promo: { th: 'ขายตรง', en: 'Promo', color: '#9A3412', bg: 'var(--cf-primary-soft)', border: '#FED7AA' },
    review: { th: 'รีวิว', en: 'Review', color: '#166534', bg: 'var(--cf-success-soft)', border: '#C8EBD2' },
    story: { th: 'เล่าเรื่อง', en: 'Story', color: '#7C2D12', bg: '#FEF3C7', border: '#FCD9A8' },
    tip: { th: 'Tip', en: 'Tip', color: '#6D28D9', bg: '#EDE9FE', border: '#DDD6FE' },
    engage: { th: 'ถาม-ตอบ', en: 'Engage', color: '#0E7490', bg: '#CFFAFE', border: '#A5F3FC' },
  };
  const k = kindMap[kind] || kindMap.knowledge;
  return (
    <div className="card" style={{
      padding: 16,
      borderColor: used ? 'var(--cf-border)' : 'var(--cf-border)',
      opacity: used ? 0.55 : 1,
      cursor: 'pointer',
      transition: 'box-shadow .15s, transform .15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="pill" style={{
          height: 22, fontSize: 11, fontWeight: 600,
          background: k.bg, color: k.color, border: `1px solid ${k.border}`,
        }}>
          {t(k)}
        </span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--cf-ink-3)' }}>{framework}</span>
      </div>

      <div style={{
        fontSize: 14, fontWeight: 500, color: 'var(--cf-ink-0)',
        lineHeight: 1.5, marginBottom: 12, minHeight: 42,
      }}>{t(topic)}</div>

      <div style={{ paddingTop: 12, borderTop: '1px dashed var(--cf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--cf-ink-2)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="type" size={11} />
            {length && typeof length === 'object' ? t(length) : length}
          </span>
          {used && (
            <span className="pill pill-green" style={{ height: 18, fontSize: 10 }}>
              <Icon name="check" size={9} stroke={3} />
              <T th="ใช้แล้ว" en="Used" />
            </span>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onUse} style={{
          height: 26, padding: '0 10px', fontSize: 12,
          color: 'var(--cf-primary)',
        }}>
          <T th="ใช้หัวข้อนี้" en="Use this" />
          <Icon name="chev-right" size={11} />
        </button>
      </div>
    </div>
  );
};

const TOPIC_MOCK = [
  { kind: 'tip', framework: 'F1', length: { th: '80-120 คำ', en: '80-120 words' },
    topic: { th: 'ผิวบอบบางใช่ไหมคะ? 5 ขั้นตอนตอนเช้าที่ห้ามข้าม', en: 'Sensitive skin? 5 morning steps you can\'t skip' } },
  { kind: 'knowledge', framework: 'F2', length: { th: '100-160 คำ', en: '100-160 words' },
    topic: { th: 'รู้ไหม? Marine Collagen ดูดซึมได้ดีกว่า Bovine Collagen 1.5 เท่า', en: 'Did you know? Marine collagen absorbs 1.5× better than bovine' } },
  { kind: 'promo', framework: 'F3', length: { th: '60-90 คำ', en: '60-90 words' }, used: true,
    topic: { th: '11.11 มาถึงแล้ว! Rose Repair ลด 50% เฉพาะวันเดียว', en: '11.11 is here! Rose Repair 50% off — today only' } },
  { kind: 'review', framework: 'F1', length: { th: '200+ คำ', en: '200+ words' },
    topic: { th: 'รีวิวลูกค้า 7 วัน — คุณป๊อปอายุ 35 ผิวแพ้ง่ายมา 10 ปี', en: '7-day customer review — Pop, 35, sensitive skin for 10 years' } },
  { kind: 'story', framework: 'F2', length: { th: '300+ คำ', en: '300+ words' },
    topic: { th: 'เรื่องเล่าจากเขาใหญ่ — ทำไมเราเลือกกุหลาบจากที่นี่', en: 'A story from Khao Yai — why we picked roses from here' } },
  { kind: 'tip', framework: 'F1', length: { th: '80-120 คำ', en: '80-120 words' },
    topic: { th: '3 สัญญาณบอกว่าผิวกำลังขาดน้ำ (และวิธีฟื้น)', en: '3 signs your skin is dehydrated (and how to fix it)' } },
  { kind: 'knowledge', framework: 'F2', length: { th: '150-200 คำ', en: '150-200 words' },
    topic: { th: 'คลอโรฟิลล์มีดีอย่างไร? เภสัชกรอธิบายแบบเข้าใจง่าย', en: 'What\'s special about chlorophyll? A pharmacist explains' } },
  { kind: 'engage', framework: 'F3', length: { th: '40-60 คำ', en: '40-60 words' },
    topic: { th: 'ลูกค้าคะ — ผิวคุณมีปัญหาอะไรมากที่สุด? คอมเมนต์มาคุยกัน', en: 'Tell us — what\'s your skin\'s biggest issue? Comment below' } },
  { kind: 'promo', framework: 'F2', length: { th: '60-90 คำ', en: '60-90 words' },
    topic: { th: 'ส่งฟรี + แถม Sheet Mask 3 แผ่น เฉพาะสั่ง 2 ขวด', en: 'Free shipping + 3 sheet masks when you buy 2 bottles' } },
  { kind: 'tip', framework: 'F1', length: { th: '80-120 คำ', en: '80-120 words' }, used: true,
    topic: { th: 'Toner Pad ใช้แทนสำลีชุบน้ำ — ประหยัดเวลา 3 นาทีทุกเช้า', en: 'Toner Pads beat cotton — save 3 minutes every morning' } },
  { kind: 'review', framework: 'F1', length: { th: '200+ คำ', en: '200+ words' },
    topic: { th: 'รีวิวลูกค้า: ใช้ Bio Astin 30 วัน รู้สึกอย่างไร?', en: 'Review: 30 days of Bio Astin — what happens?' } },
  { kind: 'story', framework: 'F2', length: { th: '300+ คำ', en: '300+ words' },
    topic: { th: 'จากเภสัชกรสู่เจ้าของร้าน — ทำไมพีร์เริ่มแบรนด์นี้', en: 'From pharmacist to founder — why I started this brand' } },
  { kind: 'tip', framework: 'F3', length: { th: '60-90 คำ', en: '60-90 words' },
    topic: { th: 'ห้ามทำ! 5 ข้อผิดพลาดเวลาทาเซรั่ม', en: 'Don\'t! 5 mistakes when applying serum' } },
  { kind: 'knowledge', framework: 'F1', length: { th: '120-180 คำ', en: '120-180 words' },
    topic: { th: 'ไขข้อสงสัย — กิน Collagen แล้วผิวขาวจริงไหม?', en: 'Myth busted — does collagen actually whiten skin?' } },
  { kind: 'promo', framework: 'F2', length: { th: '60-90 คำ', en: '60-90 words' }, used: true,
    topic: { th: 'แจกฟรี! Beauty Trio Set 5 รางวัล กดติดตามและคอมเมนต์', en: 'Giveaway! 5× Beauty Trio Set — follow & comment' } },
  { kind: 'engage', framework: 'F3', length: { th: '40-60 คำ', en: '40-60 words' },
    topic: { th: 'แบบทดสอบ 30 วินาที — ผิวคุณเป็นประเภทไหน?', en: '30-sec quiz — what\'s your skin type?' } },
  { kind: 'tip', framework: 'F1', length: { th: '80-120 คำ', en: '80-120 words' },
    topic: { th: '7-step skincare แบบเกาหลี — ที่คนไทยใช้จริงได้', en: '7-step Korean skincare — Thailand edition' } },
  { kind: 'review', framework: 'F2', length: { th: '200+ คำ', en: '200+ words' },
    topic: { th: 'รีวิวจริง — Sheet Mask 7 ยี่ห้อ อันไหนคุ้มสุด?', en: 'Real review — 7 sheet mask brands compared' } },
];

const TopicsPage = () => {
  const t = useT();
  const app = useApp();
  const [theme, setTheme] = React.useState(t({ th: 'โปรโมชั่น 11.11 + เคล็ดลับผิวบอบบาง', en: '11.11 sale + sensitive skin tips' }));
  const [count, setCount] = React.useState(30);
  const [topics, setTopics] = React.useState(TOPIC_MOCK);
  const [loading, setLoading] = React.useState(false);
  const goalList = [
    { l: { th: 'เพิ่มยอดขาย', en: 'Drive sales' } },
    { l: { th: 'สร้าง Awareness', en: 'Brand awareness' } },
    { l: { th: 'ให้ความรู้', en: 'Educate' } },
    { l: { th: 'สร้าง Community', en: 'Build community' } },
    { l: { th: 'รับ Feedback', en: 'Get feedback' } },
  ];
  const [goals, setGoals] = React.useState({ 0: true, 1: true });

  const counts = {
    tip: topics.filter(x => x.kind === 'tip').length,
    knowledge: topics.filter(x => x.kind === 'knowledge').length,
    promo: topics.filter(x => x.kind === 'promo').length,
    review: topics.filter(x => x.kind === 'review').length,
    story: topics.filter(x => x.kind === 'story').length,
    engage: topics.filter(x => x.kind === 'engage').length,
  };

  const generate = async (append) => {
    setLoading(true);
    try {
      const d = await API.ai.topics({ course: 'PFB', count: Number(count) || 30, theme });
      const pillarMap = { pain: 'tip', knowledge: 'knowledge', case: 'review', bts: 'story', promo: 'promo', engage: 'engage' };
      const mapped = (d.topics || []).map(x => ({
        kind: pillarMap[x.pillar] || 'tip',
        framework: x.suggested_framework || 'F1',
        length: '',
        topic: { th: String(x.topic || ''), en: String(x.topic || '') },
      })).filter(x => x.topic.th);
      if (mapped.length) {
        setTopics(append ? topics.concat(mapped) : mapped);
        app.toast(t({ th: `AI สร้าง ${mapped.length} หัวข้อแล้ว`, en: `AI generated ${mapped.length} topics` }), 'success');
      } else {
        app.toast(t({ th: 'AI ไม่ได้คืนหัวข้อ ลองใหม่อีกครั้ง', en: 'AI returned no topics — try again' }), 'error');
      }
    } catch (e) {
      app.toast(t({ th: 'สร้างไม่สำเร็จ: ', en: 'Failed: ' }) + e.message, 'error');
    } finally { setLoading(false); }
  };

  const useTopic = (tp) => {
    window.PP_HANDOFF = { topic: typeof tp.topic === 'object' ? t(tp.topic) : tp.topic };
    app.navigate('generate');
  };

  const exportTopics = () => {
    const lines = topics.map((x, i) => `${i + 1}. [${x.kind}] ${typeof x.topic === 'object' ? t(x.topic) : x.topic}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'postpost-topics.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    app.toast(t({ th: 'ดาวน์โหลดหัวข้อแล้ว', en: 'Topics exported' }), 'success');
  };

  return (
    <DashShell active="topics" crumb="Topic Bank">
      <PageHeader
        title="Topic Bank"
        subtitle={<T th="ให้ AI วางแผนหัวข้อทั้งเดือน 30 หัวข้อ · เลือกธีม + สินค้า แล้วกดสร้าง" en="Let AI plan 30 topics for the month · pick a theme & product, then generate" />}
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={exportTopics}>
              <Icon name="download" size={15} />
              <T th="Export" en="Export" />
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => generate(false)} disabled={loading}>
              <Icon name={loading ? 'refresh' : 'sparkles'} size={15} />
              {loading ? <T th="กำลังสร้าง…" en="Generating…" /> : <T th="ปั่น 30 หัวข้อใหม่" en="Generate 30 new topics" />}
            </button>
          </>
        }
      />

      {/* Controls */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 110px', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="label"><T th="แบรนด์" en="Brand" /></label>
            <button className="input" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 5,
                background: 'linear-gradient(135deg, #FB923C, #F97316)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 10,
              }}>HP</div>
              <span style={{ flex: 1 }}>HappyPrice Shop</span>
              <Icon name="chev-down" size={14} style={{ color: 'var(--cf-ink-2)' }} />
            </button>
          </div>
          <div>
            <label className="label"><T th="ธีมเดือนนี้ (เลือกหรือพิมพ์เอง)" en="Theme for this month" /></label>
            <input className="input" value={theme} onChange={(e) => setTheme(e.target.value)} />
          </div>
          <div>
            <label className="label"><T th="จำนวนหัวข้อ" en="How many" /></label>
            <input className="input" value={count} onChange={(e) => setCount(e.target.value)} type="number" />
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="micro" style={{ fontWeight: 500 }}><T th="จุดมุ่งหมาย:" en="Goals:" /></span>
          {goalList.map((g, i) => {
            const on = !!goals[i];
            return (
              <button key={i} className="pill" onClick={() => setGoals({ ...goals, [i]: !on })} style={{
                height: 28, padding: '0 12px', cursor: 'pointer', fontSize: 12,
                background: on ? 'var(--cf-primary-soft)' : 'var(--cf-surface-2)',
                color: on ? '#9A3412' : 'var(--cf-ink-2)',
                border: on ? '1px solid #FED7AA' : '1px solid var(--cf-border)',
                fontWeight: 500,
              }}>
                {on && <Icon name="check" size={11} stroke={3} />}
                {t(g.l)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="pill" style={{
          height: 34, padding: '0 14px', fontSize: 13, fontWeight: 600,
          background: 'var(--cf-surface)', border: '1px solid var(--cf-border)',
        }}>
          <T th="ทั้งหมด" en="All" />
          <span style={{ color: 'var(--cf-primary)' }}>{topics.length}</span>
        </div>
        {[
          { kind: 'tip', l: { th: 'Tip', en: 'Tips' }, bg: '#EDE9FE', fg: '#6D28D9', border: '#DDD6FE' },
          { kind: 'knowledge', l: { th: 'ให้ความรู้', en: 'Knowledge' }, bg: 'var(--cf-accent-soft)', fg: '#1D4ED8', border: '#DBE5FF' },
          { kind: 'promo', l: { th: 'ขายตรง', en: 'Promo' }, bg: 'var(--cf-primary-soft)', fg: '#9A3412', border: '#FED7AA' },
          { kind: 'review', l: { th: 'รีวิว', en: 'Review' }, bg: 'var(--cf-success-soft)', fg: '#166534', border: '#C8EBD2' },
          { kind: 'story', l: { th: 'เล่าเรื่อง', en: 'Story' }, bg: '#FEF3C7', fg: '#7C2D12', border: '#FCD9A8' },
          { kind: 'engage', l: { th: 'ถาม-ตอบ', en: 'Engage' }, bg: '#CFFAFE', fg: '#0E7490', border: '#A5F3FC' },
        ].map(s => (
          <div key={s.kind} className="pill" style={{
            height: 34, padding: '0 14px', fontSize: 13, fontWeight: 600,
            background: s.bg, color: s.fg, border: `1px solid ${s.border}`, gap: 6,
          }}>
            {t(s.l)} <span>{counts[s.kind]}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div className="pill" style={{
          height: 34, padding: '0 12px', fontSize: 12,
          background: 'var(--cf-surface)', border: '1px solid var(--cf-border)',
        }}>
          <T th="ใช้ไปแล้ว" en="Used so far" />
          <b>{topics.filter(x => x.used).length}</b>
          / {topics.length}
        </div>
      </div>

      {/* Topics grid */}
      {loading && topics.length === 0 ? (
        <p className="muted"><T th="กำลังให้ AI คิดหัวข้อ…" en="AI is thinking…" /></p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {topics.map((tp, i) => (
            <Topic key={i} {...tp} onUse={() => useTopic(tp)} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => generate(true)} disabled={loading}>
          <Icon name="plus" size={15} />
          <T th="คิดเพิ่มอีก 30 หัวข้อ" en="Generate 30 more" />
        </button>
      </div>
    </DashShell>
  );
};

window.TopicsPage = TopicsPage;
