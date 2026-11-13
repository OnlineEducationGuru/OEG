import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const scripts = ["js/config.js","js/i18n.js","js/catalog.js","js/auth.js","js/games.js","js/github.js","js/admin.js","js/app.js"]
  .map(f => `<script>${readFileSync(f,"utf8")}</script>`).join("");

/* live repo data, deliberately CORRUPTED the way the old bug did (utf8 → latin1) */
const goodCatalog = readFileSync("data/catalog.json","utf8");
const corrupted = JSON.stringify(JSON.parse(goodCatalog), (k,v) =>
  typeof v === "string" ? [...new TextEncoder().encode(v)].map(b => String.fromCharCode(b)).join("") : v);
const store = { "data/catalog.json": corrupted };
let puts = [];

const dom = new JSDOM(html.replace(/<script src="[^"]+"><\/script>/g,"") + scripts, {
  url: "http://localhost:8080/", runScripts: "dangerously", pretendToBeVisual: true,
  beforeParse(w) {
    w.matchMedia = () => ({ matches: false });
    w.IntersectionObserver = class { observe(){} };
    w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
    const adminJson = readFileSync("data/admin.json","utf8");
    const b64 = (s) => Buffer.from(s,"utf8").toString("base64");
    w.fetch = async (url, o) => {
      const u = String(url), method = (o && o.method) || "GET";
      if (method === "PUT" || method === "POST" || method === "DELETE") {
        puts.push({ u, body: o && o.body ? JSON.parse(o.body) : null });
        const m = u.match(/\/contents\/([^?]+)/);
        if (m && method === "PUT") { store[m[1]] = Buffer.from(JSON.parse(o.body).content, "base64").toString("utf8"); }
        return { ok: true, json: async () => ({ sha: "newsha", content: { sha: "newsha" }, object: { sha: "s" }, tree: { sha: "t" } }) };
      }
      if (u.includes("api.github.com/repos/OnlineEducationGuru/OEG/contents/")) {
        const p = decodeURIComponent(u.split("/contents/")[1].split("?")[0]);
        if (store[p] !== undefined) return { ok: true, json: async () => ({ content: b64(store[p]), sha: "sha-" + p }) };
        return { ok: false, json: async () => ({ message: "Not Found" }) };
      }
      if (u.includes("raw.githubusercontent.com/")) {
        const p = u.split("/OEG/main/")[1];
        if (p === "data/admin.json") return { ok: true, json: async () => JSON.parse(adminJson) };
        if (store[p] !== undefined) return { ok: true, json: async () => JSON.parse(store[p]) };
        return { ok: false, json: async () => ({}) };
      }
      const path = u.replace("http://localhost:8080/","").split("?")[0];
      if (path === "data/catalog.json") return { ok: true, json: async () => JSON.parse(store["data/catalog.json"]) };
      for (const f of ["data/site-config.json","data/users.json","data/admin.json"]) if (path === f) return { ok: true, json: async () => JSON.parse(readFileSync(f,"utf8")) };
      return { ok: false, json: async () => ({}) };   // translate API offline → fallback
    };
  }
});
const w = dom.window; await new Promise(r => setTimeout(r, 1000));
const d = w.document;
let pass = 0, fail = 0;
const ok = (n, c) => { c ? (pass++, console.log("  ✅", n)) : (fail++, console.log("  ❌", n)); };

console.log("\n[1] 🛡️ Admin login card (visitor view)");
w.location.hash = "#/admin"; await new Promise(r => setTimeout(r, 400));
const card = d.querySelector(".form-card"); const ct = card.textContent;
ok("no 'Fine-grained'/'PAT'/'github' wording", !/fine-grained|PAT|github_pat|token/i.test(ct));
ok("no step-by-step help box on login page", !d.getElementById("admHelp") && !d.getElementById("admHelpBtn"));
ok("no ❓ howTo link on login card", ct.indexOf("ક્યાંથી મેળવવો") < 0);
ok("email NOT prefilled", d.querySelector('#admForm [name=email]').value === "");
ok("autofill off (email)", d.querySelector('#admForm [name=email]').getAttribute("autocomplete") === "off" && d.querySelector('#admForm [name=email]').hasAttribute("readonly"));
ok("autofill off (password)", d.querySelector('#admForm [name=password]').getAttribute("autocomplete") === "off");
ok("secret box hidden behind 🔑 toggle", d.getElementById("admTokWrap").style.display === "none" && !!d.getElementById("admTokToggle"));
d.getElementById("admTokToggle").click();
ok("toggle reveals secret code field", d.getElementById("admTokWrap").style.display === "block");

console.log("\n[2] 🔐 base64+hash admin.json (v2) login");
const adm = await w.OEG.auth.getAdminFile();
ok("email decoded from base64", adm.email === "hm89patel78@gmail.com");
ok("hash mode detected", adm.hash.length === 64 && adm.plain === "");
ok("adminConfigured → true", w.OEG.auth.adminConfigured(adm));
const pwKnown = require_pw = "Haresh@8978#";   // owner's current password (pre-hash value)
const sha = await (async () => { const b = new TextEncoder().encode(pwKnown); const h = await w.crypto.subtle.digest("SHA-256", b); return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join(""); })();
ok("stored hash == sha256(owner pw)", sha === adm.hash);
w.OEG.state.gh.token = "";
const r1 = await w.OEG.auth.loginAdmin({ email: "hm89patel78@gmail.com", password: pwKnown, token: "" });
ok("login with owner password works", !!r1.ok && w.OEG.canAdmin());

console.log("\n[3] Tolerant formats (direct GitHub hand-edits)");
const A = (o) => w.OEG.auth.parseAdminCreds(o);
ok("plain pass field", A({ email: "X@Y.com", pass: "MyNewPass1" }).plain === "MyNewPass1");
ok("legacy passHash hex", A({ email: "x@y.com", passHash: "a".repeat(64) }).hash === "a".repeat(64));
ok("v2 full form", A({ v:2, email: w.btoa("x@y.com"), pass: "b".repeat(64) }).email === "x@y.com");
ok("base64 + sha256: prefix", A({ email: "x@y.com", pass: w.btoa("sha256:" + "c".repeat(64)) }).hash === "c".repeat(64));
try { await w.OEG.auth.loginAdmin({ email: "hm89patel78@gmail.com", password: "totally-wrong-1", token: "" }); ok("wrong password rejected", false); }
catch (e) { ok("wrong password rejected", true); }

console.log("\n[4] 📝 Post editor: one language → all three + no mojibake on write");
w.location.hash = "#/admin"; await new Promise(r => setTimeout(r, 300));
ok("panel mounted", !!d.getElementById("adminMount"));
ok("🌐 translate button + source-lang select", !!d.getElementById("pTrBtn") && !!d.getElementById("pSrcLang"));
ok("guide kept inside panel (connect)", !!d.getElementById("ghHelpBtn"));
d.getElementById("pTitleGu").value = "નવી પરીક્ષા નોટિસ";
d.getElementById("pDesc").value = "ધોરણ ૯ ની પરೀક્ષા ૧૨/૧૨ ના રોજ.";
d.getElementById("pBody").value = "વિદ્યાર્થીઓ તૈયારી કરે.";
puts = [];
d.getElementById("pSave").click(); await new Promise(r => setTimeout(r, 900));
const put = puts.find(p => p.u.includes("data/catalog.json"));
ok("catalog PUT sent", !!put);
const written = JSON.parse(put.body.content ? Buffer.from(put.body.content, "base64").toString("utf8") : store["data/catalog.json"]);
const saved = written.items[0];
ok("title in 3 langs (offline → copy fallback)", !!saved.title.gu && !!saved.title.hi && !!saved.title.en);
ok("desc auto-filled in 3 langs", !!saved.desc.gu && !!saved.desc.hi && !!saved.desc.en);
ok("body auto-filled in 3 langs", !!saved.body.gu && !!saved.body.hi && !!saved.body.en);
ok("Gujarati written correctly (no mojibake)", saved.title.gu === "નવી પરીક્ષા નોટિસ" && saved.desc.gu.startsWith("ધોરણ ૯"));
ok("existing items repaired on write-back", written.items.some(i => i.id === "tb-balvatika-1" && i.title.gu.startsWith("બાલવાટિકા")));

console.log("\n[5] 🧁 Live corrupted file → site still shows proper Gujarati");
w.location.hash = "#/textbooks"; await new Promise(r => setTimeout(r, 400));
const txt = d.getElementById("app").textContent;
ok("site renders repaired text", txt.includes("બાલવાટિકા") || txt.includes("પાઠ્યપુસ્તક"));
ok("no mojibake rendered", !/àª|â€/.test(txt));

console.log("\n[6] 🚪 logout re-locks + home intact");
w.OEG.auth.logout();
ok("canAdmin false after logout", !w.OEG.canAdmin());
w.location.hash = "#/"; await new Promise(r => setTimeout(r, 400));
ok("6 feature cards", d.querySelectorAll(".feature-card").length === 6);
ok("no download buttons", d.querySelectorAll("a[download]").length === 0);
for (const lang of ["hi","en"]) { w.OEG.state.lang = lang; ok(`i18n ${lang} keys`, w.OEG.t("admin.useSecret").length > 5 && w.OEG.t("admin.trBtn").length > 3); }
w.OEG.state.lang = "gu";
ok("gu howTo still in panel copy", w.OEG.t("admin.howBody").includes("personal-access-tokens"));
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
