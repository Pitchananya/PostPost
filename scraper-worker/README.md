# Shopee Scraper — Cloud Worker

A tiny HTTP service that runs the Shopee shop scraper in the cloud, so
PostPost can scrape when a customer clicks **"ดึงข้อมูลใหม่" (Re-sync)**
instead of relying on a developer's local machine.

PostPost's backend (`backend/routes/shopee.js`) automatically proxies to
this worker whenever the `SHOPEE_SCRAPER_URL` env var is set.

```
PostPost frontend  ──►  PostPost backend  ──►  this worker  ──►  Shopee
   (Re-sync btn)        /api/shopee/scrape      POST /scrape
```

## API

| Method | Path      | Body                       | Response |
|--------|-----------|----------------------------|----------|
| `POST` | `/scrape` | `{ "url": "<shop url>" }`  | `{ ok, shop, shopid, count, products[] }` |
| `GET`  | `/`       | —                          | health check |

`url` accepts a full shop URL (`https://shopee.co.th/ajarnnuengkuruthep`)
or just the username. On failure the response is
`{ "error": "...", "message": "..." }` with a non-2xx status.

## Environment variables

| Var          | Required | Purpose |
|--------------|----------|---------|
| `PORT`       | no       | Listen port (Render/Railway inject this automatically; default `8080`). |
| `WORKER_KEY` | recommended | If set, callers must send `Authorization: Bearer <WORKER_KEY>`. |
| `PROXY`      | **strongly recommended** | Outbound proxy, e.g. `http://user:pass@host:port`. Shopee blocks datacenter IPs — a **residential** proxy is needed for reliable cloud scraping. |

## Deploy

### Option A — Render (Docker)

1. Push this `scraper-worker/` folder to a Git repo.
2. Render → **New → Web Service** → connect the repo.
3. Set **Root Directory** to `scraper-worker`, **Runtime** to `Docker`.
4. Add env vars: `WORKER_KEY` (any random string), `PROXY` (your residential proxy).
5. Deploy. Render gives you a URL like `https://shopee-worker.onrender.com`.

### Option B — Railway (Docker)

1. Railway → **New Project → Deploy from GitHub repo**.
2. Set the service **Root Directory** to `scraper-worker` (it auto-detects the `Dockerfile`).
3. Add the same env vars (`WORKER_KEY`, `PROXY`).
4. Deploy and copy the generated public URL.

> Note: free tiers sleep when idle — the first scrape after a cold start
> takes longer. A scrape normally takes 1–3 minutes.

## Wire it into PostPost

In PostPost's backend env (`.env` locally, or Vercel project env vars):

```
SHOPEE_SCRAPER_URL=https://shopee-worker.onrender.com/scrape
SHOPEE_SCRAPER_KEY=<the same WORKER_KEY you set on the worker>
```

Restart the PostPost backend. Now the **ดึงข้อมูลใหม่** button runs the
scrape in the cloud. Leave `SHOPEE_SCRAPER_URL` unset to fall back to the
local scraper (`backend/scripts/scrape_shopee.py`).

## Test locally

```bash
cd scraper-worker
pip install -r requirements.txt
python app.py
# in another shell:
curl -X POST localhost:8080/scrape -H "Content-Type: application/json" \
     -d "{\"url\":\"https://shopee.co.th/ajarnnuengkuruthep\"}"
```

Or with Docker:

```bash
docker build -t shopee-worker .
docker run -p 8080:8080 -e WORKER_KEY=test shopee-worker
```

## Why a proxy matters

Shopee aggressively blocks cloud / datacenter IP ranges (Render, Railway,
AWS, GCP all qualify). Without a residential `PROXY`, the worker will most
often return `{"error":"blocked"}`. Use a residential proxy provider
(Bright Data, Oxylabs, IPRoyal, etc.) and put its endpoint in `PROXY`.
