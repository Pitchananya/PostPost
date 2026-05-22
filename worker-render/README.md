# image-worker — Render Web Service

Long-running Node.js worker that processes image_jobs by calling OpenRouter
without a wall-clock limit. Replaces the Supabase Edge Function path for
GPT-5.4 (which exceeds the 150s free-tier limit).

## Why Render

| Host | Wall-clock per request | Cost |
|---|---|---|
| Vercel Hobby | 60s | free |
| Supabase Edge Free | 150s | free |
| **Render Free Web Service** | **no limit** | **free** (sleeps after 15min idle) |
| Supabase Edge Pro | 400s | $25/mo |

GPT-5.4 image_2 generation runs 90-150s — Render free tier handles it.

## Trade-off

Render free instance **sleeps after 15 min idle** and takes ~30s to cold-start
on the next request. For image gen that takes 90s anyway, this is acceptable
(adds 30s to the first request after idle, instant for subsequent ones).

## Deploy steps

### 1. Sign up
- https://render.com → Sign up with GitHub
- Authorize access to `Pitchananya/oem-content-factory` repo

### 2. Create new Web Service
- Dashboard → **New +** → **Web Service**
- Choose `Pitchananya/oem-content-factory`
- Fill in:
  - **Name:** `oem-cf-image-worker` (or anything)
  - **Region:** Singapore (closest to Thailand)
  - **Branch:** `main`
  - **Root Directory:** `worker-render`
  - **Runtime:** `Node`
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
  - **Plan:** Free

### 3. Set environment variables
Click **Advanced → Add Environment Variable**:

| Key | Value |
|---|---|
| `OPENROUTER_API_KEY` | `sk-or-v1-...` (your real key, NOT the leaked one) |
| `WORKER_SECRET` | `58447e4d38fbf99cb1396c199f2fed1efe9e87df60c0fc6a48ed27a046424afb` |
| `SUPABASE_URL` | `https://lipebqblrqbmvwmmttua.supabase.co` |
| `SUPABASE_SERVICE_KEY` | service_role key from Supabase → Settings → API |

### 4. Deploy
Click **Create Web Service** — Render builds + deploys (~2 min). When live,
you'll get a URL like `https://oem-cf-image-worker.onrender.com`.

### 5. Set Vercel env
In Vercel project Settings → Environment Variables:

| Key | Value |
|---|---|
| `RENDER_WORKER_URL` | `https://oem-cf-image-worker.onrender.com/process-image-job` |

Save → Deployments → Redeploy latest.

Vercel will now prefer Render over Supabase Edge for image jobs.

## Verify it's running

```bash
curl https://oem-cf-image-worker.onrender.com/
# → {"ok":true,"service":"oem-image-worker","uptime_sec":42,"node":"v20.x.x"}
```

If you get `404` or `502`, instance is cold-starting — wait 30s and retry.

## Logs

Render Dashboard → your service → **Logs** tab — streams stdout/stderr in
real time. Look for `[worker] job N → openai/gpt-5.4-image-2 ... took=Xms`.

## How requests flow

```
User → admin UI POST /api/ai/image-async
   ↓
Vercel /api/ai/image-async
   ↓ creates image_jobs row (status='pending')
   ↓ fire-and-forget POST {RENDER_WORKER_URL} with job_id + WORKER_SECRET
   ↓ returns {job_id} to client
   ↓
Render /process-image-job  (this service)
   ↓ acks immediately, processes in background
   ↓ updates DB: status='processing'
   ↓ calls OpenRouter (60-150s)
   ↓ updates DB: status='done' + image_base64
   ↓
Client poll GET /api/ai/image-status every 3s
   ↓ sees status='done' → renders image
```

## Cold start mitigation (optional)

Render free instances sleep after 15min of no requests. If image gen is your
first request after idle, you'll wait an extra ~30s for cold start.

**Mitigation:** add a cron-job-org / UptimeRobot ping every 10min to keep
the service warm. Or just accept the occasional 30s cold start.
