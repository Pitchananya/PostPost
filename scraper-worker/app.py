# -*- coding: utf-8 -*-
"""
Shopee scraper — cloud worker.

A tiny HTTP service that wraps the Shopee shop scraper so PostPost's
backend can scrape from the cloud instead of a local machine.

  POST /scrape   { "url": "<shop url or username>" }
    -> { "ok": true, "shop": "...", "count": N, "products": [...] }
    -> { "error": "...", "message": "..." }
  GET  /         health check

Env:
  PORT         listen port (default 8080)
  WORKER_KEY   if set, requests must send  Authorization: Bearer <WORKER_KEY>
  PROXY        optional proxy, e.g. http://user:pass@host:port
               (Shopee blocks datacenter IPs — a residential proxy is
               strongly recommended for reliable cloud scraping)
"""
import os, json, time, random, re
from flask import Flask, request, jsonify

app = Flask(__name__)
WORKER_KEY = os.environ.get("WORKER_KEY", "")
PROXY = os.environ.get("PROXY", "")


def normalize(p, shopid, shop):
    iid = str(p.get("itemid") or p.get("item_id") or p.get("id") or "")
    pr = p.get("price") or p.get("price_min") or 0
    price = round(pr / 100000, 2) if pr else 0
    before = p.get("price_before_discount") or 0
    before = round(before / 100000, 2) if before else 0
    img = p.get("image") or p.get("thumbnail")
    images = [f"https://down-th.img.susercontent.com/file/{img}"] if img else []
    for i in (p.get("images") or [])[:6]:
        u = f"https://down-th.img.susercontent.com/file/{i}"
        if u not in images:
            images.append(u)
    rating = (p.get("item_rating") or {}).get("rating_star", 0) or 0
    return {
        "itemid": iid,
        "name": (p.get("name") or p.get("title") or "").strip(),
        "price": price,
        "price_before": before,
        "sold": p.get("historical_sold") or p.get("sold") or 0,
        "rating": round(rating, 2),
        "stock": p.get("stock") or 0,
        "thumbnail": images[0] if images else "",
        "images": images,
        "description": "",
        "url": f"https://shopee.co.th/product/{shopid}/{iid}",
    }


def scrape(shop_arg):
    import undetected_chromedriver as uc

    m = re.search(r"shopee\.[^/]+/([^/?#]+)", shop_arg)
    shop = m.group(1) if m else shop_arg.lstrip("/").split("/")[0].split("?")[0].split("#")[0]

    opts = uc.ChromeOptions()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--lang=th-TH")
    opts.add_argument("--window-size=1280,900")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    if PROXY:
        opts.add_argument("--proxy-server=" + PROXY)

    driver = uc.Chrome(options=opts, headless=True)
    try:
        driver.get(f"https://shopee.co.th/{shop}")
        time.sleep(6)
        cur = (driver.current_url or "").lower()
        if any(k in cur for k in ("verify/traffic", "/verify/", "/login", "captcha")):
            return {"error": "blocked",
                    "message": "Shopee blocked the cloud IP. Set a residential PROXY env var on the worker."}

        # shopid
        sid = None
        try:
            raw = driver.execute_script(f"""
              return await fetch('https://shopee.co.th/api/v4/shop/get_shop_base?need_cancel_rate=true&username={shop}',
                {{method:'GET',headers:{{'x-api-source':'pc','x-requested-with':'XMLHttpRequest'}},credentials:'include'}})
                .then(r=>r.json()).then(d=>JSON.stringify(d)).catch(e=>'ERROR:'+e);
            """)
            if raw and not raw.startswith("ERROR:"):
                d = (json.loads(raw).get("data") or {})
                sid = d.get("shopid") or d.get("shop_id")
        except Exception:
            pass
        if not sid:
            mm = re.search(r'"shopid"\s*:\s*(\d+)', driver.page_source or "")
            if mm:
                sid = mm.group(1)
        if not sid:
            return {"error": "noshopid", "message": "Could not resolve the shop id for " + shop}
        sid = str(sid)

        products, offset, seen, page = [], 0, set(), 0
        while page < 30:
            page += 1
            try:
                raw = driver.execute_script(f"""
                  return await fetch('https://shopee.co.th/api/v4/search/search_items?by=pop&limit=60&match_id={sid}&newest={offset}&order=desc&page_type=shop&scenario=PAGE_OTHERS&version=2',
                    {{method:'GET',headers:{{'x-api-source':'pc','x-requested-with':'XMLHttpRequest'}},credentials:'include'}})
                    .then(r=>r.json()).then(d=>JSON.stringify(d)).catch(e=>'ERROR:'+e);
                """)
            except Exception:
                break
            if not raw or raw.startswith("ERROR:"):
                break
            try:
                data = json.loads(raw)
            except Exception:
                break
            err = data.get("error")
            if err and int(err) != 0:
                break
            items = data.get("items") or (data.get("data") or {}).get("items") or []
            if not items:
                break
            added = 0
            for it in items:
                prod = it.get("item_basic") or it.get("basic") or it
                iid = str(prod.get("itemid") or prod.get("item_id") or prod.get("id") or "")
                if not iid or iid in seen:
                    continue
                seen.add(iid)
                products.append(normalize(prod, sid, shop))
                added += 1
            if data.get("nomore") or added == 0 or len(items) < 60:
                break
            offset += 60
            time.sleep(random.uniform(0.8, 1.6))

        if not products:
            return {"error": "empty", "message": "No products returned (shop empty or Shopee blocked the request)."}

        # second pass — fetch the real product description for each item (capped)
        DESC_LIMIT = 80
        for prod in products[:DESC_LIMIT]:
            try:
                raw = driver.execute_script(f"""
                  return await fetch('https://shopee.co.th/api/v4/item/get?itemid={prod['itemid']}&shopid={sid}',
                    {{method:'GET',headers:{{'x-api-source':'pc','x-requested-with':'XMLHttpRequest'}},credentials:'include'}})
                    .then(r=>r.json()).then(d=>JSON.stringify(d)).catch(e=>'ERROR:'+e);
                """)
                if raw and not raw.startswith("ERROR:"):
                    d = (json.loads(raw).get("data") or {})
                    desc = (d.get("description") or "").strip()
                    if desc:
                        prod["description"] = desc[:3000]
            except Exception:
                pass
            time.sleep(random.uniform(0.25, 0.5))

        return {"ok": True, "shop": shop, "shopid": sid, "count": len(products), "products": products}
    finally:
        try:
            driver.quit()
        except Exception:
            pass


@app.post("/scrape")
def scrape_route():
    if WORKER_KEY:
        if request.headers.get("Authorization", "") != "Bearer " + WORKER_KEY:
            return jsonify({"error": "unauthorized", "message": "bad worker key"}), 401
    body = request.get_json(silent=True) or {}
    url = body.get("url")
    if not url:
        return jsonify({"error": "url", "message": "url required"}), 400
    try:
        result = scrape(url)
        return jsonify(result), (200 if result.get("ok") else 502)
    except Exception as e:
        return jsonify({"error": "worker", "message": str(e)}), 500


@app.get("/")
def health():
    return jsonify({"ok": True, "service": "shopee-scraper-worker", "proxy": bool(PROXY)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
