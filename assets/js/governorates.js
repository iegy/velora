/* Egypt's 27 governorates — value is stored in the database (English,
   stable for sorting/filtering), label switches with the site language. */
const EGYPT_GOVERNORATES = [
  { value: "Cairo",           en: "Cairo",            ar: "القاهرة" },
  { value: "Alexandria",      en: "Alexandria",       ar: "الإسكندرية" },
  { value: "Giza",            en: "Giza",             ar: "الجيزة" },
  { value: "Qalyubia",        en: "Qalyubia",         ar: "القليوبية" },
  { value: "PortSaid",        en: "Port Said",        ar: "بورسعيد" },
  { value: "Suez",            en: "Suez",             ar: "السويس" },
  { value: "Dakahlia",        en: "Dakahlia",         ar: "الدقهلية" },
  { value: "Sharqia",         en: "Sharqia",          ar: "الشرقية" },
  { value: "Gharbia",         en: "Gharbia",          ar: "الغربية" },
  { value: "Monufia",         en: "Monufia",          ar: "المنوفية" },
  { value: "Beheira",         en: "Beheira",          ar: "البحيرة" },
  { value: "KafrElSheikh",    en: "Kafr El Sheikh",   ar: "كفر الشيخ" },
  { value: "Damietta",        en: "Damietta",         ar: "دمياط" },
  { value: "Ismailia",        en: "Ismailia",         ar: "الإسماعيلية" },
  { value: "Faiyum",          en: "Faiyum",           ar: "الفيوم" },
  { value: "BeniSuef",        en: "Beni Suef",        ar: "بني سويف" },
  { value: "Minya",           en: "Minya",            ar: "المنيا" },
  { value: "Asyut",           en: "Asyut",            ar: "أسيوط" },
  { value: "Sohag",           en: "Sohag",            ar: "سوهاج" },
  { value: "Qena",            en: "Qena",             ar: "قنا" },
  { value: "Luxor",           en: "Luxor",            ar: "الأقصر" },
  { value: "Aswan",           en: "Aswan",            ar: "أسوان" },
  { value: "RedSea",          en: "Red Sea",          ar: "البحر الأحمر" },
  { value: "NewValley",       en: "New Valley",       ar: "الوادي الجديد" },
  { value: "Matrouh",         en: "Matrouh",          ar: "مطروح" },
  { value: "NorthSinai",      en: "North Sinai",      ar: "شمال سيناء" },
  { value: "SouthSinai",      en: "South Sinai",      ar: "جنوب سيناء" }
];

function populateGovernorateSelect(selectEl){
  if (!selectEl) return;
  const lang = veloraGetLang ? veloraGetLang() : "en";
  selectEl.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.setAttribute("data-i18n-ph-opt", "1");
  placeholder.textContent = veloraT ? veloraT("booking.phGovernorate") : "Select your governorate";
  selectEl.appendChild(placeholder);

  EGYPT_GOVERNORATES.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.value;
    opt.textContent = lang === "ar" ? g.ar : g.en;
    selectEl.appendChild(opt);
  });
}

function governorateLabel(value, lang){
  const g = EGYPT_GOVERNORATES.find(x => x.value === value);
  if (!g) return value || "-";
  return lang === "ar" ? g.ar : g.en;
}
