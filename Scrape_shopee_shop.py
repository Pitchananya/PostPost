# -*- coding: utf-8 -*-
"""
scrape_shopee_shop.py — ดึงสินค้าทั้งหมดจากร้าน Shopee
ใช้ undetected-chromedriver เพื่อเลี่ยงระบบกันบอท

วิธีใช้ (รันบนเครื่องตัวเอง):
  1) pip install undetected-chromedriver setuptools
  2) python Scrape_shopee_shop.py <ชื่อร้าน หรือ URL ร้าน>
       เช่น  python Scrape_shopee_shop.py nivea_official_store
            python Scrape_shopee_shop.py https://shopee.co.th/nivea_official_store
       (ถ้าไม่ใส่ จะใช้ร้านเริ่มต้น happyprice.sh)
  3) Chrome เปิดขึ้นมา — ปิด popup / แก้ captcha ถ้ามี แล้วกด Enter ที่ terminal
  4) ได้ไฟล์ shopee_<ชื่อร้าน>_products.json และ .csv
"""

import json
import time
import random
import csv
import sys
from pathlib import Path

try:
    import undetected_chromedriver as uc
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
except ImportError:
    print("X  ยังไม่มี undetected-chromedriver — ติดตั้งก่อน:")
    print("   pip install undetected-chromedriver setuptools")
    sys.exit(1)

# ===== ตั้งค่า =====
# รับชื่อร้านจาก command line:  python Scrape_shopee_shop.py <ชื่อร้าน-หรือ-URL>
# ถ้าไม่ใส่ จะใช้ค่าเริ่มต้น happyprice.sh
DEFAULT_SHOP = "happyprice.sh"


def parse_shop_arg():
    """แยกชื่อร้าน (username) จาก argument — รับได้ทั้งชื่อร้านล้วน หรือ URL เต็ม"""
    import re
    arg = sys.argv[1].strip() if len(sys.argv) > 1 else DEFAULT_SHOP
    # ถ้าเป็น URL เต็ม → ดึงเฉพาะ username
    m = re.search(r"shopee\.[^/]+/([^/?#]+)", arg)
    if m:
        return m.group(1)
    return arg.lstrip("/").split("/")[0].split("?")[0].split("#")[0]


SHOP_NAME  = parse_shop_arg()
SHOP_URL   = f"https://shopee.co.th/{SHOP_NAME}"
SHOP_API   = "https://shopee.co.th/api/v4/search/search_items"
_SLUG      = "".join(c if c.isalnum() else "_" for c in SHOP_NAME)
OUT_JSON   = Path(f"shopee_{_SLUG}_products.json")
OUT_CSV    = Path(f"shopee_{_SLUG}_products.csv")
PROFILE    = Path(".chrome-profile-shopee")
PROFILE.mkdir(exist_ok=True)

# JS สำหรับดึง shopid จากหน้าร้าน
GET_SHOPID_JS = r"""
try {
  var m = window.__NEXT_DATA__ || window.__INITIAL_STATE__;
  if (m) return JSON.stringify(m).match(/"shopid":(\d+)/)?.[1] || null;
  return null;
} catch(e) { return null; }
"""

# JS ดึงสินค้าจาก API response ที่ browser intercepted
SCROLL_AND_LOAD_JS = """
window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
"""


def get_chrome_major():
    """ตรวจหาเลขเวอร์ชันหลักของ Chrome ที่ติดตั้งบน Windows (เช่น 148)"""
    import re
    # 1) อ่านจาก registry
    try:
        import winreg
        for hive in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
            try:
                key = winreg.OpenKey(hive, r"SOFTWARE\Google\Chrome\BLBeacon")
                ver, _ = winreg.QueryValueEx(key, "version")
                winreg.CloseKey(key)
                if ver:
                    return int(ver.split(".")[0])
            except OSError:
                continue
    except Exception:
        pass
    # 2) อ่านจากชื่อโฟลเดอร์ใน Application
    import os
    for base in (
        r"C:\Program Files\Google\Chrome\Application",
        r"C:\Program Files (x86)\Google\Chrome\Application",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application"),
    ):
        try:
            for name in os.listdir(base):
                m = re.match(r"(\d+)\.\d+\.\d+\.\d+$", name)
                if m:
                    return int(m.group(1))
        except OSError:
            continue
    return None


def make_driver():
    opts = uc.ChromeOptions()
    opts.add_argument("--lang=th-TH")
    opts.add_argument("--window-size=1380,960")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    # opts.add_argument("--headless=new")  # เปิดบรรทัดนี้ถ้าไม่ต้องการเห็นหน้าต่าง

    major = get_chrome_major()
    if major:
        print(f"  ตรวจพบ Chrome เวอร์ชัน {major} — ใช้ ChromeDriver ให้ตรงกัน")
    else:
        print("  ! ตรวจเวอร์ชัน Chrome ไม่ได้ — ให้ UC เดาเอง")

    driver = uc.Chrome(
        options=opts,
        user_data_dir=str(PROFILE.resolve()),
        version_main=major,  # บังคับ driver ให้ตรงกับ Chrome ที่ติดตั้ง
    )
    driver.execute_cdp_cmd("Network.enable", {})
    return driver


def get_shopid_via_api(driver):
    """
    วิธีที่เชื่อถือได้ที่สุด: เรียก API get_shop_base ด้วย username
    คืนค่า shopid (str) หรือ None
    """
    js = f"""
    return await fetch(
      'https://shopee.co.th/api/v4/shop/get_shop_base?need_cancel_rate=true&username={SHOP_NAME}',
      {{
        method: 'GET',
        headers: {{
          'x-api-source': 'pc',
          'x-requested-with': 'XMLHttpRequest',
          'referer': 'https://shopee.co.th/{SHOP_NAME}'
        }},
        credentials: 'include'
      }}
    ).then(r => r.json()).then(d => JSON.stringify(d)).catch(e => 'ERROR:' + e);
    """
    try:
        raw = driver.execute_script(js)
        if not raw or raw.startswith("ERROR:"):
            return None
        data = json.loads(raw)
        d = data.get("data") or {}
        sid = d.get("shopid") or d.get("shop_id")
        if sid:
            return str(sid)
    except Exception:
        pass
    return None


def get_shopid_from_page(driver):
    """พยายามดึง shopid จากหน้า HTML หลายวิธี"""
    # วิธี 0 (ดีที่สุด): เรียก API get_shop_base
    sid = get_shopid_via_api(driver)
    if sid:
        return sid

    # วิธี 1: จาก JS global state
    sid = driver.execute_script(GET_SHOPID_JS)
    if sid:
        return str(sid).strip()

    # วิธี 2: จาก URL ของ API calls (network requests)
    try:
        logs = driver.execute_script("""
          var entries = performance.getEntriesByType('resource');
          return entries.map(function(e){ return e.name; }).join('\\n');
        """)
        for line in (logs or "").split("\n"):
            if "shopid=" in line:
                import re
                m = re.search(r"shopid=(\d+)", line)
                if m:
                    return m.group(1)
    except Exception:
        pass

    # วิธี 3: จาก page source โดยตรง
    try:
        import re
        src = driver.page_source
        m = re.search(r'"shopid"\s*:\s*(\d+)', src)
        if m:
            return m.group(1)
        m = re.search(r'shopid=(\d+)', src)
        if m:
            return m.group(1)
    except Exception:
        pass

    return None


def normalize_product(prod, shopid):
    """แปลง object สินค้าดิบจาก Shopee API ให้เป็น dict มาตรฐานของเรา"""
    iid = str(prod.get("itemid") or prod.get("item_id") or prod.get("id") or "")

    # ราคา (Shopee เก็บเป็นจำนวนเต็ม × 100000)
    price_raw = prod.get("price") or prod.get("price_min") or 0
    price_max_raw = prod.get("price_max") or price_raw
    price = round(price_raw / 100000, 2) if price_raw else 0
    price_max = round(price_max_raw / 100000, 2) if price_max_raw else 0
    price_before = prod.get("price_before_discount") or 0
    price_before = round(price_before / 100000, 2) if price_before else 0

    # รูปภาพ
    images = []
    img_main = prod.get("image") or prod.get("thumbnail")
    if img_main:
        images.append(f"https://down-th.img.susercontent.com/file/{img_main}")
    for img in (prod.get("images") or [])[:8]:
        url = f"https://down-th.img.susercontent.com/file/{img}"
        if url not in images:
            images.append(url)

    rating_obj = prod.get("item_rating") or {}

    return {
        "itemid":         iid,
        "shopid":         str(prod.get("shopid") or prod.get("shop_id") or shopid),
        "name":           (prod.get("name") or prod.get("title") or "").strip(),
        "price":          price,
        "price_max":      price_max,
        "price_before":   price_before,
        "discount":       prod.get("raw_discount") or prod.get("discount") or 0,
        "stock":          prod.get("stock") or 0,
        "sold":           prod.get("historical_sold") or prod.get("sold") or 0,
        "rating":         round(rating_obj.get("rating_star", 0) or 0, 2),
        "rating_count":   sum(rating_obj.get("rating_count", []) or []),
        "liked_count":    prod.get("liked_count") or 0,
        "category_id":    prod.get("catid") or "",
        "brand":          prod.get("brand") or "",
        "condition":      "ใหม่" if prod.get("is_adult") == False else "",
        "free_shipping":  bool(prod.get("show_free_shipping")),
        "cod":            bool(prod.get("cod_flag") or prod.get("is_cod_flag")),
        "in_stock":       (prod.get("stock") or 0) > 0,
        "description":    (prod.get("description") or "").strip(),
        "thumbnail":      images[0] if images else "",
        "images":         images,
        "url":            f"https://shopee.co.th/{SHOP_NAME}/product/{shopid}/{iid}",
        "shopee_url":     f"https://shopee.co.th/product/{shopid}/{iid}",
        "source":         "search_api",
    }


def fetch_products_via_api(driver, shopid, page_size=60):
    """
    ใช้ browser เรียก Shopee API โดยตรง (ผ่าน fetch ใน JS context)
    วิธีนี้ใช้ cookies/session เดียวกับ browser จึงผ่านการยืนยันตัวตน
    """
    all_products = []
    offset = 0
    page_num = 0
    seen_ids = set()

    print(f"\n[API] shopid = {shopid}")
    print("[API] เริ่มดึงสินค้าทีละ", page_size, "ชิ้น...\n")

    # ต้องยิง fetch จาก context ของหน้าร้านจริง — ตรวจให้แน่ใจก่อน
    if SHOP_NAME not in (driver.current_url or "") or is_blocked_url(driver.current_url):
        driver.get(SHOP_URL)
        time.sleep(5)
        if is_blocked_url(driver.current_url):
            print("  ! ยังโดน anti-bot อยู่ — ข้ามไปใช้วิธี DOM")
            return []

    while True:
        page_num += 1
        js = f"""
        return await fetch(
          'https://shopee.co.th/api/v4/search/search_items' +
          '?by=pop&limit={page_size}&match_id={shopid}&newest={offset}&order=desc&page_type=shop&scenario=PAGE_OTHERS&version=2',
          {{
            method: 'GET',
            headers: {{
              'x-api-source': 'pc',
              'x-requested-with': 'XMLHttpRequest'
            }},
            credentials: 'include'
          }}
        ).then(r => r.json()).then(d => JSON.stringify(d)).catch(e => 'ERROR:' + e);
        """
        try:
            raw = driver.execute_script(js)
        except Exception as e:
            print(f"  ! JS execute error: {e}")
            break

        if not raw or raw.startswith("ERROR:"):
            print(f"  ! API error หน้า {page_num}: {raw}")
            break

        try:
            data = json.loads(raw)
        except Exception:
            print(f"  ! JSON parse error หน้า {page_num}")
            break

        # ตรวจ error code
        error = data.get("error") or data.get("err")
        if error and int(error) != 0:
            print(f"  ! API ส่ง error={error} : {data.get('error_msg','')}")
            if str(error) == "90309999":
                print("    (error 90309999 = โดนระบบกันบอทของ Shopee)")
            break

        items = []
        # รองรับ response format หลายแบบ
        if "items" in data:
            items = data["items"]
        elif "data" in data and isinstance(data["data"], dict):
            items = data["data"].get("items", [])
        elif "result" in data:
            items = data["result"]

        total_count = data.get("total_count") or 0
        nomore = bool(data.get("nomore"))

        if not items:
            print(f"  หน้า {page_num}: ไม่มีสินค้าเพิ่มแล้ว (offset={offset})")
            break

        new_items = 0
        for item in items:
            # รองรับ nested item_basic
            prod = item.get("item_basic") or item.get("basic") or item
            iid = str(prod.get("itemid") or prod.get("item_id") or prod.get("id") or "")
            if not iid or iid in seen_ids:
                continue
            seen_ids.add(iid)

            all_products.append(normalize_product(prod, shopid))
            new_items += 1

        total_txt = f"/{total_count}" if total_count else ""
        print(f"  หน้า {page_num:3d} | offset={offset:5d} | +{new_items:3d} | "
              f"รวม {len(all_products):4d}{total_txt} สินค้า")

        if nomore or new_items == 0 or len(items) < page_size:
            print("  ครบแล้ว!")
            break
        if total_count and len(all_products) >= total_count:
            print("  ครบตามจำนวน total_count แล้ว!")
            break

        offset += page_size
        time.sleep(random.uniform(0.8, 1.8))

    return all_products


# JS เก็บ itemid ของสินค้าทุกชิ้นที่ปรากฏใน DOM
COLLECT_ITEMIDS_JS = r"""
var out = [];
var seen = {};
document.querySelectorAll('a[href]').forEach(function(a){
  var h = a.href || '';
  var m = h.match(/i\.(\d+)\.(\d+)/) || h.match(/\/product\/(\d+)\/(\d+)/);
  if (!m) return;
  var iid = m[2];
  if (seen[iid]) return;
  seen[iid] = 1;
  var card = a.closest('[data-sqe="item"]') ||
             a.closest('.shopee-search-item-result__item') || a;
  var img = card.querySelector('img');
  var name = a.getAttribute('title') || a.textContent || '';
  out.push({
    itemid: iid, shopid: m[1],
    name: (name||'').trim().slice(0,200),
    thumbnail: (img && img.src) || '',
    url: h
  });
});
return out;
"""


def collect_itemids_via_dom(driver, shopid):
    """
    เปิดแท็บ 'สินค้าทั้งหมด' แล้วไล่เก็บ itemid ทุกชิ้นที่หน้าเว็บแสดง
    (รวมสินค้าหมดสต็อก ที่ search API กรองออก)
    คืน dict: { itemid: {name, thumbnail, url, ...} }
    """
    print("\n[DOM] เปิดแท็บ 'สินค้าทั้งหมด' เพื่อเก็บ itemid ครบทุกชิ้น...")
    found = {}

    driver.get(SHOP_URL)
    time.sleep(5)
    if is_blocked_url(driver.current_url):
        print("  ! โดน anti-bot — ข้ามขั้นตอน DOM")
        return found

    # คลิกแท็บ All Products / สินค้าทั้งหมด
    driver.execute_script(r"""
      var els = document.querySelectorAll('a, div, button, span');
      for (var i=0;i<els.length;i++){
        var t=(els[i].textContent||'').trim();
        if (t==='All Products' || t==='สินค้าทั้งหมด'){ els[i].click(); break; }
      }
    """)
    time.sleep(4)

    # รองรับทั้ง pagination (มีเลขหน้า) และ infinite-scroll
    stale = 0
    for rnd in range(1, 40):
        # เลื่อนหน้าจอให้การ์ดโหลดครบ
        for _ in range(6):
            driver.execute_script("window.scrollBy(0, 1000);")
            time.sleep(0.5)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1.5)

        items = driver.execute_script(COLLECT_ITEMIDS_JS) or []
        before = len(found)
        for it in items:
            iid = it.get("itemid")
            if iid and iid not in found and str(it.get("shopid")) == str(shopid):
                found[iid] = it
        added = len(found) - before

        # คลิกปุ่มหน้าถัดไปของ pagination (ถ้ามี)
        clicked = driver.execute_script(r"""
          var sel = document.querySelector('.shopee-icon-button--right');
          if (sel && !sel.disabled && !(sel.className||'').includes('disabled')){
            sel.click(); return true;
          }
          var btns = document.querySelectorAll('button');
          for (var i=0;i<btns.length;i++){
            var c = btns[i].className||'';
            if (c.includes('icon-button') && c.includes('right') &&
                !btns[i].disabled && !c.includes('disabled')){
              btns[i].click(); return true;
            }
          }
          return false;
        """)
        mode = "คลิกหน้าถัดไป" if clicked else "เลื่อนต่อ"
        print(f"  รอบ {rnd:2d}: เห็นลิงก์ {len(items):3d} | itemid สะสม {len(found):3d} (+{added}) | {mode}")

        # หยุดเมื่อไม่มี itemid ใหม่ติดต่อกัน และไม่มีปุ่มหน้าถัดไปให้กด
        stale = stale + 1 if added == 0 else 0
        if stale >= 3:
            print("  ไม่มี itemid ใหม่อีกแล้ว — หยุด")
            break

        if clicked:
            time.sleep(random.uniform(2.5, 4))
            driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(1)
        else:
            time.sleep(random.uniform(1.5, 2.5))

    print(f"  [DOM] เก็บ itemid ได้ทั้งหมด {len(found)} ชิ้น")
    return found


def fetch_item_detail(driver, shopid, itemid):
    """ดึงรายละเอียดสินค้ารายชิ้นผ่าน API item/get (ใช้กับสินค้าที่ search API ไม่เจอ)"""
    js = f"""
    return await fetch(
      'https://shopee.co.th/api/v4/item/get?itemid={itemid}&shopid={shopid}',
      {{
        method: 'GET',
        headers: {{ 'x-api-source': 'pc', 'x-requested-with': 'XMLHttpRequest' }},
        credentials: 'include'
      }}
    ).then(r => r.json()).then(d => JSON.stringify(d)).catch(e => 'ERROR:' + e);
    """
    try:
        raw = driver.execute_script(js)
        if not raw or raw.startswith("ERROR:"):
            return None
        data = json.loads(raw)
        if data.get("error"):
            return None
        d = data.get("data") or {}
        prod = d.get("item") or d
        if not (prod.get("itemid") or prod.get("item_id") or
                prod.get("name") or prod.get("title")):
            return None
        p = normalize_product(prod, shopid)
        p["source"] = "item_api"
        return p
    except Exception:
        return None


def fill_missing_products(driver, shopid, products, dom_items):
    """เติมสินค้าที่ search API ไม่เจอ โดยอ้างอิง itemid ที่เก็บจาก DOM"""
    have = {p["itemid"] for p in products}
    missing = [iid for iid in dom_items if iid not in have]
    print(f"\n[เติม] DOM เห็น {len(dom_items)} ชิ้น | search API ได้ {len(have)} ชิ้น "
          f"| ต้องเติมอีก {len(missing)} ชิ้น")

    filled = 0
    for i, iid in enumerate(missing, 1):
        detail = fetch_item_detail(driver, shopid, iid)
        dm = dom_items.get(iid, {})
        if detail:
            products.append(detail)
            filled += 1
            print(f"  +{i:2d}/{len(missing)} {detail['name'][:42]} (stock={detail['stock']})")
        else:
            # ใช้ข้อมูลเท่าที่มีจาก DOM
            thumb = dm.get("thumbnail", "")
            products.append({
                "itemid": iid, "shopid": str(shopid),
                "name": dm.get("name", ""), "price": 0, "price_max": 0,
                "price_before": 0, "discount": 0, "stock": 0, "sold": 0,
                "rating": 0, "rating_count": 0, "liked_count": 0,
                "category_id": "", "brand": "", "condition": "",
                "free_shipping": False, "cod": False, "in_stock": False,
                "thumbnail": thumb, "images": [thumb] if thumb else [],
                "url": dm.get("url", f"https://shopee.co.th/{SHOP_NAME}/product/{shopid}/{iid}"),
                "shopee_url": f"https://shopee.co.th/product/{shopid}/{iid}",
                "source": "dom_only",
            })
            print(f"  +{i:2d}/{len(missing)} {dm.get('name','')[:42]} (DOM อย่างเดียว — รายละเอียดไม่ครบ)")
        time.sleep(random.uniform(0.4, 1.0))

    print(f"  เติมสำเร็จแบบมีรายละเอียดครบ {filled}/{len(missing)} ชิ้น")
    return products


def extract_description_text(prod):
    """
    รวมข้อความ description จาก response item/get
    รองรับทั้งแบบข้อความล้วน (field 'description')
    และแบบ rich/รูปภาพ (description_info.description_blocks)
    """
    plain = prod.get("description")
    plain = plain.strip() if isinstance(plain, str) else ""

    parts = []
    info = prod.get("description_info")
    if isinstance(info, dict):
        for blk in (info.get("description_blocks") or []):
            if not isinstance(blk, dict):
                continue
            t = blk.get("text")
            if isinstance(t, dict):
                t = t.get("text") or t.get("content")
            if isinstance(t, str) and t.strip():
                parts.append(t.strip())
    rich = "\n".join(parts)

    return rich or plain


def fetch_description(driver, shopid, itemid):
    """
    ดึง description ของสินค้า 1 ชิ้นผ่าน API item/get
    คืนค่า: str = ข้อความ (อาจเป็น '' ถ้าสินค้าไม่มีรายละเอียดจริง)
            None = ดึงไม่สำเร็จ / โดน anti-bot บล็อก
    """
    js = f"""
    return await fetch(
      'https://shopee.co.th/api/v4/item/get?itemid={itemid}&shopid={shopid}',
      {{
        method: 'GET',
        headers: {{ 'x-api-source': 'pc', 'x-requested-with': 'XMLHttpRequest' }},
        credentials: 'include'
      }}
    ).then(r => r.json()).then(d => JSON.stringify(d)).catch(e => 'ERROR:' + e);
    """
    try:
        raw = driver.execute_script(js)
    except Exception:
        return None
    if not raw or raw.startswith("ERROR:"):
        return None
    try:
        data = json.loads(raw)
    except Exception:
        return None
    if data.get("error"):
        return None
    d = data.get("data") or {}
    prod = d.get("item") or d
    if not isinstance(prod, dict) or not prod:
        return None
    return extract_description_text(prod)


def enrich_with_descriptions(driver, shopid, products):
    """
    เติมฟิลด์ description ให้สินค้าทุกชิ้น (เรียก item/get รายชิ้น)
    มีระบบหน่วงเวลา + พักเมื่อโดน rate-limit + รอบเก็บตก
    """
    MAX_ROUNDS = 4

    # นำ description ที่เคยดึงไว้แล้วจากไฟล์เดิมมาใช้ต่อ (กันดึงซ้ำเมื่อรันหลายรอบ)
    if OUT_JSON.exists():
        try:
            prev = json.loads(OUT_JSON.read_text(encoding="utf-8"))
            prev_desc = {p["itemid"]: p["description"]
                         for p in prev if p.get("description")}
            reused = 0
            for p in products:
                if not p.get("description") and p["itemid"] in prev_desc:
                    p["description"] = prev_desc[p["itemid"]]
                    reused += 1
            if reused:
                print(f"\n    (นำ description {reused} ชิ้นจากไฟล์เดิมมาใช้ต่อ)")
        except Exception:
            pass

    done = {p["itemid"] for p in products if p.get("description")}
    total = len(products)
    print(f"\n[4] ดึงรายละเอียด (description) — ต้องดึง {total - len(done)} จาก {total} ชิ้น")
    print("    (มีหน่วงเวลากัน anti-bot — ขั้นตอนนี้อาจใช้เวลาหลายนาที)")

    for rnd in range(1, MAX_ROUNDS + 1):
        pending = [p for p in products if p["itemid"] not in done]
        if not pending:
            break
        if rnd > 1:
            print(f"\n  -- รอบเก็บตกที่ {rnd}: เหลือ {len(pending)} ชิ้น --")

        consec = 0
        lo, hi = 0.7 + rnd * 0.3, 1.6 + rnd * 0.6   # รอบหลังหน่วงนานขึ้น
        for i, p in enumerate(pending, 1):
            desc = fetch_description(driver, shopid, p["itemid"])
            if desc is None:
                consec += 1
                if consec >= 6:
                    cooldown = 45 + rnd * 25
                    print(f"    ! โดน rate-limit — พัก {cooldown}s แล้วรีเฟรชหน้าร้าน...")
                    try:
                        driver.get(SHOP_URL)
                    except Exception:
                        pass
                    time.sleep(cooldown)
                    consec = 0
            else:
                consec = 0
                p["description"] = desc
                done.add(p["itemid"])

            if i % 25 == 0 or i == len(pending):
                got = len(done)
                print(f"    {i:4d}/{len(pending)} | description รวม {got}/{total} ชิ้น")
            time.sleep(random.uniform(lo, hi))

        if [p for p in products if p["itemid"] not in done] and rnd < MAX_ROUNDS:
            print("  พัก 60s ก่อนรอบเก็บตกถัดไป...")
            try:
                driver.get(SHOP_URL)
            except Exception:
                pass
            time.sleep(60)

    have = sum(1 for p in products if p.get("description"))
    miss = total - len(done)
    print(f"  เสร็จ — มี description {have}/{total} ชิ้น "
          f"(ดึงไม่สำเร็จ {miss} ชิ้น)")
    return products


def scrape_by_scrolling(driver):
    """
    Fallback: scroll หน้าร้านแล้วดึงข้อมูลจาก DOM
    ใช้เมื่อ API ไม่ตอบสนอง
    """
    print("\n[DOM] ใช้วิธี scroll แทน...")
    all_products = []
    seen = set()
    prev_count = 0
    no_change = 0

    # ไปที่แท็บ 'สินค้าทั้งหมด' (product list)
    if "#product_list" not in (driver.current_url or ""):
        driver.get(SHOP_URL + "#product_list")
        time.sleep(5)
        if is_blocked_url(driver.current_url):
            print("  ! ยังโดน anti-bot — แก้ในหน้าต่าง Chrome แล้วลองรันใหม่")
            return []

    # พยายามคลิกแท็บ 'All Products' / 'สินค้าทั้งหมด'
    try:
        driver.execute_script("""
          var tabs = document.querySelectorAll('a, div, button');
          for (var i=0;i<tabs.length;i++){
            var t = (tabs[i].textContent||'').trim();
            if (t==='All Products' || t==='สินค้าทั้งหมด'){ tabs[i].click(); break; }
          }
        """)
        time.sleep(4)
    except Exception:
        pass

    for scroll_n in range(200):
        driver.execute_script(SCROLL_AND_LOAD_JS)
        time.sleep(2.5)

        items_js = """
        var cards = document.querySelectorAll('[data-sqe="item"]');
        if (!cards.length) cards = document.querySelectorAll('.shopee-search-item-result__item');
        var out = [];
        cards.forEach(function(el) {
          try {
            var name = (el.querySelector('[class*="FGFHif"]') ||
                        el.querySelector('[class*="itemName"]') ||
                        el.querySelector('a[title]'))?.textContent?.trim() ||
                       el.querySelector('a')?.getAttribute('title') || '';
            var link = el.querySelector('a')?.href || '';
            var thumb = el.querySelector('img')?.src || '';
            var priceEl = el.querySelector('[class*="IZPeQz"]') ||
                          el.querySelector('[class*="price"]');
            var price = priceEl?.textContent?.replace(/[^0-9.]/g,'') || '';
            out.push({ name, link, thumbnail: thumb, price: parseFloat(price)||0 });
          } catch(e) {}
        });
        return out;
        """
        items = driver.execute_script(items_js) or []

        for it in items:
            key = it.get("link","") or it.get("name","")
            if key and key not in seen:
                seen.add(key)
                all_products.append(it)

        if len(all_products) == prev_count:
            no_change += 1
            if no_change >= 5:
                print(f"  scroll {scroll_n+1}: ไม่มีสินค้าเพิ่มแล้ว — หยุด")
                break
        else:
            no_change = 0
            print(f"  scroll {scroll_n+1}: รวม {len(all_products)} สินค้า")
            prev_count = len(all_products)

    return all_products


def save_results(products):
    # บันทึก JSON
    OUT_JSON.write_text(
        json.dumps(products, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"\n✓ บันทึก JSON → {OUT_JSON}  ({OUT_JSON.stat().st_size//1024} KB)")

    # บันทึก CSV
    if products:
        fields = ["itemid","name","price","price_max","price_before","discount",
                  "stock","sold","rating","rating_count","liked_count",
                  "brand","in_stock","free_shipping","cod","source",
                  "thumbnail","url","description"]
        csv_target = OUT_CSV
        while True:
            try:
                with open(csv_target, "w", newline="", encoding="utf-8-sig") as f:
                    writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
                    writer.writeheader()
                    writer.writerows(products)
                print(f"✓ บันทึก CSV  → {csv_target}  ({len(products)} แถว)")
                break
            except PermissionError:
                print(f"\n  ! เขียน {csv_target} ไม่ได้ — ไฟล์ถูกเปิดค้างอยู่ (เช่นใน Excel)")
                ans = input("  >>> ปิดไฟล์แล้วกด Enter เพื่อลองใหม่ "
                            "(หรือพิมพ์ s = บันทึกเป็นไฟล์ใหม่): ").strip().lower()
                if ans == "s":
                    csv_target = OUT_CSV.with_name(OUT_CSV.stem + "_new.csv")


def is_blocked_url(url):
    """หน้าที่ไม่ใช่หน้าร้านจริง — โดน anti-bot หรือยังไม่ล็อกอิน"""
    url = (url or "").lower()
    return any(k in url for k in (
        "verify/traffic", "/verify/", "/login", "/buyer/login", "captcha",
    ))


def ensure_on_shop_page(driver):
    """
    เปิดหน้าร้านแล้วรอจนกว่าผู้ใช้จะล็อกอิน + ผ่าน traffic verification
    คืนค่า True เมื่ออยู่หน้าร้านจริงพร้อมดึงข้อมูล
    """
    while True:
        print(f"\n[1] เปิดหน้าร้าน: {SHOP_URL}")
        driver.get(SHOP_URL)
        time.sleep(6)

        cur = driver.current_url
        blocked = is_blocked_url(cur)

        if blocked:
            print("\n" + "!" * 55)
            print("  Shopee เด้งไปหน้ายืนยันตัวตน / ให้ล็อกอิน")
            print(f"  URL ปัจจุบัน: {cur[:90]}")
            print("!" * 55)
            print("  >>> ในหน้าต่าง Chrome ให้ทำตามนี้:")
            print("      1) กด 'เข้าสู่ระบบ' แล้วล็อกอินบัญชี Shopee ให้เรียบร้อย")
            print("      2) ถ้าเจอ captcha / slider ให้แก้ให้ผ่าน")
            print(f"      3) เปิดหน้าร้าน {SHOP_NAME} ให้เห็นรายการสินค้าจริง")
        else:
            print(f"  ✓ อยู่หน้าร้านแล้ว: {cur[:90]}")
            print("  >>> ปิด popup ในหน้าต่าง Chrome ถ้ามี")

        print("=" * 55)
        ans = input("  >>> แก้เสร็จแล้วกด Enter (พิมพ์ r แล้ว Enter = โหลดหน้าร้านใหม่): ").strip().lower()

        if ans == "r":
            continue

        # ตรวจอีกครั้งว่าตอนนี้อยู่หน้าร้านจริงไหม
        cur = driver.current_url
        if is_blocked_url(cur):
            print(f"  ! ยังอยู่หน้า {cur[:70]} — ลองใหม่อีกครั้ง")
            again = input("  >>> ดำเนินการต่อทั้งที่ยังโดนบล็อก? (y = ต่อเลย / Enter = โหลดใหม่): ").strip().lower()
            if again != "y":
                continue
        return True


# ===== MAIN =====
def main():
    print("=" * 55)
    print(f"  Shopee Shop Scraper — {SHOP_NAME}")
    print("=" * 55)

    driver = make_driver()

    try:
        # เปิดหน้าร้าน + รอจนล็อกอิน/ผ่าน verification
        ensure_on_shop_page(driver)

        # ดึง shopid
        print("\n[2] กำลังหา shopid...")
        shopid = get_shopid_from_page(driver)

        products = []
        if shopid:
            print(f"  ✓ shopid = {shopid}")
            products = fetch_products_via_api(driver, shopid)

        # ถ้า API ใช้ไม่ได้ (โดน anti-bot) ให้ fallback ไป scroll DOM
        if not products:
            print("\n  ! วิธี API ไม่ได้ผล — เปลี่ยนไปใช้วิธีอ่านจากหน้าเว็บ (DOM)")
            products = scrape_by_scrolling(driver)

        if not products:
            print("\n! ไม่ได้ข้อมูลสินค้าเลย — ลองรันใหม่หรือแก้ captcha ก่อน")
            return

        # เติมสินค้าที่ search API ไม่เจอ (สินค้าหมด/ปิดการขาย) ให้ครบจำนวนจริง
        if shopid:
            print(f"\n[3] search API ได้ {len(products)} ชิ้น — ตรวจหาสินค้าที่ตกหล่น...")
            dom_items = collect_itemids_via_dom(driver, shopid)
            if dom_items:
                products = fill_missing_products(driver, shopid, products, dom_items)
            else:
                print("  ! เก็บ itemid จาก DOM ไม่ได้ — ใช้ผลจาก search API เท่าที่มี")

            # เติมรายละเอียด (description) ให้ทุกชิ้น
            products = enrich_with_descriptions(driver, shopid, products)

        # แสดงสรุป
        in_stock = sum(1 for p in products if p.get("in_stock"))
        by_src = {}
        for p in products:
            by_src[p.get("source", "?")] = by_src.get(p.get("source", "?"), 0) + 1
        print(f"\n{'='*55}")
        print(f"  ✓ ดึงได้ทั้งหมด {len(products)} สินค้า")
        print(f"    - มีสต็อก {in_stock} ชิ้น | หมดสต็อก {len(products)-in_stock} ชิ้น")
        print(f"    - แหล่งข้อมูล: " +
              ", ".join(f"{k}={v}" for k, v in by_src.items()))
        print(f"{'='*55}")
        if products:
            p = products[0]
            print(f"\n  ตัวอย่างสินค้าแรก:")
            print(f"    ชื่อ    : {p.get('name','')[:60]}")
            print(f"    ราคา   : {p.get('price',0):,.0f} บาท")
            print(f"    ขายแล้ว: {p.get('sold',0):,} ชิ้น")
            print(f"    รูป    : {len(p.get('images',[]))} รูป")

        save_results(products)

    finally:
        try:
            input("\n  กด Enter เพื่อปิด Chrome...")
        except Exception:
            pass
        try:
            driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    main()