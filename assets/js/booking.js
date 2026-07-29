/* Velora — booking / "stay in touch" form handling */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const govSelect = document.getElementById("governorate");
  populateGovernorateSelect(govSelect);
  document.querySelectorAll(".lang-toggle").forEach(btn => {
    btn.addEventListener("click", () => populateGovernorateSelect(govSelect));
  });

  // Pre-select purpose from ?purpose=contact query param (used by contact.html link)
  const params = new URLSearchParams(window.location.search);
  const purposeParam = params.get("purpose");
  const purposeSelect = document.getElementById("purpose");
  const sessionTypeField = document.getElementById("session-type-field");
  const preferredDateField = document.getElementById("preferred-date-field");

  function toggleBookingFields(){
    const isBooking = purposeSelect.value === "book";
    sessionTypeField.style.display = isBooking ? "" : "none";
    preferredDateField.style.display = isBooking ? "" : "none";
  }

  if (purposeSelect) {
    if (purposeParam === "contact") purposeSelect.value = "contact";
    if (purposeParam === "book") purposeSelect.value = "book";
    toggleBookingFields();
    purposeSelect.addEventListener("change", toggleBookingFields);
  }

  const msgBox = document.getElementById("form-msg");
  const submitBtn = document.getElementById("submit-btn");

  function showMsg(type, text){
    msgBox.textContent = text;
    msgBox.className = "form-msg show " + type;
  }

  // Basic Egyptian mobile pattern: 01 followed by 0/1/2/5 and 8 more digits
  const PHONE_RE = /^01[0125][0-9]{8}$/;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgBox.className = "form-msg";

    // Honeypot — if a bot filled this hidden field, silently drop.
    const honeypot = form.querySelector('input[name="company_website"]');
    if (honeypot && honeypot.value.trim() !== "") {
      showMsg("success", veloraT("booking.successMsg"));
      form.reset();
      return;
    }

    const consent = document.getElementById("consent");
    if (!consent.checked) {
      showMsg("error", veloraT("booking.consentRequired"));
      return;
    }

    const data = {
      purpose: purposeSelect.value,
      name: document.getElementById("name").value.trim(),
      birthdate: document.getElementById("dob").value,
      governorate: govSelect.value,
      city: document.getElementById("city").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      sessionType: document.getElementById("session-type") ? document.getElementById("session-type").value : "",
      preferredDate: document.getElementById("preferred-date") ? document.getElementById("preferred-date").value : "",
      message: document.getElementById("message").value.trim()
    };

    // Every field is required. Session type / preferred date only apply
    // (and are only visible) when the visitor picked "Book a session" —
    // for "Just stay in touch" they stay hidden and aren't demanded.
    const isBooking = data.purpose === "book";
    const missingRequired =
      !data.name || !data.birthdate || !data.governorate || !data.city ||
      !data.phone || !data.email || !data.message ||
      (isBooking && (!data.sessionType || !data.preferredDate));

    if (missingRequired) {
      showMsg("error", veloraT("booking.missingFieldsMsg"));
      return;
    }
    if (!PHONE_RE.test(data.phone.replace(/\s|-/g, ""))) {
      showMsg("error", veloraT("booking.invalidPhoneMsg"));
      return;
    }

    if (!FIREBASE_IS_CONFIGURED) {
      showMsg("error", veloraT("booking.setupWarning"));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = veloraT("booking.submitting");

    try {
      await initVeloraFirebase();
      const { collection, addDoc, serverTimestamp } = window.veloraFirestoreMod;
      await addDoc(collection(window.veloraDb, "bookings"), {
        ...data,
        createdAt: serverTimestamp()
      });
      showMsg("success", veloraT("booking.successMsg"));
      form.reset();
      if (purposeSelect) { purposeSelect.value = "book"; toggleBookingFields(); }
      populateGovernorateSelect(govSelect);
    } catch (err) {
      console.error("Velora booking submit error:", err);
      showMsg("error", veloraT("booking.errorMsg"));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = veloraT("booking.submitBtn");
    }
  });
});
