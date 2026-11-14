/* ============================================================
   OEG → Blogger થીમ બનાવે  →  blogger/OEG-Blogger-Native.xml
   ------------------------------------------------------------
   iframe વગર: આખી સાઇટ (markup + CSS + JS + data/*.json) બ્લોગર ના પાનાં પર જ ચાલે,
   browser ના address bar માં ફક્ત તમારું blogspot (અને custom domain) સરનામું દેખાય.
   ફાઈલો jsDelivr CDN પરથી લોડ થાય ⇒ GitHub માં push કરો, બ્લોગર કોઈ upload વગર જ નવું બતાવે.

   વાપરવું:
     node scripts/blogger.mjs                                  # ref = main (હંમેશા તાજું)
     node scripts/blogger.mjs --ref <sha>                       # કોઈ fix pin કરવું હોય તો
     node scripts/blogger.mjs --repo x/y --pages https://h/r/   # બીજી રીપો માટે
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };

const repo = arg("repo", "OnlineEducationGuru/OEG");
const ref = arg("ref", "main");
const CDN = `https://cdn.jsdelivr.net/gh/${repo}@${ref}/`;
const PAGES = arg("pages", "https://onlineeducationguru.github.io/OEG/").replace(/\/?$/, "/");
const out = join(root, "blogger", "OEG-Blogger-Native.xml");

/* ---------- 1) index.html નું body ---------- */
const html = readFileSync(join(root, "index.html"), "utf8");
const b0 = html.indexOf("<body>"), b1 = html.lastIndexOf("</body>");
if (b0 < 0 || b1 < 0) { console.error("index.html માં <body> મળ્યું નહીં"); process.exit(1); }
let body = html.slice(b0 + 6, b1).trim();

/* ---------- 2) local path → CDN (જાવાસ્ક્રિપ્ટ/CSS/ઈમેજ) અને SEO પાનાં → GitHub Pages ---------- */
const pagesLinks = process.argv.includes("--pages-links");
/* SEO પાનાં (g/ p/ q/) બ્લોગર પર નથી — એટલે default: એ જ પાનાં નાં app routes (સરનામું બ્લોગર નું જ રહે).
   --pages-links આપો તો GitHub Pages નાં SEO પાનાં પર જ લિંક જાય (વધુ crawls, પણ host બદલાય). */
const seoLink = (u) => {
  if (pagesLinks) return PAGES + u;
  let m = /^g\/(\d+)\.html$/.exec(u); if (m) return "#/grade/" + m[1];
  if (u === "g/balvatika.html") return "#/grade/balvatika";
  if (u === "g/all.html") return "#/textbooks";
  m = /^q\/[\w-]+\.html$/.exec(u); if (m) return "#/quiz";
  m = /^p\/([\w-]+)\.html$/.exec(u); if (m) return "#/view/" + m[1];
  return "";                                        /* sitemap.xml / robots.txt બ્લોગર પર અર્થહીન ⇒ લિંક કાઢી નાખો */
};
body = body
  .replace(/(src|href)="((?:js|vendor|assets)\/[^"]+|styles\.css|favicon\.svg|manifest\.webmanifest)"/g, `$1="${CDN}$2"`)
  .replace(/<a [^>]*href="((?:g|p|q)\/[^"]+|sitemap\.xml|robots\.txt)"[^>]*>\s*([^<]*?)\s*<\/a>/g, (m0, u, txt) => {
    const to = seoLink(u);
    return to ? `<a href="${to}">${txt}</a>` : "";
  })
  .replace(/href="((?:g|p|q)\/[^"]+|sitemap\.xml|robots\.txt)"/g, (m0, u) => `href="${seoLink(u) || "#/"}"`);
if (/="(?:js|vendor|assets|styles\.css|favicon|manifest|g\/|p\/|q\/|sitemap)/.test(body)) {
  console.error("⚠️ હજી local path રહ્યો છે — index.html નું markup તપાસો"); process.exit(1);
}

/* ---------- 2b) head ની ફાઈલો (ફોન્ટ CSS + preconnect) પણ થીમ માં લાવો ---------- */
/* XHTML માં દરેક attribute ને મૂલ્ય જોઈએ અને tag બંધ થવો જોઈએ ⇒ attributes ફરી લખીએ */
function fixTag(tag) {
  const nm = (/^<([a-zA-Z-]+)/.exec(tag) || [0, "link"])[1];
  const rest = tag.replace(/^<[a-zA-Z-]+/, "").replace(/\s*\/?>$/, "");
  const out = [];
  const re = /([a-zA-Z-]+)(?:\s*=\s*"([^"]*)"|\s*=\s*'([^']*)')?/g;
  let m;
  while ((m = re.exec(rest))) {
    const k = m[1];
    let v = m[2] !== undefined ? m[2] : m[3];
    if (v === undefined) v = k === "crossorigin" ? "anonymous" : k;
    v = v.replace(/href=/g, "");
    out.push(`${k}="${v}"`);
  }
  const hrefIdx = out.findIndex((a) => a.startsWith("href="));
  if (hrefIdx >= 0) out[hrefIdx] = out[hrefIdx].replace(/href="(?!https?:\/\/|\/\/)([^"]*)"/, `href="${CDN}$1"`);
  return `<${nm} ${out.join(" ")}/>`;
}
const headLinkTags = (html.slice(html.indexOf("<head"), html.indexOf("</head>")).match(/<link\b[^>]*>/g) || [])
  .filter((l) => /rel=("|')?(stylesheet|preconnect|dns-prefetch|icon|manifest)/.test(l))
  .map(fixTag);
const byHref = (tag) => (/href="([^"]*)"/.exec(tag) || [0, ""])[1];
const want = [
  `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>`,
  `<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="anonymous"/>`,
  `<link rel="preconnect" href="https://i.ytimg.com"/>`,
  `<link rel="preconnect" href="https://www.youtube-nocookie.com"/>`,
  `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin="anonymous"/>`,
  `<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com"/>`,
  `<link rel="icon" href="${CDN}favicon.svg" type="image/svg+xml"/>`,
  `<link rel="manifest" href="${CDN}manifest.webmanifest"/>`,
  `<link rel="stylesheet" href="${CDN}styles.css"/>`
];
const headSet = new Map();
headLinkTags.concat(want).forEach((t) => { if (!headSet.has(byHref(t))) headSet.set(byHref(t), t); });
const headExtra = [...headSet.values()].join("\n");

/* ---------- 3) HTML → XHTML (બ્લોગર નો parser strict છે — jsdom જ એ રીતે કરી શકે) ---------- */
let JSDOM;
try { ({ JSDOM } = await import("jsdom")); }
catch (e) {
  console.error("❌ jsdom મળ્યો નહીં. પહેલાં:  npm install   પછી ફરી:  node scripts/blogger.mjs");
  process.exit(1);
}
const JSDOMC = JSDOM;
{
  const doc = new JSDOMC(`<!DOCTYPE html><html><body>${body}</body></html>`);
  let xml = new doc.window.XMLSerializer().serializeToString(doc.window.document.body);
  xml = xml.replace(/^<body[^>]*>/, "").replace(/<\/body>$/, "");
  body = xml.replace(/<script([^>]*?)\/>/g, "<script$1></script>");   /* self-close → બ્લોગર માં સલામત રીતે */
}

/* 🧩 બ્લોગર ના Layout માં “Add a Gadget” ચાલે એ માટે void sections (header / sidebar / footer) */
const sect = (id, cls) => `<b:section class='${cls}' id='${id}' showaddelement='yes'></b:section>`;
let slots = 0;
if (/<\/header>/.test(body)) { body = body.replace(/<\/header>/, (m0) => m0 + sect("oeg-top", "oeg-top")); slots++; }
if (/<aside[^>]*id=["']?sidebar/.test(body)) { body = body.replace(/(<aside[^>]*id=["']?sidebar["']?[^>]*>)/, (m0) => m0 + sect("oeg-side", "oeg-side")); slots++; }
if (/<\/footer>/.test(body)) { body = body.replace(/<\/footer>/, (m0) => sect("oeg-foot", "oeg-foot") + m0); slots++; }
if (!slots) console.warn("   ⚠️ Layout slots (header/sidebar/footer gadget જગ્યા) ઉમેરી શકાયા નહીં");
else console.log("   🧩 Layout slots: " + slots + " (header/sidebar/footer gadget જગ્યા)");

/* ---------- 3b) OEG_BASE inject (js/catalog.js → data/*.json CDN પરથી વાંચે) ---------- */
/* ⚠️ CDATA નાં ચિહ્ન અલગ લીટીએ રાખવા — HTML પાર્સર માં `//<![CDATA[` પછી ની બાબત એક જ લીટી હોય તો ટિપ્પણી બની જાય */
const inject = `<script>//<![CDATA[\nwindow.OEG_BASE="${CDN}";\n//]]></script>`;
const firstScript = body.search(/<script\b/);
if (firstScript < 0) { console.error("⚠️ app script મળ્યો નહીં"); process.exit(1); }
body = body.slice(0, firstScript) + inject + body.slice(firstScript);

/* ---------- 5) બ્લોગર ની પોસ્ટ્સ (SEO + ટિપ્પણી + ફીડ) ---------- */
const blog = `
<b:section class='oeg-blog' id='main' maxwidgets='1' showaddelement='no'>
  <b:widget id='Blog1' locked='true' title='બ્લોગ પોસ્ટ્સ' type='Blog' version='2'>
    <b:includable id='main'>
      <div class='oeg-blog'>
        <h2>📰 તાજેતર ની પોસ્ટ્સ</h2>
        <b:loop values='data:posts' var='post'>
          <article class='oeg-post'>
            <h3><a expr:href='data:post.url'><data:post.title/></a></h3>
            <div class='oeg-post-body'><data:post.body/></div>
          </article>
        </b:loop>
      </div>
    </b:includable>
  </b:widget>
</b:section>`;

/* ---------- 6) થીમ જોડો ---------- */
const skin = `<![CDATA[
/* Online Education Guru — BLOGGER NATIVE થીમ (iframe વગર, આખી સાઇટ બ્લોગર પર).
   CSS/JS/Data: ${repo}@${ref} ની jsDelivr CDN ⇒ ફેરફાર GitHub માં કરો, બ્લોગર તરત જ નવું લાદે. */
/* <Group description="રંગો" selector="body"> */
/* <Variable name="keycolor" description="મુખ્ય રંગ" type="color" default="#4f46e5" value="#4f46e5"/> */
/* </Group> */
/* 🌗 થીમ સાથે ચાલે — રંગ js/styles.css નાં CSS variable માંથી (ડાર્ક ⇒ ઘેરું, લાઈટ ⇒ 🎨) */
html{color-scheme:light}
html[data-theme="dark"]{color-scheme:dark}
body{margin:0!important;background:var(--bg,#f6f7fb);color:var(--text,#171a2b);transition:background .3s,color .3s}
/* બ્લોગર નું પોતા નું bar સાઇટ નું fixed header ઢાંકે નહીં */
#navbar-iframe,#navbar-iframe-container,.navbar,.blogger-iframe-colorize,.blogger-color{display:none!important;height:0!important}
/* Layout → Add Gadget થી જે widget આવે એ સાઇટ જી ડિઝાઇન પ્રમાણે બેસે */
.oeg-side .widget,.oeg-foot .widget,.oeg-top .widget{background:var(--surface,#fff);border:1px solid var(--border,#e3e6f0);border-radius:14px;padding:12px 14px;margin:0 0 12px;color:var(--text,#171a2b)}
.oeg-side .widget a,.oeg-foot .widget a,.oeg-top .widget a{color:var(--brand,#4f46e5)}
.oeg-side .widget .title,.oeg-foot .widget .title,.oeg-top .widget .title{font-size:.86rem;letter-spacing:.4px;margin:0 0 8px;text-transform:uppercase;color:var(--muted,#5b5f7a)}
.oeg-side .widget li,.oeg-foot .widget li{list-style:none;padding:3px 0;font-size:.92rem}
.oeg-top .widget{max-width:1180px;margin:10px auto;padding:10px 18px}
.oeg-blog{max-width:900px;margin:26px auto 40px;padding:0 16px;font-family:'Noto Sans Gujarati',system-ui,Segoe UI,sans-serif;color:var(--text,#171a2b)}
.oeg-blog h2{font-size:1.2rem;margin:0 0 12px}
.oeg-post{background:var(--surface,#fff);border:1px solid var(--border,#e3e6f0);border-radius:14px;padding:16px 18px;margin-bottom:12px;color:var(--text,#171a2b)}
.oeg-post img{max-width:100%;height:auto;border-radius:10px}
.oeg-post table{max-width:100%}
.oeg-post pre{background:var(--surface-2,#f2f3fa);border-radius:10px;padding:10px 12px;overflow:auto}
.oeg-post blockquote{margin:8px 0;padding:8px 12px;border-left:3px solid var(--brand,#4f46e5);background:var(--surface-2,#f2f3fa);border-radius:0 10px 10px 0}
.oeg-post h3{margin:0 0 6px;font-size:1.05rem}
.oeg-post a{color:var(--brand,#4f46e5);text-decoration:none}
.oeg-post-meta{color:var(--muted,#5b5f7a);font-size:.8rem;margin-bottom:8px}
.oeg-post-body{font-size:.94rem;line-height:1.6}
]]>`;

const doc = `<!--
  ============================================================
  Online Education Guru — BLOGGER NATIVE થીમ (iframe વગર)
  ============================================================
  આપોઆપ બન્યું  scripts/blogger.mjs થી  ⇒  index.html નું markup + js/** + data/** CDN પરથી.
  અપલોડ: Blogger → Theme → Restore → Upload (પહેલાં Backup જરૂરી!).
  પછી આખી સાઇટ બ્લોગર ના સરનામા પર જ ચાલે: હોમ, પાઠ્યપુસ્તક, સ્વાધ્યાયપોથી, ક્વિઝ,
  વિડિયો, રમત, બ્લોગ, Admin Panel — બધું.
  સાઇટ નું સરનામું બદલાતું નથી ⇒ browser માં ફક્ત બ્લોગર (અને custom domain) દેખાય.
  સામગ્રી બદલવાનું: Admin Panel (કોઈપણ જગ્યાએથી) — ફાઈલો GitHub માં સેવ થાય, બ્લોગર એ જ વાપરે.
  નોંધ: CDN કૅશ ⇒ push પછી ૫–૧૦ મિનિટ માં નવું દેખાય. કોઈ fix જોઈએ તો ref=<sha> થી બનાવો.
  ============================================================
-->`;

const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
${doc}
<html b:css='false' b:defaultwidgetversion='2' b:layoutsVersion='3' b:responsive='true' b:templateUrl='indie.xml' b:templateVersion='1.0.0' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
<b:include data='blog' name='all-head-content'/>
<title><data:blog.pageTitle/></title>
<meta content='width=device-width, initial-scale=1.0' name='viewport'/>
<meta content='#4f46e5' name='theme-color'/>
${headExtra}
<b:skin>${skin}</b:skin>
</head>
<body>
${body}
${blog}
</body>
</html>
`;

/* ---------- 7) તપાસ (બ્લોગર નો parser strict છે) ---------- */
const problems = [];
if ((xml.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g) || []).length) problems.push("બિન-એસ્કેપ & છે");
if ((() => { const re = /<!--([\s\S]*?)-->/g; let m; while ((m = re.exec(xml))) if (m[1].includes("--")) return true; return false; })()) problems.push("XML comment માં double-hyphen છે");
if (/<(img|br|hr|input|link|meta)\b[^>]*[^/]>/.test(xml)) problems.push("void tag self-close નથી (/> લાગે)");
mkdirSync(join(root, "blogger"), { recursive: true });
writeFileSync(out, xml);
{
  try {
    const v = new JSDOM(xml, { contentType: "text/xml" });
    const err = v.window.document.querySelector("parsererror");
    if (err) problems.push("XML parse: " + err.textContent.trim().split("\n").slice(0, 2).join(" "));
  } catch (e) {
    const m = String(e.message || e);
    const mm = /:(\d+):(\d+)/.exec(m);
    let ctx = "";
    if (mm) { const L = xml.split("\n"); const ln = Number(mm[1]) - 1; ctx = "\n      લીટી " + mm[1] + ": " + (L[ln] || "").slice(Math.max(0, Number(mm[2]) - 70), Number(mm[2]) + 40); }
    problems.push("XML parse: " + m + ctx);
  }
}
console.log(`${problems.length ? "❌ " : "✅ "}blogger/OEG-Blogger-Native.xml — ${(xml.length / 1024).toFixed(1)} KB  [jsdom XHTML + XML તપાસ]
   CDN:   ${CDN}
   SEO લિંક: ${pagesLinks ? "GitHub Pages પાનાં (" + PAGES + ")" : "બ્લોગર નાં app routes (host બદલાતો નહીં)"}
   પાનાં ની લિંક દાખલ: g/1.html → ${pagesLinks ? PAGES + "g/1.html" : "#/grade/1"}`);
problems.forEach((p) => console.error("   ⚠️ " + p));
if (problems.length) process.exit(1);
