// Private admin pages (loaded only when you open #/admin).
// What you can do here: add/edit/delete guides, step pictures and latest updates.
// Only accounts listed in Firebase under "admins" can save changes (the security rules enforce this).
(function () {
  'use strict';
  if (window.FLAdmin) return;   // never set up twice
  const FL = window.FL, esc = FL.esc, icon = FL.icon;
  const $ = (id) => document.getElementById(id);
  const FB = () => window.FB;
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const newId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
  const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'item';
  const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

  let draft = null, kind = null;
  const previews = {}; // pictures held in memory while editing

  const back = (href, label) => `<a class="back" href="${href}">${icon('back')}${label}</a>`;
  const showErr = (m) => { const e = $('aderr'); if (e) { e.textContent = m; e.hidden = false; e.scrollIntoView({ block: 'center' }); } else alert(m); };

  /* ---------- who may enter ---------- */
  async function gate() {
    if (FL.fbState() === 'loading') return '<p class="empty">Loading...</p>';
    if (FL.fbState() === 'failed') return '<p class="notice info">The admin pages need an internet connection.</p>';
    const u = FL.user();
    if (u === undefined) return '<p class="empty">Loading...</p>';
    if (!u) return `<div class="pcard"><h2>Sign in first</h2><p class="meta">Sign in on the Profile tab, then come back here.</p><a class="bigbtn link" href="#/profile">Go to Profile</a></div>`;
    let ok = false;
    try { ok = await FL.isAdmin(u.uid); } catch (e) {}
    if (ok) return null;
    return `
      <div class="pcard"><h2>This account is not an admin yet</h2>
        <p class="meta">One-time setup in Firebase:</p>
        <ol class="howto">
          <li>Open Firebase &rarr; <strong>Databases &amp; Storage &rarr; Firestore</strong> &rarr; <strong>Start collection</strong>.</li>
          <li>Collection ID: <strong>admins</strong></li>
          <li>Document ID: paste your user ID (below).</li>
          <li>Add one field: name <strong>role</strong>, type string, value <strong>admin</strong>. Tap Save.</li>
          <li>Come back here and reload the page.</li>
        </ol>
        <p class="meta">Your user ID:</p>
        <p class="uid" id="myuid">${esc(u.uid)}</p>
        <button type="button" class="secbtn" data-ad="copyuid">Copy user ID</button>
      </div>`;
  }

  /* ---------- dashboard + lists ---------- */
  async function dash() {
    let g = [], u = [];
    try { [g, u] = await Promise.all([FB().listGuides(), FB().listUpdates()]); } catch (e) {}
    return `
      <div class="pcard"><h2>Content manager</h2>
        <p class="meta">You are signed in as admin. Changes appear on every phone.</p>
        <a class="bigbtn link" href="#/admin/guides">Guides (${g.length})</a>
        <a class="secbtn" href="#/admin/updates">Latest updates (${u.length})</a>
        ${g.length === 0 ? `<button type="button" class="secbtn" data-ad="seed">Add the sample guides and updates</button>
        <p class="hint">Starts you with the 5 sample guides, so you can edit them instead of typing from scratch.</p>` : ''}
      </div>`;
  }

  async function guidesList() {
    let g = [];
    try { g = await FB().listGuides(); } catch (e) { return '<p class="notice info">Could not load. Check your internet.</p>'; }
    g.sort((a, b) => (a.order || 0) - (b.order || 0));
    return `${back('#/admin', 'Content manager')}
      <h2 class="sec">Guides</h2>
      <a class="bigbtn link" href="#/admin/guide/new">+ Add new guide</a>
      <ul class="list" style="margin-top:12px">${g.map((x) => `
        <li><a class="row" href="#/admin/guide/${esc(x.id)}"><span class="tx"><strong>${esc((x.title && x.title.en) || x.id)}</strong>
        <small>Order ${esc(x.order || 0)} &middot; Updated ${esc(x.updated || '')}</small></span>${icon('chevron')}</a></li>`).join('')}</ul>`;
  }

  async function updatesList() {
    let u = [];
    try { u = await FB().listUpdates(); } catch (e) { return '<p class="notice info">Could not load. Check your internet.</p>'; }
    u.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return `${back('#/admin', 'Content manager')}
      <h2 class="sec">Latest updates</h2>
      <a class="bigbtn link" href="#/admin/update/new">+ Add new update</a>
      <ul class="list" style="margin-top:12px">${u.map((x) => `
        <li><a class="row" href="#/admin/update/${esc(x.id)}"><span class="tx"><strong>${esc((x.title && x.title.en) || x.id)}</strong>
        <small>${esc(x.date || '')}</small></span>${icon('chevron')}</a></li>`).join('')}</ul>`;
  }

  /* ---------- small form helpers ---------- */
  const field = (name, label, val, o) => {
    o = o || {};
    return `<div class="fld"><label for="ad_${name}">${label}</label>${o.area
      ? `<textarea id="ad_${name}" name="${name}" rows="${o.rows || 3}">${esc(val)}</textarea>`
      : `<input id="ad_${name}" name="${name}" type="${o.type || 'text'}" value="${esc(val)}">`}</div>`;
  };
  const pair = (name, label, v, o) => field(name + '_en', label + ' (English)', v.en, o) + field(name + '_ig', label + ' (Igbo, optional)', v.ig, o);

  const imgBox = (which, i, id) => `
    <div class="imgwrap">
      <label class="imgbox ${id ? 'has' : ''}">
        ${id ? `<img data-prev="${esc(id)}" alt="Picture preview">` : '<span class="plus">+</span><span>Tap to add a picture</span>'}
        <input class="vh" type="file" accept="image/*" data-ad-file="${which}:${i}">
      </label>
      ${id ? `<button type="button" class="linkbtn" data-ad="rmimg" data-which="${which}" data-i="${i}">Remove picture</button>` : ''}
    </div>`;

  const audioBox = (i, id) => `
    <div class="audiobox">
      <strong>Igbo audio (optional)</strong>
      ${id ? `<audio controls preload="none" data-aprev="${esc(id)}"></audio>
        <button type="button" class="linkbtn" data-ad="rmaudio" data-i="${i}">Remove audio</button>` : '<p class="meta">No audio yet. Record it here or choose a sound file.</p>'}
      <div class="arow">
        <button type="button" class="secbtn rec" data-ad="rec" data-i="${i}">${icon('mic')}<span>Record</span></button>
        <label class="secbtn filebtn">Choose file<input class="vh" type="file" accept="audio/*" data-ad-audio="${i}"></label>
      </div>
    </div>`;

  /* ---------- guide editor ---------- */
  const emptyGuide = (order) => ({
    __id: 'new', order, title: { en: '', ig: '' }, sub: { en: '', ig: '' }, summary: { en: '', ig: '' },
    cover: null, thumb: null, ill: null, steps: [{ text: { en: '', ig: '' }, img: null, audio: null }],
    callIf: { en: '', ig: '' }, dont: { en: '', ig: '' }
  });
  const fromDoc = (id, d) => ({
    __id: id, order: d.order || 0,
    title: { en: (d.title && d.title.en) || '', ig: (d.title && d.title.ig) || '' },
    sub: { en: (d.sub && d.sub.en) || '', ig: (d.sub && d.sub.ig) || '' },
    summary: { en: (d.summary && d.summary.en) || '', ig: (d.summary && d.summary.ig) || '' },
    cover: d.cover || null, thumb: d.thumb || null, ill: d.ill || null,
    steps: (d.steps && d.steps.length ? d.steps : [{}]).map((s) => ({ text: { en: (s.text && s.text.en) || '', ig: (s.text && s.text.ig) || '' }, img: s.img || null, audio: (s.audio && s.audio.ig) || null })),
    callIf: { en: ((d.callIf && d.callIf.en) || []).join('\n'), ig: ((d.callIf && d.callIf.ig) || []).join('\n') },
    dont: { en: ((d.dont && d.dont.en) || []).join('\n'), ig: ((d.dont && d.dont.ig) || []).join('\n') }
  });

  async function guideEditor(id) {
    if (!draft || kind !== 'guide' || draft.__id !== id) {
      let list = [];
      try { list = await FB().listGuides(); } catch (e) { return '<p class="notice info">Could not load. Check your internet.</p>'; }
      if (id === 'new') draft = emptyGuide(list.length + 1);
      else {
        const d = list.find((x) => x.id === id);
        if (!d) return '<div class="ph"><h2>Guide not found</h2></div>' + back('#/admin/guides', 'Guides');
        draft = fromDoc(id, d);
      }
      kind = 'guide';
    }
    return guideForm();
  }

  function guideForm() {
    const d = draft;
    return `${back('#/admin/guides', 'Guides')}
      <form id="adform" data-adform="guide" novalidate>
        <div class="pcard"><h2>${d.__id === 'new' ? 'New guide' : 'Edit guide'}</h2>
          ${pair('title', 'Title', d.title)}
          ${pair('sub', 'Short label', d.sub)}
          ${pair('summary', 'Summary', d.summary, { area: true, rows: 3 })}
          ${field('order', 'Position in the list (1 = first)', d.order, { type: 'number' })}
        </div>
        <div class="pcard"><h2>Cover picture</h2>${imgBox('cover', 0, d.cover)}</div>
        <div class="pcard"><h2>Steps</h2>
          ${d.steps.map((s, i) => `
            <div class="stepcard">
              <div class="steptop"><strong>Step ${i + 1}</strong><span>
                <button type="button" class="mini" data-ad="up" data-i="${i}" aria-label="Move step up" ${i === 0 ? 'disabled' : ''}>&uarr;</button>
                <button type="button" class="mini" data-ad="down" data-i="${i}" aria-label="Move step down" ${i === d.steps.length - 1 ? 'disabled' : ''}>&darr;</button>
                <button type="button" class="mini del" data-ad="delstep" data-i="${i}" aria-label="Delete step">&times;</button></span></div>
              ${imgBox('step', i, s.img)}
              ${field('step_en_' + i, 'Text (English)', s.text.en, { area: true, rows: 3 })}
              ${field('step_ig_' + i, 'Text (Igbo, optional)', s.text.ig, { area: true, rows: 3 })}
              ${audioBox(i, s.audio)}
            </div>`).join('')}
          <button type="button" class="secbtn" data-ad="addstep">+ Add step</button>
        </div>
        <div class="pcard"><h2>Call 112 if...</h2><p class="meta">One item per line.</p>${pair('callIf', 'Items', d.callIf, { area: true, rows: 4 })}</div>
        <div class="pcard"><h2>Avoid</h2><p class="meta">One item per line.</p>${pair('dont', 'Items', d.dont, { area: true, rows: 4 })}</div>
        <p id="aderr" class="err" role="alert" hidden></p>
        <button class="bigbtn" type="submit">Save guide</button>
        ${d.__id !== 'new' ? '<button type="button" class="secbtn danger" data-ad="delguide">Delete this guide</button>' : ''}
      </form>`;
  }

  // read everything typed in the form back into "draft"
  function collect() {
    const f = $('adform');
    if (!f || !draft) return;
    const v = (n) => (f.elements[n] ? f.elements[n].value : '');
    if (kind === 'guide') {
      ['title', 'sub', 'summary'].forEach((k) => { draft[k] = { en: v(k + '_en').trim(), ig: v(k + '_ig').trim() }; });
      ['callIf', 'dont'].forEach((k) => { draft[k] = { en: v(k + '_en'), ig: v(k + '_ig') }; });
      draft.order = Number(v('order')) || 0;
      draft.steps.forEach((s, i) => { s.text = { en: v('step_en_' + i), ig: v('step_ig_' + i) }; });
    } else if (kind === 'update') {
      draft.date = v('date') || todayISO();
      draft.title = { en: v('title_en').trim(), ig: v('title_ig').trim() };
      draft.body = { en: v('body_en').trim(), ig: v('body_ig').trim() };
    }
  }

  async function hydratePreviews() {
    document.querySelectorAll('audio[data-aprev]').forEach(async (el) => {
      const id = el.getAttribute('data-aprev');
      const src = previews[id] || (await DataService.getAudio(id));
      if (src) el.src = src;
    });
    document.querySelectorAll('img[data-prev]').forEach(async (el) => {
      const id = el.getAttribute('data-prev');
      const src = previews[id] || (await DataService.getImage(id));
      if (src) el.src = src; else el.alt = 'Picture could not be loaded';
    });
  }
  function rerender() {
    const y = window.scrollY;
    $('app').innerHTML = kind === 'guide' ? guideForm() : updateForm();
    hydratePreviews();
    window.scrollTo(0, y);
  }

  /* ---------- pictures: pick from the gallery, shrink, store ---------- */
  async function shrink(file, max, q) {
    if (!file.type || file.type.indexOf('image/') !== 0) throw new Error('not an image');
    let bmp;
    try { bmp = await createImageBitmap(file); }
    catch (e) { bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }); }
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    const sc = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc));
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bmp, 0, 0, c.width, c.height);
    let qq = q, out = c.toDataURL('image/jpeg', qq);
    while (out.length > 200000 && qq > 0.4) { qq -= 0.1; out = c.toDataURL('image/jpeg', qq); }
    return out;
  }

  async function onFile(inp) {
    const [which, i] = inp.getAttribute('data-ad-file').split(':');
    const file = inp.files && inp.files[0];
    if (!file) return;
    collect();
    const box = inp.closest('.imgbox');
    if (box) box.classList.add('busy');
    try {
      const data = await shrink(file, 800, 0.7);
      const id = newId();
      await FB().saveImage(id, data);
      previews[id] = data;
      if (which === 'cover') { draft.cover = id; draft.thumb = await shrink(file, 220, 0.6); }
      else draft.steps[Number(i)].img = id;
      rerender();
    } catch (e) {
      if (box) box.classList.remove('busy');
      showErr('Could not add the picture. Choose a photo and check your internet.');
    }
  }

  /* ---------- Igbo audio: record with the microphone or choose a file ---------- */
  let rec = null;
  const toDataUrl = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  const clock = (sec) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');

  async function saveClip(i, blob) {
    collect();
    let data;
    try { data = await toDataUrl(blob); } catch (e) { return showErr('Could not read that audio.'); }
    if (data.length > 600000) return showErr('That clip is too long. Keep each clip under about 30 seconds.');
    const id = newId();
    try { await FB().saveAudio(id, data); } catch (e) { return showErr('Could not save the audio. Check your internet and that the new rules are published.'); }
    previews[id] = data;
    draft.steps[i].audio = id;
    rerender();
  }

  async function toggleRecord(i, btn) {
    if (rec) { stopRecording(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) return showErr('Recording is not supported in this browser. Use "Choose file" instead.');
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { return showErr('Microphone permission was denied. Allow the microphone and try again.'); }
    let mr;
    try { mr = new MediaRecorder(stream, { audioBitsPerSecond: 32000 }); } catch (e) { mr = new MediaRecorder(stream); }
    const chunks = [];
    mr.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    const label = btn.querySelector('span');
    rec = { mr, stream, started: Date.now(), timer: null };
    mr.onstop = async () => {
      clearInterval(rec && rec.timer);
      stream.getTracks().forEach((t) => t.stop());
      rec = null;
      if (chunks.length) await saveClip(i, new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
    };
    mr.start();
    label.textContent = 'Stop (0:00)';
    rec.timer = setInterval(() => {
      const sec = Math.round((Date.now() - rec.started) / 1000);
      label.textContent = 'Stop (' + clock(sec) + ')';
      if (sec >= 30) stopRecording();   // keep clips short
    }, 500);
  }
  function stopRecording() { if (rec && rec.mr.state !== 'inactive') rec.mr.stop(); }

  /* ---------- saving ---------- */
  async function saveGuide() {
    collect();
    const d = draft;
    if (!d.title.en) return showErr('Please enter the English title.');
    const steps = d.steps.filter((s) => s.text.en.trim());
    if (!steps.length) return showErr('Add at least one step with English text.');
    const id = d.__id === 'new' ? slug(d.title.en) + '-' + Math.random().toString(36).slice(2, 6) : d.__id;
    const doc = {
      order: d.order, title: d.title, sub: d.sub, summary: d.summary, updated: todayISO(),
      cover: d.cover || null, thumb: d.thumb || null, ill: d.ill || null,
      steps: steps.map((s) => ({ text: { en: s.text.en.trim(), ig: s.text.ig.trim() }, img: s.img || null, audio: { ig: s.audio || null } })),
      rev: Date.now(),
      callIf: { en: lines(d.callIf.en), ig: lines(d.callIf.ig) },
      dont: { en: lines(d.dont.en), ig: lines(d.dont.ig) }
    };
    const btn = document.querySelector('#adform button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    try {
      await FB().saveGuide(id, doc);
      DataService.invalidate();
      draft = null;
      location.hash = '#/admin/guides';
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Save guide'; }
      showErr('Could not save. Check your internet and that this account is an admin.');
    }
  }

  async function deleteGuide() {
    if (!draft || draft.__id === 'new' || !confirm('Delete this guide for everyone? This cannot be undone.')) return;
    try {
      const ids = [draft.cover].concat(draft.steps.map((s) => s.img)).filter(Boolean);
      const auds = draft.steps.map((s) => s.audio).filter(Boolean);
      await FB().deleteGuide(draft.__id);
      ids.forEach((i) => FB().deleteImage(i).catch(() => {}));
      auds.forEach((i) => FB().deleteAudio(i).catch(() => {}));
      DataService.invalidate();
      draft = null;
      location.hash = '#/admin/guides';
    } catch (e) { showErr('Could not delete. Check your internet.'); }
  }

  /* ---------- update editor ---------- */
  async function updateEditor(id) {
    if (!draft || kind !== 'update' || draft.__id !== id) {
      if (id === 'new') draft = { __id: 'new', date: todayISO(), title: { en: '', ig: '' }, body: { en: '', ig: '' } };
      else {
        let list = [];
        try { list = await FB().listUpdates(); } catch (e) { return '<p class="notice info">Could not load. Check your internet.</p>'; }
        const d = list.find((x) => x.id === id);
        if (!d) return '<div class="ph"><h2>Update not found</h2></div>' + back('#/admin/updates', 'Updates');
        draft = { __id: id, date: d.date || todayISO(), title: { en: (d.title && d.title.en) || '', ig: (d.title && d.title.ig) || '' }, body: { en: (d.body && d.body.en) || '', ig: (d.body && d.body.ig) || '' } };
      }
      kind = 'update';
    }
    return updateForm();
  }
  function updateForm() {
    const d = draft;
    return `${back('#/admin/updates', 'Updates')}
      <form id="adform" data-adform="update" novalidate>
        <div class="pcard"><h2>${d.__id === 'new' ? 'New update' : 'Edit update'}</h2>
          ${field('date', 'Date', d.date, { type: 'date' })}
          ${pair('title', 'Title', d.title)}
          ${pair('body', 'Text', d.body, { area: true, rows: 4 })}
        </div>
        <p id="aderr" class="err" role="alert" hidden></p>
        <button class="bigbtn" type="submit">Save update</button>
        ${d.__id !== 'new' ? '<button type="button" class="secbtn danger" data-ad="delupdate">Delete this update</button>' : ''}
      </form>`;
  }
  async function saveUpdate() {
    collect();
    const d = draft;
    if (!d.title.en) return showErr('Please enter the English title.');
    const id = d.__id === 'new' ? d.date + '-' + Math.random().toString(36).slice(2, 6) : d.__id;
    try {
      await FB().saveUpdate(id, { date: d.date, title: d.title, body: d.body });
      DataService.invalidate();
      draft = null;
      location.hash = '#/admin/updates';
    } catch (e) { showErr('Could not save. Check your internet and that this account is an admin.'); }
  }

  /* ---------- sample content ---------- */
  async function seed() {
    if (!confirm('Add the 5 sample guides and 3 sample updates?')) return;
    const guides = SAMPLE_GUIDES.map((g, i) => [g.id, {
      order: i + 1, title: g.title, sub: g.sub, summary: g.summary, updated: g.updated, cover: null, thumb: null, ill: g.ill,
      steps: g.steps.en.map((t) => ({ text: { en: t, ig: '' }, img: null })),
      callIf: { en: g.callIf.en, ig: [] }, dont: { en: g.dont.en, ig: [] }
    }]);
    const ups = SAMPLE_UPDATES.map((u) => [u.id, { date: u.date, title: u.title, body: u.body }]);
    try { await FB().seed(guides, ups); DataService.invalidate(); FL.rerender(); }
    catch (e) { alert('Could not add the samples. Check your internet and that this account is an admin.'); }
  }

  /* ---------- events (set up once) ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ad]');
    if (!b) return;
    const a = b.getAttribute('data-ad'), i = Number(b.getAttribute('data-i'));
    if (a === 'seed') seed();
    else if (a === 'copyuid') { const el = $('myuid'); if (el && navigator.clipboard) navigator.clipboard.writeText(el.textContent).then(() => { b.textContent = 'Copied'; }); }
    else if (a === 'addstep') { collect(); draft.steps.push({ text: { en: '', ig: '' }, img: null, audio: null }); rerender(); }
    else if (a === 'delstep') {
      if (!confirm('Delete this step?')) return;
      collect(); draft.steps.splice(i, 1);
      if (!draft.steps.length) draft.steps.push({ text: { en: '', ig: '' }, img: null, audio: null });
      rerender();
    }
    else if (a === 'up' || a === 'down') {
      collect();
      const j = a === 'up' ? i - 1 : i + 1;
      if (j >= 0 && j < draft.steps.length) { const t = draft.steps[i]; draft.steps[i] = draft.steps[j]; draft.steps[j] = t; }
      rerender();
    }
    else if (a === 'rmimg') {
      collect();
      if (b.getAttribute('data-which') === 'cover') { draft.cover = null; draft.thumb = null; } else draft.steps[i].img = null;
      rerender();
    }
    else if (a === 'rec') toggleRecord(i, b);
    else if (a === 'rmaudio') { collect(); draft.steps[i].audio = null; rerender(); }
    else if (a === 'delguide') deleteGuide();
    else if (a === 'delupdate') {
      if (!draft || !confirm('Delete this update for everyone?')) return;
      FB().deleteUpdate(draft.__id).then(() => { DataService.invalidate(); draft = null; location.hash = '#/admin/updates'; }).catch(() => showErr('Could not delete.'));
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.matches) return;
    if (el.matches('input[data-ad-file]')) onFile(el);
    else if (el.matches('input[data-ad-audio]')) {
      const f = el.files && el.files[0];
      if (!f) return;
      if (!f.type || f.type.indexOf('audio/') !== 0) return showErr('Please choose an audio file.');
      if (f.size > 450000) return showErr('That file is too big. Use a clip under about 30 seconds (under 450 KB).');
      saveClip(Number(el.getAttribute('data-ad-audio')), f);
    }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (!f.matches || !f.matches('[data-adform]')) return;
    e.preventDefault();
    if (f.getAttribute('data-adform') === 'guide') saveGuide(); else saveUpdate();
  });

  /* ---------- entry point used by the router ---------- */
  async function entry(parts) {
    const blocked = await gate();
    if (blocked) return blocked;
    const sub = parts[0] || '', arg = decodeURIComponent(parts.slice(1).join('/') || '');
    if (sub !== 'guide' && sub !== 'update') { draft = null; kind = null; }
    let html;
    if (sub === '') html = await dash();
    else if (sub === 'guides') html = await guidesList();
    else if (sub === 'guide') html = await guideEditor(arg);
    else if (sub === 'updates') html = await updatesList();
    else if (sub === 'update') html = await updateEditor(arg);
    else html = await dash();
    setTimeout(hydratePreviews, 0);
    return html;
  }

  window.FLAdmin = { entry };
})();
