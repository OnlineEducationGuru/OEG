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

OEG.t = (key) => (OEG_I18N[OEG.state.lang] && OEG_I18N[OEG.state.lang][key]) || OEG_I18N.gu[key] || key;
OEG.title = (item) => (item.title && (item.title[OEG.state.lang] || item.title.gu || item.title.en)) || item.title || "";
OEG.desc = (item) => (item.desc && (item.desc[OEG.state.lang] || item.desc.gu || item.desc.en)) || "";
OEG.gradeLabel = (g) => OEG.t("grade." + g) || g;
OEG.typeLabel = (t) => OEG.t("type." + t) || t;
OEG.subjectLabel = (s) => OEG.t("subject." + s) || s;

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
    }
  } catch (e) { /* defaults from config.js */ }
  OEG.state.gh.owner = OEG.state.config.github.owner || "";
  OEG.state.gh.repo = OEG.state.config.github.repo || "";
  OEG.state.gh.branch = OEG.state.config.github.branch || "main";
};

OEG.loadCatalog = async () => {
  try {
    const r = await fetch("data/catalog.json", { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      OEG.state.catalog = Array.isArray(j.items) ? j.items : [];
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

/* Admin Panel એક્સેસ તપાસ — ફક્ત admin.emails લિસ્ટમાંના લોગઈન ઈમેઈલ જ ખોલી શકે.
   "*" લિસ્ટમાં હોય તો સૌ કોઈને પરવાનગી (ટેસ્ટ મોડ). */
OEG.canAdmin = () => {
  const a = OEG.state.config && OEG.state.config.admin;
  const list = ((a && a.emails) || []).map(e => String(e).trim().toLowerCase()).filter(Boolean);
  if (list.includes("*")) return true;
  const email = OEG.state.user && OEG.state.user.email;
  return !!email && list.includes(String(email).trim().toLowerCase());
};
