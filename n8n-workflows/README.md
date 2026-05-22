# n8n Workflows — OEM Content Factory

## ไฟล์ในโฟลเดอร์นี้
- **`oem-auto-post.json`** — Workflow หลัก รับ webhook จาก backend แล้วโพสไป FB / IG / TikTok พร้อมกัน

## วิธี Import

1. เปิด n8n (cloud หรือ self-host)
2. กด **Workflows → Import from File** → เลือก `oem-auto-post.json`
3. Workflow จะมี Webhook node — copy URL ของมันใส่ในไฟล์ `.env` ของ backend ที่ตัวแปร `N8N_WEBHOOK_URL`

## Environment Variables ที่ n8n ต้องมี

ตั้งใน **n8n → Settings → Environment Variables** หรือ `.env` ของ self-host:

```
FB_PAGE_ID=          # ID ของ Facebook Page ที่จะโพส
FB_PAGE_TOKEN=       # Page Access Token (long-lived)
IG_USER_ID=          # Instagram Business Account ID
IG_ACCESS_TOKEN=     # IG Graph API Token
```

สำหรับ TikTok ใช้ **Credential** แบบ OAuth2 ใน n8n (TikTok Business API)

## Flow โดยย่อ

```
Backend ─POST→ Webhook ─→ ตรวจ test ping?
                              │
                  ┌───────────┴────────────┐
              [test=true]              [real post]
                  │                        │
              respond OK         Fan-out by platforms
                                           │
                            ┌──────────────┼──────────────┐
                       Facebook         Instagram        TikTok
                       Pages API        Graph API        Content API
                            └──────────────┼──────────────┘
                                          │
                                       respond OK
```

## Payload ที่ Backend ส่งให้ n8n

```json
{
  "id": 123,
  "course": "PFB",
  "hook": "พาดหัวที่ดึงดูด...",
  "caption": "เนื้อหา caption เต็ม...",
  "media_url": "https://cdn.example.com/img.jpg",
  "platforms": ["facebook", "instagram", "tiktok"],
  "scheduled_at": "2026-05-08T09:00:00.000Z"
}
```

## ทดสอบ

จากในแอด Admin Dashboard → แท็บ **Automation** → กดปุ่ม **🚀 ทดสอบ webhook ตอนนี้**
หรือ curl ตรง:

```bash
curl -X POST $N8N_WEBHOOK_URL -H "Content-Type: application/json" -d '{"test":true}'
```

ควรได้ `{"ok":true,"message":"pong"}`

## ข้อจำกัด TikTok

TikTok API ต้อง **approve เข้า Marketing API** ก่อนถึงจะใช้ auto-post ได้ ในระหว่างนั้นแนะนำใช้ทางเลือก:
- **Metricool** / **Buffer** (น่าเชื่อถือ, รองรับ TikTok ได้ตรง)
- เปลี่ยน node `Post to TikTok` เป็น HTTP request ไปยัง Metricool API
