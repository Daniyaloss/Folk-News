/* Folk profile page. A visitor sees the logged-out profile; a logged-in user sees their name and can pick topics.
   shortcut: followed topics live only in this browser (localStorage). "Saved" and "History" are empty until stories can be saved. */
(() => {
  const $ = id => document.getElementById(id);
  const t = FolkI18n.t;
  const me = Folk.session();
  const TOPICS = ['Politics', 'Sports', 'Tech', 'Health', 'Economy', 'Entertainment', 'Law', 'Local', 'World'];
  const load = () => { try { return JSON.parse(localStorage.getItem('folk_topics')) || []; } catch { return []; } };
  let picked = me ? load() : [];
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const USER = svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>');
  const PLUS = svg('<path d="M12 5v14M5 12h14"/>');
  const CHECK = svg('<path d="m5 12 5 5 9-10"/>');
  const BOOKMARK = svg('<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>');
  const CLOCK = svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
  const authBtns = `<a class="btn" href="login.html">${t('login')}</a><a class="btn dark" href="signup.html">${t('signup')}</a>`;
  const authLinks = `<div class="p-actions">${authBtns}</div>`;

  // header: logged-out by default
  if (me) { $('p-av').textContent = (me.name || '?').trim().charAt(0).toUpperCase(); $('p-av').classList.add('me'); }
  else $('p-av').innerHTML = USER;
  $('p-name').textContent = me ? me.name : t('guest');
  $('p-sub').textContent = me ? (me.email || '') : t('profileNotLoggedIn');
  $('p-hint').textContent = me ? '' : t('profileGuestHint');
  $('p-actions').innerHTML = me ? `<button class="btn" type="button" id="p-logout">${t('logout')}</button>` : authBtns;
  if (me) $('p-logout').onclick = Folk.logout;

  // tabs
  const tabs = [...document.querySelectorAll('[data-tab]')];
  tabs.forEach(b => b.onclick = () => tabs.forEach(x => {
    const on = x === b;
    x.setAttribute('aria-selected', on);
    $('panel-' + x.dataset.tab).hidden = !on;
  }));
  $('empty-saved').innerHTML = BOOKMARK + `<p>${t(me ? 'savedEmpty' : 'savedEmptyGuest')}</p>` + (me ? '' : authLinks);
  $('empty-history').innerHTML = CLOCK + `<p>${t(me ? 'historyEmpty' : 'historyEmptyGuest')}</p>` + (me ? '' : authLinks);
  $('notice').innerHTML = `<span>${t('topicsNotice')}</span><a href="login.html">${t('login')}</a><a href="signup.html">${t('signup')}</a>`;

  // topics
  $('tiles').onclick = e => {
    const b = e.target.closest('.tile'); if (!b) return;
    if (!me) { $('notice').hidden = false; return; }
    const k = b.dataset.t;
    picked = picked.includes(k) ? picked.filter(x => x !== k) : [...picked, k];
    try { localStorage.setItem('folk_topics', JSON.stringify(picked)); } catch {}
    draw();
  };

  function draw() {
    $('tiles').innerHTML = TOPICS.map(k => {
      const on = picked.includes(k);
      return `<button class="tile" type="button" data-t="${k}" aria-pressed="${on}"><span>${t('cat.' + k)}</span>${on ? CHECK : PLUS}</button>`;
    }).join('');
    const done = [!!me, picked.length > 0, false];
    const pct = Math.round(done.filter(Boolean).length / 3 * 100);
    const C = 163.4;
    $('gs').innerHTML =
      `<div class="gs-top"><svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26"/><circle class="v" cx="32" cy="32" r="26" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}"/></svg>` +
      `<div><b>${pct}%</b><span>${t('progressLabel')}</span></div>` +
      (me ? '' : `<a class="btn dark" href="signup.html">${t('signup')}</a>`) + `</div>` +
      `<div class="gs-body"><p>${t(me ? 'startIntroMe' : 'startIntro')}</p><ul class="steps">` +
      ['step1', 'step2', 'step3'].map((k, i) => `<li${done[i] ? ' class="done"' : ''}><i>${done[i] ? CHECK : ''}</i><span>${t(k)}</span>${i === 2 ? `<em>${t('soon')}</em>` : ''}</li>`).join('') +
      `</ul></div>`;
  }
  draw();
})();
