# Deploy Shopee Scraper Worker ขึ้น Railway — คู่มือไทย

Guide step-by-step สำหรับ deploy `scraper-worker/` ขึ้น Railway เพื่อให้
PostPost ดึงข้อมูลร้าน Shopee จากทุกอุปกรณ์ (มือถือ / คอม / iPad / ฯลฯ)
ได้โดยไม่ต้องรัน `npm run dev` บนคอมตัวเอง

ค่าใช้จ่ายประมาณ: **$5/เดือน** (Railway hobby plan) — ไม่ต้องใส่ proxy
ก่อนก็ได้ ลองใช้ดูแล้วถ้าโดน block บ่อยค่อยเพิ่ม

---

## ก่อนเริ่ม — เช็คความพร้อม

- [ ] โปรเจ็กต์ PostPost push ขึ้น GitHub แล้ว (ดูได้จาก `git remote -v`)
- [ ] มีอีเมล + บัตรเครดิต (Railway ต้องผูกบัตรไว้ แม้จะใช้ free trial)
- [ ] เปิด PostPost project บน Vercel ค้างไว้ใน tab แยก (ต้องเข้าไปใส่
      env vars ตอนท้าย)

---

## ขั้นที่ 1 — สมัคร Railway + สร้าง project

1. เข้า https://railway.com → กด **Login** → เลือก **Login with GitHub**
2. อนุญาตให้ Railway เข้าถึง GitHub account
3. หน้าแรกจะเห็น dashboard → กด **+ New Project** (ปุ่มสีม่วงมุมขวาบน)
4. เลือก **Deploy from GitHub repo**
5. ถ้า list ยังว่าง กด **Configure GitHub App** → ติ๊ก **Only select
   repositories** → เลือก repo PostPost → Save
6. กลับมาที่ Railway → คลิก repo PostPost ในรายการ
7. Railway จะถามว่าจะ deploy ทันทีไหม → ตอบ **Deploy Now**

> ตอนนี้ Railway กำลังพยายาม build PostPost ทั้งโปรเจ็กต์ — **มันจะ
> fail** เพราะเรายังไม่ได้บอกว่าให้รัน sub-folder ไหน เป็นเรื่องปกติ
> ข้ามไปขั้นที่ 2 เลย

---

## ขั้นที่ 2 — ตั้งให้ Railway build แค่ scraper-worker

1. ในหน้า project ใหม่ จะเห็น service ชื่อ `PostPost` (หรือชื่อ repo)
   → คลิกเข้าไป
2. กดแท็บ **Settings** ด้านบน
3. หา section **Source** → กด **Edit**
4. ตั้ง **Root Directory** = `scraper-worker` (พิมพ์เข้าไปตรงๆ)
5. กด **Save Changes**
6. Railway จะเริ่ม build ใหม่อัตโนมัติ — รอ ~3-5 นาที (Docker image
   ใหญ่เพราะมี Chrome รวมอยู่)

> ดู progress ได้ที่แท็บ **Deployments** — จะเห็น log สดๆ ขณะ build

---

## ขั้นที่ 3 — ตั้ง environment variables

ก่อน build เสร็จ ใส่ env vars ไว้รอเลย:

1. กดแท็บ **Variables**
2. กด **+ New Variable** → ใส่ทีละตัวตามตาราง:

| ชื่อตัวแปร | ค่า | จำเป็นไหม? |
|------------|-----|------------|
| `WORKER_KEY` | random string เช่น `pp-scraper-9k3m2x7q8w` (28-32 chars แนะนำ) | **ใส่** — กัน worker โดน abuse |
| `PROXY` | URL residential proxy (ดูขั้น 6) | ยังไม่ใส่ก็ได้ |

วิธี gen `WORKER_KEY` แบบสุ่ม:
- macOS/Linux terminal: `openssl rand -hex 16`
- PowerShell: `-join ((48..57)+(97..122) | Get-Random -Count 28 | % {[char]$_})`
- หรือ Google "random string generator" แล้ว copy มาวาง

3. **กดเก็บค่า `WORKER_KEY` ไว้** — ต้องเอาไปใส่ใน Vercel ในขั้นที่ 5

---

## ขั้นที่ 4 — เปิด public URL + เช็คว่ารันได้

1. ที่ project page → service ของเรา → แท็บ **Settings**
2. หา section **Networking** → กด **Generate Domain**
3. Railway จะให้ URL หน้าตาแบบ `https://scraper-worker-production-xxxx.up.railway.app`
4. เปิด URL นั้นใน browser → ถ้าเห็นข้อความ JSON เช่น
   ```json
   { "ok": true, "service": "shopee-scraper-worker", "version": "..." }
   ```
   = worker รันแล้ว ✓
5. **copy URL ตัวนี้ไว้** — ขั้นต่อไปต้องใส่ใน Vercel

ทดสอบ scrape จริง (ใช้ curl หรือ Postman):
```bash
curl -X POST "https://YOUR-RAILWAY-URL/scrape" \
  -H "Authorization: Bearer YOUR_WORKER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://shopee.co.th/happyprice.sh"}'
```
ถ้าได้ products array กลับมา = worker ทำงานครบทุกชั้น ✓

---

## ขั้นที่ 5 — ผูก worker เข้า PostPost (Vercel)

1. เปิด https://vercel.com/dashboard → คลิก project PostPost
2. แท็บ **Settings** → เมนูซ้าย **Environment Variables**
3. เพิ่ม 2 ตัวแปร:

| ชื่อตัวแปร | ค่า |
|------------|-----|
| `SHOPEE_SCRAPER_URL` | `https://YOUR-RAILWAY-URL/scrape` (ลงท้าย `/scrape` ด้วย — สำคัญ) |
| `SHOPEE_SCRAPER_KEY` | ค่า `WORKER_KEY` ที่ตั้งไว้ในขั้น 3 (เป๊ะตัวเดียวกัน) |

4. กด **Save**
5. ไปแท็บ **Deployments** → กด **Redeploy** ที่ deployment ล่าสุด
   → ติ๊ก **Use existing Build Cache** = ✗ (redeploy ใหม่ทั้งหมด)
6. รอ ~1-2 นาที

---

## ขั้นที่ 6 (Optional) — เพิ่ม Proxy ถ้าโดน Shopee block

Shopee block IP datacenter (Railway/Render/AWS) ค่อนข้างหนัก ถ้า
scrape ครั้งแรกๆ ผ่าน 50%+ คุณโชคดี ถ้าโดน `{"error":"blocked"}`
ตลอด → ต้องใส่ residential proxy

### สมัคร IPRoyal (ถูกสุดและ pay-as-you-go)

1. https://iproyal.com → Sign Up
2. Dashboard → **Residential Proxies** → **Buy now**
3. เลือกปริมาณเริ่มต้น (1GB = $1.75) — ใช้ได้ ~300 scrapes
4. หลังจ่ายเงิน → ไปหน้า **Proxy Manager**
5. Copy proxy URL format: `http://USERNAME:PASSWORD@geo.iproyal.com:12321`

### ใส่เข้า Railway

1. กลับมา Railway → service เรา → **Variables**
2. เพิ่ม `PROXY` = `http://USERNAME:PASSWORD@geo.iproyal.com:12321`
3. Railway จะ redeploy อัตโนมัติ ~30 วินาที
4. ลอง scrape ใหม่ใน PostPost → ควรสำเร็จเกือบทุกครั้ง

---

## เช็คผลลัพธ์

1. เปิด PostPost (URL Vercel) ในมือถือ
2. ไปหน้า Profile → ส่วน "สินค้าจากร้านของคุณ"
3. ใส่ URL ร้าน Shopee → กด **ดึงข้อมูลใหม่**
4. ถ้าเห็น progress + ได้สินค้ามาแสดง = **ใช้ได้แล้วทุกอุปกรณ์** ✓
5. ปิด toggle "ใช้เครื่องของคุณ scrape" — ไม่ต้องการแล้ว

---

## ปัญหาที่อาจเจอ + วิธีแก้

| ปัญหา | สาเหตุ | แก้ |
|-------|--------|-----|
| Railway deploy fail "no Dockerfile found" | ลืมตั้ง Root Directory | ขั้น 2 ข้อ 4 |
| `502 cloud / submit failed` | URL ใน Vercel ไม่ลงท้าย `/scrape` | ใส่ `/scrape` ต่อท้าย Railway URL |
| `401 unauthorized` | `WORKER_KEY` ใน Railway ≠ `SHOPEE_SCRAPER_KEY` ใน Vercel | copy เช็คให้ตรงเป๊ะ |
| `error: blocked` ตลอด | Railway IP โดน Shopee block | ใส่ `PROXY` ขั้น 6 |
| `timeout` หลัง 60s | Vercel function ตัดก่อน worker เสร็จ | ใช้ `/scrape-async` (รับโดย backend อัตโนมัติ ไม่ต้องแก้อะไร) |
| Cold start ช้า (30s แรก) | Railway free tier sleep ตอน idle | upgrade เป็น Hobby plan $5/mo |

---

## ปิด worker / ลบทิ้ง

ถ้าจะหยุดใช้:
1. Railway → project → service → **Settings** → scroll ล่างสุด
   → **Danger Zone** → **Delete Service**
2. Vercel → ลบ `SHOPEE_SCRAPER_URL` + `SHOPEE_SCRAPER_KEY` ออกจาก
   env vars → Redeploy
3. กลับไปใช้ local scraper toggle เหมือนเดิม

---

## ค่าใช้จ่ายจริง

- **Railway Hobby** = $5/เดือน (รวม free credit เริ่มต้น $5 ใช้ ~1 เดือนฟรี)
- **IPRoyal proxy** = pay-as-you-go $1.75/GB ใช้น้อยมาก ~$0.10-1/เดือนตามปริมาณ
- **Vercel** = ไม่เพิ่มค่าใช้จ่าย (worker call กิน 1-2 second function time)

รวม **~$5-6/เดือน** สำหรับใช้งานทั่วไป
