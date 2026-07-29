/* =========================================================
   Velora — Firebase configuration
   ---------------------------------------------------------
   Connected to the "velora-studio-524f9" Firebase project.
   Full setup steps (Firestore, Auth, rules) are in README.md.
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyC_RT_2BcXCDweJcMQh8-5ghpO0oQwZXNU",
  authDomain: "velora-studio-524f9.firebaseapp.com",
  projectId: "velora-studio-524f9",
  storageBucket: "velora-studio-524f9.firebasestorage.app",
  messagingSenderId: "620266734030",
  appId: "1:620266734030:web:4bcf0ef81578216a1cab9f"
};

const FIREBASE_IS_CONFIGURED = !Object.values(firebaseConfig)
  .some(v => typeof v === "string" && v.includes("REPLACE_ME"));

let veloraFirebaseApp = null;
let veloraDb = null;
let veloraAuth = null;

async function initVeloraFirebase(){
  if (!FIREBASE_IS_CONFIGURED) return null;
  if (veloraFirebaseApp) return veloraFirebaseApp;

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const firestoreMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

  veloraFirebaseApp = initializeApp(firebaseConfig);
  veloraDb = firestoreMod.getFirestore(veloraFirebaseApp);
  veloraAuth = authMod.getAuth(veloraFirebaseApp);

  window.veloraFirestoreMod = firestoreMod;
  window.veloraAuthMod = authMod;
  window.veloraDb = veloraDb;
  window.veloraAuth = veloraAuth;

  return veloraFirebaseApp;
}
