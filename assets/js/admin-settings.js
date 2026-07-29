/* Velora — admin: edit contact info (email/phone) and social links,
   stored in Firestore under settings/site and settings/site/socials/*. */

const SOCIAL_PLATFORM_LABELS = {
  instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp",
  tiktok: "TikTok", other: "Other"
};

function setShowMsg(id, type, text){
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = text;
  box.className = "form-msg show " + type;
}

async function loadSocialList(){
  const list = document.getElementById("social-list");
  if (!list) return;
  list.innerHTML = '<div class="loader"></div>';

  const { collection, getDocs, query, orderBy, deleteDoc, doc } = window.veloraFirestoreMod;
  let snap;
  try {
    snap = await getDocs(query(collection(window.veloraDb, "settings", "site", "socials"), orderBy("createdAt", "asc")));
  } catch (err) {
    console.error("Velora socials load error:", err);
    list.innerHTML = '<p class="empty-state">Could not load social links.</p>';
    return;
  }

  if (snap.empty) {
    list.innerHTML = '<p class="empty-state" style="padding:20px 0;">No social links added yet.</p>';
    return;
  }

  list.innerHTML = "";
  snap.docs.forEach(d => {
    const item = d.data();
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.padding = "12px 0";
    row.style.borderBottom = "1px solid var(--c-border)";
    row.innerHTML =
      '<div><strong>' + escapeHtml(SOCIAL_PLATFORM_LABELS[item.platform] || item.platform) + '</strong>' +
      '<br><span style="font-size:0.85rem;color:var(--c-text-soft);">' + escapeHtml(item.url || "") + '</span></div>' +
      '<button class="btn btn-outline soc-delete-btn" data-id="' + d.id + '" type="button" style="padding:7px 16px;font-size:0.8rem;">Delete</button>';
    list.appendChild(row);
  });

  list.querySelectorAll(".soc-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!window.confirm("Remove this social link?")) return;
      const { deleteDoc, doc } = window.veloraFirestoreMod;
      try {
        await deleteDoc(doc(window.veloraDb, "settings", "site", "socials", btn.getAttribute("data-id")));
        loadSocialList();
      } catch (err) {
        console.error("Velora social delete error:", err);
        alert("Couldn't remove this link. Please try again.");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("settings-manager");
  if (!section) return;

  const emailInput = document.getElementById("set-email");
  const phoneInput = document.getElementById("set-phone");
  const saveBtn = document.getElementById("set-save-btn");
  const socAddBtn = document.getElementById("soc-add-btn");

  veloraRequireAuth(async () => {
    const { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } = window.veloraFirestoreMod;

    try {
      const snap = await getDoc(doc(window.veloraDb, "settings", "site"));
      if (snap.exists()) {
        const data = snap.data();
        emailInput.value = data.email || "";
        phoneInput.value = data.phone || "";
      }
    } catch (err) {
      console.error("Velora settings load error:", err);
    }

    await loadSocialList();

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      try {
        await setDoc(doc(window.veloraDb, "settings", "site"), {
          email: emailInput.value.trim(),
          phone: phoneInput.value.trim()
        }, { merge: true });
        setShowMsg("set-msg", "success", "Saved! Your contact info is now live on the site.");
      } catch (err) {
        console.error("Velora settings save error:", err);
        setShowMsg("set-msg", "error", "Something went wrong. Please try again.");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
      }
    });

    socAddBtn.addEventListener("click", async () => {
      const platform = document.getElementById("soc-platform").value;
      const url = document.getElementById("soc-url").value.trim();
      if (!url) {
        setShowMsg("soc-msg", "error", "Please enter a link.");
        return;
      }
      socAddBtn.disabled = true;
      socAddBtn.textContent = "Adding...";
      try {
        await addDoc(collection(window.veloraDb, "settings", "site", "socials"), {
          platform, url, createdAt: serverTimestamp()
        });
        document.getElementById("soc-url").value = "";
        setShowMsg("soc-msg", "success", "Link added!");
        await loadSocialList();
      } catch (err) {
        console.error("Velora social add error:", err);
        setShowMsg("soc-msg", "error", "Something went wrong. Please try again.");
      } finally {
        socAddBtn.disabled = false;
        socAddBtn.textContent = "Add Link";
      }
    });
  });
});
