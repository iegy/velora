/* Redirects to login.html if no admin is signed in. Include on admin.html only. */
async function veloraRequireAuth(onReady){
  if (!FIREBASE_IS_CONFIGURED) {
    document.body.innerHTML =
      '<div class="auth-wrap"><div class="auth-card"><h2>Setup required</h2>' +
      '<p>Please finish the Firebase setup steps in README.md, then create an admin account, to use this dashboard.</p>' +
      '<a class="btn btn-outline" href="index.html">Back home</a></div></div>';
    return;
  }
  await initVeloraFirebase();
  const { onAuthStateChanged, signOut } = window.veloraAuthMod;
  onAuthStateChanged(window.veloraAuth, (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      onReady(user, () => signOut(window.veloraAuth));
    }
  });
}
