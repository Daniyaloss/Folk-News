/* Folk Home: static placeholder data rendered into the page.
   shortcut: stories are hard-coded below; replace STORIES with a fetch() from the backend later. */
const $ = id => document.getElementById(id);
const TINT = ['#dde3ee', '#e8e0d8', '#d9e6df', '#e8dce4', '#dce6ea'];
const ph = i => `<span class="ph" style="--t:${TINT[i % 5]}"></span>`;
const t = s => s.toLowerCase().replace(/"/g, '');
const trCat = value => FolkI18n.t('cat.' + value, {}, value || '');
const demoText = key => FolkI18n.t(key);
const titleText = item => FolkI18n.lang() === 'en' && item.title_en ? item.title_en : (item.title || '');
const timeText = value => String(value || '')
  .replace(/(\d+) min ago/g, (_, n) => FolkI18n.t('minAgo', { n }))
  .replace(/(\d+) hours? ago/g, (_, n) => FolkI18n.t('hoursAgo', { n }))
  .replace('Just now', FolkI18n.t('justNow'))
  .replace('Yesterday', FolkI18n.t('yesterday'));
const readsText = value => String(value || '').replace('reads', FolkI18n.t('readsWord'));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const words = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
const STOP = new Set(['https', 'http', 'www', 'com', 'org', 'news', 'berita', 'the', 'dan', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'ini', 'itu', 'a', 'an']);
const indexWords = s => words(s).filter(w => w.length > 1 && !STOP.has(w));
const queryTokens = q => words(q);
const urlText = u => words(String(u || '').split('/').filter(Boolean).pop() || '').join(' ');
const searchText = x => norm([x.title, x.title_en, x.excerpt, x.source, x.category, trCat(x.category), urlText(x.url)].join(' '));
const SYNONYMS = {
  banjir: ['genangan', 'flood'],
  flood: ['banjir', 'genangan'],
  flu: ['influenza', 'kesehatan', 'sakit'],
  influenza: ['flu', 'kesehatan'],
  ekonomi: ['economy', 'bisnis', 'keuangan', 'business', 'finance'],
  bisnis: ['ekonomi', 'economy', 'keuangan', 'business'],
  keuangan: ['ekonomi', 'economy', 'bisnis', 'finance'],
  kesehatan: ['medis', 'sakit', 'health'],
  health: ['kesehatan', 'medis'],
  olahraga: ['sport', 'sports', 'sepak', 'bola', 'football'],
  sports: ['olahraga', 'sepak', 'bola'],
  bola: ['sepak', 'olahraga', 'football'],
  hukum: ['law', 'kriminal'],
  politik: ['politics', 'pemilu', 'election'],
  teknologi: ['tech', 'technology', 'digital'],
  tech: ['teknologi', 'technology'],
  pendidikan: ['sekolah', 'education', 'belajar'],
  sekolah: ['pendidikan', 'education'],
  cuaca: ['hujan', 'weather'],
  hujan: ['cuaca', 'weather']
};
const expand = token => [...new Set([token, ...(SYNONYMS[token] || [])])];
const distFor = token => token.length >= 6 ? 2 : token.length >= 3 ? 1 : 0;
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
function syncUrl(q) { try { const url = new URL(location.href); if (q) url.searchParams.set('q', q); else url.searchParams.delete('q'); history.replaceState(null, '', url.pathname + url.search + url.hash); } catch {} }
const cssUrl = u => `url('${encodeURI(String(u || '')).replace(/'/g, '%27')}')`;
const picture = (url, i) => url
  ? `<span class="ph has-img" style="--t:${TINT[i % 5]};background-image:${cssUrl(url)}"></span>`
  : ph(i);
const label = x => {
  const raw = x.published || x.pubDate;
  if (!raw) return timeText(x.timeLabel);
  const date = new Date(raw);
  if (isNaN(date)) return timeText(x.timeLabel);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return FolkI18n.t('justNow');
  if (minutes < 60) return FolkI18n.t('minAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return FolkI18n.t(hours > 1 ? 'hoursAgo' : 'hourAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return FolkI18n.t('yesterday');
  return date.toLocaleDateString(FolkI18n.locale(), { day: '2-digit', month: 'short', year: 'numeric' });
};
const cardHtml = (x, i) => `<a class="card" href="${esc(x.url)}" target="_blank" rel="noopener" data-title="${esc(t(titleText(x)))}">${picture(x.image, i)}<span class="cat">${esc(x.source || trCat(x.category || 'News'))}</span><h3>${esc(titleText(x))}</h3><small>${esc(label(x))}</small></a>`;
const rowHtml = (x, i) => `<a class="row" href="${esc(x.url)}" target="_blank" rel="noopener" data-title="${esc(t(titleText(x)))}">${picture(x.image, i + 1)}<div><span class="cat">${esc(trCat(x.category || x.source || 'News'))}</span><h3>${esc(titleText(x))}</h3><p>${esc(x.excerpt || '')}</p><small>${esc(x.source || '')} · ${esc(label(x))}</small></div></a>`;

const CATS = ['Home', 'News', 'Local', 'World', 'Law', 'Politics', 'Economy', 'Health', 'Sports', 'Tech', 'Entertainment', 'Opinion', 'Infographics', 'Photo', 'Index'];
const CATEGORY_MAP = { Home: null, News: 'News', Local: 'Local', World: 'World', Law: 'Law', Politics: 'Politics', Economy: 'Economy', Health: 'Health', Sports: 'Sports', Tech: 'Technology', Entertainment: 'Entertainment', Opinion: 'Opinion', Infographics: 'Infographics', Photo: 'Photo', Index: null };
const PAGES = { Home: 'home.html', News: 'news.html', Local: 'local.html', World: 'world.html', Law: 'law.html', Politics: 'politics.html', Economy: 'economy.html', Health: 'health.html', Sports: 'sports.html', Tech: 'tech.html', Entertainment: 'entertainment.html', Opinion: 'opinion.html', Infographics: 'infographics.html', Photo: 'photo.html', Index: 'all.html' };
const TOPIC_PAGE = { Politics: 'politics.html', Sports: 'sports.html', Technology: 'tech.html', Health: 'health.html', Economy: 'economy.html', Entertainment: 'entertainment.html' };
const FOOT_PAGE = { 'About us': 'about.html', Latest: 'home.html', Politics: 'politics.html', Sports: 'sports.html', Technology: 'tech.html', Photo: 'photo.html', Opinion: 'opinion.html', Infographics: 'infographics.html' };
const SUBS = ['Most Popular', 'Regions', 'Editor’s Picks', 'Explainers', 'Newsletter', 'Special Report'];
const INITIAL_CATEGORY = (() => { const value = new URLSearchParams(location.search).get('cat') || document.body.dataset.category; return Object.prototype.hasOwnProperty.call(CATEGORY_MAP, value) ? value : 'Home'; })();
const INITIAL_QUERY = new URLSearchParams(location.search).get('q') || '';
if (INITIAL_QUERY) $('q').value = INITIAL_QUERY;
const HERO = ['News', 'demo.hero', 'By Folk Newsroom, 5 min ago'];
const HERO_EXCERPT = 'demo.heroExcerpt';
const HERO_LINK = 'https://news.detik.com/berita/d-8761217/kpk-siap-patuhi-undang-undang-perampasan-aset-yang-disahkan-dpr';
const SIDE = [['Economy', 'demo.side1', '1 hour ago'], ['Sports', 'demo.side2', '2 hours ago'], ['Local', 'demo.side3', '3 hours ago']];
const FRESH = [['Technology', 'demo.fresh1', '4 hours ago'], ['Health', 'demo.fresh2', '5 hours ago'], ['Law', 'demo.fresh3', '5 hours ago'], ['Entertainment', 'demo.fresh4', '6 hours ago'], ['Politics', 'demo.fresh5', '7 hours ago']];
const POLITICS = [
  ['demo.politics1', 'demo.politicsExcerpt1', 'By Rani Putri, 1 hour ago'],
  ['demo.politics2', 'demo.politicsExcerpt2', 'By Bayu Hartono, 3 hours ago'],
  ['demo.politics3', 'demo.politicsExcerpt3', 'By Sinta Maharani, 5 hours ago'],
  ['demo.politics4', 'demo.politicsExcerpt4', 'By Dimas Prakoso, 8 hours ago']];
const POPULAR = [['demo.side1', '12K reads'], ['demo.side2', '10K reads'], ['demo.fresh2', '8K reads'], ['demo.side3', '7K reads'], ['demo.fresh3', '5K reads']];
const TOPICS = ['Politics', 'Sports', 'Technology', 'Health', 'Economy', 'Entertainment'];
const FOOT = { footNews: ['Latest', 'Politics', 'Sports', 'Technology'], footExplore: ['Photo', 'Opinion', 'Infographics'], footFolk: ['About us', 'Editorial team', 'Careers', 'Advertise'], footAccount: ['Saved', 'Settings', 'Help'] };
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

// ---- render ----
$('cats').innerHTML = CATS.map(c => `<a href="${PAGES[c]}" data-cat="${c}"${c === INITIAL_CATEGORY ? ' aria-current="page"' : ''}>${trCat(c)}</a>`).join('');
$('subs').innerHTML = SUBS.map(s => `<a href="#">${FolkI18n.t('sub.' + s)}${s === 'Regions' ? CHEV : ''}</a>`).join('') + `<a class="edition" href="#">${FolkI18n.t('edition')}${CHEV}</a>`;
$('today').textContent = new Date().toLocaleDateString(FolkI18n.locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
$('hero').dataset.title = t(demoText(HERO[1]));
$('hero').href = HERO_LINK;
$('hero').classList.add('photo');
$('hero').style.backgroundImage = 'url("Assets/berita_kpk.jpeg"), linear-gradient(135deg,#545f78,#1f2433)';
$('hero').innerHTML = `<span class="pill">${trCat(HERO[0])}</span><h2>${demoText(HERO[1])}</h2><p class="hero-excerpt">${demoText(HERO_EXCERPT)}</p><small>${timeText(HERO[2])}</small>`;
$('side').innerHTML = SIDE.map((s, i) => `<a class="mini" href="#" data-title="${esc(t(demoText(s[1])))}">${ph(i)}<div><span class="cat">${trCat(s[0])}</span><h3>${demoText(s[1])}</h3><small>${timeText(s[2])}</small></div></a>`).join('');
$('fresh').innerHTML = FRESH.map((s, i) => `<a class="card" href="#" data-title="${esc(t(demoText(s[1])))}">${ph(i)}<span class="cat">${trCat(s[0])}</span><h3>${demoText(s[1])}</h3><small>${timeText(s[2])}</small></a>`).join('');
$('politics').innerHTML = POLITICS.map((s, i) => `<a class="row" href="#" data-title="${esc(t(demoText(s[0])))}">${ph(i + 1)}<div><span class="cat">${trCat('Politics')}</span><h3>${demoText(s[0])}</h3><p>${demoText(s[1])}</p><small>${timeText(s[2])}</small></div></a>`).join('');
$('pager').innerHTML = ['1', '2', '3', '…', '88'].map((p, i) => `<button type="button"${i ? '' : ' aria-current="page"'}${p === '…' ? ' disabled' : ''}>${p}</button>`).join('') + `<button class="next" type="button">${FolkI18n.t('next')}</button>`;
$('popular').innerHTML = POPULAR.map((s, i) => `<a class="pop-item" href="#" data-title="${esc(t(demoText(s[0])))}"><b>${i + 1}</b><div><h3>${demoText(s[0])}</h3><small>${readsText(s[1])}</small></div></a>`).join('');
$('topics').innerHTML = TOPICS.map(s => `<a href="${TOPIC_PAGE[s]}">${trCat(s)}</a>`).join('');
$('fcols').innerHTML = Object.entries(FOOT).map(([h, l]) => `<div><h4>${FolkI18n.t(h)}</h4>${l.map(x => `<a href="${FOOT_PAGE[x] || '#'}">${FolkI18n.t('link.' + x, {}, x)}</a>`).join('')}</div>`).join('');

// ---- who is logged in ----
const me = Folk.session();
$('uname').textContent = me ? me.name : FolkI18n.t('guest');
$('av').textContent = (me ? me.name : 'G').trim().charAt(0).toUpperCase();
const ICON = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  user: ICON('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  login: ICON('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>'),
  logout: ICON('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'),
};
// two choices for a visitor (Sign Up / Log In, Profile); a logged-in user gets Profile and Log out
$('pop').innerHTML = me
  ? `<a href="profile.html">${IC.user}${FolkI18n.t('profile')}</a><button type="button" id="logout">${IC.logout}${FolkI18n.t('logout')}</button>`
  : `<a href="index.html">${IC.login}${FolkI18n.t('signupLogin')}</a><a href="profile.html">${IC.user}${FolkI18n.t('profile')}</a>`;
if (me) $('logout').onclick = Folk.logout;

// ---- menu drawer ----
$('dnav').innerHTML = CATS.map(c => `<a href="${PAGES[c]}" data-cat="${c}"${c === INITIAL_CATEGORY ? ' aria-current="page"' : ''}>${trCat(c)}</a>`).join('') + `<div class="sp"></div><a href="#">${FolkI18n.t('settings')}</a><a href="#">${FolkI18n.t('help')}</a>` + `<a href="profile.html">${FolkI18n.t('profile')}</a>` + (me ? `<button type="button" id="dlogout">${FolkI18n.t('logout')}</button>` : `<a href="index.html">${FolkI18n.t('signupLogin')}</a>`);
if (me) $('dlogout').onclick = Folk.logout;
$('open-menu').onclick = () => $('drawer').showModal();
$('close-menu').onclick = () => $('drawer').close();
$('drawer').onclick = e => { if (e.target === $('drawer')) $('drawer').close(); }; // click on the backdrop

// ---- small interactions ----
$('dnav').onclick = e => { if (e.target.closest('a[data-cat]')) { clearSearch(); $('drawer').close(); } };
$('pager').onclick = e => {
  const b = e.target.closest('button'); if (!b || b.disabled || b.classList.contains('next')) return;
  $('pager').querySelectorAll('button').forEach(x => x.removeAttribute('aria-current'));
  b.setAttribute('aria-current', 'page');
};
document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
$('subscribe').onclick = e => { e.target.textContent = FolkI18n.t('subscribed'); e.target.disabled = true; };
$('search').onsubmit = e => { e.preventDefault(); clearTimeout(INPUT_TIMER); syncUrl($('q').value.trim()); $('suggest').hidden = true; applySearch(true); };
$('q').oninput = () => { clearTimeout(INPUT_TIMER); INPUT_TIMER = setTimeout(() => { syncUrl($('q').value.trim()); applySearch(true); }, 120); };
$('q').onkeydown = e => {
  const box = $('suggest');
  if (box.hidden) return;
  const opts = [...box.querySelectorAll('button[data-s]')];
  if (!opts.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    setActiveSuggest((SUGGEST_AT + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length);
  } else if (e.key === 'Enter' && SUGGEST_AT >= 0) {
    e.preventDefault();
    opts[SUGGEST_AT].click();
  } else if (e.key === 'Escape') {
    box.hidden = true;
    setActiveSuggest(-1);
  }
};
$('suggest').onmouseover = e => {
  const b = e.target.closest('button[data-s]');
  if (b) setActiveSuggest([...$('suggest').querySelectorAll('button[data-s]')].indexOf(b));
};
$('suggest').onclick = e => {
  const b = e.target.closest('button[data-s]');
  if (!b) return;
  const parts = queryTokens($('q').value.replace(/"[^"]*"/g, ' '));
  if (parts.length) parts[parts.length - 1] = b.dataset.s;
  const next = parts.length ? parts.join(' ') : b.dataset.s;
  $('q').value = next;
  syncUrl(next);
  $('suggest').hidden = true;
  applySearch(true);
  $('q').focus();
};
$('search-clear').onclick = () => { clearSearch(); $('q').focus(); };
$('search-more').onclick = () => renderSearch(false);
$('cats').onclick = e => { if (e.target.closest('a[data-cat]')) clearSearch(); };
if ($('more-news')) $('more-news').onclick = renderMore;
$('search-toggle').onclick = () => {
  const on = $('top').classList.toggle('searching');
  $('search-toggle').setAttribute('aria-expanded', on);
  if (on) $('q').focus();
};
$('profile-btn').onclick = e => { e.stopPropagation(); const open = $('pop').hidden; $('pop').hidden = !open; $('profile-btn').setAttribute('aria-expanded', open); };
document.addEventListener('click', e => { $('pop').hidden = true; $('profile-btn').setAttribute('aria-expanded', 'false'); if (!e.target.closest('.search')) $('suggest').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('pop').hidden = true; $('suggest').hidden = true; } });
window.addEventListener('popstate', () => { clearTimeout(INPUT_TIMER); $('q').value = new URLSearchParams(location.search).get('q') || ''; applySearch(true); });

let LIVE = null;
let CURRENT = INITIAL_CATEGORY;
let ARCHIVE = [];
let ARCHIVE_AT = 0;
const ARCHIVE_STEP = 36;
let SEARCH_Q = '';
let SEARCH_ITEMS = [];
let SEARCH_AT = 0;
const SEARCH_STEP = 60;
let SEARCH_TERMS = [];
let SEARCH_INDEX = new Map();
let SEARCH_FULL = [];
let SUGGEST_AT = -1;
let INPUT_TIMER;

function isVideoItem(x) {
  const url = x.url || '';
  const title = (x.title || '').toLowerCase();
  return /\bvideo\b/i.test(title) || /\/video\//i.test(url) || x.category === 'Video';
}

function buildIndex() {
  SEARCH_TERMS = [];
  SEARCH_INDEX = new Map();
  SEARCH_FULL = [];
  if (!LIVE) return;
  LIVE.items.forEach((x, i) => {
    const full = searchText(x);
    SEARCH_FULL.push(full);
    indexWords(full).forEach(w => {
      let list = SEARCH_INDEX.get(w);
      if (!list) { list = []; SEARCH_INDEX.set(w, list); SEARCH_TERMS.push(w); }
      list.push(i);
    });
  });
  SEARCH_TERMS.sort();
}

function matchTerm(token) {
  const max = distFor(token);
  if (SEARCH_INDEX.has(token)) return [{ term: token, score: 10 }];
  const found = [];
  const low = Math.max(0, token.length - max);
  const high = token.length + max;
  for (const term of SEARCH_TERMS) {
    if (term.length < low || term.length > high) continue;
    if (term.startsWith(token)) { found.push({ term, score: 9 }); continue; }
    if (!max) continue;
    const d = editDistance(token, term, max);
    if (d <= max) found.push({ term, score: 8 - d });
  }
  return found.sort((a, b) => b.score - a.score).slice(0, 12);
}

function findMatches(raw) {
  const phrases = [...raw.matchAll(/"([^"]+)"/g)].map(m => norm(m[1])).filter(Boolean);
  const tokens = queryTokens(raw.replace(/"[^"]*"/g, ' '));
  const groups = tokens.map(token => {
    const scores = new Map();
    expand(token).forEach(alt => {
      matchTerm(alt).forEach(hit => {
        for (const i of SEARCH_INDEX.get(hit.term) || []) {
          if (!scores.has(i) || scores.get(i) < hit.score) scores.set(i, hit.score);
        }
      });
    });
    return scores;
  });
  let hits = groups.length
    ? [...groups[0]].map(([i, score]) => ({ i, score }))
    : LIVE.items.map((_, i) => ({ i, score: 0 }));
  for (const group of groups.slice(1)) {
    hits = hits.filter(h => group.has(h.i)).map(h => ({ i: h.i, score: h.score + group.get(h.i) }));
  }
  if (phrases.length) hits = hits.filter(h => phrases.every(p => SEARCH_FULL[h.i].includes(p)));
  return hits.sort((a, b) => b.score - a.score || a.i - b.i);
}

function fallbackTerms() {
  const set = new Set();
  document.querySelectorAll('[data-title]').forEach(el => indexWords(el.dataset.title).forEach(w => set.add(w)));
  return [...set].sort();
}

function suggestTerms(raw) {
  const tokens = queryTokens(raw.replace(/"[^"]*"/g, ' '));
  const last = tokens[tokens.length - 1];
  if (!last || last.length < 2) return [];
  const pool = SEARCH_TERMS.length ? SEARCH_TERMS : fallbackTerms();
  const out = pool.filter(term => term.startsWith(last) && term !== last)
    .sort((a, b) => a.length - b.length).slice(0, 6);
  if (out.length < 6) {
    for (const hit of matchTerm(last)) {
      if (hit.term !== last && !out.includes(hit.term)) out.push(hit.term);
      if (out.length >= 6) break;
    }
  }
  return out;
}

function setActiveSuggest(i) {
  SUGGEST_AT = i;
  const opts = [...$('suggest').querySelectorAll('button[data-s]')];
  opts.forEach((b, k) => b.setAttribute('aria-selected', k === i));
  $('q').setAttribute('aria-activedescendant', opts[i] ? opts[i].id : '');
}

function demoItems() {
  return [...document.querySelectorAll('[data-title]')].map(el => ({
    id: el.dataset.title,
    title: el.dataset.title,
    excerpt: (el.querySelector('p') || {}).textContent || '',
    source: (el.querySelector('.cat') || {}).textContent || '',
    category: 'News',
    url: el.href || '#',
    image: ''
  }));
}

function renderSuggest(raw) {
  const box = $('suggest');
  const list = suggestTerms(raw);
  setActiveSuggest(-1);
  $('q').setAttribute('aria-expanded', !!list.length);
  if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = list.map((w, i) => `<button type="button" id="sug-${i}" role="option" data-s="${esc(w)}" aria-selected="false">${esc(w)}</button>`).join('');
  box.hidden = false;
}

function applySearch(force = false) {
  const raw = $('q').value.trim();
  const tokens = queryTokens(raw.replace(/"[^"]*"/g, ' '));
  renderSuggest(raw);
  if (!tokens.length && !/"[^"]+"/.test(raw)) {
    SEARCH_Q = '';
    SEARCH_ITEMS = [];
    SEARCH_AT = 0;
    document.body.classList.remove('search-active');
    $('search-results').hidden = true;
    $('search-list').innerHTML = '';
    $('search-empty').hidden = true;
    $('search-hint').hidden = true;
    $('search-more').hidden = true;
    $('suggest').hidden = true;
    document.querySelectorAll('[data-title]').forEach(el => { el.hidden = false; });
    return;
  }
  document.querySelectorAll('[data-title]').forEach(el => { el.hidden = !tokens.every(tok => norm(el.dataset.title).includes(tok)); });
  if (!force && SEARCH_Q === raw && LIVE) return;
  SEARCH_Q = raw;
  const phrases = [...raw.matchAll(/"([^"]+)"/g)].map(m => norm(m[1])).filter(Boolean);
  if (!LIVE) {
    SEARCH_ITEMS = demoItems().filter(x => {
      const hay = norm([x.title, x.excerpt, x.source].join(' '));
      return tokens.every(tok => hay.includes(tok)) && phrases.every(p => hay.includes(p));
    });
    $('search-hint').hidden = false;
    $('search-hint').textContent = FolkI18n.t('searchNoCache');
    $('search-more').hidden = true;
  } else {
    SEARCH_ITEMS = findMatches(raw).map(hit => LIVE.items[hit.i]);
    $('search-hint').hidden = true;
  }
  document.body.classList.add('search-active');
  $('search-results').hidden = false;
  $('search-count').textContent = FolkI18n.t('searchResults', { n: SEARCH_ITEMS.length, q: raw });
  $('search-empty').hidden = !!SEARCH_ITEMS.length;
  if (!SEARCH_ITEMS.length) $('search-empty').textContent = FolkI18n.t('searchEmpty', { q: raw });
  renderSearch(true);
}

function renderSearch(reset) {
  if (reset) { SEARCH_AT = 0; $('search-list').innerHTML = ''; }
  const start = SEARCH_AT;
  const batch = SEARCH_ITEMS.slice(SEARCH_AT, SEARCH_AT + SEARCH_STEP);
  SEARCH_AT += batch.length;
  $('search-list').insertAdjacentHTML('beforeend', batch.map((x, i) => rowHtml(x, start + i)).join(''));
  $('search-more').hidden = SEARCH_AT >= SEARCH_ITEMS.length;
}

function clearSearch() {
  $('q').value = '';
  syncUrl('');
  applySearch(true);
}

function selectCategory(name) {
  if (!Object.prototype.hasOwnProperty.call(CATEGORY_MAP, name)) return;
  CURRENT = name;
  document.querySelectorAll('[data-cat]').forEach(a => {
    if (a.dataset.cat === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  renderNews();
}

function renderNews() {
  if (!LIVE) return;
  const wanted = CATEGORY_MAP[CURRENT];
  let pool = wanted ? LIVE.items.filter(x => x.category === wanted) : LIVE.items;
  const empty = $('category-empty');
  const fallback = !pool.length && !!wanted;
  if (fallback) pool = LIVE.items;
  const name = trCat(CURRENT);
  empty.hidden = !fallback;
  empty.textContent = fallback ? FolkI18n.t('emptyCategory', { name }) : '';

  document.querySelector('.ticker').hidden = CURRENT !== 'Home';
  $('popular-section').hidden = CURRENT !== 'Home';
  $('pager').hidden = CURRENT !== 'Home';
  $('fresh-title').textContent = CURRENT === 'Home' ? FolkI18n.t('freshUpdate') : CURRENT === 'Index' ? FolkI18n.t('allNews') : FolkI18n.t('latestLabel', { name });
  $('politics-title').textContent = CURRENT === 'Home' ? trCat('Politics') : FolkI18n.t('picksLabel', { name });
  $('auto-title').textContent = CURRENT === 'Home' ? FolkI18n.t('automaticNews') : FolkI18n.t('moreLabel', { name });
  $('archive-title').textContent = CURRENT === 'Home' || CURRENT === 'Index' ? FolkI18n.t('newsArchive') : FolkI18n.t('archiveLabel', { name });

  const lead = pool.find(x => x.image) || pool[0];
  const rest = pool.filter(x => x.id !== lead.id);
  const used = new Set([lead.id]);
  const next = (list, n) => {
    const picked = [];
    for (const x of list) {
      if (picked.length >= n) break;
      if (used.has(x.id)) continue;
      used.add(x.id);
      picked.push(x);
    }
    return picked;
  };

  $('hero').dataset.title = esc(t(titleText(lead)));
  $('hero').href = lead.url || '#';
  $('hero').target = '_blank';
  $('hero').rel = 'noopener';
  $('hero').classList.add('photo');
  $('hero').style.backgroundImage = lead.image
    ? `${cssUrl(lead.image)}, linear-gradient(135deg,#545f78,#1f2433)`
    : 'linear-gradient(135deg,#545f78,#1f2433)';
  $('hero').innerHTML = `<span class="pill">${esc(lead.source || trCat(lead.category || 'News'))}</span><h2>${esc(titleText(lead))}</h2><p class="hero-excerpt">${esc(lead.excerpt || '')}</p><small>${esc(label(lead))}</small>`;

  const side = next(rest, 4);
  $('side').innerHTML = side.map((x, i) =>
    `<a class="mini" href="${esc(x.url)}" target="_blank" rel="noopener" data-title="${esc(t(titleText(x)))}">${picture(x.image, i)}<div><span class="cat">${esc(x.source || trCat(x.category || 'News'))}</span><h3>${esc(titleText(x))}</h3><small>${esc(label(x))}</small></div></a>`
  ).join('');

  const fresh = next(rest, 20);
  $('fresh').innerHTML = fresh.map(cardHtml).join('');
  $('fresh-section').hidden = !fresh.length;

  const focus = next([...rest.filter(x => /^(Law|Politics)$/.test(x.category)), ...rest], 12);
  $('politics').innerHTML = focus.map(rowHtml).join('');
  $('politics-section').hidden = !focus.length;

  const auto = next(rest, 24);
  $('auto-news').innerHTML = auto.map(cardHtml).join('');
  $('auto-section').hidden = !auto.length;

  ARCHIVE = rest.filter(x => !used.has(x.id));
  ARCHIVE_AT = 0;
  $('archive').innerHTML = '';
  $('archive-section').hidden = !ARCHIVE.length;
  renderMore();

  if (LIVE.updatedAt && $('auto-updated')) {
    const stamp = new Date(LIVE.updatedAt);
    if (!isNaN(stamp)) $('auto-updated').textContent = FolkI18n.t('updated') + stamp.toLocaleString(FolkI18n.locale(), { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  applySearch(true);
}

function renderMore() {
  if (!ARCHIVE.length) {
    $('more-news').hidden = true;
    $('archive-count').textContent = '';
    return;
  }
  const batch = ARCHIVE.slice(ARCHIVE_AT, ARCHIVE_AT + ARCHIVE_STEP);
  ARCHIVE_AT += batch.length;
  $('archive').insertAdjacentHTML('beforeend', batch.map(cardHtml).join(''));
  $('more-news').hidden = ARCHIVE_AT >= ARCHIVE.length;
  $('archive-count').textContent = FolkI18n.t('archiveCount', { a: ARCHIVE_AT, b: ARCHIVE.length });
  applySearch();
}

function applyNews(news) {
  const items = ((news && news.items) || []).filter(x => !isVideoItem(x));
  if (!items.length) return;
  LIVE = { ...news, items };
  buildIndex();
  renderNews();
}

function loadNews() {
  const stamp = Date.now();
  return fetch('api/news')
    .then(r => r.ok ? r.json() : Promise.reject())
    .catch(() => fetch(`data/news.json?v=${stamp}`).then(r => r.ok ? r.json() : Promise.reject()))
    .then(news => { applyNews(news); return news; });
}

loadNews().catch(() => {});

selectCategory(INITIAL_CATEGORY);
applySearch(true);

if ($('news-refresh')) {
  $('news-refresh').onclick = e => {
    const button = e.currentTarget;
    const label = button.textContent;
    button.disabled = true;
    button.textContent = '...';
    fetch('api/refresh')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => loadNews())
      .then(() => { button.textContent = 'OK'; })
      .catch(() => { button.textContent = FolkI18n.t('needServer'); })
      .finally(() => setTimeout(() => { button.textContent = label; button.disabled = false; }, 1800));
  };
}
