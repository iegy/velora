/* Velora — admin: manage the portfolio's category tabs (rename, add,
   delete). Stored in Firestore under settings/site/categories/*. */

let veloraAdminCategories = [];

function catShowMsg(type, text){
  const box = document.getElementById("cat-msg");
  if (!box) return;
  box.textContent = text;
  box.className = "form-msg show " + type;
}

function catRowHtml(c){
  return (
    '<div class="cat-row" data-id="' + c.id + '" data-key="' + escapeHtml(c.key) + '" ' +
    'style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--c-border);flex-wrap:wrap;">' +
      '<div class="cat-row-view" style="flex:1;min-width:180px;display:flex;gap:10px;align-items:center;">' +
        '<span style="font-weight:600;">' + escapeHtml(c.en) + '</span>' +
        '<span style="color:var(--c-text-soft);" dir="rtl">' + escapeHtml(c.ar) + '</span>' +
      '</div>' +
      '<div class="cat-row-actions" style="display:flex;gap:8px;">' +
        '<button type="button" class="btn btn-outline cat-edit-btn" style="padding:6px 14px;font-size:0.8rem;">' + veloraT("admin.catEditBtn") + '</button>' +
        '<button type="button" class="btn-icon cat-delete-btn" title="' + veloraT("admin.deleteBtn") + '">🗑</button>' +
      '</div>' +
    '</div>'
  );
}

function catEditFormHtml(c){
  return (
    '<div class="cat-row" data-id="' + c.id + '" data-key="' + escapeHtml(c.key) + '" ' +
    'style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--c-border);flex-wrap:wrap;">' +
      '<div style="flex:1;min-width:220px;display:flex;gap:10px;flex-wrap:wrap;">' +
        '<input type="text" class="cat-edit-en" value="' + escapeHtml(c.en) + '" style="flex:1;min-width:120px;padding:8px 10px;border:1px solid var(--c-border);border-radius:8px;">' +
        '<input type="text" class="cat-edit-ar" value="' + escapeHtml(c.ar) + '" dir="rtl" style="flex:1;min-width:120px;padding:8px 10px;border:1px solid var(--c-border);border-radius:8px;">' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button type="button" class="btn btn-primary cat-save-btn" style="padding:6px 14px;font-size:0.8rem;">' + veloraT("admin.catSaveBtn") + '</button>' +
        '<button type="button" class="btn btn-outline cat-cancel-btn" style="padding:6px 14px;font-size:0.8rem;">' + veloraT("admin.catCancelBtn") + '</button>' +
      '</div>' +
    '</div>'
  );
}

function catPopulatePfSelect(){
  const sel = document.getElementById("pf-category");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = veloraAdminCategories.map(c =>
    '<option value="' + escapeHtml(c.key) + '">' + escapeHtml(c.en) + '</option>'
  ).join("");
  if (current && veloraAdminCategories.some(c => c.key === current)) sel.value = current;
}

async function catLoadList(){
  const list = document.getElementById("cat-list");
  if (!list) return;
  list.innerHTML = '<div class="loader"></div>';
  veloraAdminCategories = await veloraFetchCategories();
  renderCatList();
  catPopulatePfSelect();
}

function renderCatList(){
  const list = document.getElementById("cat-list");
  if (!list) return;
  if (!veloraAdminCategories.length) {
    list.innerHTML = '<p class="empty-state" style="padding:16px 0;">' + veloraT("admin.catEmpty") + '</p>';
    return;
  }
  list.innerHTML = veloraAdminCategories.map(catRowHtml).join("");
  wireCatRowButtons();
}

function wireCatRowButtons(){
  const list = document.getElementById("cat-list");
  list.querySelectorAll(".cat-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".cat-row");
      const id = row.getAttribute("data-id");
      const c = veloraAdminCategories.find(x => x.id === id);
      if (!c) return;
      row.outerHTML = catEditFormHtml(c);
      wireCatRowButtons();
    });
  });
  list.querySelectorAll(".cat-cancel-btn").forEach(btn => {
    btn.addEventListener("click", () => renderCatList());
  });
  list.querySelectorAll(".cat-save-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".cat-row");
      const id = row.getAttribute("data-id");
      const en = row.querySelector(".cat-edit-en").value.trim();
      const ar = row.querySelector(".cat-edit-ar").value.trim();
      if (!en || !ar) { catShowMsg("error", veloraT("admin.catMissingLabel")); return; }
      btn.disabled = true;
      btn.textContent = "...";
      try {
        const { doc, updateDoc } = window.veloraFirestoreMod;
        await updateDoc(doc(window.veloraDb, "settings", "site", "categories", id), { en, ar });
        const c = veloraAdminCategories.find(x => x.id === id);
        if (c) { c.en = en; c.ar = ar; }
        renderCatList();
        catPopulatePfSelect();
        catShowMsg("success", veloraT("admin.catSaved"));
      } catch (err) {
        console.error("Velora category update error:", err);
        catShowMsg("error", veloraT("admin.catSaveError"));
      }
    });
  });
  list.querySelectorAll(".cat-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".cat-row");
      const id = row.getAttribute("data-id");
      if (!window.confirm(veloraT("admin.catDeleteConfirm"))) return;
      try {
        const { doc, deleteDoc } = window.veloraFirestoreMod;
        await deleteDoc(doc(window.veloraDb, "settings", "site", "categories", id));
        veloraAdminCategories = veloraAdminCategories.filter(x => x.id !== id);
        renderCatList();
        catPopulatePfSelect();
        catShowMsg("success", veloraT("admin.catDeleted"));
      } catch (err) {
        console.error("Velora category delete error:", err);
        catShowMsg("error", veloraT("admin.catSaveError"));
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("portfolio-manager");
  if (!section) return;

  const addBtn = document.getElementById("cat-add-btn");
  if (!addBtn) return;

  veloraRequireAuth(async () => {
    await veloraEnsureCategoriesSeeded();
    await catLoadList();

    addBtn.addEventListener("click", async () => {
      const en = document.getElementById("cat-en").value.trim();
      const ar = document.getElementById("cat-ar").value.trim();
      if (!en || !ar) { catShowMsg("error", veloraT("admin.catMissingLabel")); return; }

      addBtn.disabled = true;
      addBtn.textContent = "...";
      try {
        const { collection, addDoc, serverTimestamp } = window.veloraFirestoreMod;
        const key = veloraSlugifyCategoryKey(en, veloraAdminCategories.map(c => c.key));
        const order = veloraAdminCategories.length
          ? Math.max(...veloraAdminCategories.map(c => c.order || 0)) + 1
          : 1;
        await addDoc(collection(window.veloraDb, "settings", "site", "categories"), {
          key, en, ar, order, createdAt: serverTimestamp()
        });
        document.getElementById("cat-en").value = "";
        document.getElementById("cat-ar").value = "";
        catShowMsg("success", veloraT("admin.catAdded"));
        await catLoadList();
      } catch (err) {
        console.error("Velora category add error:", err);
        catShowMsg("error", veloraT("admin.catSaveError"));
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = veloraT("admin.catAddBtn");
      }
    });
  });
});
