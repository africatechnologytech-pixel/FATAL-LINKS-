(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const app = $('app'), hdr = $('hdr'), nav = $('nav'), banner = $('banner'), drawer = $('drawer'), splash = $('splash');

  let lang = localStorage.getItem('fl_lang') || 'en';
  if (!I18N[lang]) lang = 'en';
  let installEvent = null;
  let speaking = false;
  let currentGuide = null;

  /* ---------- helpers ---------- */
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const loc = (o) => (o && (o[lang] || o.en)) || '';
  const fmtDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayISO = () => new Date().toISOString().slice(0, 10);

  const dlGet = () => { try { return JSON.parse(localStorage.getItem('fl_dl') || '{}'); } catch (e) { return {}; } };
  const dlSet = (o) => { try { localStorage.setItem('fl_dl', JSON.stringify(o)); } catch (e) {} };
  const sizeKB = (g) => Math.max(1, Math.round(JSON.stringify(g).length / 1024));

  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    book: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/>',
    qr: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="3" height="3"/><rect x="13" y="8" width="3" height="3"/><rect x="8" y="13" width="3" height="3"/><path d="M13 13h3v3h-3z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    download: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/>',
    bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21h4"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>',
    drop: '<path d="M12 3C8 9 6 12 6 15a6 6 0 0 0 12 0c0-3-2-6-6-12z"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M10 7.5l4.5 4.5" transform="rotate(0)"/>'
  };
  const icon = (n, cls) =>
    `<svg class="i ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

  /* ---------- placeholder illustrations (swap for reviewed images later) ---------- */
  const SKIN = '#F2B38A', HAIR = '#2B2230', CORAL = '#F0605D', NAVY = '#1E2F6B', BLUE = '#1E5FE0';
  const ILL = {
    seizure: `<svg viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="80" cy="86" rx="68" ry="8" fill="#9DB8F5" opacity=".55"/><circle cx="34" cy="60" r="14" fill="${HAIR}"/><circle cx="34" cy="66" r="14" fill="${SKIN}"/><rect x="46" y="58" width="58" height="22" rx="11" fill="${CORAL}"/><rect x="98" y="62" width="52" height="16" rx="8" fill="${NAVY}"/><rect x="48" y="74" width="30" height="8" rx="4" fill="${SKIN}"/></svg>`,
    cpr: `<svg viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="80" cy="90" rx="68" ry="7" fill="#9DB8F5" opacity=".55"/><rect x="22" y="72" width="100" height="14" rx="7" fill="#EEF0FA"/><circle cx="28" cy="78" r="11" fill="${SKIN}"/><rect x="108" y="74" width="44" height="12" rx="6" fill="${NAVY}"/><circle cx="78" cy="20" r="10" fill="${SKIN}"/><path d="M70 12a10 10 0 0 1 16 0z" fill="${HAIR}"/><path d="M78 32L86 62" stroke="${CORAL}" stroke-width="16" stroke-linecap="round"/><path d="M85 46L88 70" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/><path d="M86 62L112 80" stroke="${NAVY}" stroke-width="12" stroke-linecap="round"/></svg>`,
    bleeding: `<svg viewBox="0 0 160 100" aria-hidden="true"><g transform="rotate(-10 80 56)"><rect x="14" y="44" width="110" height="26" rx="13" fill="${SKIN}"/><rect x="56" y="38" width="28" height="38" rx="4" fill="#fff"/><path d="M62 38v38M70 38v38M78 38v38" stroke="#D5DCEF" stroke-width="2"/><circle cx="126" cy="56" r="15" fill="${SKIN}"/></g><path d="M36 10C28 26 22 32 36 38c12-6 6-12 0-28z" fill="#E5262B"/></svg>`,
    choking: `<svg viewBox="0 0 160 100" aria-hidden="true"><path d="M36 100c4-24 24-32 44-32s40 8 44 32z" fill="${BLUE}"/><circle cx="80" cy="36" r="24" fill="${SKIN}"/><path d="M56 32a24 24 0 0 1 48 0c-12-9-36-9-48 0z" fill="${HAIR}"/><circle cx="71" cy="40" r="3" fill="${HAIR}"/><circle cx="89" cy="40" r="3" fill="${HAIR}"/><ellipse cx="80" cy="52" rx="5" ry="4" fill="#7A2A2A"/><path d="M64 34l-6 3M96 34l6 3" stroke="${HAIR}" stroke-width="2.5" stroke-linecap="round"/><rect x="66" y="64" width="28" height="11" rx="5.5" fill="${SKIN}"/></svg>`,
    burns: `<svg viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="80" cy="90" rx="66" ry="7" fill="#9DB8F5" opacity=".55"/><path d="M26 72C26 42 48 32 74 36l56 10c14 3 14 20 0 22l-38 5C82 88 48 92 26 72z" fill="${SKIN}"/><circle cx="92" cy="54" r="15" fill="#E5262B" opacity=".75"/><circle cx="92" cy="54" r="8" fill="#F5753B"/></svg>`,
    books: `<svg viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="80" cy="64" rx="70" ry="30" fill="#CFE0FB" opacity=".7"/><rect x="34" y="22" width="40" height="56" rx="5" fill="#E5262B"/><path d="M54 36v24M42 48h24" stroke="#fff" stroke-width="7" stroke-linecap="round"/><rect x="30" y="76" width="100" height="8" rx="3" fill="#fff" stroke="#1E2F6B" stroke-width="2"/><rect x="38" y="84" width="92" height="8" rx="3" fill="#fff" stroke="#1E2F6B" stroke-width="2"/><rect x="82" y="30" width="26" height="46" rx="4" fill="#1E5FE0"/></svg>`
  };

  /* ---------- chrome: header, banner, bottom nav, drawer ---------- */
  const PAGE = {
    library: { title: 'procTitle', back: '#/' },
    search: { title: 'procTitle', back: '#/' },
    guide: { title: 'guideTitle', back: '#/library', speaker: true },
    scan: { title: 'scanTitle', back: '#/' },
    profile: { title: 'epTitle', back: '#/' },
    'emergency-profile': { title: 'epTitle', back: '#/' },
    offline: { title: 'offTitle', back: '#/' },
    updates: { title: 'updatesTitle', back: '#/' }
  };

  function renderChrome(name) {
    document.documentElement.lang = lang;
    banner.textContent = t('banner');

    if (name === 'home') {
      hdr.className = 'hdr home';
      hdr.innerHTML = `
        <svg class="wave" viewBox="0 0 390 130" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0H300C240 24 130 40 0 118Z" fill="#0E2A80"/>
          <path d="M0 0H150C110 22 50 36 0 78Z" fill="#2F7BF0"/>
        </svg>
        <div class="homebar">
          <button type="button" class="iconbtn light" data-action="menu" aria-label="${t('menu')}">${icon('menu')}</button>
          <a class="iconbtn bellbtn" href="#/updates" aria-label="${t('latest')}">${icon('bell')}<span class="dot"></span></a>
        </div>`;
    } else {
      const p = PAGE[name] || { title: 'procTitle', back: '#/' };
      hdr.className = 'hdr page';
      hdr.innerHTML = `
        <div class="pagebar">
          <a class="iconbtn light" href="${p.back}" aria-label="${t('back')}">${icon('back')}</a>
          <h1 class="ptitle">${t(p.title)}</h1>
          ${p.speaker
            ? `<button type="button" class="iconbtn light" data-action="read" aria-label="${t('readAloud')}" ${lang !== 'en' ? 'disabled' : ''}>${icon('speaker')}</button>`
            : '<span class="iconbtn"></span>'}
        </div>`;
    }

    const active = { home: 'home', library: 'guides', search: 'guides', guide: 'guides', scan: 'scan', profile: 'profile', 'emergency-profile': 'profile', offline: 'offline' }[name];
    const items = [
      ['home', '#/', 'home', 'navHome'],
      ['guides', '#/library', 'book', 'navGuides'],
      ['scan', '#/scan', 'qr', 'navScan'],
      ['profile', '#/profile', 'user', 'navProfile'],
      ['offline', '#/offline', 'download', 'navOffline']
    ];
    nav.innerHTML = items
      .map(([key, href, ic, label]) =>
        `<a href="${href}" ${key === active ? 'aria-current="page"' : ''}>${icon(ic)}<span>${t(label)}</span></a>`)
      .join('');
  }

  function langButtons() {
    return `<div class="lang" role="group" aria-label="${t('language')}">
      ${LANGS.map((l) => `<button type="button" data-lang="${l.code}" aria-pressed="${l.code === lang}">${l.label}</button>`).join('')}
    </div>`;
  }

  function openDrawer() {
    drawer.hidden = false;
    drawer.innerHTML = `
      <div class="scrim" data-action="close"></div>
      <aside class="panel" role="dialog" aria-modal="true" aria-label="${t('menu')}">
        <div class="panel-top"><strong>${t('menu')}</strong>
          <button type="button" class="iconbtn" data-action="close" aria-label="${t('close')}">${icon('close')}</button></div>
        <h2>${t('language')}</h2>
        ${langButtons()}
        <a class="menulink" href="#/updates" data-action="close">${icon('bell')}<span>${t('latest')}</span></a>
        ${installEvent ? `<button type="button" class="menulink" data-action="install">${icon('download')}<span>${t('installApp')}</span></button>` : ''}
        <a class="menulink" href="check.html">${icon('check')}<span>${t('installHelp')}</span></a>
        <p class="about">${t('aboutText')}</p>
      </aside>`;
    const first = drawer.querySelector('button, a');
    if (first) first.focus();
  }
  function closeDrawer() { drawer.hidden = true; drawer.innerHTML = ''; }

  /* ---------- views ---------- */
  const sosBar = () =>
    `<a class="sos" href="tel:112">${icon('phone')}<span><strong>${t('sosTitle')}</strong><small>${t('sosSub')}</small></span></a>`;

  const matches = (g, q) => {
    if (!q) return true;
    const hay = [loc(g.title), loc(g.sub), loc(g.summary), (g.steps[lang] || g.steps.en).join(' ')].join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  };

  const guideRows = (guides, q) => {
    const list = guides.filter((g) => matches(g, q));
    if (!list.length) return `<p class="empty">${t('noResults')}</p>`;
    return `<ul class="list">${list.map((g) => `
      <li><a class="row" href="#/guide/${g.id}">
        <span class="thumb">${ILL[g.ill] || ''}</span>
        <span class="tx"><strong>${loc(g.title)}</strong><small>${loc(g.sub)}</small></span>${icon('chevron')}
      </a></li>`).join('')}</ul>`;
  };

  const searchBox = (value, id) => `
    <form class="search" data-search role="search">
      ${icon('search')}
      <input type="search" id="${id}" value="${(value || '').replace(/"/g, '&quot;')}" placeholder="${t('searchPh')}" aria-label="${t('searchPh')}" enterkeyhint="search" autocomplete="off">
    </form>`;

  async function homeView() {
    const ups = await DataService.getUpdates();
    const u = ups[0];
    return `
      <div class="logo-wrap"><img class="logo-circle" src="logo.png" alt="FATAL LINKS"></div>
      <p class="tagline">${t('tagline')}</p>
      ${searchBox('', 'homeq')}
      ${sosBar()}
      <div class="grid">
        <a class="tile aid" href="#/library">${icon('book', 'big')}<strong>${t('tileAid')}</strong><small>${t('tileAidSub')}</small>${icon('chevron', 'chev')}</a>
        <a class="tile scan" href="#/scan">${icon('qr', 'big')}<strong>${t('tileScan')}</strong><small>${t('tileScanSub')}</small>${icon('chevron', 'chev')}</a>
        <a class="tile prof" href="#/profile">${icon('user', 'big')}<strong>${t('tileProfile')}</strong><small>${t('tileProfileSub')}</small>${icon('chevron', 'chev')}</a>
        <a class="tile off" href="#/offline">${icon('download', 'big')}<strong>${t('tileOffline')}</strong><small>${t('tileOfflineSub')}</small>${icon('chevron', 'chev')}</a>
      </div>
      <a class="uprow" href="#/updates"><span class="ic">${icon('bell')}</span><span class="tx"><strong>${t('latest')}</strong><small>${loc(u.title)}</small></span>${icon('chevron')}</a>`;
  }

  async function libraryView(q) {
    const guides = await DataService.getGuides();
    return `
      ${searchBox(q, 'libq')}
      ${q ? `<p class="meta">${t('resultsFor')} "${q.replace(/</g, '&lt;')}"</p>` : `<p class="lead">${t('libIntro')}</p>`}
      <p class="notice">${t('notReviewed')}</p>
      <div id="glist">${guideRows(guides, q)}</div>`;
  }

  async function guideView(id) {
    const g = await DataService.getGuide(id);
    if (!g) return notFoundView();
    currentGuide = g;
    const fallback = lang !== 'en' && !(g.steps && g.steps[lang]);
    const li = (o) => (o[lang] || o.en).map((s) => `<li>${s}</li>`).join('');
    return `
      <div class="hero-ill">${ILL[g.ill] || ''}</div>
      <h2 class="gtitle"><span>${loc(g.title)}</span></h2>
      <p class="meta center"><span class="pill">${t('sample')}</span> ${t('updated')} ${fmtDate(g.updated)}</p>
      <p class="lead center">${loc(g.summary)}</p>
      ${fallback ? `<p class="notice info">${t('igFallback')}</p>` : ''}
      <ol class="steps">${(g.steps[lang] || g.steps.en).map((s) => `<li>${s}</li>`).join('')}</ol>
      <button type="button" class="readbtn" data-action="read" ${lang !== 'en' ? 'disabled' : ''}>${icon('play')}<span>${t('readAloud')}</span></button>
      ${lang !== 'en' ? `<p class="hint">${t('audioNA')}</p>` : ''}
      <section class="warn">
        <div class="wr">${icon('alert')}<div><strong>${t('avoid')}</strong><ul>${li(g.dont)}</ul></div></div>
        <div class="wr">${icon('plus')}<div><strong>${t('seekHelp')}</strong><ul>${li(g.callIf)}</ul></div></div>
      </section>
      <p class="source">${t('notReviewed')}</p>
      ${sosBar()}`;
  }

  async function scanView() {
    return `
      <div class="scanbox">
        <div class="frame"><i></i><i></i><i></i><i></i>${icon('qr', 'scan-ic')}</div>
        <p class="scan-t">${t('scanHint')}</p>
      </div>
      <p class="notice info">${t('scanSoon')}</p>`;
  }

  async function profileView() {
    const p = await DataService.getProfile();
    const initials = p.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
    return `
      <div class="pcard head">
        <span class="avatar">${initials}</span>
        <div><strong class="pname">${p.name}</strong><span class="pmeta">${p.age} &middot; ${t('bloodGroup')}</span>
          <span class="blood">${icon('drop')}${p.blood}</span></div>
      </div>
      <p class="notice">${t('demoProfile')}</p>
      <div class="pcard">
        <h2>${t('medInfo')}</h2>
        <dl>
          <dt>${icon('alert')}${t('allergies')}</dt><dd>${p.allergies}</dd>
          <dt>${icon('heart')}${t('conditions')}</dt><dd>${p.conditions}</dd>
          <dt>${icon('pill')}${t('medications')}</dt><dd>${p.medications}</dd>
        </dl>
      </div>
      <div class="pcard">
        <h2>${t('contact')}</h2>
        <a class="contact" href="tel:${p.contact.replace(/\s/g, '')}">${icon('phone')}<span>${p.contact}</span></a>
      </div>
      <button type="button" class="bigbtn" disabled>${icon('qr')}<span>${t('genQR')}</span></button>
      <p class="hint">${t('genSoon')}</p>
      <div class="pcard">
        <h2>${t('account')}</h2>
        <p class="meta">${t('signIn')}. ${t('signInSoon')}.</p>
        <h2 class="sp">${t('language')}</h2>
        ${langButtons()}
      </div>`;
  }

  async function offlineView() {
    const guides = await DataService.getGuides();
    const dl = dlGet();
    const saved = guides.filter((g) => dl[g.id]);
    const rest = guides.filter((g) => !dl[g.id]);
    const row = (g, isSaved) => `
      <li><div class="row dlrow">
        <span class="thumb">${ILL[g.ill] || ''}</span>
        <span class="tx"><strong>${loc(g.title)}</strong><small>${isSaved ? `${t('downloaded')} &middot; ${sizeKB(g)} KB &middot; ${fmtDate(dl[g.id])}` : t('download')}</small></span>
        <button type="button" class="dlbtn ${isSaved ? 'done' : ''}" data-dl="${g.id}" aria-label="${isSaved ? t('remove') : t('download')}: ${loc(g.title)}">${icon(isSaved ? 'check' : 'download')}</button>
      </div></li>`;
    return `
      <div class="hero-ill small">${ILL.books}</div>
      <p class="offhead">${t('offHead')}</p>
      <h2 class="sec">${t('saved')}</h2>
      ${saved.length ? `<ul class="list">${saved.map((g) => row(g, true)).join('')}</ul>` : `<p class="empty">${t('nothingSaved')}</p>`}
      ${rest.length ? `<h2 class="sec">${t('available')}</h2><ul class="list">${rest.map((g) => row(g, false)).join('')}</ul>` : ''}
      <p class="notice info">${t('offNote')}</p>`;
  }

  async function updatesView() {
    const ups = await DataService.getUpdates();
    return `
      <p class="lead">${t('updatesIntro')}</p>
      <ul class="list">
        ${ups.map((u) => `<li class="upd"><small>${fmtDate(u.date)}</small><strong>${loc(u.title)}</strong><p>${loc(u.body)}</p></li>`).join('')}
      </ul>`;
  }

  function notFoundView() {
    return `<div class="ph"><h2>${t('notFound')}</h2><p>${t('notFoundText')}</p><a class="bigbtn link" href="#/">${t('goHome')}</a></div>`;
  }

  /* ---------- read aloud (English uses the phone's voice; Igbo audio comes later) ---------- */
  function setReadUI() {
    document.querySelectorAll('[data-action="read"]').forEach((b) => {
      b.classList.toggle('on', speaking);
      const sp = b.querySelector('span');
      if (sp) sp.textContent = speaking ? t('stopReading') : t('readAloud');
      const svg = b.querySelector('svg');
      if (svg && b.classList.contains('readbtn')) svg.innerHTML = speaking ? ICONS.stop : ICONS.play;
    });
  }
  function stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speaking = false;
    setReadUI();
  }
  function readGuide() {
    if (lang !== 'en' || !currentGuide) return;
    if (!('speechSynthesis' in window)) { alert(t('noSpeech')); return; }
    if (speaking) { stopSpeech(); return; }
    const g = currentGuide;
    const parts = [loc(g.title) + '.'].concat(g.steps.en.map((s, i) => `Step ${i + 1}. ${s}`));
    window.speechSynthesis.cancel();
    parts.forEach((txt, i) => {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'en'; u.rate = 0.95;
      if (i === parts.length - 1) { u.onend = () => { speaking = false; setReadUI(); }; u.onerror = u.onend; }
      window.speechSynthesis.speak(u);
    });
    speaking = true;
    setReadUI();
  }

  /* ---------- router ---------- */
  async function render() {
    stopSpeech();
    closeDrawer();
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const name = parts[0] || 'home';
    const arg = decodeURIComponent(parts.slice(1).join('/') || '');
    renderChrome(name);
    let html;
    switch (name) {
      case 'home': html = await homeView(); break;
      case 'library': html = await libraryView(''); break;
      case 'search': html = await libraryView(arg); break;
      case 'guide': html = await guideView(arg); break;
      case 'scan': html = await scanView(); break;
      case 'profile':
      case 'emergency-profile': html = await profileView(); break;
      case 'offline': html = await offlineView(); break;
      case 'updates': html = await updatesView(); break;
      default: html = notFoundView();
    }
    app.innerHTML = html;
    app.className = 'main ' + name;
    window.scrollTo(0, 0);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', async (e) => {
    const lb = e.target.closest('[data-lang]');
    if (lb) {
      lang = lb.getAttribute('data-lang');
      localStorage.setItem('fl_lang', lang);
      render();
      return;
    }
    const act = e.target.closest('[data-action]');
    if (act) {
      const a = act.getAttribute('data-action');
      if (a === 'menu') openDrawer();
      else if (a === 'close') closeDrawer();
      else if (a === 'read') readGuide();
      else if (a === 'install' && installEvent) {
        installEvent.prompt();
        installEvent.userChoice.finally(() => { installEvent = null; closeDrawer(); });
      }
      return;
    }
    const dl = e.target.closest('[data-dl]');
    if (dl) {
      const id = dl.getAttribute('data-dl');
      const st = dlGet();
      if (st[id]) delete st[id]; else st[id] = todayISO();
      dlSet(st);
      app.innerHTML = await offlineView();
    }
  });

  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-search]');
    if (!f) return;
    e.preventDefault();
    const q = f.querySelector('input').value.trim();
    location.hash = q ? '#/search/' + encodeURIComponent(q) : '#/library';
  });

  // live filtering while typing on the guides page
  document.addEventListener('input', async (e) => {
    if (e.target.id !== 'libq') return;
    const guides = await DataService.getGuides();
    const box = document.getElementById('glist');
    if (box) box.innerHTML = guideRows(guides, e.target.value.trim());
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });
  window.addEventListener('hashchange', render);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  /* ---------- splash screen (once per visit, under 2 seconds) ---------- */
  function hideSplash() {
    splash.classList.add('out');
    setTimeout(() => splash.remove(), 400);
  }
  let seen = false;
  try { seen = sessionStorage.getItem('fl_splash') === '1'; sessionStorage.setItem('fl_splash', '1'); } catch (e) {}
  if (seen) splash.remove(); else setTimeout(hideSplash, 1600);

  render();
})();
