/* Shared site behaviour: mobile nav + footer year */
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

  // Portfolio filter tabs (no-op on pages without .filter-btn)
  const filterBtns = document.querySelectorAll(".filter-btn");
  const tiles = document.querySelectorAll(".gallery-tile");
  if (filterBtns.length && tiles.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.getAttribute("data-filter");
        tiles.forEach(tile => {
          const cat = tile.getAttribute("data-category");
          tile.style.display = (filter === "all" || cat === filter) ? "" : "none";
        });
      });
    });
  }
});
