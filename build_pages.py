from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "home.html"

PAGES = [
    ("news.html", "News", "News"),
    ("local.html", "Local", "Local"),
    ("world.html", "World", "World"),
    ("law.html", "Law", "Law"),
    ("politics.html", "Politics", "Politics"),
    ("economy.html", "Economy", "Economy"),
    ("health.html", "Health", "Health"),
    ("sports.html", "Sports", "Sports"),
    ("tech.html", "Tech", "Tech"),
    ("entertainment.html", "Entertainment", "Entertainment"),
    ("opinion.html", "Opinion", "Opinion"),
    ("infographics.html", "Infographics", "Infographics"),
    ("photo.html", "Photo", "Photo"),
    ("all.html", "Index", "Index"),
]

html = SOURCE.read_text(encoding="utf-8")
title = "<title>Folk · News</title>"
body = '<body class="home" data-page="home">'

if title not in html or body not in html:
    raise SystemExit("home.html marker not found")

for name, label, category in PAGES:
    output = html.replace(title, f"<title>Folk · {label}</title>", 1)
    output = output.replace(body, f'<body class="home" data-page="category" data-category="{category}">', 1)
    (ROOT / name).write_text(output, encoding="utf-8")
