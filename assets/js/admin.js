/* Velora — admin dashboard: list, search, sort, export, upcoming birthdays */
let veloraAllRows = [];
let veloraSortKey = "createdAt";
let veloraSortDir = -1;

function daysUntilNextBirthday(birthdateStr){
  if (!birthdateStr) return null;
  const bd = new Date(birthdateStr + "T00:00:00");
  if (isNaN(bd.getTime())) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
  return Math.round((next - today) / 86400000);
}

function fmtDate(d){
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString(); } catch(e){ return d; }
}

function csvEscape(val){
  const s = (val === null || val === undefined) ? "" : String(val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function exportCSV(rows){
  const headers = ["Name","Birthdate","Governorate","City","Phone","Email","Purpose","Session Type","Preferred Date","Message","Submitted"];
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach(r => {
    lines.push([
      r.name, r.birthdate, governorateLabel(r.governorate, "en"), r.city, r.phone, r.email,
      r.purpose, r.sessionType || "", r.preferredDate || "", r.message || "",
      r.createdAtDate ? r.createdAtDate.toISOString() : ""
    ].map(csvEscape).join(","));
  });
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "velora-contacts-" + new Date().toISOString().slice(0,10) + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderStats(rows){
  const lang = veloraGetLang();
  document.getElementById("stat-total").textContent = rows.length;
  document.getElementById("stat-bookings").textContent = rows.filter(r => r.purpose === "book").length;
  document.getElementById("stat-contacts").textContent = rows.filter(r => r.purpose !== "book").length;
  const upcoming = rows.filter(r => { const d = daysUntilNextBirthday(r.birthdate); return d !== null && d <= 30; });
  document.getElementById("stat-upcoming").textContent = upcoming.length;
  return upcoming.sort((a,b) => daysUntilNextBirthday(a.birthdate) - daysUntilNextBirthday(b.birthdate));
}

function renderUpcoming(upcoming){
  const box = document.getElementById("upcoming-list");
  const lang = veloraGetLang();
  if (!upcoming.length) {
    box.innerHTML = '<p class="empty-state">' + veloraT("admin.upcomingEmpty") + '</p>';
    return;
  }
  box.innerHTML = upcoming.slice(0, 12).map(r => {
    const days = daysUntilNextBirthday(r.birthdate);
    const tag = days === 0 ? "🎉" : veloraT("admin.daysLeft").replace("{n}", days);
    return '<div class="card" style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
      '<div><strong>' + escapeHtml(r.name) + '</strong><br><span style="font-size:0.82rem;color:var(--c-text-soft)">' +
      escapeHtml(r.phone) + ' · ' + escapeHtml(r.email) + '</span></div>' +
      '<span class="birthday-tag">' + tag + '</span></div>';
  }).join("");
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderTable(rows){
  const lang = veloraGetLang();
  const tbody = document.getElementById("table-body");
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">' + veloraT("admin.empty") + '</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => {
    const badgeClass = r.purpose === "book" ? "book" : "contact";
    const purposeLabel = r.purpose === "book" ? veloraT("booking.optionBook") : veloraT("booking.optionContact");
    return "<tr>" +
      "<td>" + escapeHtml(r.name) + "</td>" +
      "<td>" + escapeHtml(r.birthdate) + "</td>" +
      "<td>" + escapeHtml(governorateLabel(r.governorate, lang)) + "</td>" +
      "<td>" + escapeHtml(r.city) + "</td>" +
      "<td>" + escapeHtml(r.phone) + "</td>" +
      "<td>" + escapeHtml(r.email) + "</td>" +
      '<td><span class="badge ' + badgeClass + '">' + purposeLabel + "</span></td>" +
      "<td>" + fmtDate(r.createdAtDate) + "</td>" +
      "</tr>";
  }).join("");
}

function applyFilterSortAndRender(){
  const search = (document.getElementById("search-input").value || "").toLowerCase();
  let rows = veloraAllRows.filter(r => {
    if (!search) return true;
    return [r.name, r.phone, r.email, r.city, r.governorate].some(v => (v||"").toLowerCase().includes(search));
  });
  rows.sort((a,b) => {
    let av = a[veloraSortKey], bv = b[veloraSortKey];
    if (veloraSortKey === "createdAt") { av = a.createdAtDate ? a.createdAtDate.getTime() : 0; bv = b.createdAtDate ? b.createdAtDate.getTime() : 0; }
    if (av < bv) return -1 * veloraSortDir;
    if (av > bv) return 1 * veloraSortDir;
    return 0;
  });
  renderTable(rows);
  document.getElementById("export-btn").onclick = () => exportCSV(rows);
}

document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.getElementById("admin-dashboard");
  if (!dashboard) return;

  veloraRequireAuth(async (user, doSignOut) => {
    document.getElementById("admin-email").textContent = user.email || "";
    document.getElementById("logout-btn").addEventListener("click", async () => {
      await doSignOut();
      window.location.href = "login.html";
    });

    document.getElementById("loading-state").style.display = "";
    try {
      const { collection, getDocs, orderBy, query } = window.veloraFirestoreMod;
      const q = query(collection(window.veloraDb, "bookings"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      veloraAllRows = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, createdAtDate: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : null };
      });
    } catch (err) {
      console.error("Velora admin fetch error:", err);
      veloraAllRows = [];
    }
    document.getElementById("loading-state").style.display = "none";
    document.getElementById("dashboard-content").style.display = "";

    const upcoming = renderStats(veloraAllRows);
    renderUpcoming(upcoming);
    applyFilterSortAndRender();

    document.getElementById("search-input").addEventListener("input", applyFilterSortAndRender);
    document.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-sort");
        if (veloraSortKey === key) veloraSortDir *= -1; else { veloraSortKey = key; veloraSortDir = 1; }
        applyFilterSortAndRender();
      });
    });
  });
});
