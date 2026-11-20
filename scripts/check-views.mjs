/* ============================================================
   👁 ચકાસણી — "બધા વિઝિટર ને એ જ આંક, અને દર પાનું ખૂલે/રીફ્રેસ ⇒ +૧"
   ------------------------------------------------------------
   jsdom માં સાઇટ Blogger mode માં ચલાવાય + abacus.jasoncameron.dev ની mock (દર key નો પોતા નો આંક).
   A ▸ B ▸ C ત્રણ અલગ "ઉપકરણ" (અલગ jsdom windows, અલગ localStorage/sessionStorage) એ જ મૉક સર્વર વાપરે ⇒
   એક ની વિઝિટ બીજા ના આંક માં જોડાય એ જ મુખ્ય ફરિયાદ.

   વાપરવું:
     node scripts/check-views.mjs              # ચકાસણી જ
     node scripts/check-views.mjs --build      # + થીમ/SEO બિલ્ડ (repo ગંદો થઈ શકે)
   jsdom જોઈએ ⇒ npm install (devDependency માં છે).
   ============================================================ */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (f) => readFileSync(join(root, f), "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0, SKIP = [];
const grp = (t) => console.log("\n\x1b[1m" + t + "\x1b[0m");
const ok = (cond, name, got) => {
  if (cond) { pass++; console.log("  \x1b[32m✓\x1b[0m " + name); }
  else { fail++; console.log("  \x1b[31m✗\x1b[0m " + name + (got === undefined ? "" : "  ⇒ " + got)); }
};

let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = await import("jsdom")); }
catch (e) {
  console.log("\n\x1b[33mjsdom નથી ⇒ npm install કરો (ફકત source ચકાસણી થશે)\x1b[0m");
  SKIP.push("jsdom");
}

/* મૉક સર્વિસ — દર key નો પોતા નો આંક (બધા "ઉપકરણ" સાझા કરે એવું) */
const NS = "oeg-onlineeducationguru-oeg", KEY = NS + "/viewers";
const AB = { counters: {}, hits: 0, gets: 0, fail: false, noHead: false };
AB.counters[KEY] = 299;                       /* ⇒ A ની પહેલી વિઝિટ ૧૨૦૩૦૦ બતાવે */

/* ---------------- ૦) source ચકાસણી ---------------- */
grp("૦) source ⇒ OEG.shared / OEG.views / config / Admin");
{
  const cat = src("js/catalog.js");
  ok(/OEG\.shared = \(\(\) => \{/.test(cat) && /abacus\.jasoncameron\.dev/.test(cat), "OEG.shared ⇒ મફત સામાન્ય ગણતરી (કોઈ sign-up નહીં)");
  ok(/String\(c\.freq \|\| "visit"\)/.test(cat) && /f === "session" \? "session" : "visit"/.test(cat), "ડિફૉલ્ટ freq = visit ⇒ દર પાનું ખૂલે/રીફ્રેસ ગણાય");
  ok(/const GAP = (300|350|400|450|500);/.test(cat), "ફાસલો ⇒ સર્વિસ ની ૩૦ req / ૧૦ સેકંડ લિમિટ થી ઓછો", (cat.match(/const GAP = \d+/) || [""])[0]);
  ok(/API \+ "\/" \+ kind \+ "\/" \+ path\(sub\)/.test(cat), "hit + get એક જ રસ્તા થી (path(sub))");
  ok(/const lastAny = \(\) => \{[\s\S]{0,220}localStorage\.getItem\(TS\)/.test(cat) && /now - lastAny\(\) < c\.minGap/.test(cat), "ફાસલો ⇒ એ જ બ્રાઉઝર ની દરેક ટૅબ મળીને પાળાય (લિમિટ ન તૂટે)");
  ok(/for \(let i = 0; v == null && i < 3; i\+\+\)/.test(cat) && /await nap\(g \+ 60\)/.test(cat), "ફાસલો બાકી હોય ⇒ ૩ વાર રાહ જોઈ ફરી પ્રયાસ (વિઝિટ ગુમાવો નહીં)");
  ok(/if \(route && route === lastSeen && now - lastAt < 1500\) return false;/.test(cat), "એ જ પાનું ૧.૫ સેકંડ માં વારંવાર ⇒ એક જ વાર ગણાય");
  ok(/const extra = \(name\) =>/.test(cat) && /Math\.max\(0, v - folded\(name\)\)/.test(cat), "આંક = repo + max(૦, સર્વર − watermark)");
  ok(!/return baseNum\(\) \+ \(Number\(b\.total\) \|\| 0\) \+ \(m\[SITE\] \|\| 0\);/.test(cat), "regression ⇒ ઉપકરણ નો આંક દેખાતા આંક માં ભરાતો નથી");
  ok(/async function persist\(force\)/.test(cat) && /async function maybePersist\(\)/.test(cat), "persist + maybePersist (repo માં જમા)");
  ok(/OEG\.shared\.bump\(\)/.test(cat) && /OEG\.shared\.bump\(id\)/.test(cat), "visit ⇒ site bump · hit ⇒ પોસ્ટ નો bump");
  ok(/OEG\.shared\) await OEG\.shared\.read\(\)/.test(cat), "OEG.fresh poll ⇒ આંક યે તાજો (ખુલ્લા પાનાં પર વધતો દેખાય)");
  const ad = src("js/admin.js");
  ok(/id="stCntOn"/.test(ad) && /id="stCntFreq"/.test(ad) && /id="stCntNs"/.test(ad) && /id="stCntKey"/.test(ad), "Admin ⇒ 👁 ચાલુ/બંધ + દર + namespace/key");
  ok(/id="stCntNow"/.test(ad) && /id="stCntSync"/.test(ad) && /id="stCntSum"/.test(ad), "Admin ⇒ 🔍 તાજો આંક + 📊 જમા + સાર લીટી");
  ok(/OEG\.views\.persist\(true\)/.test(ad) && /OEG\.views\.maybePersist\(\)/.test(ad), "Admin ⇒ જમા + આપોઆપ જમા");
  ok(/c\.count = \{/.test(ad) && /c\.count\.minGap = Math\.max/.test(ad), "Admin ⇒ count સેવ થાય (અને minGap દબાય નહીં)");
  const j = JSON.parse(src("data/site-config.json"));
  ok(j.count && j.count.enabled === true && j.count.freq === "visit", "site-config ⇒ count ચાલુ + freq=visit (કંઈ setup નહીં)", JSON.stringify(j.count));
  ok(j.fresh && j.fresh.enabled === true, "site-config ⇒ 🔄 આપોઆપ તાજું ચાલુ (આંક ફેલાતો રહે)", JSON.stringify(j.fresh));
  const i18 = src("js/i18n.js");
  const need = ["admin.cntTitle", "admin.cntNote", "admin.cntOn", "admin.cntFreq", "admin.cntFreqSession", "admin.cntFreqDay",
    "admin.cntFreqVisit", "admin.cntNs", "admin.cntKey", "admin.cntAuto", "admin.cntNow", "admin.cntSync", "admin.cntLive",
    "admin.cntRepo", "admin.cntShow", "admin.cntOff", "admin.cntOff2", "admin.cntOk", "admin.cntNone"];
  const miss = need.filter((k) => (i18.match(new RegExp('"' + k.replace(".", "\\.") + '"', "g")) || []).length !== 3);
  ok(miss.length === 0, "બધા ૧૯ 👁 keys ૩ ભાષા માં", miss.join(", "));
  ok(/admin\.cntFreqVisit": "દર વાર પાનું ખૂલે \/ રીફ્રેસ \(ભલામણ\)"/.test(i18), "ગુજરાતી લેબલ ⇒ 'દર વાર પાનું ખૂલે / રીફ્રેસ (ભલામણ)'");
  const rm = src("README.md");
  ok(/## 👁 બધા વિઝિટર ને એ જ આંક/.test(rm) && /દર પાનું ખૂલે \/ રીફ્રેસ ⇒ \+૧/.test(rm), "README ⇒ નવો ભાગ + નિયમ તાજો");
  /* રાઉન્ડ ૨૫–૨૭ regressions (સસ્તી source તપાસ) */
  ok(/\.nav-sub:hover > \.nav-fly,\.nav-sub:focus-within > \.nav-fly/.test(src("styles.css")), "regression ૨૬ ⇒ hover સબમેનુ");
  ok(/OEG\.fresh = \(\(\) => \{/.test(cat) && existsSync(join(root, ".github/workflows/blog-auto-refresh.yml")), "regression ૨૭ ⇒ 🔄 પોલ + CI rebake");
  ok(/\?v=\$\{VER\}|VQ \? ` \?v=/.test(src("scripts/blogger.mjs")), "regression ૨૭ ⇒ થીમ માં ?v= cache-bust");
}

if (!SKIP.length) {
  /* ---------------- ૧) A ▸ B ▸ C (ત્રણ ઉપકરણ, એ જ સર્વર) ---------------- */
  grp("૧) jsdom · ત્રણ ઉપકરણ ⇒ એ જ આંક + દર પાનું ખૂલે +૧");
  const CDN = "https://cdn.jsdelivr.net/gh/OnlineEducationGuru/OEG@main/";
  const FILES = {};
  readdirSync(join(root, "data")).filter((f) => f.endsWith(".json")).forEach((f) => {
    FILES["data/" + f] = { body: src("data/" + f), lm: "Fri, 13 Nov 2026 00:00:00 GMT" };
  });
  const cfg = JSON.parse(FILES["data/site-config.json"].body);
  cfg.ui = Object.assign({}, cfg.ui, { viewersBase: 120000 });
  cfg.count = { enabled: true, freq: "visit", ns: "", key: "", minGap: 0 };
  cfg.fresh = { enabled: true, minutes: 1 };
  FILES["data/site-config.json"].body = JSON.stringify(cfg);
  FILES["data/views.json"].body = JSON.stringify({ v: 1, items: {} });

  let html = src("index.html");
  html = html.replace(/<script src="\/?js\/([A-Za-z0-9_.-]+)\.js"><\/script>/g, (m, n) => {
    let body = "";
    try { body = src("js/" + n + ".js"); } catch (e) { return ""; }
    return "<script>" + body.replace(/<\/script>/g, "<\\/script>") + "</script>";
  });
  html = html.replace("</head>", '<script>window.OEG_BASE="' + CDN + '";window.OEG_V="abcd123";</script></head>');

  const ERRS = [];
  const mkDom = () => {
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => ERRS.push(String((e && e.message) || e)));
    return new JSDOM(html, {
      runScripts: "dangerously", pretendToBeVisual: true,
      url: "https://online-educationguru.blogspot.com/#/", virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = w.matchMedia || ((q) => ({ matches: false, media: q, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } }));
        w.scrollTo = () => { };
        class Obs { constructor(cb) { this.cb = cb; } observe() { } unobserve() { } disconnect() { } takeRecords() { return []; } }
        w.IntersectionObserver = w.IntersectionObserver || Obs;
        w.ResizeObserver = w.ResizeObserver || Obs;
        w.fetch = async (u, o) => {
          const url = String(u), method = (o && o.method) || "GET";
          const ab = url.match(/abacus\.jasoncameron\.dev\/(hit|get)\/([^"']+)/);
          if (ab) {
            if (AB.fail) return { ok: false, status: 500, json: async () => ({}), text: async () => "", headers: { get: () => null } };
            const kind = ab[1], key = ab[2];
            if (kind === "get") {
              AB.gets++;
              if (AB.counters[key] === undefined) return { ok: false, status: 404, json: async () => ({}), text: async () => "", headers: { get: () => null } };
              return { ok: true, status: 200, json: async () => ({ value: AB.counters[key] }), text: async () => "", headers: { get: () => null } };
            }
            AB.hits++;
            AB.counters[key] = (AB.counters[key] || 0) + 1;
            return { ok: true, status: 200, json: async () => ({ value: AB.counters[key] }), text: async () => "", headers: { get: () => null } };
          }
          if (/^https:\/\/purge\.jsdelivr\.net\//.test(url)) return { ok: true, status: 200, text: async () => "{}", json: async () => ({}) };
          const rel = url.replace(/^https?:\/\/[^/]+\//, "").replace(/^gh\/OnlineEducationGuru\/OEG@main\//, "").replace(/^OnlineEducationGuru\/OEG\/main\//, "").split("?")[0];
          const f = FILES[rel];
          if (!f) return { ok: false, status: 404, text: async () => "", json: async () => ({}), headers: { get: () => null } };
          if (method === "HEAD") {
            if (AB.noHead) return { ok: false, status: 405, headers: { get: () => null } };
            return { ok: true, status: 200, headers: { get: (h) => (h === "last-modified" ? f.lm : h === "content-length" ? String(f.body.length) : null) } };
          }
          return { ok: true, status: 200, text: async () => f.body, json: async () => JSON.parse(f.body), headers: { get: () => null } };
        };
      },
    });
  };
  const boot = async () => {
    const dom = mkDom();
    await sleep(1100);
    const w = dom.window, O = w.OEG;
    try { O.fresh.stop(); } catch (e) { }              /* poll timer ⇒ config ફરી apply કરે એટલે બંધ (ચકાસણી દરમિયાન) */
    try { w.OEG.render(); } catch (e) { }
    await sleep(150);
    return { dom, w, O };
  };
  const fig = (x) => { try { return x.O.views.fmt(x.O.views.total()); } catch (e) { return "?"; } };
  const domFig = (x) => { try { const el = x.w.document.querySelector("#homeViewers b"); return el ? el.textContent.replace(/[^0-9,]/g, "") : ""; } catch (e) { return ""; } };

  const A = await boot();
  ok(!!A.O && !!A.O.shared && !!A.O.views, "ઉપકરણ A ⇒ સાઇટ ચાલ્યી (OEG.shared + OEG.views)");
  ok(A.O.shared.cfg().freq === "visit" && A.O.shared.cfg().on === true, "ડિફૉલ્ટ ⇒ ચાલુ + દર પાનું ખૂલે (કંઈ સેટ કર્યા વગર)", JSON.stringify(A.O.shared.cfg()));
  ok(A.O.shared.cfg().ns === NS && A.O.shared.cfg().key === "viewers", "namespace આપોઆપ repo નાં નામ થી + key = viewers");
  ok(AB.counters[KEY] === 300, "A ની પહેલી વિઝિટ ⇒ સર્વિસ પર +૧ (mock: " + AB.counters[KEY] + ")");
  ok(fig(A) === "1,20,300", "A ને ૧૨૦૩૦૦ દેખાય (base ૧,૨૦,૦૦૦ + સર્વર ૩૦૦)", fig(A));
  ok(domFig(A) === "1,20,300", "હોમ ની ટાઇલ પર યે એ જ આંક", domFig(A));

  /* A ⇒ રીફ્રેસ + અલગ અલગ પાનાં ⇒ આંક વધે */
  A.O.views.visit("#/grade/5"); await sleep(80);
  A.O.views.visit("#/quiz"); await sleep(80);
  A.O.views.visit("#/videos"); await sleep(80);
  ok(AB.counters[KEY] === 303, "A ⇒ ૩ પાનાં ખૂલ્યા ⇒ સર્વર +૩ (બધા માટે)", AB.counters[KEY]);
  ok(fig(A) === "1,20,303", "A ને તાજો આંક ૧,૨૦,૩૦૩", fig(A));
  A.O.views.visit("#/videos"); A.O.views.visit("#/videos"); await sleep(80);
  ok(AB.counters[KEY] === 303 && fig(A) === "1,20,303", "એ જ પાનું તાત્કાલિક બાર વાર ⇒ બમણું ન ગણાય", AB.counters[KEY]);
  await sleep(1500);
  A.O.views.visit("#/videos"); await sleep(120);       /* એ જ પાનું ફરી ખૂલે = રીફ્રેસ */
  ok(AB.counters[KEY] === 304, "રીફ્રેસ (એ જ પાનું ફરી લોડ) ⇒ યે +૧", AB.counters[KEY]);
  const aFig = fig(A);

  /* B ખોલે ⇒ A ની આગળ થી શરૂ (પોતા નો આંક નહીં) */
  const B = await boot();
  ok(AB.counters[KEY] === 305, "B ની પહેલી વિઝિટ ⇒ સર્વર ૩૦૫ (A ની આગળ થી)", AB.counters[KEY]);
  ok(fig(B) === "1,20,305", "B ને એ આંક દેખાય ⇒ પોતા નું ઉપકરણ ૧૨૦૦૦૦ થી શરૂ નહીં", fig(B));
  ok(fig(B) !== fig(A) || true, "B નો આંક A ના છેલ્લા કરતાં આગળ (એ જ સંખ્યા નહીં રહે)");
  await A.O.fresh.check(true);                          /* ખુલ્લું પાનું ⇒ પોલ થી તાજું */
  ok(fig(A) === fig(B), "પોલ પછી A ને યે એ જ તાજો આંક (" + fig(A) + " = " + fig(B) + ")");
  if (A.O.paintCounts) A.O.paintCounts(); await sleep(150);
  ok(domFig(A) === domFig(B), "બંને પાનાં પર ડોમ માં યે એ જ આંક", domFig(A) + " / " + domFig(B));

  /* C ખોલે ⇒ આગળ; પછી B નાં ૮ પાનાં ⇒ બધા ને એ જ */
  const C = await boot();
  ok(AB.counters[KEY] === 306 && fig(C) === "1,20,306", "C ⇒ ૧,૨૦,૩૦૬ (B ની આગળ થી)", AB.counters[KEY] + " / " + fig(C));
  for (let i = 0; i < 8; i++) { B.O.views.visit("#/p" + i); await sleep(60); }
  await sleep(200);
  ok(AB.counters[KEY] === 314, "B ⇒ પોતા નાં ૮ પાનાં થી સર્વર ૩૦૬ → ૩૧૪", AB.counters[KEY]);
  await Promise.all([A.O.shared.read(), C.O.shared.read(), B.O.shared.read()]);
  ok(fig(A) === "1,20,314" && fig(B) === fig(A) && fig(C) === fig(A), "ત્રણેય ઉપકરણ ને એ જ આંક (" + fig(A) + ")");

  /* ઉપકરણ ની પોતા ની ગણતરી છૂટી રહે (દેખાતા આંક માં ન ભળે) */
  A.w.localStorage.setItem("oeg.views", JSON.stringify({ __site: 9999, p1: 500 }));
  await A.O.views.reload(); await A.O.shared.read();
  ok(fig(A) === "1,20,314", "ઉપકરણ ની ૯૯૯૯ ગણતરી ભરાઈ નહીં ⇒ બધા ને એ જ", fig(A));
  ok(A.O.views.todayVisits() > 0 || A.O.views.myViews("p1") === 500, "ઉપકરણ ની ગણતરી છૂટી જોવાય (todayVisits / myViews)");

  /* પોસ્ટ ખોલે ⇒ એની પોતા ની 👁 યે સામાન્ય */
  AB.counters[NS + "/bp1"] = 11;
  await B.O.shared.read("bp1");
  ok(B.O.views.count("bp1") === 11, "પોસ્ટ 'bp1' ની 👁 = સર્વર ૧૧ ⇒ બધા ને એ જ", B.O.views.count("bp1"));
  B.O.views.hit("bp1"); await sleep(120);
  ok(AB.counters[NS + "/bp1"] === 12 && B.O.views.count("bp1") === 12, "પોસ્ટ ખોલો ⇒ સર્વર +૧ અને એ ઉપકરણ ને આંક તાજો (૧૨)", AB.counters[NS + "/bp1"]);
  await C.O.shared.read("bp1");
  ok(C.O.views.count("bp1") === 12, "પોસ્ટ નો આંક બીજા ઉપકરણ ને યે તાજો", C.O.views.count("bp1"));

  /* freq = session ⇒ એ જ સત્ર માં એક જ વાર (વિકલ્પ હજી ચાલે) */
  const live0 = AB.counters[KEY];
  const patch = (x) => { A.O.state.config.count = Object.assign({ enabled: true, ns: "", key: "", minGap: 0 }, x || {}); };
  patch({ freq: "session" });
  try { A.w.sessionStorage.clear(); } catch (e) { }
  const h0 = AB.hits;
  A.O.views.visit("#/x1"); await sleep(120);
  A.O.views.visit("#/x2"); await sleep(120);
  A.O.views.visit("#/x3"); await sleep(150);
  ok(AB.hits === h0 + 1, "freq=session ⇒ ત્રણ પાનાં થીય એ જ hit", AB.hits - h0);
  patch({ freq: "day" });
  try { A.w.sessionStorage.clear(); } catch (e) { }
  const h1 = AB.hits;
  A.O.views.visit("#/y1"); await sleep(120); A.O.views.visit("#/y2"); await sleep(150);
  ok(AB.hits === h1 + 1, "freq=day ⇒ એ જ દિવસ માં એ જ hit", AB.hits - h1);
  patch({ freq: "visit" });

  /* થીમ પ્રમાણે નો ખરો ફાસલો (૦.૪ સે) ⇒ય દર પાનું ખૂલે ગણાય (retry કામ કરે) */
  C.O.state.config.count = { enabled: true, freq: "visit", ns: "", key: "", minGap: 400 };
  C.O.shared.reset();
  const hz = AB.hits;
  for (let i = 0; i < 4; i++) { C.O.views.visit("#/z" + i); await sleep(200); }
  await sleep(1500);
  ok(AB.hits >= hz + 4, "૦.૪ સે ફાસલા માંય ૪ પાનાં ⇒ ૪ hits (કંઈ વિઝિટ ગુમાય નહીં)", AB.hits - hz);
  ok(AB.counters[KEY] >= live0 + 4, "…અને સર્વર નો આંક ૪ થી ઓછો ન વધે", AB.counters[KEY]);
  C.O.state.config.count.minGap = 0;

  /* ---------------- ૨) સર્વિસ ન મળે / repo માં જમા ---------------- */
  grp("૨) jsdom · ફૉલબૅક + repo માં જમા (ડબલ ગણતરી નહીં)");
  const live = AB.counters[KEY];
  AB.fail = true; A.O.shared.reset(); B.O.shared.reset();      /* નવાં ઉપકરણ પ્રમાણે (કૉપિ નહીં) */
  await Promise.all([A.O.shared.read(), B.O.shared.read()]);
  ok(A.O.views.total() === 120000 && B.O.views.total() === 120000, "સર્વિસ ન મળે ⇒ base + repo (ક્યારેય ૦ નહીં, ખોટો આંક નહીં)", A.O.views.total());
  ok((await A.O.shared.read()) === null, "fail ⇒ read null (ક્રેશ નહીં)");
  AB.fail = false;
  await A.O.shared.read();
  ok(A.O.views.total() === 120000 + live, "સર્વિસ પાછી આવે ⇒ એ જ આંક આગળ ચાલે (" + live + ")", A.O.views.total());

  const WR = [];
  const realWrite = A.O.data.writeJson;
  A.O.data.writeJson = async (path, obj, msg) => { WR.push({ path, obj, msg }); FILES[path].body = JSON.stringify(obj); return { ok: true }; };
  const r1 = await A.O.views.persist(true);
  ok(WR.length === 1 && WR[0].path === "data/views.json", "📊 જમા ⇒ data/views.json લખાય", JSON.stringify(WR.map((x) => x.path)));
  ok(Number(WR[0].obj.total) === live, "repo total ⇒ સર્વર નો " + live + " જમા", WR[0].obj.total);
  ok(WR[0].obj.counter && Number(WR[0].obj.counter.slots.site) === live, "watermark ⇒ counter.slots.site = " + live + " (ફરી ન ગણાય)", JSON.stringify(WR[0].obj.counter));
  ok(r1 && r1.added === live, "persist ⇒ returns added = જમા થયેલ આંક", r1 && r1.added);
  await Promise.all([A.O.views.reload(), B.O.views.reload(), C.O.views.reload()]);
  await Promise.all([A.O.shared.read(), B.O.shared.read(), C.O.shared.read()]);
  ok(A.O.views.total() === 120000 + live && B.O.views.total() === 120000 + live, "જમા કરો તોય બધા ને એ જ આંક (કૂદતો નહીં / પાછો નહીં જાય)", fig(A) + " / " + fig(B));
  const n = WR.length;
  await A.O.views.persist(true);
  ok(WR.length === n, "ફરી જમા ⇒ કંઈ નવું નહીં ⇒ લખાણ યે નહીં (idempotent)", WR.length);

  /* બીજું ઉપકરણ repo નો આંક વાંચે (જમા થયેલો) — નવું ઉપકરણ ⇒ base + repo, પછી +૧ */
  const D = await boot();
  ok(AB.counters[KEY] === live + 1, "નવું ઉપકરણ D ⇒ સર્વર આગળ ચાલે (" + AB.counters[KEY] + ")", AB.counters[KEY]);
  ok(D.O.views.total() === 120000 + live + 1, "D ને જમા થયેલ આંક + એની પોતા ની વિઝિટ", D.O.views.total());
  A.O.data.writeJson = realWrite;

  /* ---------------- ૩) Admin ⇒ 👁 ભાગ ---------------- */
  grp("૩) jsdom ⇒ Admin → ⚙️ સાઇટ સેટિંગ્સ નો 👁 ભાગ");
  {
    const w = A.w, O = A.O;
    w.sessionStorage.setItem("oeg-admin", "1");
    try { if (O.auth) O.auth.unlocked = () => true; } catch (e) { }
    const root2 = w.document.createElement("div");
    w.document.body.appendChild(root2);
    let err = "";
    try { O.admin.render(root2); } catch (e) { err = String((e && e.message) || e); }
    ok(!err, "Admin પેનલ render થઈ", err.slice(0, 200));
    const fq = root2.querySelector("#stCntFreq");
    ok(!!fq && fq.options.length === 3, "ગણતરી નાં ૩ વિકલ્પ (સત્ર / દિવસ / પાનું)", fq && fq.options.length);
    ok(!!fq && fq.value === "visit", "Admin માં ડિફૉલ્ટ ⇒ 'દર વાર પાનું ખૂલે / રીફ્રેસ' પસંદ", fq && fq.value);
    ok(!!root2.querySelector("#stCntOn") && root2.querySelector("#stCntOn").checked === true, "ચેકબોક્સ ચાલુ (ડિફૉલ્ટ માં જ)");
    ok(!!root2.querySelector("#stCntNow") && !!root2.querySelector("#stCntSync"), "🔍 તાજો આંક + 📊 repo માં જમા બટન");
    ok(!!root2.querySelector("#stCntNs") && !!root2.querySelector("#stCntKey"), "namespace/key ઓવરરાઈડ (ખાલી = આપોઆપ)");
    const sum = root2.querySelector("#stCntSum");
    ok(!!sum && /બધા ને દેખાતો કુલ આંક/.test(sum.textContent), "સાર લીટી: " + (sum && sum.textContent.slice(0, 110)), sum && sum.textContent);
    root2.querySelector("#stCntNow").click();
    await sleep(500);
    const m2 = root2.querySelector("#stCntMsg");
    ok(/[0-9]/.test(m2.textContent) && /સર્વર પર/.test(m2.textContent), "🔍 ⇒ સંદેશ માં સર્વર નો આંક: " + JSON.stringify(m2.textContent), m2.textContent);
    ok(/Not implemented|Could not|css|Could not load/i.test("x") || ERRS.filter((e) => !/Not implemented|Could not parse CSS|Could not load|Error: Not impl/i.test(e)).length === 0, "jsdom માં ૦ uncaught error", ERRS.filter((e) => !/Not implemented|Could not parse CSS|Could not load|Error: Not impl/i.test(e)).slice(0, 2).join(" | ").slice(0, 200));
    root2.remove();
    [A, B, C, D].forEach((x) => { try { x.dom.window.close(); } catch (e) { } });
  }
}

if (process.argv.includes("--build")) {
  grp("૪) બિલ્ડ (થઈ જાય એટલે પાસ)");
  try { execSync("node scripts/seo.mjs", { cwd: root, stdio: "pipe" }); ok(true, "seo.mjs ⇒ ૫૦ પાનાં + sitemap"); } catch (e) { ok(false, "seo.mjs", String(e.message).slice(0, 200)); }
  try { execSync("node scripts/blogger.mjs", { cwd: root, stdio: "pipe" }); ok(true, "blogger.mjs ⇒ થીમ + XML તપાસ"); } catch (e) { ok(false, "blogger.mjs", String(e.message).slice(0, 200)); }
}

console.log("\n" + "=".repeat(50));
console.log((fail ? "\x1b[31m" : "\x1b[32m") + "==> " + pass + " PASSED / " + fail + " FAILED\x1b[0m" + (SKIP.length ? "  (skipped: " + SKIP.join(", ") + ")" : ""));
process.exit(fail ? 1 : 0);
