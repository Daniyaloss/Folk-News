(() => {
  const $ = id => document.getElementById(id);
  const t = FolkI18n.t;
  const me = Folk.session();
  const TOPICS = ['Politics', 'Sports', 'Tech', 'Health', 'Economy', 'Entertainment', 'Law', 'Local', 'World'];
  let picked = me ? Folk.topics() : [];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const USER = svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>');
  const PLUS = svg('<path d="M12 5v14M5 12h14"/>');
  const CHECK = svg('<path d="m5 12 5 5 9-10"/>');
  const BOOKMARK = svg('<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>');
  const CLOCK = svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
  const authBtns = `<a class="btn" href="login.html">${t('login')}</a><a class="btn dark" href="signup.html">${t('signup')}</a>`;
  const authLinks = `<div class="p-actions">${authBtns}</div>`;

  if (me) { $('p-av').textContent = (me.name || '?').trim().charAt(0).toUpperCase(); $('p-av').classList.add('me'); }
  else $('p-av').innerHTML = USER;
  $('p-name').textContent = me ? me.name : t('guest');
  $('p-sub').textContent = me ? (me.email || '') : t('profileNotLoggedIn');
  $('p-hint').textContent = me ? '' : t('profileGuestHint');
  $('p-actions').innerHTML = me ? `<button class="btn" type="button" id="p-logout">${t('logout')}</button>` : authBtns;
  if (me) $('p-logout').onclick = Folk.logout;

  const titleOf = x => (FolkI18n.lang() === 'en' && x.title_en ? x.title_en : (x.title || x.title_en || ''));
  const when = x => {
    const d = x.published ? new Date(x.published) : (x.at ? new Date(x.at) : null);
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(FolkI18n.locale(), { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  };
  const pic = url => url
    ? `<span class="ph has-img" style="--t:#dde3ee;background-image:url('${encodeURI(url).replace(/'/g, '%27')}')"></span>`
    : '<span class="ph" style="--t:#dde3ee"></span>';
  const storyHtml = (x, removable) => {
    const cat = t('cat.' + (x.category || 'News'), {}, x.category || 'News');
    const meta = [x.source || cat, when(x)].filter(Boolean).join(' · ');
    return `<a class="row" href="${esc(x.url || '#')}" target="_blank" rel="noopener" data-id="${esc(x.id)}">${pic(x.image)}<div><span class="cat">${esc(cat)}</span><h3>${esc(titleOf(x))}</h3><p>${esc(x.excerpt || '')}</p><small>${esc(meta)}</small></div>${removable ? `<button class="save" type="button" data-remove="${esc(x.id)}" aria-label="${t('removeSaved')}" aria-pressed="true">${BOOKMARK}</button>` : ''}</a>`;
  };
  const renderStories = kind => {
    const items = kind === 'saved' ? Folk.saved() : Folk.history();
    $(kind + '-list').innerHTML = items.map(x => storyHtml(x, kind === 'saved')).join('');
    $('empty-' + kind).hidden = items.length > 0;
    $('clear-' + kind).hidden = items.length === 0;
  };

  const tabs = [...document.querySelectorAll('[data-tab]')];
  const activate = name => tabs.forEach(x => {
    const on = x.dataset.tab === name;
    x.setAttribute('aria-selected', on);
    $('panel-' + x.dataset.tab).hidden = !on;
  });
  tabs.forEach(b => b.onclick = () => activate(b.dataset.tab));
  const initial = new URLSearchParams(location.search).get('tab');
  activate(['topics', 'saved', 'history'].includes(initial) ? initial : 'topics');

  $('empty-saved').innerHTML = BOOKMARK + `<p>${t(me ? 'savedEmpty' : 'savedEmptyGuest')}</p>` + (me ? '' : authLinks);
  $('empty-history').innerHTML = CLOCK + `<p>${t(me ? 'historyEmpty' : 'historyEmptyGuest')}</p>` + (me ? '' : authLinks);
  $('notice').innerHTML = `<span>${t('topicsNotice')}</span><a href="login.html">${t('login')}</a><a href="signup.html">${t('signup')}</a>`;
  renderStories('saved');
  renderStories('history');

  $('clear-saved').onclick = () => { Folk.clearSaved(); renderStories('saved'); draw(); };
  $('clear-history').onclick = () => { Folk.clearHistory(); renderStories('history'); };
  $('saved-list').onclick = e => {
    const b = e.target.closest('[data-remove]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    Folk.unsave(b.dataset.remove);
    renderStories('saved');
    draw();
  };

  $('tiles').onclick = e => {
    const b = e.target.closest('.tile'); if (!b) return;
    if (!me) { $('notice').hidden = false; return; }
    const k = b.dataset.t;
    picked = picked.includes(k) ? picked.filter(x => x !== k) : [...picked, k];
    Folk.setTopics(picked);
    draw();
  };

  function draw() {
    $('tiles').innerHTML = TOPICS.map(k => {
      const on = picked.includes(k);
      return `<button class="tile" type="button" data-t="${k}" aria-pressed="${on}"><span>${t('cat.' + k)}</span>${on ? CHECK : PLUS}</button>`;
    }).join('');
    const done = [!!me, picked.length > 0, Folk.saved().length > 0];
    const pct = Math.round(done.filter(Boolean).length / 3 * 100);
    const C = 163.4;
    $('gs').innerHTML =
      `<div class="gs-top"><svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26"/><circle class="v" cx="32" cy="32" r="26" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}"/></svg>` +
      `<div><b>${pct}%</b><span>${t('progressLabel')}</span></div>` +
      (me ? '' : `<a class="btn dark" href="signup.html">${t('signup')}</a>`) + `</div>` +
      `<div class="gs-body"><p>${t(me ? 'startIntroMe' : 'startIntro')}</p><ul class="steps">` +
      ['step1', 'step2', 'step3'].map((k, i) => `<li${done[i] ? ' class="done"' : ''}><i>${done[i] ? CHECK : ''}</i><span>${t(k)}</span></li>`).join('') +
      `</ul></div>`;
  }
  draw();
})();
