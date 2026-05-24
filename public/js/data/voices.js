// public/js/data/voices.js
//
// Brand voice catalog — the chip-pickable tones shown on the Profile +
// Caption pages. Each voice has an emoji glyph, bilingual label, alt
// labels (used when the legacy code matches against either-language
// stored values), and a tone-matched sample sentence in both languages.
//
// Note: this is the brand-VOICE list, not the Azure-TTS voice list
// (that one lives inline in the Talking Avatar page and ships its own
// `az` ID field per voice — different schema entirely).

export const VOICES = [
  // ──── Core 11 (เดิม) ────
  { id: 'friendly', emoji: '🤗', th: 'เป็นกันเอง', en: 'Friendly', alt_th: 'Friendly', alt_en: 'เป็นกันเอง', sample_th: 'สวัสดีค่าคุณลูกค้า วันนี้พีร์มีของดีมาฝาก ✨', sample_en: 'Hey! We picked something just for you ✨' },
  { id: 'pro', emoji: '👔', th: 'มืออาชีพ', en: 'Professional', alt_th: 'Professional', alt_en: 'มืออาชีพ', sample_th: 'ผลิตภัณฑ์ผ่านการรับรองจากผู้เชี่ยวชาญ', sample_en: 'Dermatologist-tested and certified safe.' },
  { id: 'lux', emoji: '💎', th: 'พรีเมียม', en: 'Luxury', alt_th: 'Luxury', alt_en: 'พรีเมียม', sample_th: 'สัมผัสประสบการณ์ความหรูที่คุณคู่ควร', sample_en: 'Indulge in the luxury you deserve.' },
  { id: 'fun', emoji: '✨', th: 'สนุกสดใส', en: 'Playful', alt_th: 'Playful', alt_en: 'สนุกสดใส', sample_th: 'หยิบเลย! ผิวสวยรอไม่ไหวแล้ว 🌸', sample_en: "Snag it now! Your skin won't wait 🌸" },
  { id: 'warm', emoji: '🤍', th: 'อบอุ่น ใส่ใจ', en: 'Warm & caring', alt_th: 'Warm', alt_en: 'อบอุ่น', sample_th: 'เข้าใจเลยว่าผิวบอบบางเลือกของยากแค่ไหน', sample_en: 'We get it — sensitive skin makes choosing hard.' },
  { id: 'min', emoji: '◻', th: 'มินิมอล', en: 'Minimal', alt_th: 'Minimal', alt_en: 'มินิมอล', sample_th: 'น้อย แต่พอ. ทุกหยดมีเหตุผล', sample_en: 'Less, but enough. Every drop matters.' },
  { id: 'story', emoji: '📖', th: 'เล่าเรื่อง', en: 'Storyteller', alt_th: 'Storyteller', alt_en: 'เล่าเรื่อง', sample_th: 'มันเริ่มจากดอกกุหลาบดอกหนึ่งบนเขาใหญ่...', sample_en: 'It started with a single rose on Khao Yai...' },
  { id: 'bold', emoji: '🔥', th: 'มั่นใจ ขายตรง', en: 'Bold seller', alt_th: 'Bold', alt_en: 'ขายตรง', sample_th: 'ของจริง ราคาจริง 690 บาท หมดเร็วแน่นอน', sample_en: 'Real product, real price ฿690 — going fast.' },
  { id: 'genz', emoji: '🫶', th: 'สไตล์ Gen Z', en: 'Gen Z vibes', alt_th: 'Gen Z', alt_en: 'สไตล์ Gen Z', sample_th: 'no cap ครีมนี้คือ slay จริง 🫶', sample_en: 'no cap this serum is literally slay 🫶' },
  { id: 'edu', emoji: '🧪', th: 'ให้ความรู้', en: 'Educational', alt_th: 'Educational', alt_en: 'ให้ความรู้', sample_th: 'รู้ไหม? วิตามินซีในกุหลาบสูงกว่าส้ม 3 เท่า', sample_en: 'Did you know? Rose vitamin C beats orange 3×.' },
  { id: 'witty', emoji: '😄', th: 'มีอารมณ์ขัน', en: 'Witty', alt_th: 'Witty', alt_en: 'อารมณ์ขัน', sample_th: 'ขนาดดอกกุหลาบยังต้องบำรุง ผิวเราก็เหมือนกัน', sample_en: 'Even roses need care — your skin does too.' },

  // ──── ใหม่ 15 (เพิ่มความหลากหลายตาม brand persona ที่ขาด) ────
  { id: 'mystical',  emoji: '🔮', th: 'ลึกลับ มูเตลู',     en: 'Mystical',          alt_th: 'Mystical',    alt_en: 'ลึกลับ',         sample_th: 'พลังจักรวาลกำลังส่งสัญญาณมาให้คุณ ✨ ไพ่ใบนี้คือคำตอบ',                  sample_en: 'The universe is sending you a sign ✨ this card has your answer' },
  { id: 'guru',      emoji: '🎓', th: 'อาจารย์ ผู้รู้',      en: 'Wise teacher',      alt_th: 'Teacher',     alt_en: 'อาจารย์',       sample_th: 'จากประสบการณ์ 20 ปี ขอบอกว่า… การเงินคุณมีทางออกครับ',                sample_en: 'From 20 years of practice — your finances have a way forward' },
  { id: 'inspire',   emoji: '💫', th: 'ปลุกไฟ ให้กำลังใจ',  en: 'Motivational',      alt_th: 'Motivational',alt_en: 'ปลุกไฟ',         sample_th: 'วันนี้เริ่มจาก 1 ก้าวเล็กๆ — พรุ่งนี้คุณจะขอบคุณตัวเอง 🚀',              sample_en: 'Start with one small step today — tomorrow you\'ll thank yourself 🚀' },
  { id: 'edgy',      emoji: '😎', th: 'แสบ ตรงไปตรงมา',     en: 'Edgy / Bold',       alt_th: 'Edgy',        alt_en: 'แสบ',           sample_th: 'พูดตรงๆ — ถ้าไม่ลองตอนนี้ก็เสียดายไปทั้งปี',                          sample_en: "Real talk — skip this and you'll regret it all year" },
  { id: 'empathy',   emoji: '🫂', th: 'เข้าใจหัวอก',         en: 'Empathetic',        alt_th: 'Empathetic',  alt_en: 'เข้าใจ',        sample_th: 'รู้นะว่าเหนื่อย ไม่ต้องรีบนะคะ — เราอยู่ตรงนี้',                       sample_en: 'I know it\'s hard. Take your time — we\'re here.' },
  { id: 'viral',     emoji: '🚀', th: 'ไวรัล ฮิตกระจาย',     en: 'Viral hype',        alt_th: 'Viral',       alt_en: 'ไวรัล',         sample_th: 'TikTok บอกตรงกันหมด — ตัวนี้คือคนรีวิว 100k+ ในอาทิตย์เดียว',          sample_en: 'TikTok agrees — 100k+ reviews in one week, this is THE one' },
  { id: 'dramatic',  emoji: '🎭', th: 'ดราม่า เร้าใจ',       en: 'Dramatic',          alt_th: 'Dramatic',    alt_en: 'ดราม่า',        sample_th: 'ลึกลงไปในใจ… มีคำถามหนึ่งที่ดังก้องอยู่ตลอด — ทำไม?',                    sample_en: 'Deep down… one question echoes inside — why?' },
  { id: 'hype',      emoji: '⚡', th: 'ฮึกเหิม พลังเต็ม',    en: 'High-energy',       alt_th: 'High-energy', alt_en: 'ฮึกเหิม',       sample_th: 'มาเลย!! ปลายปีนี้คือของคุณ ไม่ใช่ใครเลย ⚡⚡',                            sample_en: "Let's GOOO! End of year is YOURS, nobody else's ⚡⚡" },
  { id: 'data',      emoji: '🔬', th: 'นักวิทยาศาสตร์ ข้อมูลแน่น', en: 'Data-driven',  alt_th: 'Data',        alt_en: 'ข้อมูลแน่น',    sample_th: 'จากผู้ใช้ 3,200 คน — 87% เห็นผลภายใน 14 วัน (n=3,200, p<.001)',           sample_en: '3,200 users surveyed — 87% saw results in 14 days (n=3,200, p<.001)' },
  { id: 'elegant',   emoji: '🌹', th: 'สง่างาม นุ่มนวล',     en: 'Elegant',           alt_th: 'Elegant',     alt_en: 'สง่างาม',       sample_th: 'ความงามที่แท้จริงคือความนุ่มนวลที่ไม่ต้องพิสูจน์',                       sample_en: 'True beauty needs no proof — only presence.' },
  { id: 'cute',      emoji: '🐰', th: 'น่ารัก น้องๆ',         en: 'Cute / kawaii',     alt_th: 'Cute',        alt_en: 'น่ารัก',        sample_th: 'น้อนๆ มาแล้วน้า~~ กรุบกริบสุดๆ 🐰💕',                                     sample_en: 'Heyyy babes~~ this one is SO cuteee 🐰💕' },
  { id: 'closer',    emoji: '💼', th: 'นักขาย มือพระกาฬ',    en: 'Hard closer',       alt_th: 'Closer',      alt_en: 'นักขาย',        sample_th: 'ตัดสินใจตอนนี้ — เหลือ 12 ชิ้นเท่านั้น คุณกับฉันรู้ดีว่าต้องคว้า',          sample_en: "Decide now — only 12 left. You and I both know you want this." },
  { id: 'auntie',    emoji: '🍳', th: 'ป้าใจดี แนะนำเป็นกันเอง', en: 'Auntie wisdom', alt_th: 'Auntie',      alt_en: 'ป้า',           sample_th: 'หลานเอ๊ย ฟังป้านะ ของแบบนี้ใช้มา 30 ปี รู้ดี!',                          sample_en: 'Listen to auntie now — I\'ve used these for 30 years, trust me' },
  { id: 'zen',       emoji: '🧘', th: 'ซึน นิ่ง มีสติ',        en: 'Zen / Mindful',     alt_th: 'Zen',         alt_en: 'ซึน',           sample_th: 'หายใจเข้า… ออก… วันนี้เลือกสิ่งที่ดีให้กับร่างกายตัวเอง',                sample_en: 'Breathe in… out… today, choose what is kind to your body.' },
  { id: 'rebel',     emoji: '🤘', th: 'ขบถ ทำลายกฎ',         en: 'Rebel / Outlaw',    alt_th: 'Rebel',       alt_en: 'ขบถ',           sample_th: 'ใครว่าต้องตามเขา? เราเขียนกฎของตัวเอง',                                  sample_en: 'Who says we follow the rules? We write our own.' },
];
