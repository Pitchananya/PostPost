// public/js/data/topics.js
//
// Mutable topic & product lists. The DEMO_* arrays are frozen snapshots of
// the original seed data, used as the fallback when switching to a brand
// that doesn't have its own catalog. The TOPICS and PRODUCTS exports are
// the LIVE arrays that page code reads from — they get repointed at the
// current brand's catalog on brand-switch.
//
// MUTATION PATTERN: importers share the SAME array reference. To swap in
// a different brand's catalog, splice in place:
//
//   import { TOPICS } from './data/topics.js';
//   TOPICS.splice(0, TOPICS.length, ...newTopicsForBrand);
//
// That keeps every existing reference (other modules, the inline router)
// pointing at the same array. Reassigning the export binding (`TOPICS =
// newArray`) would silently desync every other importer.

const SEED_PRODUCTS = [
  { id: 'p1', name_th: 'Marine Collagen from New Zealand 100g — ออร์แกนิคแท้', name_en: 'Marine Collagen NZ 100g', short: 'Marine Collagen NZ', price: 550, sales: '1.4k', rating: 4.9, badge: 'ขายดี', hue: ['#FFE4E6', '#FECACA'], label: 'COLLAGEN' },
  { id: 'p2', name_th: 'iCON FACE iSERUM เซรั่มผิวกระจก สยบริ้วรอย 30ml', name_en: 'iCON Face iSerum 30ml', short: 'iCON Face iSerum', price: 690, sales: '2.1k', rating: 4.8, badge: 'แนะนำ', hue: ['#FFEDD5', '#FECDD3'], label: 'SERUM' },
  { id: 'p3', name_th: 'BellaCare Collagen Tripeptide Super Premium', name_en: 'BellaCare Collagen Tripeptide', short: 'BellaCare', price: 599, sales: '980', rating: 4.7, hue: ['#FFE4E6', '#FED7AA'], label: 'BELLA' },
  { id: 'p4', name_th: 'Amado Face Night Sleeping Mask 100g', name_en: 'Amado Sleeping Mask 100g', short: 'Amado Mask', price: 300, sales: '640', rating: 4.6, hue: ['#E0E7FF', '#FECDD3'], label: 'MASK' },
  { id: 'p5', name_th: 'CmaX Cordyceps Coffee กาแฟซีแม็คซ์ ถั่งเช่า', name_en: 'CmaX Cordyceps Coffee', short: 'CmaX Coffee', price: 235, sales: '320', rating: 4.5, hue: ['#FEF3C7', '#FED7AA'], label: 'COFFEE' },
  { id: 'p6', name_th: 'JOJU COLLAGEN ปรับผิว เจจูคอลลาเจน', name_en: 'Joju Collagen', short: 'Joju Collagen', price: 490, sales: '1.1k', rating: 4.8, hue: ['#FED7AA', '#FECACA'], label: 'JOJU' },
  { id: 'p7', name_th: 'Linhzhimin หลินจือมิน 60 เม็ด', name_en: 'Linhzhimin · 60 caps', short: 'Linhzhimin', price: 1120, sales: '420', rating: 4.9, badge: 'พรีเมียม', hue: ['#FEF3C7', '#FCD9A8'], label: 'LINH' },
  { id: 'p8', name_th: 'Kumiko Collagen สเต็มเซลล์รกปลาแซลม่อน 15ซอง', name_en: 'Kumiko Collagen · 15 sachets', short: 'Kumiko', price: 250, sales: '880', rating: 4.6, hue: ['#FFE4E6', '#E0E7FF'], label: 'KUMI' },
];

// Live arrays — what pages read from. Snapshot copies in DEMO_* below.
export const PRODUCTS = SEED_PRODUCTS.slice();
export const DEMO_PRODUCTS = SEED_PRODUCTS.slice();

const SEED_TOPICS = [
  { kind: 'tip',       f: 'F1', len_th: '80-120 คำ', len_en: '80-120 words', th: 'ผิวบอบบางใช่ไหมคะ? 5 ขั้นตอนตอนเช้าที่ห้ามข้าม', en: "Sensitive skin? 5 morning steps you can't skip" },
  { kind: 'knowledge', f: 'F2', len_th: '100-160 คำ', len_en: '100-160 words', th: 'รู้ไหม? Marine Collagen ดูดซึมได้ดีกว่า Bovine Collagen 1.5 เท่า', en: 'Did you know? Marine collagen absorbs 1.5× better than bovine' },
  { kind: 'promo',     f: 'F3', len_th: '60-90 คำ', len_en: '60-90 words', used: true, th: '11.11 มาถึงแล้ว! Rose Repair ลด 50% เฉพาะวันเดียว', en: '11.11 is here! Rose Repair 50% off — today only' },
  { kind: 'review',    f: 'F1', len_th: '200+ คำ', len_en: '200+ words', th: 'รีวิวลูกค้า 7 วัน — คุณป๊อปอายุ 35 ผิวแพ้ง่ายมา 10 ปี', en: '7-day customer review — Pop, 35, sensitive skin for 10 years' },
  { kind: 'story',     f: 'F2', len_th: '300+ คำ', len_en: '300+ words', th: 'เรื่องเล่าจากเขาใหญ่ — ทำไมเราเลือกกุหลาบจากที่นี่', en: 'A story from Khao Yai — why we picked roses from here' },
  { kind: 'tip',       f: 'F1', len_th: '80-120 คำ', len_en: '80-120 words', th: '3 สัญญาณบอกว่าผิวกำลังขาดน้ำ (และวิธีฟื้น)', en: '3 signs your skin is dehydrated (and how to fix it)' },
  { kind: 'knowledge', f: 'F2', len_th: '150-200 คำ', len_en: '150-200 words', th: 'คลอโรฟิลล์มีดีอย่างไร? เภสัชกรอธิบายแบบเข้าใจง่าย', en: "What's special about chlorophyll? A pharmacist explains" },
  { kind: 'engage',    f: 'F3', len_th: '40-60 คำ', len_en: '40-60 words', th: 'ลูกค้าคะ — ผิวคุณมีปัญหาอะไรมากที่สุด? คอมเมนต์มาคุยกัน', en: "Tell us — what's your skin's biggest issue? Comment below" },
  { kind: 'promo',     f: 'F2', len_th: '60-90 คำ', len_en: '60-90 words', th: 'ส่งฟรี + แถม Sheet Mask 3 แผ่น เฉพาะสั่ง 2 ขวด', en: 'Free shipping + 3 sheet masks when you buy 2 bottles' },
  { kind: 'tip',       f: 'F1', len_th: '80-120 คำ', len_en: '80-120 words', used: true, th: 'Toner Pad ใช้แทนสำลีชุบน้ำ — ประหยัด 3 นาทีทุกเช้า', en: 'Toner Pads beat cotton — save 3 minutes every morning' },
  { kind: 'review',    f: 'F1', len_th: '200+ คำ', len_en: '200+ words', th: 'รีวิว: ใช้ Bio Astin 30 วัน รู้สึกอย่างไร?', en: 'Review: 30 days of Bio Astin — what happens?' },
  { kind: 'story',     f: 'F2', len_th: '300+ คำ', len_en: '300+ words', th: 'จากเภสัชกรสู่เจ้าของร้าน — ทำไมพีร์เริ่มแบรนด์นี้', en: 'From pharmacist to founder — why I started this brand' },
  { kind: 'tip',       f: 'F3', len_th: '60-90 คำ', len_en: '60-90 words', th: 'ห้ามทำ! 5 ข้อผิดพลาดเวลาทาเซรั่ม', en: "Don't! 5 mistakes when applying serum" },
  { kind: 'knowledge', f: 'F1', len_th: '120-180 คำ', len_en: '120-180 words', th: 'ไขข้อสงสัย — กิน Collagen แล้วผิวขาวจริงไหม?', en: 'Myth busted — does collagen actually whiten skin?' },
  { kind: 'promo',     f: 'F2', len_th: '60-90 คำ', len_en: '60-90 words', used: true, th: 'แจกฟรี! Beauty Trio Set 5 รางวัล กดติดตามและคอมเมนต์', en: 'Giveaway! 5× Beauty Trio Set — follow & comment' },
  { kind: 'engage',    f: 'F3', len_th: '40-60 คำ', len_en: '40-60 words', th: 'แบบทดสอบ 30 วินาที — ผิวคุณเป็นประเภทไหน?', en: "30-sec quiz — what's your skin type?" },
  { kind: 'tip',       f: 'F1', len_th: '80-120 คำ', len_en: '80-120 words', th: '7-step skincare แบบเกาหลี — ที่คนไทยใช้จริงได้', en: '7-step Korean skincare — Thailand edition' },
  { kind: 'review',    f: 'F2', len_th: '200+ คำ', len_en: '200+ words', th: 'รีวิวจริง — Sheet Mask 7 ยี่ห้อ อันไหนคุ้มสุด?', en: 'Real review — 7 sheet mask brands compared' },
];

export const TOPICS = SEED_TOPICS.slice();
export const DEMO_TOPICS = SEED_TOPICS.slice();
