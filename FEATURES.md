# PostPost — AI Content Command Center
## คู่มือ Features ครบทุกความสามารถ

> **TL;DR:** PostPost ให้คุณสั่ง AI ปั้นคอนเทนต์ครบจบ — ตั้งแต่ดึงสินค้า → คิดหัวข้อ → เขียนบทความ → สร้างรูป → ทำวิดีโอ → จัดตารางโพสต์ → โพสต์อัตโนมัติบน Facebook + Instagram + TikTok

**Production URL:** https://post-post-seven.vercel.app
**Tech stack:** Express + Vercel · Supabase · OpenRouter (Claude Sonnet 4.5) · Google Gemini · fal.ai · Azure Speech · Pexels

---

## 📐 โครงสร้าง 12 หน้าหลัก

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKSPACE                          OPERATIONS                  │
│  ─────────                          ─────────                   │
│  1. Profile          (Brand)        7.  Automation Log          │
│  2. Topic Bank       (AI ideas)     8.  Analytics               │
│  3. สร้าง Caption    (Copy)         9.  ปฏิทิน (Calendar)        │
│  4. สร้าง Creative   (Images)       10. คลังคอนเทนต์ (Library)   │
│  5. Talking Avatar   (Video w/ AI)                              │
│  6. Text to Video    (Video gen)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

# 🏢 1. PROFILE — แบรนด์ + สินค้า + ช่องทาง

## 1.1 Multi-Brand Workspace
- รองรับ **5 แบรนด์** ในบัญชีเดียว (default tier: Pro)
- แต่ละแบรนด์มี **ของตัวเอง:** logo / ชื่อ / ประเภทธุรกิจ / คำอธิบาย / voice / archetype / สินค้า / ช่องทาง
- สลับแบรนด์ → AI โหลด context ของแบรนด์นั้นทันที (Voice + Archetype + สินค้า + channels)
- เพิ่ม / ลบ / เปลี่ยนโลโก้แบรนด์ได้ทุกอัน

## 1.2 Brand Voice (เลือก 3 จาก 11)
อบอุ่น · เป็นมิตร · เป็นกันเอง · ขี้เล่น · มืออาชีพ · เชี่ยวชาญ · สร้างแรงบันดาลใจ · ขรึม · หรูหรา · เห็นใจ · กล้า

## 1.3 Brand Archetype (12 ตัวเลือก)
Hero · Sage · Caregiver · Magician · Rebel · Lover · Jester · Innocent · Explorer · Creator · Ruler · Everyman
- มี popup "คู่มือ Archetype" — อธิบายแต่ละตัวพร้อมตัวอย่างแบรนด์ดัง

## 1.4 AI Brand Description Writer
- กดปุ่ม **"✨ ให้ AI ช่วยเขียน"** → AI สร้าง 3 แบบให้เลือก:
  - แบบ 1 — ละเอียดครบถ้วน
  - แบบ 2 — สั้น กระชับ
  - แบบ 3 — สไตล์เล่าเรื่อง
- AI ใช้ businessType เป็น ground truth (ไม่หลุดประเภทธุรกิจ)
- ป้องกัน hallucination เมื่อสลับ businessType (ใช้แค่โทน ไม่เอาเนื้อหาเก่า)

## 1.5 Shopee Auto-Sync
- วาง URL ร้าน Shopee (e.g. `https://shopee.co.th/ajarnnuengkuruthep#product_list`)
- กด **"ดึงข้อมูลใหม่"** → AI ดึง 8-180 สินค้า:
  - ชื่อ · ราคา · ราคาก่อนลด · จำนวนขาย · เรตติ้ง · รูป 1-6 ใบต่อสินค้า · description 3000 ตัว
- **2 modes:**
  - **Local mode** (ที่เครื่อง — เร็ว ~14 วินาที, ใช้ Chrome profile session ที่ login Shopee)
  - **Cloud mode** (Render worker — ช้า 1-3 นาที, ไม่ต้องเปิดเครื่อง)
- "🖥 Use my machine" toggle — Vercel เรียก localhost:3000 ตรง ๆ ผ่าน CORS (same JWT secret)
- Async pattern: submit ได้ใน <2s → poll status (ไม่ติด Vercel 60s timeout)

## 1.6 Social Channel OAuth
- **Facebook Page** + **Instagram Business** — เชื่อมพร้อมกัน OAuth ครั้งเดียว (popup login + consent → page picker → save)
- **TikTok** — OAuth popup (`/api/tiktok/oauth/start`) → callback postMessage → save token
- เก็บ token + page_id + IG business id ลง `brand.channelInfo` (per-brand isolation)
- Scopes: `pages_show_list, pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish, business_management`

---

# 💡 2. TOPIC BANK — AI คิดหัวข้อ 30 หัว/เดือน

## 2.1 หัวข้อแยกตามจุดประสงค์
- **Educate** — ให้ความรู้ (เช่น "5 สัญญาณดวงการเงินอ่อนแอ")
- **Sell** — โปรโมตขาย (เช่น "ลด 50% เฉพาะ 11.11")
- **Story** — เล่าเรื่องแบรนด์ (เช่น "วันแรกที่เปิดร้าน")
- **Trend** — เกาะเทรนด์ (เช่น "ทำไม Gen Z ถึงเชื่อ horoscope")

## 2.2 Filter + Sort
- ตัวกรองตามหมวด
- ค้นหา keyword
- สลับโหมด list ↔ grid

## 2.3 ใช้หัวข้อ → คลิกเดียวข้ามไปหน้า Caption + ขนข้อมูลแบรนด์ทั้งหมดให้

---

# ✍️ 3. สร้าง CAPTION — Hook + Caption + Hashtag + Article

## 3.1 ปุ่ม "✨ สร้างทั้งหมด" → AI สร้างพร้อมกัน 4 อย่าง:

### 3.1.1 Hook 3 มุม
- แต่ละ hook มี text + angle (เช่น "curiosity", "urgency", "social proof")
- เลือก hook ใดก็ได้ → ใช้ใน post preview

### 3.1.2 Caption เต็มโพสต์
- ภาษาไทยลื่นไหล + emoji เหมาะ
- ใช้ Brand Voice + Archetype จาก Profile
- 150 คำเฉลี่ย (ปรับได้)

### 3.1.3 Hashtag 10-14 ตัว
- mix general + niche + branded
- ไม่ซ้ำ / ห้ามผิดสะกด

### 3.1.4 บทความ 250 คำ
- สำหรับโพสต์ Facebook ยาว / blog / SEO

## 3.2 Image Prompts (สำหรับ Creative page)
- AI คิด prompt 1-10 รูปอัตโนมัติ
- ถ้าหัวข้อเป็นรายการตัวเลข ("5 สัญญาณ") → สไลด์ 1 = ปก, สไลด์ 2-N = ข้อ 1-N (ห้ามรวมข้อในสไลด์เดียว!)
- ใส่เลขข้อชัดเจนบนรูป
- Style ทุกสไลด์สอดคล้องกัน (ชุดเดียวกัน)

## 3.3 Post Preview
- การ์ดเลียนแบบ feed Facebook/IG
- เห็น hook + caption + hashtag เหมือนของจริง
- เปลี่ยน aspect ratio: 1:1 / 4:5 / 9:16

---

# 🎨 4. สร้าง CREATIVE — AI ปั้นรูป 1-10 สไลด์

## 4.1 รูปแบบ Creative
- **รูปเดียว** — 1 ภาพ เน้น hero shot
- **อัลบั้ม** — หลายสไลด์ · 1 รูป/สไลด์

## 4.2 AI Image Model
- **Gemini** (`google/gemini-3.1-flash-image-preview`) — ฟรี/ราคาถูก, Thai text สวย
- **GPT** (`openai/gpt-5.4-image-2`) — premium $0.98/รูป
- เลือกได้ตามต้องการ

## 4.3 Image Count
- เลือก 1-10 รูปได้
- AI สร้างให้ครบจำนวนที่ขอเป๊ะ ๆ (มี safety net retry ถ้า AI ส่งกลับมาน้อยกว่า)

## 4.4 Auto-flow
- กด **"สร้างทั้งหมด"** ครั้งเดียว →
  1. AI เขียน Hook + Caption + Hashtag + Article + image prompts
  2. AI สร้างรูปทั้งหมดตาม prompts ทีละใบ
  3. สลับไปดูใน Post Preview ได้ทันที

## 4.5 Post Preview Carousel
- เลื่อนซ้าย-ขวา ดูทุกสไลด์
- Dot indicators
- เลขสไลด์ "1/6" / "2/6"
- Aspect ratio toggle (1:1 / 4:5 / 9:16) — ทุก aspect crop preview ทันที

## 4.6 Export PNG
- ดาวน์โหลด PNG เดี่ยว (current slide) ที่อัตราส่วนที่เลือก (1080×1080 / 1080×1350 / 1080×1920)
- ดาวน์โหลดทั้งอัลบั้ม (multi-file) — cover crop ทุกรูปเป็น aspect เดียวกัน

---

# 🎭 5. TALKING AVATAR — AI Presenter พูดได้

## 5.1 เลือก Presenter (4 default + custom)
- **มินตรา** หญิงไทย 28
- **ภูมิ** ชายไทย 35
- **น้องโรส** หญิง 22
- **อาจารย์วุฒิ** อาวุโส 55
- **เพิ่มเอง:**
  - 🎨 **"สร้างคนใหม่ด้วย AI"** — ใส่ description ภาษาไทย → AI gen portrait (Gemini)
  - 📤 **"อัปโหลดรูปคน"** — paste รูปตัวเองได้ (5MB max)
- **Persistence:** custom avatars เก็บใน localStorage + IDB → reload หน้าก็ยังอยู่
- มีปุ่ม `×` ลบ custom avatar (built-in ลบไม่ได้)

## 5.2 Voice (Azure TTS Thai)
- **Premwadee** หญิง อบอุ่น (สกินแคร์ ความงาม)
- **Achara** หญิง เป็นมิตร (lifestyle แม่และเด็ก)
- **Niwat** ชาย มืออาชีพ (ธุรกิจ การเงิน)
- **อาจารย์เทพ** ชาย ขรึม น่าเชื่อถือ (สายมู ดูดวง) — uses Niwat base
- **พี่ตี้** ชาย เป็นกันเอง (casual บันเทิง) — uses Niwat base
- **Backend safety net:** voice ที่ไม่มีใน Azure → auto-fallback ไป NiwatNeural / PremwadeeNeural

## 5.3 Speed / Pitch (3×3 = 9 combinations)
- ช้า · ปกติ · เร็ว
- ต่ำ · ปกติ · สูง

## 5.4 AI Script Writer
- กด **"ให้ AI เขียนให้"** → AI เขียนสคริปต์ 30 วินาที (≤ 60 วินาทีรอง Reels)
- AI รู้จัก voice ที่เลือก → ลงท้าย "ครับ" สำหรับ Niwat / "ค่ะ" สำหรับ Premwadee
- เนื้อหาตรงโทนแบรนด์ + topic ที่ระบุ

## 5.5 Azure TTS Playback
- ปุ่ม **"🔊 ฟังเสียง (Azure TTS)"** → render ใน 1-3 วินาที
- เล่นทันทีในหน้า + ปุ่มดาวน์โหลด MP3
- รองรับ text up to 5000 ตัว/call (Azure limit)
- Normalizer ทำความสะอาดข้อความ:
  - ตัด emoji / hashtag / `5555` / ก ซ้ำ
  - เว้นช่องระหว่างไทย-อังกฤษ
  - SSML `<break>` หลังจุด/comma

## 5.6 สร้างวิดีโอ MP4 — 2 path

### Path A: fal.ai Lip-Sync (real mouth movement)
- ต้องตั้ง `FAL_KEY` ใน env
- รองรับ 5 models:
  - `fal-ai/infinitalk` ⭐ default — $0.20, ปากขยับธรรมชาติ
  - `fal-ai/sadtalker` — $0.10 (cheapest)
  - `fal-ai/bytedance/omnihuman/v1.5` — $0.50, premium realistic
  - `fal-ai/bytedance/omnihuman` — $0.50
  - `veed/fabric-1.0` — $0.30
- Architecture: Vercel-direct (no worker-render) — submit → poll → ได้ video URL
- Backend อัพรูป + เสียง → Supabase Storage → submit fal.ai queue → poll

### Path B: Client-side Canvas (fallback, ไม่ต้อง FAL_KEY)
- Canvas + MediaRecorder ใน browser — สร้างวิดีโอ MP4/WEBM ที่เครื่อง
- **OEM-style background**: Pexels stock video bg (ตาม brand bizType)
- Scene transitions ทุก ~6 วินาที + scene title pills
- Avatar circle bottom-right (OEM corner overlay style)
- Scrolling caption + progress bar
- "ON AIR" pulse red dot
- ทุกอย่างทำใน browser — ไม่ใช้ backend, ไม่มีค่าใช้จ่าย

## 5.7 Phone Preview Live
- กรอบโทรศัพท์ขวาแสดง preview แบบจริง
- พื้นหลัง: Pexels video (auto-fetch ตามแบรนด์) → fallback gradient theme
- Avatar รูปจริง / brand name + product name (จาก state)
- 3 states: idle (พร้อม preview) / loading (% + spinner) / video (autoplay loop)

---

# 🎬 6. TEXT-TO-VIDEO — 9 โมเดล AI ปั้นวิดีโอจากข้อความ

## 6.1 Model Picker (9 ตัวเลือก)

| Model | Provider | ราคา | จุดเด่น |
|---|---|---|---|
| **Wan 2.2** ⭐ default | fal.ai | $0.30 | BEST DEAL · เร็ว ลื่น |
| Veo 2 | Google | **FREE** 2-5/วัน | ฟรี (มีโควต้า) |
| Luma Dream Machine | fal.ai | $0.40 | Character consistency |
| Wan 2.5 (preview) | fal.ai | $0.40 | ใหม่ ดีกว่า 2.2 |
| Hailuo 02 | fal.ai | $0.45 | Cinematic 6 วินาที |
| Kling 2.5 Turbo Pro | fal.ai | $0.70 | Premium cinematic |
| Veo 3 Fast | Google | $0.80 | ลื่น คมชัด |
| Veo 3 Pro | Google | $3.20 | คุณภาพสูงสุด |
| Veo 3.1 Pro (preview) | Google | $3.20+ | ใหม่สุด |

## 6.2 Visual Style (5 styles)
- **Creator/UGC** ⭐ default — คนถือสินค้าทำคอนเทนต์ (selfie/3-quarter angle)
- **Cinematic** — ภาพยนตร์ filmic
- **Lifestyle** — ใช้จริงในชีวิต
- **Product** — เน้นสินค้า no person
- **Anime/3D** — สไตล์การ์ตูน

## 6.3 AI Prompt Writer
- กด **"ให้ AI ปั้น Prompt"** → AI เขียน English Veo prompt ~70-110 คำ
- รู้จัก Creator/UGC style → บังคับใส่คนในเฟรม
- รู้จัก reference image → ใส่ประโยค "Reference image lock:" (ป้องกัน AI invent ลายไพ่ผิด)

## 6.4 Reference Image
- เลือกจากสินค้าที่ scrape มาจาก Shopee
- หรือ upload เอง (5MB max)
- ส่งเป็น base64 ไป backend → upload Supabase Storage → ใช้ URL ใน Veo image_url / fal.ai image_url
- Veo / Wan / Kling support image-to-video conditioning

## 6.5 Aspect + Duration
- **Aspect:** 9:16 (Reels/TikTok) / 16:9 (YouTube)
- **Duration:** 8s (Veo limit) / 10s / 15s
- Backend auto-map unsupported aspect → safe alternative (1:1 → 9:16)

## 6.6 Smart Error Handling
- Veo quota เต็ม → **prompt ถาม "เปลี่ยนเป็น Veo 2 ฟรีไหม?"** → คลิก OK auto-switch
- fal.ai timeout → suggest Veo 2 ทดแทน

## 6.7 Paste URL Fallback
- ปุ่ม **"หรือ paste URL วิดีโอเอง"** → user paste video URL จาก fal.ai dashboard
- Validate `.mp4/.webm/.mov` ก่อนรับ
- แสดงในกรอบ preview ทันที + ใช้ปุ่ม MP4 download + บันทึก draft ได้

---

# 📅 7. ปฏิทิน (CALENDAR) — Schedule + Drag Drafts

## 7.1 Month Grid View
- 28-31 days grid (Sun-Sat)
- วันนี้ highlight orange
- เลข draft chip ในวัน → preview + manage

## 7.2 Day Detail Panel
- Posts ในวันนั้น (3 statuses: published / scheduled / failed)
- Stats: counts ต่อ status

## 7.3 Drafts Panel
- รายการ draft ทั้งหมด (orange chips)
- ปุ่ม "ตั้งวันที่เลือก" → schedule ลงวันที่ active
- ปุ่ม "พรุ่งนี้" → quick schedule day+1
- ปุ่มลบ × (with confirm)

## 7.4 New Post Buttons
- **"สร้างโพสต์ใหม่"** (top right) → ลัดไปหน้า Creative
- **"เพิ่มโพสต์"** (in day card) → modal เลือก draft + ตั้งเวลาลงวันที่
- Modal มี:
  - Draft ที่ยังไม่ scheduled (เลือกได้)
  - Draft ที่ scheduled แล้ว (กดเพื่อย้ายวัน)
  - Empty state + ปุ่มไปสร้าง

---

# 📚 8. คลังคอนเทนต์ (LIBRARY) — Draft Storage

## 8.1 Asset Filters (5 types)
- **ทั้งหมด** · **รูปภาพ** · **อัลบั้ม** · **วิดีโอ** · **แคปชั่น**

## 8.2 Smart Classification
- Auto-classify ดราฟตามจำนวนรูป:
  - `> 1` รูป → อัลบั้ม
  - `= 1` รูป → รูปภาพ
  - `= 0` รูป → แคปชั่น
  - `kind === 'video'` → วิดีโอ
- Legacy drafts (ไม่มี imageCount field) → ใช้ imageIds.length เป็น fallback

## 8.3 Status Pills
- เผยแพร่แล้ว (green)
- รอเวลา (blue)
- Draft (orange)

## 8.4 Card Click Actions
- คลิกการ์ด → เปิด draft ในหน้าเดิม (caption/creative/textvideo) + restore state
- ปุ่ม `×` ลบ draft (with confirm) — ลบ IDB images + localStorage + Supabase video

## 8.5 Storage Strategy
- **localStorage** — เก็บ metadata, hashtags, hooks, thumbnail (compressed 360px JPEG)
- **IndexedDB** — เก็บภาพ full-quality (base64, ~500KB ต่อรูป) + วิดีโอ blob ถ้าไม่ใช่ URL
- **Supabase Storage** — URL ของ video ที่ Veo render (มี public URL ใช้ได้ทันที)

---

# 🤖 9. AUTOMATION (Backend) — Auto-post Engine

## 9.1 Cron Worker
- รัน scheduled posts ทุก 5 นาที (Vercel cron / external worker)
- Token: `CRON_SECRET` (header `x-cron-internal: 1`)

## 9.2 Facebook + Instagram Post
- POST /api/facebook/post-carousel — โพสต์ multi-image
- POST /api/instagram/post — โพสต์ใน IG Business (ผ่าน Facebook Graph)
- ใช้ Page Token (60-day long-lived) + auto-refresh

## 9.3 TikTok Content Posting
- POST /api/tiktok/post-video — Direct upload API (Production tier)
- Init → upload → publish flow
- Token auto-refresh ก่อนหมดอายุ

## 9.4 Failure Handling
- ถ้า post fail → save error + retry 3 ครั้ง backoff
- แสดง "ล้มเหลว" pill + click see error detail

---

# 📊 10. ANALYTICS

## 10.1 Per-channel performance
- Reach, engagement, clicks ของแต่ละ post
- Group by: brand / channel / topic-kind / week
- Top performing posts (rank by engagement rate)

## 10.2 AI Recommendation
- ช่วงเวลาโพสต์ที่ engagement สูงสุด (e.g. "19:00-21:00")
- หัวข้อที่ทำผลตอบรับดี → AI suggest หัวข้อใหม่ใน Topic Bank

---

# 🛠 11. STACK + INFRASTRUCTURE

## 11.1 Frontend
- Vanilla JS (no framework)
- 1 file: `public/index.html` (~5000 บรรทัด)
- State management: single `state` object + `render()` re-paint
- Event delegation via `data-*` attributes
- IndexedDB for full-quality image/video storage

## 11.2 Backend
- Node 20 + Express
- ESM modules
- 10+ routes: `auth`, `ai`, `content`, `automation`, `facebook`, `instagram`, `tiktok`, `analytics`, `workspace`, `shopee`, `khurutheph`
- JWT auth + multi-tenant (tenant_id RLS)

## 11.3 Database
- Supabase Postgres
- Tables: `tenants`, `users`, `contents`, `automation_logs`, `leads`, `image_jobs`, `lipsync_clip_jobs`, `team_workspace`, `settings`
- Multi-tenant isolation via `tenant_id` column + `runWithTenant()` context

## 11.4 AI Providers
- **Text:** OpenRouter → Claude Sonnet 4.5 (default), GPT-4o-mini, Gemini 2.5 Flash
- **Image:** OpenRouter → Gemini 3.1 Flash Image / GPT-5.4 Image, Google AI Studio direct, OpenAI direct
- **Video:** Google Gemini Veo (2/3/3.1), fal.ai (Wan/Kling/Hailuo/Luma)
- **Voice:** Azure Speech Service (th-TH Neural)
- **Lip-sync:** fal.ai (Infinitalk/SadTalker/OmniHuman/Fabric)
- **Stock video:** Pexels API (free tier)

## 11.5 Deployment
- Frontend + API: Vercel (Hobby plan, 60s function timeout)
- Shopee scraper: Render (Docker, headless Chrome)
- Worker queue: Supabase Edge Functions / Render worker (optional)

## 11.6 Cost per active user (~30 posts/month)
| Item | Cost |
|---|---|
| Vercel Hobby | $0 |
| Supabase Free tier | $0 |
| OpenRouter (text) | ~$2/month |
| Gemini Image / Veo 2 | ~$0/month (free tier) |
| Wan 2.2 (videos) | ~$9/month ($0.30 × 30) |
| Azure Speech (TTS) | ~$0 (F0 free tier: 500K chars/mo) |
| fal.ai Infinitalk (5 talking videos) | ~$1/month |
| Pexels | $0 |
| **Total** | **~$12/user/month** |

---

# 🎯 12. KEY DIFFERENTIATORS

1. **Brand-aware AI** — AI รู้จัก voice + archetype + สินค้า + กลุ่มลูกค้าของทุกแบรนด์
2. **End-to-end** — ตั้งแต่ดึงสินค้า → ปั้นคอนเทนต์ → โพสต์ ในแอปเดียว (ไม่ต้องสลับ Canva/ChatGPT/Hootsuite)
3. **Multi-modal AI** — Text + Image + Video + Voice ในระบบเดียว
4. **Thai-first** — voice ไทย, font Prompt, prompt engineering สำหรับภาษาไทย
5. **Per-brand isolation** — ลูกค้ามี 5 แบรนด์ → แต่ละแบรนด์มีระบบของตัวเอง 100%
6. **Real-time generation** — ทุกอย่างสร้างใหม่ทันที ไม่ต้องรอ batch
7. **OAuth-based publishing** — user เชื่อม Facebook/IG/TikTok ครั้งเดียว แล้วโพสต์อัตโนมัติ
8. **Cost-efficient** — ใช้ open AI models (Wan, Veo 2) เป็น default → ต้นทุนต่ำกว่าคู่แข่งใช้ OpenAI ล้วน

---

# 📝 13. ROADMAP (สิ่งที่ยังไม่ทำ)

- [ ] Brand persistence ในฐานข้อมูล (ตอนนี้อยู่ localStorage)
- [ ] Per-user usage analytics + billing dashboard
- [ ] Team workspace — invite member + role-based permissions
- [ ] Multi-language UI (เพิ่ม EN/ZH/JP/VN)
- [ ] A/B testing — สร้าง 2 versions, แสดงให้ subset, วัด engagement
- [ ] AI auto-respond ใน DM Facebook/IG
- [ ] AI auto-reply review ใน Shopee
- [ ] Marketplace สำหรับซื้อ-ขาย template

---

# 📞 CONTACT + LINKS

- **Production:** https://post-post-seven.vercel.app
- **GitHub:** https://github.com/Pitchananya/PostPost
- **Storyboard (วิดีโอพรีเซ้น):** [STORYBOARD.md](STORYBOARD.md)
- **Demo videos:** `video_postpost/` (7 คลิป screen recording)

---

> สร้างโดย PostPost · AI Content Command Center · 2026
