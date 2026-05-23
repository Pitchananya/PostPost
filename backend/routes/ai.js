import { Router } from 'express';
import { requireAuth } from './auth.js';
import { db, supabase, currentTenantId } from '../db.js';
import { composeImage, fetchImageBuffer } from '../services/composer.js';
import { TEMPLATE_LIST } from '../services/templates.js';

const router = Router();
router.use(requireAuth);

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-haiku-4.5';
let OPENROUTER_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'openai/gpt-5.4-image-2';
const OPENROUTER_IMAGE_QUALITY = process.env.OPENROUTER_IMAGE_QUALITY || 'medium';
const OPENROUTER_IMAGE_SIZE = process.env.OPENROUTER_IMAGE_SIZE || '1024x1024';

// 📸 Core Context — ใส่ทุก image_prompt เพื่อบังคับ photographic style (NOT cartoon)
const PHOTO_PROMPT_CORE = `A high-fidelity photographic marketing image (NOT cartoon, NOT illustration, NOT 3D render, NOT digital art) with dynamic cinematic lighting and rich realistic textures of fur, metal, glass, fabric, and clean-room surfaces. Sophisticated professional composition. Shot on a high-end DSLR with 85mm f/1.4 lens with slight depth of field. Photorealistic, magazine-quality editorial commercial photography.`;

const DEFAULT_BRAND_VOICE = `บุคลิกแบรนด์ (เลียนสไตล์เพจ Pet Food ไทยที่ทำได้ดี เช่น Pawtry Thailand):
- ภาษากึ่งทางการ เป็นกันเอง น่ารัก เข้าถึงง่าย ลงท้าย "ค่ะ/นะคะ" เหมือนเพื่อนคุย
- ใช้ emoji 🐶 🐱 ❤️ ✨ 🥩 ประมาณ 3-5 ตัวต่อโพส (ไม่เยอะเกิน)
- เริ่มโพสด้วยคำถาม/ประโยคน่าสนใจ เช่น "รู้ไหมคะว่า..." "เคยไหม..."
- เน้นเรื่องสุขภาพ + โภชนาการ + ความรักสัตว์เลี้ยง — มี educational tone
- ปิดท้ายด้วย CTA นุ่มนวล: "💬 อยากรู้เพิ่ม inbox มาคุยได้เลยค่ะ" หรือ "comment 'สนใจ' รับข้อมูล"
- ห้ามใช้คำเสี่ยง ban: "หาย" "รักษา" "ดีที่สุด" "100%" "garantee"
- ความยาวเหมาะ Facebook: 80-180 คำ
- หัวเรื่องชัดเจน — Hook 1-2 บรรทัด แล้วเว้นบรรทัดก่อนเข้าเนื้อหา`;

// Post style structures — AI ใช้เป็น template
const POST_STYLES = {
  educational: `📚 แบบ Educational (default — ให้ความรู้ สุขภาพสัตว์)
- Hook คำถามขยี้ pain เช่น "รู้ไหมคะว่า..." "เคยสังเกต..."
- เนื้อหา 80-180 คำ educational tone
- Emoji 3-5 ตัว
- CTA นุ่มนวล "inbox มาคุยกัน"`,

  promo: `🔥 แบบ Course/Business Promo สไตล์ Pawtry Thailand (PFB/PHE)

📋 PATTERN ที่คุณต้องตามเป๊ะ — มี 2 รูปแบบ:

═══ RUPP A: คำพูดคม ตามด้วย bullet (กระชับ — ห้ามเวิ่นเว้อ) ═══
[Hook 1 บรรทัดเดียว — ประโยคคำพูดคม ใช้ "..." กลาง + เน้นคำใน "" + emoji 🐾🏆]
📍 [Benefit 1 — keyword สำคัญ]
📍 [Benefit 2]
📍 [Benefit 3]
📍 เริ่มเรียน เสาร์-อาทิตย์ 9 วันเต็มๆ ครับ!

[FOOTER ตาม template]

═══ RUPP B: Hook เร่งใจ + ✅ checklist (กระชับ) ═══
🔥 [Hook คำถาม + emoji 🐶🐱💖 ปิด ?]
✅ [Benefit 1 — verb คม]
✅ [Benefit 2 + emoji ✨🏭🎯]
✅ [Benefit 3]
✅ [Benefit 4]
✨ Exclusive เฉพาะนักเรียน
✅ [Premium 1]
🗓️ เรียน 9 วัน (เสาร์-อาทิตย์)
🔥 [Urgency closing 1 บรรทัด]

[FOOTER ตาม template]

═══ ⚠️ ห้ามทำ — Rules to AVOID ═══
❌ ห้ามมี bridge paragraph ระหว่าง hook กับ bullets (เช่น "หลายคนฝันอยาก... เราเลยรวบรวม..." — เวิ่นเว้อ)
❌ ห้ามมี intro paragraph อธิบายซ้ำกับ hook
❌ ห้ามมี "อ่านจบแล้วจะรู้ว่า..." หรือ "วันนี้เราจะมา..."
❌ ห้ามใช้ "ค่ะ/นะคะ/ครับ" เยอะเกินไป (แต่ละ section 0-1 ที)
❌ ห้ามอธิบายซ้ำ — hook พูดอะไรไปแล้ว ห้าม say it again
✅ Caption รวม 60-120 คำเท่านั้น (รวม bullets) — กระชับ ตรงประเด็น

═══ HOOK PATTERNS ที่ Pawtry ใช้ — เลือก 1 ═══
1. คำถามจี้ใจ + emoji: "อยากเปลี่ยน 'ทาสหมาแมว' เป็น 'ลูกค้าประจำ' ไหม? 🐶🐱💖"
2. ประโยคปลายเปิด + ...: "สูตรอาหารของคุณ... กำลังทำสัตว์เลี้ยงป่วยหรือเปล่า?"
3. เปรียบเทียบสะท้อน: "ความรักอย่างเดียว... ไม่พอทำแบรนด์"
4. คำคมสร้างคุณค่า: "ทำแบรนด์อาหารสัตว์ให้รุ่ง... ไม่ใช่แค่เรื่อง 'อร่อย' แต่คือเรื่อง 'มาตรฐาน' 🐾🏆"
5. คำสั่ง+benefit: "สร้างแบรนด์ที่คนรักสัตว์เชื่อใจ ตั้งแต่วันนี้!"

═══ CRITICAL Rules ═══
- ใช้ "..." (3 จุด) ตรงกลางประโยคบ่อยๆ — สร้าง pause สะกดอารมณ์
- เน้นคำในเครื่องหมาย "" — เช่น "อร่อย" vs "มาตรฐาน"
- ใช้ 📍 เป็น bullet หลัก (ไม่ใช่ ✅) สำหรับเนื้อหา educational
- ใช้ ✅ สำหรับ list features คอร์ส
- emoji ปิดท้าย hook 1-2 ตัว: 🐾🏆 / 🐶🐱💖 / 🏭✨
- contact block ต้องเป๊ะตาม Pawtry: FB Page + Tel + Line Official
- hashtags 8-10 ตัว ผสม Eng + Thai`,

  story: `📖 แบบ Case Study/Story (เล่าเรื่อง customer success / before-after)
- Hook: "จากที่เคย... ตอนนี้..."
- Body: เล่าเรื่องสั้น เน้น transformation
- Insight: bullet 2-3 ข้อสิ่งที่เรียนรู้
- CTA: "อยากเปลี่ยนแบบนี้ไหม?"`,

  tip: `💡 แบบ Quick Tip List (ทิป/เคล็ดลับสั้น)
- Hook: "5 สิ่งที่..." "3 วิธี..."
- Body: numbered list 1-5 ข้อ แต่ละข้อสั้น ตรง
- Footer: CTA save + share`,

  guru_thep: `🔮 แบบ คุรุเทพ — Tip สายมู + Soft Sell การ์ดศักดิ์สิทธิ์ (สไตล์เพจอาจารย์หนึ่งคุรุเทพ)

โครงสร้าง caption (FB/IG) — ทำตามลำดับนี้เป๊ะ:

[1] Hook 1 บรรทัด: pain point/คำถามจี้ใจสายมู + emoji 🔮✨
    ตัวอย่าง: "มูแล้วไม่ปัง ชีวิตยังนิ่ง? 🔮✨" / "ทำไมขอแล้วไม่ได้สักที? 🤔💔"

[2] Bridge 1-2 บรรทัด: insight พลิกมุม empower + ลงท้าย "ครับ!" + emoji
    ตัวอย่าง: "จริงๆ ดวงแค่ 50% แต่อีก 50% คือ 'การกระทำ' ของเราครับ! 🛠️💰"

[3] Title list 1 บรรทัด: "เช็กด่วน! [N] [หัวข้อ]" + emoji
    ตัวอย่าง: "เช็กด่วน! 3 พฤติกรรม ขวางทางรวย 🚫💸"

[4] Numbered list 3-5 ข้อ ด้วย 1️⃣2️⃣3️⃣4️⃣5️⃣ — แต่ละข้อ:
    "[number] [พฤติกรรม/เคล็ดลับสั้น] [คำขยายสั้น] [emoji ปิด ❌📉🎯💔🌟]"
    ตัวอย่าง: "1️⃣ มูแล้วนั่งรอ ไม่ลงมือทำ โอกาสไม่เกิด ❌"

[5] Closing 1 บรรทัด: "แก้/ทำ N จุดนี้ได้ รับรอง[ผลลัพธ์]! 🚀"

[6] Engagement CTA 1 บรรทัด: 🔥 + คำถามขำๆ + คอมเมนต์ขอสารภาพ/แชร์ + 👇💬
    ตัวอย่าง: "🔥 ใครเผลอทำข้อไหนอยู่? คอมเมนต์สารภาพมาซะดีๆ! 👇💬"

[7] Separator: บรรทัดเดียวที่มีจุด "."

[8] Soft promo block (บังคับ — copy โครงนี้ ปรับ wording ได้):
🔮 สำหรับใครที่อยากปรึกษาเรื่องดวงชะตาเป็นการส่วนตัวกับ อาจารย์หนึ่ง 👤 หรือสนใจบูชา 'การ์ดศักดิ์สิทธิ์ คุรุเทพ' ✨🎴 เพื่อเสริมดวงชะตาและเพิ่มพลังความมั่นใจ
📌 ติดต่อสอบถามได้ที่: @317biusr 📲💬

[9] Separator: "."

[10] Hashtags 5-6 ตัว — บังคับมีอย่างน้อย:
#อาจารย์หนึ่งคุรุเทพ #คุรุเทพ #Kuruthep #ของมงคล #สายมู
(เพิ่มได้: #ดูดวง #เสริมดวง #การ์ดศักดิ์สิทธิ์ #มูเตลู ตามหัวข้อ)

⚙️ Rules:
- ความยาว 120-220 คำ (สั้นกระชับ ไม่ยาวเกิน)
- TikTok: ย่อเหลือ list 3 ข้อ + ตัด soft promo ให้สั้นลง 50-80 คำ
- ห้ามใช้คำสร้างความกลัวรุนแรง (ตาย, ป่วยหนัก, ล้มละลาย) — ใช้ "ขวางทางรวย" "ดวงตก" "พลังลบ" "โอกาสหาย"
- ห้ามสัญญาผล 100% — ใช้ "เสริม" "เพิ่มพลัง" "รับรองดวงพุ่ง" (เชิงกำลังใจ ไม่ใช่ผลทางการแพทย์)
- ไม่ต้องใส่ disclaimer ยาวๆ ท้ายโพส — แบรนด์นี้เน้น vibes empowering ไม่ใช่ academic

🎨 image_prompt (เขียนเป็นภาษาอังกฤษ + ใส่ Thai text overlay):

โครงสร้าง:
"[SCENE: mystical luxury — tarot card on velvet, candle, crystal, lotus]. TEXT OVERLAY: [Thai hook + key message]. [COLOR + LIGHTING]. [NEGATIVE]."

TEXT OVERLAY rules:
- ใส่ Thai hook ของโพส (จาก [1] hook ใน template) ไว้บนรูป — ใช้ "metallic gold" หรือ "metallic silver with white outline"
- ระบุ position: "at top", "center", "bottom banner"
- ระบุ font: "bold display font, perfectly spelled, magazine-quality typography"
- อาจมี subtitle ตัวเล็กกว่า: "Thai subtitle 5-8 words"

Color/Style: deep purple #4C1D95 + gold #F59E0B + black + cream — cinematic luxurious occult, soft golden glow, 4:5 vertical.

NEGATIVE: NO real human face, NO brand logos, NO cartoon/illustration, NO blood/scary imagery.

ตัวอย่างที่ดี:
"Mystical sacred tarot card glowing on dark deep-purple velvet, golden candle flame and white lotus petals around, deep cosmic background with soft constellations and Thai mystical motifs in metallic gold.

TEXT OVERLAY: Large bold metallic gold Thai text at top reading 'มูแล้วไม่ปัง ชีวิตยังนิ่ง?' with subtle white outline. Below in smaller white text: 'เช็ก 3 พฤติกรรมขวางทางรวย'. Magazine-quality typography, perfectly spelled.

Cinematic soft golden glow, luxurious occult aesthetic, vertical 4:5. NO real human face, NO brand logos, NOT cartoon."`,
};

// 📌 Footer template ตาม course — ใช้ใน promo posts (ลงท้ายตรงนี้เป๊ะ)
const FOOTER_TEMPLATES = {
  PFB: `📌 ติดต่อสอบถาม หรือลงทะเบียนหลักสูตร

🔵 FB Page : Inbox Pawtry Thailand

📞 Tel : 098-894-4466

🟢 Line Official : @‌968iprpb

.

#PFB #pawtrythailand #pawtry #พาว์ทรี่ #Petfoodbusiness #อาหารสัตว์ #อาหารหมาแมว #อาหารหมา #อาหารแมว`,

  PHE: `📌 ติดต่อสอบถาม หรือลงทะเบียนหลักสูตร

📩 FB Page: Inbox หลักสูตรผู้ประกอบการธุรกิจโรงแรมสัตว์เลี้ยง

📞 Tel: 098-894-4466

🟢 Line Official: @‌968iprp

.

#PHE #PetHotelEntrepreneur #หลักสูตรผู้ประกอบการธุรกิจโรงแรมสัตว์เลี้ยง #ธุรกิจสัตว์เลี้ยง #โรงแรมหมาแมว`,

  GURU: `📌 ติดต่อสอบถาม / บูชาการ์ดศักดิ์สิทธิ์ คุรุเทพ

🔮 อาจารย์หนึ่งคุรุเทพ

🟢 Line Official: @317biusr

.

#อาจารย์หนึ่งคุรุเทพ #คุรุเทพ #Kuruthep #ของมงคล #สายมู`,
};

function getFooter(course = 'PFB') {
  return FOOTER_TEMPLATES[course] || FOOTER_TEMPLATES.PFB;
}

const GURU_THEP_SYSTEM = `คุณคือ Copywriter เพจ "อาจารย์หนึ่งคุรุเทพ" — แบรนด์สายมูที่ขาย "การ์ดศักดิ์สิทธิ์ คุรุเทพ" และให้ปรึกษาดวงส่วนตัว

📜 บริบทแบรนด์:
- ตัวละครหลัก: **อาจารย์หนึ่ง** (เพศชาย ลงท้าย "ครับ") — เป็นที่ปรึกษาสายมูแบบเข้าใจง่าย
- สินค้า: **การ์ดศักดิ์สิทธิ์ คุรุเทพ** ✨🎴 — เสริมดวง เพิ่มพลังความมั่นใจ
- ช่องทาง: Line @317biusr 📲
- กลุ่มเป้าหมาย: สายมู คนเชื่อเรื่องดวง แต่ก็พร้อมลงมือทำเพื่อชีวิตที่ดีขึ้น

🎯 Tone & Voice:
- **Empowering สายมู** — ไม่ใช่หมอดูทำนายลางร้าย, ไม่ใช่ทำดวงประจำวันราศี
- มูแล้วต้องลงมือทำ ("ดวง 50% + การกระทำ 50%")
- ภาษากึ่งทางการ เป็นกันเอง emoji เยอะ 🔮✨💸🚀
- ปิดท้าย CTA แบบขำๆ ขอ comment "สารภาพ" / "เผลอทำข้อไหน"
- ห้ามใช้คำสร้างความกลัวรุนแรง (ตาย, ป่วยหนัก, ล้มละลาย) — ใช้ "ขวางทางรวย" "ดวงตก" "พลังลบ" แทน

🎨 Art Direction:
- Mystical luxury aesthetic — gold + deep purple + cosmic black
- Sacred cards, candles, crystals, lotus, Thai Buddhist/mystical elements
- ห้ามใส่ใบหน้าจริง, brand logo, text/letters ในภาพ

Safety: ทำตาม Community Guidelines, ไม่สัญญาผลแบบ 100%, ไม่อ้างรักษาโรค

═══ FOOTER (ใช้ลงท้าย caption แบบ promo เป๊ะตามนี้) ═══
${FOOTER_TEMPLATES.GURU}

⚠️ Footer ห้ามเปลี่ยน — copy ทั้งบล็อก (Line @317biusr เป๊ะ)`;

// 🎬 Video Reel Script templates — Pawtry-style 9:16 vertical Reels (30-60s)
// แต่ละ course มี structure + voice tone + visual cue ของตัวเอง
const VIDEO_REEL_RULES = {
  PFB: `🎬 Pawtry-style PFB Reel (30-50s, vertical 9:16)

โครงสร้าง:
[HOOK 3-5s] — คำถาม/ประโยคขยี้ pain ทันที + emoji 🐾 ใน subtitle
  ตัวอย่าง VO: "สูตรอาหารของคุณ... กำลังทำสัตว์เลี้ยงป่วยอยู่หรือเปล่า?"
[BODY 25-40s] — 3-4 จุดเรียงต่อ (โครงแบบ Pain → Solution / Problem → Insight / 3 Tips)
  แต่ละจุด 6-10s, มี subtitle ใหญ่ + key number/keyword
  Tone: educational แต่กระชับ ใช้ "ค่ะ/นะคะ" พอประมาณ
[CTA 5-8s] — soft sell หลักสูตร PFB / pawtry
  ตัวอย่าง: "อยากเรียนรู้เพิ่ม...คอมเมนต์ 'สนใจ' รับข้อมูลค่ะ"

Voice direction (TTS):
- Female warm Thai voice, conversational pace, slightly upbeat
- Pause 0.3-0.5s ระหว่างประโยค
- Emphasis (stress) ตรง key number / keyword

Visual cue per scene:
- Hook: bold Thai text on screen + sad pet OR warning icon
- Body: split screen (problem left, solution right) OR product zoom + bullet
- CTA: Pawtry contact card + paw emoji

BGM mood: upbeat editorial / corporate motivation (instrumental)`,

  PHE: `🎬 Pet Hotel Entrepreneur Reel (30-50s, vertical 9:16)

โครงสร้าง:
[HOOK 3-5s] — สถิติแรง/คำเตือน
  ตัวอย่าง: "80% ของโรงแรมหมาแมวเปิดใหม่...เจ๊งใน 2 ปี!"
[BODY 25-40s] — Insight 3-4 ข้อ (ทำไมเจ๊ง / 3 ปัจจัยรอด / Feasibility check)
  Tone: serious mentoring แบบที่ปรึกษา + ตัวเลข/data
[CTA 5-8s] — สมัครคอร์ส / Inbox PHE

Voice direction (TTS):
- Male/Female confident Thai voice, slower deliberate pace
- Authoritative but warm
- Pause hard ระหว่างจุดเปลี่ยน

Visual cue per scene:
- Hook: dramatic before/after OR vacant hotel + red X
- Body: facility shots / floor plan / financial chart overlay
- CTA: course logo + "เรียน 3 วันเต็ม"

BGM mood: cinematic documentary / serious business`,

  GURU: `🎬 อาจารย์หนึ่งคุรุเทพ Reel (30-50s, vertical 9:16)

โครงสร้าง:
[HOOK 3-5s] — คำถามจี้ใจสายมู + emoji 🔮✨
  ตัวอย่าง VO (เสียงผู้ชาย): "มูแล้วไม่ปัง ชีวิตยังนิ่ง ลองเช็ก 3 ข้อนี้ครับ!"
[BODY 25-40s] — Numbered list 3-5 ข้อ (พฤติกรรมขวางทางรวย / เคล็ดลับเสริมดวง / mindset)
  แต่ละข้อ 5-8s, มี emoji ❌📉🎯💔🌟
  Tone: ครับ (ผู้ชาย), empowering, ไม่ขู่
[CTA 5-8s] — soft promo การ์ดศักดิ์สิทธิ์ + Line @317biusr

Voice direction (TTS):
- Male warm Thai voice, conversational + slightly mystical pacing
- Smile in voice — empowering not creepy
- Emphasis on numbers (1, 2, 3) + closing แต่ละข้อ

Visual cue per scene:
- Hook: tarot card glow + Thai text overlay
- Body: numbered cards (1️⃣2️⃣3️⃣) + symbol per item (broken heart, money, sparkle)
- CTA: sacred card showcase + Line ID

BGM mood: mystical ambient with subtle drum (deep purple cinematic mood)`,
};

function buildSystemPrompt(brandVoice, course = 'PFB', style = '') {
  if (style === 'guru_thep' || course === 'GURU') return GURU_THEP_SYSTEM;

  const courseInfo = course === 'PHE'
    ? 'หลักสูตร PET HOTEL ENTREPRENEUR (PHE) — สอนเปิดโรงแรมหมาแมวให้รอด+ทำกำไร 3 วัน'
    : 'หลักสูตร PET FOOD BUSINESS (PFB) — สอนเปิดแบรนด์อาหารสัตว์เลี้ยง 9 วัน';

  return `${brandVoice || DEFAULT_BRAND_VOICE}

บริบทธุรกิจ: ${courseInfo}
กลุ่มเป้าหมาย: คนรักสัตว์เลี้ยงที่อยากเปิดธุรกิจ pet ของตัวเอง / เจ้าของ Pet Shop / นักลงทุน
ห้ามพูดเกินจริง ห้ามใช้สถิติที่หาแหล่งอ้างไม่ได้

═══ FOOTER (ใช้ลงท้าย caption แบบ promo เป๊ะตามนี้) ═══
${getFooter(course)}

⚠️ Footer ห้ามเปลี่ยน — copy ทั้งบล็อกเหมือนตัวอย่าง (เบอร์, FB Page name, Line ID เป๊ะ)`;
}

async function callOpenRouter(messages, system, { model = OPENROUTER_TEXT_MODEL, max_tokens = 2500, json = false } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const fullMessages = system ? [{ role: 'system', content: system }, ...messages] : messages;

  const body = { model, messages: fullMessages, max_tokens, temperature: 0.8 };
  if (json) body.response_format = { type: 'json_object' };  // บังคับ output JSON valid

  const r = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.PUBLIC_URL || 'https://oem-content-factory.vercel.app',
      'X-Title': 'OEM Content Factory',
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`OpenRouter ${r.status}: ${err.slice(0, 250)}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content || '';
}

function extractJsonArray(text) {
  if (!text) return null;
  let clean = text.trim();

  // 1. Strip markdown fence (paired + unpaired)
  const paired = clean.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (paired) clean = paired[1].trim();
  else {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  }

  // 2. Direct parse
  try {
    const v = JSON.parse(clean);
    if (Array.isArray(v)) return v;
  } catch {}

  // 3. หา balanced [ ... ] block (ข้าม strings)
  const start = clean.indexOf('[');
  if (start < 0) return null;
  let depth = 0, inString = false, escape = false, lastBalancedEnd = -1;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0 && ch === ']') lastBalancedEnd = i;
    }
  }
  if (lastBalancedEnd > 0) {
    try {
      const v = JSON.parse(clean.slice(start, lastBalancedEnd + 1));
      if (Array.isArray(v)) return v;
    } catch {}
  }

  // 4. Repair truncated array — เก็บเฉพาะ object ที่สมบูรณ์ก่อนจุดตัด
  const items = [];
  let i = start + 1; // หลัง '['
  while (i < clean.length) {
    while (i < clean.length && /[\s,]/.test(clean[i])) i++;
    if (i >= clean.length || clean[i] !== '{') break;
    const objStart = i;
    let d = 0, inStr = false, esc = false, closed = false;
    for (; i < clean.length; i++) {
      const ch = clean[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') d++;
      else if (ch === '}') {
        d--;
        if (d === 0) {
          try { items.push(JSON.parse(clean.slice(objStart, i + 1))); } catch {}
          i++;
          closed = true;
          break;
        }
      }
    }
    if (!closed) break; // truncated mid-object — หยุด
  }
  if (items.length > 0) return items;

  return null;
}

// Strip lines that are entirely hashtags (and any trailing whitespace/dots) so
// the caption doesn't double up with the `hashtags` array on the post.
// Keeps hashtags that appear inline in prose, e.g. "เช็ก #pawtry คะ" — we only
// remove standalone lines/blocks like "#PFB #pawtry #petfood".
function stripTrailingHashtags(caption) {
  if (!caption) return caption;
  const lines = caption.split('\n');
  while (lines.length) {
    const last = lines[lines.length - 1].trim();
    if (!last) { lines.pop(); continue; }
    // line is pure hashtags + whitespace + optional standalone "."
    if (/^(?:\.|#[^\s#]+(?:\s+#[^\s#]+)*)\s*$/.test(last)) {
      lines.pop();
      continue;
    }
    break;
  }
  return lines.join('\n').trimEnd();
}

function extractJsonObject(text) {
  if (!text) return null;
  let clean = text.trim();

  // 1. ลบ markdown code fence
  // 1a. ลอง paired ``` ... ``` ก่อน
  const paired = clean.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (paired) clean = paired[1].trim();
  else {
    // 1b. unpaired (truncated response) — strip leading/trailing fence ตัวเดียวก็เอา
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  }

  // 2. ลอง parse ตรงๆ
  try { return JSON.parse(clean); } catch {}

  // 3. หา balanced { ... } block
  const start = clean.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inString = false, escape = false, lastBalancedEnd = -1;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) lastBalancedEnd = i;
    }
  }
  if (lastBalancedEnd > 0) {
    try { return JSON.parse(clean.slice(start, lastBalancedEnd + 1)); } catch {}
  }

  // 4. Repair truncated JSON — ปิด string + braces ที่ค้าง
  let repair = clean.slice(start);
  if (inString) repair += '"';                       // ปิด string ที่ค้าง
  while (depth > 0) { repair += '}'; depth--; }      // ปิด object ที่ค้าง
  // ลบ trailing comma ก่อน }
  repair = repair.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(repair); } catch {}

  return null;
}

// Helper: resolve brand voice per course (with override + fallback to default)
async function getBrandVoiceForCourse(course, override) {
  if (override) return override;
  const all = await db.settings.getAll();
  const courseKey = `brand_voice_${(course || 'PFB').toLowerCase()}`;
  return all[courseKey] || all.brand_voice || null;
}

router.post('/topics', async (req, res) => {
  const { course = 'PFB', count = 30, theme = '', brandVoice } = req.body || {};
  const bv = await getBrandVoiceForCourse(course, brandVoice);
  const system = buildSystemPrompt(bv, course);
  const isGuru = course === 'GURU';
  const userMsg = isGuru
    ? `สร้างหัวข้อคอนเทนต์ ${count} หัวข้อ สำหรับเพจ "อาจารย์หนึ่งคุรุเทพ" (แบรนด์การ์ดศักดิ์สิทธิ์ + ที่ปรึกษาสายมู)
ธีมหลัก: ${theme || '(ไม่กำหนด — กระจายระหว่าง พฤติกรรมขวางทางรวย/ดวง, เคล็ดลับเสริมดวง, mindset สายมู, สัญญาณดวงกำลังเปลี่ยน, ของมงคล/การ์ดศักดิ์สิทธิ์, วิธีขอพรให้ปัง)'}

หัวข้อแนวที่ใช่: tip/checklist สั้น empowering สายมู — pain point + วิธีแก้
หัวข้อแนวที่ห้าม: ดวงประจำวันราศี... (ไม่ใช่แนวเพจนี้), ลางร้าย/คำขู่
ตอบเป็น JSON array เท่านั้น: [{"topic":"...","pillar":"knowledge|case|bts|promo","suggested_framework":"F1|F2"}, ...]`
    : `สร้างหัวข้อคอนเทนต์ ${count} หัวข้อสำหรับโพสลง Facebook ในเดือนนี้
ธีมหลัก: ${theme || '(ไม่กำหนด — กระจายให้ครอบคลุม pain, knowledge, case study, behind the scene, promotion)'}

แต่ละหัวข้อต้องไม่ซ้ำกัน หลากหลายมุม
ตอบเป็น JSON array เท่านั้น: [{"topic":"...","pillar":"pain|knowledge|case|bts|promo","suggested_framework":"F1|F2"}, ...]`;

  try {
    // budget เผื่อ Thai content + nested JSON — ~150 tokens/topic + overhead
    const tokenBudget = Math.max(3000, count * 150 + 1000);
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: tokenBudget });
    const arr = extractJsonArray(text) || [];
    if (arr.length === 0) {
      console.error(`[ai/topics] empty array. course=${course} length=${text.length}`);
      console.error('[ai/topics] HEAD(400):', text.slice(0, 400));
      console.error('[ai/topics] TAIL(400):', text.slice(-400));
    }
    res.json({ topics: arr });
  } catch (e) {
    console.error('[ai/topics]', e.message);
    res.status(500).json({ error: e.message, topics: stubTopics(course, count), demo: true });
  }
});

// ✍️ POST /ai/brand-description — AI เขียน "คำอธิบายแบรนด์" อิงจากประเภทธุรกิจ
// body: { businessType, brandName?, current? } → { descriptions: [3 strings] }
router.post('/brand-description', async (req, res) => {
  const { businessType = '', brandName = '', current = '' } = req.body || {};
  const system = `คุณคือผู้เชี่ยวชาญด้าน branding และนักเขียน copywriting ภาษาไทย
หน้าที่: เขียน "คำอธิบายแบรนด์" (brand description) ที่ AI จะใช้เป็นบริบทในการสร้างคอนเทนต์ให้แบรนด์

⚠️ กฎสำคัญที่สุด — ประเภทธุรกิจ (businessType) คือ **ground truth** เด็ดขาด:
- ทุกคำอธิบายต้องเป็นเรื่องของ businessType ที่ระบุเท่านั้น
- ห้ามแอบเอาสินค้า/บริการของธุรกิจประเภทอื่นมาเขียน (เช่น businessType=ดูดวง ห้ามเขียนเรื่องสกินแคร์)
- ถ้า "คำอธิบายเดิม" ที่ผู้ใช้ส่งมาเป็นเรื่องของธุรกิจประเภทอื่น (ไม่ตรงกับ businessType) → **ทิ้งทันที** ห้ามใช้เป็นพื้นฐาน เขียนใหม่จากศูนย์โดยอ้างอิง businessType เป็นหลัก
- คำอธิบายเดิมใช้เฉพาะ "โทนเสียง / สไตล์การเขียน / กลุ่มลูกค้า" เท่านั้น — **ห้ามคงเนื้อหา / สินค้าจากธุรกิจประเภทเดิม**

รูปแบบคำตอบ:
- 2-4 ประโยค กระชับ เห็นภาพ ภาษาไทยธรรมชาติ
- ควรครอบคลุม: ขายอะไร / จุดเด่น / กลุ่มลูกค้า / โทนของแบรนด์
- ห้ามใส่ emoji, hashtag หรือเครื่องหมายคำพูด`;
  const userMsg = `ประเภทธุรกิจ (ground truth — ทุกคำอธิบายต้องเป็นเรื่องนี้): ${businessType || '(ไม่ระบุ)'}
ชื่อแบรนด์: ${brandName || '(ไม่ระบุ)'}
${current ? 'คำอธิบายเดิม (ใช้เฉพาะอ้างอิงโทน — ถ้าเป็นเรื่องธุรกิจอื่น ทิ้งไปเลย): ' + current : ''}

เขียนคำอธิบายแบรนด์ 3 แบบ ที่ต่างมุมกัน — **ทุกแบบต้องเป็นเรื่องของ "${businessType || 'ธุรกิจที่ระบุ'}" เท่านั้น**:
- แบบ 1: ละเอียด ครบถ้วน
- แบบ 2: สั้น กระชับ ตรงประเด็น
- แบบ 3: สไตล์เล่าเรื่อง มีอารมณ์ร่วม

ตรวจก่อนตอบ: ทั้ง 3 แบบเป็นเรื่อง ${businessType || '(ประเภทธุรกิจที่ระบุ)'} หรือไม่? ถ้าไม่ใช่ → เขียนใหม่
ตอบเป็น JSON array ของสตริงเท่านั้น: ["...","...","..."]`;
  try {
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 1500 });
    const arr = (extractJsonArray(text) || []).filter(x => typeof x === 'string' && x.trim());
    if (!arr.length) throw new Error('AI ไม่สามารถสร้างคำอธิบายได้');
    res.json({ descriptions: arr });
  } catch (e) {
    console.error('[ai/brand-description]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 📅 POST /ai/topics-brand — plan a month of content topics from a PostPost brand profile
// body: { brandName, businessType, brandDesc, voices[], archetype, products[], theme, goals[], count }
// → { topics: [{ kind, th, en, len_th, len_en, f }] }
router.post('/topics-brand', async (req, res) => {
  const {
    brandName = '', businessType = '', brandDesc = '',
    voices = [], archetype = '', products = [],
    theme = '', goals = [], count = 30,
  } = req.body || {};
  const n = Math.max(1, Math.min(60, parseInt(count, 10) || 30));
  const prodLines = (Array.isArray(products) ? products : []).slice(0, 15)
    .map(p => `- ${p.name || ''}${p.price ? ' (฿' + p.price + ')' : ''}`).filter(s => s.trim() !== '-').join('\n');

  const system = `คุณคือนักวางแผนคอนเทนต์โซเชียลมีเดียมืออาชีพ ภาษาไทย
หน้าที่: วางแผนหัวข้อคอนเทนต์ทั้งเดือนให้แบรนด์ โดยอิงจากโปรไฟล์แบรนด์ที่ให้มาอย่างเคร่งครัด
- หัวข้อต้องเข้ากับ "ประเภทธุรกิจ" และ "คำอธิบายแบรนด์"
- น้ำเสียง/มุมมองต้องสอดคล้องกับ Brand Voice และ Brand Archetype ที่เลือก
- อ้างอิงสินค้าจริงของแบรนด์เมื่อเหมาะสม
- หัวข้อหลากหลาย ไม่ซ้ำกัน ครอบคลุมหลายมุม และตอบจุดมุ่งหมายที่ระบุ`;
  const userMsg = `โปรไฟล์แบรนด์:
- ชื่อแบรนด์: ${brandName || '(ไม่ระบุ)'}
- ประเภทธุรกิจ: ${businessType || '(ไม่ระบุ)'}
- คำอธิบายแบรนด์: ${brandDesc || '(ไม่ระบุ)'}
- Brand Voice (โทนเสียง): ${voices.length ? voices.join(', ') : '(ไม่ระบุ)'}
- Brand Archetype: ${archetype || '(ไม่ระบุ)'}
- สินค้าที่เลือกให้ AI ใช้:
${prodLines || '(ไม่ระบุ)'}
- ธีมเดือนนี้: ${theme || '(กระจายให้หลากหลาย)'}
- จุดมุ่งหมาย: ${goals.length ? goals.join(', ') : 'ทั่วไป'}

สร้างหัวข้อคอนเทนต์ ${n} หัวข้อ สำหรับโพสต์ทั้งเดือน
แต่ละหัวข้อเลือก "kind" 1 อย่างจาก: knowledge (ให้ความรู้), promo (ขายตรง), review (รีวิว), story (เล่าเรื่อง), tip (Tip), engage (ถาม-ตอบ)
ตอบเป็น JSON array เท่านั้น:
[{"kind":"tip","th":"หัวข้อภาษาไทย","en":"English topic","len_th":"80-120 คำ","len_en":"80-120 words","f":"F1"}, ...]`;

  try {
    const tokenBudget = Math.max(3000, n * 130 + 1200);
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: tokenBudget });
    const KINDS = ['knowledge', 'promo', 'review', 'story', 'tip', 'engage'];
    let arr = (extractJsonArray(text) || []).filter(x => x && (x.th || x.topic));
    arr = arr.map((x, i) => ({
      kind: KINDS.indexOf(x.kind) >= 0 ? x.kind : KINDS[i % KINDS.length],
      th: String(x.th || x.topic || '').trim(),
      en: String(x.en || x.th || x.topic || '').trim(),
      len_th: x.len_th || '80-120 คำ',
      len_en: x.len_en || '80-120 words',
      f: /^F[123]$/.test(x.f) ? x.f : ('F' + (i % 3 + 1)),
    })).filter(x => x.th);
    if (!arr.length) throw new Error('AI ไม่สามารถสร้างหัวข้อได้ — ลองอีกครั้ง');
    res.json({ topics: arr });
  } catch (e) {
    console.error('[ai/topics-brand]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ✍️ POST /ai/content-brand — generate hook/caption/hashtags/article for a topic, from a PostPost brand profile
// body: { brandName, businessType, brandDesc, voices[], archetype, products[], topic, tone, length, lang }
// → { hooks: [{text, angle}], caption, hashtags: [], article }
router.post('/content-brand', async (req, res) => {
  const {
    brandName = '', businessType = '', brandDesc = '',
    voices = [], archetype = '', products = [],
    topic = '', tone = '', length = '', lang = 'th', imageCount = 5,
  } = req.body || {};
  if (!topic.trim()) return res.status(400).json({ error: 'topic required' });
  const nImg = Math.max(1, Math.min(10, parseInt(imageCount, 10) || 5));
  const prodLines = (Array.isArray(products) ? products : []).slice(0, 10)
    .map(p => `- ${p.name || ''}${p.price ? ' ฿' + p.price : ''}`).filter(s => s.trim() !== '-').join('\n');

  const system = `คุณคือ Copywriter โซเชียลมีเดียมืออาชีพ ภาษาไทย
เขียนคอนเทนต์ให้แบรนด์โดยอิงจากโปรไฟล์แบรนด์และหัวข้อที่ให้มาอย่างเคร่งครัด
- เนื้อหาทั้งหมดต้องเกี่ยวกับ "หัวข้อโพสต์" ที่ระบุ ห้ามออกนอกเรื่อง
- น้ำเสียงตรงกับ Brand Voice และ Brand Archetype ที่เลือก
- อ้างอิงสินค้าจริงของแบรนด์เมื่อเหมาะสม
- ห้ามสัญญาผลเกินจริง ห้ามใช้คำต้องห้ามทางการแพทย์/โฆษณา`;
  const userMsg = `โปรไฟล์แบรนด์:
- ชื่อแบรนด์: ${brandName || '(ไม่ระบุ)'}
- ประเภทธุรกิจ: ${businessType || '(ไม่ระบุ)'}
- คำอธิบายแบรนด์: ${brandDesc || '(ไม่ระบุ)'}
- Brand Voice: ${voices.length ? voices.join(', ') : '(ไม่ระบุ)'}
- Brand Archetype: ${archetype || '(ไม่ระบุ)'}
- สินค้า:
${prodLines || '(ไม่ระบุ)'}

หัวข้อโพสต์: ${topic}
โทน: ${tone || '(ตาม Brand Voice)'}
ความยาวแคปชั่น: ${length || 'ปานกลาง ~150 คำ'}
${lang === 'en' ? 'ภาษา: เขียนคอนเทนต์ทั้งหมด (hooks, caption, hashtags, article) เป็นภาษาอังกฤษ' : 'ภาษา: เขียนคอนเทนต์ทั้งหมดเป็นภาษาไทย'}

สร้างคอนเทนต์สำหรับโพสต์นี้ — ทุกอย่างต้องเกี่ยวกับ "หัวข้อโพสต์" ข้างบน:
1. hooks — 3 แบบ ต่างมุมกัน (แต่ละแบบมี text = ประโยค hook, angle = สไตล์สั้นๆ)
2. caption — แคปชั่นเต็มพร้อมโพสต์ ใส่ emoji พอเหมาะ
3. hashtags — 10-14 แฮชแท็กที่เกี่ยวข้อง
4. article — บทความ ~250-320 คำ (กระชับ ได้ใจความ)
5. imagePrompts — prompt สำหรับสร้างรูป (เป็นภาษาอังกฤษ) **ต้องมี ${nImg} ข้อพอดี = ${nImg} สไลด์** (ไม่มากไม่น้อย) ไล่ตามโครงโพสต์ แต่ละ prompt บรรยายฉาก องค์ประกอบ สไตล์ โทนสี และข้อความไทยบนรูป (ถ้ามี) ให้ image model สร้างได้ทันที — ต้องสอดคล้องกับแบรนด์และหัวข้อ

   ⚠️ ถ้าหัวข้อเป็นรายการตัวเลข (เช่น "5 สัญญาณ...", "3 วิธี...", "7 เคล็ดลับ...", "4 เหตุผล..."):
   - **บังคับ**: สไลด์ 1 = ปกหัวข้อ, สไลด์ 2 = ข้อที่ 1, สไลด์ 3 = ข้อที่ 2, ... สไลด์ K+1 = ข้อที่ K, สไลด์สุดท้าย (ถ้าเหลือ) = CTA/สรุป
   - **ห้ามรวม**หลายข้อในสไลด์เดียวกัน (ห้ามเขียน "ข้อที่ 2-3" หรือ "สัญญาณที่ 4-5" ในสไลด์เดียว) — ต้องแยกข้อละสไลด์
   - **ใส่เลขข้อชัดเจนบนรูป**: "สัญญาณที่ 1", "ข้อที่ 2", "วิธีที่ 3", "เหตุผลที่ 4" ฯลฯ ตามคำในหัวข้อ
   - ถ้า ${nImg} น้อยกว่าจำนวนข้อในหัวข้อ → เลือกเฉพาะข้อสำคัญที่สุด (ห้ามรวม) ระบุชัดในแต่ละสไลด์ว่าเป็นข้อที่เท่าไหร่
   - ถ้า ${nImg} **มากกว่า**จำนวนข้อในหัวข้อ → เพิ่มสไลด์ CTA / สรุป / ตัวอย่าง / before-after ให้ครบ ${nImg} ข้อพอดี (ห้ามส่งน้อยกว่า ${nImg})
   - สไตล์ภาพและโทนสีต้องสอดคล้องกันทุกสไลด์ เหมือนชุดเดียวกัน

⚠️ ตรวจก่อนตอบ: imagePrompts ต้องมีความยาว = ${nImg} เป๊ะ ๆ (นับให้ดี ๆ — ${nImg} ข้อ)
ตอบเป็น JSON object เท่านั้น:
{"hooks":[{"text":"...","angle":"..."},{"text":"...","angle":"..."},{"text":"...","angle":"..."}],"caption":"...","hashtags":["#...","#..."],"article":"...","imagePrompts":[${Array(nImg).fill('"..."').join(',')}]}`;

  try {
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 3200 + nImg * 220 });
    const obj = extractJsonObject(text);
    if (!obj) throw new Error('AI ไม่สามารถสร้างคอนเทนต์ได้ — ลองอีกครั้ง');

    let prompts = Array.isArray(obj.imagePrompts)
      ? obj.imagePrompts.map(s => String(s).trim()).filter(Boolean)
      : [];

    // Safety net — the model occasionally returns fewer prompts than requested even when
    // we ask hard. If short by 1+, ask it to top up the missing slides (one retry only).
    if (prompts.length < nImg && prompts.length > 0) {
      const missing = nImg - prompts.length;
      console.warn(`[content-brand] AI returned ${prompts.length}/${nImg} prompts — asking for ${missing} more`);
      try {
        const topUpUser = `Topic: ${topic}
Existing slides (already written):
${prompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

You wrote ${prompts.length} but ${nImg} were requested. Write EXACTLY ${missing} additional English image prompts that continue this slide series (CTA / summary / variations / numbered continuations as appropriate). Keep the same visual style and color palette as the existing slides. If the topic is a numbered list and slides already cover items 1..K, the new slides should cover items K+1..N or summary/CTA.

Reply with a JSON array of exactly ${missing} strings — no commentary, no object wrapper:
[${Array(missing).fill('"..."').join(',')}]`;
        const more = await callOpenRouter([{ role: 'user', content: topUpUser }], 'Return a JSON array of strings only.', { max_tokens: 200 * missing + 400 });
        // Try to parse — accept either [..] or {..."prompts":[..]}
        let arr = null;
        try { arr = JSON.parse(more); } catch(_){}
        if (!Array.isArray(arr)) {
          // try to pull the first JSON array out of the text
          const m = String(more || '').match(/\[[\s\S]*\]/);
          if (m) { try { arr = JSON.parse(m[0]); } catch(_){} }
        }
        if (Array.isArray(arr)) {
          const extras = arr.map(s => String(s).trim()).filter(Boolean).slice(0, missing);
          prompts = prompts.concat(extras);
        }
      } catch (retryErr) {
        console.warn('[content-brand] top-up failed:', retryErr.message);
      }
    }
    prompts = prompts.slice(0, nImg);

    res.json({
      hooks: Array.isArray(obj.hooks)
        ? obj.hooks.slice(0, 3).map(h => ({ text: typeof h === 'string' ? h : (h.text || ''), angle: (h && h.angle) || '' })).filter(h => h.text)
        : [],
      caption: String(obj.caption || '').trim(),
      hashtags: Array.isArray(obj.hashtags) ? obj.hashtags.map(s => String(s).trim()).filter(Boolean) : [],
      article: String(obj.article || '').trim(),
      imagePrompts: prompts,
      requestedImageCount: nImg,
      returnedImageCount: prompts.length,
    });
  } catch (e) {
    console.error('[ai/content-brand]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/caption', async (req, res) => {
  const { course = 'PFB', topic, hook, framework = 'F1', brandVoice } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const bv = await getBrandVoiceForCourse(course, brandVoice);
  const system = buildSystemPrompt(bv, course);
  const fwHint = framework === 'F2'
    ? 'Hook framework F2: ขยี้ปัญหา + ผลลัพธ์ + ความโลภ + ขู่ให้กลัว'
    : 'Hook framework F1: ขยี้ปัญหา + ผลลัพธ์ + ระยะเวลา + ผลลัพธ์เหลือเชื่อ';

  const userMsg = `หัวข้อ: "${topic}"
${hook ? `Hook ที่ใช้: "${hook}"` : ''}
${fwHint}

สร้างโพส Facebook 1 โพส ตามสไตล์ Brand Voice
ตอบเป็น JSON object เท่านั้น: {"hook":"...","caption":"...","hashtags":["#...","#..."],"image_prompt":"..."}`;

  try {
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system);
    const obj = extractJsonObject(text);
    if (!obj) throw new Error('AI ไม่สามารถสร้าง JSON ที่ถูกต้องได้');
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/generate-all', async (req, res) => {
  const { course = 'PFB', topic, framework = 'F1', brandVoice, generateImage = true, post_style = 'auto' } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic required' });

  // Resolve style — auto = ให้ AI ตัดสินใจจาก topic + course
  const styleKey = post_style === 'auto'
    ? (course === 'GURU' || /(ดูดวง|ทาโรต์|ทาโรท|ราศี|horoscope|tarot|คุรุเทพ|อาจารย์หนึ่ง|สายมู|มูเตลู|ของมงคล|เสริมดวง|ขอพร|พลังลบ|โชคลาภ)/i.test(topic) ? 'guru_thep'
      : /(หลักสูตร|คอร์ส|เรียน|สมัคร|จองสิทธิ์|PFB|PHE)/i.test(topic) ? 'promo'
      : 'educational')
    : post_style;
  const styleTemplate = POST_STYLES[styleKey] || POST_STYLES.educational;
  const isGuru = styleKey === 'guru_thep';

  const bv = await getBrandVoiceForCourse(course, brandVoice);
  const system = buildSystemPrompt(bv, course, styleKey);
  const fwHint = framework === 'F2'
    ? 'Hook framework F2: ขยี้ปัญหา + ผลลัพธ์ + ความโลภ + ขู่ให้กลัว'
    : 'Hook framework F1: ขยี้ปัญหา + ผลลัพธ์ + ระยะเวลา + ผลลัพธ์เหลือเชื่อ';

  const guruHashtagRule = 'ต้องมีอย่างน้อย: #อาจารย์หนึ่งคุรุเทพ #คุรุเทพ #Kuruthep #ของมงคล #สายมู (เพิ่ม #ดูดวง #เสริมดวง #มูเตลู #การ์ดศักดิ์สิทธิ์ ตามหัวข้อ)';
  const bizHashtagRule = `ห้ามใช้ตัวย่อ (ห้าม #PFB #PHE) ใช้คำเต็ม เช่น #PetFoodBusiness #PetHotelEntrepreneur #PawtryThailand #อาหารสัตว์ #คนรักสัตว์`;

  // 🪷 GURU — Luxury Spiritual Zen Minimal (Japanese-Korean interior aesthetic)
  // โทนครีม/ขาว/champagne gold + แท่นบูชา/ดอกไม้/marble/linen — สงบ สะอาด หรู modern zen
  // ใช้กับเนื้อหา: หิ้งพระ, ของมงคล, ตำแหน่งบูชา, บทสวด, mindfulness, blessings
  const guruImageRules = `📸 image_prompt rules — เขียนเป็น "ENGLISH PROMPT" + **ใส่ Thai text overlay** (สไตล์ Luxury Zen คุรุเทพ):

🎯 CRITICAL: aesthetic ต้อง "luxury spiritual minimal — modern zen Japanese-Korean interior". โครงรูปต้องสมมาตร centered:
1. HEADER (top, ~10%) — title ใหญ่ embossed gold effect
2. SUBHEADER (~5%) — บรรทัดขยายสั้น
3. CENTER HERO (~50%) — sacred subject กลางภาพ (altar / object / mantra)
4. INFOGRAPHIC ANNOTATIONS (~20%) — เส้น gold ลายเส้นบางๆ ลากจาก hero ออกไปข้าง พร้อม Thai text 2-4 จุด
5. BOTTOM WARNING BAR (~10%) — แถบไม้เข้ม + ข้อความ "✘ จุดต้องระวัง"

โครงสร้าง prompt:
"[CORE STYLE]. [HERO: symmetrical centered sacred subject]. [BACKGROUND: cream wall + marble + linen + warm side glow]. TEXT OVERLAY: [Thai title + subhead + 2-4 annotated points + bottom warning]. [LIGHTING + COLOR]. [NEGATIVE]."

CORE STYLE (ใส่ทุกครั้ง):
"${PHOTO_PROMPT_CORE}"

🎨 AESTHETIC (บังคับ):
- Palette: cream #f5ead4 + white + light wood #d4b896 + champagne gold #d4a574 + warm beige (ห้าม deep purple, ห้าม dark occult, ห้าม neon)
- Mood: calm, clean, premium, modern zen mindfulness, warm soft glow
- Background: cream plaster wall texture + circular marble slab (right side) + folded beige linen (left side) + natural warm side-light glow + soft cinematic shadows
- Composition: **symmetrical centered**, sacred subject อยู่กลางเป๊ะ, decor minimal สมดุล

HERO SCENE rules (center, ~50% ของรูป):
- Subject เลือกตามหัวข้อ: 3-tier wooden altar, sacred amulet on velvet tray, jasmine + brass incense holder, gold Buddha statue, prayer beads in glass, Thai mystical motif on stone, ฯลฯ
- แสง warm cinematic glow จากด้านข้าง, depth of field ตื้น, glossy editorial photography

TEXT OVERLAY rules (✨ บังคับ — ต้องครบ 4-5 ส่วน):

(1) HEADER (top center, very large):
"Large bold modern Thai luxury display font reading '[Thai title — 4-8 คำ เช่น 4 กฎทอง...]', embossed champagne gold #d4a574 effect with soft elegant shadow. Perfectly spelled."

(2) SUBHEADER (right below header, medium):
"Medium dark-charcoal Thai text reading '[1 บรรทัด — รวมทุก... ไว้ในภาพเดียว / เช็กก่อน... / 4 ข้อต้องรู้...]'. Perfectly spelled."

(3) INFOGRAPHIC ANNOTATIONS (2-4 จุด รอบ hero, gold thin lines):
"Thin pale-gold infographic lines connecting the hero subject to 2-4 annotated callout boxes positioned at sides:
- Annotation A (left or right side): bold Thai mini-title + Thai detail '[2-3 บรรทัด explanation]'.
- Annotation B (opposite side): same structure.
- Optional Annotation C/D: similar.
All Thai text in dark-charcoal or champagne gold, perfectly spelled, clean premium UI style."

(4) BOTTOM WARNING BAR (very bottom, ~10%):
"Bottom horizontal bar in dark walnut wood color with bold cream Thai text reading '✘ จุดต้องระวัง' followed by numbered list '1. [คำเตือน 1]   2. [คำเตือน 2]'. Perfectly spelled."

NEGATIVE constraints (ใส่ทุกครั้ง):
"Vertical 4:5. NOT cartoon, NOT illustration, NOT 3D render. NO real human face. NO brand logos. NO occult dark purple or red neon. NO Halloween / horror imagery. ALL Thai text perfectly spelled with correct vowel marks and tone marks."

ตัวอย่างที่ดี (Luxury Zen — หัวข้อ '4 กฎทองจัดหิ้งพระ'):
"${PHOTO_PROMPT_CORE}
Symmetrical centered composition: a 3-tier light wooden altar in middle of frame. Top tier: small gold Buddha statue. Middle tier: white-glaze bodhisattva figure. Bottom tier: three small monk figures in a row. Brass incense holder, candle stand, jasmine garland, brass offering bowl arranged minimally on either side. Cream plastered wall background, a circular marble slab on the right side, folded beige linen cloth on the left side. Natural warm side-glow from the right, soft cinematic shadows, premium editorial lighting.

TEXT OVERLAY:
HEADER (top center): Large bold modern Thai luxury display reading '4 กฎทองจัดหิ้งพระ' with embossed champagne gold #d4a574 effect and soft elegant shadow. Perfectly spelled.
SUBHEADER: Medium dark-charcoal Thai text reading 'รวมทุกตำแหน่งมงคลและข้อควรระวัง ไว้ในภาพเดียว'.
INFOGRAPHIC ANNOTATIONS — thin pale-gold lines connect from altar to annotation boxes:
- Right side: bold Thai 'จัดลำดับจากสูงไปต่ำ:' + 'พระพุทธ > พระโพธิสัตว์/เทพ > พระสงฆ์'.
- Left side: bold Thai 'ต้องสูงกว่าระดับสายตา' + 'หรือสูงกว่าศีรษะ เพื่อรับพลังงานบวก'.
- Bottom-left annotation: bold Thai 'เน้นทิศเหนือ (N), ตะวันออก (E), หรือตะวันออกเฉียงเหนือ (NE)' + 'เพื่อความก้าวหน้า'.
BOTTOM BAR: dark walnut wood bar with bold cream Thai text '✘ จุดต้องระวัง   1. ห้ามพิงผนังห้องน้ำ   2. ห้ามหันปลายเท้าใส่หิ้งพระ'. Perfectly spelled.
All Thai text in modern luxury bold, gold and dark-charcoal accents, magazine-quality typography.

Cream + white + light wood + champagne gold palette. Warm natural lighting, soft cinematic shadows, modern zen Japanese-Korean interior aesthetic.
Vertical 4:5. Photographic realism. NOT cartoon, NOT illustration. NO occult dark purple. NO real human face. NO brand logos. ALL Thai text perfectly spelled."

ตัวอย่างที่ไม่ดี:
"Mystical sacred tarot card on dark purple velvet..." (ผิด! ผิด aesthetic — ห้าม occult dark purple, ต้อง cream+gold zen)
"Cartoon Buddha" (ผิด! ต้อง photographic)
"No infographic annotations" (ผิด! ต้องมี 2-4 จุด gold-line annotations)`;

  // 🏥 PHE — Premium Veterinary Clinic Infographic (clean medical / wellness branding)
  // โทน olive green + warm cream + soft beige + muted orange — modern Korean wellness aesthetic
  // ใช้กับเนื้อหา: warning signs, do/don't, before-after, checklist, symptoms, health education
  const pheImageRules = `📸 image_prompt rules — เขียนเป็น "ENGLISH PROMPT" + **ใส่ Thai text overlay** (สไตล์ Premium Veterinary Clinic Infographic):

🎯 CRITICAL: aesthetic ต้อง "premium veterinary clinic poster + Korean wellness branding + clean medical infographic". รูปต้องดูสะอาด เชื่อถือได้ มืออาชีพ:
1. TOP HEADER (top, ~12%) — title สีเขียวเข้ม bold + subtle shadow
2. CENTER HERO (~35%) — realistic Golden Retriever + cat คู่กลางภาพ บนพื้นไม้ Scandinavian/Korean interior
3. 4-7 INFO BOXES (~40%) — กล่อง rounded corners เรียงสมมาตรรอบ hero (2 ฝั่ง หรือ grid)
4. BOTTOM SECTION (~13%) — Insight Box (ซ้าย) + CTA Box (ขวา)

โครงสร้าง prompt:
"[CORE STYLE]. [HERO: realistic Golden Retriever + cat centered, modern minimal interior]. [4-7 INFO BOXES arranged symmetrically around pets]. [BOTTOM: insight box + CTA box]. TEXT OVERLAY: [Thai title + boxes + insights]. [LIGHTING + COLOR]. [NEGATIVE]."

CORE STYLE (ใส่ทุกครั้ง):
"${PHOTO_PROMPT_CORE}"

🎨 AESTHETIC (บังคับ):
- Palette: soft olive green #6b8f4e + warm cream #f7f3eb + soft beige + muted orange #d98c3f + warm brown + white (ห้ามใช้สี saturated/neon/vintage red — เน้น muted medical tones)
- Mood: premium veterinary clinic, calm, trustworthy, professional, wellness-focused
- Background: cream-white Scandinavian/Korean-style interior, light wooden floor, blurred plants, warm daylight from window, soft realistic shadows from DSLR 85mm f/1.4
- Composition: **symmetrical** — pets อยู่กลาง, info boxes กระจายสมดุล รอบทั้งสองฝั่ง

HERO SCENE rules (center, ~35% ของรูป):
- realistic Golden Retriever + realistic short-haired tabby cat sitting naturally side-by-side on light wooden floor
- Both pets facing camera, gentle friendly expressions, **natural fur texture** (NOT over-smooth AI texture), realistic paws/whiskers/eyes/body proportions
- Editorial DSLR photography quality, soft cinematic lighting, ambient bounce light, natural depth of field

INFO BOX rules (4-7 boxes — arrange around hero, alt sides):
- Each box: soft rounded corners (border-radius ~16px) + subtle drop shadow
- Background tint: muted olive green tint OR warm beige tint OR soft cream — สลับใน 4-7 boxes
- Inside box: small premium flat medical-style icon (clean line-art, no cartoon) + bold Thai title + 1-line Thai detail
- Spacing: clean editorial margins, professional typography hierarchy

TEXT OVERLAY rules (✨ บังคับ — ต้องครบ):

(1) TOP HEADER (top, large):
"Large bold Thai headline in dark olive green #4a6b3a (with subtle warm shadow) reading '[Thai title — มักจะมี number + warning emoji เช่น 7 สัญญาณเตือน!]'. Modern Thai sans-serif (clean rounded). Perfectly spelled with correct vowels and tone marks."

(2) 4-7 INFO BOXES (arranged symmetrically around pets):
"[N] rounded-corner info boxes with soft shadows positioned [left side: boxes 1, 3, 5] [right side: boxes 2, 4, 6] [top or bottom: box 7 if needed]. Each box:
- Tint: muted olive green / warm beige / soft cream (alternate)
- Small flat medical-style icon (line-art clean design — e.g. scratching pet, skin rash, hair follicle, dandruff, odor wave, dry skin, skin bump)
- Bold Thai title (e.g. 'คันไม่หยุด')
- Thai detail line (e.g. 'เกา เลีย หรือกัดแทะตัวเองบ่อยผิดปกติ')
All Thai text perfectly spelled, professional veterinary-clinic typography."

(3) BOTTOM SECTION (very bottom):
"Left: soft-green rounded Insight Box with bold Thai header 'Insight Box' + Thai body '[short insight 1-2 lines, e.g. ผิวหนังคือเกราะป้องกัน และสะท้อนสุขภาพภายใน]'.
Right: warm-orange rounded CTA Box with bold Thai text '[urgent call to action e.g. อย่าปล่อยไว้! ปรึกษาสัตวแพทย์ทันที]'."

NEGATIVE constraints (ใส่ทุกครั้ง — สำคัญมากสำหรับ realistic pets):
"Vertical 4:5. NOT cartoon, NOT anime, NOT 3D render, NOT exaggerated AI rendering. NO plastic-looking fur. NO oversaturated colors. NO distorted anatomy. NO extra limbs. NO watermark. NO brand logos. NO fake/garbled text. Photorealistic pets with natural fur, realistic paws/whiskers/eyes. Believable interior lighting. ALL Thai text perfectly spelled with correct vowel marks and tone marks."

ตัวอย่างที่ดี (Premium Veterinary Clinic — หัวข้อ '7 สัญญาณเตือนโรคผิวหนังสัตว์เลี้ยง'):
"${PHOTO_PROMPT_CORE}
Vertical 4:5. Center composition: realistic Golden Retriever and realistic short-haired tabby cat sitting naturally side-by-side on light wooden floor in a bright modern minimal interior. Both pets facing camera with gentle friendly expressions. Natural detailed fur texture with realistic lighting and shadow transitions. Realistic paws, whiskers, eyes, body proportions. Soft cream-white Scandinavian/Korean-style background with blurred plants and warm daylight from window. Natural DSLR depth of field 85mm f/1.4. Soft realistic shadows and ambient bounce light. Clean editorial photography style.

TEXT OVERLAY:
TOP HEADER: Large bold Thai sans-serif headline in dark olive green with subtle warm shadow reading '7 สัญญาณเตือน! โรคผิวหนังสัตว์เลี้ยง'. Perfectly spelled.

7 INFO BOXES arranged symmetrically around the pets (3 left + 3 right + 1 below, all soft-rounded with subtle shadows, alternating muted-olive / warm-beige / soft-cream tints):
- Box 1 (left top, small scratching dog icon): bold Thai 'คันไม่หยุด' + detail 'เกา เลีย หรือกัดแทะตัวเองบ่อยผิดปกติ'.
- Box 2 (right top, skin rash icon): 'ผิวอักเสบ' + 'มีผื่นแดง บวม หรือจุดเลือดออก'.
- Box 3 (left mid, hair follicle icon): 'ขนร่วง' + 'หลุดเป็นหย่อมๆ หรือร่วงมากกว่าปกติ'.
- Box 4 (right mid, dandruff skin icon): 'สะเก็ดรังแค' + 'ผิวลอกเป็นแผ่น หรือมีแผลตกสะเก็ด'.
- Box 5 (left lower, odor wave icon): 'กลิ่นตัวแรง' + 'ผิวหนังมีกลิ่นเหม็นผิดปกติ (แม้เพิ่งอาบน้ำ)'.
- Box 6 (right lower, dry skin icon): 'สภาพผิวเปลี่ยน' + 'ผิวแห้งกร้าน หรือมันเยิ้มเกินไป'.
- Box 7 (below pets, skin bump icon): 'ตุ่มนูน' + 'พบก้อนเนื้อ หรือตุ่มคล้ายตามตัว'.

BOTTOM SECTION:
Left: soft-green rounded Insight Box reading bold Thai 'Insight Box' + 'ผิวหนังคือเกราะป้องกัน และสะท้อนสุขภาพภายใน'.
Right: warm-orange rounded CTA Box reading bold Thai 'อย่าปล่อยไว้! ปรึกษาสัตวแพทย์ทันที'.

Color palette: soft olive green #6b8f4e, warm cream #f7f3eb, soft beige, muted orange #d98c3f, warm brown, white.

Premium veterinary clinic poster, Korean wellness branding, modern pet healthcare campaign, editorial photography, realistic commercial advertising.

NOT cartoon. NOT anime. NOT 3D render. NO plastic fur. NO oversaturated colors. NO distorted anatomy. NO watermark. NO brand logos. Photorealistic pets with believable interior lighting. ALL Thai text perfectly spelled."

ตัวอย่างที่ไม่ดี:
"Comic panels with thick white frames" (ผิด! PHE ตอนนี้ใช้ veterinary clinic style — ไม่ใช่ scrapbook collage)
"Vintage red + navy palette + dramatic warning vibe" (ผิด! ต้อง muted olive/beige/orange — calm professional)
"Cartoon pets" (ผิด! ต้อง realistic DSLR photography of pets — fur texture realistic)
"Saturated neon colors" (ผิด! ต้อง muted natural wellness tones)`;

  const bizImageRules = `📸 image_prompt rules — เขียนเป็น "ENGLISH PROMPT" + **ใส่ Thai text overlay เต็มรูป** (Pawtry-style infographic):

🎯 CRITICAL: รูปต้อง "อ่านได้" คนเลื่อนผ่านต้องเข้าใจ message ทันที — ไม่ใช่แค่หัวเรื่อง ต้องมี:
1. หัวเรื่อง (hook) ตัวใหญ่บนสุด
2. คำขยายสั้น (subtitle) ใต้หัวเรื่อง
3. **3 KEY POINTS / INFO CARDS** กลางรูป — สาระสำคัญที่ดึงจาก caption
4. CTA banner ล่างสุด

โครงสร้าง prompt:
"[CORE STYLE]. [SCENE DESCRIPTION (1-2 lines, 30% ของรูป)]. TEXT OVERLAY: [Full Thai layout — title + subtitle + 3 cards + CTA]. [LIGHTING + COLOR]. [NEGATIVE]."

CORE STYLE (ใส่ทุกครั้ง):
"${PHOTO_PROMPT_CORE}"

SCENE rules:
- Photographic, cinematic แต่ **ไม่ดอมิเนทรูป** — เหลือพื้นที่ ~70% สำหรับ text overlay
- Subject: pet/product/scene matching topic (วางขอบล่าง, มี depth blur)
- Color mood ตาม pain/promise: red-neon (warning/pain), cyan-neon (tech/premium), warm-amber (lifestyle/trust), navy-gold (premium/expertise)

TEXT OVERLAY rules (✨ สำคัญสุด — ต้องครบ 4 ส่วน):

(1) HEADER (top, ~10% ของรูป):
"Large bold [metallic color] Thai display text reading '[hook ภาษาไทย]' with [outline/shadow] effect. Perfectly spelled."

(2) SUBHEADER (right below header):
"Medium [color] Thai text reading '[1 ประโยคขยาย hook]'. Perfectly spelled."

(3) **3 GLASSMORPHISM INFO CARDS** (middle, ~40% ของรูป — เรียงแนวนอนหรือ stack):
"Three glassmorphism cards with rounded corners, soft shadows, semi-transparent white background:
- Card 1: Bold Thai number '1' + title '[หัวข้อย่อย 1]' + 1 line ของเนื้อหา '[detail ~10-15 คำ]'
- Card 2: Bold Thai number '2' + title '[หัวข้อย่อย 2]' + '[detail]'
- Card 3: Bold Thai number '3' + title '[หัวข้อย่อย 3]' + '[detail]'
All Thai text perfectly spelled, professional sans-serif typography."

(4) CTA BANNER (bottom, ~10% ของรูป):
"Bottom banner with [color] gradient: bold Thai text reading '[CTA phrase ~10-15 คำ]'. Perfectly spelled."

NEGATIVE constraints (ใส่ทุกครั้ง):
"Vertical 4:5. NOT cartoon, NOT illustration, NOT 3D render, NOT digital art. NO brand logos. ALL Thai text must be perfectly spelled with correct vowel marks and tone marks."

ตัวอย่างที่ดี (Pawtry-style infographic):
"${PHOTO_PROMPT_CORE}
Bottom 30% of frame: a happy Golden Retriever and gray tabby cat side-by-side on cream fabric, soft amber backlighting, slightly out of focus. Top 70% of frame is reserved for typography overlay.

TEXT OVERLAY:
HEADER (top center): Large bold gold-gradient Thai display text reading 'ทำไมแบรนด์อาหารสัตว์เลี้ยงต้องมี Story?' with dark outline.
SUBHEADER (below header): Medium white Thai text reading 'เพราะ story คือหัวใจของความเชื่อมั่น'.
3 GLASSMORPHISM CARDS (middle, horizontal row): semi-transparent white cards with rounded corners and soft shadows:
- Card 1: Gold number '1' + bold Thai 'สร้างความผูกพัน' + Thai detail 'ลูกค้าจดจำแบรนด์ผ่านเรื่องเล่า ไม่ใช่แค่สินค้า'.
- Card 2: Gold number '2' + bold Thai 'ตั้งราคาได้สูงขึ้น' + Thai detail 'แบรนด์มี story รับ premium 30-50% เหนือ generic'.
- Card 3: Gold number '3' + bold Thai 'แตกต่างจากคู่แข่ง' + Thai detail 'story ลอกไม่ได้ — ความได้เปรียบที่ยั่งยืน'.
CTA BANNER (bottom): Gold gradient banner with bold Thai text 'เริ่มเขียน story แบรนด์คุณวันนี้ — ทักแชทเลย!'.
All Thai text perfectly spelled, professional sans-serif typography, magazine-quality layout.

Warm amber + cream + gold color palette, premium editorial photography lighting.
Vertical 4:5. NOT cartoon, NOT illustration, NOT 3D render. NO brand logos. ALL Thai text perfectly spelled with correct vowel/tone marks."

ตัวอย่างที่ไม่ดี:
"...NO text..." (ผิด! ต้องมี Thai text)
"Just a title with no body" (ผิด! ต้องมี 3 info cards)
"Cute cartoon dog" (ผิด! cartoon)`;

  // 🇰🇷 Korean Premium Wellness — PFB infographic poster style
  // โครงสร้างตามตัวอย่างที่ผู้ใช้ส่งมา (Pet Food Trend 2026 reference):
  //   header → subheader → 4 glassmorphism cards (alt green/blue) → premium icon row → green-gold bottom banner
  //   สมมาตร, Golden Retriever + cream cat กลางรูป, ชามอาหาร premium + วัตถุดิบสด, leaves + sparkle
  const pfbImageRules = `📸 image_prompt rules — เขียนเป็น "ENGLISH PROMPT" + **ใส่ Thai text overlay เต็มรูป** (Korean Premium Wellness infographic):

🎯 CRITICAL: รูปต้อง "อ่านได้" — คนเลื่อนผ่านต้องเข้าใจ message ทันที. โครงต้องมีครบ 6 ส่วน:
1. HEADER (top, ~10%) — title ตัวใหญ่
2. SUBHEADER (~5%) — บรรทัดขยาย hook
3. CENTER HERO (~25%) — รูปสัตว์ + ชามอาหาร + วัตถุดิบ (symmetrical)
4. 4 GLASSMORPHISM INFO CARDS (~35%) — สลับสีเขียว/ฟ้า
5. 4 PREMIUM ICONS ROW (~10%) — icon + label สั้นๆ
6. GREEN-GOLD BOTTOM BANNER (~10%) — CTA

โครงสร้าง prompt:
"[CORE STYLE]. [HERO SCENE — symmetrical pets + food bowl + ingredients, center of frame]. [BACKGROUND — cream minimal + leaves + glow + sparkle]. TEXT OVERLAY: [Full Thai layout — title + subtitle + 4 cards + 4 icons + bottom banner]. [LIGHTING + COLOR]. [NEGATIVE]."

CORE STYLE (ใส่ทุกครั้ง):
"${PHOTO_PROMPT_CORE}"

🎨 AESTHETIC (บังคับ — Korean luxury wellness branding):
- Palette: soft green #84cc16/#a7f3d0/#16a34a + cream #fef7e0 + white + soft gold #d4a574 (ห้ามใช้ amber/red/neon เด่นๆ)
- Mood: minimal, clean, premium, modern, sparkle, glossy
- Background: cream-white minimal + scattered soft green leaves at corners + light golden glow + small sparkle particles
- Composition: **symmetrical** — สัตว์อยู่กลางเป๊ะ

HERO SCENE (center, ~25% ของรูป):
- ตรงกลาง: a fluffy Golden Retriever (left) and a cream long-haired cat (right) sitting side-by-side, facing camera, sweet expression
- ข้างหน้าสัตว์: premium pastel-green food bowl with kibble, surrounded by fresh raw ingredients fanned out symmetrically — salmon fillet, fresh blueberries, sliced carrot, raw lean meat cube
- soft depth of field on ingredients, pets in clean focus, glossy editorial lighting

TEXT OVERLAY rules (✨ บังคับ — ต้องครบ 6 ส่วน):

(1) HEADER (top center, large):
"Large bold rounded Thai display text reading '[hook ภาษาไทย เต็ม]' in dark forest green with subtle white outline and soft drop-shadow. Perfectly spelled. Magazine-quality modern typography."

(2) SUBHEADER (right below header, medium):
"Medium soft-gold Thai text reading '[1 ประโยคขยาย hook ~10-15 คำ]'. Perfectly spelled."

(3) 4 GLASSMORPHISM CARDS (middle, 2×2 grid OR vertical stack — สลับสี):
"Four glassmorphism rounded-corner cards with semi-transparent backgrounds and soft shadows:
- Card 1 (soft green #a7f3d0 tint): Bold gold number '1' + Thai title '[หัวข้อย่อย 1]' + English subtitle '([English term])' + Thai body '[detail ~15-25 คำ]' + small tag 'Keyword: [keyword]'.
- Card 2 (soft blue #bae6fd tint): Bold gold number '2' + Thai title '[หัวข้อย่อย 2]' + English subtitle + Thai body + 'Keyword: ...'.
- Card 3 (soft green): Same structure.
- Card 4 (soft blue): Same structure.
ALL Thai text perfectly spelled, modern rounded sans-serif, professional spacing."

(4) 4 PREMIUM ICONS ROW (below cards, ~10%):
"Row of 4 glossy minimalist premium icons (gold-outlined, white interior) each above one short Thai label: '[label 1]', '[label 2]', '[label 3]', '[label 4]'. Even spacing, symmetrical."

(5) BOTTOM BANNER (very bottom, ~10%):
"Bottom banner with soft green-to-gold gradient #16a34a → #d4a574, bold white rounded Thai text reading '[CTA phrase ~10-15 คำ]'. Perfectly spelled."

(6) อย่าใส่: brand logos, watermarks, hashtags, URL, real human face

NEGATIVE constraints (ใส่ทุกครั้ง):
"Vertical 4:5. NOT cartoon, NOT illustration, NOT 3D render, NOT digital art. Photographic realism for pets and ingredients. NO brand logos, NO watermarks, NO real human face. ALL Thai text perfectly spelled with correct vowel marks (สระ) and tone marks (วรรณยุกต์)."

ตัวอย่างที่ดี (Korean premium wellness — สำหรับหัวข้อ 'เทรนด์อาหารสัตว์ 2026'):
"${PHOTO_PROMPT_CORE}
Symmetrical center composition: a fluffy cream Golden Retriever and a fluffy cream long-haired cat sitting side-by-side facing camera, in front of a pastel-green premium ceramic pet food bowl filled with high-quality kibble. Fresh raw ingredients fanned out symmetrically around the bowl: salmon fillet, fresh blueberries, sliced carrots, lean meat cubes. Cream-white minimal background with scattered soft green leaves in the corners, light golden glow, small sparkle particles.

TEXT OVERLAY:
HEADER (top): Large bold rounded Thai display text in dark forest green with white outline and soft shadow reading 'Pet Food Trend 2026: สรุปเทรนด์อาหารสัตว์เลี้ยงที่คุณต้องรู้!'. Perfectly spelled.
SUBHEADER: Medium soft-gold Thai text reading 'เจาะลึก 4 นวัตกรรมเพื่อสุขภาพที่ยั่งยืนของลูกรัก'.
4 GLASSMORPHISM CARDS (2×2 grid in middle):
- Card 1 (soft-green tint): gold '1' + 'อาหารฟังก์ชันเพื่อสุขภาพ (Functional Pet Food)' + body 'เน้นอาหารที่ช่วยเสริมภูมิคุ้มกัน เช่น โปรไบโอติก พรีไบโอติก และโอเมก้า 3' + tag 'Keyword: Probiotics, Glucosamine'.
- Card 2 (soft-blue tint): gold '2' + 'โภชนาการเฉพาะ (Tailored Nutrition)' + 'อาหารเฉพาะช่วงวัย สายพันธุ์ และสุขภาพเฉพาะด้าน' + 'Keyword: Tailor-made Nutrition'.
- Card 3 (soft-green tint): gold '3' + 'ความยั่งยืน (Sustainability)' + 'ใช้วัตถุดิบจากธรรมชาติ โปรตีนทางเลือก และบรรจุภัณฑ์รักษ์โลก' + 'Keyword: Plant-based, Insect Protein'.
- Card 4 (soft-blue tint): gold '4' + 'อาหารเกรดพรีเมียม/สดใหม่ (Premiumization)' + 'อาหารสด คุณภาพระดับ human grade' + 'Keyword: Fresh Food, Human Grade'.
4 PREMIUM ICON ROW (below cards): gold-outlined glossy icons — shield (label 'เสริมภูมิคุ้มกัน'), target (label 'โภชนาการตรงจุด'), leaf (label 'ใส่ใจโลก'), crown (label 'คุณภาพระดับพรีเมียม').
BOTTOM BANNER: soft green-to-gold gradient with bold white rounded Thai text 'ให้ลูกรักก้าวทันเทรนด์สุขภาพไปด้วยกัน!'.
All Thai text perfectly spelled with correct vowels and tones, modern rounded sans-serif typography, magazine-quality layout, symmetrical spacing.

Soft green + cream + white + soft gold palette. Luxury Korean wellness branding lighting — clean, glossy, premium editorial.
Vertical 4:5. Photographic realism. NOT cartoon, NOT illustration, NOT 3D render. NO brand logos. ALL Thai text perfectly spelled."

ตัวอย่างที่ไม่ดี:
"...amber red neon..." (ผิด! ผิด palette — ห้าม amber/red, ต้อง green/cream/gold)
"...3 cards..." (ผิด! ต้อง 4 cards)
"Just a dog at the bottom" (ผิด! สัตว์ต้องอยู่ "center" symmetrical + ต้องมีชามอาหาร + วัตถุดิบ)
"...no icon row..." (ผิด! ต้องมี 4 premium icon row ระหว่าง cards กับ bottom banner)`;

  const userMsg = `หัวข้อ: "${topic}"
${isGuru ? '' : fwHint}

🎨 Post Style ที่เลือก: ${styleKey.toUpperCase()}

${styleTemplate}

⚙️ Rules:
${isGuru
  ? `- ทำตาม template คุรุเทพข้างบนเป๊ะ — caption ต้องมีครบทั้ง 10 section ตามลำดับ: hook → bridge → title list → 1️⃣2️⃣3️⃣ list → closing → 🔥 engagement CTA → "." → 🔮 soft promo อาจารย์หนึ่ง + การ์ดศักดิ์สิทธิ์ + 📌 @317biusr → "." → hashtags
- น้ำเสียง "ครับ" (อาจารย์หนึ่งเป็นผู้ชาย) emoji เยอะ empowering สายมู
- ห้ามใช้คำสร้างความกลัวรุนแรง ห้ามสัญญาผล 100%
- hashtags: ${guruHashtagRule}`
  : `- ทำตาม style ข้างบนเป๊ะ — โดยเฉพาะถ้าเป็น promo ต้องมีโครงสร้าง ✅ bullets + 🗓️ schedule + 💬 contact info ครบ
- caption ใส่ทุก section ตาม template (รวม FB Page, Tel, Line ถ้าเป็น promo)
- 🚫 **ห้ามใส่ # / hashtag ใดๆ ใน caption** — hashtag ทั้งหมดต้องอยู่ใน "hashtags" array เท่านั้น (frontend จะ append ให้ตอนโพส)
- hashtags 4-6 ตัว ${bizHashtagRule}
- hook สั้น คม จี้ pain หรือ desire (ถ้า promo ใช้ 🔥 emoji นำ)`}

ตอบเป็น JSON object เท่านั้น:
{
  "hook_options": ["พาดหัว 1","พาดหัว 2","พาดหัว 3"],
  "hook": "พาดหัวที่ดีที่สุด (1 บรรทัด)",
  "caption": "${isGuru ? 'caption เริ่มจาก bridge (insight) — ห้ามขึ้นต้นด้วย hook ซ้ำ; ต่อด้วย list 1️⃣2️⃣3️⃣ → closing → 🔥 engagement CTA → "." → 🔮 soft promo อาจารย์หนึ่ง+@317biusr → "." → hashtags. ความยาว 120-220 คำ' : 'เนื้อหา BODY เริ่มจาก bullets/content ทันที — promo 150-250 คำ มีทุก section + footer FB/Tel/Line, educational/tip 60-120 คำ'}",
  "hashtags": ["#...","#..."],
  "image_prompt": "...",
  "post_style": "${styleKey}"
}

⚠️ CRITICAL: caption ห้ามมี hook ซ้ำ — frontend แสดง hook + caption แยกกัน ถ้า caption ขึ้นต้นด้วย hook จะเห็นซ้ำ

${isGuru ? guruImageRules : (course === 'PFB' ? pfbImageRules : (course === 'PHE' ? pheImageRules : bizImageRules))}`;

  try {
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 3500 });
    const obj = extractJsonObject(text);
    if (!obj) throw new Error('AI ไม่สามารถสร้าง JSON ที่ถูกต้องได้');

    // 🧹 Strip stray hashtags from caption for biz path — guru template wants hashtags
    // in the caption (last of its 10 sections), but PFB/PHE want them in the array only
    // so frontend doesn't render them twice.
    if (!isGuru && typeof obj.caption === 'string') {
      obj.caption = stripTrailingHashtags(obj.caption);
    }

    let image = null;
    if (generateImage && obj.image_prompt) {
      try { image = await generateImageOpenRouter(obj.image_prompt); }
      catch (e) { image = { error: e.message, prompt: obj.image_prompt }; }
    }

    res.json({ ...obj, image });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 🆕 Async image generation — สร้าง job ใน DB + trigger Edge Function (กัน Vercel 60s timeout)
// Body: { prompt, model? } → Response: { ok, job_id, status: 'pending' }
router.post('/image-async', async (req, res) => {
  const { prompt, model } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  if (!supabase) return res.status(400).json({ error: 'Supabase required for async mode' });

  try {
    // 1. สร้าง job row
    const { data: job, error } = await supabase
      .from('image_jobs')
      .insert({
        prompt: String(prompt).slice(0, 8000),
        model: model || OPENROUTER_IMAGE_MODEL,
        status: 'pending',
        tenant_id: currentTenantId(),
      })
      .select('id,prompt,model,status,created_at')
      .single();
    if (error) throw new Error(error.message);

    // 2. Fire-and-forget trigger worker (ไม่ await — กลับมาตอบ user ทันที)
    // Prefer Render worker (no wall-clock limit, handles GPT-5.4 > 150s) over
    // Supabase Edge Function (150s free tier limit — kills mid-generation).
    const workerSecret = process.env.WORKER_SECRET;
    const renderUrl = process.env.RENDER_WORKER_URL;
    const edgeUrl = process.env.SUPABASE_EDGE_URL;
    const workerUrl = renderUrl || edgeUrl;
    const workerName = renderUrl ? 'render' : 'supabase-edge';

    if (workerUrl && workerSecret) {
      fetch(workerUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${workerSecret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id }),
      })
        .then(() => console.log(`[image-async] triggered ${workerName} for job ${job.id}`))
        .catch(e => console.warn(`[image-async] trigger ${workerName} failed:`, e.message));
    } else {
      console.warn('[image-async] no worker URL set (RENDER_WORKER_URL or SUPABASE_EDGE_URL) — job will stay pending');
    }

    res.json({ ok: true, job_id: job.id, status: 'pending', poll_url: `/api/ai/image-status?id=${job.id}` });
  } catch (e) {
    console.error('[image-async]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🔍 Poll status ของ image job
// 👥 Latest image job — shared activity feed for everyone viewing /admin
// Returns the newest job in last 10 min (any status). Frontend polls this
// every 5s so all browsers see the same "ทีมกำลัง gen" / latest result.
// Light response (no image_base64 to keep payload small).
// 🐕 Lazy watchdog — job ที่ค้าง pending/processing เกิน 6 นาที = worker ตาย/timeout
// แก้ตอน read: mark failed + คืนค่า failed (กัน UI หมุนค้างตลอด)
const STALE_JOB_MS = 6 * 60_000;
async function lazyWatchdog(job) {
  if (!job || (job.status !== 'pending' && job.status !== 'processing')) return job;
  const lastTouch = new Date(job.updated_at || job.created_at).getTime();
  if (Date.now() - lastTouch < STALE_JOB_MS) return job;
  // stuck → mark failed
  const errMsg = `⏱️ Job ค้างเกิน 6 นาที — worker timeout/ตาย (auto-failed by watchdog)`;
  try {
    await supabase.from('image_jobs')
      .update({ status: 'failed', error: errMsg, updated_at: new Date().toISOString() })
      .eq('id', job.id);
  } catch (e) { console.warn('[watchdog] update failed:', e.message); }
  return { ...job, status: 'failed', error: errMsg };
}

router.get('/latest-job', async (req, res) => {
  if (!supabase) return res.status(400).json({ error: 'Supabase required' });
  try {
    const { data, error } = await supabase
      .from('image_jobs')
      .select('id,status,model,provider,error,created_at,updated_at,completed_at,image_url')
      .eq('tenant_id', currentTenantId())
      .gte('created_at', new Date(Date.now() - 30 * 60_000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return res.json({ job: null });

    const job = await lazyWatchdog(data);
    const elapsed_ms = job.completed_at
      ? new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()
      : Date.now() - new Date(job.created_at).getTime();

    res.json({ job: { ...job, elapsed_ms } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/image-status', async (req, res) => {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: 'id required' });
  if (!supabase) return res.status(400).json({ error: 'Supabase required' });
  try {
    const { data, error } = await supabase
      .from('image_jobs')
      .select('id,status,image_base64,image_url,error,model,provider,created_at,updated_at,completed_at')
      .eq('id', id)
      .eq('tenant_id', currentTenantId())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'job not found' });

    // 🐕 lazy watchdog — job ค้าง >6 นาที → mark failed
    const job = await lazyWatchdog(data);
    const elapsed_ms = job.completed_at
      ? new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()
      : Date.now() - new Date(job.created_at).getTime();

    res.json({ ...job, elapsed_ms });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 🔄 Retry trigger — กรณี edge function หลุดหรือ stuck pending
router.post('/image-retrigger', async (req, res) => {
  const { job_id } = req.body || {};
  if (!job_id) return res.status(400).json({ error: 'job_id required' });
  const edgeUrl = process.env.SUPABASE_EDGE_URL;
  const workerSecret = process.env.WORKER_SECRET;
  if (!edgeUrl || !workerSecret) return res.status(400).json({ error: 'SUPABASE_EDGE_URL/WORKER_SECRET not set' });

  // Reset to pending so Edge Function reprocesses
  if (supabase) {
    await supabase.from('image_jobs').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', job_id).eq('tenant_id', currentTenantId());
  }

  try {
    const r = await fetch(edgeUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${workerSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: Number(job_id) }),
    });
    const d = await r.json().catch(() => ({}));
    res.json({ ok: r.ok, status: r.status, edge_response: d });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 🎭 Lip-sync clip jobs — fal.ai SadTalker/Hallo (mascot face + audio → talking video)
// Pattern เดียวกับ image-async: Vercel สร้าง job → worker-render call fal.ai → save video_url
// POST /api/ai/lipsync-clip-async — body: { image_url, audio_url, model?, scene_idx?, reel_session_id?, duration_sec? }
router.post('/lipsync-clip-async', async (req, res) => {
  const { image_url, audio_url, model, scene_idx, reel_session_id, duration_sec } = req.body || {};
  if (!image_url) return res.status(400).json({ error: 'image_url required (public URL)' });
  if (!audio_url) return res.status(400).json({ error: 'audio_url required (public URL)' });
  if (!supabase) return res.status(400).json({ error: 'Supabase required for async mode' });

  try {
    const { data: job, error } = await supabase
      .from('lipsync_clip_jobs')
      .insert({
        image_url: String(image_url).slice(0, 2000),
        audio_url: String(audio_url).slice(0, 2000),
        model: model || process.env.FAL_LIPSYNC_MODEL || 'fal-ai/infinitalk',
        scene_idx: scene_idx ?? null,
        reel_session_id: reel_session_id || null,
        duration_sec: duration_sec || null,
        status: 'pending',
        tenant_id: currentTenantId(),
      })
      .select('id,model,status,created_at')
      .single();
    if (error) throw new Error(error.message);

    // Fire-and-forget trigger — Vercel ไม่ wait worker (timeout 60s; fal.ai SadTalker ใช้ 90-180s)
    const workerSecret = process.env.WORKER_SECRET;
    const renderUrl = process.env.RENDER_WORKER_URL;
    if (renderUrl && workerSecret) {
      // worker-render มี endpoint แยกสำหรับ lipsync (path เปลี่ยน /process-image-job → /process-lipsync-clip-job)
      const lipsyncWorkerUrl = renderUrl.replace(/\/process-image-job\b.*$/, '/process-lipsync-clip-job');
      fetch(lipsyncWorkerUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${workerSecret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id }),
      })
        .then(() => console.log(`[lipsync-async] triggered worker for job ${job.id}`))
        .catch(e => console.warn(`[lipsync-async] trigger failed:`, e.message));
    } else {
      console.warn('[lipsync-async] RENDER_WORKER_URL/WORKER_SECRET not set — job will stay pending');
    }

    res.json({ ok: true, job_id: job.id, status: 'pending', poll_url: `/api/ai/lipsync-clip-status?id=${job.id}` });
  } catch (e) {
    console.error('[lipsync-async]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ai/lipsync-clip-status?id=
router.get('/lipsync-clip-status', async (req, res) => {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: 'id required' });
  if (!supabase) return res.status(400).json({ error: 'Supabase required' });
  try {
    const { data, error } = await supabase
      .from('lipsync_clip_jobs')
      .select('id,status,model,provider,error,video_url,scene_idx,reel_session_id,created_at,updated_at,completed_at')
      .eq('id', id)
      .eq('tenant_id', currentTenantId())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'job not found' });
    const elapsed_ms = data.completed_at
      ? new Date(data.completed_at).getTime() - new Date(data.created_at).getTime()
      : Date.now() - new Date(data.created_at).getTime();
    res.json({ ...data, elapsed_ms });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ai/lipsync-clip-retrigger — reset stuck job + re-fire worker
router.post('/lipsync-clip-retrigger', async (req, res) => {
  const { job_id } = req.body || {};
  if (!job_id) return res.status(400).json({ error: 'job_id required' });
  const renderUrl = process.env.RENDER_WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;
  if (!renderUrl || !workerSecret) return res.status(400).json({ error: 'RENDER_WORKER_URL/WORKER_SECRET not set' });
  if (supabase) {
    await supabase.from('lipsync_clip_jobs').update({ status: 'pending', error: null, updated_at: new Date().toISOString() }).eq('id', job_id).eq('tenant_id', currentTenantId());
  }
  try {
    const lipsyncUrl = renderUrl.replace(/\/process-image-job\b.*$/, '/process-lipsync-clip-job');
    const r = await fetch(lipsyncUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${workerSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: Number(job_id) }),
    });
    const d = await r.json().catch(() => ({}));
    res.json({ ok: r.ok, status: r.status, worker_response: d });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Legacy sync endpoint (จะ timeout บน Vercel ถ้าใช้ GPT-5.4 — ใช้ /image-async แทน)
router.post('/image', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  // 🛑 Block sync path สำหรับ GPT-5.4 — จะ timeout บน Vercel 60s แน่นอน
  // ตั้ง ALLOW_SYNC_GPT5=1 ถ้าจะลอง local dev (ไม่มี Vercel timeout)
  if (/gpt-5\.4-image/i.test(OPENROUTER_IMAGE_MODEL) && process.env.ALLOW_SYNC_GPT5 !== '1') {
    return res.status(409).json({
      error: 'GPT-5.4 ใช้ sync endpoint ไม่ได้ — เกิน Vercel 60s timeout',
      hint: 'เรียก POST /api/ai/image-async แทน แล้ว poll GET /api/ai/image-status?id=<job_id>',
      model: OPENROUTER_IMAGE_MODEL,
    });
  }

  const t0 = Date.now();
  try {
    const result = await generateImageOpenRouter(prompt);
    const elapsed = Date.now() - t0;
    const size_kb = result.image_base64 ? Math.round(result.image_base64.length * 0.75 / 1024) : 0;
    console.log(`[ai/image] ✅ done total=${elapsed}ms size=${size_kb}KB ${result.attempt || ''}`);
    res.json({ ...result, _elapsed_ms: elapsed, _size_kb: size_kb });
  } catch (e) {
    console.error('[ai/image]', e.message);
    res.status(500).json({ error: e.message, prompt, model: OPENROUTER_IMAGE_MODEL });
  }
});

// 🖼️ POST /ai/gen-image — sync image generation via OpenRouter (OPENROUTER_API_KEY).
// GPT and Gemini are different models — provider picks which one.
// body: { prompt, provider: 'gpt' | 'gemini' } → { ok, provider, model, image_base64 }
router.post('/gen-image', async (req, res) => {
  const { prompt, provider = 'gemini' } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'prompt required' });
  // GPT vs Gemini — different models, both generated through OpenRouter
  // models that oem-content-factory uses (valid OpenRouter image models)
  const model = provider === 'gpt'
    ? (process.env.GPT_IMAGE_MODEL || 'openai/gpt-5.4-image-2')
    : (process.env.GEMINI_IMAGE_MODEL || 'google/gemini-3.1-flash-image-preview');
  try {
    const result = await tryOpenRouterImageGen(String(prompt), model, 'standard');
    if (!result.ok || !result.url) throw new Error(result.error || 'no image returned');
    const out = parseImageUrlToReturn(result.url, model);
    res.json({ ok: true, provider, model, image_base64: out.image_base64 || null, image_url: out.image_url || null });
  } catch (e) {
    console.error('[ai/gen-image]', provider, e.message);
    res.status(500).json({ error: e.message, provider });
  }
});

// ⭐ Google AI Studio Direct — ใช้สำหรับ gemini-*-image ที่ Google ตรงๆ (Thai text สวยกว่า OpenRouter preview)
async function generateImageGoogleDirect(prompt, modelOverride) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set — add ใน .env');

  // map model id: google/gemini-2.5-flash-image-preview → gemini-2.5-flash-image-preview
  const fullId = modelOverride || OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image-preview';
  const model = fullId.replace(/^google\//, '');

  const t0 = Date.now();
  console.log(`[ai/image] → google-direct ${model} (prompt ${prompt.slice(0, 60)}...)`);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('google timeout 50s'), 50_000);
  let r;
  try {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    });
  } catch (e) {
    clearTimeout(timer);
    console.error(`[ai/image] ✗ google ${model} after ${Date.now()-t0}ms: ${e.message}`);
    throw new Error(`google image fetch failed: ${e.message}`);
  }
  clearTimeout(timer);
  console.log(`[ai/image] ← google-direct ${model} status=${r.status} took=${Date.now()-t0}ms`);

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Google AI ${r.status}: ${err.slice(0, 300)}`);
  }
  const data = await r.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part?.inlineData?.data) {
      return {
        provider: 'google',
        model,
        prompt,
        image_base64: part.inlineData.data,
        image_url: null,
      };
    }
  }
  console.error(`[ai/image] ⚠️ google ${model} no image. raw=${JSON.stringify(data).slice(0, 800)}`);
  return { provider: 'google', model, prompt, error: 'no image in Google response', raw_keys: Object.keys(data || {}) };
}

// ⭐ NEW: OpenAI direct API — ใช้สำหรับ gpt-image-1 / dall-e ที่ OpenRouter proxy ไม่ครบ
async function generateImageOpenAIDirect(prompt, modelOverride) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set — เพิ่ม OPENAI_API_KEY ใน .env เพื่อใช้โมเดล GPT');

  // map model id: openai/gpt-image-1 → gpt-image-1
  const model = (modelOverride || OPENROUTER_IMAGE_MODEL || '').replace(/^openai\//, '') || 'gpt-image-1';
  const isGptImage = /gpt-image/i.test(model);
  const sizeMap = {
    '1024x1024': '1024x1024',
    '1024x1536': '1024x1536',
    '1536x1024': '1536x1024',
  };
  const size = sizeMap[OPENROUTER_IMAGE_SIZE] || '1024x1024';

  const body = {
    model,
    prompt,
    size,
    n: 1,
  };
  // gpt-image-1 รองรับ quality: low/medium/high — dall-e-3 รองรับ standard/hd
  if (isGptImage) {
    body.quality = OPENROUTER_IMAGE_QUALITY || 'medium';
  } else if (/dall-e-3/i.test(model)) {
    body.quality = OPENROUTER_IMAGE_QUALITY === 'high' ? 'hd' : 'standard';
  }

  const t0 = Date.now();
  console.log(`[ai/image] → openai-direct ${model} ${size} quality=${body.quality || 'default'} (prompt ${prompt.slice(0, 60)}...)`);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('openai timeout 50s'), 50_000);
  let r;
  try {
    r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    clearTimeout(timer);
    console.error(`[ai/image] ✗ openai ${model} after ${Date.now()-t0}ms: ${e.message}`);
    throw new Error(`openai image fetch failed: ${e.message}`);
  }
  clearTimeout(timer);
  console.log(`[ai/image] ← openai-direct ${model} status=${r.status} took=${Date.now()-t0}ms`);

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`OpenAI ${r.status}: ${err.slice(0, 300)}`);
  }
  const data = await r.json();
  const item = data?.data?.[0] || {};
  if (item.b64_json) {
    return { provider: 'openai', model, prompt, image_base64: item.b64_json, image_url: null };
  }
  if (item.url) {
    return { provider: 'openai', model, prompt, image_url: item.url, image_base64: null };
  }
  console.error(`[ai/image] ⚠️ openai ${model} no image. raw=${JSON.stringify(data).slice(0, 800)}`);
  return { provider: 'openai', model, prompt, error: 'no image in OpenAI response', raw: data };
}

// ===== MODEL METADATA — รู้ล่วงหน้าว่า model ไหนรองรับอะไร, ราคา, format ที่ work =====
const MODEL_METADATA = {
  'openai/gpt-5.4-image-2': {
    label: 'GPT-5.4 Image 2',
    via: 'openrouter',
    cost_per_image_usd: 0.98,           // OpenRouter pre-charges 65,536 tokens × $0.000015
    pre_charge_tokens: 65536,
    supported_formats: ['standard'],     // tested: response_format=402, tools=404
    quality_thai_text: 90,
    notes: 'OpenRouter pre-charges full token budget; ต้อง credit ≥ $1',
  },
  'google/gemini-3.1-flash-image-preview': {
    label: 'Gemini 3.1 Flash Image',
    via: 'openrouter',
    cost_per_image_usd: 0.04,
    pre_charge_tokens: 4096,
    supported_formats: ['standard'],
    quality_thai_text: 50,
    notes: 'ราคาถูก เร็ว — Thai text เพี้ยน',
  },
  'google/gemini-2.5-flash-image': {
    label: 'Gemini 2.5 Flash Image',
    via: 'google_direct',
    cost_per_image_usd: 0.039,
    quality_thai_text: 70,
  },
  'openai/gpt-image-1': {
    label: 'GPT Image 1',
    via: 'openai_direct',
    cost_per_image_usd: 0.04,
    quality_thai_text: 95,
  },
  'openai/dall-e-3': {
    label: 'DALL-E 3',
    via: 'openai_direct',
    cost_per_image_usd: 0.04,
    quality_thai_text: 60,
  },
};

const FALLBACK_MODEL = 'google/gemini-3.1-flash-image-preview';

function getModelMeta(model) {
  return MODEL_METADATA[model] || {
    label: model,
    via: 'openrouter',
    supported_formats: ['standard', 'response_format', 'tools'],
    cost_per_image_usd: null,
    quality_thai_text: null,
  };
}

// ===== Pre-flight credit check (OpenRouter) =====
let creditCache = { value: null, ts: 0 };
async function checkOpenRouterCredit(force = false) {
  // cache 10 วินาที — สั้นลงเพื่อ accuracy
  const age = Date.now() - creditCache.ts;
  if (!force && creditCache.value && age < 10_000) return creditCache.value;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const r = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const total = d?.data?.total_credits || 0;
    const usage = d?.data?.total_usage || 0;
    const remaining = total - usage;
    creditCache = {
      value: { total, usage, remaining, currency: 'USD', fetched_at: new Date().toISOString() },
      ts: Date.now(),
    };
    return creditCache.value;
  } catch (e) {
    console.warn('[credit-check]', e.message);
    return null;
  }
}

// ===== Enhanced response parser — ลอง 7 ที่ในการหา image =====
function extractImageFromOpenRouterResponse(data) {
  const message = data?.choices?.[0]?.message;
  if (!message) return null;

  // (1) Standard: message.images[] — Gemini-style
  const images = message.images || [];
  if (images[0]) {
    const url = images[0]?.image_url?.url || images[0]?.url;
    if (url) return { url, source: 'message.images[0]' };
  }

  // (2) message.content เป็น array of parts (multimodal)
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part?.type === 'image_url' && part?.image_url?.url) return { url: part.image_url.url, source: 'message.content[].image_url' };
      if (part?.type === 'image' && part?.source?.data) return { url: `data:${part.source.media_type || 'image/png'};base64,${part.source.data}`, source: 'message.content[].image.source' };
      if (part?.image_url) return { url: typeof part.image_url === 'string' ? part.image_url : part.image_url.url, source: 'message.content[].image_url(loose)' };
      if (part?.b64_json) return { url: `data:image/png;base64,${part.b64_json}`, source: 'message.content[].b64_json' };
    }
  }

  // (3) message.content เป็น string ที่เป็น data URL หรือ http URL
  if (typeof message.content === 'string') {
    if (message.content.startsWith('data:image')) return { url: message.content, source: 'message.content(data-url)' };
    const urlMatch = message.content.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)(\?\S*)?/i);
    if (urlMatch) return { url: urlMatch[0], source: 'message.content(extracted-url)' };
  }

  // (4) tool_calls → image_generation result
  const toolCalls = message.tool_calls || [];
  for (const tc of toolCalls) {
    const args = tc?.function?.arguments;
    if (typeof args === 'string') {
      try {
        const parsed = JSON.parse(args);
        if (parsed.image_url) return { url: parsed.image_url, source: 'tool_calls[].arguments.image_url' };
        if (parsed.image_base64) return { url: `data:image/png;base64,${parsed.image_base64}`, source: 'tool_calls[].arguments.image_base64' };
      } catch {}
    }
  }

  // (5) message.attachments[]
  const attachments = message.attachments || [];
  for (const att of attachments) {
    if (att?.image_url) return { url: att.image_url, source: 'message.attachments[].image_url' };
    if (att?.url && /image/i.test(att.type || '')) return { url: att.url, source: 'message.attachments[].url' };
  }

  // (6) data.images[] — top-level
  if (Array.isArray(data.images) && data.images[0]) {
    const url = data.images[0]?.url || data.images[0]?.image_url?.url || data.images[0]?.b64_json;
    if (url) return { url: url.startsWith('data:') || url.startsWith('http') ? url : `data:image/png;base64,${url}`, source: 'data.images[0]' };
  }

  // (7) data.choices[].message.refusal — model ปฏิเสธ
  if (message.refusal) return { error: 'model_refused', refusal: message.refusal };

  return null;
}

// ===== ลองเรียก OpenRouter ด้วย format ต่างๆ — สำหรับ model ที่ไม่ standard =====
async function tryOpenRouterImageGen(prompt, model, requestFormat = 'standard') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.PUBLIC_URL || 'https://oem-content-factory.vercel.app',
    'X-Title': 'OEM Content Factory',
  };

  const qualityHint = OPENROUTER_IMAGE_QUALITY === 'high' ? ' Maximum quality, photorealistic detail.' : '';
  const aspectHint = OPENROUTER_IMAGE_SIZE === '1024x1536' ? 'portrait 2:3'
                  : OPENROUTER_IMAGE_SIZE === '1536x1024' ? 'landscape 3:2'
                  : 'square 1:1';
  const fullPrompt = `Create a high-quality image: ${prompt}.

Style: warm, professional. Aspect: ${aspectHint}.${qualityHint}`;

  // ลอง 3 format — ใส่ max_tokens limit เพื่อไม่ให้กิน credit เกิน (gpt-5.4-image-2 default 65k tokens)
  const MAX_TOKENS = 16384;  // ~$0.25/รูป — พอสร้างภาพ + คำอธิบายสั้น
  let body;
  if (requestFormat === 'standard') {
    body = {
      model,
      messages: [{ role: 'user', content: fullPrompt }],
      modalities: ['image', 'text'],
      max_tokens: MAX_TOKENS,
    };
  } else if (requestFormat === 'response_format') {
    body = {
      model,
      messages: [{ role: 'user', content: fullPrompt }],
      response_format: { type: 'image' },
      max_tokens: MAX_TOKENS,
    };
  } else if (requestFormat === 'tools') {
    body = {
      model,
      messages: [{ role: 'user', content: fullPrompt }],
      tools: [{ type: 'image_generation' }],
      tool_choice: 'auto',
      max_tokens: MAX_TOKENS,
    };
  }

  const t0 = Date.now();
  console.log(`[ai/image] → ${model} (${requestFormat} format)`);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout 45s'), 45_000);
  let r;
  try {
    r = await fetch(OPENROUTER_API, { method: 'POST', signal: ctrl.signal, headers, body: JSON.stringify(body) });
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: `fetch failed: ${e.message}`, took: Date.now() - t0 };
  }
  clearTimeout(timer);
  const took = Date.now() - t0;

  if (!r.ok) {
    const err = await r.text();
    console.log(`[ai/image] ✗ ${model} (${requestFormat}) status=${r.status} took=${took}ms — ${err.slice(0, 150)}`);
    return { ok: false, error: `${r.status}: ${err.slice(0, 200)}`, took };
  }

  let data;
  try { data = await r.json(); }
  catch (e) { return { ok: false, error: `parse json: ${e.message}`, took }; }

  const found = extractImageFromOpenRouterResponse(data);
  console.log(`[ai/image] ← ${model} (${requestFormat}) status=200 took=${took}ms — image: ${found?.url ? '✅ ' + found.source : '❌ none'}`);

  if (found?.url) return { ok: true, url: found.url, source: found.source, took, raw_response_keys: Object.keys(data) };
  if (found?.error === 'model_refused') return { ok: false, error: `model refused: ${found.refusal}`, took };

  return {
    ok: false,
    error: 'no image in response',
    content_preview: typeof data?.choices?.[0]?.message?.content === 'string' ? data.choices[0].message.content.slice(0, 300) : 'non-string',
    response_keys: Object.keys(data || {}),
    took,
  };
}

async function generateImageOpenRouter(prompt) {
  const model = OPENROUTER_IMAGE_MODEL;
  const forceProvider = (process.env.IMAGE_PROVIDER || 'auto').toLowerCase();

  // ⭐ Auto-route → direct providers (ดีกว่า OpenRouter proxy)
  if (forceProvider !== 'openrouter') {
    if (process.env.OPENAI_API_KEY && /^openai\/(gpt-image|dall-e)/i.test(model)) {
      return generateImageOpenAIDirect(prompt);
    }
    if (process.env.GOOGLE_AI_API_KEY && /^google\/(gemini.*image|imagen)/i.test(model)) {
      const googleResult = await generateImageGoogleDirect(prompt).catch(e => ({ error: e.message }));
      // ถ้า Google 429 quota → fall through ไป OpenRouter Gemini แทน (chain fallback)
      if (googleResult?.error && /429|quota|exceeded/i.test(googleResult.error)) {
        console.warn('[ai/image] 🔄 Google direct quota exceeded → fallback chain → OpenRouter');
        // ไม่ return — ให้ flow ทำงานต่อไปยัง OpenRouter path
      } else {
        return googleResult;
      }
    }
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      provider: 'none',
      prompt,
      instructions: 'ตั้ง OPENROUTER_API_KEY ใน env เพื่อใช้ image generation — ตอนนี้ใช้ placeholder',
      placeholder_url: `https://placehold.co/1024x1024/0ea5e9/fff/png?text=${encodeURIComponent('AI Image Placeholder')}`
    };
  }

  // ===== Smart routing strategy =====
  const primaryModel = OPENROUTER_IMAGE_MODEL;
  const meta = getModelMeta(primaryModel);
  const isFallback = primaryModel === FALLBACK_MODEL;
  // 🚫 ปิด auto-fallback ไป Gemini ถ้าตั้ง TIKTOK_DISABLE_FALLBACK=1 หรือ IMAGE_DISABLE_FALLBACK=1
  const noFallback = process.env.IMAGE_DISABLE_FALLBACK === '1' || process.env.TIKTOK_DISABLE_FALLBACK === '1';

  // 🧠 Pre-flight credit check — ถ้า model แพง + credit ไม่พอ → ข้ามไป fallback ทันที (เว้นถ้าปิด fallback)
  if (meta.cost_per_image_usd && meta.cost_per_image_usd > 0.10) {
    const credit = await checkOpenRouterCredit(true);
    if (credit && credit.remaining < meta.cost_per_image_usd) {
      const msg = `${primaryModel} ต้องการ $${meta.cost_per_image_usd} แต่มี $${credit.remaining.toFixed(3)} เหลือ`;
      console.warn(`[ai/image] ⚠️ ${msg}`);
      if (noFallback) {
        return { provider: 'openrouter', model: primaryModel, prompt, error: `Insufficient credit — ${msg}. เติม credit ที่ https://openrouter.ai/credits` };
      }
      return await tryFallbackToGemini(prompt, primaryModel, `insufficient_credit (need $${meta.cost_per_image_usd}, have $${credit.remaining.toFixed(3)})`);
    }
    if (credit) {
      console.log(`[ai/image] ✅ credit check passed: $${credit.remaining.toFixed(3)} >= $${meta.cost_per_image_usd} — proceeding with ${primaryModel}`);
    }
  }

  // Try เฉพาะ formats ที่รู้ว่า work (จาก metadata) — ประหยัด credit จาก failed tries
  const formats = meta.supported_formats || ['standard'];
  let lastError = null;

  for (const fmt of formats) {
    try {
      const result = await tryOpenRouterImageGen(prompt, primaryModel, fmt);
      if (result.ok && result.url) {
        const out = parseImageUrlToReturn(result.url, primaryModel);
        out.attempt = `${primaryModel} (${fmt})`;
        out.cost_estimate_usd = meta.cost_per_image_usd;
        return out;
      }
      lastError = result.error;
      // ถ้า 402 (credit insufficient) → ไม่ต้องลอง format อื่น เพราะปัญหาเดียวกัน
      if (result.error?.startsWith('402')) {
        console.warn(`[ai/image] ⚠️ ${primaryModel} 402 credit insufficient — skip remaining formats`);
        if (noFallback || isFallback) {
          return { provider: 'openrouter', model: primaryModel, prompt, error: result.error, hint: 'เติม OpenRouter credit ที่ https://openrouter.ai/credits' };
        }
        return await tryFallbackToGemini(prompt, primaryModel, '402_credit_insufficient');
      }
    } catch (e) {
      console.warn(`[ai/image] format ${fmt} threw: ${e.message}`);
      lastError = e.message;
    }
  }

  // ถ้าปิด fallback → return error ทันที (ไม่ไป Gemini)
  if (noFallback) {
    return {
      provider: 'openrouter',
      model: primaryModel,
      prompt,
      error: `${primaryModel} ไม่คืนรูป — ${lastError || 'unknown'}`,
      hint: 'fallback ถูกปิด (IMAGE_DISABLE_FALLBACK=1). ลอง regenerate หรือเอา env var ออก',
    };
  }
  // Auto-fallback ไป Gemini ถ้า primary ไม่ใช่ Gemini อยู่แล้ว
  if (!isFallback) {
    return await tryFallbackToGemini(prompt, primaryModel, 'all_formats_no_image');
  }

  return {
    provider: 'openrouter',
    model: primaryModel,
    prompt,
    error: `${primaryModel} ไม่คืนรูป — ตรวจ terminal log สำหรับ raw response`,
  };
}

// ===== Fallback helper — ใช้ Gemini ที่รู้ว่า work =====
async function tryFallbackToGemini(prompt, originalModel, reason) {
  console.log(`[ai/image] 🔄 ${originalModel} → fallback ${FALLBACK_MODEL} (reason: ${reason})`);
  try {
    const fb = await tryOpenRouterImageGen(prompt, FALLBACK_MODEL, 'standard');
    if (fb.ok && fb.url) {
      const out = parseImageUrlToReturn(fb.url, FALLBACK_MODEL);
      out.attempt = `${FALLBACK_MODEL} (fallback from ${originalModel})`;
      out.fallback_from = originalModel;
      out.fallback_reason = reason;
      out.cost_estimate_usd = MODEL_METADATA[FALLBACK_MODEL]?.cost_per_image_usd || 0.04;
      return out;
    }
    // ทุก provider exhausted — return helpful message
    return buildExhaustedError(prompt, originalModel, reason, fb.error);
  } catch (e) {
    return buildExhaustedError(prompt, originalModel, reason, e.message);
  }
}

function buildExhaustedError(prompt, originalModel, originalReason, fallbackError) {
  const credit = creditCache.value;
  return {
    provider: 'exhausted',
    model: originalModel,
    prompt,
    error: '🆘 ALL providers exhausted — ทุก path ใช้งานไม่ได้',
    detail: {
      original_model: originalModel,
      original_failure: originalReason,
      fallback_model: FALLBACK_MODEL,
      fallback_failure: fallbackError,
      openrouter_credit_remaining_usd: credit?.remaining,
      google_ai_status: process.env.GOOGLE_AI_API_KEY ? 'set but quota exceeded' : 'not set',
      openai_status: process.env.OPENAI_API_KEY ? 'set' : 'not set',
    },
    suggestions: [
      '1️⃣ เติม OpenRouter credit: https://openrouter.ai/credits ($5 = 125 รูปด้วย Gemini)',
      '2️⃣ เปิด Google billing: https://console.cloud.google.com/billing ($5 = 130 รูป)',
      '3️⃣ สมัคร OpenAI: https://platform.openai.com/api-keys ($5 = 125 รูป gpt-image-1)',
      '4️⃣ Upload รูปจาก ChatGPT/Gemini.google.com ผ่านปุ่ม "📤 อัพโหลด" — ฟรี ใช้ที่อื่นได้',
    ],
  };
}

// ===== Helper: convert image URL/data-URL to return format =====
function parseImageUrlToReturn(url, model) {
  if (url.startsWith('data:')) {
    const b64 = url.split(',')[1];
    return { provider: 'openrouter', model, image_base64: b64, image_url: null };
  }
  return { provider: 'openrouter', model, image_url: url, image_base64: null };
}

// (legacy code removed — ใช้ tryOpenRouterImageGen + extractImageFromOpenRouterResponse แทน)

router.get('/templates', (req, res) => res.json({ templates: TEMPLATE_LIST }));

// 🔄 Runtime model switcher — override OPENROUTER_IMAGE_MODEL ใน memory
router.post('/set-image-model', (req, res) => {
  const { model } = req.body || {};
  if (!model) return res.status(400).json({ error: 'model required' });
  // valid pattern check
  if (!/^(openai|google|anthropic)\//.test(model)) {
    return res.status(400).json({ error: 'invalid model format — must start with openai/, google/, or anthropic/' });
  }
  process.env.OPENROUTER_IMAGE_MODEL = model;
  OPENROUTER_IMAGE_MODEL = model;  // update local cache
  creditCache = { value: null, ts: 0 };  // invalidate cache
  console.log(`[ai/image] 🔄 model switched to: ${model}`);
  res.json({ ok: true, model, hint: 'restart server เพื่อใช้ค่าจาก .env กลับ' });
});

// 💰 Credit balance — เช็ค OpenRouter remaining credit (cached 30s)
router.get('/credit-balance', async (req, res) => {
  const force = req.query.force === '1';
  try {
    const credit = await checkOpenRouterCredit(force);
    if (!credit) return res.json({ available: false, reason: 'OPENROUTER_API_KEY missing or fetch failed' });

    const currentModel = OPENROUTER_IMAGE_MODEL;
    const meta = getModelMeta(currentModel);
    const canAfford = !meta.cost_per_image_usd || credit.remaining >= meta.cost_per_image_usd;

    res.json({
      available: true,
      total_usd: credit.total,
      used_usd: credit.usage,
      remaining_usd: credit.remaining,
      remaining_thb: Math.round(credit.remaining * 36),
      current_model: currentModel,
      current_model_label: meta.label,
      cost_per_image_usd: meta.cost_per_image_usd,
      images_remaining_estimate: meta.cost_per_image_usd ? Math.floor(credit.remaining / meta.cost_per_image_usd) : null,
      can_afford_one_image: canAfford,
      warning: !canAfford ? `⚠️ credit ($${credit.remaining.toFixed(3)}) ไม่พอสำหรับ ${meta.label} (~$${meta.cost_per_image_usd}/รูป) — fallback to Gemini` : null,
      fetched_at: credit.fetched_at,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 📋 Image models metadata — ให้ frontend แสดงตัวเลือกพร้อมราคา
router.get('/image-models', (req, res) => {
  const models = Object.entries(MODEL_METADATA).map(([id, meta]) => ({
    id,
    label: meta.label,
    via: meta.via,
    cost_per_image_usd: meta.cost_per_image_usd,
    cost_per_image_thb: meta.cost_per_image_usd ? Math.round(meta.cost_per_image_usd * 36 * 100) / 100 : null,
    quality_thai_text: meta.quality_thai_text,
    notes: meta.notes,
    requires: meta.via === 'openai_direct' ? 'OPENAI_API_KEY'
            : meta.via === 'google_direct' ? 'GOOGLE_AI_API_KEY'
            : 'OPENROUTER_API_KEY',
    enabled_now: !!(
      (meta.via === 'openai_direct' && process.env.OPENAI_API_KEY) ||
      (meta.via === 'google_direct' && process.env.GOOGLE_AI_API_KEY) ||
      (meta.via === 'openrouter' && process.env.OPENROUTER_API_KEY)
    ),
  }));
  res.json({ current: OPENROUTER_IMAGE_MODEL, models });
});

// 🔍 List Google AI models ที่ key ของคุณใช้ได้ — ช่วย debug model name
router.get('/google-models', async (req, res) => {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'GOOGLE_AI_API_KEY not set' });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    const all = data.models || [];
    const imageModels = all.filter(m => {
      const name = (m.name || '').toLowerCase();
      const display = (m.displayName || '').toLowerCase();
      const desc = (m.description || '').toLowerCase();
      return /image/.test(name) || /image/.test(display) || /image/.test(desc) || /imagen/.test(name);
    }).map(m => ({
      name: m.name?.replace(/^models\//, ''),
      displayName: m.displayName,
      description: (m.description || '').slice(0, 120),
      methods: m.supportedGenerationMethods,
    }));
    res.json({
      total: all.length,
      image_models_count: imageModels.length,
      image_models: imageModels,
      hint: 'Use one of these names in OPENROUTER_IMAGE_MODEL=google/<name>',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ⭐ AI สร้าง "Poster Prompt อัตโนมัติ" จากหัวข้อ → ได้ image prompt ที่ AI gen สวยแบบ Pawtry
router.post('/poster-prompt', async (req, res) => {
  const { topic, course = 'PFB', brandVoice } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const courseInfo = course === 'PHE'
    ? 'PET HOTEL ENTREPRENEUR — เปิดโรงแรมหมาแมว'
    : 'PET FOOD BUSINESS — เปิดแบรนด์อาหารสัตว์เลี้ยง';

  const system = `You are a senior creative director designing premium PHOTOGRAPHIC marketing visuals for Pawtry Thailand pet brand.

🎯 CRITICAL: Output prompts must produce PHOTOREALISTIC images, NOT cartoon, NOT illustration, NOT 3D render, NOT digital art.

✨ IMPORTANT: Every image must include Thai text OVERLAY rendered IN the image itself (Pawtry-style poster).

Always START every image prompt with this core context:
"${PHOTO_PROMPT_CORE}"

Scene specification:
- Subject: pet (closeup/medium-shot) OR product+pet OR setting+context
- Setting matching topic: lab / clean factory / modern home / studio
- Cinematic lighting (dramatic for pain, warm for benefits, cyan-neon for tech/premium)
- Slight depth of field, magazine-editorial quality
- 4:5 vertical aspect

REQUIRED TEXT OVERLAY section (must include in every prompt):
"TEXT OVERLAY: Large bold [color] Thai text at [position] reading '[Thai title]'. Below in [smaller/sub style] Thai text: '[Thai subtitle]'. Perfectly spelled, magazine-quality typography with [outline/shadow] effects."

Color/style choices:
- "metallic red with white outline" — for pain/warning
- "gold gradient with dark shadow" — for premium/luxury
- "white with dramatic black shadow" — for clean modern
- "navy blue with metallic finish" — for trust/professional

End every prompt with:
"Vertical 4:5. NOT cartoon, NOT illustration, NOT 3D render. NO brand logos."

Critical: include EXPLICIT Thai text overlay instructions in the prompt — header, subheader, 4 info cards if applicable, bottom CTA banner. All Thai text must be perfectly spelled with correct diacritics.

Output format: ONE plain text English prompt (no JSON, no markdown, no explanation). Length 300-500 words.

Course context: ${courseInfo}`;

  const userMsg = `Thai topic: "${topic}"

Generate a complete poster prompt. Derive 4 educational/business-focused subtopics from the topic for the 4 info cards (each with: number 1-4, Thai title, English term in parentheses, brief Thai description ~12-20 words, English keyword tags). The 4 icon labels at bottom should be 2-3 word Thai benefits/features. The bottom banner CTA should be a Thai action phrase ~10-15 words.

Use this exact STRUCTURE template, filling in [BRACKETS] with topic-relevant content:

---
Premium Korean-style pet wellness infographic poster, 4:5 vertical layout for Facebook/Instagram. Clean luxury commercial design with green-cream-white-gold color palette, glassmorphism cards, rounded corners, soft shadows, glossy icons, symmetrical layout, ultra detailed, photorealistic, 4K.

Center: [describe pets + props relevant to topic — default: a happy golden retriever and a fluffy cream-colored cat sitting together with green ceramic premium pet food bowl filled with fresh ingredients - salmon, blueberries, carrots, fresh meat].

Background: cream white minimal with delicate green leaves on edges, soft golden glow, sparkle highlights.

Typography: modern rounded bold Thai+English with white outline and soft drop shadow.

INCLUDE THE FOLLOWING TEXT IN THE IMAGE — perfectly spelled, clearly readable:

HEADER (large bold gold serif):
"[Catchy Thai title from topic — max 50 chars, attention-grabbing]"

SUBHEADER (medium dark gold):
"[Thai subtitle 12-20 words explaining the topic angle]"

4 GLASSMORPHISM INFO CARDS (corners around center):

Card 1 (top-left, green tint):
"1 [Thai subtopic title]
([English term])
[Thai description ~15 words]"
Keyword: "[English keyword tags]"

Card 2 (top-right, blue tint):
"2 [Thai subtopic title]
([English term])
[Thai description]"
Keyword: "[English keywords]"

Card 3 (bottom-left, green tint):
"3 [Thai subtopic title]
([English term])
[Thai description]"
Keyword: "[English keywords]"

Card 4 (bottom-right, blue tint):
"4 [Thai subtopic title]
([English term])
[Thai description]"
Keyword: "[English keywords]"

4 PREMIUM ICONS WITH SHORT THAI TEXT (bottom row, before banner):
"[2-3 word Thai benefit 1]" / "[Thai benefit 2]" / "[Thai benefit 3]" / "[Thai benefit 4]"

BOTTOM GREEN-GOLD BANNER (call-to-action):
"[Thai CTA phrase ~10-15 words]"

Style finals: premium Korean infographic, luxury veterinary branding, clean commercial design, glassmorphism, rounded corners, soft shadows, glossy icons, symmetrical, soft lighting, ultra detailed, realistic pet fur, modern social media advertisement, 4K, elegant spacing, high-end pet wellness aesthetic.
---

Output ONLY the filled prompt (no template markers, no explanations).`;

  try {
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 3000 });
    res.json({ prompt: text.trim() });
  } catch (e) {
    console.error('[ai/poster-prompt]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 📑 Carousel Series — AI วางแผน N สไลด์จาก topic เดียว (cover + content slides)
router.post('/series', async (req, res) => {
  const { topic, course = 'PFB', count = 3, brandVoice } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic required' });
  const slideCount = Math.max(1, Math.min(parseInt(count) || 3, 10));

  const bv = await getBrandVoiceForCourse(course, brandVoice);
  const isGuruSeries = course === 'GURU';

  const guruSeriesSystem = `${buildSystemPrompt(bv, course)}

You are designing CAROUSEL SERIES for Facebook/Instagram for "อาจารย์หนึ่งคุรุเทพ" — สายมู brand (การ์ดศักดิ์สิทธิ์ คุรุเทพ).
Output: ${slideCount} cohesive slides that tell ONE empowering story for สายมู audience.

🎯 CRITICAL — Image prompts produce MYSTICAL LUXURY OCCULT visuals (NOT cartoon, NOT 3D render):
- Subject: sacred tarot cards on velvet, golden candle, crystal, lotus, Thai yantra motifs, cosmic background
- Color theme: deep purple #4C1D95 + gold #F59E0B + black + cream (warm-amber works too)
- NO real human face. Mystical luxury aesthetic.

Every image_prompt must INCLUDE **Thai text overlay**:
"TEXT OVERLAY: Large bold metallic gold Thai text at top reading '[slide title_thai]' with white outline. Below in smaller Thai text: '[subtitle_thai]'. Magazine-quality typography, perfectly spelled."

End every image_prompt with:
"Vertical 4:5. Cinematic luxurious occult aesthetic, soft golden glow. NO real human face, NO brand logos, NOT cartoon."

Visual consistency:
- All slides share ONE color theme (default: warm-amber for GURU)
- Cover = hero glowing tarot card with main hook in gold
- Content slides 2-${slideCount} = numbered tips, same mystical aesthetic, different scene (different crystal/lotus/yantra angle)`;

  const bizSeriesSystem = `${buildSystemPrompt(bv, course)}

You are a senior content strategist designing CAROUSEL SERIES for Facebook/Instagram in Pawtry Thailand pet wellness style.
Your output: a structured plan for ${slideCount} cohesive PHOTOGRAPHIC slides that tell ONE story about the given topic.

🎯 CRITICAL — Image prompts must be PHOTOREALISTIC (NOT cartoon, NOT illustration, NOT 3D render).

Every image_prompt must START with this core context:
"${PHOTO_PROMPT_CORE}"

Then describe the scene specifically:
- Cover (slide 1): hero subject (pet portrait) with dramatic lighting
- Content slides: scene-specific (lab work / factory / lifestyle / product shot) matching the tip topic
- Maintain visual consistency: same color theme across slides
- 4:5 vertical aspect

Every image_prompt must INCLUDE Thai text overlay (Pawtry-style):
"TEXT OVERLAY: Large bold [metallic color] Thai text at [position] reading '[title_thai]'. Below in [smaller style] Thai text: '[subtitle_thai]'. Perfectly spelled, magazine-quality typography."

End every image_prompt with:
"Vertical 4:5. NOT cartoon, NOT illustration, NOT 3D render. NO brand logos."

Visual consistency rules:
- All slides share ONE color theme (navy-red-neon | cyan-tech | warm-amber | cream-natural)
- Cover = big eye-catching photographic hero shot
- Content slides 2-${slideCount} = numbered tips with own photographic scene`;

  const system = isGuruSeries ? guruSeriesSystem : bizSeriesSystem;

  const userMsg = `Topic: "${topic}"
จำนวน slides: ${slideCount}

📋 ตอบเป็น JSON object เท่านั้น:
{
  "series_title": "หัวข้อหลักภาษาไทย",
  "series_subtitle": "คำโปรยภาษาไทย 1 บรรทัด",
  "color_theme": "navy-red-neon | cyan-tech | warm-amber | cream-natural",
  "main_caption": "FB caption ภาษาไทย กระชับ 60-100 คำ — [Hook 1 บรรทัด] + 3-4 📍 bullets + [FOOTER]. ❌ ห้ามมี bridge paragraph / intro / 'หลายคน...เราเลย...' / 'อ่านจบแล้วจะรู้ว่า...'. ตรงประเด็น ไม่เวิ่นเว้อ",
  "hashtags": ["#PetFoodBusiness","#PawtryThailand","#pawtry","#พาว์ทรี่","#อาหารสัตว์เลี้ยง","#คนรักสัตว์","#ธุรกิจอาหารสัตว์"],
  "slides": [
    {
      "slide_number": 1,
      "type": "cover",
      "title_thai": "หัวข้อใหญ่",
      "subtitle_thai": "subtitle สั้น 1 บรรทัด",
      "image_prompt": "PHOTOGRAPHIC prompt with Thai text overlay instruction",
      "composer_template": "hero-poster"
    },
    ...
  ]
}

═══ ตัวอย่าง image_prompt ที่ดี (สไตล์ Pawtry — มี Thai text ในภาพ) ═══

Cover (warning/pain — มี Thai text):
"${PHOTO_PROMPT_CORE} Dramatic medium-close-up of a sad Golden Retriever on dark wet-look surface, eyes downcast toward a rusty metal food bowl. Above the bowl, a bright red glowing neon warning triangle with exclamation mark. Dark moody background with red backlighting.

TEXT OVERLAY: Large bold metallic red Thai text at top reading 'สูตรอาหารของคุณ ทำให้สัตว์เลี้ยงป่วยหรือเปล่า?' with white outline. Below in smaller white text: 'อย่าปล่อยให้แบรนด์พัง เพราะขาดมาตรฐานการผลิต!'. Text must be perfectly spelled, clearly readable, with professional typography.

Vertical 4:5. Photorealistic, NOT cartoon, NOT illustration."

Split-screen comparison (มี Thai text headline):
"${PHOTO_PROMPT_CORE} Split-screen composition. LEFT: dark moody with red neon — weathered hand pouring grain into dirty old bowl with red glowing X. RIGHT: clean cyan neon — lab technician in blue nitrile gloves pouring precise mix onto digital scale showing '125.0g'.

TEXT OVERLAY: Large bold metallic Thai text spanning top reading 'ความรักอย่างเดียว... ไม่พอทำแบรนด์'. Below 3 bullet points in red+white Thai: '⚠️ โภชนาการผิดสัดส่วน = ทำร้ายสุขภาพระยะยาว', '⚠️ กระบวนการไม่สะอาด = แบคทีเรียสะสม', '⚠️ ไม่มีมาตรฐาน = ลูกค้าไม่ไว้ใจ'. Text perfectly spelled, magazine-quality typography.

Vertical 4:5. Photorealistic, NOT cartoon."

Premium product feature (มี Thai title):
"${PHOTO_PROMPT_CORE} Stainless steel premium pet food bowl with Vet-Grade shield emblem, kibble inside, black mortarboard graduation cap resting on top. Background: clean automated factory with cyan neon lighting.

TEXT OVERLAY: Bold metallic red+silver Thai text at top reading 'เจาะลึกการผลิต อาหารเกรดสัตวแพทย์ (Vet-Grade)'. Bottom banner: 'ยกระดับแบรนด์ด้วยหลักสูตร Pet Food Nutrition & Standard'. Text perfectly spelled, dimensional 3D-look typography with metallic finish.

Vertical 4:5. Photorealistic, NOT cartoon."

Trust/CTA closing (มี Thai banner + seal):
"${PHOTO_PROMPT_CORE} Cinematic portrait of friendly Asian male presenter in business casual holding sealed matte-black pet food bag, happy Golden Retriever on left, cream tabby cat on right. Background: blurred high-tech facility with subtle blue lighting. Foreground right: large dimensional gold 'Trusted Brand' seal (paw print + laurel wreath).

TEXT OVERLAY: Massive bold metallic red+white Thai text at top reading 'สร้างแบรนด์ที่คนรักสัตว์เชื่อใจ ตั้งแต่วันนี้!'. Bottom CTA: 'ทักแชทรับรายละเอียดหลักสูตรด่วน! (รับจำนวนจำกัด)'. Magazine-quality typography, perfectly spelled.

Vertical 4:5. Photorealistic, NOT cartoon, NOT illustration."

═══ Rules ═══
- ทุก image_prompt ขึ้นต้น "${PHOTO_PROMPT_CORE}"
- มี "TEXT OVERLAY:" section ใส่ Thai text ตรงๆ พร้อม "perfectly spelled, professional typography"
- ใช้คำว่า "metallic red", "metallic silver", "white outline" สำหรับ text styling
- Thai text ตรงกับ title_thai/subtitle_thai ของ slide นั้น
- สไลด์ 2-${slideCount} title ขึ้นด้วย "1." "2." "3."
- color_theme เดียวกันทุกสไลด์
- ห้ามคำเสี่ยง ban ในภาษาไทย`;

  try {
    // max_tokens คำนวณตาม slideCount — แต่ละ slide ~500-1000 tokens + overhead (เผื่อ truncation)
    const tokenBudget = Math.max(6000, slideCount * 1200 + 3000);
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: tokenBudget, json: true });
    const obj = extractJsonObject(text);
    if (!obj) {
      console.error(`[ai/series] failed to parse JSON. length=${text.length} chars (budget=${tokenBudget} tokens)`);
      console.error('[ai/series] HEAD(500):', text.slice(0, 500));
      console.error('[ai/series] TAIL(500):', text.slice(-500));
      throw new Error(`AI ไม่สามารถสร้าง series JSON ที่ถูกต้องได้ — ${text.length < 500 ? 'response ขาด — ลองอีกครั้ง' : 'response อาจถูก truncate — ลดจำนวน slides หรือลองอีกครั้ง'}`);
    }
    if (!Array.isArray(obj.slides) || obj.slides.length === 0) throw new Error('AI ไม่ได้ส่ง slides');

    obj.slides = obj.slides.slice(0, slideCount);
    obj.requested_count = slideCount;
    obj.actual_count = obj.slides.length;

    res.json(obj);
  } catch (e) {
    console.error('[ai/series]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/cards', async (req, res) => {
  const { course = 'PFB', topic, count = 4, brandVoice } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const bv = await getBrandVoiceForCourse(course, brandVoice);
  const system = buildSystemPrompt(bv, course);
  const userMsg = `หัวข้อ: "${topic}"

แตกหัวข้อนี้ออกเป็น ${count} ข้อสั้นๆ สำหรับใส่ใน infographic — แต่ละข้อมี:
- title: ชื่อหัวข้อย่อยแบบสั้น 2-5 คำ ภาษาไทย ไม่มี emoji
- description: คำอธิบายสั้น 1 ประโยค ~12-20 คำ ภาษาไทย ไม่มี emoji ไม่ใช้คำเสี่ยง ban

ตอบเป็น JSON array เท่านั้น: [{"title":"...","description":"..."}, ...]`;

  try {
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 2000 });
    const arr = extractJsonArray(text) || [];
    res.json({ cards: arr.slice(0, count) });
  } catch (e) {
    console.error('[ai/cards]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/compose', async (req, res) => {
  const { template = 'hero-poster', image, data = {} } = req.body || {};
  if (!image || (!image.image_base64 && !image.image_url)) {
    return res.status(400).json({ error: 'image (image_base64 or image_url) required' });
  }
  try {
    const baseImageBuffer = await fetchImageBuffer(image);
    const out = await composeImage({ baseImageBuffer, template, data });
    res.json({
      template,
      image_base64: out.toString('base64'),
      mime: 'image/png',
      bytes: out.length,
    });
  } catch (e) {
    console.error('[ai/compose]', e.message);
    res.status(500).json({ error: e.message, template });
  }
});

router.get('/brand-voice', async (req, res) => {
  const all = await db.settings.getAll();
  // ถ้า ?course=PFB → return เฉพาะ course นั้น (มี fallback to default)
  if (req.query.course) {
    const courseKey = `brand_voice_${req.query.course.toLowerCase()}`;
    const courseValue = all[courseKey] || all.brand_voice || DEFAULT_BRAND_VOICE;
    return res.json({
      course: req.query.course,
      brand_voice: courseValue,
      is_default: !all[courseKey] && !all.brand_voice,
    });
  }
  // ไม่ใส่ course → return ทั้งหมด (default + per-course)
  res.json({
    brand_voice: all.brand_voice || DEFAULT_BRAND_VOICE,
    is_default: !all.brand_voice,
    courses: {
      PFB: all.brand_voice_pfb || '',
      PHE: all.brand_voice_phe || '',
      GURU: all.brand_voice_guru || '',
    },
  });
});

// 👁️ Preview — return full system prompt ที่ AI จะได้รับจริงสำหรับ course นั้น
// (ใช้บน Brand Voice page เพื่อให้ผู้ใช้เห็นว่าพอเอาบุคลิก + footer + course info รวมกันแล้วหน้าตาเป็นยังไง)
router.get('/brand-voice/preview', async (req, res) => {
  const course = String(req.query.course || 'PFB').toUpperCase();
  if (!['PFB', 'PHE', 'GURU'].includes(course)) {
    return res.status(400).json({ error: 'course must be PFB | PHE | GURU' });
  }
  const all = await db.settings.getAll();
  const courseKey = `brand_voice_${course.toLowerCase()}`;
  const perCourse = all[courseKey] || '';
  const defaultVoice = all.brand_voice || '';
  const brandVoice = perCourse || defaultVoice || null;  // null → buildSystemPrompt ใช้ DEFAULT_BRAND_VOICE
  const systemPrompt = buildSystemPrompt(brandVoice, course);
  res.json({
    course,
    system_prompt: systemPrompt,
    source: perCourse ? 'per_course' : (defaultVoice ? 'default_override' : 'system_default'),
    length_chars: systemPrompt.length,
  });
});

router.post('/brand-voice', async (req, res) => {
  const { brand_voice, course } = req.body || {};
  if (typeof brand_voice !== 'string') return res.status(400).json({ error: 'brand_voice required (string)' });
  // course='PFB'|'PHE'|'GURU' → save to brand_voice_<course>; ไม่ใส่ → save to default
  let key = 'brand_voice';
  if (course && ['PFB', 'PHE', 'GURU'].includes(String(course).toUpperCase())) {
    key = `brand_voice_${course.toLowerCase()}`;
  }
  const saved = await db.settings.set({ [key]: brand_voice });
  res.json({ ok: true, key, ...saved });
});

// 🎬 GET /ai/pexels-video-search?q=&per_page=3 — proxy Pexels Video API
// คืน portrait MP4 ≥720p ที่ใช้เป็น bg ของ Talking Avatar
// docs: https://www.pexels.com/api/documentation/#videos
router.get('/pexels-video-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const perPage = Math.min(Math.max(Number(req.query.per_page) || 3, 1), 10);
  const orientation = (req.query.orientation || 'portrait').toLowerCase();
  const key = process.env.PEXELS_API_KEY;

  if (!key) return res.status(400).json({ error: 'PEXELS_API_KEY not set — สมัครฟรีที่ pexels.com/api' });
  if (!q) return res.status(400).json({ error: 'q (query) required' });

  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=${perPage}&orientation=${orientation}`;
    const r = await fetch(url, { headers: { Authorization: key } });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: d.error || `pexels ${r.status}`, detail: d });

    // Map → simplified: pick best portrait file ใกล้ 1280h, MP4 only
    const videos = (d.videos || []).map(v => {
      const files = (v.video_files || [])
        .filter(f => /mp4/i.test(f.file_type || '') && (f.height || 0) >= 640);
      const best = files.sort((a, b) => Math.abs((a.height||0) - 1280) - Math.abs((b.height||0) - 1280))[0] || files[0];
      return {
        id: v.id,
        width: v.width, height: v.height,
        duration: v.duration,                // วินาที
        url: best?.link || null,
        preview: v.image,                    // thumbnail
        user: v.user?.name,
        page: v.url,                         // pexels page URL (ต้อง credit)
      };
    }).filter(v => v.url);

    res.json({ ok: true, query: q, total: d.total_results || videos.length, videos });
  } catch (e) {
    console.error('[pexels-video-search]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🎬 POST /ai/avatar-scenes — แบ่ง script เป็น N scene + Pexels search query (En) ต่อ scene
// body: { script, n_scenes=3, course='PFB' }
// returns: { scenes: [{ idx, title_thai, bg_query_en, start_at_sec, duration_sec }] }
router.post('/avatar-scenes', async (req, res) => {
  const { script, n_scenes, course = 'PFB' } = req.body || {};
  if (!script || typeof script !== 'string') return res.status(400).json({ error: 'script required' });
  // Auto-pick scene count ตามความยาว script
  const totalChars = script.length;
  const totalDur = Math.max(5, Math.ceil(totalChars / 15)); // ~14-16 chars/sec Thai TTS
  // n_scenes: ถ้า frontend ส่งมา ใช้เลย · ไม่งั้น auto ~5s/scene
  let n = Number(n_scenes) || Math.max(2, Math.round(totalDur / 5));
  n = Math.min(Math.max(n, 1), 12);  // cap 12 (เดิม 6) — ตัดถี่ขึ้นได้

  const courseHint = {
    PFB: 'pet food / dogs / cats / pet store / kitchen / fresh ingredients',
    PHE: 'pet hotel / veterinary clinic / grooming / pet care',
    GURU: 'tarot cards / candles / spiritual / oracle / mystical aesthetic',
  }[course] || '';

  const system = `แบ่ง script ไทยเป็น ${n} scene สำหรับวิดิโอ vertical Reel — แต่ละ scene ต้องการ:
1. title_thai — สั้น (≤30 chars) บรรยายเนื้อหา scene นั้น (จะแสดงเป็น title pill ด้านบนของ scene)
2. bg_query_en — English keyword 2-5 คำ สำหรับ Pexels Video search (cinematic, vertical bg)
   ตัวอย่าง: "cat eating dry food", "pet store shelves", "dog food bowl close-up", "kitchen warm light"
   ⚠️ ห้าม keyword ที่หา video ยาก เช่นชื่อแบรนด์ · ใช้ generic stock-friendly เท่านั้น
3. duration_sec — ประมาณวินาทีของ scene นี้ (ต้องรวมเท่ากับ ~${totalDur}s)

Course context: ${courseHint}

ตอบเป็น JSON object เท่านั้น:
{
  "scenes": [
    { "idx": 0, "title_thai": "...", "bg_query_en": "...", "duration_sec": 8 },
    ...
  ]
}`;

  try {
    const out = await callOpenRouter([{ role: 'user', content: script.slice(0, 3000) }], system, { max_tokens: 1000, json: true });
    const obj = extractJsonObject(out) || { scenes: [] };
    if (!Array.isArray(obj.scenes) || obj.scenes.length === 0) {
      // fallback: 1 scene with topic keyword
      obj.scenes = [{ idx: 0, title_thai: '', bg_query_en: `${course === 'PFB' ? 'cute pet eating food' : 'cute pets'}`, duration_sec: totalDur }];
    }
    // Compute start_at_sec + normalize duration
    let t = 0;
    obj.scenes = obj.scenes.slice(0, n).map((s, i) => {
      const start = t;
      const dur = Math.max(2, Number(s.duration_sec) || Math.round(totalDur / n));
      t += dur;
      return { idx: i, title_thai: s.title_thai || '', bg_query_en: s.bg_query_en || 'pet animal', start_at_sec: start, duration_sec: dur };
    });
    res.json({ ok: true, n_scenes: obj.scenes.length, total_duration_sec: t, scenes: obj.scenes });
  } catch (e) {
    console.error('[avatar-scenes]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🎬 Gemini Veo — text-to-video generation (long-running)
// POST /ai/veo-generate { prompt, aspect='9:16' } → { operation }
// GET  /ai/veo-status?op=operations/xxx → { done, video_base64? } (poll ทุก ~10s)
const VEO_MODEL = process.env.VEO_MODEL || 'veo-3.0-fast-generate-001';

router.post('/veo-generate', async (req, res) => {
  const { prompt, aspect = '9:16', referenceImage = null, model: clientModel } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return res.status(400).json({ error: 'GOOGLE_AI_API_KEY not set — ต้องมี Gemini API key ที่เปิด Veo' });
  // Allow-list of Veo models the user's Gemini key can hit. Anything else falls back to the env default.
  const VEO_ALLOWED = new Set([
    'veo-2.0-generate-001',
    'veo-3.0-generate-001',
    'veo-3.0-fast-generate-001',
    'veo-3.1-generate-preview',
    'veo-3.1-fast-generate-preview',
    'veo-3.1-lite-generate-preview',
  ]);
  const chosenModel = (clientModel && VEO_ALLOWED.has(String(clientModel))) ? String(clientModel) : VEO_MODEL;
  // Veo currently only accepts 9:16 (portrait) and 16:9 (landscape). Map anything else
  // to the closest portrait/landscape default so the frontend doesn't 400 the user.
  const aspectMap = { '9:16':'9:16', '16:9':'16:9', '1:1':'9:16', '4:5':'9:16', '5:4':'16:9' };
  const safeAspect = aspectMap[String(aspect)] || '9:16';

  // If a reference image was provided, parse out the base64 + mime so Veo can condition on it.
  // referenceImage may be a data URL (data:image/png;base64,XYZ…) or already raw base64.
  let imageInstance = null;
  if (referenceImage && typeof referenceImage === 'string') {
    const dm = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
    const b64 = dm ? dm[2] : referenceImage;
    const mime = dm ? dm[1] : 'image/png';
    if (b64 && b64.length > 100) imageInstance = { bytesBase64Encoded: b64, mimeType: mime };
  }

  // With image input, Veo rejects personGeneration='allow_all' — must be 'allow_adult' (or omitted).
  // Without image, allow_all is fine.
  const parameters = { aspectRatio: safeAspect };
  if (!imageInstance) parameters.personGeneration = 'allow_all';
  else parameters.personGeneration = 'allow_adult';

  const instance = { prompt: String(prompt).slice(0, 4000) };
  if (imageInstance) instance.image = imageInstance;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:predictLongRunning?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [instance], parameters }),
      }
    );
    const d = await r.json();
    if (!r.ok || !d.name) {
      const msg = d.error?.message || `Veo submit ${r.status}`;
      console.error('[veo-generate] google said:', r.status, msg, 'model=', chosenModel);
      // Bubble Google's status code so the frontend can show the real reason (e.g. 400 = bad aspect / 429 = quota)
      return res.status(r.status >= 400 && r.status < 500 ? r.status : 502).json({ error: msg, detail: d });
    }
    res.json({ ok: true, operation: d.name, model: chosenModel, aspect: safeAspect, conditionedOnImage: !!imageInstance });
  } catch (e) {
    console.error('[veo-generate]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/veo-status', async (req, res) => {
  const op = String(req.query.op || '');
  if (!op.startsWith('operations/') && !op.includes('/operations/')) {
    return res.status(400).json({ error: 'valid operation name required' });
  }
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return res.status(400).json({ error: 'GOOGLE_AI_API_KEY not set' });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${op}?key=${key}`);
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: d.error?.message || `Veo status ${r.status}` });
    if (!d.done) return res.json({ done: false });
    if (d.error) return res.json({ done: true, failed: true, error: d.error.message || 'veo failed' });

    // ดึง video URI จาก response (รูปแบบต่างกันตาม model version)
    const samples = d.response?.generateVideoResponse?.generatedSamples
      || d.response?.generatedSamples || [];
    const vidUri = samples[0]?.video?.uri || d.response?.generatedVideos?.[0]?.video?.uri;
    if (!vidUri) return res.json({ done: true, failed: true, error: 'no video in response', detail: JSON.stringify(d).slice(0, 300) });

    // download video (ต้องแนบ key) → base64
    const vr = await fetch(vidUri.includes('key=') ? vidUri : `${vidUri}${vidUri.includes('?') ? '&' : '?'}key=${key}`);
    if (!vr.ok) return res.json({ done: true, failed: true, error: `download video ${vr.status}` });
    const buf = Buffer.from(await vr.arrayBuffer());

    // upload Supabase Storage → public URL (เลี่ยง response ใหญ่)
    let videoUrl = null;
    if (supabase && buf.length < 50 * 1024 * 1024) {
      try {
        const bucket = 'veo-videos';
        try { await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 52428800 }); } catch {}
        const fname = `veo-${Date.now()}-${Math.random().toString(36).slice(2,8)}.mp4`;
        const { error: ue } = await supabase.storage.from(bucket).upload(fname, buf, { contentType: 'video/mp4', upsert: false });
        if (!ue) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fname);
          videoUrl = pub?.publicUrl || null;
        }
      } catch (e) { console.warn('[veo] upload:', e.message); }
    }
    res.json({
      done: true,
      video_url: videoUrl,
      video_base64: videoUrl ? null : buf.toString('base64'),
      bytes: buf.length,
    });
  } catch (e) {
    console.error('[veo-status]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// 🎭 Lip-sync via fal.ai — Vercel-direct path (no worker-render needed)
//
//   POST /api/ai/lipsync-submit  body: { image_b64?, image_url?, audio_b64?, audio_url?, model? }
//     → uploads any base64 inputs to Supabase Storage, submits to fal.ai queue,
//       returns { request_id, model, status_url, image_url, audio_url }
//
//   GET  /api/ai/lipsync-poll?request_id=X&model=Y
//     → polls fal.ai status. When DONE returns { status:'done', video_url }; else { status:'pending' }
//
// Requires FAL_KEY env var. Auto-creates Supabase Storage bucket 'lipsync-input'.
// ============================================================
const LIPSYNC_BUCKET = 'lipsync-input';
// Default to Infinitalk — better quality + smoother mouth movement than SadTalker.
// Override with FAL_LIPSYNC_MODEL env var if you want a different model.
const FAL_DEFAULT_MODEL = process.env.FAL_LIPSYNC_MODEL || 'fal-ai/infinitalk';

async function ensureLipsyncBucket() {
  if (!supabase) throw new Error('Supabase not configured');
  try { await supabase.storage.createBucket(LIPSYNC_BUCKET, { public: true, fileSizeLimit: 52428800 }); } catch (_) {}
}
async function uploadDataUrlToBucket(dataUrl, prefix, fallbackExt) {
  // Accept either a full data: URL or raw base64
  const m = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  const b64 = m ? m[2] : String(dataUrl || '');
  const mime = m ? m[1] : (fallbackExt === 'mp3' ? 'audio/mp3' : 'image/png');
  if (!b64 || b64.length < 100) throw new Error(prefix + ': base64 payload too small / empty');
  const buf = Buffer.from(b64, 'base64');
  const ext = fallbackExt || (mime.includes('audio') ? 'mp3' : 'png');
  const fname = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: ue } = await supabase.storage
    .from(LIPSYNC_BUCKET)
    .upload(fname, buf, { contentType: mime, upsert: false });
  if (ue) throw new Error(`Storage upload failed: ${ue.message}`);
  const { data: pub } = supabase.storage.from(LIPSYNC_BUCKET).getPublicUrl(fname);
  if (!pub?.publicUrl) throw new Error('Storage publicUrl missing — is the bucket public?');
  return pub.publicUrl;
}

router.post('/lipsync-submit', async (req, res) => {
  const { image_b64, image_url: imageUrlIn, audio_b64, audio_url: audioUrlIn, model: modelIn, prompt: promptIn } = req.body || {};
  const falKey = process.env.FAL_KEY;
  if (!falKey) return res.status(400).json({ error: 'FAL_KEY not set — ตั้ง env ที่ Vercel → Settings → Environment Variables' });
  if (!image_b64 && !imageUrlIn) return res.status(400).json({ error: 'image_b64 or image_url required' });
  if (!audio_b64 && !audioUrlIn) return res.status(400).json({ error: 'audio_b64 or audio_url required' });
  const model = String(modelIn || FAL_DEFAULT_MODEL);
  // fal-ai/infinitalk now REQUIRES a `prompt` field (422 "Field required" otherwise — cost stays
  // $0.00 because validation fails before execution, but the user still hits queue limits and
  // wonders why nothing renders). Pick a generic talking-head prompt unless the caller overrode.
  const prompt = String(promptIn || 'A person talking naturally to camera with friendly expression, smooth lip-sync, slight head movement, professional lighting');

  try {
    // 1) Make sure both inputs are public URLs (fal.ai pulls from URL — no file upload API)
    let image_url = imageUrlIn || null;
    let audio_url = audioUrlIn || null;
    if (!image_url) {
      await ensureLipsyncBucket();
      image_url = await uploadDataUrlToBucket(image_b64, 'av-img', 'png');
    }
    if (!audio_url) {
      await ensureLipsyncBucket();
      audio_url = await uploadDataUrlToBucket(audio_b64, 'av-aud', 'mp3');
    }

    // 2) Submit to fal.ai queue — input schema per model
    // ⚠️ infinitalk + omnihuman both require `prompt` since Nov 2024. SadTalker doesn't (older API).
    const FAL_INPUT = {
      'fal-ai/sadtalker':                       { source_image_url: image_url, driven_audio_url: audio_url },
      'fal-ai/bytedance/omnihuman/v1.5':        { image_url, audio_url, prompt, resolution: '720p' },
      'fal-ai/bytedance/omnihuman':             { image_url, audio_url, prompt, resolution: '720p' },
      'veed/fabric-1.0':                        { image_url, audio_url, resolution: '720p' },
      'fal-ai/infinitalk':                      { image_url, audio_url, prompt },
    };
    const inputBody = FAL_INPUT[model] || { image_url, audio_url, prompt };
    const r = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(inputBody),
    });
    const submitText = await r.text();
    if (!r.ok) {
      return res.status(r.status >= 400 && r.status < 500 ? r.status : 502).json({
        error: 'fal_submit', status: r.status, detail: submitText.slice(0, 400),
      });
    }
    let submitData;
    try { submitData = JSON.parse(submitText); }
    catch { return res.status(502).json({ error: 'fal_submit', detail: 'non-JSON: ' + submitText.slice(0, 200) }); }
    const request_id = submitData.request_id;
    if (!request_id) return res.status(502).json({ error: 'fal_submit', detail: 'no request_id', raw: submitData });
    // fal returns status_url + response_url for the specific submitted job — use them directly,
    // building paths by hand breaks for models with nested paths like fal-ai/bytedance/omnihuman/v1.5
    res.json({
      ok: true,
      request_id,
      model,
      image_url,
      audio_url,
      status_url: submitData.status_url || `https://queue.fal.run/${model}/requests/${request_id}/status`,
      response_url: submitData.response_url || `https://queue.fal.run/${model}/requests/${request_id}`,
    });
  } catch (e) {
    console.error('[lipsync-submit]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/lipsync-poll', async (req, res) => {
  const request_id = String(req.query.request_id || '');
  const model = String(req.query.model || FAL_DEFAULT_MODEL);
  const status_url_q = req.query.status_url ? String(req.query.status_url) : null;
  const response_url_q = req.query.response_url ? String(req.query.response_url) : null;
  if (!request_id) return res.status(400).json({ error: 'request_id required' });
  const falKey = process.env.FAL_KEY;
  if (!falKey) return res.status(400).json({ error: 'FAL_KEY not set' });

  try {
    const statusUrl = status_url_q || `https://queue.fal.run/${model}/requests/${request_id}/status`;
    const sr = await fetch(statusUrl, { headers: { 'Authorization': `Key ${falKey}` } });
    const stxt = await sr.text();
    let sdata = {};
    try { sdata = JSON.parse(stxt); } catch (_) {}
    if (!sr.ok) return res.status(502).json({ error: 'fal_status', status: sr.status, detail: stxt.slice(0, 300) });

    // fal status values: IN_QUEUE | IN_PROGRESS | COMPLETED | FAILED | CANCELED
    const status = String(sdata.status || '').toUpperCase();
    if (status === 'COMPLETED') {
      // Fetch the actual result from response_url
      const responseUrl = response_url_q || `https://queue.fal.run/${model}/requests/${request_id}`;
      const rr = await fetch(responseUrl, { headers: { 'Authorization': `Key ${falKey}` } });
      const rdata = await rr.json().catch(() => ({}));
      // Different fal models return video at different paths
      const video_url = rdata.video?.url || rdata.output?.video?.url || rdata.video_url || rdata.video || rdata.output_url || rdata.url;
      if (!video_url) return res.json({ status: 'done', error: 'no video_url in fal response', raw: rdata });
      return res.json({ status: 'done', video_url });
    }
    if (status === 'FAILED' || status === 'CANCELED') {
      return res.json({ status: 'error', error: sdata.error || status });
    }
    // IN_QUEUE / IN_PROGRESS / anything else → still working
    return res.json({ status: 'pending', fal_status: status, queue_position: sdata.queue_position });
  } catch (e) {
    console.error('[lipsync-poll]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// 🎬 Text-to-Video via fal.ai — alternatives to Google Veo
//
//   POST /api/ai/fal-t2v-submit  body: { prompt, aspect?, model?, duration_sec?, referenceImage? }
//     → submits to fal.ai queue, returns { request_id, model, status_url, response_url }
//
//   GET  /api/ai/fal-t2v-poll?request_id=&model=&status_url=&response_url=
//     → polls until COMPLETED, returns { status:'done', video_url } or { status:'pending' }
//
// Supported models (all via FAL_KEY):
//   fal-ai/wan/v2.2-a14b/text-to-video         — Wan 2.2 (cheap, fast, 5s)
//   fal-ai/wan-2.5/text-to-video/preview       — Wan 2.5 (newer, smoother)
//   fal-ai/minimax/hailuo-02/standard/text-to-video — Hailuo (cinematic, 6s)
//   fal-ai/kling-video/v2.5-turbo/pro/text-to-video — Kling 2.5 (premium, 5-10s)
//   fal-ai/luma-dream-machine                  — Luma Dream Machine (character consistency)
// ============================================================
router.post('/fal-t2v-submit', async (req, res) => {
  const { prompt, aspect = '9:16', model: modelIn, duration_sec = 5, referenceImage = null } = req.body || {};
  const falKey = process.env.FAL_KEY;
  if (!falKey) return res.status(400).json({ error: 'FAL_KEY not set — ตั้ง env ที่ Vercel → Settings → Environment Variables' });
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const model = String(modelIn || 'fal-ai/wan/v2.2-a14b/text-to-video');

  try {
    // Optional reference image — uploaded to Supabase Storage so fal models that support
    // image input can grab it. Most text-to-video models ignore this; Wan/Kling support it
    // via image_url for image-to-video conditioning.
    let image_url = null;
    if (referenceImage && typeof referenceImage === 'string' && referenceImage.indexOf('data:') === 0) {
      try {
        await ensureLipsyncBucket();
        image_url = await uploadDataUrlToBucket(referenceImage, 't2v-ref', 'png');
      } catch (e) { console.warn('[fal-t2v] reference upload failed:', e.message); }
    }

    // Per-model input schema — fal.ai is annoyingly inconsistent across models
    const dur = Math.max(2, Math.min(parseInt(duration_sec, 10) || 5, 10));
    const aspectRatio = String(aspect);                            // '9:16' | '16:9' | '1:1'
    const FAL_T2V_INPUT = {
      'fal-ai/wan/v2.2-a14b/text-to-video':            { prompt, aspect_ratio: aspectRatio, num_frames: dur * 16, ...(image_url ? { image_url } : {}) },
      'fal-ai/wan-2.5/text-to-video/preview':          { prompt, aspect_ratio: aspectRatio, duration: dur, ...(image_url ? { image_url } : {}) },
      'fal-ai/minimax/hailuo-02/standard/text-to-video': { prompt, aspect_ratio: aspectRatio, duration: dur === 10 ? 10 : 6, prompt_optimizer: true },
      'fal-ai/kling-video/v2.5-turbo/pro/text-to-video': { prompt, aspect_ratio: aspectRatio, duration: dur >= 10 ? '10' : '5', cfg_scale: 0.5 },
      'fal-ai/kling-video/v2.1/master/text-to-video':  { prompt, aspect_ratio: aspectRatio, duration: dur >= 10 ? '10' : '5' },
      'fal-ai/luma-dream-machine':                     { prompt, aspect_ratio: aspectRatio, loop: false },
    };
    const inputBody = FAL_T2V_INPUT[model] || { prompt, aspect_ratio: aspectRatio };

    const r = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(inputBody),
    });
    const submitText = await r.text();
    if (!r.ok) {
      console.error('[fal-t2v-submit]', r.status, submitText.slice(0, 400));
      return res.status(r.status >= 400 && r.status < 500 ? r.status : 502).json({
        error: 'fal_submit', status: r.status, detail: submitText.slice(0, 400),
      });
    }
    let submitData;
    try { submitData = JSON.parse(submitText); }
    catch { return res.status(502).json({ error: 'fal_submit', detail: 'non-JSON: ' + submitText.slice(0, 200) }); }
    const request_id = submitData.request_id;
    if (!request_id) return res.status(502).json({ error: 'fal_submit', detail: 'no request_id', raw: submitData });
    res.json({
      ok: true,
      request_id,
      model,
      aspect: aspectRatio,
      status_url: submitData.status_url || `https://queue.fal.run/${model}/requests/${request_id}/status`,
      response_url: submitData.response_url || `https://queue.fal.run/${model}/requests/${request_id}`,
    });
  } catch (e) {
    console.error('[fal-t2v-submit]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/fal-t2v-poll', async (req, res) => {
  const request_id = String(req.query.request_id || '');
  const model = String(req.query.model || 'fal-ai/wan/v2.2-a14b/text-to-video');
  const status_url_q = req.query.status_url ? String(req.query.status_url) : null;
  const response_url_q = req.query.response_url ? String(req.query.response_url) : null;
  if (!request_id) return res.status(400).json({ error: 'request_id required' });
  const falKey = process.env.FAL_KEY;
  if (!falKey) return res.status(400).json({ error: 'FAL_KEY not set' });

  try {
    const statusUrl = status_url_q || `https://queue.fal.run/${model}/requests/${request_id}/status`;
    const sr = await fetch(statusUrl, { headers: { 'Authorization': `Key ${falKey}` } });
    const stxt = await sr.text();
    let sdata = {};
    try { sdata = JSON.parse(stxt); } catch (_) {}
    if (!sr.ok) return res.status(502).json({ error: 'fal_status', status: sr.status, detail: stxt.slice(0, 300) });

    const status = String(sdata.status || '').toUpperCase();
    if (status === 'COMPLETED') {
      const responseUrl = response_url_q || `https://queue.fal.run/${model}/requests/${request_id}`;
      const rr = await fetch(responseUrl, { headers: { 'Authorization': `Key ${falKey}` } });
      const rdata = await rr.json().catch(() => ({}));
      // text-to-video result paths vary by model — try the common ones
      const video_url = rdata.video?.url || rdata.output?.video?.url || rdata.video_url || rdata.url
        || rdata.video || rdata.output_url || (Array.isArray(rdata.videos) ? rdata.videos[0]?.url : null);
      if (!video_url) return res.json({ status: 'done', error: 'no video_url in fal response', raw: rdata });
      return res.json({ status: 'done', video_url });
    }
    if (status === 'FAILED' || status === 'CANCELED') {
      return res.json({ status: 'error', error: sdata.error || status });
    }
    return res.json({ status: 'pending', fal_status: status, queue_position: sdata.queue_position });
  } catch (e) {
    console.error('[fal-t2v-poll]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🔮 POST /ai/pick-a-card — สร้างคอนเทนต์ดูดวง "Pick a Card" 3 กองไพ่ สไตล์คุรุเทพ
router.post('/pick-a-card', async (req, res) => {
  const { theme, num_piles } = req.body || {};
  if (!theme) return res.status(400).json({ error: 'theme required (เช่น "เงินก้อนใหญ่ โชคลาภ")' });
  const n = Math.min(Math.max(parseInt(num_piles) || 3, 2), 4);

  const system = `คุณคืออาจารย์หนึ่ง คุรุเทพ — หมอดูสายมูชื่อดัง เขียนคอนเทนต์ "Pick a Card" ลงโซเชียล

📋 รูปแบบ Pick a Card:
- Hook เปิด: ตั้งคำถามดึงดูด + อิโมจิ
- มี ${n} กองไพ่ — แต่ละกอง:
  · ผูกกับเทพ/สิ่งศักดิ์สิทธิ์ไทย (พระนารายณ์, พระขันธกุมาร, พระแม่ลักษมี, พระพิฆเนศ, ท้าวเวสสุวรรณ, แม่นางกวัก ฯลฯ)
  · คำทำนายเชิงบวก ให้กำลังใจ 2-4 ประโยค ภาษาไทยลื่นไหล
  · มี emoji ประกอบ 2-4 ตัว
- ปิดด้วย CTA: ปรึกษาดวงส่วนตัวกับอาจารย์หนึ่ง + บูชา 'การ์ดศักดิ์สิทธิ์ คุรุเทพ' ติดต่อ @317biusr
- hashtag: #อาจารย์หนึ่งคุรุเทพ #คุรุเทพ #Kuruthep #สายมู + ที่เกี่ยวกับ theme

⚙️ กฎ:
- ภาษาไทยอบอุ่น เป็นกันเอง น่าเชื่อถือ ลงท้าย "ค่ะ"
- คำทำนายเป็นบวก เสริมกำลังใจ (ห้ามทำนายร้าย/ฟันธงเสียหาย)
- ห้ามสัญญาเกินจริงแบบ "รวยแน่นอน 100%"

ตอบเป็น JSON object เท่านั้น:
{
  "hook": "Pick a Card ... ?",
  "intro": "เลือกกองไพ่ที่ดึงดูดใจคุณที่สุด ...",
  "piles": [
    { "no": 1, "title": "ชื่อกอง", "deity": "ชื่อเทพ", "emoji": "emoji", "prediction": "คำทำนาย 2-4 ประโยค" }
  ],
  "cta": "ข้อความ CTA ปรึกษา/บูชาการ์ด + @317biusr",
  "hashtags": ["#อาจารย์หนึ่งคุรุเทพ", "#คุรุเทพ"]
}`;

  try {
    const out = await callOpenRouter(
      [{ role: 'user', content: `หัวข้อ/ธีม Pick a Card: "${theme}"\nจำนวนกองไพ่: ${n}` }],
      system, { max_tokens: 2200, json: true }
    );
    const obj = extractJsonObject(out);
    if (!obj || !Array.isArray(obj.piles) || obj.piles.length === 0) {
      return res.status(500).json({ error: 'AI returned invalid pick-a-card JSON', raw_head: out.slice(0, 300) });
    }
    const pileText = obj.piles.map(p =>
      `กองที่ ${p.no} ${p.title} ${p.emoji || ''}\n${p.prediction}`
    ).join('\n.\n');
    obj.caption_full = [
      obj.hook, obj.intro, '.', pileText, '.', obj.cta, '.',
      (obj.hashtags || []).join(' '),
    ].filter(Boolean).join('\n');
    obj.theme = theme;
    obj.ok = true;
    res.json(obj);
  } catch (e) {
    console.error('[ai/pick-a-card]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🎬 POST /ai/video-prompt — generate an English Veo prompt from brand + topic + optional product
// body: { brandName, businessType, brandDesc, topic, productName?, productDesc?, style?, duration_sec? }
// → { prompt }
router.post('/video-prompt', async (req, res) => {
  const {
    brandName = '', businessType = '', brandDesc = '',
    topic = '', productName = '', productDesc = '',
    style = '', duration_sec = 8, hasReferenceImage = false,
  } = req.body || {};
  if (!String(topic).trim()) return res.status(400).json({ error: 'topic required' });
  const isProductShot = !!String(productName).trim();

  // Style-specific guidance — drives Veo to produce dramatically different videos for the same topic.
  // 'creator' forces a person-on-camera shot (UGC / influencer holding the product), which is what
  // most users actually want for selling on TikTok/Reels.
  const styleGuides = {
    creator:   { label:'Creator / UGC',  rule:'MANDATORY: a real-looking person (creator / influencer / hand model) is ON CAMERA, holding or showcasing the product. Selfie-style or 3/4 angle. Natural daylight or soft ring-light. The presenter looks at the camera, smiles or reacts. The product is held clearly in frame near face or chest. Vertical-friendly composition. Spoken-style, authentic, social-media UGC vibe — NOT a polished commercial.' },
    cinematic: { label:'Cinematic',     rule:'Filmic, anamorphic feel. Slow purposeful camera (push-in, dolly, orbit). Dramatic key light + rim light, deep shadows, shallow depth of field. Moody color grade. No person required — the product is the hero.' },
    lifestyle: { label:'Lifestyle',     rule:'Real-life context — the product in use in a natural setting (kitchen, café, vanity, living room). May include hands or a person interacting with it. Warm, candid, soft window light. Documentary-style handheld feel.' },
    product:   { label:'Product shot',  rule:'Studio product photography in motion — clean seamless background, hero product front-and-center, slow rotation / top-down reveal / 360 spin / macro detail. Studio softbox key light + rim light. No person, no distractions — pure product beauty.' },
    anime:     { label:'Anime / 3D',    rule:'Stylised 3D / anime aesthetic. Bold outlines, vibrant saturated colors, slightly exaggerated motion. The product is depicted in matching stylised form — think Studio Ghibli, Pixar short, or anime opening.' },
  };
  const styleGuide = styleGuides[String(style).toLowerCase()] || null;
  const isCreator = styleGuide && String(style).toLowerCase() === 'creator';

  // When a reference image is attached, force the generated prompt to LOCK to that exact
  // product — Veo (especially Veo 2) tends to "drift" if the prompt is generic.
  // The prompt must explicitly say "the product shown in the reference image" with no
  // generic invention. Veo's image-conditioning is then steered hard by both rails.
  const refLockClause = hasReferenceImage
    ? ` CRITICAL — REFERENCE FIDELITY: A reference image of the EXACT product is supplied to Veo. The generated prompt MUST contain a sentence that begins with "Reference image lock:" and explicitly tells Veo to match the product to the supplied reference image — same artwork on the card/package face, same exact color palette, same physical shape and proportions, same gold/text/symbols/border details. DO NOT invent any visual details for the product (e.g. do not name specific deities, religious figures, or symbols unless they are clearly visible in the reference). Describe the product ONLY as "the card shown in the reference image" or "the deck pictured in the reference" so Veo has nothing to hallucinate from. The person, scene, lighting and camera can be fully described — but the product itself must lock to the reference.`
    : '';

  const system = isCreator
    ? `You are a TikTok/Reels content director writing Google Gemini Veo prompts for short-form UGC (user-generated-content) product videos. The video MUST show a real-looking person ON CAMERA holding or showcasing the named product — selfie style or 3/4 angle, natural daylight or soft ring-light, presenter smiles/reacts to camera, product held clearly in frame near the face or chest. Authentic, spoken-style, social-media vibe. Write ONE English Veo prompt (~70-110 words) describing: the presenter (age range, expression, framing), how they hold/show the product, camera setup (selfie or POV), lighting, background, mood. Do NOT write a polished studio commercial — this is UGC. NO commentary, NO JSON, NO quotes — just the prompt itself.${refLockClause}`
    : isProductShot
    ? `You are a commercial director writing Google Gemini Veo prompts for short-form PRODUCT SALES videos (Reels / TikTok / Shorts). The named product MUST be the hero of the shot — visible, on-camera, beautifully lit, the clear subject. Write ONE polished English video prompt (~70-100 words) describing: hero product front-and-center, camera movement (slow push-in, orbit, top-down reveal, etc.), product-beauty lighting (rim light, soft key, dramatic shadow), composition (rule of thirds, centered hero, macro detail), mood, and color palette that complements the product.${styleGuide ? ' Style: ' + styleGuide.rule : ''} NO commentary, NO JSON, NO quotes — just the prompt itself.${refLockClause}`
    : `You are a cinematographer writing prompts for Google Gemini Veo (text-to-video AI). Output ONE polished English video prompt (~60-90 words). Describe: camera movement, composition, lighting, mood, color palette, key subjects.${styleGuide ? ' Style: ' + styleGuide.rule : ''} NO commentary, NO JSON, NO quotes — just the prompt itself.${refLockClause}`;
  const userMsg = `Brand: ${brandName || '(unspecified)'}
Business type: ${businessType || '(unspecified)'}
Brand description: ${brandDesc || '(unspecified)'}
${productName ? 'Hero product (must be visibly featured in every shot): ' + productName + (productDesc ? ' — ' + productDesc : '') : ''}
${hasReferenceImage ? 'A reference image of the hero product is SUPPLIED TO VEO. The product in the video must look EXACTLY like the reference — same artwork, same colors, same shape. The output prompt MUST refer to the product as "the card shown in the reference image" (or similar) and MUST NOT invent specific deities, gods, symbols, or artwork details the AI cannot see in the reference.' : ''}
${styleGuide ? 'Visual style: ' + styleGuide.label + ' — ' + styleGuide.rule : (style ? 'Visual style: ' + style : '')}
Video concept / hook: ${topic}
Duration: ~${duration_sec}s

Write ONE ${isCreator ? 'UGC creator-style' : isProductShot ? 'product-sales' : 'cinematic'} English Veo prompt that ${isCreator ? 'shows a real person on camera holding the product' : isProductShot ? 'sells the hero product' : 'brings this concept to life'}.${hasReferenceImage ? ' Remember: end the prompt with the "Reference image lock:" sentence so Veo conditions strictly on the supplied image.' : ''}`;
  try {
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 500 });
    let prompt = String(text || '').replace(/```[\s\S]*?```/g, '').trim().replace(/^["']|["']$/g, '').trim();
    if (!prompt) throw new Error('empty prompt');
    res.json({ prompt });
  } catch (e) {
    console.error('[ai/video-prompt]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🎭 POST /ai/avatar-script-brand — Talking Avatar script generated from a PostPost brand profile
// body: { brandName, businessType, brandDesc, voices[], archetype, topic, duration_sec, voice_gender, voice_persona }
// → { script, char_count, duration_estimate_sec, duration_sec }
router.post('/avatar-script-brand', async (req, res) => {
  const {
    brandName = '', businessType = '', brandDesc = '',
    voices = [], archetype = '',
    topic = '', duration_sec = 30,
    voice_persona = '', voice_gender = 'female',
  } = req.body || {};
  if (!String(topic).trim()) return res.status(400).json({ error: 'topic required' });
  const targetSec = Math.min(Math.max(parseInt(duration_sec, 10) || 30, 5), 120);
  const targetChars = Math.round(targetSec * 15);
  const isMale = String(voice_gender).toLowerCase() === 'male';
  const endParticle = isMale ? 'ครับ / นะครับ' : 'ค่ะ / นะคะ';
  const persona = voice_persona || (isMale ? 'ผู้ชาย น้ำเสียงเป็นกันเองอบอุ่น' : 'ผู้หญิง น้ำเสียงเป็นกันเองอบอุ่น');

  const system = `คุณคือ scriptwriter ภาษาไทย สำหรับ Talking Avatar — ผู้บรรยายพูดอธิบายเรื่องของแบรนด์ ความยาวประมาณ ${targetSec} วินาที

🎯 โปรไฟล์แบรนด์ (สคริปต์ต้องอิงข้อมูลนี้ ห้ามออกนอกแบรนด์):
- ชื่อแบรนด์: ${brandName || '(ไม่ระบุ)'}
- ประเภทธุรกิจ: ${businessType || '(ไม่ระบุ)'}
- คำอธิบายแบรนด์: ${brandDesc || '(ไม่ระบุ)'}
- Brand Voice: ${voices.length ? voices.join(', ') : '(ไม่ระบุ)'}
- Brand Archetype: ${archetype || '(ไม่ระบุ)'}

🎙️ ผู้พูด/น้ำเสียง: ${persona}
→ เพศผู้พูด: ${isMale ? 'ชาย' : 'หญิง'} — ใช้คำลงท้าย สรรพนาม สำนวน ให้ตรงเพศ

⚙️ กฎเขียน:
1. **Natural spoken Thai** สำหรับ TTS อ่าน:
   ❌ ห้าม emoji / # / ตัวซ้ำ ("มากกก") / ตัวเลขอารบิกถ้าใช้คำไทยได้ ("สาม" แทน "3")
   ❌ ห้ามใช้คำ medical claim (รักษา, หาย, การันตี 100%)
   ✅ ประโยค 8-15 คำ ใช้คอมม่า/จุด เว้นจังหวะ
2. ลำดับ: **Hook 1 ประโยค → เนื้อหา 2-4 ประโยค → CTA นุ่ม**
3. ความยาวเป้า ~${targetChars} ตัวอักษร (±15%) ≈ ${targetSec} วินาที
4. ลงท้ายประโยคสุภาพด้วย "${endParticle}" ตรงเพศเสมอ
5. เนื้อหาต้องเกี่ยวกับ "หัวข้อ" ที่ระบุและตรงโปรไฟล์แบรนด์

ตอบเป็น JSON เท่านั้น: {"script":"..."}`;

  try {
    const text = await callOpenRouter([{ role: 'user', content: `หัวข้อที่อยากให้พูด: ${topic}` }], system, { max_tokens: 1500, json: true });
    const obj = extractJsonObject(text);
    const script = obj && obj.script ? String(obj.script).trim() : '';
    if (!script) throw new Error('AI ไม่สามารถสร้างสคริปต์ได้');
    res.json({ script, char_count: script.length, duration_estimate_sec: Math.round(script.length / 15), duration_sec: targetSec });
  } catch (e) {
    console.error('[ai/avatar-script-brand]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🎭 POST /ai/avatar-script — สร้าง script ภาษาไทยสำหรับ Talking Avatar (single-character monologue)
// body: { topic, duration_sec=30, mascot_kind='dog', course='PFB' }
// returns: { script, char_count, duration_estimate_sec, tone }
router.post('/avatar-script', async (req, res) => {
  const { topic, duration_sec = 30, mascot_kind = 'dog', course = 'PFB',
          voice_persona = '', voice_gender = 'female' } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const targetSec = Math.min(Math.max(parseInt(duration_sec) || 30, 5), 120);
  // Thai TTS ~14-16 chars/sec → target chars
  const targetChars = Math.round(targetSec * 15);

  // 🎙️ ปรับสคริปต์ตามคาแรกเตอร์เสียงที่เลือก (เพศ + โทน)
  const isMale = String(voice_gender).toLowerCase() === 'male';
  const endParticle = isMale ? 'ครับ / นะครับ' : 'ค่ะ / นะคะ';
  const personaLine = voice_persona
    ? voice_persona
    : (isMale ? 'ผู้ชาย น้ำเสียงเป็นกันเองอบอุ่น' : 'ผู้หญิง น้ำเสียงเป็นกันเองอบอุ่น');

  const characterDesc = {
    dog: 'ลูกสุนัขขนฟูสีเทา-ครีม น่ารัก ใส่ผ้าพันคอแดง "Pawtry" และเอี๊ยมยีนส์ บุคลิก: เป็นมิตร อบอุ่น ขี้เล่น เหมือนเด็กที่อยากแบ่งปันความรู้',
    cat: 'แมวขนเทาขาวลายเสือ ตาโต ใส่เอี๊ยมยีนส์ "Pawtry" บุคลิก: ฉลาด ขี้แอ๊บแบ๊ว นุ่มนวล มี personality น่าหลงรัก',
    custom: 'mascot Pawtry บุคลิกอบอุ่น เป็นมิตร',
  }[mascot_kind] || '';

  const bv = await getBrandVoiceForCourse(course, null);
  const system = `คุณคือ scriptwriter สำหรับ Talking Avatar — mascot Pawtry พูดอธิบายเรื่องอาหารสัตว์เลี้ยง ความยาว ${targetSec} วินาที

📋 Character ที่จะพูด:
${characterDesc}

🎙️ ผู้พูด/น้ำเสียง (สำคัญมาก — เขียนสคริปต์ให้เข้ากับคาแรกเตอร์เสียงนี้):
${personaLine}
→ เพศผู้พูด: ${isMale ? 'ชาย' : 'หญิง'} — ใช้คำลงท้าย สรรพนาม และสำนวนให้ตรงเพศเสมอ

🎯 Brand voice:
${bv ? bv.slice(0, 800) : 'warm, professional, ลงท้าย "ค่ะ/นะคะ" สำหรับ female mascot · เล่าเรื่องเหมือนเพื่อนคุย'}

⚙️ Output rules:
1. **Natural spoken Thai เท่านั้น** สำหรับ Azure TTS อ่าน:
   ❌ ห้าม emoji, ห้าม #, ห้าม "5555+", ห้ามตัวซ้ำ ("มากกกก")
   ❌ ห้ามใช้ตัวเลขอารบิก ถ้าใช้คำไทยได้ (เช่น "สาม" แทน "3")
   ❌ ห้ามใช้คำ medical claim (รักษา, หาย, ดีที่สุด, ปลอดภัย 100%)
   ✅ ประโยค 8-15 คำ/ประโยค · ใช้ comma + จุด เว้นจังหวะ
2. **ลำดับ:** Hook (1 ประโยค ดึงดูด) → เนื้อหา (2-4 ประโยค) → CTA นุ่ม (ทักแชท/แชร์/คอมเมนต์)
3. **น้ำเสียง/สำนวน** ให้ตรงกับคาแรกเตอร์ผู้พูดด้านบน — friendly, conversational, ไม่เป็นทางการเกิน
4. **ความยาวเป้าหมาย:** ${targetChars} ตัวอักษร (±15%) → ~${targetSec} วินาที
5. **ลงท้ายประโยคสุภาพด้วย "${endParticle}"** ให้ตรงเพศผู้พูดเสมอ (warm, brand-safe) — ห้ามสลับเพศ

ตอบเป็น JSON object เท่านั้น:
{
  "script": "ข้อความ Thai พร้อม TTS อ่าน",
  "char_count": <จำนวนตัวอักษรจริง>,
  "duration_estimate_sec": <ประมาณวินาทีที่ TTS จะใช้>,
  "tone": "warm friendly | excited fun | calm informative"
}`;

  const userMsg = `หัวข้อ: "${topic}"
ความยาวเป้าหมาย: ${targetSec} วินาที (~${targetChars} ตัวอักษร)
ผู้พูด: ${personaLine} — เพศ${isMale ? 'ชาย ลงท้าย ครับ/นะครับ' : 'หญิง ลงท้าย ค่ะ/นะคะ'}
Mascot: ${mascot_kind}`;

  try {
    const out = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 1200, json: true });
    const obj = extractJsonObject(out);
    if (!obj || !obj.script) return res.status(500).json({ error: 'AI returned invalid script', raw_head: out.slice(0, 300) });
    obj.char_count = obj.script.length;
    obj.duration_estimate_sec = Math.ceil(obj.char_count / 15);
    obj.ok = true;
    res.json(obj);
  } catch (e) {
    console.error('[ai/avatar-script]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🔍 POST /ai/proofread — AI proofread Thai content ก่อนโพส
// body: { text, type='caption' (hook|caption|hashtag|prompt), course?, context? }
// returns: { issues: [{ severity, type, message, suggestion, before?, after? }], cleaned?, score }
router.post('/proofread', async (req, res) => {
  const { text, type = 'caption', course = 'PFB', context } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
  if (text.length > 5000) return res.status(400).json({ error: 'text too long (max 5000)' });
  if (text.length < 3) return res.json({ ok: true, issues: [], score: 100, cleaned: text });

  const fieldHints = {
    hook: 'Hook = ประโยคแรกเปิดโพส (10-80 ตัวอักษร) ดึงดูดความสนใจ มี emoji ได้ ห้ามขายตรง',
    caption: 'Caption = เนื้อหาโพสหลัก (80-2200 ตัวอักษร) โครงสร้างชัด มี bullet/break ได้',
    hashtag: 'Hashtags = #word ติดกัน ไม่มี space กลาง #PetFood #PawtryThailand 3-15 ตัว',
    prompt: 'Image prompt = ภาษาอังกฤษ บรรยายฉาก lighting composition (ไม่ต้องตรวจสะกดไทย)',
  }[type] || '';

  const bannedHint = course === 'PFB'
    ? '❌ ห้ามคำ medical claim: "รักษา", "หาย", "ดีที่สุด", "ปลอดภัย 100%", "ลดน้ำหนักรับรอง" — อย. ห้าม + FB ban'
    : course === 'PHE'
    ? '❌ ห้ามคำเกินจริง: "รักษาได้แน่นอน", "หาย 100%"'
    : '❌ ห้ามคำเกินจริงในการพยากรณ์ที่ฟันธงเกินไป';

  const system = `คุณคือ Thai language proofreader + content moderator ที่เก่งมากสำหรับเพจอาหารสัตว์เลี้ยง/สินค้า/บริการ
ตรวจ:
1) สะกด/วรรณยุกต์/วรรค (เช่น ค่ะ vs คะ, นะคะ ไม่ใช่ นะค่ะ)
2) คำที่อ่านยาก หรือพิมพ์ผิดเล็กน้อย
3) ${bannedHint}
4) ตัวซ้ำเน้นเกิน (มากกกก, 5555+) — caption + hook โอเค ถ้าใช้พอดี · TTS voice over ห้าม
5) ความเหมาะสม brand voice (warm, professional, ค่ะ)
6) Format issues (hashtag space, emoji ติดกันเกิน, link หลุด)
7) ${fieldHints}

ตอบเป็น JSON object เท่านั้น:
{
  "score": 0-100 (100 = perfect),
  "cleaned": "ข้อความที่แก้ให้แล้ว (ถ้าไม่มี issue ใส่เหมือนเดิม)",
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "type": "spelling" | "banned_word" | "tone" | "repeated_char" | "hashtag_format" | "length" | "punctuation" | "brand_voice" | "other",
      "message": "อธิบายปัญหาสั้น 1 บรรทัด",
      "suggestion": "วิธีแก้ 1 บรรทัด",
      "before": "ส่วนข้อความเดิมที่มีปัญหา (สั้น ≤40 ตัวอักษร)",
      "after": "ส่วนที่แก้แล้ว (สั้น ≤40 ตัวอักษร)"
    }
  ]
}

ถ้าไม่พบปัญหา ตอบ {"score":100,"cleaned":"<original>","issues":[]}`;

  const userMsg = `ตรวจข้อความนี้ (type=${type}, course=${course}):
"""
${text}
"""${context ? `\n\nContext: ${context}` : ''}`;

  try {
    const out = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 1500, json: true });
    const obj = extractJsonObject(out) || { score: 50, cleaned: text, issues: [] };
    if (typeof obj.score !== 'number') obj.score = 50;
    if (!Array.isArray(obj.issues)) obj.issues = [];
    if (typeof obj.cleaned !== 'string') obj.cleaned = text;
    obj.ok = true;
    obj.type = type;
    res.json(obj);
  } catch (e) {
    console.error('[ai/proofread]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 📤 POST /ai/upload-temp-audio — upload base64 audio → Supabase Storage public bucket → return URL
// ใช้สำหรับ Talking Avatar mode (fal.ai ต้อง public URL)
// body: { audio_base64, mime?='audio/mp3', name?='avatar-<ts>.mp3' }
// returns: { url, path, bucket }
const AVATAR_AUDIO_BUCKET = 'avatar-audio-temp';
router.post('/upload-temp-audio', async (req, res) => {
  const { audio_base64, mime = 'audio/mp3', name } = req.body || {};
  if (!audio_base64) return res.status(400).json({ error: 'audio_base64 required' });
  if (!supabase) return res.status(400).json({ error: 'Supabase required for storage upload' });

  try {
    const buf = Buffer.from(audio_base64, 'base64');
    if (buf.length === 0) return res.status(400).json({ error: 'invalid base64' });
    if (buf.length > 25 * 1024 * 1024) return res.status(400).json({ error: 'audio too large (max 25MB)' });

    const ext = mime.includes('wav') ? 'wav' : mime.includes('ogg') ? 'ogg' : 'mp3';
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const filename = name || `avatar-${ts}-${rand}.${ext}`;

    // 1) Ensure bucket exists (idempotent — ignore "Bucket already exists" error)
    try {
      const { error: createErr } = await supabase.storage.createBucket(AVATAR_AUDIO_BUCKET, {
        public: true,
        fileSizeLimit: 26214400, // 25 MB
        allowedMimeTypes: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'],
      });
      if (createErr && !/already exists/i.test(createErr.message || '')) {
        console.warn('[upload-temp-audio] createBucket warn:', createErr.message);
      }
    } catch {}

    // 2) Upload file
    const { error: upErr } = await supabase.storage
      .from(AVATAR_AUDIO_BUCKET)
      .upload(filename, buf, { contentType: mime, upsert: false, cacheControl: '3600' });
    if (upErr) throw new Error(`storage upload: ${upErr.message}`);

    // 3) Public URL
    const { data: pubData } = supabase.storage.from(AVATAR_AUDIO_BUCKET).getPublicUrl(filename);
    const url = pubData?.publicUrl;
    if (!url) throw new Error('no publicUrl from supabase storage');

    res.json({ ok: true, url, path: filename, bucket: AVATAR_AUDIO_BUCKET, bytes: buf.length, mime });
  } catch (e) {
    console.error('[upload-temp-audio]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🎬 Mascot asset storage — เก็บ pose-sheet / mascot ขึ้น Supabase Storage (ทีมแชร์ได้)
const MASCOT_ASSET_BUCKET = 'mascot-assets';

// POST /ai/upload-mascot-asset — body { image_base64, name } → public URL (upsert)
router.post('/upload-mascot-asset', async (req, res) => {
  const { image_base64, name } = req.body || {};
  if (!image_base64) return res.status(400).json({ error: 'image_base64 required' });
  if (!name || !/^[\w.-]+$/.test(name)) return res.status(400).json({ error: 'valid name required (a-z0-9._-)' });
  if (!supabase) return res.status(400).json({ error: 'Supabase required' });
  try {
    // รับได้ทั้ง data URL และ base64 ดิบ
    const b64 = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64;
    const buf = Buffer.from(b64, 'base64');
    if (buf.length === 0) return res.status(400).json({ error: 'invalid base64' });
    if (buf.length > 12 * 1024 * 1024) return res.status(400).json({ error: 'image too large (max 12MB)' });

    try {
      const { error: ce } = await supabase.storage.createBucket(MASCOT_ASSET_BUCKET, {
        public: true, fileSizeLimit: 12582912,
      });
      if (ce && !/already exists/i.test(ce.message || '')) console.warn('[mascot-asset] createBucket:', ce.message);
    } catch {}

    const fname = name.endsWith('.png') ? name : name + '.png';
    const { error: ue } = await supabase.storage
      .from(MASCOT_ASSET_BUCKET)
      .upload(fname, buf, { contentType: 'image/png', upsert: true, cacheControl: '3600' });
    if (ue) throw new Error('upload: ' + ue.message);

    const { data: pub } = supabase.storage.from(MASCOT_ASSET_BUCKET).getPublicUrl(fname);
    res.json({ ok: true, url: pub?.publicUrl, name: fname, bytes: buf.length });
  } catch (e) {
    console.error('[upload-mascot-asset]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /ai/mascot-asset?name= — เช็คว่ามี asset ใน Storage ไหม → คืน URL (หรือ null)
router.get('/mascot-asset', async (req, res) => {
  const name = String(req.query.name || '');
  if (!name || !/^[\w.-]+$/.test(name)) return res.status(400).json({ error: 'valid name required' });
  if (!supabase) return res.json({ url: null });
  try {
    const fname = name.endsWith('.png') ? name : name + '.png';
    const { data, error } = await supabase.storage.from(MASCOT_ASSET_BUCKET).list('', { search: fname });
    if (error || !data || !data.find(f => f.name === fname)) return res.json({ url: null });
    const { data: pub } = supabase.storage.from(MASCOT_ASSET_BUCKET).getPublicUrl(fname);
    res.json({ url: pub?.publicUrl || null });
  } catch (e) {
    res.json({ url: null });
  }
});

// 🔊 POST /ai/tts — Azure Speech Thai voice synthesis (per-course voice mapping)
// body: { text, course='PFB', voice?, rate?, pitch?, format? }
// returns: { audio_base64, mime: 'audio/mp3', bytes, voice, duration_estimate_sec }
// requires env: AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (e.g. 'southeastasia')
const AZURE_TTS_VOICES = {
  PFB: 'th-TH-PremwadeeNeural',  // female warm — Pawtry style
  PHE: 'th-TH-NiwatNeural',      // male confident — mentoring tone
  GURU: 'th-TH-NiwatNeural',     // male empowering — อาจารย์หนึ่งครับ
};
const AZURE_TTS_RATE = {
  PFB: 'medium',  // natural Thai pace — เร็วไปจะฟังเหน่อ
  PHE: 'medium',  // deliberate mentoring tone
  GURU: 'medium', // calm empowering pace
};
function escapeXml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// 🧹 Normalize Thai text for TTS — กัน Azure อ่านผิด (ก ซ้ำ, emoji, hashtag, etc.)
function normalizeThaiForTts(text) {
  let s = String(text ?? '');
  // ตัด emoji + symbol pictographic
  s = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F0FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '');
  // ตัด hashtag
  s = s.replace(/#[^\s#]+/g, '');
  // ลด ก ซ้ำ 3+ → "ก" + " มาก" (สำหรับเน้น) — เฉพาะตัวอักษรไทย
  // เช่น "มากกกกก" → "มาก" หรือ "มาก ๆ"
  s = s.replace(/([ก-ฮ])\1{2,}/g, '$1');
  // ลดสระ/วรรณยุกต์ซ้ำเกิน 2 ตัว (เช่น "ดีย์ยยยย")
  s = s.replace(/([ะ-ํ])\1{1,}/g, '$1');
  // ลด "5555+" → "" (ภาษาวัยรุ่นใน chat → อ่านแล้วงง)
  s = s.replace(/[5๕]{3,}/g, '');
  // ใส่ space ก่อน/หลังภาษาอังกฤษกลางคำไทย — TTS pause ได้ถูก
  s = s.replace(/([฀-๿])([A-Za-z])/g, '$1 $2').replace(/([A-Za-z])([฀-๿])/g, '$1 $2');
  // เก็บ whitespace ให้สะอาด
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Azure Speech Thai region (southeastasia) supports only 3 Neural voices.
// Map any unknown / non-existent voice to a safe default so a stale frontend
// value (e.g. legacy 'TonyNeural') doesn't 400 the user.
const AZURE_TH_VOICES = new Set([
  'th-TH-PremwadeeNeural',
  'th-TH-NiwatNeural',
  'th-TH-AcharaNeural',
]);

router.post('/tts', async (req, res) => {
  const { text, course = 'PFB', voice, rate, pitch = '+0%', format } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required (string)' });
  if (text.length > 5000) return res.status(400).json({ error: 'text too long — max 5000 chars per call (Azure limit)' });

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || 'southeastasia';
  if (!key) return res.status(400).json({ error: 'AZURE_SPEECH_KEY not set — ตั้ง env ก่อน (ดู .env.example)' });

  let selectedVoice = voice || AZURE_TTS_VOICES[course] || AZURE_TTS_VOICES.PFB;
  // Safety: if frontend sent an unknown voice (typo, removed name, etc.) fall back
  // to Niwat (male) for ชาย-mapped names or Premwadee (female) otherwise.
  if (!AZURE_TH_VOICES.has(selectedVoice)) {
    const fallback = /tony|niwat|guru|male/i.test(String(selectedVoice)) ? 'th-TH-NiwatNeural' : 'th-TH-PremwadeeNeural';
    console.warn(`[ai/tts] unknown voice '${selectedVoice}' → falling back to ${fallback}`);
    selectedVoice = fallback;
  }
  const prosodyRate = rate || AZURE_TTS_RATE[course] || 'medium';
  const outputFormat = format || 'audio-24khz-48kbitrate-mono-mp3';

  // 1) ทำความสะอาดข้อความก่อน (ลด ก ซ้ำ, emoji, hashtag)
  const cleaned = normalizeThaiForTts(text);
  // 2) Escape XML
  //    ⚠️ ก่อนหน้านี้เคยใส่ <phoneme alphabet="ipa"> สำหรับ ค่ะ/ครับ —
  //    แต่ th-TH Neural voices (Premwadee/Niwat) reject IPA → Azure คืน 400 เปล่า
  //    ปล่อยให้ engine prosody natural เอง (วรรณยุกต์ใน text ก็ถูกต้องอยู่แล้ว)
  const escaped = escapeXml(cleaned);

  // 3) ใส่ SSML <break> หลัง punctuation — 200ms หลังจุด · 100ms หลัง comma
  const withBreaks = escaped
    .replace(/([\.\!\?])\s*/g, '$1<break time="200ms"/>')
    .replace(/([,;:])\s*/g, '$1<break time="100ms"/>');

  // SSML — Azure REST API บังคับใส่ default xmlns (ไม่งั้น 400 silent)
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="th-TH">
  <voice name="${selectedVoice}">
    <prosody rate="${prosodyRate}" pitch="${pitch}">${withBreaks}</prosody>
  </voice>
</speak>`;

  try {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': outputFormat,
        'User-Agent': 'oem-content-factory',
      },
      body: ssml,
    });
    if (!r.ok) {
      const errBody = await r.text();
      const errHeader = r.headers.get('x-microsoft-azure-cognitiveservices-error') || '';
      const detail = [errBody.slice(0, 300), errHeader].filter(Boolean).join(' | ') || '(empty body)';
      console.error('[ai/tts] Azure', r.status, detail, 'voice=' + selectedVoice, 'region=' + region);
      const hintBase = r.status === 401 ? 'AZURE_SPEECH_KEY ผิดหรือหมดอายุ'
        : r.status === 403 ? 'Region/quota หมด — เช็ค F0 free tier 500K chars/เดือน'
        : r.status === 404 ? 'AZURE_SPEECH_REGION ผิด (เช็คใน Azure portal Keys & Endpoint)'
        : r.status === 400 ? `SSML ผิดหรือ voice "${selectedVoice}" ไม่รองรับใน region "${region}" — ลอง region=southeastasia`
        : '';
      return res.status(500).json({ error: `Azure TTS ${r.status}: ${detail}`, hint: hintBase, voice: selectedVoice, region });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.json({
      ok: true,
      course,
      voice: selectedVoice,
      rate: prosodyRate,
      audio_base64: buf.toString('base64'),
      mime: 'audio/mp3',
      bytes: buf.length,
      // Thai TTS pace ~14-16 ตัวอักษร/วินาที at +0% rate; +5% เร็วขึ้นเล็กน้อย
      duration_estimate_sec: Math.max(2, Math.ceil(text.length / 15)),
      chars: text.length,
    });
  } catch (e) {
    console.error('[ai/tts]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🎬 POST /ai/video-script — generate 9:16 Reel script (hook + body + cta) for a topic
// body: { course='PFB', topic, brandVoice?, duration_sec=45, brief? }
//   - brief (optional): full creative brief ยาว — เมื่อใส่ AI จะ preserve character + per-scene cinematography
// returns: { hook, body[], cta, bgm_mood, total_duration_sec, voiceover_full, subtitle_full,
//            master_character?, master_style?, master_mood? }
//   - per scene อาจมี enriched fields: camera_direction, lighting_mood, character_action
router.post('/video-script', async (req, res) => {
  const { course = 'PFB', topic, brandVoice, duration_sec, brief } = req.body || {};
  if (!topic && !brief) return res.status(400).json({ error: 'topic or brief required' });
  if (!['PFB', 'PHE', 'GURU'].includes(course)) return res.status(400).json({ error: 'course must be PFB | PHE | GURU' });
  const targetSec = Math.min(Math.max(parseInt(duration_sec) || 45, 8), 90);
  const hasBrief = typeof brief === 'string' && brief.trim().length > 50;

  const reelRules = VIDEO_REEL_RULES[course];
  const bv = await getBrandVoiceForCourse(course, brandVoice);
  const system = buildSystemPrompt(bv, course);

  const briefBlock = hasBrief ? `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CREATIVE BRIEF (master spec — ผูก character/style/cinematography ทุก scene)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${String(brief).slice(0, 4000)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️ ใช้ brief เป็น master spec:
- สกัด master_character (ตัวละครหลัก — ลักษณะคงเส้นคงวาทุก scene)
- สกัด master_style (สไตล์ภาพรวม — cinematic, documentary, editorial ฯลฯ)
- สกัด master_mood (mood + color grading)
- แต่ละ scene ใส่ camera_direction (camera move + lens), lighting_mood, character_action
- รักษาลำดับ + วิธีจัดเฟรมตาม brief — voiceover_thai + subtitle_thai สรุปจากเนื้อหา brief
- ถ้า brief มี hook text/subtitle เฉพาะ ให้ใช้ตามนั้น
- จำนวน scenes ตาม brief (ไม่บังคับ 3-5 ถ้า brief สั่งมากกว่า)
` : '';

  const userMsg = `${hasBrief ? '' : `หัวข้อ Reel: "${topic}"\n`}ความยาวเป้าหมาย: ~${targetSec} วินาที
${briefBlock}
${reelRules}

⚙️ Output rules:
- voiceover_thai = ประโยคที่ TTS จะพูด — **natural spoken Thai เท่านั้น** (ไม่ใช่ภาษา chat/social):
  ❌ ห้ามใส่ตัวอักษรซ้ำเน้น (เช่น "มากกกก", "ดีย์ยย", "นะคะะ", "55555") → TTS จะอ่านทุกตัว ฟังประหลาด
     แทนด้วย: "มาก ๆ" หรือใช้คำหนักแทน เช่น "มากที่สุด" "อย่างมาก"
  ❌ ห้ามใส่ emoji, ห้าม #, ห้ามตัวเลข Arabic ที่ไม่จำเป็น (ใช้คำไทยถ้าได้ เช่น "สาม" แทน "3")
  ❌ ห้ามใช้คำย่อภาษาอังกฤษกลางประโยคโดยไม่มี space (เช่น "OEMอาหาร" → "OEM อาหาร")
  ✅ ใช้ comma + จุด แบ่งประโยคเพื่อให้ TTS เว้นจังหวะถูก (เช่น "คำตอบคือ สตอรี่ค่ะ ที่ทำให้แบรนด์ขายได้")
  ✅ ประโยค 8-15 คำ/ประโยค — ไม่ยาวเกิน 1 หายใจ
- subtitle_thai = ข้อความที่จะแสดงบนจอ (สั้น 4-12 คำต่อบรรทัด, ใส่ emoji + ก ซ้ำเพื่อเน้นได้เพราะไม่ออกเสียง)
- visual_cue = คำอธิบาย scene เป็นภาษาไทย (สั้น 1 บรรทัด — ใช้คำสำคัญที่ image gen จะใช้ต่อ)
${hasBrief ? '- camera_direction = ภาษาอังกฤษ (camera move + lens + composition) — สำหรับ image gen ใช้ต่อ\n- lighting_mood = ภาษาอังกฤษ (light + color grade)\n- character_action = ตัวละครทำอะไรใน scene นี้\n' : ''}- duration_sec รวมแล้วใกล้ ${targetSec}s (±5s)
- จำนวน body scenes: ${hasBrief ? 'ตาม brief' : '3-5 ฉาก'}
- ห้ามใส่ # / hashtag / emoji ใน voiceover

ตอบเป็น JSON object เท่านั้น:
{${hasBrief ? `
  "master_character": "ลักษณะตัวละครหลัก (ภาษาอังกฤษ) — ใช้ทุก scene เพื่อความ consistent",
  "master_style": "ภาพรวม style ภาษาอังกฤษ (cinematic, documentary ฯลฯ)",
  "master_mood": "mood + color grading ภาษาอังกฤษ",` : ''}
  "hook": {
    "duration_sec": 4,
    "voiceover_thai": "ประโยคพูดสำหรับ TTS",
    "subtitle_thai": "ข้อความบนจอ + emoji",
    "visual_cue": "scene description"${hasBrief ? `,
    "camera_direction": "close-up, slow zoom-in, handheld",
    "lighting_mood": "warm cinematic, soft DOF",
    "character_action": "what subject does"` : ''}
  },
  "body": [
    { "duration_sec": 8, "voiceover_thai": "...", "subtitle_thai": "...", "visual_cue": "..."${hasBrief ? ', "camera_direction": "...", "lighting_mood": "...", "character_action": "..."' : ''} }
  ],
  "cta": {
    "duration_sec": 6,
    "voiceover_thai": "...",
    "subtitle_thai": "...",
    "visual_cue": "..."${hasBrief ? `,
    "camera_direction": "...",
    "lighting_mood": "...",
    "character_action": "..."` : ''}
  },
  "bgm_mood": "upbeat editorial | cinematic documentary | mystical ambient | emotional warm",
  "total_duration_sec": ${targetSec}
}`;

  try {
    const text = await callOpenRouter([{ role: 'user', content: userMsg }], system, { max_tokens: 2500, json: true });
    const obj = extractJsonObject(text);
    if (!obj || !obj.hook || !Array.isArray(obj.body) || !obj.cta) {
      return res.status(500).json({ error: 'AI returned invalid script JSON', raw_head: text.slice(0, 300) });
    }
    // คำนวณ total_duration_sec จริง (กัน AI ใส่ผิด)
    const actualTotal = (obj.hook.duration_sec || 0) + obj.body.reduce((s, b) => s + (b.duration_sec || 0), 0) + (obj.cta.duration_sec || 0);
    obj.total_duration_sec = actualTotal;
    // ประกอบ voiceover_full + subtitle_full สำหรับใช้ใน TTS / subtitle render ตอน Phase 2
    obj.voiceover_full = [obj.hook.voiceover_thai, ...obj.body.map(b => b.voiceover_thai), obj.cta.voiceover_thai].filter(Boolean).join(' ');
    obj.subtitle_full = [obj.hook.subtitle_thai, ...obj.body.map(b => b.subtitle_thai), obj.cta.subtitle_thai].filter(Boolean).join(' | ');
    obj.course = course;
    obj.topic = topic || (hasBrief ? String(brief).slice(0, 100).replace(/\n+/g, ' ').trim() : '');
    obj.has_brief = hasBrief;
    res.json(obj);
  } catch (e) {
    console.error('[ai/video-script]', e.message);
    res.status(500).json({ error: e.message });
  }
});

function stubTopics(course, count) {
  const pfb = [
    { topic: 'ทำไม 90% ของแบรนด์อาหารสัตว์ใหม่เจ๊งใน 2 ปี', pillar: 'pain', suggested_framework: 'F1' },
    { topic: 'โรงงาน OEM อาหารสัตว์ในไทย — ราคาจริง MOQ จริง', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: 'อาหารเกรดสัตวแพทย์ vs อาหารทั่วไป ต่างกันยังไง', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: 'จากร้าน Pet Shop เล็ก ๆ สู่แบรนด์ส่งออก', pillar: 'case', suggested_framework: 'F1' },
    { topic: 'เบื้องหลังเข้าโรงงานอาหารเปียก — Day 7', pillar: 'bts', suggested_framework: 'F1' },
  ];
  const phe = [
    { topic: '80% ของโรงแรมหมาแมวเปิดใหม่เจ๊งใน 2 ปี', pillar: 'pain', suggested_framework: 'F2' },
    { topic: 'Air Circulation พังแค่ตัวแปรเดียว = สัตว์ป่วยทั้งโรงแรม', pillar: 'knowledge', suggested_framework: 'F2' },
    { topic: 'Feasibility โรงแรมหมาแมว — คำนวณก่อนลงเงิน', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: 'จากบ้าน 1 หลัง สู่โรงแรมหมาแมว 30 ห้อง', pillar: 'case', suggested_framework: 'F1' },
    { topic: 'ลงพื้นที่จริงกับผู้เชี่ยวชาญด้านการก่อสร้าง', pillar: 'bts', suggested_framework: 'F1' },
  ];
  const guru = [
    { topic: '3 พฤติกรรมที่ขวางทางรวย — มูแล้วไม่ปังเพราะข้อนี้', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '5 สัญญาณว่าดวงคุณกำลังจะเปลี่ยน — สังเกตให้ดี', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '4 ของมงคลที่ควรพกติดตัวประจำเดือนนี้', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '3 ข้อผิดพลาดเวลาขอพร — เทพไม่ได้ยินเพราะแบบนี้', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: 'ทำไมมูเท่าไหร่ก็ไม่ขึ้น — เช็ก 5 จุดที่หลายคนพลาด', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '3 mindset สายมูที่ต้องมี ถ้าอยากให้ดวงพุ่ง', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '5 พลังลบที่ทำให้โชคลาภหนี — รีบเคลียร์ด่วน', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: 'การ์ดศักดิ์สิทธิ์ คุรุเทพ — ช่วยเสริมดวงยังไง?', pillar: 'promo', suggested_framework: 'F1' },
    { topic: '3 ช่วงเวลาทองที่ควรขอพร — แล้วได้ผลจริง', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '4 นิสัยคนดวงดี — ลองสังเกตคนรอบตัวคุณ', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '5 สิ่งห้ามทำหลังขอพร — ทำแล้วพรหาย', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: 'รีวิวลูกค้าจริง — บูชาการ์ดคุรุเทพแล้วชีวิตเปลี่ยน', pillar: 'case', suggested_framework: 'F1' },
    { topic: '3 วิธีตั้งจิตให้แรง — ขอแล้วเทพได้ยินชัด', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '5 พฤติกรรมในบ้าน ที่ทำให้ทรัพย์รั่ว', pillar: 'knowledge', suggested_framework: 'F1' },
    { topic: '4 ข้อต้องเช็ก ก่อนเริ่มต้นปีหน้าให้ปัง', pillar: 'knowledge', suggested_framework: 'F1' },
  ];
  const pool = course === 'GURU' ? guru : course === 'PHE' ? phe : pfb;
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

export default router;
