# Folk (Welcome, Login, Sign Up, Home)

Plain HTML/CSS/JS with a small Python server for live news. No install, no build.

## Run
1. In this folder run: `python server.py` (recommended).
2. Open `http://localhost:8000/home.html`

A plain `python -m http.server 8000` also works for viewing the cached news, but only `server.py` can refresh it.

To try it on your phone or TV (same Wi-Fi as the laptop):
1. Keep `python server.py` running.
2. On the other device open `http://<laptop-ip>:8000/home.html`

Double-clicking `index.html` still opens the prototype, but browser rules block `file://` from loading the news JSON.

## Live site
- https://daniyaloss.github.io/Folk-News/
- Home: https://daniyaloss.github.io/Folk-News/home.html
- GitHub Actions refreshes the news at 07:00 WIB (`cron: '0 0 * * *'`) and deploys to GitHub Pages.
- Manual refresh: repo → **Actions → Daily News → Run workflow**.
- `python server.py --once` does the same refresh locally without starting the HTTP server.
- The workflow rebuilds `data/news.json` and `Assets/news/` inside the Pages artifact, so the repo stays small.

## Live news
- Sources: Detik, Tempo, Antara, CNN Indonesia.
- The page tries `/api/news` first, then falls back to `data/news.json`, so cached news and thumbnails still appear on a plain HTTP server.
- `server.py` refreshes automatically at 07:00 WIB (and once on first run if there is no cache).
- The "Refresh" button in Berita Otomatis works fully with `server.py`; on a plain HTTP server it shows "Butuh server.py".
- Manual refresh URL: `http://localhost:8000/api/refresh`.
- Cached data: `data/news.json`; thumbnails: `Assets/news/`.
- Without any HTTP server, the static placeholders at the top of `js/home.js` are shown.

## Flow (same as the Figma prototype)
- `index.html` Welcome: Log In, Sign Up, Home
- `login.html` Google or email, then password step, then Home
- `signup.html` name, email, password, then Home
- `home.html` the news Home (Home link works without logging in)

## Good to know
- Accounts live in this browser (localStorage). Passwords are not stored, so any password of 6+ characters works for a registered email. "Continue with Google" is a stand-in.
- "Most Popular" is still a placeholder section because RSS feeds do not contain reading counts; video items and the video section are not shown.
- Clicking a category in the top nav or menu filters the live news to that category; "Home" and "Index" show everything. If a category has no stories yet, the newest stories are shown with a notice instead of a blank page.
- Every 07:00 refresh adds new stories to the saved history; yesterday's stories are kept as-is. Home renders hero + side + Fresh Update + Politics + Berita Otomatis + Arsip Berita, with a "Muat lebih banyak" button for the archive.
- Stories older than 60 days (and their downloaded thumbnails) are removed automatically. Local thumbnails are capped at 160; older/extra stories keep their original image URL. The cache holds at most 6000 stories.
- Sizes are in rem. Above 1920px wide the whole page scales up (TV / 4K).
