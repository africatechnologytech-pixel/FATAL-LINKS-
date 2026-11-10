(function () {
  'use strict';

  const app = document.getElementById('app');
  const hdr = document.getElementById('hdr');
  const nav = document.getElementById('nav');
  const banner = document.getElementById('banner');

  let lang = localStorage.getItem('fl_lang') || 'en';
  if (!I18N[lang]) lang = 'en';
  let installEvent = null;

  /* ---------- helpers ---------- */
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const loc = (o) => (o && (o[lang] || o.en)) || '';
  const fmtDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    book: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h12"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    pulse: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 12h3l1.5-3 2 6 1.5-3H17"/>',
    download: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/>',
    bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21h4"/>',
    aid: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M12 10.5v6M9 13.5h6"/><path d="M9 7V4.5h6V7"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>'
  };
  const icon = (n) =>
    `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

  /* ---------- page chrome (header, banner, bottom nav) ---------- */
  function renderChrome(name) {
    document.documentElement.lang = lang;
    hdr.innerHTML = `
      <div class="hdr-in">
        <a class="brand" href="#/" aria-label="FATAL LINKS, ${t('navHome')}">
          <svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#fff"/><path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#0E5A3F"/></svg>
          <span>FATAL LINKS</span>
        </a>
        <div class="lang" role="group" aria-label="${t('language')}">
          ${LANGS.map((l) => `<button type="button" data-lang="${l.code}" aria-pressed="${l.code === lang}">${l.label}</button>`).join('')}
        </div>
      </div>`;
    banner.textContent = t('banner');

    const active = { home: 'home', library: 'library', guide: 'library', scan: 'scan', profile: 'profile', 'emergency-profile': 'profile' }[name];
    const items = [
      ['home', '#/', 'home', 'navHome'],
      ['library', '#/library', 'book', 'navLibrary'],
      ['scan', '#/scan', 'qr', 'navScan'],
      ['profile', '#/profile', 'user', 'navProfile']
    ];
    nav.innerHTML = items
      .map(([key, href, ic, label]) =>
        `<a href="${href}" ${key === active ? 'aria-current="page"' : ''}>${icon(ic)}<span>${t(label)}</span></a>`)
      .join('');
  }

  /* ---------- views ---------- */
  const back = (href) => `<a class="back" href="${href}">${icon('back')}${t('back')}</a>`;

  const sos = () =>
    `<a class="sos" href="tel:112">${icon('phone')}<span><strong>${t('sosTitle')}</strong><small>${t('sosSub')}</small></span></a>`;

  const tile = (href, ic, tk, dk, cls) =>
    `<a class="tile ${cls || ''}" href="${href}"><span class="ic">${icon(ic)}</span><span class="tx"><strong>${t(tk)}</strong><small>${t(dk)}</small></span></a>`;

  function homeView() {
    return `
      ${sos()}
      <h1 class="hero">${t('heroTitle')}</h1>
      <p class="lead">${t('heroSub')}</p>
      <div class="grid">
        ${tile('#/library', 'aid', 'tFirstAid', 'dFirstAid', 'primary')}
        ${tile('#/scan', 'qr', 'tScan', 'dScan')}
        ${tile('#/emergency-profile', 'pulse', 'tEmerg', 'dEmerg')}
        ${tile('#/offline', 'book', 'tOffline', 'dOffline')}
        ${tile('#/downloads', 'download', 'tDownloads', 'dDownloads')}
        ${tile('#/updates', 'bell', 'tUpdates', 'dUpdates')}
        ${tile('#/profile', 'user', 'tProfile', 'dProfile')}
      </div>
      ${installEvent ? `<button type="button" class="btn" id="install">${t('install')}</button>` : ''}`;
  }

  function placeholderView(titleKey, descKey, ic, step) {
    return `
      ${back('#/')}
      <div class="ph">
        <span class="ic big">${icon(ic)}</span>
        <h1>${t(titleKey)}</h1>
        <p>${t(descKey)}</p>
        <p class="soon"><strong>${t('comingSoon')}</strong> ${t('plannedStep').replace('{n}', step)}</p>
      </div>`;
  }

  async function libraryView() {
    const guides = await DataService.getGuides();
    return `
      ${back('#/')}
      <h1>${t('libTitle')}</h1>
      <p class="lead">${t('libIntro')}</p>
      <p class="notice">${t('notReviewed')}</p>
      <ul class="list">
        ${guides.map((g) => `
          <li><a class="row" href="#/guide/${g.id}">
            <span class="tx"><strong>${loc(g.title)}</strong>
            <small>${t('updated')} ${fmtDate(g.updated)}</small></span>${icon('chevron')}
          </a></li>`).join('')}
      </ul>`;
  }

  async function guideView(id) {
    const g = await DataService.getGuide(id);
    if (!g) return notFoundView();
    const fallback = lang !== 'en' && !(g.steps && g.steps[lang]);
    const list = (o, cls) => `<ul class="${cls}">${(o[lang] || o.en).map((s) => `<li>${s}</li>`).join('')}</ul>`;
    return `
      ${back('#/library')}
      ${sos()}
      <h1>${loc(g.title)}</h1>
      <p class="meta"><span class="pill">${t('sample')}</span> ${t('updated')} ${fmtDate(g.updated)}</p>
      <p class="lead">${loc(g.summary)}</p>
      <p class="notice">${t('notReviewed')}</p>
      ${fallback ? `<p class="notice info">${t('igFallback')}</p>` : ''}
      <section><h2>${t('steps')}</h2>
        <ol class="steps">${(g.steps[lang] || g.steps.en).map((s) => `<li>${s}</li>`).join('')}</ol>
      </section>
      <section class="call"><h2>${t('callIf')}</h2>${list(g.callIf, 'bul')}</section>
      <section class="no"><h2>${t('dont')}</h2>${list(g.dont, 'bul')}</section>`;
  }

  async function updatesView() {
    const ups = await DataService.getUpdates();
    return `
      ${back('#/')}
      <h1>${t('updatesTitle')}</h1>
      <p class="lead">${t('updatesIntro')}</p>
      <ul class="list">
        ${ups.map((u) => `
          <li class="upd"><small>${fmtDate(u.date)}</small><strong>${loc(u.title)}</strong><p>${loc(u.body)}</p></li>`).join('')}
      </ul>`;
  }

  function notFoundView() {
    return `<div class="ph"><h1>${t('notFound')}</h1><p>${t('notFoundText')}</p><a class="btn" href="#/">${t('goHome')}</a></div>`;
  }

  /* ---------- router ---------- */
  async function render() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const name = parts[0] || 'home';
    renderChrome(name);
    let html;
    switch (name) {
      case 'home': html = homeView(); break;
      case 'library': html = await libraryView(); break;
      case 'guide': html = await guideView(parts[1]); break;
      case 'updates': html = await updatesView(); break;
      case 'scan': html = placeholderView('tScan', 'pScan', 'qr', 6); break;
      case 'emergency-profile': html = placeholderView('tEmerg', 'pEmerg', 'pulse', 5); break;
      case 'profile': html = placeholderView('tProfile', 'pProfile', 'user', 5); break;
      case 'offline': html = placeholderView('tOffline', 'pOffline', 'book', 4); break;
      case 'downloads': html = placeholderView('tDownloads', 'pDownloads', 'download', 4); break;
      default: html = notFoundView();
    }
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const lb = e.target.closest('[data-lang]');
    if (lb) {
      lang = lb.getAttribute('data-lang');
      localStorage.setItem('fl_lang', lang);
      render();
      return;
    }
    if (e.target.closest('#install') && installEvent) {
      installEvent.prompt();
      installEvent.userChoice.finally(() => { installEvent = null; render(); });
    }
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e;
    if (!location.hash || location.hash === '#/') render();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  render();
})();
