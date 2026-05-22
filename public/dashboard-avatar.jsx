// Avatar/Video page — tab switcher between Talking Avatar and Text-to-Video

// ====== TALKING AVATAR TAB ======
const TalkingAvatarTab = () => {
  const t = useT();
  const app = useApp();
  const [script, setScript] = React.useState(t({
    th: 'สวัสดีค่ะคุณลูกค้า วันนี้พีร์มี Rose Repair Serum สูตรเข้มข้นมาแนะนำ\n\nเหมาะมากกับผิวที่บอบบางและแพ้ง่าย วันที่ 11 พ.ย. นี้ลดเหลือเพียง 345 บาท ส่งฟรีถึงบ้านเลยค่ะ',
    en: 'Hi! Today I want to introduce Rose Repair Serum, our concentrated formula.\n\nPerfect for sensitive skin. On Nov 11, just ฿345 with free shipping nationwide.',
  }));
  const [busy, setBusy] = React.useState(false);
  const aiWrite = async () => {
    setBusy(true);
    try {
      const r = await API.ai.avatarScript({ course: 'PFB', topic: (script || '').slice(0, 240) || 'แนะนำสินค้าสกินแคร์' });
      const s = (r && (r.script || r.text || r.caption)) || (typeof r === 'string' ? r : '');
      if (s) { setScript(s); app.toast(t({ th: 'AI เขียนสคริปต์ให้แล้ว', en: 'AI wrote a script' }), 'success'); }
      else app.toast(t({ th: 'AI ไม่ได้คืนสคริปต์ ลองใหม่', en: 'No script returned — try again' }), 'error');
    } catch (e) {
      app.toast(t({ th: 'เขียนไม่สำเร็จ: ', en: 'Failed: ' }) + e.message, 'error');
    } finally { setBusy(false); }
  };
  const wordCount = (script || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 20, alignItems: 'flex-start' }}>
      {/* === LEFT: settings === */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Mode */}
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}><T th="ขั้นที่ 1 · โหมด" en="Step 1 · Mode" /></div>
          <h3 className="h3" style={{ marginBottom: 12 }}><T th="เลือกระดับคุณภาพ" en="Pick quality level" /></h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { id: 'free', title: { th: 'Audio-reactive', en: 'Audio-reactive' }, sub: { th: 'ปากขยับตามเสียง · เร็ว', en: 'Mouth moves with audio · fast' }, time: { th: '~30 วินาที', en: '~30 sec' }, icon: 'mic' },
              { id: 'real', title: { th: 'Real lip-sync', en: 'Real lip-sync' }, sub: { th: 'AI sync ปากตามคำจริง', en: 'AI syncs lips to actual words' }, time: { th: '1-3 นาที', en: '1-3 min' }, icon: 'sparkles', on: true },
            ].map(m => (
              <button key={m.id} style={{
                font: 'inherit', textAlign: 'left', padding: 14, borderRadius: 12, cursor: 'pointer',
                border: m.on ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                background: m.on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: m.on ? 'white' : 'var(--cf-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: m.on ? 'var(--cf-primary)' : 'var(--cf-ink-2)',
                  }}><Icon name={m.icon} size={16} /></div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{t(m.title)}</span>
                  {m.on && <Icon name="check" size={14} stroke={3} style={{ marginLeft: 'auto', color: 'var(--cf-primary)' }} />}
                </div>
                <div style={{ fontSize: 12, color: 'var(--cf-ink-2)', marginBottom: 8, lineHeight: 1.45 }}>{t(m.sub)}</div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}><T th="เรนเดอร์" en="Render" /> {t(m.time)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Avatar picker */}
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}><T th="ขั้นที่ 2 · เลือกผู้บรรยาย" en="Step 2 · Pick presenter" /></div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="h3"><T th="Presenter" en="Presenter" /></h3>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--cf-accent)' }}>
              <Icon name="sparkles" size={13} />
              <T th="สร้างคนใหม่ด้วย AI" en="Create new with AI" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { name: { th: 'มินตรา', en: 'Mintra' }, sub: { th: 'หญิงไทย 28', en: 'Thai F · 28' }, bg: 'linear-gradient(180deg, #FCD9A8, #F97316)', initial: { th: 'ม', en: 'M' }, on: true },
              { name: { th: 'ภูมิ', en: 'Phum' }, sub: { th: 'ชายไทย 35', en: 'Thai M · 35' }, bg: 'linear-gradient(180deg, #C7D2FE, #4F46E5)', initial: { th: 'ภ', en: 'P' } },
              { name: { th: 'น้องโรส', en: 'Rose' }, sub: { th: 'หญิง 22', en: 'F · 22' }, bg: 'linear-gradient(180deg, #FBCFE8, #DB2777)', initial: { th: 'ร', en: 'R' } },
              { name: { th: 'อาจารย์วุฒิ', en: 'Wuth' }, sub: { th: 'อาวุโส 55', en: 'Senior · 55' }, bg: 'linear-gradient(180deg, #FEF3C7, #92400E)', initial: { th: 'ว', en: 'W' } },
            ].map(a => (
              <button key={a.name.en} style={{
                font: 'inherit', cursor: 'pointer',
                padding: 8, borderRadius: 12,
                border: a.on ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                background: a.on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                position: 'relative',
              }}>
                <div style={{
                  aspectRatio: '3 / 4', borderRadius: 8, background: a.bg,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden', marginBottom: 6,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 999, background: 'rgba(255,255,255,0.85)',
                    marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--cf-ink-0)', fontWeight: 700, fontSize: 22,
                  }}>{t(a.initial)}</div>
                  {a.on && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 999, background: 'var(--cf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                      <Icon name="check" size={11} stroke={3} style={{ color: 'white' }} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{t(a.name)}</div>
                <div style={{ fontSize: 10, color: 'var(--cf-ink-2)' }}>{t(a.sub)}</div>
              </button>
            ))}
            <button style={{
              font: 'inherit', cursor: 'pointer',
              padding: 8, borderRadius: 12,
              border: '1px dashed var(--cf-border-2)',
              background: 'var(--cf-surface-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cf-ink-2)', minHeight: 140,
            }}>
              <Icon name="upload" size={20} />
              <span style={{ marginTop: 6, fontSize: 11, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                <T th={<>อัปโหลด<br/>รูปคน</>} en={<>Upload<br/>photo</>} />
              </span>
            </button>
          </div>
        </div>

        {/* Voice */}
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}><T th="ขั้นที่ 3 · เสียง" en="Step 3 · Voice" /></div>
          <h3 className="h3" style={{ marginBottom: 12 }}><T th="เสียงพากย์ (TTS ภาษาไทย)" en="Voice (Thai TTS)" /></h3>

          <button className="input" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            height: 'auto', textAlign: 'left',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: 'linear-gradient(135deg, #FCD9A8, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Icon name="play" size={11} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)' }}>
                <T th="Premwadee — หญิง · อบอุ่น" en="Premwadee — F · warm" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>
                <T th="Azure Thai · เหมาะกับสกินแคร์, ความงาม" en="Azure Thai · for skincare & beauty" />
              </div>
            </div>
            <Icon name="chev-down" size={14} style={{ color: 'var(--cf-ink-2)' }} />
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            {[
              { label: { th: 'ความเร็ว', en: 'Speed' }, opts: [{ th: 'ช้า', en: 'Slow' }, { th: 'ปกติ', en: 'Normal' }, { th: 'เร็ว', en: 'Fast' }] },
              { label: { th: 'ระดับเสียง', en: 'Pitch' }, opts: [{ th: 'ต่ำ', en: 'Low' }, { th: 'ปกติ', en: 'Normal' }, { th: 'สูง', en: 'High' }] },
            ].map(g => (
              <div key={g.label.en}>
                <label className="label">{t(g.label)}</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {g.opts.map((s, i) => (
                    <button key={i} className="pill" style={{
                      flex: 1, justifyContent: 'center', height: 32, fontSize: 12, cursor: 'pointer',
                      background: i === 1 ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                      border: i === 1 ? '1px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                      color: i === 1 ? '#9A3412' : 'var(--cf-ink-1)',
                      fontWeight: 600,
                    }}>{t(s)}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Script */}
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}><T th="ขั้นที่ 4 · สคริปต์" en="Step 4 · Script" /></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 className="h3"><T th="สคริปต์พูด (Thai)" en="Speaking script (Thai)" /></h3>
            <button className="btn btn-ghost btn-sm" onClick={aiWrite} disabled={busy} style={{ color: 'var(--cf-accent)' }}>
              <Icon name={busy ? 'refresh' : 'sparkles'} size={13} />
              {busy ? <T th="กำลังเขียน…" en="Writing…" /> : <T th="ให้ AI เขียนให้" en="AI write for me" />}
            </button>
          </div>
          <textarea
            className="textarea"
            rows={5}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            style={{ fontSize: 14, lineHeight: 1.65 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--cf-ink-2)' }}>
            <span>
              <T th={<>{wordCount} คำ · เรนเดอร์ประมาณ <b style={{ color: 'var(--cf-ink-0)' }}>~{Math.max(5, Math.round(wordCount / 3.5))} วินาที</b></>}
                 en={<>{wordCount} words · render ~<b style={{ color: 'var(--cf-ink-0)' }}>{Math.max(5, Math.round(wordCount / 3.5))} sec</b></>} />
            </span>
            <span><T th="เหมาะกับ Reels (≤ 60 วินาที)" en="Fits Reels (≤ 60 sec)" /></span>
          </div>
        </div>
      </div>

      {/* === RIGHT: phone preview === */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 0 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 className="h3"><T th="ตัวอย่างคลิป" en="Clip preview" /></h3>
            <span className="pill pill-blue" style={{ fontSize: 11 }}>
              <Icon name="video" size={11} />
              9:16 · Reels / TikTok
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 280, aspectRatio: '9 / 16',
              borderRadius: 28, position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(180deg, #FFEDD5 0%, #FED7AA 40%, #FB923C 100%)',
              border: '4px solid #111827',
              boxShadow: 'var(--cf-shadow-3)',
            }}>
              <div style={{ position: 'absolute', top: 8, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'white', fontWeight: 600, zIndex: 3 }}>
                <span>19:00</span><span>● ● ●</span>
              </div>
              <div style={{
                position: 'absolute', top: 38, left: 16, right: 16, zIndex: 3,
                background: 'white', borderRadius: 12, padding: '10px 12px',
                fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: '#0F172A',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                <span style={{ color: 'var(--cf-primary)' }}>Rose Repair</span> · <T th="ลด 50%" en="50% off" /><br/>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-ink-2)' }}><T th="เฉพาะ 11.11 เท่านั้น" en="Nov 11 only" /></span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ width: '90%', height: '60%', background: 'linear-gradient(180deg, #FCA5A5 0%, #DC2626 100%)', borderRadius: '50% 50% 0 0 / 30% 30% 0 0', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', bottom: '70%', left: '50%', transform: 'translateX(-50%)',
                    width: 110, height: 130, borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
                    background: 'linear-gradient(180deg, #FBCFB0, #F4A07A)',
                    boxShadow: 'inset 0 -10px 20px rgba(124,45,18,0.15)',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: -8, right: -8, height: 56, background: '#1F2937', borderRadius: '50% 50% 30% 30% / 90% 90% 30% 30%' }} />
                    <div style={{ position: 'absolute', top: 60, left: 22, width: 12, height: 8, background: '#1F2937', borderRadius: 999 }} />
                    <div style={{ position: 'absolute', top: 60, right: 22, width: 12, height: 8, background: '#1F2937', borderRadius: 999 }} />
                    <div style={{ position: 'absolute', top: 78, left: 14, width: 16, height: 10, background: 'rgba(244,114,182,0.55)', borderRadius: 999, filter: 'blur(2px)' }} />
                    <div style={{ position: 'absolute', top: 78, right: 14, width: 16, height: 10, background: 'rgba(244,114,182,0.55)', borderRadius: 999, filter: 'blur(2px)' }} />
                    <div style={{
                      position: 'absolute', top: 88, left: '50%', transform: 'translateX(-50%)',
                      width: 28, height: 14, background: '#9A1A47', borderRadius: '50%',
                      boxShadow: 'inset 0 -3px 5px rgba(255,255,255,0.35)',
                    }} />
                  </div>
                </div>
              </div>
              <div style={{
                position: 'absolute', bottom: 70, left: 16, right: 16, zIndex: 3,
                background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
                color: 'white', padding: '8px 12px', borderRadius: 8,
                fontSize: 12, fontWeight: 500, textAlign: 'center', lineHeight: 1.4,
              }}>
                <T th={<>ลดเหลือเพียง <span style={{ color: '#FCD9A8' }}>345 บาท</span><br/>ส่งฟรีถึงบ้านเลยค่ะ</>} en={<>Now only <span style={{ color: '#FCD9A8' }}>฿345</span><br/>Free shipping</>} />
              </div>
              <div style={{
                position: 'absolute', top: 110, right: 14, zIndex: 4,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
                color: 'white', padding: '4px 8px', borderRadius: 6,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
              }}>HAPPYPRICE</div>
              <div style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 5,
                width: 54, height: 54, borderRadius: 999, background: 'rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--cf-ink-0)', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', cursor: 'pointer',
              }}>
                <Icon name="play" size={22} />
              </div>
              <div style={{ position: 'absolute', bottom: 30, left: 16, right: 16, zIndex: 3, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.35)' }}>
                <div style={{ width: '38%', height: '100%', borderRadius: 999, background: 'white' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 3, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                <span>0:10</span><span>0:27</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
              onClick={() => app.toast(t({ th: 'ดาวน์โหลด MP4 — ต้องเรนเดอร์คลิปก่อน', en: 'Download MP4 — render the clip first' }), 'info')}>
              <Icon name="download" size={14} />
              MP4
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
              onClick={() => app.toast(t({ th: 'กำลังเรนเดอร์คลิปอวตาร…', en: 'Rendering avatar clip…' }), 'info')}>
              <Icon name="refresh" size={14} />
              <T th="เรนเดอร์ใหม่" en="Re-render" />
            </button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1.5 }}
              onClick={() => app.toast(t({ th: 'ส่งคลิปเข้าคิวโพสต์ Reels + TikTok แล้ว', en: 'Clip queued for Reels + TikTok' }), 'success')}>
              <Icon name="send" size={14} />
              <T th="โพสต์ Reels + TikTok" en="Post to Reels + TikTok" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====== TEXT-TO-VIDEO TAB ======
const TextToVideoTab = () => {
  const t = useT();
  const app = useApp();
  const [prompt, setPrompt] = React.useState(t({
    th: 'กล้องเลื่อนช้า ๆ ผ่านสวนกุหลาบเขาใหญ่ตอนเช้า แสงทองเล็ดลอด หยดน้ำค้างเกาะกลีบกุหลาบ ขวด Rose Repair Serum วางอยู่กลางกอกุหลาบ ดูพรีเมียม โทนอบอุ่น สโลโมชั่น',
    en: 'Slow camera pan through a Khao Yai rose garden at sunrise, golden light flickering through petals, dew drops on rose petals, Rose Repair Serum bottle resting among roses, premium feel, warm tones, slow motion',
  }));
  const [busy, setBusy] = React.useState(false);
  const aiPrompt = async () => {
    setBusy(true);
    try {
      const r = await API.ai.avatarScript({ course: 'PFB', topic: (prompt || '').slice(0, 240) || 'วิดีโอโปรโมตสินค้า', mode: 'video' });
      const s = (r && (r.script || r.text || r.prompt || r.caption)) || (typeof r === 'string' ? r : '');
      if (s) { setPrompt(s); app.toast(t({ th: 'AI ปั้น Prompt ให้แล้ว', en: 'AI wrote a prompt' }), 'success'); }
      else app.toast(t({ th: 'AI ไม่ได้คืน Prompt ลองใหม่', en: 'No prompt returned — try again' }), 'error');
    } catch (e) {
      app.toast(t({ th: 'สร้างไม่สำเร็จ: ', en: 'Failed: ' }) + e.message, 'error');
    } finally { setBusy(false); }
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 20, alignItems: 'flex-start' }}>
      {/* LEFT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Prompt */}
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}><T th="ขั้นที่ 1 · คำสั่ง" en="Step 1 · Prompt" /></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 className="h3"><T th="บรรยายวิดีโอที่คุณต้องการ" en="Describe the video you want" /></h3>
            <button className="btn btn-ghost btn-sm" onClick={aiPrompt} disabled={busy} style={{ color: 'var(--cf-accent)' }}>
              <Icon name={busy ? 'refresh' : 'sparkles'} size={13} />
              {busy ? <T th="กำลังปั้น…" en="Writing…" /> : <T th="ให้ AI ปั้น Prompt ให้" en="Let AI write the prompt" />}
            </button>
          </div>
          <textarea
            className="textarea"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ fontSize: 14, lineHeight: 1.65 }}
          />
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className="micro" style={{ width: '100%', marginBottom: 2 }}><T th="ไอเดียด่วน:" en="Quick ideas:" /></span>
            {[
              { th: 'B-roll สินค้าหมุนรอบ 360°', en: 'Product 360° spin B-roll' },
              { th: 'Lifestyle ลูกค้าใช้สินค้าจริง', en: 'Lifestyle · customer using it' },
              { th: 'Stop-motion เปิดกล่อง', en: 'Stop-motion unboxing' },
              { th: 'Cinematic ใส่ส่วนผสม', en: 'Cinematic ingredient pour' },
              { th: 'โฆษณาตลาดสด vintage', en: 'Vintage market commercial' },
            ].map((s, i) => (
              <button key={i} className="pill" style={{
                fontSize: 11, height: 26, cursor: 'pointer',
                background: 'var(--cf-surface-2)', border: '1px dashed var(--cf-border-2)',
                color: 'var(--cf-ink-1)', fontWeight: 500,
              }}>
                <Icon name="sparkles" size={10} style={{ color: 'var(--cf-accent)' }} />
                {t(s)}
              </button>
            ))}
          </div>
        </div>

        {/* Reference */}
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}><T th="ขั้นที่ 2 · รูปอ้างอิง" en="Step 2 · Reference image" /></div>
          <h3 className="h3" style={{ marginBottom: 10 }}>
            <T th="รูปสินค้า (ไม่จำเป็น)" en="Product photo (optional)" />
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div style={{
              aspectRatio: '1/1', borderRadius: 10,
              background: 'linear-gradient(135deg, #FFEDD5, #FECDD3)',
              border: '1px solid var(--cf-border)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.5)' }} />
              <div style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                width: 48, height: 60, borderRadius: 8,
                background: 'linear-gradient(180deg, #FFFBEB, #FED7AA)',
                boxShadow: '0 4px 10px -2px rgba(124,45,18,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#7C2D12', fontSize: 8, fontWeight: 700, letterSpacing: '0.05em',
              }}>SERUM</div>
              <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, fontSize: 9, padding: '2px 6px', borderRadius: 999, background: 'rgba(0,0,0,0.55)', color: 'white', textAlign: 'center' }}>
                Rose Repair · Shopee
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
                <Icon name="package" size={13} />
                <T th="เลือกจากสินค้า" en="Pick from products" />
              </button>
              <button className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
                <Icon name="upload" size={13} />
                <T th="อัปโหลดรูปอื่น" en="Upload other" />
              </button>
              <div className="micro" style={{ marginTop: 'auto' }}>
                <T th="ใส่รูปอ้างอิงเพื่อให้ AI รักษาตัวสินค้าให้คงเดิม" en="Add a reference so AI keeps the product consistent" />
              </div>
            </div>
          </div>
        </div>

        {/* Style + duration */}
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}><T th="ขั้นที่ 3 · สไตล์ & ความยาว" en="Step 3 · Style & duration" /></div>

          <label className="label"><T th="สไตล์ภาพ" en="Visual style" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { l: { th: 'Cinematic', en: 'Cinematic' }, sub: { th: 'ภาพยนตร์', en: 'Filmic' }, bg: 'linear-gradient(135deg, #1F2937, #6B7280)', on: true },
              { l: { th: 'Lifestyle', en: 'Lifestyle' }, sub: { th: 'ใช้จริง', en: 'Real-use' }, bg: 'linear-gradient(135deg, #FED7AA, #FB923C)' },
              { l: { th: 'Anime/3D', en: 'Anime/3D' }, sub: { th: 'การ์ตูน', en: 'Animated' }, bg: 'linear-gradient(135deg, #C7D2FE, #818CF8)' },
              { l: { th: 'Product', en: 'Product' }, sub: { th: 'เน้นสินค้า', en: 'Product-focus' }, bg: 'linear-gradient(135deg, #FBCFE8, #DB2777)' },
            ].map((s, i) => (
              <button key={i} style={{
                font: 'inherit', cursor: 'pointer',
                padding: 0, borderRadius: 10, overflow: 'hidden',
                border: s.on ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                background: 'white', position: 'relative',
              }}>
                <div style={{ aspectRatio: '4/3', background: s.bg, position: 'relative' }}>
                  {s.on && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 999, background: 'var(--cf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" size={10} stroke={3} style={{ color: 'white' }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '6px 8px', textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{t(s.l)}</div>
                  <div style={{ fontSize: 9, color: 'var(--cf-ink-2)' }}>{t(s.sub)}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label"><T th="ความยาว" en="Duration" /></label>
              <div style={{ display: 'flex', gap: 4 }}>
                {['5s', '10s', '15s', '30s'].map((s, i) => (
                  <button key={s} className="pill" style={{
                    flex: 1, justifyContent: 'center', height: 32, fontSize: 12, cursor: 'pointer',
                    background: i === 1 ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                    border: i === 1 ? '1px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                    color: i === 1 ? '#9A3412' : 'var(--cf-ink-1)',
                    fontWeight: 600,
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label"><T th="สัดส่วน" en="Aspect" /></label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { r: '9:16', sub: 'Reels' },
                  { r: '1:1', sub: 'Feed', on: true },
                  { r: '16:9', sub: 'YT' },
                ].map(a => (
                  <button key={a.r} className="pill" style={{
                    flex: 1, flexDirection: 'column', height: 'auto', padding: '4px 4px', fontSize: 12, cursor: 'pointer',
                    background: a.on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                    border: a.on ? '1px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                    color: a.on ? '#9A3412' : 'var(--cf-ink-1)',
                    fontWeight: 600,
                  }}>
                    {a.r}
                    <span style={{ fontSize: 9, opacity: 0.8 }}>{a.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Model */}
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}><T th="ขั้นที่ 4 · โมเดล" en="Step 4 · Model" /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'sora', name: 'Sora 2', sub: { th: 'คุณภาพสูงสุด · เหมาะกับงานโปรโมท', en: 'Highest quality · best for promos' }, time: { th: '~3 นาที', en: '~3 min' }, on: true },
              { id: 'veo', name: 'Veo 3', sub: { th: 'ปานกลาง · เร็วกว่า', en: 'Balanced · faster' }, time: { th: '~1.5 นาที', en: '~1.5 min' } },
              { id: 'kling', name: 'Kling 2.0', sub: { th: 'ถูกสุด · เหมาะกับ test', en: 'Cheapest · good for tests' }, time: { th: '~50 วินาที', en: '~50 sec' } },
            ].map(m => (
              <button key={m.id} style={{
                font: 'inherit', textAlign: 'left', cursor: 'pointer',
                padding: '12px 14px', borderRadius: 10,
                border: m.on ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                background: m.on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: m.on ? 'white' : 'var(--cf-surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: m.on ? 'var(--cf-primary)' : 'var(--cf-ink-2)',
                }}><Icon name="video" size={14} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--cf-ink-2)' }}>{t(m.sub)}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--cf-ink-2)', textAlign: 'right' }}>
                  <T th="เรนเดอร์" en="Render" /> {t(m.time)}
                </div>
                {m.on && <Icon name="check" size={14} stroke={3} style={{ color: 'var(--cf-primary)' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: video preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 0 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 className="h3"><T th="ตัวอย่างวิดีโอ" en="Video preview" /></h3>
            <span className="pill pill-blue" style={{ fontSize: 11 }}>
              <Icon name="sparkles" size={11} />
              Sora 2 · 1:1 · 10s
            </span>
          </div>

          {/* Square video preview */}
          <div style={{
            aspectRatio: '1 / 1', borderRadius: 14, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 40%, #FB923C 100%)',
            border: '1px solid var(--cf-border)', boxShadow: 'var(--cf-shadow-2)',
          }}>
            {/* Sun ray */}
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 999,
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
            }} />
            {/* Petals */}
            <div style={{ position: 'absolute', top: 30, left: 60, width: 20, height: 14, background: '#F472B6', borderRadius: '50% 0', transform: 'rotate(-25deg)', opacity: 0.85 }} />
            <div style={{ position: 'absolute', top: 80, left: 110, width: 16, height: 11, background: '#FB7185', borderRadius: '50% 0', transform: 'rotate(15deg)', opacity: 0.7 }} />
            <div style={{ position: 'absolute', top: 200, right: 60, width: 18, height: 13, background: '#DC2626', borderRadius: '50% 0', transform: 'rotate(45deg)', opacity: 0.7 }} />
            <div style={{ position: 'absolute', bottom: 120, left: 40, width: 22, height: 15, background: '#F472B6', borderRadius: '50% 0', transform: 'rotate(-60deg)', opacity: 0.6 }} />
            {/* Garden silhouette */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(180deg, rgba(124,45,18,0) 0%, rgba(124,45,18,0.45) 100%)' }} />

            {/* Serum bottle */}
            <div style={{
              position: 'absolute', left: '50%', top: '55%', transform: 'translate(-50%, -50%)',
              width: 90, height: 140, borderRadius: 14,
              background: 'linear-gradient(180deg, #FFFBEB, #FED7AA 60%, #C2410C)',
              boxShadow: '0 18px 36px -8px rgba(124,45,18,0.50), inset 4px 0 6px rgba(255,255,255,0.4)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#7C2D12', textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', fontWeight: 600 }}>SIAM ROSE</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Rose Repair</div>
              <div style={{ fontSize: 8, marginTop: 2 }}>SERUM · 30ML</div>
            </div>

            {/* Dewdrop highlights */}
            <div style={{ position: 'absolute', left: '38%', top: '52%', width: 6, height: 6, borderRadius: 999, background: 'white', opacity: 0.8, boxShadow: '0 0 8px white' }} />
            <div style={{ position: 'absolute', left: '60%', top: '60%', width: 4, height: 4, borderRadius: 999, background: 'white', opacity: 0.7 }} />

            {/* Watermark */}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)',
              padding: '4px 8px', borderRadius: 999,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#9A3412',
            }}>AI GENERATED · SORA 2</div>

            {/* Play button */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
              width: 64, height: 64, borderRadius: 999, background: 'rgba(255,255,255,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cf-ink-0)', boxShadow: '0 8px 24px rgba(0,0,0,0.30)', cursor: 'pointer',
            }}>
              <Icon name="play" size={28} />
            </div>

            {/* Progress + timer */}
            <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
              <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.35)' }}>
                <div style={{ width: '45%', height: '100%', borderRadius: 999, background: 'white' }} />
              </div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'white', fontWeight: 600 }}>
                <span>0:04</span>
                <span>0:10</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
              onClick={() => app.toast(t({ th: 'ดาวน์โหลด MP4 — ต้องสร้างวิดีโอก่อน', en: 'Download MP4 — generate the video first' }), 'info')}>
              <Icon name="download" size={14} />
              MP4
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
              onClick={() => app.toast(t({ th: 'กำลังสร้างวิดีโอจาก Prompt…', en: 'Generating video from prompt…' }), 'info')}>
              <Icon name="refresh" size={14} />
              <T th="สร้างใหม่" en="Re-generate" />
            </button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1.5 }}
              onClick={() => app.toast(t({ th: 'ส่งวิดีโอไปหน้า Generate แล้ว', en: 'Video sent to Generate' }), 'success')}>
              <Icon name="send" size={14} />
              <T th="ใช้เป็นโพสต์ทันที" en="Use as post" />
            </button>
          </div>
        </div>

        {/* Variants */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 className="h3" style={{ fontSize: 14 }}><T th="เวอร์ชั่นอื่น ๆ" en="Other variants" /></h3>
            <button className="btn btn-ghost btn-sm" style={{ height: 26, padding: '0 8px', color: 'var(--cf-ink-2)' }}>
              <Icon name="plus" size={12} />
              <T th="สร้างเพิ่ม" en="Create more" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { bg: 'linear-gradient(135deg, #FFEDD5, #FB923C)', label: 'v1' },
              { bg: 'linear-gradient(135deg, #FECACA, #DC2626)', label: 'v2' },
              { bg: 'linear-gradient(135deg, #FBCFE8, #DB2777)', label: 'v3' },
            ].map(v => (
              <div key={v.label} style={{
                aspectRatio: '1/1', borderRadius: 8, position: 'relative',
                background: v.bg, border: '1px solid var(--cf-border)',
                cursor: 'pointer',
              }}>
                <div style={{
                  position: 'absolute', bottom: 6, left: 6,
                  fontSize: 9, fontWeight: 700, color: 'white',
                  padding: '2px 6px', borderRadius: 999,
                  background: 'rgba(0,0,0,0.4)',
                }}>{v.label}</div>
                <div style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                  width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.85)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cf-ink-0)',
                }}>
                  <Icon name="play" size={11} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ====== Main page with tab ======
const AvatarPage = ({ tab = 'avatar' }) => {
  const t = useT();
  const [activeTab, setActiveTab] = React.useState(tab);
  return (
    <DashShell active="avatar" crumb={activeTab === 'video' ? 'Text to Video' : 'Talking Avatar'}>
      <PageHeader
        title={
          <>
            {activeTab === 'video' ? <T th="สร้างวิดีโอจากข้อความ" en="Text to Video" /> : <T th="Talking Avatar" en="Talking Avatar" />}
            <span className="pill pill-blue" style={{ verticalAlign: 'middle', fontSize: 11, marginLeft: 10 }}>NEW</span>
          </>
        }
        subtitle={
          activeTab === 'video'
            ? <T th="พิมพ์คำสั่ง · เลือกสไตล์ · ให้ AI สร้างวิดีโอ MP4 พร้อมโพสต์ Reels / TikTok" en="Type a prompt · pick a style · AI renders an MP4 ready for Reels / TikTok" />
            : <T th="เลือกผู้บรรยาย AI · ใส่สคริปต์ภาษาไทย · ได้คลิป MP4 พร้อมโพสต์ Reels / TikTok" en="Pick a presenter · type a Thai script · get an MP4 for Reels / TikTok" />
        }
        actions={
          <>
            <button className="btn btn-secondary btn-sm">
              <Icon name="library" size={15} />
              <T th="คลิปที่สร้างไว้" en="Past clips" />
              <span style={{
                padding: '0 6px', height: 18, marginLeft: 2,
                borderRadius: 999, background: 'var(--cf-primary-soft)',
                color: '#9A3412', fontSize: 10, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center',
              }}>14</span>
            </button>
            <button className="btn btn-secondary btn-sm">
              <Icon name="info" size={15} />
              <T th="คู่มือ & โมเดล" en="Guide & models" />
            </button>
          </>
        }
      />

      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'avatar', label: { th: 'Talking Avatar · คนพูดสคริปต์', en: 'Talking Avatar · script-driven' }, icon: 'bot' },
          { id: 'video', label: { th: 'Text to Video · ปั้นวิดีโอจากคำสั่ง', en: 'Text to Video · prompt-driven' }, icon: 'video' },
        ]}
      />

      {activeTab === 'video' ? <TextToVideoTab /> : <TalkingAvatarTab />}
    </DashShell>
  );
};

window.AvatarPage = AvatarPage;
