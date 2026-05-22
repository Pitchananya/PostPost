# image-worker — Supabase Edge Function

Async image generation worker — รับ `job_id`, ดึง prompt จาก DB, ยิง OpenRouter GPT-5.4, เก็บ result กลับ DB.

ใช้แก้ปัญหา **Vercel Hobby 60s function timeout** — Edge Function ได้ 150s timeout เพียงพอ.

## Setup

### 1. ติดตั้ง Supabase CLI

```bash
# Mac
brew install supabase/tap/supabase

# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# หรือ npm
npm install -g supabase
```

### 2. Login + link project

```bash
cd D:/oem-content-factory
supabase login
supabase link --project-ref <your-project-ref>
```

(หา `project-ref` ที่ Supabase Dashboard → Settings → General)

### 3. ตั้ง secrets

```bash
# OpenRouter API key (เดียวกับที่ใช้ใน Vercel)
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...

# สุ่ม secret สำหรับ auth Edge Function (Vercel จะใช้ค่านี้เรียก)
supabase secrets set WORKER_SECRET=$(openssl rand -hex 32)
# Windows powershell:
# supabase secrets set WORKER_SECRET=$([Convert]::ToBase64String((1..32 | %{Get-Random -Maximum 256})))

# จด WORKER_SECRET ที่ตั้ง — ต้องใส่ใน Vercel env vars ด้วย
```

### 4. รัน migration (Supabase SQL Editor)

```sql
-- ดูที่ backend/scripts/migration-006-image-jobs.sql
```

### 5. Deploy Edge Function

```bash
supabase functions deploy image-worker --no-verify-jwt
```

`--no-verify-jwt` เพราะเราใช้ WORKER_SECRET ของเราเอง (ไม่ใช้ Supabase Auth JWT)

### 6. ทดสอบ

```bash
# Get the function URL
supabase functions list

# Should output: image-worker | https://<project>.supabase.co/functions/v1/image-worker

# Test (replace WORKER_SECRET and project URL)
curl -X POST 'https://<project>.supabase.co/functions/v1/image-worker' \
  -H 'Authorization: Bearer <WORKER_SECRET>' \
  -H 'Content-Type: application/json' \
  -d '{"job_id": 1}'
```

(แต่ต้องมี job_id=1 ในตาราง image_jobs ก่อน)

### 7. ใส่ env vars ใน Vercel

```
SUPABASE_EDGE_URL = https://<project>.supabase.co/functions/v1/image-worker
WORKER_SECRET = <ค่าที่ตั้งใน step 3>
```

→ Redeploy Vercel

## Logs

```bash
supabase functions logs image-worker --follow
```

## Architecture

```
Frontend → POST /api/ai/image-async (Vercel)
   ↓
Vercel creates row in image_jobs (status=pending)
   ↓
Vercel triggers Supabase Edge Function (fire-and-forget)
   ↓
Edge Function calls OpenRouter GPT-5.4 (up to 150s)
   ↓
Edge Function saves result to image_jobs (status=done, image_base64)
   ↓
Frontend polls GET /api/ai/image-status?id=<job_id> every 3s
   ↓
Frontend gets image_base64 when status=done
```
