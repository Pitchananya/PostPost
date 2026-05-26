# คู่มือเปิด Facebook App เป็น Live Mode + App Review

ทำตามขั้นตอนนี้เพื่อให้ user ทั่วไป (ไม่ใช่แค่ตัวคุณ + test users) สามารถ
เชื่อม Facebook Page / Instagram Business กับ PostPost ได้ทันที โดยไม่ต้อง
เพิ่มเข้า Roles ก่อน

ใช้เวลารวม: **2-3 ชั่วโมง** เตรียมเอกสาร + รอ Facebook approve **3-14 วัน**

---

## ขั้นที่ 1 — เตรียมสิ่งที่ FB ต้องการก่อน submit

### 1.1 หน้า Privacy Policy + Terms of Service

✅ มีแล้วในโปรเจ็กต์:
- `public/privacy.html` → URL: `https://post-post-seven.vercel.app/privacy.html`
- `public/terms.html` → URL: `https://post-post-seven.vercel.app/terms.html`

หลัง deploy → ตรวจว่าทั้ง 2 URL เปิดดูได้จริง (ไม่ 404)

### 1.2 Data Deletion Callback

✅ มีแล้วในโปรเจ็กต์:
- `POST /api/facebook/data-deletion` → endpoint ที่ FB เรียกตอน user remove app
- `GET /api/facebook/data-deletion-status?code=...` → หน้าให้ user ดูสถานะ

URL ที่ใส่ใน FB App Settings: `https://post-post-seven.vercel.app/api/facebook/data-deletion`

### 1.3 Business Verification (อาจต้องทำ)

ถ้าจะขอ permissions advanced (`pages_manage_posts`, `instagram_content_publish`) — FB
อาจขอให้ verify business เพิ่ม
- Settings → Business Verification → upload เอกสารจดทะเบียนธุรกิจ
- ใช้เวลา 1-3 วัน

### 1.4 App Icon + Tagline

- App Icon: รูปสี่เหลี่ยม 1024×1024 PNG (โลโก้ PostPost)
- Tagline: ประโยคสั้นๆ (≤80 chars) เช่น "AI Content Command Center สำหรับธุรกิจไทย"

---

## ขั้นที่ 2 — ตั้งค่าใน Facebook Developer Console

→ https://developers.facebook.com/apps → เลือก app ของคุณ

### 2.1 Settings → Basic

| Field | Value |
|-------|-------|
| **App Domains** | `post-post-seven.vercel.app` |
| **Privacy Policy URL** | `https://post-post-seven.vercel.app/privacy.html` |
| **Terms of Service URL** | `https://post-post-seven.vercel.app/terms.html` |
| **Data Deletion Instructions URL** | `https://post-post-seven.vercel.app/api/facebook/data-deletion` |
| **App Icon** | upload โลโก้ 1024×1024 |
| **Category** | Business and Pages |
| **Business Use** | Support my own business |
| **Contact Email** | อีเมลที่ FB ส่งข้อความหาคุณได้ |

กด **Save Changes**

### 2.2 Products → Facebook Login → Settings

| Field | Value |
|-------|-------|
| **Valid OAuth Redirect URIs** | `https://post-post-seven.vercel.app/api/facebook/oauth/callback` |
| **Client OAuth Login** | ON |
| **Web OAuth Login** | ON |
| **Enforce HTTPS** | ON |

### 2.3 Add "Instagram Graph API" product

- เมนูซ้าย → **Add Products** → หา **Instagram Graph API** → Set Up

---

## ขั้นที่ 3 — Submit App Review

### 3.1 ไปที่ App Review → Permissions and Features

ขอ permissions ทีละตัว (กด **Request Advanced Access** ที่แต่ละตัว):

| Permission | ทำไมต้องขอ | ตัวอย่างเหตุผลให้ FB |
|------------|-------------|---------------------|
| `pages_show_list` | ให้ user เลือก Page ใดที่จะโพสต์ | "PostPost lets the user pick which Facebook Page they want to publish AI-generated content to. We need pages_show_list to display their pages in the picker." |
| `pages_manage_posts` | โพสต์รูป/วิดีโอ/album ไปยัง Page | "PostPost automates content publishing — users create posts in our editor, click Publish, and we post to their selected Page using pages_manage_posts." |
| `pages_read_engagement` | ดึง insights ของโพสต์ที่ publish แล้ว | "PostPost shows users their post performance (reach, engagement) in our Analytics dashboard. We need pages_read_engagement to fetch insights from posts we published." |
| `instagram_basic` | อ่าน profile ของ IG Business ที่ผูกกับ Page | "When a user connects their Facebook Page that has a linked Instagram Business Account, we auto-detect the IG account via instagram_basic to enable IG publishing." |
| `instagram_content_publish` | โพสต์ไป IG (single + carousel) | "PostPost publishes AI-generated images and carousels to the user's connected Instagram Business Account when they click Publish." |
| `business_management` | (optional) จัดการ pages ของ business | "For users who manage multiple brands under one Business Manager, we need business_management to list and connect their pages." |

### 3.2 บันทึก demo video สำหรับแต่ละ permission

FB บังคับให้ส่ง **screencast 60-90 วินาที** ที่แสดง:
1. Login เข้า PostPost ด้วย Facebook
2. ไปหน้า Profile → กด "เชื่อม Facebook Page"
3. ใน popup OAuth → consent permissions ทั้งหมด
4. กลับมาที่ PostPost → เห็น "✓ เชื่อมแล้ว"
5. สร้างคอนเทนต์ที่หน้า Caption / Creative
6. กด Publish → เห็นโพสต์ขึ้นที่ Page จริง
7. ไปหน้า Analytics → เห็นโพสต์ + engagement metrics

อัพ video ขึ้น YouTube (unlisted) แล้วใส่ URL ใน request

### 3.3 Submission Form

ที่ App Review → กด **Submit for Review**:
- **App Use Case**: เขียน 2-3 ย่อหน้าอธิบาย PostPost ทำอะไร
- **Privacy Policy URL**: confirm ตั้งแล้ว
- **App Icon**: confirm upload แล้ว
- **Video URL**: link YouTube ที่บันทึก

กด **Submit**

### 3.4 รอ Facebook approve

- ปกติ **3-14 วัน** (บางครั้ง 1 วัน บางครั้ง 3 สัปดาห์)
- FB อาจขอข้อมูลเพิ่ม / ปฏิเสธ → แก้แล้ว resubmit
- เช็คสถานะที่ **App Review → Status**

---

## ขั้นที่ 4 — สลับเป็น Live Mode

หลัง permissions approve ครบแล้ว:

1. ไปที่ header บนสุดของ FB Console → toggle จาก **In Development** → **Live**
2. FB จะเช็คครั้งสุดท้ายว่า Privacy Policy + Data Deletion URL ครบ
3. กด **Switch Mode**

🎉 **ตอนนี้ user ทั่วไปสามารถกด "เชื่อม Facebook" ใน PostPost ได้ทันที** ไม่ต้อง add เข้า Roles ก่อนแล้ว

---

## ระหว่างรอ App Review — ทำยังไง

ถ้ายังต้องการให้ลูกค้าทดสอบใช้งานก่อน FB approve:

### Option A: Add Test Users (ใช้ได้ทันที — แต่จำกัด)

1. Console → **App Roles** → **Test Users**
2. กด **Add People** → ใส่ Facebook account ของลูกค้า
3. ลูกค้าได้รับคำเชิญ + accept
4. ลูกค้า OAuth ผ่านได้ (เพราะอยู่ใน Test Users list)

ข้อจำกัด: max 100 test users / app

### Option B: Add to Roles (admin/developer)

1. Console → **App Roles** → **Roles**
2. Add ลูกค้าเป็น **Developer** หรือ **Tester**
3. ลูกค้าใช้ได้ทันที (ไม่ต้อง accept แค่ login ได้เลย)

---

## Troubleshooting

| ปัญหา | สาเหตุ | แก้ |
|-------|--------|-----|
| "ไม่สามารถโหลด URL ได้ — โดเมนไม่ได้รวมอยู่ใน app" | ขาด `App Domains` setting | ขั้น 2.1 |
| "URL Blocked" ตอน OAuth | Redirect URI ไม่ตรง | ขั้น 2.2 |
| "App Not Set Up: This app is still in development mode" | App ยังไม่ live + user ไม่อยู่ Roles | ทำ App Review หรือ add user ใน Roles |
| App Review ปฏิเสธ "use case unclear" | คำอธิบายไม่ชัด / video ไม่แสดง permission ที่ขอ | บันทึก video ใหม่ให้เห็นชัดๆ ว่า PostPost ใช้ permission ตัวไหนทำอะไร |
| Business Verification ติด | ไม่มีเอกสารจดทะเบียนธุรกิจ | จด Business นิติบุคคล หรือใช้รูปแบบ Individual Developer (จำกัด permissions ได้น้อยกว่า) |

---

## Checklist ก่อน Submit

- [ ] Privacy Policy URL เปิดดูได้ (200 OK)
- [ ] Terms of Service URL เปิดดูได้
- [ ] Data Deletion URL → POST ทดสอบด้วย Postman ได้ return JSON ที่มี `url` + `confirmation_code`
- [ ] App Icon 1024×1024 PNG upload แล้ว
- [ ] App Domains ใส่ครบทุก domain ที่ใช้
- [ ] Valid OAuth Redirect URIs ใส่ครบ
- [ ] Business Verification submit แล้ว (ถ้าจะขอ advanced perms)
- [ ] Demo video บันทึกแล้ว upload ขึ้น YouTube
- [ ] Use case description เขียนละเอียดทุก permission
- [ ] อีเมล Contact ใส่ที่ตอบได้จริง (FB จะส่งคำขอข้อมูลเพิ่ม)

---

## หลัง Live แล้ว — Maintenance

- **Token refresh**: PostPost auto-refresh tokens ที่ใกล้หมดอายุ
- **User unfollows**: ถ้า user remove app จาก FB → data-deletion callback ของเราจะถูกเรียก
- **Quota monitoring**: ดู usage ที่ Console → Dashboard → API Activity
- **Permission re-review**: FB อาจขอ re-review ทุก 12-18 เดือน — ดูแลให้ Privacy + Terms ยัง valid
