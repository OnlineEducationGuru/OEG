/* ============================================================
   OEG — Online Education Guru | Site Configuration
   ------------------------------------------------------------
   આ ફાઈલમાં સાઈટનું મુખ્ય કોન્ફિગરેશન છે.
   Firebase / AdSense / GitHub ની વિગતો અહીં ભરો.
   (Admin Panel માંથી પણ data/site-config.json અપડેટ થાય છે.)
   ============================================================ */
window.OEG_CONFIG = {
  siteName: "Online Education Guru",
  siteTagline: {
    gu: "શિક્ષણનું ડિજિટલ પ્લેટફોર્મ",
    hi: "शिक्षा का डिजिटल प्लेटफ़ॉर्म",
    en: "Digital Platform for Education"
  },
  /* GitHub Pages URL — તમારી સાઈટનું સરનામું (Blogger theme માં પણ આ જ વાપરો) */
  siteUrl: "https://onlineeducationguru.github.io/OEG/",
  github: {
    owner: "OnlineEducationGuru",
    repo: "OEG",
    branch: "main"
  },
  /* Firebase Auth (REST) — https://console.firebase.google.com પરથી Web API Key લો
     ખાલી રાખો તો Demo Mode ચાલશે (localStorage, માત્ર ડેમો માટે) */
  firebase: {
    apiKey: "",
    authDomain: ""
  },
  /* Google AdSense — Publisher ID અને Slot ID ભરો. ખાલી હોય તો placeholder દેખાશે */
  adsense: {
    publisherId: "",        // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
    slots: {
      homeTop: "",
      homeMid: "",
      sidebar: "",
      contentBottom: ""
    }
  },
  /* Admin Panel એક્સેસ — ફક્ત data/admin.json માં રાખેલા email+પાસવર્ડથી જ ખુલે.
     (પ્રથમ વખત #/admin પર email+પાસવર્ડ સેટ કરો — ફાઈલ GitHub પર commit થશે.) */
  contactEmail: "hm89patel78@gmail.com",
  /* Social links — footer + home "Follow us" બટનમાં વપરાય છે */
  social: {
    youtube: "https://www.youtube.com/@EducationGuruOnline",
    facebook: "https://www.facebook.com/online.education.gurus",
    instagram: "https://www.instagram.com/onlineeducationguru/",
    telegram: "",
    whatsapp: ""
  }
};
