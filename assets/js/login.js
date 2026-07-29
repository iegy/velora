/* Velora — admin login */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const msgBox = document.getElementById("login-msg");
  const submitBtn = document.getElementById("login-submit");

  if (!FIREBASE_IS_CONFIGURED) {
    msgBox.textContent = "Firebase isn't configured yet — see README.md.";
    msgBox.className = "form-msg show error";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!FIREBASE_IS_CONFIGURED) return;

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    submitBtn.disabled = true;
    submitBtn.textContent = veloraT("login.submitting");
    msgBox.className = "form-msg";

    try {
      await initVeloraFirebase();
      const { signInWithEmailAndPassword } = window.veloraAuthMod;
      await signInWithEmailAndPassword(window.veloraAuth, email, password);
      window.location.href = "admin.html";
    } catch (err) {
      console.error("Velora login error:", err);
      msgBox.textContent = veloraT("login.error");
      msgBox.className = "form-msg show error";
      submitBtn.disabled = false;
      submitBtn.textContent = veloraT("login.submitBtn");
    }
  });
});
