/* ============================================================
   OEG Ads — Google AdSense (publisher ID ભરો એટલે આપોઆપ લોડ)
   દરેક પેજ પર slot લાગે છે; slot ખાલી હોય તો auto-format વાપરે
   ============================================================ */
OEG.ads = (() => {
  const BLOCKS = ["homeTop", "homeMid", "listTop", "listMid", "gradeTop", "viewTop", "viewMid", "videoTop", "quizTop", "quizResult", "gameTop", "footerTop", "contentBottom", "inFeed"];
  let injected = false, pushed = 0;

  const cfg = () => Object.assign({ publisherId: "", slots: {}, size: "auto" }, (OEG.state.config || {}).adsense || {});
  /* 📏 એક જ સાઇઝ — બધા સ્લોટ પર લાગુ પડે (Admin → 📢 જાહેરાત) */
  const SIZES = [
    ["auto", "Auto (recommend) — responsive"],
    ["fluid", "Fluid (adapts to the block)"],
    ["rectangle", "Rectangle — 300×250 / 336×280"],
    ["square", "Square — 250×250"],
    ["horizontal", "Horizontal (leaderboard) — 728×90"],
    ["vertical", "Vertical (wide skyscraper) — 160×600"],
    ["link", "Link unit"],
    ["320x50", "Mobile banner — 320×50"],
    ["320x100", "Mobile large banner — 320×100"],
    ["300x250", "Medium rectangle — 300×250"],
    ["336x280", "Large rectangle — 336×280"],
    ["300x600", "Half page — 300×600"],
    ["300x1050", "Large skyscraper — 300×1050"],
    ["468x60", "Banner — 468×60"],
    ["728x90", "Leaderboard — 728×90"],
    ["970x90", "Large leaderboad — 970×90"],
    ["970x250", "Billboard — 970×250"]
  ];
  const pub = () => String(cfg().publisherId || "").trim();
  const enabled = () => !!pub() && cfg().enabled !== false;
  const slotOf = (key) => String((cfg().slots || {})[key] || "").trim();
  const sizeOf = () => String(cfg().size || "auto").trim().toLowerCase();
  /* returns { fmt, style } for the <ins> tag */
  function sizeAttr() {
    const k = sizeOf();
    const m = /^(\d{2,4})x(\d{2,4})$/.exec(k);
    if (m) return { fmt: "", style: "display:inline-block;width:" + m[1] + "px;height:" + m[2] + "px" };
    if (["rectangle", "square", "horizontal", "vertical", "link", "fluid"].indexOf(k) >= 0) return { fmt: k, style: "display:block" };
    return { fmt: "auto", style: "display:block", full: true };
  }

  /* <head> માં એક જ વાર script + meta */
  function head() {
    if (injected || !enabled()) return;
    if (document.querySelector("script[src*='pagead'][src*='adsbygoogle']")) { injected = true; return; }
    injected = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(pub());
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
    const m = document.createElement("meta");
    m.name = "google-adsense-account";
    m.content = pub();
    document.head.appendChild(m);
  }

  function push() {
    try {
      pushed++;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* ad blocker / not approved */ }
  }

  /* એક ad slot નું markup — હંમેશા placeholder આપે છે (CSS માં ખાલી હોય તો છુપાય) */
  function render(key, extraClass) {
    const label = `<span class="ad-label">${OEG.esc(OEG.t("ad.label"))}</span>`;
    const p = pub(), slot = slotOf(key), z = sizeAttr();
    const zs = `style="${z.style}"${z.fmt ? ` data-ad-format="${z.fmt}"` : ""}${z.full ? ' data-full-width-responsive="true"' : ""}`;
    if (p && slot) {
      return `<div class="ad-slot ad-live ${extraClass || ""}" data-ad-key="${key}" data-ad-size="${OEG.esc(sizeOf())}">${label}
        <ins class="adsbygoogle" data-ad-client="${OEG.esc(p)}" data-ad-slot="${OEG.esc(slot)}" ${zs}></ins></div>`;
    }
    if (p) {
      return `<div class="ad-slot ad-auto ${extraClass || ""}" data-ad-key="${key}" data-ad-size="${OEG.esc(sizeOf())}">${label}
        <ins class="adsbygoogle" data-ad-client="${OEG.esc(p)}" ${zs}></ins></div>`;
    }
    return `<div class="ad-slot ad-empty ${extraClass || ""}" data-ad-key="${key}">${label}<div class="ad-box">📢 ${OEG.esc(OEG.t("ad.placeholder"))}</div></div>`;
  }

  /* માલિકને ગોઠવણ દેખાય: જ્યાં સુધી Publisher ID ન ભરાય ત્યાં સુધી
     placeholder ફક્ત localhost / admin માં જ દેખાય (વિઝિટરને ખાલી ડબ્બો ન દેખાય) */
  function previewMode() {
    const host = location.hostname;
    const local = host === "localhost" || host === "127.0.0.1" || host === "" || host.indexOf(".local") > 0;
    return local || !!(OEG.canAdmin && OEG.canAdmin()) || document.body.classList.contains("ads-preview");
  }

  /* markup મૂક્યા પછી એક વાર બોલાવો — બધા ins push કરે */
  function flush(root) {
    try { document.body.classList.toggle("ads-preview", previewMode()); } catch (e) {}
    if (!enabled()) return;
    head();
    const n = (root || document).querySelectorAll ? (root || document).querySelectorAll(".ad-live ins, .ad-auto ins").length : 0;
    for (let i = 0; i < n; i++) push();
  }

  return { BLOCKS, SIZES, enabled, pub, slotOf, sizeOf, head, render, flush, push };
})();
