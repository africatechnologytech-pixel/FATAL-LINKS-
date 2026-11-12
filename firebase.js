// Connects the app to Firebase (sign-in + database).
// This config is NOT a secret: it only says which project to talk to.
// Your data is protected by the security rules in Firebase (Firestore > Rules).
//
// If Firebase cannot load (for example no internet), the rest of the app still works.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAxXYnbkPTvzHun2luWKni_RvJCXudeGRs",
  authDomain: "fatal-links.firebaseapp.com",
  projectId: "fatal-links",
  storageBucket: "fatal-links.firebasestorage.app",
  messagingSenderId: "763868657813",
  appId: "1:763868657813:web:a8226e13f1c29fbdd6039c"
};

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';

(async () => {
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]);
    const app = appMod.initializeApp(FIREBASE_CONFIG);
    const auth = authMod.getAuth(app);

    // Keep a copy of everything read, so content already seen also opens without internet.
    let db;
    try {
      db = fsMod.initializeFirestore(app, {
        localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }),
        experimentalAutoDetectLongPolling: true   // helps on networks that block the normal connection
      });
    } catch (e) {
      db = fsMod.getFirestore(app);
    }

    const D = (path, id) => fsMod.doc(db, path, id);
    const listAll = async (name) => {
      const snap = await fsMod.getDocs(fsMod.collection(db, name));
      return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    };

    window.FB = {
      /* --- sign-in --- */
      onAuth: (cb) => authMod.onAuthStateChanged(auth, cb),
      signUp: (email, pw) => authMod.createUserWithEmailAndPassword(auth, email, pw),
      signIn: (email, pw) => authMod.signInWithEmailAndPassword(auth, email, pw),
      signOut: () => authMod.signOut(auth),
      reset: (email) => authMod.sendPasswordResetEmail(auth, email),

      /* --- private profile + wristband QR --- */
      async getProfile(uid) {
        const snap = await fsMod.getDoc(D('users', uid));
        return snap.exists() ? snap.data() : null;
      },
      async saveProfile(uid, data, token, pub) {
        const b = fsMod.writeBatch(db);
        b.set(D('users', uid), { ...data, updatedAt: fsMod.serverTimestamp() }, { merge: true });
        if (token) b.set(D('publicProfiles', token), { ...pub, ownerUid: uid, updatedAt: fsMod.serverTimestamp() });
        await b.commit();
      },
      async getPublic(token) {
        const snap = await fsMod.getDoc(D('publicProfiles', token));
        return snap.exists() ? snap.data() : null;
      },
      async publishQr(uid, token, oldToken, pub) {
        const b = fsMod.writeBatch(db);
        b.set(D('publicProfiles', token), { ...pub, ownerUid: uid, updatedAt: fsMod.serverTimestamp() });
        b.set(D('users', uid), { qrToken: token }, { merge: true });
        if (oldToken && oldToken !== token) b.delete(D('publicProfiles', oldToken));
        await b.commit();
      },
      async disableQr(uid, oldToken) {
        const b = fsMod.writeBatch(db);
        if (oldToken) b.delete(D('publicProfiles', oldToken));
        b.set(D('users', uid), { qrToken: null }, { merge: true });
        await b.commit();
      },

      /* --- content everyone can read --- */
      listGuides: () => listAll('guides'),
      listUpdates: () => listAll('updates'),
      listFacilities: () => listAll('facilities'),
      async getImage(id) {
        const snap = await fsMod.getDoc(D('images', id));
        return snap.exists() ? snap.data().data : null;
      },

      /* --- admin only (the security rules enforce this) --- */
      async isAdmin(uid) {
        const snap = await fsMod.getDoc(D('admins', uid));
        return snap.exists();
      },
      saveGuide: (id, data) => fsMod.setDoc(D('guides', id), data),
      deleteGuide: (id) => fsMod.deleteDoc(D('guides', id)),
      saveFacility: (id, data) => fsMod.setDoc(D('facilities', id), data),
      deleteFacility: (id) => fsMod.deleteDoc(D('facilities', id)),
      async seedFacilities(list) {
        const b = fsMod.writeBatch(db);
        list.forEach(([id, data]) => b.set(D('facilities', id), data));
        await b.commit();
      },
      saveUpdate: (id, data) => fsMod.setDoc(D('updates', id), data),
      deleteUpdate: (id) => fsMod.deleteDoc(D('updates', id)),
      async getAudio(id) {
        const snap = await fsMod.getDoc(D('audio', id));
        return snap.exists() ? snap.data().data : null;
      },
      saveAudio: (id, dataUrl) => fsMod.setDoc(D('audio', id), { data: dataUrl, createdAt: fsMod.serverTimestamp() }),
      deleteAudio: (id) => fsMod.deleteDoc(D('audio', id)),
      saveImage: (id, dataUrl) => fsMod.setDoc(D('images', id), { data: dataUrl, createdAt: fsMod.serverTimestamp() }),
      deleteImage: (id) => fsMod.deleteDoc(D('images', id)),
      async seed(guides, updates) {
        const b = fsMod.writeBatch(db);
        guides.forEach(([id, data]) => b.set(D('guides', id), data));
        updates.forEach(([id, data]) => b.set(D('updates', id), data));
        await b.commit();
      }
    };
    window.dispatchEvent(new Event('fb-ready'));
  } catch (err) {
    window.FB = null;
    window.dispatchEvent(new Event('fb-failed'));
  }
})();
