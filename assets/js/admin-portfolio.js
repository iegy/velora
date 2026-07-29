/* Velora — admin: add / edit / delete portfolio photos.
   Images are compressed in the browser and stored as a small base64
   string directly in Firestore — no paid Storage bucket needed. */

let pfCategories = [];

function pfCategoryLabel(key){
  return veloraCategoryLabel(pfCategories, key, veloraGetLang()) || key;
}

function pfShowMsg(type, text){
  const box = document.getElementById("pf-msg");
  if (!box) return;
  box.textContent = text;
  box.className = "form-msg show " + type;
}

async function pfLoadGrid(){
  const grid = document.getElementById("pf-grid");
  if (!grid) return;
  grid.innerHTML = '<div class="loader"></div>';
  pfCategories = await veloraFetchCategories();

  const { collection, getDocs, query, orderBy, deleteDoc, doc } = window.veloraFirestoreMod;
  let snap;
  try {
    snap = await getDocs(query(collection(window.veloraDb, "portfolio"), orderBy("createdAt", "desc")));
  } catch (err) {
    console.error("Velora portfolio load error:", err);
    grid.innerHTML = '<p class="empty-state">Could not load the gallery.</p>';
    return;
  }

  if (snap.empty) {
    grid.innerHTML = '<p class="empty-state">No photos added yet — use the form above to add your first one.</p>';
    return;
  }

  grid.innerHTML = "";
  snap.docs.forEach(d => {
    const item = d.data();
    const card = document.createElement("div");
    card.className = "card";
    card.style.padding = "0";
    card.style.overflow = "hidden";
    card.innerHTML =
      '<img src="' + item.imageData + '" alt="" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block;">' +
      '<div style="padding:14px 16px;">' +
        '<strong style="display:block;margin-bottom:4px;">' + escapeHtml(item.title || "") + '</strong>' +
        '<span class="badge book" style="margin-bottom:10px;display:inline-block;">' + escapeHtml(pfCategoryLabel(item.category)) + '</span>' +
        '<button class="btn btn-outline btn-block pf-delete-btn" data-id="' + d.id + '" type="button" style="margin-top:8px;padding:8px 14px;font-size:0.82rem;">Delete</button>' +
      '</div>';
    grid.appendChild(card);
  });

  grid.querySelectorAll(".pf-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!window.confirm("Delete this photo from the gallery? This can't be undone.")) return;
      btn.disabled = true;
      btn.textContent = "Deleting...";
      try {
        await deleteDoc(doc(window.veloraDb, "portfolio", btn.getAttribute("data-id")));
        pfLoadGrid();
      } catch (err) {
        console.error("Velora portfolio delete error:", err);
        btn.disabled = false;
        btn.textContent = "Delete";
        alert("Couldn't delete this photo. Please try again.");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("portfolio-manager");
  if (!section) return;

  const fileInput = document.getElementById("pf-file");
  const preview = document.getElementById("pf-preview");
  const addBtn = document.getElementById("pf-add-btn");

  fileInput.addEventListener("change", () => {
    preview.innerHTML = "";
    const file = fileInput.files[0];
    if (!file) return;
    const img = document.createElement("img");
    img.style.maxWidth = "180px";
    img.style.borderRadius = "10px";
    img.style.marginTop = "10px";
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  });

  veloraRequireAuth(async () => {
    await pfLoadGrid();

    addBtn.addEventListener("click", async () => {
      const title = document.getElementById("pf-title").value.trim();
      const category = document.getElementById("pf-category").value;
      const file = fileInput.files[0];

      if (!title || !category || !file) {
        pfShowMsg("error", "Please add a title, pick a tab, and choose a photo.");
        return;
      }

      addBtn.disabled = true;
      addBtn.textContent = "Uploading...";
      pfShowMsg("", "");

      try {
        const { dataUrl } = await compressImageToDataUrl(file);
        const { collection, addDoc, serverTimestamp } = window.veloraFirestoreMod;
        await addDoc(collection(window.veloraDb, "portfolio"), {
          title, category, imageData: dataUrl, createdAt: serverTimestamp()
        });
        pfShowMsg("success", "Photo added to your gallery!");
        document.getElementById("pf-title").value = "";
        fileInput.value = "";
        preview.innerHTML = "";
        await pfLoadGrid();
      } catch (err) {
        console.error("Velora portfolio add error:", err);
        if (err && err.message === "IMAGE_TOO_LARGE") {
          pfShowMsg("error", "This photo is too large even after compression — please try a smaller or simpler image.");
        } else {
          pfShowMsg("error", "Something went wrong while adding the photo. Please try again.");
        }
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = "Add to Gallery";
      }
    });
  });
});
