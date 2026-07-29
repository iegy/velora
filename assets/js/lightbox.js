/* Velora — full-size photo lightbox for the gallery. Only real, uploaded
   photos (.tile-dynamic tiles, rendered from Firestore) are clickable —
   the static placeholder tiles have no real full-size image to show.
   Prev/Next cycle through whatever tiles are currently visible (so it
   respects the active Portfolio filter tab). */

let lbItems = [];
let lbIndex = 0;

function lbEnsureOverlay(){
  if (document.getElementById("velora-lightbox")) return;
  const overlay = document.createElement("div");
  overlay.id = "velora-lightbox";
  overlay.className = "lightbox-overlay";
  overlay.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous">&#8249;</button>' +
    '<figure class="lightbox-figure">' +
      '<img class="lightbox-img" alt="">' +
      '<figcaption class="lightbox-caption"></figcaption>' +
    '</figure>' +
    '<button type="button" class="lightbox-nav lightbox-next" aria-label="Next">&#8250;</button>';
  document.body.appendChild(overlay);

  overlay.querySelector(".lightbox-close").addEventListener("click", lbClose);
  overlay.querySelector(".lightbox-prev").addEventListener("click", () => lbStep(-1));
  overlay.querySelector(".lightbox-next").addEventListener("click", () => lbStep(1));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) lbClose(); });
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowRight") lbStep(1);
    if (e.key === "ArrowLeft") lbStep(-1);
  });
}

function lbOpen(index){
  lbIndex = index;
  const overlay = document.getElementById("velora-lightbox");
  if (!overlay) return;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  lbRender();
}

function lbClose(){
  const overlay = document.getElementById("velora-lightbox");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function lbStep(delta){
  if (!lbItems.length) return;
  lbIndex = (lbIndex + delta + lbItems.length) % lbItems.length;
  lbRender();
}

function lbRender(){
  const overlay = document.getElementById("velora-lightbox");
  const item = lbItems[lbIndex];
  if (!overlay || !item) return;
  overlay.querySelector(".lightbox-img").src = item.src;
  overlay.querySelector(".lightbox-caption").textContent = item.title || "";
  const multi = lbItems.length > 1;
  overlay.querySelector(".lightbox-prev").style.display = multi ? "" : "none";
  overlay.querySelector(".lightbox-next").style.display = multi ? "" : "none";
}

function lbExtractBgUrl(tile){
  const bg = getComputedStyle(tile).backgroundImage;
  const m = bg.match(/^url\((['"]?)(.*)\1\)$/);
  return m ? m[2] : "";
}

/* Scans the page for real (tile-dynamic) photos and wires them up to
   open the lightbox. Safe to call repeatedly (e.g. after the gallery or
   its filter tabs re-render) — it just re-attaches fresh handlers. */
function veloraWireLightbox(){
  lbEnsureOverlay();
  const tiles = Array.from(document.querySelectorAll(".gallery-tile.tile-dynamic"));
  tiles.forEach(tile => {
    tile.style.cursor = "zoom-in";
    tile.onclick = () => {
      const visible = tiles.filter(t => t.style.display !== "none");
      lbItems = visible.map(t => ({
        src: lbExtractBgUrl(t),
        title: (t.querySelector(".tile-label") || {}).textContent || ""
      }));
      const startIndex = visible.indexOf(tile);
      lbOpen(startIndex >= 0 ? startIndex : 0);
    };
  });
}
