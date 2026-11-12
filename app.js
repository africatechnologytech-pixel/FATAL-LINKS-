(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const app = $('app'), hdr = $('hdr'), nav = $('nav'), banner = $('banner'), drawer = $('drawer'), splash = $('splash');

  let lang = localStorage.getItem('fl_lang') || 'en';
  if (!I18N[lang]) lang = 'en';
  let installEvent = null;
  let speaking = false;
  let currentGuide = null;
  let user;                 // undefined = still checking, null = signed out, object = signed in
  let fbState = 'loading';  // loading | ready | failed
  let authMode = 'signin';
  let viewProfile = null;   // profile being shown on the Profile page
  let editToken = null;     // QR code of the profile being edited
  let scanStream = null, scanTimer = null;

  /* ---------- helpers ---------- */
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const locRaw = (o) => (o && (o[lang] || o.en)) || '';
  const loc = (o) => esc(locRaw(o));   // safe to place inside page text
  const fmtDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const todayISO = () => new Date().toISOString().slice(0, 10);

  const fmtSize = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

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
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
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
    profile: { title: 'epTitle', back: '#/', edit: true },
    'emergency-profile': { title: 'epTitle', back: '#/', edit: true },
    'profile-edit': { title: 'epEditTitle', back: '#/profile' },
    offline: { title: 'offTitle', back: '#/' },
    updates: { title: 'updatesTitle', back: '#/' },
    e: { title: 'emgTitle', back: '#/' },
    admin: { title: 'adminTitle', back: '#/profile' }
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
            ? `<button type="button" class="iconbtn light" data-action="read" aria-label="${t('readAloud')}">${icon('speaker')}</button>`
            : (p.edit && user ? `<a class="iconbtn light" href="#/profile-edit" aria-label="${t('editProfile')}">${icon('pen')}</a>` : '<span class="iconbtn"></span>')}
        </div>`;
    }

    const active = { home: 'home', library: 'guides', search: 'guides', guide: 'guides', scan: 'scan', profile: 'profile', 'emergency-profile': 'profile', 'profile-edit': 'profile', admin: 'profile', offline: 'offline' }[name];
    const items = [
      ['home', '#/', 'home', 'navHome'],
      ['guides', '#/library', 'book', 'navGuides'],
      ['scan', '#/scan', 'qr', 'navScan'],
      ['profile', '#/profile', 'user', 'navProfile'],
      ['offline', '#/offline', 'download', 'navOffline']
    ];
    nav.style.display = name === 'e' ? 'none' : '';
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
    const hay = [locRaw(g.title), locRaw(g.sub), locRaw(g.summary), (g.steps[lang] || g.steps.en).join(' ')].join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  };

  const thumbHtml = (g) =>
    g.thumb && String(g.thumb).indexOf('data:image/') === 0
      ? `<img src="${esc(g.thumb)}" alt="">`
      : (ILL[g.ill] || ILL.books);

  const guideRows = (guides, q) => {
    const list = guides.filter((g) => matches(g, q));
    if (!list.length) return `<p class="empty">${t('noResults')}</p>`;
    return `<ul class="list">${list.map((g) => `
      <li><a class="row" href="#/guide/${g.id}">
        <span class="thumb">${thumbHtml(g)}</span>
        <span class="tx"><strong>${loc(g.title)}</strong><small>${loc(g.sub)}</small></span>${icon('chevron')}
      </a></li>`).join('')}</ul>`;
  };

  const searchBox = (value, id) => `
    <form class="search" data-search role="search">
      ${icon('search')}
      <input type="search" id="${id}" value="${(value || '').replace(/"/g, '&quot;')}" placeholder="${t('searchPh')}" aria-label="${t('searchPh')}" enterkeyhint="search" autocomplete="off">
    </form>`;

  async function homeView() {
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
      <a class="uprow" href="#/updates"><span class="ic">${icon('bell')}</span><span class="tx"><strong>${t('latest')}</strong><small id="uptitle"></small></span>${icon('chevron')}</a>`;
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
    const partial = lang !== 'en' && !fallback && g.igPartial;
    const li = (o) => (o[lang] || o.en).map((s) => `<li>${esc(s)}</li>`).join('');
    const steps = g.steps[lang] || g.steps.en;
    return `
      <div class="hero-ill" ${g.cover ? `data-hero="${esc(g.cover)}"` : ''}>${ILL[g.ill] || ILL.books}</div>
      <h2 class="gtitle"><span>${loc(g.title)}</span></h2>
      <p class="meta center"><span class="pill">${t('sample')}</span> ${t('updated')} ${g.updated ? fmtDate(g.updated) : ''}</p>
      <p class="lead center">${loc(g.summary)}</p>
      ${fallback ? `<p class="notice info">${t('igFallback')}</p>` : ''}
      ${partial ? `<p class="notice info">${t('igPartial')}</p>` : ''}
      <ol class="steps">${steps.map((s, i) => `<li data-step="${i}">${esc(s)}${g.stepImgs && g.stepImgs[i] ? `<img class="stepimg" data-img="${esc(g.stepImgs[i])}" alt="Picture for step ${i + 1}">` : ''}${lang === 'en' || (g.stepAudioIg && g.stepAudioIg[i]) ? `<button type="button" class="listen" data-action="playstep" data-i="${i}" aria-label="${t('listen')} - ${i + 1}">${icon('speaker')}<span>${t('listen')}</span></button>` : ''}</li>`).join('')}</ol>
      <button type="button" class="readbtn" data-action="read">${icon('play')}<span>${t('readAloud')}</span></button>
      ${lang !== 'en' && !hasIgAudio(g) ? `<p class="hint">${t('audioNA')}</p>` : ''}
      ${lang !== 'en' && hasIgAudio(g) && g.stepAudioIg.some((x) => !x) ? `<p class="hint">${t('audioPartial')}</p>` : ''}
      <section class="warn">
        <div class="wr">${icon('alert')}<div><strong>${t('avoid')}</strong><ul>${li(g.dont)}</ul></div></div>
        <div class="wr">${icon('plus')}<div><strong>${t('seekHelp')}</strong><ul>${li(g.callIf)}</ul></div></div>
      </section>
      <p class="source">${t('notReviewed')}</p>
      ${sosBar()}`;
  }

  const FIELDS = [
    { k: 'name', label: 'fullName', type: 'text', max: 80 },
    { k: 'age', label: 'age', type: 'number' },
    { k: 'blood', label: 'bloodGroup', type: 'select' },
    { k: 'allergies', label: 'allergies', type: 'textarea', max: 300 },
    { k: 'conditions', label: 'conditions', type: 'textarea', max: 300 },
    { k: 'medications', label: 'medications', type: 'textarea', max: 300 },
    { k: 'contactName', label: 'contactName', type: 'text', max: 80 },
    { k: 'contactPhone', label: 'contactPhone', type: 'tel', max: 30 }
  ];
  const BLOODS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const cacheGet = () => { try { return JSON.parse(localStorage.getItem('fl_pcache') || 'null'); } catch (e) { return null; } };
  const cacheSet = (uid, email, profile) => {
    try { const p = Object.assign({}, profile); delete p.updatedAt; localStorage.setItem('fl_pcache', JSON.stringify({ uid, email, profile: p })); } catch (e) {}
  };

  const authErr = (e) => {
    const c = (e && e.code) || '';
    const m = {
      'auth/invalid-email': 'errEmail', 'auth/email-already-in-use': 'errInUse', 'auth/weak-password': 'errWeak',
      'auth/invalid-credential': 'errCred', 'auth/user-not-found': 'errCred', 'auth/wrong-password': 'errCred',
      'auth/missing-password': 'errCred', 'auth/network-request-failed': 'errNet', 'auth/too-many-requests': 'errMany',
      'auth/unauthorized-domain': 'errDomain', 'auth/operation-not-allowed': 'errOp'
    }[c];
    return m ? t(m) : t('errGeneric') + (c ? ' (' + c + ')' : '');
  };

  const initials = (n) => (n || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  async function sampleBlock() {
    const p = await DataService.getProfile();
    return `
      <h2 class="sec">${t('exampleProfile')}</h2>
      <div class="pcard head"><span class="avatar">${esc(initials(p.name))}</span>
        <div><strong class="pname">${esc(p.name)}</strong><span class="pmeta">${p.age} &middot; ${t('bloodGroup')}</span>
        <span class="blood">${icon('drop')}${esc(p.blood)}</span></div></div>
      <p class="notice">${t('demoProfile')}</p>
      <div class="pcard"><h2>${t('medInfo')}</h2><dl>
        <dt>${icon('alert')}${t('allergies')}</dt><dd>${esc(p.allergies)}</dd>
        <dt>${icon('heart')}${t('conditions')}</dt><dd>${esc(p.conditions)}</dd>
        <dt>${icon('pill')}${t('medications')}</dt><dd>${esc(p.medications)}</dd></dl></div>
      <div class="pcard"><h2>${t('contact')}</h2>
        <a class="contact" href="tel:${esc(p.contact.replace(/\s/g, ''))}">${icon('phone')}<span>${esc(p.contact)}</span></a></div>`;
  }

  function authCard() {
    const up = authMode === 'signup';
    return `
      <div class="pcard">
        <h2>${t('welcomeAuth')}</h2>
        <p class="meta">${t('authIntro')}</p>
        <div class="seg" role="group">
          <button type="button" data-action="authmode" data-mode="signin" aria-pressed="${!up}">${t('signInBtn')}</button>
          <button type="button" data-action="authmode" data-mode="signup" aria-pressed="${up}">${t('createAcct')}</button>
        </div>
        <form data-auth novalidate>
          <div class="fld"><label for="a_email">${t('email')}</label>
            <input id="a_email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" required></div>
          <div class="fld"><label for="a_pw">${t('password')}</label>
            <input id="a_pw" name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6" required></div>
          <p id="autherr" class="err" role="alert" hidden></p>
          <button class="bigbtn" type="submit">${up ? t('createAcct') : t('signInBtn')}</button>
        </form>
        ${up ? '' : `<button type="button" class="linkbtn" data-action="forgot">${t('forgot')}</button>`}
        <p class="hint">${t('passHint')}</p>
      </div>`;
  }

  const chip = (on) => `<span class="chip ${on ? 'on' : ''}">${on ? t('sharedChip') : t('privateChip')}</span>`;

  function profileCards(p, email, offlineCopy, adm) {
    const sh = p.share || {};
    const val = (k) => (p[k] ? esc(p[k]) : `<em class="none">${t('noInfo')}</em>`);
    return `
      <div class="pcard head"><span class="avatar">${esc(initials(p.name))}</span>
        <div><strong class="pname">${esc(p.name || '')}</strong>
        <span class="pmeta">${p.age != null && p.age !== '' ? esc(p.age) + ' &middot; ' : ''}${t('bloodGroup')}</span>
        <span class="blood">${icon('drop')}${p.blood ? esc(p.blood) : '-'}</span></div></div>
      ${offlineCopy ? `<p class="notice info">${t('offlineCopy')}</p>` : ''}
      <div class="pcard"><h2>${t('medInfo')}</h2>
        <dl class="med">
          <dt>${icon('alert')}${t('allergies')}</dt><dd>${val('allergies')}${chip(sh.allergies)}</dd>
          <dt>${icon('heart')}${t('conditions')}</dt><dd>${val('conditions')}${chip(sh.conditions)}</dd>
          <dt>${icon('pill')}${t('medications')}</dt><dd>${val('medications')}${chip(sh.medications)}</dd>
          <dt>${icon('drop')}${t('bloodGroup')}</dt><dd>${val('blood')}${chip(sh.blood)}</dd>
        </dl></div>
      <div class="pcard"><h2>${t('contact')}</h2>
        ${p.contactPhone
          ? `<a class="contact" href="tel:${esc(String(p.contactPhone).replace(/\s/g, ''))}">${icon('phone')}<span>${esc(p.contactName || '')} ${esc(p.contactPhone)}</span></a>`
          : `<em class="none">${t('noInfo')}</em>`}
        ${chip(sh.contactPhone)}</div>
      ${qrCard(p, offlineCopy)}
      <div class="pcard"><h2>${t('account')}</h2>
        <p class="meta">${t('signedInAs')} <strong>${esc(email || '')}</strong></p>
        ${langButtons()}
        ${adm ? `<a class="secbtn" href="#/admin">${t('adminLink')}</a>` : ''}
        <button type="button" class="secbtn" data-action="signout">${t('signOut')}</button></div>`;
  }

  async function profileView() {
    // Firebase could not load (no internet): show offline copy if we have one
    if (fbState === 'failed') {
      const c = cacheGet();
      if (c && c.profile) { viewProfile = c.profile; return profileCards(c.profile, c.email, true); }
      return `<p class="notice info">${t('needInternet')}</p>` + (await sampleBlock());
    }
    if (fbState === 'loading' || user === undefined) return `<p class="empty">${t('loading')}</p>`;

    if (!user) return authCard() + (await sampleBlock());

    let p = null, offline = false;
    try {
      p = await window.FB.getProfile(user.uid);
      if (p) cacheSet(user.uid, user.email, p);
    } catch (e) {
      const c = cacheGet();
      if (c && c.uid === user.uid) { p = c.profile; offline = true; }
    }
    if (!p) {
      return `
        <div class="pcard"><h2>${t('createProfileTitle')}</h2>
          <p class="meta">${t('createProfileText')}</p>
          <a class="bigbtn link" href="#/profile-edit">${t('createProfileBtn')}</a></div>
        <div class="pcard"><h2>${t('account')}</h2>
          <p class="meta">${t('signedInAs')} <strong>${esc(user.email || '')}</strong></p>
          ${langButtons()}
          ${await isAdmin(user.uid) ? `<a class="secbtn" href="#/admin">${t('adminLink')}</a>` : ''}
          <button type="button" class="secbtn" data-action="signout">${t('signOut')}</button></div>`;
    }
    viewProfile = p;
    return profileCards(p, user.email, offline, await isAdmin(user.uid));
  }

  async function profileEditView() {
    if (fbState !== 'ready' || user === undefined) return `<p class="empty">${t(fbState === 'failed' ? 'needInternet' : 'loading')}</p>`;
    if (!user) { location.hash = '#/profile'; return ''; }
    let p = null;
    try { p = await window.FB.getProfile(user.uid); } catch (e) { const c = cacheGet(); if (c && c.uid === user.uid) p = c.profile; }
    const has = !!p;
    p = p || {};
    editToken = p.qrToken || null;
    const sh = p.share || {};
    const control = (f) => {
      const v = p[f.k] != null ? p[f.k] : '';
      const id = 'f_' + f.k;
      if (f.type === 'select')
        return `<select id="${id}" name="${f.k}">${BLOODS.map((b) => `<option value="${b}" ${b === v ? 'selected' : ''}>${b || t('bloodSelect')}</option>`).join('')}</select>`;
      if (f.type === 'textarea') return `<textarea id="${id}" name="${f.k}" rows="2" maxlength="${f.max}">${esc(v)}</textarea>`;
      if (f.type === 'number') return `<input id="${id}" name="${f.k}" type="number" inputmode="numeric" min="0" max="120" value="${esc(v)}">`;
      return `<input id="${id}" name="${f.k}" type="${f.type}" maxlength="${f.max}" value="${esc(v)}" ${f.type === 'tel' ? 'inputmode="tel"' : ''}>`;
    };
    return `
      <form data-pform novalidate>
        ${FIELDS.map((f) => `
          <div class="fld"><label for="f_${f.k}">${t(f.label)}</label>${control(f)}
            <label class="shr"><input type="checkbox" name="s_${f.k}" ${has ? (sh[f.k] ? 'checked' : '') : 'checked'}><span>${t('shareWith')}</span></label>
          </div>`).join('')}
        <label class="shr consent"><input type="checkbox" name="consent" ${has ? 'checked' : ''}><span>${t('consentText')}</span></label>
        <p id="perr" class="err" role="alert" hidden></p>
        <button class="bigbtn" type="submit">${t('save')}</button>
        <a class="secbtn" href="#/profile">${t('cancel')}</a>
      </form>`;
  }

  /* ---------- wristband QR code, emergency page, scanner ---------- */
  const routeName = () => location.hash.replace(/^#\/?/, '').split('/')[0] || 'home';
  const baseUrl = () => location.origin + location.pathname.replace(/index\.html$/, '');
  const emergencyUrl = (tok) => baseUrl() + '#/e/' + tok;
  const tokenFrom = (s) => { const m = /#\/e\/([A-Za-z0-9_-]{16,64})/.exec(s || ''); return m ? m[1] : null; };
  const newToken = () => {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  // Only the details the person switched on go into the public page.
  const publicFrom = (p) => {
    const o = {};
    FIELDS.forEach((f) => { if (p.share && p.share[f.k] && p[f.k] !== '' && p[f.k] != null) o[f.k] = p[f.k]; });
    return o;
  };

  function qrSvg(text) {
    const m = QR.encode(text), n = m.length, q = 4, s = n + 2 * q;
    let d = '';
    m.forEach((row, y) => row.forEach((c, x) => { if (c) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z'; }));
    return `<svg class="qrsvg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${s}" height="${s}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  function downloadQr(url) {
    const m = QR.encode(url), n = m.length, q = 4;
    const cell = Math.max(8, Math.floor(640 / (n + 2 * q))), side = (n + 2 * q) * cell;
    const c = document.createElement('canvas');
    c.width = side; c.height = side + 150;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#000';
    m.forEach((row, y) => row.forEach((v, x) => { if (v) g.fillRect((x + q) * cell, (y + q) * cell, cell, cell); }));
    g.textAlign = 'center';
    g.fillStyle = '#0E2A80'; g.font = 'bold 44px sans-serif'; g.fillText('FATAL LINKS', side / 2, side + 55);
    g.fillStyle = '#333'; g.font = '28px sans-serif'; g.fillText('Scan for emergency info', side / 2, side + 105);
    c.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fatal-links-wristband-qr.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  }

  function printSheet(url) {
    const label = `<div class="plabel">${qrSvg(url)}<strong>FATAL LINKS</strong><span>Scan for emergency info</span></div>`;
    $('printsheet').innerHTML = label.repeat(6);
    window.print();
  }

  function qrCard(p, offline) {
    const tok = p.qrToken;
    if (!tok) {
      if (offline) return '';
      return `<div class="pcard"><h2>${t('qrTitle')}</h2><p class="meta">${t('qrIntro')}</p>
        <button type="button" class="bigbtn" data-action="qrgen">${icon('qr')}<span>${t('genQR')}</span></button></div>`;
    }
    return `<div class="pcard qrcard"><h2>${t('qrTitle')}</h2>
      <div class="qrbox">${qrSvg(emergencyUrl(tok))}</div>
      <p class="meta center">${t('qrHelp')}</p>
      <button type="button" class="bigbtn" data-action="qrdl">${icon('download')}<span>${t('qrDownload')}</span></button>
      <button type="button" class="secbtn" data-action="qrprint">${t('qrPrint')}</button>
      <a class="secbtn" href="#/e/${esc(tok)}">${t('qrPreview')}</a>
      ${offline ? '' : `<button type="button" class="secbtn" data-action="qrnew">${t('qrNew')}</button>
      <button type="button" class="linkbtn" data-action="qroff">${t('qrOff')}</button>`}
      <p class="hint">${t('qrEditHint')}</p></div>`;
  }

  async function qrAction(a) {
    if (!viewProfile || !user || !window.FB) return;
    try {
      if (a === 'qrgen' || a === 'qrnew') {
        if (a === 'qrnew' && !confirm(t('qrNewConfirm'))) return;
        const tok = newToken();
        await window.FB.publishQr(user.uid, tok, viewProfile.qrToken || null, publicFrom(viewProfile));
        viewProfile.qrToken = tok;
      } else if (a === 'qroff') {
        if (!confirm(t('qrOffConfirm'))) return;
        await window.FB.disableQr(user.uid, viewProfile.qrToken || null);
        viewProfile.qrToken = null;
      }
      cacheSet(user.uid, user.email, viewProfile);
      render();
    } catch (e) { alert(t('saveFail')); }
  }

  async function emergencyView(token) {
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(token || '')) return inactiveView();
    if (fbState === 'loading') return `<p class="empty">${t('loading')}</p>`;
    if (fbState === 'failed' || !window.FB) return `<p class="notice info">${t('needInternet')}</p>${sosBar()}`;
    let d;
    try { d = await window.FB.getPublic(token); } catch (e) { return `<p class="notice info">${t('needInternet')}</p>${sosBar()}`; }
    if (!d) return inactiveView();
    const row = (ic, label, v, cls) => v ? `<div class="pcard ${cls || ''}"><h2>${icon(ic)}${t(label)}</h2><p class="big-v">${esc(v)}</p></div>` : '';
    const any = ['age', 'blood', 'allergies', 'conditions', 'medications', 'contactPhone'].some((k) => d[k] !== undefined && d[k] !== '');
    let when = '';
    try { if (d.updatedAt && d.updatedAt.toDate) when = d.updatedAt.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) {}
    return `
      <p class="notice">${t('emgNote')}</p>
      ${sosBar()}
      <div class="pcard head"><span class="avatar">${esc(initials(d.name))}</span>
        <div><strong class="pname">${esc(d.name || '')}</strong>
        ${d.age != null && d.age !== '' ? `<span class="pmeta">${esc(d.age)}</span>` : ''}
        ${d.blood ? `<span class="blood">${icon('drop')}${esc(d.blood)}</span>` : ''}</div></div>
      ${any ? '' : `<p class="empty">${t('emgNone')}</p>`}
      ${row('alert', 'allergies', d.allergies, 'danger')}
      ${row('heart', 'conditions', d.conditions)}
      ${row('pill', 'medications', d.medications)}
      ${d.contactPhone ? `<a class="bigbtn callbtn" href="tel:${esc(String(d.contactPhone).replace(/[^+\d]/g, ''))}">${icon('phone')}<span>${t('callContact')} ${esc(d.contactName || '')} ${esc(d.contactPhone)}</span></a>` : ''}
      ${when ? `<p class="source">${t('lastUpdated')} ${when}</p>` : ''}`;
  }

  function inactiveView() {
    return `<div class="ph"><h2>${t('qrInactive')}</h2><p>${t('qrInactiveText')}</p></div>${sosBar()}`;
  }

  /* camera scanner (uses the phone's built-in QR detector where available) */
  function stopScan() {
    if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
    if (scanStream) { scanStream.getTracks().forEach((tr) => tr.stop()); scanStream = null; }
  }

  async function scanView() {
    return `
      <div class="scanbox">
        <div class="frame" id="scanframe"><i></i><i></i><i></i><i></i>
          <video id="scanvideo" playsinline muted hidden></video>${icon('qr', 'scan-ic')}</div>
        <p class="scan-t">${t('scanHint')}</p>
        <button type="button" class="bigbtn light" data-action="scanstart">${icon('qr')}<span>${t('scanStart')}</span></button>
      </div>
      <p id="scanmsg" class="notice info" hidden></p>
      <p class="hint">${t('scanOr')}</p>`;
  }

  async function startScan() {
    const msg = $('scanmsg');
    const show = (m) => { msg.textContent = m; msg.hidden = false; };
    msg.hidden = true;
    if (!('BarcodeDetector' in window)) return show(t('scanNoSupport'));
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return show(t('scanNoCamera'));
    let det;
    try { det = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { return show(t('scanNoSupport')); }
    stopScan();
    try { scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); }
    catch (e) { return show(t('scanDenied')); }
    const v = $('scanvideo');
    v.srcObject = scanStream; v.hidden = false;
    $('scanframe').classList.add('live');
    const pl = v.play(); if (pl && pl.catch) pl.catch(() => {});
    scanTimer = setInterval(async () => {
      try {
        const codes = await det.detect(v);
        for (const c of codes) {
          const tok = tokenFrom(c.rawValue);
          if (tok) { stopScan(); location.hash = '#/e/' + tok; return; }
          show(t('scanNotOurs'));
        }
      } catch (e) {}
    }, 300);
  }

  async function doAuth(f) {
    const err = document.getElementById('autherr');
    const show = (m) => { err.textContent = m; err.className = 'err'; err.hidden = false; };
    err.hidden = true;
    const email = f.elements.email.value.trim(), pw = f.elements.password.value;
    if (!window.FB) return show(t('errNet'));
    if (!email || !pw) return show(t('errFill'));
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    try { if (authMode === 'signup') await window.FB.signUp(email, pw); else await window.FB.signIn(email, pw); }
    catch (ex) { show(authErr(ex)); btn.disabled = false; }
  }

  async function doForgot() {
    const f = document.querySelector('[data-auth]');
    const err = document.getElementById('autherr');
    if (!f || !err) return;
    const em = f.elements.email.value.trim();
    const show = (m, ok) => { err.textContent = m; err.className = ok ? 'err ok' : 'err'; err.hidden = false; };
    if (!em) return show(t('errFillEmail'));
    if (!window.FB) return show(t('errNet'));
    try { await window.FB.reset(em); show(t('resetSent'), true); } catch (ex) { show(authErr(ex)); }
  }

  async function doSaveProfile(f) {
    const err = document.getElementById('perr');
    const show = (m) => { err.textContent = m; err.hidden = false; err.scrollIntoView({ block: 'center' }); };
    err.hidden = true;
    const el = f.elements;
    const data = { share: {} };
    FIELDS.forEach((fl) => { data[fl.k] = (el[fl.k].value || '').trim(); data.share[fl.k] = !!el['s_' + fl.k].checked; });
    if (!data.name) return show(t('nameNeeded'));
    if (data.age === '') data.age = null;
    else { const n = Number(data.age); if (!(n >= 0 && n <= 120)) return show(t('ageBad')); data.age = Math.round(n); }
    if (!el.consent.checked) return show(t('consentNeeded'));
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = t('saving');
    try {
      await window.FB.saveProfile(user.uid, data, editToken, publicFrom(data));
      cacheSet(user.uid, user.email, Object.assign({}, data, { qrToken: editToken }));
      location.hash = '#/profile';
    } catch (ex) {
      show(t('saveFail')); btn.disabled = false; btn.textContent = t('save');
    }
  }

  async function offlineView() {
    const guides = await DataService.getGuides();
    const recs = await OfflineStore.list();
    const live = {}, map = {};
    guides.forEach((g) => { live[g.id] = g; });
    recs.forEach((r) => { map[r.id] = r; });
    const savedRows = recs.map((r) => {
      const g = live[r.id] || r.guide;
      const upd = !!live[r.id] && (live[r.id].rev || 0) > ((r.guide && r.guide.rev) || 0);
      return `<li><div class="row dlrow">
        <span class="thumb">${thumbHtml(g)}</span>
        <a class="tx" href="#/guide/${esc(r.id)}"><strong>${loc(g.title)}</strong>
          <small>${t('downloaded')} &middot; ${fmtSize(r.size || 0)} &middot; ${fmtDate(new Date(r.savedAt).toISOString().slice(0, 10))}</small>
          ${upd ? `<small class="upd-tag">${t('updateAvail')}</small>` : ''}</a>
        ${upd ? `<button type="button" class="dlbtn" data-dl="${esc(r.id)}" aria-label="${t('update')}: ${loc(g.title)}">${icon('download')}</button>` : ''}
        <button type="button" class="dlbtn rm" data-rm="${esc(r.id)}" aria-label="${t('remove')}: ${loc(g.title)}">${icon('trash')}</button>
      </div></li>`;
    });
    const rest = guides.filter((g) => !map[g.id]).map((g) => `<li><div class="row dlrow">
        <span class="thumb">${thumbHtml(g)}</span>
        <a class="tx" href="#/guide/${esc(g.id)}"><strong>${loc(g.title)}</strong><small>${t('download')}</small></a>
        <button type="button" class="dlbtn" data-dl="${esc(g.id)}" aria-label="${t('download')}: ${loc(g.title)}">${icon('download')}</button>
      </div></li>`);
    return `
      <div class="hero-ill small">${ILL.books}</div>
      <p class="offhead">${t('offHead')}</p>
      <h2 class="sec">${t('saved')}</h2>
      ${savedRows.length ? `<ul class="list">${savedRows.join('')}</ul>` : `<p class="empty">${t('nothingSaved')}</p>`}
      ${rest.length ? `<h2 class="sec">${t('available')}</h2><ul class="list">${rest.join('')}</ul>` : ''}
      <p class="notice info">${t('offNote')}</p>`;
  }

  // Saves a guide's text, pictures and Igbo audio on this phone.
  async function downloadGuide(id, btn) {
    const g = await DataService.getGuide(id);
    if (!g) return;
    btn.disabled = true; btn.classList.add('busy');
    try {
      const blobs = [];
      for (const mid of [g.cover].concat(g.stepImgs || []).filter(Boolean)) {
        const d = await DataService.getImage(mid);
        if (!d) throw new Error('image');
        blobs.push({ id: mid, data: d });
      }
      for (const mid of (g.stepAudioIg || []).filter(Boolean)) {
        const d = await DataService.getAudio(mid);
        if (!d) throw new Error('audio');
        blobs.push({ id: mid, data: d });
      }
      await OfflineStore.save(g, blobs);
      app.innerHTML = await offlineView();
    } catch (e) {
      alert(t('dlFail'));
      btn.disabled = false; btn.classList.remove('busy');
    }
  }

  function statusText(which) {
    const st = DataService.status(which);
    if (st.at === null) return t('checking');
    return st.ok ? t('checkedNow') : t('savedCopy') + (st.err ? ' (' + st.err + ')' : '');
  }

  async function updatesView() {
    const ups = await DataService.getUpdates();
    return `
      <p class="lead">${t('updatesIntro')}</p>
      <p class="statusline"><span id="datastatus">${esc(statusText('updates'))}</span>
        <button type="button" class="linkbtn inline" data-action="refreshdata">${t('refresh')}</button></p>
      <ul class="list">
        ${ups.map((u) => `<li class="upd"><small>${fmtDate(u.date)}</small><strong>${loc(u.title)}</strong><p>${loc(u.body)}</p></li>`).join('')}
      </ul>`;
  }

  function notFoundView() {
    return `<div class="ph"><h2>${t('notFound')}</h2><p>${t('notFoundText')}</p><a class="bigbtn link" href="#/">${t('goHome')}</a></div>`;
  }

  /* ---------- read aloud: English = the phone's voice, Igbo = your recorded clips ---------- */
  let audioEl = null, audioQueue = [], speechToken = 0, playingStep = -1;
  const hasIgAudio = (g) => !!(g && g.stepAudioIg && g.stepAudioIg.some(Boolean));

  function highlight(i) {
    document.querySelectorAll('.steps li').forEach((li, k) => li.classList.toggle('playing', k === i));
  }
  function setReadUI() {
    document.querySelectorAll('[data-action="read"]').forEach((b) => {
      b.classList.toggle('on', speaking);
      const sp = b.querySelector('span');
      if (sp) sp.textContent = speaking ? t('stopReading') : t('readAloud');
      const svg = b.querySelector('svg');
      if (svg && b.classList.contains('readbtn')) svg.innerHTML = speaking ? ICONS.stop : ICONS.play;
    });
  }
  function updateReadButtons() {
    const ok = lang === 'en' || hasIgAudio(currentGuide);
    document.querySelectorAll('[data-action="read"]').forEach((b) => { b.disabled = !ok; });
  }
  function stopSpeech() {
    speechToken++;   // ignore late events from anything we just stopped
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioEl) { audioEl.onended = audioEl.onerror = null; audioEl.pause(); audioEl = null; }
    audioQueue = []; speaking = false; playingStep = -1;
    highlight(-1); setReadUI();
  }

  async function nextClip(token) {
    if (token !== speechToken) return;
    if (!audioQueue.length) { stopSpeech(); return; }
    const i = audioQueue.shift();
    const id = currentGuide && currentGuide.stepAudioIg && currentGuide.stepAudioIg[i];
    const src = id ? await DataService.getAudio(id) : null;
    if (token !== speechToken) return;
    if (!src) { nextClip(token); return; }
    highlight(i);
    audioEl = new Audio(src);
    audioEl.onended = () => nextClip(token);
    audioEl.onerror = () => nextClip(token);
    audioEl.play().catch(() => { if (token === speechToken) stopSpeech(); });
  }
  function playClips(indices) {
    stopSpeech();
    if (!indices.length) return;
    audioQueue = indices.slice(); speaking = true; setReadUI();
    nextClip(speechToken);
  }

  function speakEnglish(g, from, to, withTitle) {
    if (!('speechSynthesis' in window)) { alert(t('noSpeech')); return; }
    stopSpeech();
    const token = speechToken, synth = window.speechSynthesis;
    const items = [];
    if (withTitle) items.push({ txt: locRaw(g.title) + '.', i: -1 });
    for (let i = from; i <= to; i++) items.push({ txt: 'Step ' + (i + 1) + '. ' + g.steps.en[i], i });
    items.forEach((it, k) => {
      const u = new SpeechSynthesisUtterance(it.txt);
      u.lang = 'en'; u.rate = 0.95;
      u.onstart = () => { if (token === speechToken) highlight(it.i); };
      if (k === items.length - 1) u.onend = u.onerror = () => { if (token === speechToken) stopSpeech(); };
      synth.speak(u);
    });
    speaking = true; setReadUI();
  }

  function readGuide() {
    const g = currentGuide;
    if (!g) return;
    if (speaking) { stopSpeech(); return; }
    if (lang !== 'en') {
      const idx = [];
      (g.stepAudioIg || []).forEach((id, i) => { if (id) idx.push(i); });
      playClips(idx);
    } else speakEnglish(g, 0, g.steps.en.length - 1, true);
  }
  function playStep(i) {
    const g = currentGuide;
    if (!g) return;
    if (speaking && playingStep === i) { stopSpeech(); return; }
    if (lang !== 'en') playClips([i]); else speakEnglish(g, i, i, false);
    playingStep = i;
  }

  /* ---------- pictures + latest update fill-in after a page is drawn ---------- */
  function hydrate() {
    document.querySelectorAll('img[data-img]').forEach(async (el) => {
      const d = await DataService.getImage(el.getAttribute('data-img'));
      if (d) el.src = d; else el.remove();
    });
    document.querySelectorAll('[data-hero]').forEach(async (el) => {
      const d = await DataService.getImage(el.getAttribute('data-hero'));
      if (d) el.innerHTML = `<img class="heroimg" src="${d}" alt="">`;
    });
    if (document.getElementById('uptitle')) {
      DataService.getUpdates().then((ups) => {
        const el = document.getElementById('uptitle');
        if (el && ups[0]) el.textContent = locRaw(ups[0].title);
      });
    }
  }

  /* ---------- admin pages (code loads only when opened) ---------- */
  const adminCache = {};
  async function isAdmin(uid) {
    if (adminCache[uid]) return true;   // only a "yes" is remembered, so setting up admin works without reloading
    try { const ok = await window.FB.isAdmin(uid); if (ok) adminCache[uid] = true; return ok; } catch (e) { return false; }
  }
  let adminLoading = null;
  function loadAdmin() {
    if (window.FLAdmin) return Promise.resolve();
    if (!adminLoading) {
      adminLoading = new Promise((res, rej) => {
        const el = document.createElement('script');
        el.src = 'admin.js'; el.onload = res;
        el.onerror = () => { adminLoading = null; rej(new Error('admin.js')); };
        document.head.appendChild(el);
      });
    }
    return adminLoading;
  }
  async function adminView(parts) {
    try { await loadAdmin(); } catch (e) { return `<p class="notice info">${t('needInternet')}</p>`; }
    return window.FLAdmin.entry(parts);
  }

  /* ---------- router ---------- */
  async function render() {
    stopSpeech();
    stopScan();
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
      case 'e': html = await emergencyView(arg); break;
      case 'admin': html = await adminView(parts.slice(1)); break;
      case 'profile':
      case 'emergency-profile': html = await profileView(); break;
      case 'profile-edit': html = await profileEditView(); break;
      case 'offline': html = await offlineView(); break;
      case 'updates': html = await updatesView(); break;
      default: html = notFoundView();
    }
    app.innerHTML = html;
    app.className = 'main ' + name;
    hydrate();
    if (name === 'guide') updateReadButtons();
    if (['home', 'library', 'search', 'updates', 'offline'].includes(name)) DataService.refreshSoon();
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
      else if (a === 'playstep') playStep(Number(act.getAttribute('data-i')));
      else if (a === 'refreshdata') {
        const el = document.getElementById('datastatus');
        if (el) el.textContent = t('checking');
        DataService.refreshNow();
      }
      else if (a === 'authmode') { authMode = act.getAttribute('data-mode'); render(); }
      else if (a === 'forgot') doForgot();
      else if (a === 'scanstart') startScan();
      else if (a === 'qrgen' || a === 'qrnew' || a === 'qroff') qrAction(a);
      else if (a === 'qrdl' && viewProfile && viewProfile.qrToken) downloadQr(emergencyUrl(viewProfile.qrToken));
      else if (a === 'qrprint' && viewProfile && viewProfile.qrToken) printSheet(emergencyUrl(viewProfile.qrToken));
      else if (a === 'signout') { if (window.FB) await window.FB.signOut(); else { try { localStorage.removeItem('fl_pcache'); } catch (e) {} render(); } }
      else if (a === 'install' && installEvent) {
        installEvent.prompt();
        installEvent.userChoice.finally(() => { installEvent = null; closeDrawer(); });
      }
      return;
    }
    const dl = e.target.closest('[data-dl]');
    if (dl) { await downloadGuide(dl.getAttribute('data-dl'), dl); return; }
    const rm = e.target.closest('[data-rm]');
    if (rm && confirm(t('removeConfirm'))) {
      await OfflineStore.remove(rm.getAttribute('data-rm'));
      app.innerHTML = await offlineView();
    }
  });

  document.addEventListener('submit', async (e) => {
    const f = e.target;
    if (f.matches('[data-search]')) {
      e.preventDefault();
      const q = f.querySelector('input').value.trim();
      location.hash = q ? '#/search/' + encodeURIComponent(q) : '#/library';
    } else if (f.matches('[data-auth]')) { e.preventDefault(); doAuth(f); }
    else if (f.matches('[data-pform]')) { e.preventDefault(); doSaveProfile(f); }
  });

  // live filtering while typing on the guides page
  document.addEventListener('input', async (e) => {
    if (e.target.id !== 'libq') return;
    const guides = await DataService.getGuides();
    const box = document.getElementById('glist');
    if (box) box.innerHTML = guideRows(guides, e.target.value.trim());
  });

  const PROFILE_ROUTES = ['profile', 'emergency-profile', 'profile-edit', 'admin'];
  function startFirebase() {
    fbState = 'ready';
    window.FB.onAuth((u) => {
      user = u || null;
      if (!u) { try { localStorage.removeItem('fl_pcache'); } catch (e) {} }
      if (PROFILE_ROUTES.includes(routeName())) render();
    });
    if (routeName() === 'e' || routeName() === 'admin') render();
  }
  window.addEventListener('fl-status', () => {
    const el = document.getElementById('datastatus');
    if (el) el.textContent = statusText('updates');
  });
  window.addEventListener('fl-data', () => {
    const a = document.activeElement;
    if (['home', 'library', 'search', 'offline', 'updates'].includes(routeName()) && !(a && /INPUT|TEXTAREA/.test(a.tagName))) render();
  });
  window.FL = { esc, icon, t, loc, locRaw, user: () => user, fbState: () => fbState, isAdmin, rerender: () => render() };
  window.addEventListener('fb-ready', startFirebase);
  window.addEventListener('fb-failed', () => { fbState = 'failed'; if (PROFILE_ROUTES.concat('e').includes(routeName())) render(); });
  if (window.FB) startFirebase();

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
