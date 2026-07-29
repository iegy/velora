/* =========================================================
   Velora — Firebase configuration
   ---------------------------------------------------------
   1. Create a FREE Firebase project at https://console.firebase.google.com
   2. Add a Web App inside it, then copy the config object it gives you
      and paste the values below (replace every "REPLACE_ME...").
   3. Enable "Firestore Database" (Production or Test mode) and
      "Authentication" -> Email/Password sign-in method.
   Full step-by-step instructions are in README.md.
   ========================================================= */

const firebaseConfig = {
  apiKey: "REPLACE_ME_API_KEY",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME_PROJECT_ID",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME_SENDER_ID",
  appId: "REPLACE_ME_APP_ID"
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
