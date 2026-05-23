# -*- coding: utf-8 -*-
"""
scrape_shopee.py — non-interactive Shopee shop scraper for the PostPost backend.

Spawned by POST /api/shopee/scrape. Reuses the persistent Chrome profile
(.chrome-profile-shopee) so a previously logged-in Shopee session is reused.

  python backend/scripts/scrape_shopee.py "<shop url or username>"

Progress goes to STDERR. The FINAL line of STDOUT is a single JSON object:
  {"ok": true, "shop": "...", "shopid": "...", "count": N, "products": [...]}
  {"error": "...", "message": "..."}
"""
import json, sys, time, random, re
from pathlib import Path

# Windows stdout defaults to cp1252 — force UTF-8 so Thai product names
# survive the JSON the backend reads off stdout.
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

def log(*a):
    print(*a, file=sys.stderr, flush=True)

def emit(obj):
    print(json.dumps(obj, ensure_ascii=False), flush=True)

try:
    import undetected_chromedriver as uc
except ImportError:
    emit({"error": "deps", "message": "undetected-chromedriver not installed — run: pip install undetected-chromedriver setuptools"})
    sys.exit(0)

# ---- shop name ----
arg = sys.argv[1].strip() if len(sys.argv) > 1 else "happyprice.sh"
m = re.search(r"shopee\.[^/]+/([^/?#]+)", arg)
SHOP = m.group(1) if m else arg.lstrip("/").split("/")[0].split("?")[0].split("#")[0]
SHOP_URL = f"https://shopee.co.th/{SHOP}"

# profile dir — repo root /.chrome-profile-shopee  (script is in backend/scripts/)
ROOT = Path(__file__).resolve().parents[2]
PROFILE = ROOT / ".chrome-profile-shopee"
PROFILE.mkdir(exist_ok=True)

def chrome_major():
    try:
        import winreg
        for hive in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
            try:
                k = winreg.OpenKey(hive, r"SOFTWARE\Google\Chrome\BLBeacon")
                v, _ = winreg.QueryValueEx(k, "version"); winreg.CloseKey(k)
                if v: return int(v.split(".")[0])
            except OSError:
                continue
    except Exception:
        pass
    return None

def blocked(url):
    url = (url or "").lower()
    return any(k in url for k in ("verify/traffic", "/verify/", "/login", "/buyer/login", "captcha"))

def normalize(p, shopid):
    iid = str(p.get("itemid") or p.get("item_id") or p.get("id") or "")
    pr = (p.get("price") or p.get("price_min") or 0)
    price = round(pr / 100000, 2) if pr else 0
    before = p.get("price_before_discount") or 0
    before = round(before / 100000, 2) if before else 0
    img = p.get("image") or p.get("thumbnail")
    images = [f"https://down-th.img.susercontent.com/file/{img}"] if img else []
    for i in (p.get("images") or [])[:6]:
        u = f"https://down-th.img.susercontent.com/file/{i}"
        if u not in images: images.append(u)
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

def main():
    log(f"[scrape] shop = {SHOP}")
    major = chrome_major()
    opts = uc.ChromeOptions()
    opts.add_argument("--lang=th-TH")
    opts.add_argument("--window-size=1280,900")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    driver = None
    try:
        driver = uc.Chrome(options=opts, user_data_dir=str(PROFILE.resolve()), version_main=major)
    except Exception as e:
        emit({"error": "chrome", "message": f"Cannot start Chrome: {e}"})
        return

    try:
        driver.get(SHOP_URL)
        time.sleep(6)
        if blocked(driver.current_url):
            emit({"error": "blocked",
                  "message": "Shopee asked to log in / verify. Open the shop once in the saved Chrome profile, log in, then retry."})
            return

        # shopid via get_shop_base
        sid = None
        try:
            raw = driver.execute_script(f"""
              return await fetch('https://shopee.co.th/api/v4/shop/get_shop_base?need_cancel_rate=true&username={SHOP}',
                {{method:'GET',headers:{{'x-api-source':'pc','x-requested-with':'XMLHttpRequest'}},credentials:'include'}})
                .then(r=>r.json()).then(d=>JSON.stringify(d)).catch(e=>'ERROR:'+e);
            """)
            if raw and not raw.startswith("ERROR:"):
                d = (json.loads(raw).get("data") or {})
                sid = d.get("shopid") or d.get("shop_id")
        except Exception:
            pass
        if not sid:
            try:
                mm = re.search(r'"shopid"\s*:\s*(\d+)', driver.page_source)
                if mm: sid = mm.group(1)
            except Exception:
                pass
        if not sid:
            emit({"error": "noshopid", "message": "Could not find the shop id for " + SHOP})
            return
        sid = str(sid)
        log(f"[scrape] shopid = {sid}")

        # fetch products via search API (browser fetch -> uses session cookies)
        products, offset, seen, page = [], 0, set(), 0
        while page < 30:
            page += 1
            try:
                raw = driver.execute_script(f"""
                  return await fetch('https://shopee.co.th/api/v4/search/search_items?by=pop&limit=60&match_id={sid}&newest={offset}&order=desc&page_type=shop&scenario=PAGE_OTHERS&version=2',
                    {{method:'GET',headers:{{'x-api-source':'pc','x-requested-with':'XMLHttpRequest'}},credentials:'include'}})
                    .then(r=>r.json()).then(d=>JSON.stringify(d)).catch(e=>'ERROR:'+e);
                """)
            except Exception as e:
                log(f"[scrape] js error: {e}"); break
            if not raw or raw.startswith("ERROR:"):
                log(f"[scrape] api error page {page}"); break
            try:
                data = json.loads(raw)
            except Exception:
                break
            err = data.get("error")
            if err and int(err) != 0:
                log(f"[scrape] api error code {err}")
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
                products.append(normalize(prod, sid))
                added += 1
            log(f"[scrape] page {page}: +{added} (total {len(products)})")
            if data.get("nomore") or added == 0 or len(items) < 60:
                break
            offset += 60
            time.sleep(random.uniform(0.8, 1.6))

        if not products:
            emit({"error": "empty", "message": "No products returned — the shop may be empty or Shopee blocked the request."})
            return

        # second pass — fetch the real product description for each item
        # (capped so a huge shop doesn't run forever)
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
        log(f"[scrape] descriptions fetched for {min(len(products), DESC_LIMIT)} items")

        emit({"ok": True, "shop": SHOP, "shopid": sid, "count": len(products), "products": products})
    finally:
        try: driver.quit()
        except Exception: pass

if __name__ == "__main__":
    main()
