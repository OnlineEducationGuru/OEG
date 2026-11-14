#!/usr/bin/env node
/* ============================================================
   scripts/purge-cdn.mjs — jsDelivr ની @main કૉપિ તાજી કરો
   ------------------------------------------------------------
   બ્લોગર થીમ ફાઈલો https://cdn.jsdelivr.net/gh/<repo>@main/ થી લાદે, અને એ કૉપિ
   દિવસો સુધી જૂની રહી શકે ⇒ નવું push કર્યું છતાં બ્લોગ પર જૂનું દેખાય (Ctrl+Shift+R
   એ ફક્ત browser નો કૉપિ હટાવે, CDN નો નહીં). એટલે push પછી એક વાર દોડાવો:

     node scripts/purge-cdn.mjs                (બધી મુખ્ય ફાઈલ)
     node scripts/purge-cdn.mjs styles.css js/app.js
     node scripts/purge-cdn.mjs --all          (repo ની બધી js/css/json)
   ============================================================ */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const cfg = JSON.parse(readFileSync(join(root, "data/site-config.json"), "utf8"));
const g = cfg.github || {};
const owner = g.owner || "OnlineEducationGuru";
const repo = g.repo || "OEG";
const branch = g.branch || "main";
const argv = process.argv.slice(2);
const all = argv.includes("--all");
const args = argv.filter((a2) => !a2.startsWith("--"));

const CORE = ["index.html", "styles.css", "sw.js", "manifest.webmanifest", "favicon.svg",
  "js/config.js", "js/i18n.js", "js/catalog.js", "js/youtube.js", "js/ads.js", "js/meta.js",
  "js/verify.js", "js/auth.js", "js/games.js", "js/cert.js", "js/quiz.js", "js/github.js",
  "js/notify.js", "js/admin.js", "js/app.js", "data/site-config.json", "data/catalog.json",
  "data/quiz.json", "data/views.json", "data/notice.json", "data/registrations.json", "data/users.json"];

function walk(d, out) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|css|json)$/.test(n)) out.push(p.slice(root.length).split("\\").join("/"));
  }
  return out;
}
const list = all ? walk(root, []).filter((p) => !p.startsWith("assets/vendor") && !p.startsWith("node_modules")) : (args.length ? args : CORE);
const url = (f) => `https://purge.jsdelivr.net/gh/${owner}/${repo}@${branch}/${String(f).replace(/^\.?\//, "")}`;

console.log(`🧊 purge ⇒ ${owner}/${repo}@${branch} · ${list.length} ફાઈલ`);
let done = 0, bad = 0;
for (const f of list) {
  try {
    const r = await fetch(url(f), { cache: "no-store" });
    const j = await r.json().catch(() => null);
    if (r.ok && (!j || j.status !== "errored")) { done++; console.log("   ✓ " + f); }
    else { bad++; console.log("   ✗ " + f + " ⇒ " + JSON.stringify(j).slice(0, 120)); }
  } catch (e) { bad++; console.log("   ✗ " + f + " ⇒ " + e.message); }
}
console.log(`==> ${done} તાજી · ${bad} નિષ્ફળ. હવે બ્લોગ ફરી ખોલો (Ctrl+Shift+R).`);
process.exit(bad && !done ? 1 : 0);
