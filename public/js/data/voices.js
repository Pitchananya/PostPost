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
];
