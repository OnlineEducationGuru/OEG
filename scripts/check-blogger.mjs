/* ============================================================
   scripts/check-blogger.mjs — 🌱 એવરગ્રીન બ્લોગર થીમ ની ચકાસણી
   ------------------------------------------------------------
   થીમ ફાઈલ બનાવો → jsdom માં ખોલો → mock fetch થી repo ની ફાઈલો આપો.
   મુખ્ય પુરાવો: થીમ ફાઈલ માં ફેરફાર કર્યા વગર (કે ફરી upload કર્યા વગર)
   repo નું તાજું markup / નવું js / નવી CSS બ્લોગર ના પાનાં પર આપોઆપ દેખાય.
   વાપરવું:  node scripts/check-blogger.mjs
   ============================================================ */
import { readFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (f) => readFileSync(join(root, f), "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const grp = (t) => console.log("\n\x1b[1m" + t + "\x1b[0m");
const ok = (cond, name, got) => {
  if (cond) { pass++; console.log("  \x1b[32m✓\x1b[0m " + name); }
  else { fail++; console.log("  \x1b[31m✗\x1b[0m " + name + (got === undefined ? "" : "  ⇒ " + got)); }
};

let JSDOM, VirtualConsole;
let requestInterceptor = null;
try { ({ JSDOM, VirtualConsole, requestInterceptor } = await import("jsdom")); }
catch (e) { console.log("❌ jsdom નથી ⇒ npm install કરો"); process.exit(1); }

const CDN = "https://cdn.jsdelivr.net/gh/OnlineEducationGuru/OEG@main/";
const UNPKG = "https://unpkg.com/OnlineEducationGuru/OEG@main/";
const RAW = "https://raw.githubusercontent.com/OnlineEducationGuru/OEG/main/";

/* ---------- ૦) થીમ બનાવો + ફાઈલ ની તપાસ ---------- */
grp("૦) થીમ બિલ્ડ (એવરગ્રીન) + source તપાસ");
let xml = "";
try { execSync("node scripts/blogger.mjs", { cwd: root, stdio: "pipe" }); xml = src("blogger/OEG-Blogger-Native.xml"); ok(!!xml, "node scripts/blogger.mjs ⇒ થીમ બન્યો"); }
catch (e) { ok(false, "થીમ બિલ્ડ", String(e.message).slice(0, 220)); }
const loaderSrc = src("js/blogger-loader.js");
ok(/<div id="oeg-shell"/.test(xml), "થીમ માં shell (repo નું markup એટલે જ ભરાય)");
ok(!/<script[^>]*\bsrc=/.test(xml), "થીમ માં કોઈ <script src> નહીં ⇒ js ફકત run-time પર લાદાય (એટલે ફરી upload નહીં)");
ok(/window\.OEG_BASE=/.test(xml) && /"fb":\[/.test(xml), "loader + ફાઈલ ની યાદી (fallback) થીમ માં ભરાઈ");
ok(!/styles\.css\?v=/.test(xml), "થીમ માં ?v= પિન નહીં ⇒ જૂની કૉપિ ન દબાયા કરે");
ok(/id="oeg-boot"/.test(xml), "લોડ થાય ત્યાર ની પટ્ટી (પહેલી પેઇન્ટ)");
ok(/#oeg-shell\{display:contents\}/.test(xml), "skin માં shell ની CSS ⇒ layout માં ફેર ન પડે");
const fb = (/"fb":\[([^\]]*)\]/.exec(xml) || [0, ""])[1];
const fbList = fb.split(",").filter(x => /js\//.test(x)).length;
ok(fbList >= 10, "fallback યાદી માં બધી js ફાઈલ (" + fbList + ")");
const ls = src("js/blogger-loader.js");
ok(/hosts:/.test(ls) && /unpkg\.com/.test(ls) && /raw\.githubusercontent\.com/.test(ls), "loader માં ૩ host (jsDelivr → unpkg → raw)");
ok(/raw\.githubusercontent\.com[^)]*\) >= 0 \? CFG\.cdn/.test(ls), "raw મળે તો યે js/jsDelivr થી જ (MIME ની દફતર)");
ok(/var next = function/.test(ls) && /s\.onload = fin/.test(ls) && /setTimeout\(over2, 12000\)/.test(ls), "ફાઈલ ક્રમ થી લાદાય + એક ફાઈલ ટેંગાય તો ૧૨ સે માં આગળ વધે");
ok(src("scripts/purge-cdn.mjs").includes('"index.html"'), "CI પૂર્જ યાદી માં index.html છે (markup તાજો રહે)");

/* થીમ ⇒ jsdom માં ચલાવવા યોગ્ય HTML (બ્લોગર નાં b: tag કાઢી નાખીએ) */
const toPage = (x) => {
  const skin = (/<b:skin><!\[CDATA\[([\s\S]*?)\]\]><\/b:skin>/.exec(x) || [0, ""])[1];
  return x
    .replace(/<b:skin><!\[CDATA\[[\s\S]*?\]\]><\/b:skin>/, "<style>" + skin + "</style>")
    .replace(/<b:section[^>]*id='(oeg-[a-z]+)'[^>]*>\s*<\/b:section>/g, "<div id='$1'></div>")
    .replace(/<b:section[\s\S]*?<\/b:section>/g, "")
    .replace(/<\/?b:[^>]*>/g, "")
    .replace(/<data:[^>]*\/?>/g, "")
    .replace(/^<\?xml[^>]*\?>\s*/m, "");
};

/* ---------- repo ની ફાઈલ નો mock (તાજું markup + નવી js સાબિત કરવા માટે બદલેલી) ---------- */
const freshHtml = () => {
  let h = src("index.html");
  h = h.replace(/<body>/, '<body><div id="oeg-fresh-marker" data-fresh="1"><a href="g/3.html">ધોરણ ૩ (નવું પાનું)</a>' +
    '<a href="sitemap.xml">Sitemap</a><a href="styles.css">CSS</a><img src="assets/logo.png" alt=""/>' +
    '<a href="#/quiz">ક્વિઝ</a></div>');
  return h;
};
const FILES = {};
["js/config.js", "js/i18n.js", "js/catalog.js", "js/youtube.js", "js/ads.js", "js/meta.js", "js/verify.js",
  "js/auth.js", "js/games.js", "js/cert.js", "js/quiz.js", "js/github.js", "js/notify.js", "js/admin.js",
  "js/app.js", "styles.css", "favicon.svg", "manifest.webmanifest"].forEach((f) => { FILES[f] = src(f); });
readdirSync(join(root, "data")).filter(f => f.endsWith(".json")).forEach((f) => { FILES["data/" + f] = src("data/" + f); });
FILES["index.html"] = freshHtml();
FILES["js/i18n.js"] = src("js/i18n.js") + "\n;window.__FRESH_JS = 1;\n";
FILES["assets/fonts/noto-sans-gujarati/index.css"] = "/* font */\n";
const MODE = { noIndex: false, rawOnly: false, breakApp: false };
const relOf = (url) => String(url).replace(/^https?:\/\/[^/]+\//, "").replace(/^(gh\/)?(OnlineEducationGuru\/OEG@main\/|OnlineEducationGuru\/OEG\/main\/)/, "").split("?")[0];
const hostOf = (url) => (String(url).match(/^https?:\/\/([^/]+)/) || [0, ""])[1];
/* jsdom માં <script src> / CSS એ network થી લાદાય ⇒ એ ઠેકાણે યે mock જોઈએ (interceptor) */
function bodyFor(url) {
  const u = String(url), host = hostOf(u), rel = relOf(u);
  if (!/^(cdn\.jsdelivr\.net|unpkg\.com|raw\.githubusercontent\.com|onlineeducationguru\.github\.io)$/.test(host)) return { status: 404, body: "", type: "text/plain" };
  if (rel.indexOf("index.html") >= 0) return MODE.noIndex ? { status: 404, body: "", type: "text/plain" } : { status: 200, body: FILES["index.html"], type: "text/html" };
  /* rawOnly ⇒ ફકત index.html jsDelivr/unpkg થી ન મળે (js/CSS તો CDN થી જ લાદવાનાં) */
  if (MODE.rawOnly && host !== "raw.githubusercontent.com" && rel.indexOf("index.html") >= 0) return { status: 503, body: "", type: "text/plain" };
  if (MODE.breakApp && rel === "js/app.js") return { status: 404, body: "", type: "text/plain" };
  if (FILES[rel] === undefined) return { status: 404, body: "", type: "text/plain" };
  const type = /\.json$/.test(rel) ? "application/json" : /\.css$/.test(rel) ? "text/css" : /\.js$/.test(rel) ? "application/javascript" : "text/plain";
  return { status: 200, body: FILES[rel], type };
}
const RES = requestInterceptor ? { interceptors: [requestInterceptor(async (req) => {
  const r = bodyFor(req.url);
  return new Response(r.body, { status: r.status, headers: { "Content-Type": r.type, "Access-Control-Allow-Origin": "*" } });
})] } : "usable";

const mkDom = (errs) => new JSDOM(toPage(xml), {
  runScripts: "dangerously", pretendToBeVisual: true, resources: RES, url: "https://online-educationguru.blogspot.com/#/",
  virtualConsole: (() => { const vc = new VirtualConsole(); vc.on("jsdomError", (e) => errs.push(String((e && e.message) || e))); return vc; })(),
  beforeParse(w) {
    w.matchMedia = w.matchMedia || ((q) => ({ matches: false, media: q, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } }));
    w.scrollTo = () => { };
    class Obs { constructor(cb) { this.cb = cb; } observe() { } unobserve() { } disconnect() { } takeRecords() { return []; } }
    w.IntersectionObserver = w.IntersectionObserver || Obs;
    w.ResizeObserver = w.ResizeObserver || Obs;
    w.fetch = async (u) => {
      const r = bodyFor(String(u));
      return { ok: r.status >= 200 && r.status < 300, status: r.status, text: async () => r.body, json: async () => JSON.parse(r.body), headers: { get: () => null } };
    };
  },
});
const bucket = (() => {
  const d = new Date(), p2 = (n) => String(n).padStart(2, "0");
  return "" + d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + p2(d.getUTCHours()) + p2(Math.floor(d.getUTCMinutes() / 10));
})();

/* ---------- ૧) repo માં ફેરફાર ⇒ બ્લોગર પર આપોઆપ (કંઈ upload નહીં) ---------- */
grp("૧) jsdom ⇒ થીમ ફરી upload કર્યા વગર તાજું markup + નવી js + નવી CSS");
{
  const errs = [];
  const dom = mkDom(errs);
  const w = dom.window, D = w.document;
  await sleep(1500);
  const O = w.OEG;
  ok(!!O, "બ્લોગર નું પાનું ચાલ્યું (repo થી js લાદીને)");
  ok(!!D.getElementById("oeg-fresh-marker"), "repo નું તાજું markup આપોઆપ દેખાય (થીમ માં એ કૉપિ જ હતી!)", D.getElementById("oeg-fresh-marker") ? "yes" : "no");
  ok(D.querySelectorAll("#oeg-shell header").length === 1 && D.querySelectorAll("#oeg-shell #app").length === 1, "shell માં markup બદલાયું (ડુપ્લિકેટ markup નહીં)", D.querySelectorAll("#oeg-shell header").length);
  ok(D.querySelectorAll("#oeg-shell [data-fresh]").length >= 1, "તેજું markup shell અંદર બેઠું", D.querySelectorAll("#oeg-shell [data-fresh]").length);
  ok(w.__FRESH_JS === 1, "બદલાયેલી js ફાઈલ યે આપોઆપ લાદાઈ (નવો કોડ ચાલે, pin નહીં)", w.__FRESH_JS);
  ok(/window\.OEG_BASE/.test(D.documentElement.innerHTML) === false || !!w.OEG_BASE, "OEG_BASE run-time પર સેટ થયો", String(w.OEG_BASE));
  ok(w.OEG_BASE === CDN, "બેઝ = jsDelivr (પહેલો host જ મળ્યો)", String(w.OEG_BASE));
  ok(w.OEG_V === bucket, "?b= ટૅગ (૧૦ મિનિટ) browser નો કૉપિ તાજો રાખે", String(w.OEG_V));
  const css = [...D.head.querySelectorAll("link")].map(l => l.getAttribute("href")).filter(h => /styles\.css/.test(h));
  ok(css.length === 1 && css[0] === CDN + "styles.css?b=" + bucket, "CSS તાજી (એક જ લિંક, બદલાયેલી નહીં દોહરાયેલી)", JSON.stringify(css));
  const fonts = [...D.head.querySelectorAll("link")].map(l => l.getAttribute("href")).filter(h => /assets\/fonts/.test(h));
  ok(fonts.length >= 1 && fonts.every(h => /\?b=/.test(h)), "ફોન્ટ CSS યે તાજા ટૅગ સાથે", JSON.stringify(fonts.slice(0, 2)));
  const a3 = D.querySelector('#oeg-fresh-marker a[href="#/grade/3"]');
  ok(!!a3, "તાજા markup ની SEO લિંક (g/3.html) બ્લોગર પ્રમાણે app route બની", a3 ? "#/grade/3" : JSON.stringify([...D.querySelectorAll("#oeg-fresh-marker a")].map(x => x.getAttribute("href"))));
  ok(!D.querySelector('#oeg-fresh-marker a[href="sitemap.xml"]') && !D.querySelector('#oeg-fresh-marker a[href$="OEG@main/sitemap.xml"]'), "તાજા markup ની sitemap લિંક કાઢી નાખાઈ (બ્લોગર પર અર્થહીન)");
  const cssA = D.querySelector('#oeg-fresh-marker a[href^="https://cdn.jsdelivr.net"][href*="styles.css"]');
  ok(!!cssA, "તાજા markup ની local ફાઈલ લિંક CDN પર ગઈ (બ્લોગર પર relative તૂટે નહીં)", cssA && cssA.getAttribute("href"));
  const img = D.querySelector('#oeg-fresh-marker img');
  ok(!!img && /^https:\/\/cdn\.jsdelivr\.net/.test(img.getAttribute("src")), "તાજા markup ની છબિ યે CDN થી", img && img.getAttribute("src"));
  ok(!!D.querySelector('#oeg-fresh-marker a[href="#/quiz"]'), "hash લિંક જતી તેમ રહી (કૂકી નહીં)");
  ok(!!D.querySelector("header #oeg-top"), "Layout gadget (header) તાજા markup માં ખસ્યું");
  ok(!!D.querySelector("#sidebar #oeg-side") || !!D.querySelector("aside #oeg-side"), "Layout gadget (sidebar) ખસ્યું", JSON.stringify([...D.querySelectorAll("#oeg-side")].map(x => x.parentNode.id || x.parentNode.tagName)));
  ok(!!D.querySelector("footer #oeg-foot"), "Layout gadget (footer) ખસ્યું");
  ok(!D.getElementById("oeg-boot"), "લોડ પૂરું ⇒ પટ્ટી આપોઆપ હટી");
  const realErr = errs.filter(e => !/Not implemented|Could not parse CSS|Could not load|Error: Not impl|css/i.test(e));
  ok(realErr.length === 0, "jsdom માં ૦ uncaught error", realErr.slice(0, 2).join(" | ").slice(0, 200));
  dom.window.close();

  /* ૨) repo (jsDelivr + unpkg) ફાસલો ⇒ raw થી markup લાવે, js છતાં CDN થી */
  grp("૨) jsDelivr/unpkg ફાસલો ⇒ markup raw થી, js CDN થી");
  MODE.rawOnly = true;
  const e2 = [];
  const dom2 = mkDom(e2);
  const w2 = dom2.window;
  await sleep(1500);
  ok(!!w2.document.getElementById("oeg-fresh-marker"), "બીજા host થીય markup આવી ગયું (failover કામ કરે)");
  ok(w2.OEG_BASE === CDN, "js/styles raw થી લાદાય નહીં (text/plain MIME) ⇒ CDN જ રહ્યો", String(w2.OEG_BASE));
  ok(!!w2.OEG, "અને સાઇટ ચાલ્યી");
  dom2.window.close();
  MODE.rawOnly = false;

  /* ૩) repo કુલ ન મળે ⇒ થીમ ની કૉપિ પ્રમાણે ચલાવો (ખાલી પાનું નહીં) */
  grp("૩) repo ન મળે ⇒ થીમ માં ની કૉપિ (snapshot) થી ચાલુ રાખે");
  MODE.noIndex = true;
  const e3 = [];
  const dom3 = mkDom(e3);
  const w3 = dom3.window;
  await sleep(1500);
  ok(!!w3.document.getElementById("app"), "markup (snapshot) દેખાતું રહ્યું ⇒ ખાલી પાનું નહીં");
  ok(!w3.document.getElementById("oeg-fresh-marker"), "તેજું markup ન મળ્યું એટલે કૉપિ જ વપરાઈ (જેમ જોઈએ)");
  ok(!!w3.OEG, "જૂના રસ્તા થી યે સાઇટ ચાલે (OEG લોડ થયો)");
  ok(w3.OEG_BASE === CDN, "fallback માં બેઝ = થીમ નો CDN", String(w3.OEG_BASE));
  ok(!w3.document.getElementById("oeg-boot"), "ફાઈલ લાડી એટલે પટ્ટી હટી");
  dom3.window.close();
  MODE.noIndex = false;

  /* ૪) એક ફાઈલ તૂટે ⇒ સંદેશ + ↻ (ક્રેશ નહીં) */
  grp("૪) એક js ફાઈલ ન લાડે ⇒ સંદેશ + ↻ ફરી પ્રયત્ન");
  MODE.breakApp = true;
  const dom4 = mkDom([]);
  const w4 = dom4.window;
  await sleep(1500);
  const bar = w4.document.getElementById("oeg-boot");
  ok(!!bar && /ફરી પ્રયત્ન/.test(bar.textContent), "પટ્ટી માં સંદેશ: " + (bar ? bar.textContent.trim().slice(0, 80) : "—"), bar && bar.textContent);
  ok(!!bar && /GitHub Pages/.test(bar.textContent), "સંદેશ માં Pages ની લિંક (વિદ્યાર્થી અટકી ન પડે)");
  dom4.window.close();
  MODE.breakApp = false;
}

/* ---------- ૫) --inline (જૂનો રસ્તો) હજી ચાલે ---------- */
grp("૫) --inline ⇒ જૂનો (પૂરો ભરેલો) થીમ યે બને");
{
  try { execSync("node scripts/blogger.mjs --inline", { cwd: root, stdio: "pipe" }); } catch (e) { ok(false, "--inline બિલ્ડ", String(e.message).slice(0, 160)); }
  const inl = src("blogger/OEG-Blogger-Native.xml");
  ok(/<script src="https:\/\/cdn\.jsdelivr\.net[^"]*js\/app\.js\?v=/.test(inl), "--inline માં js પિન સાથે ભરાય (escape hatch)");
  ok(!/id="oeg-shell"/.test(inl), "--inline માં loader/shell નહીં (જૂનું વર્તન)");
  execSync("node scripts/blogger.mjs", { cwd: root, stdio: "pipe" });      /* એવરગ્રીન કૉપિ પાછી લખો */
  ok(src("blogger/OEG-Blogger-Native.xml") === xml, "પાછો બનાવતાં થીમ ફાઈલ સરખી (stability ⇒ બિનજરૂરી commit નહીં)");
}

console.log("\n" + "=".repeat(50));
console.log((fail ? "\x1b[31m" : "\x1b[32m") + "==> " + pass + " PASSED / " + fail + " FAILED\x1b[0m");
process.exit(fail ? 1 : 0);
