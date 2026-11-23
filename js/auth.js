/* Folk auth (front-end only).
   shortcut: no backend yet. Users and the session live in localStorage and passwords are NOT stored,
   so any password of 6+ characters logs a registered email in. Replace with a real API (and real Google sign-in) later. */
const Folk = (() => {
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const key = name => `folk:${(read('folk_session') || {}).id || 'guest'}:${name}`;
  const store = {
    key,
    read: name => read(key(name)),
    write: (name, value) => write(key(name), value)
  };
  const snapshot = x => ({
    id: x.id || x.url,
    title: x.title || '',
    title_en: x.title_en || '',
    url: x.url || '',
    image: x.image || '',
    source: x.source || '',
    category: x.category || '',
    excerpt: x.excerpt || '',
    published: x.published || ''
  });
  const push = (name, item, limit) => {
    if (!item || !(item.id || item.url)) return;
    const snap = { ...snapshot(item), at: Date.now() };
    const list = (store.read(name) || []).filter(x => x.id !== snap.id);
    store.write(name, [snap, ...list].slice(0, limit));
  };
  return {
    session: () => read('folk_session'),
    users: () => read('folk_users') || [],
    addUser: u => write('folk_users', [...(read('folk_users') || []), u]),
    key, store,
    start(u) { write('folk_session', { id: u.id || `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: u.name, email: u.email }); location.href = 'home.html'; },
    logout() { try { localStorage.removeItem('folk_session'); } catch {} location.href = 'index.html'; },
    saved: () => store.read('saved') || [],
    isSaved: id => (store.read('saved') || []).some(x => x.id === id),
    save: item => push('saved', item, 200),
    unsave: id => store.write('saved', (store.read('saved') || []).filter(x => x.id !== id)),
    clearSaved: () => store.write('saved', []),
    history: () => store.read('history') || [],
    remember: item => push('history', item, 100),
    clearHistory: () => store.write('history', []),
    topics: () => store.read('topics') || [],
    setTopics: list => store.write('topics', list)
  };
})();

(() => {
  const page = document.body.dataset.page;
  if (page !== 'login' && page !== 'signup') return;
  const $ = id => document.getElementById(id);
  const say = (id, html, ok) => { const m = $(id); m.innerHTML = html; m.classList.toggle('ok', !!ok); };
  const emailOk = v => /^\S+@\S+\.\S+$/.test(v);
  const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 5.1-5.9M9.9 4.2A9.8 9.8 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22"/></svg>';

  document.querySelectorAll('.eye').forEach(b => {
    b.innerHTML = EYE;
    b.onclick = () => {
      const input = b.previousElementSibling, show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.setAttribute('aria-pressed', show);
      b.setAttribute('aria-label', FolkI18n.t(show ? 'hidePassword' : 'showPassword'));
      b.innerHTML = show ? EYE_OFF : EYE;
    };
  });

  if (page === 'login') {
    let who = null;
    $('google').onclick = () => Folk.start({ id: 'google', name: FolkI18n.t('googleUser'), email: '' }); // shortcut: fake Google sign-in
    $('email-form').onsubmit = e => {
      e.preventDefault();
      const email = $('email').value.trim().toLowerCase();
      if (!emailOk(email)) return say('msg1', FolkI18n.t('validEmail'));
      who = Folk.users().find(u => u.email === email);
      if (!who) return say('msg1', FolkI18n.t('noAccountFound'));
      say('msg1', '');
      $('who').textContent = email;
      $('step-email').hidden = true;
      $('pw-form').hidden = false;
      $('password').focus();
    };
    $('back').onclick = () => {
      $('pw-form').hidden = true;
      $('step-email').hidden = false;
      $('password').value = '';
      say('msg2', '');
      $('email').focus();
    };
    $('forgot').onclick = () => say('msg2', FolkI18n.t('resetSoon'), true);
    $('pw-form').onsubmit = e => {
      e.preventDefault();
      if ($('password').value.length < 6) return say('msg2', FolkI18n.t('passwordMin'));
      Folk.start(who);
    };
  }

  if (page === 'signup') {
    $('signup-form').onsubmit = e => {
      e.preventDefault();
      const name = $('name').value.trim(), email = $('email').value.trim().toLowerCase();
      if (!name) return say('msg', FolkI18n.t('enterName'));
      if (!emailOk(email)) return say('msg', FolkI18n.t('validEmail'));
      if ($('password').value.length < 6) return say('msg', FolkI18n.t('passwordMin'));
      if (Folk.users().some(u => u.email === email)) return say('msg', FolkI18n.t('emailRegistered'));
      const id = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      Folk.addUser({ id, name, email });
      Folk.start({ id, name, email });
    };
  }
})();
