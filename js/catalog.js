/* ============================================================
   OEG Catalog — data/catalog.json લોડ + હેલ્પર્સ
   ============================================================ */
window.OEG = window.OEG || {};
OEG.state = {
  lang: localStorage.getItem("oeg-lang") || "gu",
  theme: localStorage.getItem("oeg-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  catalog: [],
  config: window.OEG_CONFIG || {},
  user: null,
  gh: { owner: "", repo: "", branch: "main", token: "" } // token: memory only
};

/* ---------- 🏷️ Taxonomy (Admin માંથી ઉમેર/કાઢી શકાય — data/site-config.json) ---------- */
const DEF_TYPES = [
  { key: "textbook", icon: "📚", route: "textbooks" },
  { key: "workbook", icon: "📝", route: "workbooks" },
  { key: "quiz", icon: "🧠", route: "quiz" },
  { key: "game", icon: "🎮", route: "games" },
  { key: "office", icon: "🗂️", route: "office" },
  { key: "teacher", icon: "👩‍🏫", route: "teachers" },
  { key: "student", icon: "🧑‍🎓", route: "students" },
  { key: "video", icon: "▶️", route: "videos" },
  { key: "post", icon: "📰", route: "blog" },
  { key: "link", icon: "🔗", route: "links" }
];
const DEF_GRADES = [{ key: "balvatika", icon: "\uD83E\uDDF8" }, { key: "1", icon: "1\uFE0F\u20E3" }, { key: "2", icon: "2\uFE0F\u20E3" }, { key: "3", icon: "3\uFE0F\u20E3" }, { key: "4", icon: "4\uFE0F\u20E3" }, { key: "5", icon: "5\uFE0F\u20E3" }, { key: "6", icon: "6\uFE0F\u20E3" }, { key: "7", icon: "7\uFE0F\u20E3" }, { key: "8", icon: "8\uFE0F\u20E3" }];
const DEF_SUBJECTS = ["gujarati", "hindi", "english", "maths", "science", "social", "sanskrit", "office", "planning", "exam", "news", "official", "blog"].map(k => ({ key: k }));
/* ધોરણ-પેજ માટે ફક્ત શૈક્ષણિક વિષયો (૭) */
const DEF_GRADE_SUBJECTS = ["gujarati", "english", "hindi", "maths", "science", "social", "sanskrit"].map(k => ({ key: k }));
const DEF_QUIZ_CATS = [
  { key: "grade", icon: "🎓" },
  { key: "gk", icon: "🌍" },
  { key: "tat", icon: "📝" },
  { key: "htat", icon: "🏫" },
  { key: "reasoning", icon: "🧩" },
  { key: "current", icon: "📰" }
];
const normList = (arr, def) => (Array.isArray(arr) && arr.length ? arr : def).map(x => (typeof x === "string" ? { key: x } : x)).filter(x => x && x.key);

OEG.tax = () => {
  const t = (OEG.state.config && OEG.state.config.taxonomy) || {};
  return {
    types: normList(t.types, DEF_TYPES),
    grades: normList(t.grades, DEF_GRADES),
    subjects: normList(t.subjects, DEF_SUBJECTS),
    gradeSubjects: normList(t.gradeSubjects, DEF_GRADE_SUBJECTS),
    quizCats: normList(t.quizCats, DEF_QUIZ_CATS)
  };
};
OEG.taxFind = (list, key) => list.find(x => x.key === key) || { key: key };
OEG.taxLabel = (obj, i18nPrefix) => {
  if (!obj || !obj.key) return "";
  const l = obj.label;
  if (l && typeof l === "object") return l[OEG.state.lang] || l.en || l.gu || l.hi || obj.key;
  if (typeof l === "string" && l) return l;
  const tr = OEG.t(i18nPrefix + "." + obj.key);
  return tr && tr !== i18nPrefix + "." + obj.key ? tr : obj.key;
};
OEG.typeOf = (k) => OEG.taxFind(OEG.tax().types, k);
OEG.gradeOf = (k) => OEG.taxFind(OEG.tax().grades, k);
OEG.typeIcon = (k) => OEG.typeOf(k).icon || "📄";
OEG.gradeIcon = (k) => OEG.gradeOf(k).icon || "🎓";
OEG.typeRoute = (k) => OEG.typeOf(k).route || "";
OEG.typeOfRoute = (route) => OEG.tax().types.find(x => x.route === route) || null;

OEG.t = (key) => (OEG_I18N[OEG.state.lang] && OEG_I18N[OEG.state.lang][key]) || OEG_I18N.gu[key] || key;
OEG.title = (item) => (item.title && (item.title[OEG.state.lang] || item.title.gu || item.title.en)) || item.title || "";
OEG.desc = (item) => (item.desc && (item.desc[OEG.state.lang] || item.desc.gu || item.desc.en)) || (typeof item.desc === "string" ? item.desc : "");
OEG.langField = (v) => (v && typeof v === "object" && !Array.isArray(v)) ? (v[OEG.state.lang] || v.gu || v.hi || v.en || "") : (v == null ? "" : v);
OEG.gradeLabel = (g) => (!g || g === "all") ? OEG.t("grade.all") : OEG.taxLabel(OEG.gradeOf(g), "grade");
OEG.typeLabel = (t) => OEG.taxLabel(OEG.typeOf(t), "type");
OEG.subjectLabel = (s) => (!s || s === "all") ? OEG.t("subject.all") : OEG.taxLabel(OEG.taxFind(OEG.tax().subjects, s), "subject");

/* ---------- 🔗 લિંક / શેર — "જ્યાંથી શેર કરે ત્યાંનું" address ----------
   iframe (Blogger) માં ચાલતી હોય તો parent નું host, નહીં તો અત્યારનું origin.
   ક્યારેય hard-code કરેલું github.io નહીં. */
OEG.shareBase = () => {
  let base = location.origin + location.pathname;
  try {
    if (window.top !== window.self && document.referrer) {
      const u = new URL(document.referrer, location.href);
      if (u.origin !== location.origin) base = u.origin + u.pathname;
    }
  } catch (e) {}
  let forced = "";
  try { forced = new URLSearchParams(location.search).get("shareBase") || ""; } catch (e) {}
  if (forced) { try { const u = new URL(forced); base = u.origin + u.pathname; } catch (e) {} }
  return base.replace(/\/index\.html$/, "/");
};
OEG.shareUrl = (hash) => {
  const raw = hash ? String(hash) : (location.hash || "");
  const clean = raw ? (raw.charAt(0) === "#" ? raw : "#" + raw) : "";
  return OEG.shareBase() + clean;
};
OEG.pageUrl = () => {
  const r = (location.hash || "").replace(/^#\/?/, "").split("?")[0].split("/")[0] || "";
  return OEG.shareBase() + (r ? "#/" + (r === "home" ? "" : r) : "");
};
OEG.siteName = () => (OEG.state.config && OEG.state.config.siteName) || "Online Education Guru";
OEG.siteHost = () => { try { return new URL(OEG.shareBase()).host; } catch (e) { return location.host || "onlineeducationguru.github.io"; } };
OEG.thumbFrom = (url) => { const id = OEG.youtubeId(url); return id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : ""; };
OEG.thumbnail = (item) => (item && (item.image || OEG.thumbFrom(item.fileUrl))) || "";

/* ---------- 🗄️ JSON data ફાઈલ લખવા/વાંચવા (admin) ---------- */
OEG.data = {
  async readJson(path, fallback) {
    try { const r = await fetch(path, { cache: "no-store" }); if (r.ok) return await r.json(); } catch (e) {}
    return fallback;
  },
  async writeJson(path, obj, msg) {
    if (!OEG.gh || !OEG.gh.connected()) throw new Error(OEG.t("admin.notConnected"));
    return OEG.gh.putFile(path, JSON.stringify(obj, null, 2) + "\n", msg);
  }
};

OEG.youtubeId = (url) => {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
};

OEG.fileExt = (url) => {
  const m = String(url || "").split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : "";
};

OEG.fileKind = (item) => {
  if (item.fileType) return item.fileType;
  const ext = OEG.fileExt(item.fileUrl);
  if (["pdf"].includes(ext)) return "pdf";
  if (["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext)) return "doc";
  if (["html", "htm"].includes(ext)) return "html";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (OEG.youtubeId(item.fileUrl)) return "video";
  return "link";
};

OEG.loadConfig = async () => {
  try {
    const r = await fetch("data/site-config.json", { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      OEG.state.config = Object.assign({}, window.OEG_CONFIG, j);
      OEG.state.config.adsense = Object.assign({}, (window.OEG_CONFIG.adsense || {}), j.adsense || {});
      OEG.state.config.firebase = Object.assign({}, (window.OEG_CONFIG.firebase || {}), j.firebase || {});
      OEG.state.config.github = Object.assign({}, (window.OEG_CONFIG.github || {}), j.github || {});
      OEG.state.config.admin = Object.assign({}, (window.OEG_CONFIG.admin || {}), j.admin || {});
    }
  } catch (e) {
    OEG.state.configError = true; /* invalid JSON — config.js ના defaults વાપરાશે */
    console.warn("OEG: data/site-config.json parse થયું નહીં — JSON માં કોઈક વાક્ય ફિક્સ કરો (દા.ત. ઈમેઈલને \" કોટ મૂકો).");
  }
  OEG.state.gh.owner = OEG.state.config.github.owner || "";
  OEG.state.gh.repo = OEG.state.config.github.repo || "";
  OEG.state.gh.branch = OEG.state.config.github.branch || "main";
};

/* double-encoded (mojibake) UTF-8 સુધારે — જૂની corrupted data સામે સુરક્ષા */
OEG.demojibake = (s) => {
  s = String(s == null ? "" : s);
  if (!/[\u00C2-\u00F4][\u0080-\u00BF]/.test(s)) return s;
  try { const f = decodeURIComponent(escape(s)); return f && f !== s ? f : s; } catch (e) { return s; }
};
const fixLang = (v) => {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = {};
    Object.keys(v).forEach((k) => { o[k] = OEG.demojibake(v[k]); });
    return o;
  }
  return typeof v === "string" ? OEG.demojibake(v) : v;
};

OEG.loadCatalog = async () => {
  try {
    const r = await fetch("data/catalog.json", { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      OEG.state.catalog = (Array.isArray(j.items) ? j.items : []).map((it) => {
        const o = Object.assign({}, it);
        ["title", "desc", "body"].forEach((k) => { if (o[k] !== undefined) o[k] = fixLang(o[k]); });
        if (Array.isArray(o.tags)) o.tags = o.tags.map(OEG.demojibake);
        return o;
      });
    }
  } catch (e) { OEG.state.catalog = []; }
  return OEG.state.catalog;
};

OEG.byType = (type) => OEG.state.catalog.filter(i => i.type === type);
OEG.byId = (id) => OEG.state.catalog.find(i => i.id === id);
OEG.search = (q) => {
  q = (q || "").toLowerCase().trim();
  if (!q) return [];
  return OEG.state.catalog.filter(i => {
    const hay = [OEG.title(i), OEG.desc(i), i.subject || "", i.grade || "", (i.tags || []).join(" ")].join(" ").toLowerCase();
    return hay.includes(q);
  });
};

OEG.toast = (msg) => {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
};

OEG.esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Admin Panel એક્સેસ — ફક્ત #/admin-login પર data/admin.json ના
   email+પાસવર્ડથી unlock કર્યું હોય તો જ (આ ટેબ/session પૂરતું). */
OEG.canAdmin = () => !!(OEG.auth && OEG.auth.unlocked && OEG.auth.unlocked());
