// Connects the app to Firebase (sign-in + database).
// This config is NOT a secret: it only says which project to talk to.
// Your data is protected by the security rules (see firestore.rules).
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
    const db = fsMod.getFirestore(app);

    window.FB = {
      onAuth: (cb) => authMod.onAuthStateChanged(auth, cb),
      signUp: (email, pw) => authMod.createUserWithEmailAndPassword(auth, email, pw),
      signIn: (email, pw) => authMod.signInWithEmailAndPassword(auth, email, pw),
      signOut: () => authMod.signOut(auth),
      reset: (email) => authMod.sendPasswordResetEmail(auth, email),
      async getProfile(uid) {
        const snap = await fsMod.getDoc(fsMod.doc(db, 'users', uid));
        return snap.exists() ? snap.data() : null;
      },
      async saveProfile(uid, data) {
        await fsMod.setDoc(fsMod.doc(db, 'users', uid), { ...data, updatedAt: fsMod.serverTimestamp() });
      }
    };
    window.dispatchEvent(new Event('fb-ready'));
  } catch (err) {
    window.FB = null;
    window.dispatchEvent(new Event('fb-failed'));
  }
})();
