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

/* Reusable wiring for a single "site image" setting (hero photo, vision
   photo, ...): live preview on file choice, compress+save, remove. */
function wireImageSetting(idPrefix, fieldKey, saveLabel){
  const fileInput = document.getElementById(idPrefix + "-file");
  const preview = document.getElementById(idPrefix + "-preview");
  const currentPreview = document.getElementById(idPrefix + "-current-preview");
  const saveBtn = document.getElementById(idPrefix + "-save-btn");
  const removeBtn = document.getElementById(idPrefix + "-remove-btn");
  const msgId = idPrefix + "-msg";
  if (!fileInput || !saveBtn) return null;

  fileInput.addEventListener("change", () => {
    preview.innerHTML = "";
    const file = fileInput.files[0];
    if (!file) return;
    const img = document.createElement("img");
    img.style.maxWidth = "220px";
    img.style.borderRadius = "10px";
    img.style.marginTop = "10px";
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  });

  function showCurrent(url){
    currentPreview.innerHTML = url
      ? '<p class="hint">Current photo:</p><img src="' + url + '" style="max-width:220px;border-radius:10px;margin-bottom:14px;">'
      : "";
  }

  saveBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) { setShowMsg(msgId, "error", "Please choose a photo first."); return; }
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    try {
      const { doc, setDoc } = window.veloraFirestoreMod;
      const { dataUrl } = await compressImageToDataUrl(file, 900000);
      await setDoc(doc(window.veloraDb, "settings", "site"), { [fieldKey]: dataUrl }, { merge: true });
      setShowMsg(msgId, "success", "Photo updated! Check your site.");
      showCurrent(dataUrl);
      fileInput.value = "";
      preview.innerHTML = "";
    } catch (err) {
      console.error("Velora image setting save error:", err);
      if (err && err.message === "IMAGE_TOO_LARGE") {
        setShowMsg(msgId, "error", "This photo is too large even after compression — try a smaller image.");
      } else {
        setShowMsg(msgId, "error", "Something went wrong. Please try again.");
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = saveLabel;
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener("click", async () => {
      if (!window.confirm("Remove this photo and go back to the default design?")) return;
      try {
        const { doc, setDoc } = window.veloraFirestoreMod;
        await setDoc(doc(window.veloraDb, "settings", "site"), { [fieldKey]: "" }, { merge: true });
        showCurrent(null);
        setShowMsg(msgId, "success", "Photo removed.");
      } catch (err) {
        console.error("Velora image setting remove error:", err);
        setShowMsg(msgId, "error", "Something went wrong. Please try again.");
      }
    });
  }

  return { showCurrent };
}

document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("settings-manager");
  const portfolioSection = document.getElementById("portfolio-manager");
  if (!section && !portfolioSection) return;

  const emailInput = document.getElementById("set-email");
  const phoneInput = document.getElementById("set-phone");
  const saveBtn = document.getElementById("set-save-btn");
  const socAddBtn = document.getElementById("soc-add-btn");

  const heroWidget = wireImageSetting("hero", "heroImage", "Save Hero Photo");
  const visionWidget = wireImageSetting("vision", "visionImage", "Save Photo");

  veloraRequireAuth(async () => {
    const { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } = window.veloraFirestoreMod;

    try {
      const snap = await getDoc(doc(window.veloraDb, "settings", "site"));
      if (snap.exists()) {
        const data = snap.data();
        if (emailInput) emailInput.value = data.email || "";
        if (phoneInput) phoneInput.value = data.phone || "";
        if (heroWidget && data.heroImage) heroWidget.showCurrent(data.heroImage);
        if (visionWidget && data.visionImage) visionWidget.showCurrent(data.visionImage);
      }
    } catch (err) {
      console.error("Velora settings load error:", err);
    }

    if (!section) return;
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
