/* Velora — shared portfolio category helpers.
   Categories live in Firestore under settings/site/categories/*, so the
   studio can rename tabs or add new ones from the dashboard. "key" is the
   stable internal id stored on each photo (never shown to visitors);
   "en"/"ar" are the editable tab labels. Falls back to a fixed default
   list if Firestore has nothing yet (e.g. before the admin first opens
   the dashboard) so the public site never shows an empty filter bar. */

const VELORA_DEFAULT_CATEGORIES = [
  { key: "portraits", en: "Artistic Portraits", ar: "بورتريه فني", order: 1 },
  { key: "street", en: "Street Photography", ar: "تصوير الشارع", order: 2 },
  { key: "editorial", en: "Editorial", ar: "تحريري", order: 3 }
];

function veloraCategoryLabel(categories, key, lang){
  const c = categories.find(x => x.key === key);
  if (!c) return key || "";
  return lang === "ar" ? (c.ar || c.en) : (c.en || c.ar);
}

function veloraSlugifyCategoryKey(text, existingKeys){
  let base = String(text || "")
    .trim().toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) base = "category";
  let key = base;
  let n = 2;
  while (existingKeys.includes(key)) { key = base + "-" + n; n++; }
  return key;
}

async function veloraFetchCategories(){
  const { collection, getDocs, query, orderBy } = window.veloraFirestoreMod;
  try {
    const snap = await getDocs(query(collection(window.veloraDb, "settings", "site", "categories"), orderBy("order", "asc")));
    if (snap.empty) return VELORA_DEFAULT_CATEGORIES.map((c, i) => ({ id: null, ...c }));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Velora categories fetch error:", err);
    return VELORA_DEFAULT_CATEGORIES.map(c => ({ id: null, ...c }));
  }
}

/* Admin-only: if no categories exist yet in Firestore, write the default
   set once so they immediately show up as editable rows in the dashboard
   (instead of only existing as an in-memory fallback). Safe to call every
   time the dashboard loads — it's a no-op once categories exist. */
async function veloraEnsureCategoriesSeeded(){
  const { collection, getDocs, addDoc, serverTimestamp } = window.veloraFirestoreMod;
  try {
    const snap = await getDocs(collection(window.veloraDb, "settings", "site", "categories"));
    if (!snap.empty) return;
    for (const c of VELORA_DEFAULT_CATEGORIES) {
      await addDoc(collection(window.veloraDb, "settings", "site", "categories"), {
        key: c.key, en: c.en, ar: c.ar, order: c.order, createdAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.error("Velora categories seed error:", err);
  }
}
