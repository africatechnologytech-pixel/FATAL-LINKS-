// The ONLY place the app reads content from.
// Real content lives in Firebase (edited in the Admin page). The sample guides below are:
//   - shown when Firebase is empty or cannot be reached and nothing is saved on the phone yet
//   - used by the Admin page's "Add the sample guides" button
//
// ALL SAMPLE CONTENT IS DEMO. Not reviewed by a doctor.
// A field like title: { en: '...', ig: '...' } holds one value per language.
// If a language is missing, the app shows English.
// "ill" picks the placeholder illustration (replace with reviewed images later).

const SAMPLE_GUIDES = [
  {
    id: 'cpr', ill: 'cpr',
    title: { en: 'CPR' },
    sub: { en: 'Cardiopulmonary Resuscitation (adult)' },
    summary: { en: 'What to do when an adult is not responding and not breathing normally. Child and baby CPR will be added separately.' },
    updated: '2026-11-10',
    steps: { en: [
      'Check the area is safe. Tap their shoulders and shout. Do they respond?',
      'If not, and they are not breathing normally, call 112 or ask someone to call. Ask another person to bring an AED if there is one nearby.',
      'Lay them on their back on a firm surface. Kneel beside their chest.',
      'Place the heel of one hand on the centre of the chest. Put your other hand on top and lock your fingers.',
      'Push hard and fast: about 5 cm deep, 100 to 120 pushes a minute. Let the chest come back up fully between pushes.',
      'Keep going without stopping until help arrives, an AED is ready, or the person starts to breathe normally.',
      'If an AED arrives, switch it on and follow its voice instructions.'
    ] },
    callIf: { en: [
      'Call 112 for anyone who is not responding and not breathing normally.',
      'Call straight away. Do not wait to see if they improve.'
    ] },
    dont: { en: [
      'Do not stop pushing unless they respond, help takes over, or you cannot continue.',
      'Do not stop if you hear or feel a rib crack. Keep pushing.',
      'Do not give food or drink.'
    ] }
  },
  {
    id: 'bleeding', ill: 'bleeding',
    title: { en: 'Bleeding Control' },
    sub: { en: 'Stop severe bleeding' },
    summary: { en: 'How to slow heavy bleeding from a wound until help arrives.' },
    updated: '2026-11-05',
    steps: { en: [
      'Call 112 or ask someone else to call.',
      'If you can, protect your hands with gloves or clean plastic bags.',
      'Press firmly and directly on the wound with a clean cloth or clothing.',
      'Keep pressing. If blood soaks through, add more cloth on top. Do not remove the first cloth.',
      'Lay the person down. Raise the injured arm or leg if you do not think a bone is broken.',
      'Tie the pad firmly in place with a bandage or strip of cloth. It should not be so tight that fingers or toes turn cold or blue.',
      'Keep them warm. Watch for pale, cold, sweaty skin or drowsiness, and tell the emergency team.'
    ] },
    callIf: { en: [
      'Bleeding does not slow after 10 minutes of firm pressure.',
      'Blood is spurting out.',
      'The person feels faint, confused or very sleepy.',
      'An object is stuck in the wound.'
    ] },
    dont: { en: [
      'Do not pull out an object stuck in the wound. Press around it.',
      'Do not remove a cloth that is soaked. Add more on top.',
      'Do not give food or drink.'
    ] }
  },
  {
    id: 'choking', ill: 'choking',
    title: { en: 'Choking' },
    sub: { en: 'Help someone who can\'t breathe (adult or child over 1)' },
    summary: { en: 'What to do when someone cannot cough, speak or breathe because of something stuck in their throat. Baby choking will be added separately.' },
    updated: '2026-11-08',
    steps: { en: [
      'Ask "Are you choking?" If they can cough, speak or breathe, encourage them to keep coughing.',
      'If they cannot cough, speak or breathe, call 112 or ask someone else to call.',
      'Lean them forward. Give up to 5 firm back blows between the shoulder blades with the heel of your hand.',
      'Still choking? Stand behind them. Place a fist just above the belly button, cover it with your other hand, and pull sharply inward and upward. Do this up to 5 times.',
      'Alternate 5 back blows and 5 abdominal thrusts until the object comes out or help arrives.',
      'If they stop responding, lay them on the ground and start CPR if you are trained.'
    ] },
    callIf: { en: [
      'They cannot breathe. Call straight away.',
      'The object does not come out.',
      'They become unresponsive.',
      'They recovered but were choking. They should still be checked by a doctor.'
    ] },
    dont: { en: [
      'Do not slap their back while they are lying flat.',
      'Do not blindly poke your fingers into their mouth.',
      'Do not give water to drink.'
    ] }
  },
  {
    id: 'burns', ill: 'burns',
    title: { en: 'Burns' },
    sub: { en: 'Treat burns safely' },
    summary: { en: 'How to cool and protect a burn or scald until it can be checked.' },
    updated: '2026-11-03',
    steps: { en: [
      'Make sure the area is safe and move the person away from the heat source.',
      'Cool the burn under cool, running water for 20 minutes. Do not use ice.',
      'Gently remove rings, watches and tight clothing near the burn before it swells. Do not pull off anything stuck to the skin.',
      'Cover the burn loosely with cling film or a clean, non-fluffy cloth.',
      'Keep the rest of the person warm and calm until help or a medical check.'
    ] },
    callIf: { en: [
      'The burn is bigger than the person\'s hand.',
      'It is on the face, hands, feet, groin or over a joint.',
      'It looks deep, white, leathery or charred.',
      'It is a chemical or electrical burn.',
      'The person is a baby, child or older adult, or has trouble breathing.'
    ] },
    dont: { en: [
      'Do not put ice, butter, oil or toothpaste on a burn.',
      'Do not burst blisters.',
      'Do not use fluffy cotton wool or sticky plasters on the burn.'
    ] }
  },
  {
    id: 'seizure', ill: 'seizure',
    title: { en: 'Seizure' },
    sub: { en: 'Help someone having a fit' },
    summary: { en: 'What to do when someone has a seizure (fit) and shakes uncontrollably.' },
    updated: '2026-11-10',
    steps: { en: [
      'Stay calm. Note the time the seizure started.',
      'Clear the area. Move hard or sharp objects away from the person.',
      'Cushion their head with something soft, such as a folded jacket.',
      'Loosen anything tight around the neck, such as a collar or tie.',
      'Do not hold them down. Let the seizure run its course.',
      'When the shaking stops, gently roll them onto their side.',
      'Stay with them until they are fully awake. Speak calmly and tell them what happened.'
    ] },
    callIf: { en: [
      'The seizure lasts more than 5 minutes.',
      'Another seizure starts soon after the first.',
      'They are not breathing normally after the shaking stops.',
      'They are injured, pregnant, or have diabetes.',
      'It is their first seizure, or they do not wake up.'
    ] },
    dont: { en: [
      'Do not put anything in their mouth.',
      'Do not give food, water or medicine until they are fully awake.',
      'Do not restrain them.'
    ] }
  }
];

const SAMPLE_UPDATES = [
  { id: 'u1', date: '2026-11-10', title: { en: 'Sample: Welcome to the FATAL LINKS demo' }, body: { en: 'This prototype shows how first aid guidance, offline access and the wristband profile fit together.' } },
  { id: 'u2', date: '2026-11-08', title: { en: 'Sample: Choking guide updated' }, body: { en: 'Example of how an update notice will look once guidance is reviewed and republished.' } },
  { id: 'u3', date: '2026-11-05', title: { en: 'Sample: Igbo translations in progress' }, body: { en: 'Guide text and audio in Igbo will be added after review by a fluent speaker.' } }
];

// Sample emergency profile (FICTIONAL). Replaced by the signed-in user's real profile in build step 5.
const SAMPLE_PROFILE = {
  name: 'Sarah Johnson', age: 24, blood: 'B+',
  allergies: 'Peanuts', conditions: 'Asthma', medications: 'Inhaler',
  contact: '+234 801 234 5678'
};


/* ---------- reading content from Firebase (with a saved copy on the phone) ---------- */
const fbReady = new Promise((res) => {
  window.addEventListener('fb-ready', () => res(true));
  window.addEventListener('fb-failed', () => res(false));
  if (window.FB) res(true);
});
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
async function fbAvailable() {
  if (navigator.onLine === false) return false;
  return Promise.race([fbReady, new Promise((r) => setTimeout(() => r(false), 5000))]);
}

// Turns a guide saved by the Admin page into the shape the screens use.
function normGuide(id, d) {
  const st = d.steps || [];
  const en = st.map((s) => (s.text && s.text.en) || '');
  const ig = st.map((s) => (s.text && s.text.ig) || '');
  const hasIg = ig.some(Boolean);
  const lines = (o) => ({ en: (o && o.en) || [], ig: o && o.ig && o.ig.length ? o.ig : undefined });
  return {
    id, ill: d.ill || 'books', order: d.order || 0,
    title: d.title || {}, sub: d.sub || {}, summary: d.summary || {},
    updated: d.updated || '', cover: d.cover || null, thumb: d.thumb || null,
    steps: { en, ig: hasIg ? ig.map((x, i) => x || en[i]) : undefined },
    igPartial: hasIg && ig.some((x) => !x),
    stepImgs: st.map((s) => s.img || null),
    callIf: lines(d.callIf), dont: lines(d.dont)
  };
}
const normUpdate = (d) => ({ id: d.id, date: d.date || '', title: d.title || {}, body: d.body || {} });

function makeStore(key, fetchFn, normFn, fallback, sortFn) {
  let mem = null, inflight = null;
  const readCache = () => { try { const c = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(c) && c.length ? c : null; } catch (e) { return null; } };
  function refresh() {
    if (inflight) return inflight;
    inflight = (async () => {
      let list = null, ok = false;
      if (await fbAvailable()) {
        try { const raw = await withTimeout(fetchFn(), 8000); ok = true; list = raw.map(normFn).sort(sortFn); } catch (e) {}
      }
      if (ok) {
        try { if (list.length) localStorage.setItem(key, JSON.stringify(list)); else localStorage.removeItem(key); } catch (e) {}
        if (!list.length) list = fallback;
      } else list = readCache() || fallback;
      const first = mem === null;
      const changed = JSON.stringify(list) !== JSON.stringify(mem);
      mem = list;
      if (changed && !first) window.dispatchEvent(new Event('fl-data'));
      return list;
    })().finally(() => { inflight = null; });
    return inflight;
  }
  return {
    async get() {
      if (mem) return mem;
      const c = readCache();
      if (c) { mem = c; refresh(); return c; }   // show the saved copy now, refresh quietly
      return refresh();
    },
    invalidate() { mem = null; try { localStorage.removeItem(key); } catch (e) {} }
  };
}

const guidesStore = makeStore('fl_gcache', () => window.FB.listGuides(), (d) => normGuide(d.id, d), SAMPLE_GUIDES, (a, b) => (a.order || 0) - (b.order || 0));
const updatesStore = makeStore('fl_ucache', () => window.FB.listUpdates(), normUpdate, SAMPLE_UPDATES, (a, b) => String(b.date).localeCompare(String(a.date)));
const imageMem = {};

const DataService = {
  getGuides: () => guidesStore.get(),
  async getGuide(id) { const l = await guidesStore.get(); return l.find((g) => g.id === id) || null; },
  getUpdates: () => updatesStore.get(),
  async getProfile() { return SAMPLE_PROFILE; },
  async getImage(id) {
    if (imageMem[id]) return imageMem[id];
    if (!(await fbAvailable())) return null;
    try {
      const d = await withTimeout(window.FB.getImage(id), 8000);
      if (typeof d === 'string' && d.indexOf('data:image/') === 0) { imageMem[id] = d; return d; }
    } catch (e) {}
    return null;
  },
  invalidate() { guidesStore.invalidate(); updatesStore.invalidate(); }
};
