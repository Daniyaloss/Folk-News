/* Folk Home: static placeholder data rendered into the page.
   shortcut: stories are hard-coded below; replace STORIES with a fetch() from the backend later. */
const $ = id => document.getElementById(id);
const TINT = ['#dde3ee', '#e8e0d8', '#d9e6df', '#e8dce4', '#dce6ea'];
const ph = i => `<span class="ph" style="--t:${TINT[i % 5]}"></span>`;
const t = s => s.toLowerCase().replace(/"/g, '');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cssUrl = u => `url('${encodeURI(String(u || '')).replace(/'/g, '%27')}')`;
const picture = (url, i) => url
  ? `<span class="ph has-img" style="--t:${TINT[i % 5]};background-image:${cssUrl(url)}"></span>`
  : ph(i);

const CATS = ['Home', 'News', 'Local', 'World', 'Law', 'Sports', 'Tech', 'Entertainment', 'Opinion', 'Infographics', 'Photo', 'Index'];
const CATEGORY_MAP = { Home: null, News: 'News', Local: 'Local', World: 'World', Law: 'Law', Sports: 'Sports', Tech: 'Technology', Entertainment: 'Entertainment', Opinion: 'Opinion', Infographics: 'Infographics', Photo: 'Photo', Index: null };
const SUBS = ['Most Popular', 'Regions', 'Editor’s Picks', 'Explainers', 'Newsletter', 'Special Report'];
const HERO = ['News', 'KPK Siap Patuhi Undang-Undang Perampasan Aset yang Disahkan DPR', 'By Folk Newsroom, 5 min ago'];
const HERO_EXCERPT = 'Baca artikel detiknews, "KPK Siap Patuhi Undang-Undang Perampasan Aset yang Disahkan DPR" selengkapnya https://news.detik.com/berita/d-8761217/kpk-siap-patuhi-undang-undang-perampasan-aset-yang-disahkan-dpr.<br>Download Apps Detikcom Sekarang https://apps.detik.com/detik/';
const HERO_LINK = 'https://news.detik.com/berita/d-8761217/kpk-siap-patuhi-undang-undang-perampasan-aset-yang-disahkan-dpr';
const SIDE = [['Economy', 'Rice Prices Drop as Markets Fill Up Again', '1 hour ago'], ['Sports', 'National Team Wins 2-0, Advances to the Final', '2 hours ago'], ['Local', 'Bogor Plans a New 12 km Bicycle Lane', '3 hours ago']];
const FRESH = [['Technology', 'Local App Helps Farmers Sell Harvest Directly', '4 hours ago'], ['Health', 'Walking 30 Minutes a Day: What It Does for Your Body', '5 hours ago'], ['Law', 'New Data Protection Rules Begin Public Briefings', '5 hours ago'], ['Entertainment', 'Short Film Festival Returns to City Park This Weekend', '6 hours ago'], ['Politics', 'Regional Budget Meeting Opens, Residents Invited to Comment', '7 hours ago']];
const POLITICS = [
  ['Council Debates Longer Opening Hours for Public Libraries', 'Supporters say evening access helps students and workers, while others ask who will cover the cost.', 'By Rani Putri, 1 hour ago'],
  ['Village Heads Meet to Discuss Clean Water Funding', 'Leaders from eleven villages compare plans for new wells, pipes, and shared maintenance crews.', 'By Bayu Hartono, 3 hours ago'],
  ['Election Office Opens Voter Information Desk Online', 'Residents can now check registration details and polling place locations from their phones.', 'By Sinta Maharani, 5 hours ago'],
  ['Parliament Committee Reviews Proposed Transport Bill', 'Members heard from drivers, operators, and city planners about changes to licensing and fares.', 'By Dimas Prakoso, 8 hours ago']];
const POPULAR = [['Rice Prices Drop as Markets Fill Up Again', '12K reads'], ['National Team Wins 2-0, Advances to the Final', '10K reads'], ['Walking 30 Minutes a Day: What It Does for Your Body', '8K reads'], ['Bogor Plans a New 12 km Bicycle Lane', '7K reads'], ['New Data Protection Rules Begin Public Briefings', '5K reads']];
const TOPICS = ['Politics', 'Sports', 'Technology', 'Health', 'Economy', 'Entertainment', 'Science', 'Lifestyle'];
const FOOT = { News: ['Latest', 'Politics', 'Sports', 'Technology'], Explore: ['Photo', 'Opinion', 'Infographics'], Folk: ['About us', 'Editorial team', 'Careers', 'Advertise'], Account: ['Saved', 'Settings', 'Help'] };
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

// ---- render ----
$('cats').innerHTML = CATS.map((c, i) => `<a href="#" data-cat="${c}"${i ? '' : ' aria-current="page"'}>${c}</a>`).join('');
$('subs').innerHTML = SUBS.map(s => `<a href="#">${s}${s === 'Regions' ? CHEV : ''}</a>`).join('') + `<a class="edition" href="#">Edition: Indonesia${CHEV}</a>`;
$('today').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
$('hero').dataset.title = t(HERO[1]);
$('hero').href = HERO_LINK;
$('hero').classList.add('photo');
$('hero').style.backgroundImage = 'url("Assets/berita_kpk.jpeg"), linear-gradient(135deg,#545f78,#1f2433)';
$('hero').innerHTML = `<span class="pill">${HERO[0]}</span><h2>${HERO[1]}</h2><p class="hero-excerpt">${HERO_EXCERPT}</p><small>${HERO[2]}</small>`;
$('side').innerHTML = SIDE.map((s, i) => `<a class="mini" href="#" data-title="${t(s[1])}">${ph(i)}<div><span class="cat">${s[0]}</span><h3>${s[1]}</h3><small>${s[2]}</small></div></a>`).join('');
$('fresh').innerHTML = FRESH.map((s, i) => `<a class="card" href="#" data-title="${t(s[1])}">${ph(i)}<span class="cat">${s[0]}</span><h3>${s[1]}</h3><small>${s[2]}</small></a>`).join('');
$('politics').innerHTML = POLITICS.map((s, i) => `<a class="row" href="#" data-title="${t(s[0])}">${ph(i + 1)}<div><span class="cat">Politics</span><h3>${s[0]}</h3><p>${s[1]}</p><small>${s[2]}</small></div></a>`).join('');
$('pager').innerHTML = ['1', '2', '3', '…', '88'].map((p, i) => `<button type="button"${i ? '' : ' aria-current="page"'}${p === '…' ? ' disabled' : ''}>${p}</button>`).join('') + '<button class="next" type="button">Next</button>';
$('popular').innerHTML = POPULAR.map((s, i) => `<a class="pop-item" href="#" data-title="${t(s[0])}"><b>${i + 1}</b><div><h3>${s[0]}</h3><small>${s[1]}</small></div></a>`).join('');
$('topics').innerHTML = TOPICS.map(s => `<a href="#">${s}</a>`).join('');
$('fcols').innerHTML = Object.entries(FOOT).map(([h, l]) => `<div><h4>${h}</h4>${l.map(x => `<a href="#">${x}</a>`).join('')}</div>`).join('');

// ---- who is logged in ----
const me = Folk.session();
$('uname').textContent = me ? me.name : 'Guest';
$('av').textContent = (me ? me.name : 'G').trim().charAt(0).toUpperCase();
$('pop').innerHTML = me ? '<button type="button" id="logout">Log out</button>' : '<a href="login.html">Log In</a>';
if (me) $('logout').onclick = Folk.logout;

// ---- menu drawer ----
$('dnav').innerHTML = CATS.map(c => `<a href="#" data-cat="${c}"${c === 'Home' ? ' aria-current="page"' : ''}>${c}</a>`).join('') + '<div class="sp"></div><a href="#">Settings</a><a href="#">Help</a>' + (me ? '<button type="button" id="dlogout">Log out</button>' : '<a href="login.html">Log In</a>');
if (me) $('dlogout').onclick = Folk.logout;
$('open-menu').onclick = () => $('drawer').showModal();
$('close-menu').onclick = () => $('drawer').close();
$('drawer').onclick = e => { if (e.target === $('drawer')) $('drawer').close(); }; // click on the backdrop

// ---- small interactions ----
$('cats').onclick = e => {
  const a = e.target.closest('a[data-cat]'); if (!a) return;
  e.preventDefault();
  selectCategory(a.dataset.cat);
};
$('dnav').onclick = e => {
  const a = e.target.closest('a[data-cat]'); if (!a) return;
  e.preventDefault();
  selectCategory(a.dataset.cat);
  $('drawer').close();
};
$('pager').onclick = e => {
  const b = e.target.closest('button'); if (!b || b.disabled || b.classList.contains('next')) return;
  $('pager').querySelectorAll('button').forEach(x => x.removeAttribute('aria-current'));
  b.setAttribute('aria-current', 'page');
};
document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
$('subscribe').onclick = e => { e.target.textContent = 'Subscribed'; e.target.disabled = true; };
$('search').onsubmit = e => e.preventDefault();
$('q').oninput = applySearch;
$('search-toggle').onclick = () => {
  const on = $('top').classList.toggle('searching');
  $('search-toggle').setAttribute('aria-expanded', on);
  if (on) $('q').focus();
};
$('profile-btn').onclick = e => { e.stopPropagation(); const open = $('pop').hidden; $('pop').hidden = !open; $('profile-btn').setAttribute('aria-expanded', open); };
document.addEventListener('click', () => { $('pop').hidden = true; $('profile-btn').setAttribute('aria-expanded', 'false'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('pop').hidden = true; });

let LIVE = null;
let CURRENT = 'Home';

function isVideoItem(x) {
  const url = x.url || '';
  const title = (x.title || '').toLowerCase();
  return /\bvideo\b/i.test(title) || /\/video\//i.test(url) || x.category === 'Video';
}

function applySearch() {
  const q = $('q').value.trim().toLowerCase();
  document.querySelectorAll('[data-title]').forEach(el => { el.hidden = !!q && !el.dataset.title.includes(q); });
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
  const pool = wanted ? LIVE.items.filter(x => x.category === wanted) : LIVE.items;
  const empty = $('category-empty');
  document.querySelectorAll('[data-news-section]').forEach(el => { el.hidden = !pool.length; });
  empty.hidden = !!pool.length;
  if (!pool.length) {
    empty.textContent = `Belum ada berita untuk kategori ${CURRENT}.`;
    return;
  }
  empty.textContent = '';

  document.querySelector('.ticker').hidden = CURRENT !== 'Home';
  $('popular-section').hidden = CURRENT !== 'Home';
  $('pager').hidden = CURRENT !== 'Home';
  $('fresh-title').textContent = CURRENT === 'Home' ? 'Fresh Update' : CURRENT === 'Index' ? 'Semua Berita' : `${CURRENT} · Terbaru`;
  $('politics-title').textContent = CURRENT === 'Home' ? 'Politics' : `${CURRENT} · Pilihan`;
  $('auto-title').textContent = CURRENT === 'Home' ? 'Berita Otomatis' : `${CURRENT} · Lainnya`;

  const lead = pool.find(x => x.image) || pool[0];
  const rest = pool.filter(x => x.id !== lead.id);

  $('hero').dataset.title = esc(t(lead.title));
  $('hero').href = lead.url || '#';
  $('hero').target = '_blank';
  $('hero').rel = 'noopener';
  $('hero').classList.add('photo');
  $('hero').style.backgroundImage = lead.image
    ? `${cssUrl(lead.image)}, linear-gradient(135deg,#545f78,#1f2433)`
    : 'linear-gradient(135deg,#545f78,#1f2433)';
  $('hero').innerHTML = `<span class="pill">${esc(lead.source || lead.category || 'News')}</span><h2>${esc(lead.title)}</h2><p class="hero-excerpt">${esc(lead.excerpt || '')}</p><small>${esc(lead.timeLabel || '')}</small>`;

  $('side').innerHTML = rest.slice(0, 3).map((x, i) =>
    `<a class="mini" href="${esc(x.url)}" target="_blank" rel="noopener" data-title="${esc(t(x.title))}">${picture(x.image, i)}<div><span class="cat">${esc(x.source)}</span><h3>${esc(x.title)}</h3><small>${esc(x.timeLabel)}</small></div></a>`
  ).join('');

  const fresh = rest.slice(3, 8);
  $('fresh').innerHTML = fresh.map((x, i) =>
    `<a class="card" href="${esc(x.url)}" target="_blank" rel="noopener" data-title="${esc(t(x.title))}">${picture(x.image, i)}<span class="cat">${esc(x.source)}</span><h3>${esc(x.title)}</h3><small>${esc(x.timeLabel)}</small></a>`
  ).join('');
  $('fresh-section').hidden = !fresh.length;

  const focus = [...rest.filter(x => /^(Law|Politics)$/.test(x.category)), ...rest]
    .filter((x, i, all) => all.findIndex(y => y.id === x.id) === i)
    .slice(0, 4);
  $('politics').innerHTML = focus.map((x, i) =>
    `<a class="row" href="${esc(x.url)}" target="_blank" rel="noopener" data-title="${esc(t(x.title))}">${picture(x.image, i + 1)}<div><span class="cat">${esc(x.category || x.source)}</span><h3>${esc(x.title)}</h3><p>${esc(x.excerpt || '')}</p><small>${esc(x.source)} · ${esc(x.timeLabel)}</small></div></a>`
  ).join('');
  $('politics-section').hidden = !focus.length;

  const auto = rest.slice(8, 14);
  $('auto-news').innerHTML = auto.map((x, i) =>
    `<a class="card" href="${esc(x.url)}" target="_blank" rel="noopener" data-title="${esc(t(x.title))}">${picture(x.image, i)}<span class="cat">${esc(x.source)}</span><h3>${esc(x.title)}</h3><small>${esc(x.timeLabel)}</small></a>`
  ).join('');
  $('auto-section').hidden = !auto.length;

  if (LIVE.updatedAt && $('auto-updated')) {
    const stamp = new Date(LIVE.updatedAt);
    if (!isNaN(stamp)) $('auto-updated').textContent = 'Diperbarui ' + stamp.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  applySearch();
}

function applyNews(news) {
  const items = ((news && news.items) || []).filter(x => !isVideoItem(x));
  if (!items.length) return;
  LIVE = { ...news, items };
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

const initialCategory = new URLSearchParams(location.search).get('cat');
if (initialCategory && Object.prototype.hasOwnProperty.call(CATEGORY_MAP, initialCategory)) selectCategory(initialCategory);

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
      .catch(() => { button.textContent = 'Butuh server.py'; })
      .finally(() => setTimeout(() => { button.textContent = label; button.disabled = false; }, 1800));
  };
}
