// Generate tab contents — Caption (with article) + Creative (with per-slide captions)

// === CAPTION TAB ===
const HookCard = ({ text, sub, selected, onClick }) => (
  <div onClick={onClick} style={{
    border: selected ? '2px solid var(--cf-primary)' : '1px solid var(--cf-border)',
    background: selected ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
    borderRadius: 12, padding: '14px 16px',
    display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer',
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 999, flexShrink: 0, marginTop: 2,
      border: selected ? '6px solid var(--cf-primary)' : '2px solid var(--cf-border-2)',
      background: selected ? 'white' : 'transparent',
      boxSizing: 'border-box',
    }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, color: 'var(--cf-ink-0)', lineHeight: 1.5, fontWeight: selected ? 500 : 400 }}>{text}</div>
      <div className="micro" style={{ marginTop: 6, fontWeight: 500 }}>{sub}</div>
    </div>
    <button className="btn btn-ghost btn-sm" style={{ height: 28, padding: '0 8px', color: 'var(--cf-ink-2)' }}><Icon name="copy" size={13} /></button>
  </div>
);

const GenerateCaption = () => {
  const t = useT();
  const gen = useGen();
  const r = gen.result;
  const mockHooks = [
    { text: t({ th: 'อายุ 30+ คอลลาเจนหายไป 1.5% ทุกปี — เริ่มเติมตอนนี้ยังทัน', en: 'After 30, collagen drops 1.5% a year — start now before it\'s too late' }), sub: t({ th: 'แรง · เน้นความเร่งด่วน', en: 'Punchy · urgency-driven' }) },
    { text: t({ th: 'Marine Collagen จากนิวซีแลนด์ — ดูดซึมดีกว่า Bovine 1.5 เท่า ผิวเริ่มเปลี่ยนใน 14 วัน', en: 'Marine collagen from NZ — absorbs 1.5× better than bovine, skin changes in 14 days' }), sub: t({ th: 'อ่อนโยน · เน้นข้อพิสูจน์ทางวิทยาศาสตร์', en: 'Gentle · science-backed' }), selected: true },
    { text: t({ th: 'แม่ ๆ วัย 35+ ลองดูค่ะ — คอลลาเจนตัวที่อร่อย ไม่คาว แค่วันละ 1 ช้อน', en: 'Moms 35+ — finally a tasty collagen, no fishy smell, just 1 scoop a day' }), sub: t({ th: 'ใกล้ชิด · กลุ่มเป้าหมายตรง', en: 'Intimate · audience-targeted' }) },
  ];
  const aiHooks = r && Array.isArray(r.hook_options) && r.hook_options.length
    ? r.hook_options.map((text) => ({ text, sub: t({ th: 'AI สร้างจากหัวข้อของคุณ', en: 'AI-generated from your topic' }) }))
    : null;
  const hooks = aiHooks || mockHooks;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20 }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Hooks */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 className="h3"><T th="เลือก Hook ที่ใช่" en="Pick a hook" /></h3>
              <p className="micro" style={{ margin: '2px 0 0' }}>
                <T th="AI สร้าง 3 แนว · เลือก 1 อันเพื่อใช้ในแคปชั่น" en="AI wrote 3 angles · pick one to feature in the caption" />
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => gen.generate && gen.generate()} disabled={gen.loading}>
              <Icon name="refresh" size={13} />
              <T th="สร้างใหม่" en="Regenerate" />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hooks.map((h, i) => (
              <HookCard key={i} text={h.text} sub={h.sub}
                selected={aiHooks ? gen.selectedHook === i : h.selected}
                onClick={() => aiHooks && gen.setSelectedHook && gen.setSelectedHook(i)} />
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 className="h3"><T th="แคปชั่น" en="Caption" /></h3>
              <p className="micro" style={{ margin: '2px 0 0' }}>
                <T th="247 ตัวอักษร · เหมาะกับ Facebook & Instagram Post" en="247 chars · ideal for Facebook & IG Post" />
              </p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-sm"><Icon name="edit" size={13} /></button>
              <button className="btn btn-ghost btn-sm"><Icon name="copy" size={13} /></button>
              <button className="btn btn-ghost btn-sm"><Icon name="refresh" size={13} /></button>
            </div>
          </div>
          <div style={{
            background: 'var(--cf-surface-2)', borderRadius: 10, padding: 16,
            fontSize: 14, lineHeight: 1.65, color: 'var(--cf-ink-0)',
            border: '1px solid var(--cf-border)',
          }}>
            {r && r.caption ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{r.caption}</div>
            ) : (
            <T
              th={<>
                <p style={{ margin: 0 }}><b>Marine Collagen from New Zealand 100g</b> 🌿</p>
                <p style={{ margin: '12px 0 0' }}>
                  คอลลาเจนเปปไทด์จากปลาทะเลน้ำเย็น <b>ดูดซึมได้ดีกว่า Bovine Collagen 1.5 เท่า</b> ไม่มีกลิ่นคาว ไม่ใส่น้ำตาล กินง่าย วันละ 1 ช้อน ผสมในกาแฟหรือน้ำเปล่าก็อร่อย
                </p>
                <p style={{ margin: '12px 0 0' }}>
                  🎁 <b>11.11 ลด 50%</b> เหลือเพียง <b>฿275</b> เฉพาะวันที่ 11 พ.ย. นี้เท่านั้น<br/>
                  📦 ส่งฟรีทั่วประเทศ
                </p>
                <p style={{ margin: '12px 0 0', color: 'var(--cf-ink-2)' }}>
                  👉 สั่งซื้อทักแชทเลยค่ะ คุณลูกค้า หรือกดลิงก์ Shopee ใต้โพสต์
                </p>
              </>}
              en={<>
                <p style={{ margin: 0 }}><b>Marine Collagen from New Zealand 100g</b> 🌿</p>
                <p style={{ margin: '12px 0 0' }}>
                  Cold-water fish-derived peptides — <b>absorbs 1.5× better than bovine collagen</b>. No fishy smell, no sugar, just 1 scoop a day in coffee or water.
                </p>
                <p style={{ margin: '12px 0 0' }}>
                  🎁 <b>11.11 — 50% off</b>, only <b>฿275</b> for Nov 11 only<br/>
                  📦 Free shipping nationwide
                </p>
                <p style={{ margin: '12px 0 0', color: 'var(--cf-ink-2)' }}>
                  👉 DM us or tap the Shopee link below to order
                </p>
              </>}
            />
            )}
          </div>
        </div>

        {/* === Article / บทความ === */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 className="h3" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="newspaper" size={18} style={{ color: 'var(--cf-primary)' }} />
                <T th="บทความ (Long-form)" en="Article (long-form)" />
                <span className="pill pill-blue" style={{ height: 18, fontSize: 10, marginLeft: 4 }}>
                  <T th="สำหรับ Facebook Note / Pinned post / Blog" en="For FB Note / Pinned post / Blog" />
                </span>
              </h3>
              <p className="micro" style={{ margin: '2px 0 0' }}>
                <T th="540 คำ · แบ่ง 5 หัวข้อย่อย · AI เขียนตาม Brand Voice" en="540 words · 5 sub-sections · written in your brand voice" />
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--cf-surface-2)', borderRadius: 8, border: '1px solid var(--cf-border)' }}>
                {[{ l: { th: 'สั้น', en: 'Short' } }, { l: { th: 'ปานกลาง', en: 'Med' }, on: true }, { l: { th: 'ยาว', en: 'Long' } }].map((m, i) => (
                  <button key={i} style={{
                    font: 'inherit', cursor: 'pointer',
                    padding: '4px 10px', borderRadius: 5, border: 'none',
                    fontSize: 11, fontWeight: 500,
                    background: m.on ? 'white' : 'transparent',
                    color: m.on ? 'var(--cf-ink-0)' : 'var(--cf-ink-2)',
                    boxShadow: m.on ? 'var(--cf-shadow-1)' : 'none',
                  }}>{t(m.l)}</button>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm"><Icon name="edit" size={13} /></button>
              <button className="btn btn-ghost btn-sm"><Icon name="copy" size={13} /></button>
              <button className="btn btn-ghost btn-sm"><Icon name="refresh" size={13} /></button>
            </div>
          </div>

          <div style={{
            background: 'var(--cf-surface-2)', borderRadius: 10, padding: '20px 24px',
            fontSize: 14, lineHeight: 1.7, color: 'var(--cf-ink-0)',
            border: '1px solid var(--cf-border)',
          }}>
            <T
              th={<>
                <h4 style={{ fontFamily: 'Prompt', fontSize: 18, margin: '0 0 8px', letterSpacing: '-0.01em', fontWeight: 600 }}>
                  ทำไม Marine Collagen ถึงเป็นที่นิยมในวัย 30+ — เภสัชกรอธิบายให้ฟัง
                </h4>
                <p style={{ margin: '0 0 14px', color: 'var(--cf-ink-1)' }}>
                  คุณรู้ไหมคะว่าหลังอายุ 25 ปี ร่างกายของเราผลิตคอลลาเจนน้อยลงประมาณ <b>1.5% ทุกปี</b> และเริ่มเห็นชัดเมื่อเข้าเลข 3 ผิวเริ่มหย่อนคล้อย ริ้วรอยปรากฏ ผม-เล็บเปราะ ทั้งหมดนี้คือสัญญาณว่าร่างกายต้องการคอลลาเจนเพิ่ม
                </p>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '18px 0 6px', fontWeight: 600, color: 'var(--cf-ink-0)' }}>1. Marine vs Bovine — ต่างกันอย่างไร?</h5>
                <p style={{ margin: '0 0 12px', color: 'var(--cf-ink-1)' }}>
                  Marine Collagen สกัดจากผิวปลาทะเลน้ำเย็น มี <b>โมเลกุลขนาดเล็กกว่า Bovine</b> (จากวัว) ทำให้ดูดซึมได้เร็วและมากกว่าถึง <b>1.5 เท่า</b> งานวิจัยจาก Journal of Cosmetic Dermatology ปี 2019 ระบุว่ากลุ่มที่กิน Marine Collagen เห็นการเปลี่ยนแปลงของผิวภายใน 14 วัน
                </p>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '14px 0 6px', fontWeight: 600 }}>2. ทำไมเราเลือก New Zealand?</h5>
                <p style={{ margin: '0 0 12px', color: 'var(--cf-ink-1)' }}>
                  น่านน้ำของนิวซีแลนด์เป็น <b>หนึ่งในแหล่งทะเลที่สะอาดที่สุดในโลก</b> ปลาที่นำมาผลิตได้รับการรับรอง Friend of the Sea และไม่มีการปนเปื้อนของโลหะหนัก ผ่านมาตรฐาน GMP และฮาลาล
                </p>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '14px 0 6px', fontWeight: 600 }}>3. วิธีกินที่ถูกต้อง</h5>
                <ul style={{ margin: '0 0 12px', paddingLeft: 20, color: 'var(--cf-ink-1)' }}>
                  <li>วันละ 1 ช้อนตวง (10g) ผสมน้ำเปล่า น้ำผลไม้ หรือกาแฟ</li>
                  <li>ดื่มตอนท้องว่าง หรือก่อนนอน ดูดซึมได้ดีที่สุด</li>
                  <li>กินต่อเนื่อง <b>อย่างน้อย 30 วัน</b> ถึงจะเห็นผลชัด</li>
                </ul>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '14px 0 6px', fontWeight: 600 }}>4. รีวิวจากลูกค้าจริง</h5>
                <p style={{ margin: '0 0 12px', color: 'var(--cf-ink-1)' }}>
                  คุณป๊อป อายุ 38 ปี: <i>"กินมา 45 วัน รู้สึกว่าผิวรอบดวงตาแน่นขึ้น เพื่อนทักว่าดูสดใส แม้แต่เล็บที่เคยเปราะก็แข็งแรงขึ้นเยอะค่ะ"</i> · ⭐⭐⭐⭐⭐
                </p>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '14px 0 6px', fontWeight: 600 }}>5. โปร 11.11 และวิธีสั่งซื้อ</h5>
                <p style={{ margin: '0 0 4px', color: 'var(--cf-ink-1)' }}>
                  เฉพาะวันที่ 11 พฤศจิกายน 2026 <b>ลดทันที 50% เหลือเพียง 275 บาท</b> ส่งฟรีทั่วประเทศเมื่อสั่ง 2 กระป๋องขึ้นไป สั่งซื้อได้ที่ Shopee ลิงก์ใต้โพสต์ หรือทักแชทมาคุยกับน้องโรสได้เลยค่ะ
                </p>
              </>}
              en={<>
                <h4 style={{ fontFamily: 'Prompt', fontSize: 18, margin: '0 0 8px', letterSpacing: '-0.01em', fontWeight: 600 }}>
                  Why Marine Collagen Is Popular After 30 — A Pharmacist Explains
                </h4>
                <p style={{ margin: '0 0 14px', color: 'var(--cf-ink-1)' }}>
                  Did you know that after 25, your body produces about <b>1.5% less collagen every year</b>? By 30, you start to notice: skin loses firmness, fine lines appear, hair and nails get brittle. These are signs your body wants more collagen.
                </p>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '18px 0 6px', fontWeight: 600 }}>1. Marine vs Bovine — what's the difference?</h5>
                <p style={{ margin: '0 0 12px', color: 'var(--cf-ink-1)' }}>
                  Marine collagen comes from cold-water fish skin and has <b>smaller molecules than bovine</b>, absorbing up to <b>1.5× more</b>. A 2019 study in the Journal of Cosmetic Dermatology found visible skin changes within 14 days.
                </p>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '14px 0 6px', fontWeight: 600 }}>2. Why we sourced it from New Zealand</h5>
                <p style={{ margin: '0 0 12px', color: 'var(--cf-ink-1)' }}>
                  New Zealand waters are <b>some of the cleanest in the world</b>. Our fish are Friend-of-the-Sea certified, free from heavy-metal contamination, and produced under GMP and Halal standards.
                </p>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '14px 0 6px', fontWeight: 600 }}>3. How to take it</h5>
                <ul style={{ margin: '0 0 12px', paddingLeft: 20, color: 'var(--cf-ink-1)' }}>
                  <li>1 scoop (10g) a day, mixed with water, juice, or coffee</li>
                  <li>Best on an empty stomach or before bed</li>
                  <li>Take consistently <b>for at least 30 days</b> for visible results</li>
                </ul>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '14px 0 6px', fontWeight: 600 }}>4. Real customer review</h5>
                <p style={{ margin: '0 0 12px', color: 'var(--cf-ink-1)' }}>
                  Pop, 38: <i>"After 45 days my under-eye skin is firmer, friends ask if I had work done. Even my brittle nails are stronger."</i> · ⭐⭐⭐⭐⭐
                </p>

                <h5 style={{ fontFamily: 'Prompt', fontSize: 15, margin: '14px 0 6px', fontWeight: 600 }}>5. 11.11 deal and how to order</h5>
                <p style={{ margin: '0 0 4px', color: 'var(--cf-ink-1)' }}>
                  On Nov 11 only — <b>50% off, just ฿275</b>. Free shipping nationwide on 2+ cans. Order on Shopee (link below) or DM Rose to chat.
                </p>
              </>}
            />
          </div>

          {/* Article actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Icon name="copy" size={13} />
              <T th="คัดลอกไป Facebook Note" en="Copy to FB Note" />
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Icon name="external" size={13} />
              <T th="ใช้เป็นโพสต์ปักหมุด" en="Use as pinned post" />
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Icon name="download" size={13} />
              <T th="ดาวน์โหลด .md" en="Download .md" />
            </button>
          </div>
        </div>

        {/* Hashtags */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 className="h3"><T th="แฮชแท็กแนะนำ" en="Hashtag suggestions" /></h3>
              <p className="micro" style={{ margin: '2px 0 0' }}>
                <T th="12 แท็ก · ไฮไลท์ส้ม = กำลังมาแรง" en="12 tags · orange = trending" />
              </p>
            </div>
            <button className="btn btn-ghost btn-sm">
              <Icon name="copy" size={13} />
              <T th="คัดลอกทั้งหมด" en="Copy all" />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(r && Array.isArray(r.hashtags) && r.hashtags.length
              ? r.hashtags.map((x) => ({ t: String(x).trim().startsWith('#') ? String(x).trim() : '#' + String(x).trim() }))
              : [
              { t: '#คอลลาเจน', hot: true },
              { t: '#MarineCollagen', hot: true },
              { t: '#โปร1111' },
              { t: '#happyprice' },
              { t: '#สกินแคร์ผู้ใหญ่', hot: true },
              { t: '#ผิวสวยจากภายใน' },
              { t: '#beautythailand' },
              { t: '#อายุ30', hot: true },
              { t: '#ไม่ต้องคาว' },
              { t: '#คอลลาเจนนิวซีแลนด์' },
              { t: '#แม่ๆต้องลอง' },
              { t: '#ส่งฟรี' },
            ]).map(tag => (
              <span key={tag.t} className="pill" style={{
                fontFamily: 'inherit', fontSize: 13,
                background: tag.hot ? 'var(--cf-primary-soft)' : 'var(--cf-surface-2)',
                color: tag.hot ? '#9A3412' : 'var(--cf-ink-1)',
                border: tag.hot ? '1px solid #FED7AA' : '1px solid var(--cf-border)',
                cursor: 'pointer',
              }}>
                {tag.t}
                {tag.hot && <Icon name="zap" size={11} />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PublishCard />
      </div>
    </div>
  );
};

// === CREATIVE TAB ===
const CreativeImageGradient = ({ from, to, accent, title, sub }) => (
  <div style={{
    aspectRatio: '1 / 1', borderRadius: 12, overflow: 'hidden', position: 'relative',
    background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
    border: '1px solid var(--cf-border)',
  }}>
    <div style={{ position: 'absolute', top: 14, right: 18, width: 56, height: 56, borderRadius: 999, background: 'rgba(255,255,255,0.45)' }} />
    <div style={{ position: 'absolute', bottom: -20, left: -15, width: 90, height: 90, borderRadius: 999, background: accent }} />
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      width: 80, height: 100, borderRadius: 14,
      background: 'linear-gradient(180deg, #FFFBEB, #FED7AA)',
      border: '1px solid rgba(255,255,255,0.8)',
      boxShadow: '0 10px 24px -8px rgba(124,45,18,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#7C2D12', textAlign: 'center',
    }}>
      <div style={{ fontSize: 7, letterSpacing: '0.18em', fontWeight: 600 }}>HAPPYPRICE</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 9, marginTop: 1, fontWeight: 500 }}>{sub}</div>
    </div>
  </div>
);

const GenerateCreative = () => {
  const t = useT();

  const slides = [
    { f: '#FFEDD5', tt: '#FECDD3', a: 'rgba(249,115,22,0.18)', title: t({ th: 'รู้ไหม?', en: 'Did you know?' }), sub: t({ th: 'คอลลาเจนลด 1.5%/ปี', en: '1.5% lost / year' }),
      caption: t({ th: 'อายุ 30+ ทุกปีเสียคอลลาเจน 1.5% ผิวเริ่มหย่อน ผมเริ่มเปราะ', en: 'After 30, you lose 1.5% collagen every year. Skin sags, hair gets brittle.' }) },
    { f: '#FFE4E6', tt: '#FECACA', a: 'rgba(220,38,38,0.22)', title: t({ th: 'ปัญหา', en: 'The problem' }), sub: t({ th: 'ผิวหย่อน · ผมเปราะ', en: 'Sagging · brittle hair' }),
      caption: t({ th: 'ครีมหน้าอย่างเดียวไม่พอ ต้องเติมจากภายในด้วย', en: 'Topical creams aren\'t enough — you need to feed it from within.' }) },
    { f: '#FFEDD5', tt: '#FED7AA', a: 'rgba(249,115,22,0.22)', title: t({ th: 'ทางออก', en: 'The fix' }), sub: t({ th: 'Marine Collagen', en: 'Marine Collagen' }),
      caption: t({ th: 'Marine Collagen ดูดซึมดีกว่า 1.5 เท่า เห็นผลใน 14 วัน', en: 'Marine collagen absorbs 1.5× better — results in 14 days.' }) },
    { f: '#FFFBEB', tt: '#FEF3C7', a: 'rgba(245,158,11,0.18)', title: t({ th: 'ต้นกำเนิด', en: 'The source' }), sub: t({ th: 'New Zealand', en: 'New Zealand' }),
      caption: t({ th: 'จากปลาทะเลน้ำเย็นของนิวซีแลนด์ น่านน้ำสะอาดที่สุดในโลก', en: 'From cold-water New Zealand fish — among the world\'s cleanest waters.' }) },
    { f: '#FECACA', tt: '#FFE4E6', a: 'rgba(190,42,42,0.20)', title: '11.11', sub: t({ th: 'ลด 50%', en: '50% OFF' }),
      caption: t({ th: '🎁 เฉพาะ 11 พ.ย. ลด 50% เหลือ 275 บาท · ส่งฟรี', en: '🎁 Nov 11 only · 50% off, just ฿275 · free shipping' }) },
    { f: '#E0E7FF', tt: '#FFE4E6', a: 'rgba(59,130,246,0.20)', title: t({ th: 'สั่งเลย', en: 'Order' }), sub: t({ th: 'ทักแชท · Shopee', en: 'DM · Shopee' }),
      caption: t({ th: '👉 ทักแชทเลยค่ะ คุณลูกค้า หรือกดลิงก์ Shopee ใต้โพสต์', en: '👉 DM us or tap the Shopee link below to order' }) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Mode selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { id: 'single', icon: 'square', title: { th: 'รูปเดี่ยว (Single Post)', en: 'Single image' },
            desc: { th: 'สร้างรูป 1 ภาพ + แคปชั่นเดียว เหมาะกับ Feed Facebook และ IG Post', en: 'One image + one caption — best for FB Feed and IG Post' },
            tag: { th: '1 ภาพ · 1 เครดิต', en: '1 image · 1 credit' } },
          { id: 'album', icon: 'layers', title: { th: 'อัลบั้ม / Carousel', en: 'Album / Carousel' },
            desc: { th: 'สร้างหลายภาพต่อเนื่อง + แคปชั่นต่อสไลด์ + บทความรวม · เหมาะกับ Carousel IG / FB Album', en: 'Multi-image story + per-slide captions + master article · ideal for IG Carousel / FB Album' },
            tag: { th: '6 ภาพ · 6 เครดิต', en: '6 images · 6 credits' }, active: true },
        ].map(m => (
          <div key={m.id} className="card" style={{
            padding: 20,
            borderColor: m.active ? 'var(--cf-primary)' : 'var(--cf-border)',
            boxShadow: m.active ? '0 0 0 4px rgba(249,115,22,0.10)' : 'var(--cf-shadow-1)',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: m.active ? 'var(--cf-primary-soft)' : 'var(--cf-surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: m.active ? 'var(--cf-primary)' : 'var(--cf-ink-2)',
              }}><Icon name={m.icon} size={22} /></div>
              {m.active && (
                <div style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--cf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={13} stroke={3} style={{ color: 'white' }} />
                </div>
              )}
            </div>
            <h3 className="h3" style={{ margin: '4px 0 4px' }}>{t(m.title)}</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--cf-ink-2)', lineHeight: 1.5 }}>{t(m.desc)}</p>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--cf-border)' }}>
              <span className={`pill ${m.active ? 'pill-orange' : ''}`} style={{ fontSize: 11 }}>
                <Icon name="zap" size={11} />
                {t(m.tag)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20 }}>
        {/* Album builder with per-slide captions */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 className="h3"><T th="อัลบั้ม 6 ภาพ — Marine Collagen Story" en="Album 6 images — Marine Collagen Story" /></h3>
            <button className="btn btn-ghost btn-sm">
              <Icon name="plus" size={13} />
              <T th="เพิ่มสไลด์" en="Add slide" />
            </button>
          </div>
          <p className="micro" style={{ marginBottom: 16 }}>
            <T th="AI วางแผนเป็นชุด เล่าเรื่องต่อเนื่อง · แต่ละสไลด์มีแคปชั่นของตัวเอง" en="Coherent narrative — each slide has its own caption" />
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {slides.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14,
                padding: 12, borderRadius: 10,
                background: i === 0 ? 'var(--cf-primary-soft)' : 'var(--cf-surface-2)',
                border: i === 0 ? '1px solid #FED7AA' : '1px solid var(--cf-border)',
                position: 'relative',
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: 6, left: 6, zIndex: 2,
                    background: 'white', width: 22, height: 22, borderRadius: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--cf-ink-0)',
                    boxShadow: 'var(--cf-shadow-1)',
                  }}>{i + 1}</div>
                  <CreativeImageGradient from={s.f} to={s.tt} accent={s.a} title={s.title} sub={s.sub} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cf-ink-0)' }}>{s.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--cf-ink-3)' }}>· {s.sub}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', color: 'var(--cf-ink-2)' }}><Icon name="drag" size={12} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', color: 'var(--cf-ink-2)' }}><Icon name="refresh" size={12} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', color: 'var(--cf-ink-2)' }}><Icon name="edit" size={12} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', color: 'var(--cf-danger)' }}><Icon name="trash" size={12} /></button>
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'white', borderRadius: 8, padding: '10px 12px',
                    border: '1px solid var(--cf-border)',
                    fontSize: 12, lineHeight: 1.55, color: 'var(--cf-ink-1)',
                  }}>{s.caption}</div>
                  <div className="micro" style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{s.caption.length} <T th="ตัวอักษร" en="chars" /></span>
                    <span><T th="แก้ได้ — กดในช่อง" en="Click to edit" /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed var(--cf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--cf-ink-2)' }}>
              <span><b style={{ color: 'var(--cf-ink-0)' }}>6</b> <T th="สไลด์" en="slides" /></span>
              <span>·</span>
              <span>1080×1080</span>
              <span>·</span>
              <span><T th="ใช้เครดิต" en="Credits" /> <b style={{ color: 'var(--cf-ink-0)' }}>6</b></span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm">
                <Icon name="newspaper" size={13} />
                <T th="ดูบทความรวม" en="View master article" />
              </button>
              <button className="btn btn-primary btn-sm">
                <Icon name="refresh" size={13} />
                <T th="สร้างใหม่ทั้งชุด" en="Regenerate all" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: settings + publish */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <h3 className="h3" style={{ marginBottom: 12 }}><T th="การตั้งค่ารูป" en="Image settings" /></h3>

            <label className="label"><T th="ขนาด / สัดส่วน" en="Size / aspect" /></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
              {[
                { r: '1:1', sub: 'Feed' },
                { r: '4:5', sub: 'IG Post', on: true },
                { r: '9:16', sub: 'Story' },
              ].map(s => (
                <button key={s.r} className="pill" style={{
                  flexDirection: 'column', height: 'auto', padding: '8px 4px',
                  background: s.on ? 'var(--cf-primary-soft)' : 'var(--cf-surface)',
                  border: s.on ? '1px solid var(--cf-primary)' : '1px solid var(--cf-border)',
                  color: s.on ? '#9A3412' : 'var(--cf-ink-1)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                  {s.r}
                  <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8, marginTop: 2 }}>{s.sub}</span>
                </button>
              ))}
            </div>

            <label className="label"><T th="โมเดล" en="Model" /></label>
            <button className="input" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span>DALL·E 3 · HD</span>
              <Icon name="chev-down" size={14} style={{ color: 'var(--cf-ink-2)' }} />
            </button>

            <label className="label"><T th="สไตล์ภาพ" en="Image style" /></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { l: { th: 'Photo · Premium', en: 'Photo · Premium' }, on: true },
                { l: { th: 'Illustrated', en: 'Illustrated' } },
                { l: { th: 'Flat / Minimal', en: 'Flat / Minimal' } },
                { l: { th: 'Bold / Promo', en: 'Bold / Promo' } },
              ].map((s, i) => (
                <span key={i} className="pill" style={{
                  cursor: 'pointer', fontSize: 12,
                  background: s.on ? 'var(--cf-primary-soft)' : 'var(--cf-surface-2)',
                  color: s.on ? '#9A3412' : 'var(--cf-ink-1)',
                  border: s.on ? '1px solid #FED7AA' : '1px solid var(--cf-border)',
                }}>{t(s.l)}</span>
              ))}
            </div>
          </div>

          <PublishCard />
        </div>
      </div>
    </div>
  );
};

window.GenerateCaption = GenerateCaption;
window.GenerateCreative = GenerateCreative;
