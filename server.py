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
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "data" / "news.json"
IMGDIR = ROOT / "Assets" / "news"
WIB = timezone(timedelta(hours=7))
REFRESH_HOUR = 7
MAX_ITEMS = 6000
MAX_IMAGES = 1200
HISTORY_DAYS = 60
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FolkNews/1.0"
TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
TRANSLATE_TIMEOUT = 12
TRANSLATE_BATCH = 900

FEEDS = [
    ("Detik", "https://news.detik.com/berita/rss"),
    ("Tempo", "https://rss.tempo.co/nasional"),
    ("Tempo", "https://rss.tempo.co/"),
    ("Antara", "https://www.antaranews.com/rss/terkini"),
    ("Antara Olahraga", "https://www.antaranews.com/rss/olahraga"),
    ("Antara Hiburan", "https://www.antaranews.com/rss/hiburan"),
    ("Antara Ekonomi", "https://www.antaranews.com/rss/ekonomi"),
    ("Antara Hukum", "https://www.antaranews.com/rss/hukum"),
    ("Antara Dunia", "https://www.antaranews.com/rss/dunia"),
    ("CNN Indonesia", "https://www.cnnindonesia.com/rss"),
]

CATEGORY_RULES = [
    ("Law", r"\b(kpk|dpr|dprd|uu|undang|korupsi|kejati|pengadilan|polisi|bnn|bnpb)\b"),
    ("Politics", r"\b(prabowo|presiden|gibran|mpr|pilkada|partai|menteri|gubernur|bupati)\b"),
    ("World", r"\b(apec|china|amerika|rusia|ukraina|israel|iran|jerman|asia|eropa|singapura)\b"),
    ("Economy", r"\b(rupiah|ihsg|harga|ekonomi|investasi|pajak|bank|umkm|bpjs|bursa)\b"),
    ("Sports", r"\b(persib|bola|liga|olahraga|pemain|badminton|moto|tenis|piala)\b"),
    ("Technology", r"\b(teknologi|digital|kecerdasan|siber|hacker|aplikasi|smartphone|microsoft|google|data)\b"),
    ("Entertainment", r"\b(film|musik|konser|artis|selebriti|festival|teater|drama|netflix|spotify|game|seniman)\b"),
    ("Opinion", r"\b(opini|komentar|analisis|editorial|pandangan|tulisan|suara)\b"),
    ("Infographics", r"\b(infografis|grafik|statistik|peta|tabel)\b"),
    ("Photo", r"\b(foto|galeri|potret|dokumentasi|visual|gambar)\b"),
    ("Health", r"\b(kesehatan|rumah sakit|dokter|penyakit|kanker|gizi|vaksin|stunting)\b"),
    ("Local", r"\b(jakarta|bogor|bandung|surabaya|banten|jawa|kota|warga)\b"),
]

TAG = re.compile(r"<[^>]+>")
SPACE = re.compile(r"\s+")
IMG_TAG = re.compile(r"<img[^>]+src=[\"']([^\"']+)[\"']", re.I)
OG_IMG = re.compile(r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image(?::src)?)["\'][^>]+content=["\']([^"\']+)["\']', re.I)
OG_IMG_REV = re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image(?::src)?)["\']', re.I)
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


def is_video(item):
    path = urlparse(item.get("url", "")).path.lower()
    title = (item.get("title") or "").lower()
    return path.startswith("/video/") or "/video/" in path or bool(re.search(r"\bvideo\b", title)) or item.get("category") == "Video"


def parse_date(raw):
    try:
        value = parsedate_to_datetime(raw)
        if value.tzinfo is None:
            value = value.replace(tzinfo=WIB)
        return value.astimezone(WIB)
    except Exception:
        return datetime.now(WIB)


def item_date(item):
    try:
        return datetime.fromisoformat(item["published"]).astimezone(WIB)
    except Exception:
        return datetime.now(WIB)


def is_local_image(item):
    return (item.get("image") or "").startswith("Assets/news/")


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


def absolute_url(base, url):
    url = html.unescape((url or "").strip())
    if not url or url.startswith("data:"):
        return ""
    if url.startswith("//"):
        return "https:" + url
    parsed = urlparse(url)
    if parsed.scheme in ("http", "https"):
        return url
    if parsed.scheme or not base:
        return ""
    from urllib.parse import urljoin
    return urljoin(base, url)


def find_image(node, description, link=""):
    direct = child_text(node, "img")
    if direct.startswith("http"):
        return html.unescape(direct)
    for name in ("thumbnail", "content", "image"):
        value = child_attr(node, name, "url") or child_text(node, name)
        value = absolute_url(link, value) or (html.unescape(value) if value.startswith("http") else "")
        if value.startswith("http"):
            return value
    enclosed = child_attr(node, "enclosure", "url")
    if enclosed.startswith("http"):
        return html.unescape(enclosed)
    found = IMG_TAG.search(description or "")
    if found:
        return absolute_url(link, found.group(1))
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
            "image": find_image(node, description, link),
            "excerpt": clean(description),
        })
    return result


def fetch_page_image(url):
    if not url.startswith("http"):
        return ""
    try:
        request = Request(url, headers={"User-Agent": UA, "Referer": "https://www.google.com/"})
        with open_url(request, 10) as response:
            ctype = response.headers.get("Content-Type", "")
            if "html" not in ctype and "xml" not in ctype and ctype:
                return ""
            text = response.read(300_000).decode("utf-8", "ignore")
        found = OG_IMG.search(text) or OG_IMG_REV.search(text)
        if not found:
            return ""
        return absolute_url(url, found.group(1))
    except Exception:
        return ""


def save_image(url, page_url=""):
    if not url.startswith("http"):
        return url
    candidates = [url]
    if page_url:
        og = fetch_page_image(page_url)
        if og and og not in candidates:
            candidates.append(og)
    for candidate in candidates:
        suffix = Path(urlparse(candidate).path).suffix.lower()
        if suffix not in (".jpg", ".jpeg", ".png", ".webp"):
            suffix = ".jpg"
        name = hashlib.sha1(candidate.encode("utf-8")).hexdigest()[:16] + suffix
        target = IMGDIR / name
        if target.exists():
            return f"Assets/news/{name}"
        try:
            request = Request(candidate, headers={"User-Agent": UA, "Referer": page_url or "https://www.google.com/"})
            with open_url(request, 10) as response:
                ctype = response.headers.get("Content-Type", "")
                if not ctype.startswith("image/"):
                    continue
                data = response.read(2_000_000)
            if not data:
                continue
            target.write_bytes(data)
            return f"Assets/news/{name}"
        except Exception:
            continue
    return url


def translate_titles(items):
    wanted, seen = [], set()
    for item in items:
        title = item.get("title", "")
        if not title or item.get("title_en") or title in seen:
            continue
        seen.add(title)
        wanted.append(title)
    if not wanted:
        return 0

    batches, batch, size = [], [], 0
    for title in wanted:
        length = len(title.encode("utf-8")) + 1
        if batch and size + length > TRANSLATE_BATCH:
            batches.append(batch)
            batch, size = [], 0
        batch.append(title)
        size += length
    if batch:
        batches.append(batch)

    found = {}
    for batch in batches:
        try:
            url = TRANSLATE_URL + "?" + urlencode({
                "client": "gtx", "sl": "id", "tl": "en", "dt": "t", "q": "\n".join(batch),
            })
            request = Request(url, headers={"User-Agent": UA})
            with open_url(request, TRANSLATE_TIMEOUT) as response:
                data = json.load(response)
            lines = "".join(segment[0] for segment in data[0] if segment[0]).splitlines()
            if len(lines) != len(batch):
                continue
            for original, translated in zip(batch, lines):
                translated = translated.strip()
                if translated:
                    found[original] = translated
            time.sleep(0.15)
        except Exception as error:
            print("title translation failed:", error)

    for item in items:
        title = item.get("title", "")
        if title in found and not item.get("title_en"):
            item["title_en"] = found[title]
    return len(found)


def read_cache():
    try:
        return json.loads(CACHE.read_text(encoding="utf-8"))
    except Exception:
        return {"updatedAt": None, "items": [], "errors": []}


def refresh():
    with LOCK:
        now = datetime.now(WIB)
        cutoff = now - timedelta(days=HISTORY_DAYS)
        previous = read_cache()
        old_items = [
            item for item in previous.get("items", [])
            if item.get("id") and item.get("title") and item_date(item) >= cutoff
        ]

        collected, errors = [], []
        for source, url in FEEDS:
            try:
                collected.extend(parse_feed(source, url, now))
            except Exception as error:
                errors.append(f"{source}: {error}")

        known = {item["id"] for item in old_items}
        fresh = []
        for item in collected:
            if not item["title"] or not item["url"] or item["id"] in known or is_video(item):
                continue
            if item_date(item) < cutoff:
                continue
            known.add(item["id"])
            fresh.append(item)
        fresh.sort(key=lambda x: x["published"], reverse=True)

        local_names = {
            Path(item["image"]).name for item in old_items if is_local_image(item)
        }
        for item in fresh:
            if len(local_names) >= MAX_IMAGES and item["image"]:
                continue
            item["image"] = save_image(item["image"], item.get("url", ""))
            if is_local_image(item):
                local_names.add(Path(item["image"]).name)

        items = fresh + old_items
        for item in items:
            if is_local_image(item):
                continue
            if not item.get("image") and len(local_names) >= MAX_IMAGES:
                continue
            if item.get("image") or len(local_names) < MAX_IMAGES:
                before = item.get("image", "")
                item["image"] = save_image(item.get("image", ""), item.get("url", ""))
                if is_local_image(item):
                    local_names.add(Path(item["image"]).name)
                elif not before and item.get("image"):
                    pass
        items.sort(key=lambda x: x["published"], reverse=True)
        items = items[:MAX_ITEMS]
        translated = translate_titles(items)

        keep = {Path(item["image"]).name for item in items if is_local_image(item)}
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
            "historyDays": HISTORY_DAYS,
            "items": items,
        }
        temporary = CACHE.with_name("news.json.tmp")
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(CACHE)
        print(f"[{now:%H:%M:%S}] added {len(fresh)} items, kept {len(old_items)}, total {len(items)}, translated {translated} titles; errors: {errors}")
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
