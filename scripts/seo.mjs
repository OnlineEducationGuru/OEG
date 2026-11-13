/* ============================================================
   OEG SEO build — સ્ટેટિક (crawlable) પાનાં બનાવે:
     p/<item-id>.html   દરેક પોસ્ટ/પાઠ/વિડિયો
     g/<grade>.html     ધોરણ મુજબ મટિરિયલ (બધા પ્રકાર + વિષયો)
     q/<cat>.html       ક્વિઝ કેટેગરી
   + sitemap.xml + robots.txt
   Usage: node scripts/seo.mjs
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(root, "data/site-config.json"), "utf8"));
const cat = JSON.parse(readFileSync(join(root, "data/catalog.json"), "utf8"));
cat.items = (cat.items || []).filter((i) => !i.hidden);   /* 🙈 Admin માંથી છુપાવેલું SEO પાનાંમાં પણ નહીં */
const quiz = existsSync(join(root, "data/quiz.json")) ? JSON.parse(readFileSync(join(root, "data/quiz.json"), "utf8")) : { questions: [], cats: [] };
const BASE = (cfg.siteUrl || "https://onlineeducationguru.github.io/OEG/").replace(/\/$/, "");
const LANGS = ["gu", "hi", "en"];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const field = (v, lang = "gu") => {
  if (v && typeof v === "object") return v[lang] || v.gu || v.hi || v.en || "";
  return v == null ? "" : String(v);
};
const allLangs = (v) => LANGS.map((l) => field(v, l)).filter((x, i, a) => x && a.indexOf(x) === i);
const ytId = (url) => {
  const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
};

/* ---------- taxonomy (config પ્રમાણે) ---------- */
const TX = cfg.taxonomy || {};
const types = TX.types || [];
const grades = (TX.grades || []).filter((g) => g.key !== "all");
const realGrades = grades.filter((g) => g.key === "balvatika" || /^\d+$/.test(g.key));
const gradeSubjects = TX.gradeSubjects || [];
const quizCatsRaw = TX.quizCats || [];
const bankCats = (quiz.cats || []).map((c) => (typeof c === "string" ? { key: c } : (c || {})));
const qKeys = (quiz.questions || []).map((q) => q.cat || "gk");
const quizCats = [...new Set([...quizCatsRaw.map((c) => c.key), ...bankCats.map((c) => c.key), ...qKeys])].filter(Boolean);
const typeOf = (k) => types.find((t) => t.key === k) || { key: k, icon: "📄", route: "" };
const labelOf = (o, pre) => (o && o.label ? (o.label.gu || o.label.en || o.label.hi) : "") || (o && o.key) || "";
const gradeLabel = (k) => labelOf(grades.find((g) => g.key === k) || { key: k });
const typeLabel = (k) => labelOf(typeOf(k));
const ICONS = { balvatika: "🧸", "1": "1️⃣", "2": "2️⃣", "3": "3️⃣", "4": "4️⃣", "5": "5️⃣", "6": "6️⃣", "7": "7️⃣", "8": "8️⃣" };
const normSubs = (list) => (Array.isArray(list) ? list : [])
  .map((x) => (typeof x === "string" ? { key: x, label: { gu: x } } : (x && x.key ? x : null)))
  .filter(Boolean);
const quizCatOf = (k) => {
  const a = (TX.quizCats || []).find((c) => c.key === k) || {};
  const b = bankCats.find((c) => c.key === k) || {};
  const subs = normSubs(b.subs || a.subs);
  let mode = [a.mode, b.mode].filter((m) => m === "grade" || m === "sub" || m === "none").pop() || "";
  if (!mode) mode = k === "grade" ? "grade" : (b.useGrade === true ? "grade" : (subs.length ? "sub" : (b.useGrade === false || Object.keys(b).length ? "none" : "grade")));
  return { key: k, label: a.label || b.label, icon: a.icon || b.icon, mode, subs, useGrade: mode === "grade", useSubject: mode === "grade" };
};
const quizCatLabel = (k) => labelOf(quizCatOf(k));

/* વિષયનાં નામં (i18n ફાઈલ વાંચ્યા વગર અહીં ટૂંકી સૂચી) */
const SUBJ = {
  gujarati: ["ગુજરાતી", "गुजराती", "Gujarati"], english: ["English", "English", "English"],
  hindi: ["હિન્દી", "हिन्दी", "Hindi"], maths: ["ગણિત", "गणित", "Maths"],
  science: ["વિજ્ઞાન", "विज्ञान", "Science"], social: ["સામાજિક વિજ્ઞાન", "सामाजिक विज्ञान", "Social Science"],
  sanskrit: ["સંસ્કૃત", "संस्कृत", "Sanskrit"], gk: ["સામાન્ય જ્ઞાન", "सामान्य ज्ञान", "General Knowledge"],
  tat: ["TAT (ધોરણ ૧–૮)", "TAT (1–8)", "TAT (1–8)"], htat: ["HTAT (ધોરણ ૯–૧૨)", "HTAT (9–12)", "HTAT (9–12)"],
  reasoning: ["તર્કશક્તિ", "तर्कशक्ति", "Reasoning"], current: ["સમકાલીન", "समकालीन", "Current Affairs"],
  office: ["Office", "Office", "Office"], planning: ["આયોજન", "योजना", "Planning"], exam: ["પરીક્ષા", "परीक्षा", "Exam"],
  news: ["સમાચાર", "समाचार", "News"], official: ["સત્તાવાર", "आधिकारिक", "Official"], blog: ["બ્લોગ", "ब्लॉग", "Blog"]
};
const subjName = (k) => (SUBJ[k] || [k])[0];
const subjAll = (k) => (SUBJ[k] || [k, k, k]).join(" / ");

/* ---------- translations for the static shell ---------- */
const T = {
  open: { gu: "સાઇટ પર ખોલો", hi: "साइट पर खोलें", en: "Open on the site" },
  play: { gu: "અહીં જ ચલાવો ▶", hi: "यहीं चलाएँ ▶", en: "Play right here ▶" },
  home: { gu: "હોમ", hi: "होम", en: "Home" },
  grades: { gu: "ધોરણ મુજબ મટિરિયલ", hi: "कक्षा अनुसार सामग्री", en: "Material by grade" },
  subjects: { gu: "વિષયો", hi: "विषय", en: "Subjects" },
  allMat: { gu: "બધું જુઓ", hi: "सभी देखें", en: "View all" },
  quiz: { gu: "ઓનલાઇન ક્વિઝ", hi: "ऑनलाइन क्विज़", en: "Online quiz" },
  quizSub: { gu: "પ્રશ્નોત્તરી આપો, પાસ થાઓ અને Online Education Guru નું પ્રમાણપત્ર (PDF + ઇમેજ) મેળવો.", hi: "क्विज़ दें, पास हों और Online Education Guru का प्रमाणपत्र (PDF + छवि) पाएँ।", en: "Take the quiz, pass, and get your Online Education Guru certificate (PDF + image)." },
  items: { gu: "આઇટમ", hi: "आइटम", en: "items" },
  free: { gu: "સંપૂર્ણ મફત • ગુજરાતી / हिन्दी / English", hi: "पूर्णतः निःशुल्क • गुजराती / हिन्दी / English", en: "Completely free • Gujarati / Hindi / English" },
  level: { gu: "ધોરણ", hi: "कक्षा", en: "Class" },
  type: { gu: "પ્રકાર", hi: "प्रकार", en: "Type" },
  subject: { gu: "વિષય", hi: "विषय", en: "Subject" },
  chapters: { gu: "ચેપ્ટર પ્રમાણે", hi: "अध्याय अनुसार", en: "By chapter" },
  about: { gu: "આ પાનું Online Education Guru ના ડિજિટલ કેમ્પસ પરથી — બાલવાટિકાથી ધોરણ ૮ સુધીનું GCERT મટિરિયલ, વિડિયો પાઠ અને ક્વિઝ.", hi: "यह पृष्ठ Online Education Guru के डिजिटल कैंपस से — बालवाटिका से कक्षा 8 तक की GCERT सामग्री, वीडियो पाठ और क्विज़।", en: "This page is from the Online Education Guru digital campus — GCERT material, video lessons and quizzes from Balvatika to Class 8." },
  nosave: { gu: "ફાઈલ ડાઉનલોડ થતી નથી — બધું પેજ પર જ વંચાય/ચાલે.", hi: "फ़ाइल डाउनलोड नहीं होती — सब कुछ पेज पर ही पढ़ा/चलाया जाता है।", en: "Nothing is downloaded — everything is read and played on the page." },
  follow: { gu: "અમને ફોલો કરો", hi: "हमें फ़ॉलो करें", en: "Follow us" },
  share: { gu: "શેર કરો", hi: "साझा करें", en: "Share" },
  more: { gu: "સંબંધિત મટિરિયલ", hi: "संबंधित सामग्री", en: "Related material" },
  qs: { gu: "પ્રશ્નો", hi: "प्रश्न", en: "questions" },
  pass: { gu: "પાસ માર્ક", hi: "पास मार्क", en: "Pass mark" }
};
const tr = (k, l) => T[k][l];

const social = cfg.social || {};
const socialLinks = Object.keys(social).filter((k) => social[k]).map((k) => `<a href="${esc(social[k])}" rel="noopener" target="_blank">${esc(k)}</a>`).join(" · ");

function shell({ title, desc, keywords, url, image, jsonLd, body, crumbs }) {
  const og = `
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.siteName || "Online Education Guru")}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ""}
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="author" content="${esc(cfg.siteName || "Online Education Guru")}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ""}
<link rel="canonical" href="${esc(url)}">
${LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(url)}?lang=${l}">`).join("\n")}`;
  const nav = `<nav>${LANGS.map((l) => `<a href="?lang=${l}">${l === "gu" ? "ગુજરાતી" : l === "hi" ? "हिन्दी" : "English"}</a>`).join(" ")} <a href="../">🏠 ${esc(tr("home", "gu"))}</a></nav>`;
  const crumb = (crumbs || []).map((c) => `<a href="${esc(c.href)}">${esc(c.text)}</a>`).join(" / ");
  return `<!DOCTYPE html>
<html lang="gu" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="../favicon.svg">${og}
<link rel="stylesheet" href="../styles.css">
<style>
body{background:var(--bg)}
.seo-wrap{max-width:900px;margin:0 auto;padding:22px 18px 60px}
.seo-nav{display:flex;gap:12px;flex-wrap:wrap;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:10px 14px;margin-bottom:16px;font-weight:700;font-size:.9rem}
.seo-nav a{text-decoration:none}
.seo-crumb{color:var(--muted);font-size:.85rem;margin-bottom:10px}
.seo-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);padding:22px;margin-bottom:16px}
.seo-card h1{font-size:1.5rem;margin-bottom:6px}
.seo-meta{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.seo-meta span{background:var(--surface-2);border-radius:999px;padding:4px 11px;font-size:.78rem;font-weight:700}
.seo-lang{border-top:1px dashed var(--border);margin-top:14px;padding-top:10px}
.seo-lang h2{font-size:.95rem;margin:10px 0 4px}
.seo-lang p{color:var(--muted);font-size:.94rem}
.seo-img{width:100%;border-radius:14px;margin:12px 0;display:block}
.seo-list{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.seo-list a{display:block;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);text-decoration:none;font-weight:700}
.seo-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.seo-foot{color:var(--muted);font-size:.82rem;text-align:center;margin-top:22px}
</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
</head>
<body>
<div class="seo-wrap">
<div class="seo-nav">${nav}</div>
${crumb ? `<div class="seo-crumb">${crumb}</div>` : ""}
${body}
<div class="seo-foot">${esc(tr("free", "gu"))} · ${esc(tr("nosave", "gu"))}<br>© ${new Date().getFullYear()} ${esc(cfg.siteName || "Online Education Guru")} · ${esc(tr("follow", "gu"))}: ${socialLinks || "—"}</div>
</div>
</body>
</html>
`;
}

const langBlock = (v, title) => allLangs(v).map((text, i) => `<div class="seo-lang"><h2>${["ગુજરાતી", "हिन्दी", "English"][i] || ""}</h2><p>${esc(text)}</p></div>`).join("");

const written = [];
const put = (rel, html) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, html);
  written.push(rel);
};

/* ---------- p/<id>.html ---------- */
for (const item of cat.items || []) {
  const t3 = allLangs(item.title);
  const d3 = allLangs(item.desc);
  const title = `${(t3[0] || item.id)} | ${cfg.siteName || "Online Education Guru"}`;
  const desc = (d3[0] || t3[0] || "").slice(0, 190);
  const id = ytId(item.fileUrl);
  const image = item.image || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
  const url = `${BASE}/p/${item.id}.html`;
  const bodyTxt = [t3.map((x, i) => `<div class="seo-lang"><h2>${["ગુજરાતી", "हिन्दी", "English"][i]}</h2><p>${esc(x)}</p></div>`).join(""),
    `<div class="seo-lang">${langBlock(item.body)}</div>`].join("");
  const player = id ? `<div style="position:relative;padding-top:56.25%;border-radius:14px;overflow:hidden;background:#000">
    <iframe style="position:absolute;inset:0;width:100%;height:100%;border:0" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="${esc(t3[0] || "")}" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>
    <p style="color:var(--muted);font-size:.82rem;margin-top:6px">${esc(tr("nosave", "gu"))}</p>` : "";
  put(`p/${item.id}.html`, shell({
    title, desc, url, image,
    keywords: [...t3, gradeLabel(item.grade), typeLabel(item.type), ...(item.tags || [])].join(", ").slice(0, 400),
    crumbs: [{ href: "../", text: tr("home", "gu") }, { href: `../g/${item.grade}.html`, text: gradeLabel(item.grade) }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": id ? "VideoObject" : "LearningResource",
      name: t3[0], description: d3[0] || t3[0], url,
      ...(id ? { thumbnailUrl: image, embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, uploadDate: item.date || "", publisher: { "@type": "Organization", name: cfg.siteName } } : {}),
      inLanguage: ["gu-IN", "hi-IN", "en-IN"],
      educationalLevel: item.grade && item.grade !== "all" ? gradeLabel(item.grade) : undefined,
      learningResourceType: typeLabel(item.type),
      teaches: item.subject && item.subject !== "all" ? item.subject : undefined,
      isAccessibleForFree: true
    },
    body: `<div class="seo-card">
      <h1>${esc(t3[0] || item.id)}</h1>
      <div class="seo-meta"><span>${esc(typeLabel(item.type))}</span>${item.grade && item.grade !== "all" ? `<span>${esc(gradeLabel(item.grade))}</span>` : ""}${item.subject && item.subject !== "all" ? `<span>${esc(item.subject)}</span>` : ""}${item.date ? `<span>📅 ${esc(item.date)}</span>` : ""}</div>
      ${image ? `<img class="seo-img" src="${esc(image)}" alt="${esc(t3[0] || "")}" loading="lazy">` : ""}
      ${player}
      ${bodyTxt}
      <div class="seo-cta"><a class="btn btn-brand" href="../#/${(typeOf(item.type).route) ? typeOf(item.type).route : ""}">${esc(tr("open", "gu"))} →</a>
      ${id ? `<a class="btn btn-outline" href="../#/view/${item.id}">${esc(tr("play", "gu"))}</a>` : ""}</div>
    </div>`
  }));
}

/* ---------- g/<grade>.html ---------- */
for (const g of realGrades) {
  const items = (cat.items || []).filter((i) => i.grade === g.key);
  const label = labelOf(g, "grade");
  const icon = g.icon || ICONS[g.key] || "🎓";
  const list = items.slice(0, 30).map((i) => `<a href="../p/${i.id}.html">${esc(typeOf(i.type).icon || "📄")} ${esc(field(i.title))}</a>`).join("\n        ");
  const byType = types.map((t) => `<a href="../#/${t.route}?grade=${g.key}">${t.icon || "📄"} ${esc(labelOf(t))} <small>${items.filter(i => i.type === t.key).length}</small></a>`).join("\n        ");
  const desc = `${label} — ${tr("allMat", "gu")}: ${types.map((t) => labelOf(t)).join(", ")}. ${tr("free", "gu")}`;
  put(`g/${g.key}.html`, shell({
    title: `${icon} ${label} — ${tr("grades", "gu")} | ${cfg.siteName}`,
    desc,
    keywords: [label, tr("grades", "hi"), tr("grades", "en"), cfg.siteName, "GCERT", "GSEB", ...gradeSubjects.map((x) => subjName(x.key))].join(", ").slice(0, 400),
    url: `${BASE}/g/${g.key}.html`,
    image: "",
    crumbs: [{ href: "../", text: tr("home", "gu") }, { href: "../g/all.html", text: tr("grades", "gu") }],
    jsonLd: {
      "@context": "https://schema.org", "@type": "ItemList", name: `${label} — ${tr("grades", "gu")}`,
      numberOfItems: items.length,
      itemListElement: items.slice(0, 30).map((i, n) => ({ "@type": "ListItem", position: n + 1, name: field(i.title), url: `${BASE}/p/${i.id}.html` }))
    },
    body: `<div class="seo-card">
      <h1>${icon} ${esc(label)}</h1>
      <p>${esc(tr("grades", "gu"))}</p><p class="seo-lang"><span>${esc(tr("grades", "hi"))}</span> · <span>${esc(tr("grades", "en"))}</span></p>
      <div class="seo-meta"><span>${items.length} ${esc(tr("items", "gu"))}</span><span>${gradeSubjects.length} ${esc(tr("subjects", "gu"))}</span><span>${esc(tr("free", "gu"))}</span></div>
      <h2 style="margin-top:14px">${esc(tr("allMat", "gu"))}</h2>
      <div class="seo-list">${byType}</div>
      <h2 style="margin-top:16px">${esc(tr("subjects", "gu"))}</h2>
      <div class="seo-list">${gradeSubjects.map((s) => `<a href="../#/grade/${g.key}?subject=${s.key}">🏷️ ${esc(field(s.label) || subjName(s.key))}<small>${items.filter(i => i.subject === s.key).length}</small></a>`).join("\n        ")}</div>
      <p class="seo-lang"><b>${esc(tr("subjects", "gu"))}:</b> ${esc(gradeSubjects.map((x) => subjName(x.key)).join(", "))}<br><b>${esc(tr("subjects", "hi"))}:</b> ${esc(gradeSubjects.map((x) => (SUBJ[x.key] || [])[1] || x.key).join(", "))}<br><b>${esc(tr("subjects", "en"))}:</b> ${esc(gradeSubjects.map((x) => (SUBJ[x.key] || [])[2] || x.key).join(", "))}</p>
      <h2 style="margin-top:16px">${esc(label)} — ${items.length} ${esc(tr("items", "gu"))}</h2>
      <div class="seo-list">${list || `<p>${esc(tr("quizSub", "gu"))}</p>`}</div>
      <div class="seo-cta"><a class="btn btn-brand" href="../#/grade/${g.key}">${esc(tr("open", "gu"))} →</a><a class="btn btn-outline" href="../q/grade.html">🧠 ${esc(tr("quiz", "gu"))}</a></div>
    </div>`
  }));
}
put("g/all.html", shell({
  title: `${tr("grades", "gu")} | ${cfg.siteName}`,
  desc: `${realGrades.map((g) => labelOf(g)).join(", ")} — ${tr("free", "gu")}`,
  url: `${BASE}/g/all.html`, image: "",
  crumbs: [{ href: "../", text: tr("home", "gu") }],
  jsonLd: { "@context": "https://schema.org", "@type": "SiteNavigationElement", name: realGrades.map((g) => labelOf(g)), url: realGrades.map((g) => `${BASE}/g/${g.key}.html`) },
  body: `<div class="seo-card"><h1>🎓 ${esc(tr("grades", "gu"))}</h1>
    <div class="seo-list">${realGrades.map((g) => `<a href="${g.key}.html">${g.icon || ICONS[g.key] || "🎓"} ${esc(labelOf(g))}</a>`).join("\n      ")}</div>
    <div class="seo-cta"><a class="btn btn-brand" href="../#/grade">${esc(tr("open", "gu"))} →</a></div></div>`
}));

/* ---------- q/<cat>.html ---------- */
for (const key of quizCats) {
  const c = quizCatOf(key);
  const cc = c;
  const qs = key === "grade" ? (quiz.questions || []) : (quiz.questions || []).filter((q) => (q.cat || "gk") === key);
  const label = quizCatLabel(key);
  const sample = qs[0];
  const subLinks = cc.mode === "sub" && cc.subs.length
    ? `<h2 style="margin-top:14px">🧩 સબ-કેટેગરી</h2><div class="seo-list">${cc.subs.map((x) => {
        const n = (quiz.questions || []).filter((q) => (q.cat || "gk") === key && (q.sub || "") === x.key).length;
        return `<a href="../#/quiz?cat=${key}&sub=${x.key}">${x.icon || "🏷️"} ${esc(labelOf(x))} <small>${n} ${tr("qs", "gu")}</small></a>`;
      }).join("\n      ")}</div>`
    : cc.mode === "grade" ? `<h2 style="margin-top:14px">📘 વિષય મુજબ</h2><div class="seo-list">${(gradeSubjects || []).map((x) => {
        const n = (quiz.questions || []).filter((q) => (q.cat || "gk") === "grade" && (q.subject || "") === x.key).length;
        return `<a href="../#/quiz?cat=grade&subject=${x.key}">${x.icon || "📘"} ${esc(labelOf(x))} <small>${n} ${tr("qs", "gu")}</small></a>`;
      }).join("\n      ")}</div>` : "";
  const opts = sample ? sample.opts.map((o, i) => `<li>${"ABCD"[i]}. ${esc(field(o))}${i === sample.a ? " ✅" : ""}</li>`).join("") : "";
  /* 📗 ચેપ્ટર (ત્રીજું સ્તર) — quiz.json ના cats[].subs[].subs માંથી */
  const kidsOf = (list) => (Array.isArray(list) ? list : []).filter((x) => x && x.key);
  const nodes = kidsOf(cc.subs && cc.subs.length ? cc.subs : (bankCats.find((b) => b.key === key) || {}).subs || []);
  const chapRows = [];
  for (const node of nodes) {
    for (const ch of kidsOf(node.subs)) {
      const inCat = (quiz.questions || []).filter((q) => (q.cat || "gk") === key);
      const n = inCat.filter((q) => q.chap === ch.key && (key === "grade" ? (q.subject || "") === node.key : (q.sub || "") === node.key)).length;
      const mid = key === "grade" ? `subject=${node.key}` : `sub=${node.key}`;
      const href = `../#/quiz?cat=${key}&${mid}${ch.grade ? `&grade=${ch.grade}&` : "&"}chap=${ch.key}`;
      const nm = [ch.num ? `ચેપ્ટર ${ch.num}` : "", labelOf(ch)].filter(Boolean).join(" · ");
      chapRows.push(`<a href="${href}">📗 ${esc(nm)} <small>${n} ${tr("qs", "gu")}</small></a>`);
    }
  }
  const chapBlock = chapRows.length
    ? `<h2 style="margin-top:14px">📗 ${esc(tr("chapters", "gu"))}</h2><div class="seo-list">${chapRows.join("\n      ")}</div>`
    : "";
  put(`q/${c.key}.html`, shell({
    title: `🧠 ${label} — ${tr("quiz", "gu")} | ${cfg.siteName}`,
    desc: `${label}: ${qs.length} ${tr("qs", "gu")}. ${tr("quizSub", "gu")}`,
    keywords: `${label}, quiz, ક્વિઝ, क्विज़, ${cfg.siteName}, ${tr("pass", "gu")}`,
    url: `${BASE}/q/${c.key}.html`, image: "",
    crumbs: [{ href: "../", text: tr("home", "gu") }, { href: "../q/all.html", text: tr("quiz", "gu") }],
    jsonLd: {
      "@context": "https://schema.org", "@type": "Quiz", name: `${label} — ${tr("quiz", "gu")}`,
      description: tr("quizSub", "gu"), url: `${BASE}/q/${c.key}.html`, inLanguage: ["gu-IN", "hi-IN", "en-IN"],
      hasPart: sample ? [{ "@type": "Question", name: field(sample.q), acceptedAnswer: { "@type": "Answer", text: field(sample.opts[sample.a]) }, text: field(sample.q) }] : [],
      publisher: { "@type": "EducationalOrganization", name: cfg.siteName }
    },
    body: `<div class="seo-card">
      <h1>🧠 ${esc(label)} — ${esc(tr("quiz", "gu"))}</h1>
      <p>${esc(tr("quizSub", "gu"))}</p>
      <div class="seo-meta"><span>${qs.length} ${esc(tr("qs", "gu"))}</span><span>${esc(tr("pass", "gu"))} ${quiz.passPercent || 60}%</span><span>⏱ ${quiz.seconds || 45}s</span><span>${cc.mode === "grade" ? "🎓 ધોરણ + 📘 વિષય પસંદગી" : cc.mode === "sub" ? "🧩 સબ-કેટેગરી મુજબ" : "🚫 બધા પ્રશ્નો એકસાથે"}</span></div>
      ${subLinks}
      ${chapBlock}
      <p class="seo-lang">🏅 પાસ માર્ક સુધી પહોંચો તો <b>Online Education Guru પ્રમાણપત્ર</b> — નામ સાથે, PDF કે ઇમેજ સ્વરૂપે ડાઉનલોડ કરી શકાય (WhatsApp/શાળા બંનેમાં ચાલે).</p>
      ${sample ? `<h2 style="margin-top:14px">${esc(tr("quiz", "en"))}: ${esc(field(sample.q))}</h2><ul>${opts}</ul><p class="seo-lang">${langBlock(sample.ex)}</p>` : ""}
      <div class="seo-cta"><a class="btn btn-brand" href="../#/quiz?cat=${c.key}">▶ ${esc(tr("open", "gu"))}</a></div>
    </div>`
  }));
}
put("q/all.html", shell({
  title: `🧠 ${tr("quiz", "gu")} | ${cfg.siteName}`,
  desc: tr("quizSub", "gu"), url: `${BASE}/q/all.html`, image: "",
  crumbs: [{ href: "../", text: tr("home", "gu") }],
  jsonLd: { "@context": "https://schema.org", "@type": "ItemList", name: tr("quiz", "gu"), itemListElement: quizCats.map((k, i) => ({ "@type": "ListItem", position: i + 1, name: quizCatLabel(k), url: `${BASE}/q/${k}.html` })) },
  body: `<div class="seo-card"><h1>🧠 ${esc(tr("quiz", "gu"))}</h1><p>${esc(tr("quizSub", "gu"))}</p>
    <div class="seo-list">${quizCats.map((k) => `<a href="${k}.html">${quizCatOf(k).icon || "🧠"} ${esc(quizCatLabel(k))} <small>${(k === "grade" ? (quiz.questions || []) : (quiz.questions || []).filter(q => (q.cat || "gk") === k)).length} પ્રશ્નો</small></a>`).join("\n      ")}</div>
    <div class="seo-cta"><a class="btn btn-brand" href="../#/quiz">${esc(tr("open", "gu"))} →</a></div></div>`
}));

/* ---------- sitemap + robots ---------- */
const day = (cat.updated || new Date().toISOString().slice(0, 10));
const urls = [
  { p: "", pri: "1.0", f: "daily" },
  ...types.filter((t) => t.route).map((t) => ({ p: "#/" + t.route, pri: "0.8", f: "weekly" })),
  { p: "g/all.html", pri: "0.9", f: "weekly" },
  ...realGrades.map((g) => ({ p: `g/${g.key}.html`, pri: "0.9", f: "weekly" })),
  { p: "q/all.html", pri: "0.9", f: "weekly" },
  ...quizCats.map((k) => ({ p: `q/${k}.html`, pri: "0.8", f: "weekly" })),
  ...(cat.items || []).map((i) => ({ p: `p/${i.id}.html`, pri: i.type === "post" ? "0.7" : "0.8", f: "weekly" }))
];
writeFileSync(join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${BASE}/${u.p}</loc><lastmod>${day}</lastmod><changefreq>${u.f}</changefreq><priority>${u.pri}</priority></url>`).join("\n") +
  `\n</urlset>\n`);
writeFileSync(join(root, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /#/admin\nDisallow: /*?shareBase=\n\nSitemap: ${BASE}/sitemap.xml\n`);
/* ---------- 🧹 જૂનાં પાનાં કાઢી નાખો (Admin માંથી કંઈ કઢાય તો SEO પાનું પણ તરત જ ખતમ) ---------- */
const keep = new Set(written);
let pruned = 0;
for (const dir of ["p", "g", "q"]) {
  const abs = join(root, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (!/\.html$/.test(f)) continue;
    const rel = `${dir}/${f}`;
    if (keep.has(rel)) continue;
    rmSync(join(abs, f));
    pruned++;
  }
}
console.log(`SEO build: ${written.length} pages → p/, g/, q/ + sitemap.xml (${urls.length} urls) + robots.txt` + (pruned ? ` · 🧹 ${pruned} જૂनाં પાનાં કાઢ્યા` : ""));
