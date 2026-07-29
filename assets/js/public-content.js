/* Velora — loads live content from Firestore onto the public pages:
   contact email/phone, social links, and real portfolio photos.
   If Firebase isn't configured yet, or a fetch fails, the page simply
   keeps whatever fallback text/tiles are already in the HTML. */

const SOCIAL_ICONS = {
  instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
  facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9z"/></svg>',
  whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.7.7-2.7-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1-1.4-.6-2.3-1.5-2.9-2.9-.1-.2 0-.3.1-.5l.4-.6c.1-.2.1-.4 0-.5-.1-.2-.5-1.2-.7-1.6-.2-.4-.4-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c1.5 2 3.3 3.2 5.5 3.5.9.1 1.6 0 2.2-.2.6-.2 1.4-.9 1.6-1.3.2-.4.2-.8.1-.9-.1-.1-.2-.2-.5-.4z"/></svg>',
  tiktok: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2h3c.1 1.8 1.4 3.3 3.2 3.6v3c-1.2 0-2.3-.3-3.2-.9v6.6c0 3.1-2.5 5.7-5.7 5.7S5.6 17.4 5.6 14.3s2.5-5.7 5.7-5.7c.4 0 .8 0 1.1.1v3.1c-.3-.1-.7-.2-1.1-.2-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.7-1.2 2.7-2.7V2z"/></svg>',
  other: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/></svg>'
};

async function veloraLoadPublicContent(){
  if (!FIREBASE_IS_CONFIGURED) return;
  try {
    await initVeloraFirebase();
  } catch (err) {
    console.error("Velora public content: firebase init failed", err);
    return;
  }
  const { doc, getDoc, collection, getDocs, query, orderBy } = window.veloraFirestoreMod;

  // --- Contact info (email / phone) ---
  try {
    const snap = await getDoc(doc(window.veloraDb, "settings", "site"));
    if (snap.exists()) {
      const data = snap.data();
      if (data.email) document.querySelectorAll('[data-dynamic="email"]').forEach(el => el.textContent = data.email);
      if (data.phone) document.querySelectorAll('[data-dynamic="phone"]').forEach(el => el.textContent = data.phone);
    }
  } catch (err) {
    console.error("Velora public content: settings fetch failed", err);
  }

  // --- Social links ---
  try {
    const snap = await getDocs(query(collection(window.veloraDb, "settings", "site", "socials"), orderBy("createdAt", "asc")));
    if (!snap.empty) {
      const html = snap.docs.map(d => {
        const item = d.data();
        const icon = SOCIAL_ICONS[item.platform] || SOCIAL_ICONS.other;
        return '<a href="' + escapeAttr(item.url) + '" target="_blank" rel="noopener" aria-label="' + escapeAttr(item.platform) + '">' + icon + '</a>';
      }).join("");
      document.querySelectorAll(".js-social-row").forEach(el => el.innerHTML = html);
    }
  } catch (err) {
    console.error("Velora public content: socials fetch failed", err);
  }

  // --- Portfolio photos ---
  try {
    const snap = await getDocs(query(collection(window.veloraDb, "portfolio"), orderBy("createdAt", "desc")));
    if (!snap.empty) {
      const items = snap.docs.map(d => d.data());
      document.querySelectorAll("[data-dynamic-gallery]").forEach(grid => {
        const limit = parseInt(grid.getAttribute("data-limit") || "0", 10);
        const list = limit ? items.slice(0, limit) : items;
        grid.innerHTML = list.map(item => renderDynamicTile(item)).join("");
      });
    }
  } catch (err) {
    console.error("Velora public content: portfolio fetch failed", err);
  }
}

function renderDynamicTile(item){
  const lang = veloraGetLang();
  return '<div class="gallery-tile tile-dynamic" data-category="' + escapeAttr(item.category) + '" style="background-image:url(\'' + item.imageData + '\')">' +
    '<div class="tile-overlay"></div>' +
    '<span class="tile-label" style="position:relative;z-index:2;">' + escapeHtml(item.title || "") + '</span>' +
  '</div>';
}

function escapeAttr(s){ return String(s || "").replace(/"/g, "&quot;"); }
function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

document.addEventListener("DOMContentLoaded", veloraLoadPublicContent);
