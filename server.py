import hashlib
import html
import json
import re
import ssl
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "data" / "news.json"
IMGDIR = ROOT / "Assets" / "news"
WIB = timezone(timedelta(hours=7))
REFRESH_HOUR = 7
MAX_ITEMS = 60
MAX_IMAGES = 24
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FolkNews/1.0"

FEEDS = [
    ("Detik", "https://news.detik.com/berita/rss"),
    ("Tempo", "https://rss.tempo.co/nasional"),
    ("Antara", "https://www.antaranews.com/rss/terkini"),
    ("CNN Indonesia", "https://www.cnnindonesia.com/rss"),
]

CATEGORY_RULES = [
    ("Law", r"\b(kpk|dpr|dprd|uu|undang|korupsi|kejati|pengadilan|polisi|bnn|bnpb)\b"),
    ("Politics", r"\b(prabowo|presiden|gibran|mpr|pilkada|partai|menteri|gubernur|bupati)\b"),
    ("World", r"\b(apec|china|amerika|rusia|ukraina|israel|iran|jerman|asia|eropa|singapura)\b"),
    ("Economy", r"\b(rupiah|ihsg|harga|ekonomi|investasi|pajak|bank|umkm|bpjs|bursa)\b"),
    ("Sports", r"\b(persib|bola|liga|olahraga|pemain|badminton|moto|tenis|piala)\b"),
    ("Technology", r"\b(teknologi|digital|kecerdasan|siber|hacker|aplikasi|smartphone|microsoft|google|data)\b"),
    ("Health", r"\b(kesehatan|rumah sakit|dokter|penyakit|kanker|gizi|vaksin|stunting)\b"),
    ("Local", r"\b(jakarta|bogor|bandung|surabaya|banten|jawa|kota|warga)\b"),
]

TAG = re.compile(r"<[^>]+>")
SPACE = re.compile(r"\s+")
IMG_TAG = re.compile(r"<img[^>]+src=[\"']([^\"']+)[\"']", re.I)
LOCK = threading.Lock()
CACHE.parent.mkdir(parents=True, exist_ok=True)
IMGDIR.mkdir(parents=True, exist_ok=True)


def open_url(request, timeout):
    try:
        return urlopen(request, timeout=timeout)
    except Exception as error:
        if "CERTIFICATE" not in str(error).upper():
            raise
        return urlopen(request, timeout=timeout, context=ssl._create_unverified_context())


def local(tag):
    return tag.rsplit("}", 1)[-1]


def child_text(node, name):
    for child in node:
        if local(child.tag) == name:
            return "".join(child.itertext()).strip()
    return ""


def child_attr(node, name, attr):
    for child in node:
        if local(child.tag) == name:
            return (child.get(attr) or "").strip()
    return ""


def clean(value, limit=220):
    text = TAG.sub(" ", value or "")
    text = html.unescape(text)
    text = SPACE.sub(" ", text).strip(" -\u2013")
    if limit and len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0] + "\u2026"
    return text


def guess_category(title):
    value = (title or "").lower()
    for category, pattern in CATEGORY_RULES:
        if re.search(pattern, value):
            return category
    return "News"


def parse_date(raw):
    try:
        value = parsedate_to_datetime(raw)
        if value.tzinfo is None:
            value = value.replace(tzinfo=WIB)
        return value.astimezone(WIB)
    except Exception:
        return datetime.now(WIB)


def time_label(value, now):
    minutes = int((now - value).total_seconds() // 60)
    if minutes < 1:
        return "Just now"
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour" + ("s" if hours > 1 else "") + " ago"
    days = hours // 24
    if days == 1:
        return "Yesterday"
    return value.strftime("%d %b %Y")


def find_image(node, description):
    direct = child_text(node, "img")
    if direct.startswith("http"):
        return html.unescape(direct)
    for name in ("thumbnail", "content"):
        value = child_attr(node, name, "url")
        if value.startswith("http"):
            return html.unescape(value)
    enclosed = child_attr(node, "enclosure", "url")
    if enclosed.startswith("http"):
        return html.unescape(enclosed)
    found = IMG_TAG.search(description or "")
    if found:
        return html.unescape(found.group(1))
    return ""


def parse_feed(source, url, now):
    request = Request(url, headers={"User-Agent": UA})
    with open_url(request, 15) as response:
        root = ET.fromstring(response.read())
    result = []
    for node in root.iter():
        if local(node.tag) != "item":
            continue
        title = clean(child_text(node, "title"), 0)
        link = child_text(node, "link")
        description = child_text(node, "description")
        if not description:
            description = child_text(node, "encoded")
        published = parse_date(child_text(node, "pubDate"))
        result.append({
            "id": child_text(node, "guid") or link or title,
            "title": title,
            "url": link,
            "source": source,
            "published": published.isoformat(),
            "timeLabel": time_label(published, now),
            "category": guess_category(title),
            "image": find_image(node, description),
            "excerpt": clean(description),
        })
    return result


def save_image(url):
    if not url.startswith("http"):
        return url
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix not in (".jpg", ".jpeg", ".png", ".webp"):
        suffix = ".jpg"
    name = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16] + suffix
    target = IMGDIR / name
    if target.exists():
        return f"Assets/news/{name}"
    try:
        request = Request(url, headers={"User-Agent": UA, "Referer": "https://www.google.com/"})
        with open_url(request, 10) as response:
            if not response.headers.get("Content-Type", "").startswith("image/"):
                return url
            data = response.read(2_000_000)
        if not data:
            return url
        target.write_bytes(data)
        return f"Assets/news/{name}"
    except Exception:
        return url


def read_cache():
    try:
        return json.loads(CACHE.read_text(encoding="utf-8"))
    except Exception:
        return {"updatedAt": None, "items": [], "errors": []}


def refresh():
    with LOCK:
        now = datetime.now(WIB)
        collected, errors = [], []
        for source, url in FEEDS:
            try:
                collected.extend(parse_feed(source, url, now))
            except Exception as error:
                errors.append(f"{source}: {error}")
        seen = set()
        items = []
        for item in collected:
            if not item["title"] or not item["url"] or item["id"] in seen:
                continue
            seen.add(item["id"])
            items.append(item)
        items.sort(key=lambda x: x["published"], reverse=True)
        items = items[:MAX_ITEMS]
        if not items:
            print("no items fetched; keeping previous cache")
            return read_cache()
        for item in items[:MAX_IMAGES]:
            item["image"] = save_image(item["image"])
        keep = {Path(item["image"]).name for item in items if item["image"].startswith("Assets/news/")}
        for old in IMGDIR.glob("*.*"):
            if old.name not in keep:
                try:
                    old.unlink()
                except OSError:
                    pass
        payload = {
            "updatedAt": now.isoformat(),
            "sources": [source for source, _ in FEEDS],
            "errors": errors,
            "items": items,
        }
        temporary = CACHE.with_name("news.json.tmp")
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(CACHE)
        print(f"[{now:%H:%M:%S}] refreshed {len(items)} items; errors: {errors}")
        return payload


def due():
    now = datetime.now(WIB)
    payload = read_cache()
    raw = payload.get("updatedAt")
    if not raw:
        return True
    try:
        last = datetime.fromisoformat(raw).astimezone(WIB)
    except Exception:
        return True
    if now.hour < REFRESH_HOUR:
        return False
    return last.date() < now.date() or last.hour < REFRESH_HOUR


def scheduler():
    while True:
        if due():
            try:
                refresh()
            except Exception as error:
                print("auto refresh failed:", error)
        time.sleep(60)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/news":
            self.send_json(read_cache())
        elif path == "/api/refresh":
            self.send_json(refresh())
        else:
            super().do_GET()

    def send_json(self, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    IMGDIR.mkdir(parents=True, exist_ok=True)
    if "--once" in sys.argv:
        refresh()
    else:
        threading.Thread(target=scheduler, daemon=True).start()
        server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
        print("Folk: http://localhost:8000/home.html")
        print("API: http://localhost:8000/api/news | manual refresh: /api/refresh")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
