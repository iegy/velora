/* Shared site behaviour: mobile nav + footer year */

/* Portfolio filter tabs. Re-attaches on demand (not just once at page
   load) because the tab buttons themselves may be re-rendered from
   Firestore categories after this first runs (see public-content.js) —
   calling this again after that re-render is what makes the new buttons
   clickable. Tiles are always re-queried fresh at click time, since the
   gallery is also re-rendered dynamically. */
function veloraWireFilterButtons(){
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");
      document.querySelectorAll(".gallery-tile").forEach(tile => {
        const cat = tile.getAttribute("data-category");
        tile.style.display = (filter === "all" || cat === filter) ? "" : "none";
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", links.classList.contains("open"));
    });
    links.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => links.classList.remove("open"));
    });
  }

  document.querySelectorAll(".js-year").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  veloraWireFilterButtons();
});
