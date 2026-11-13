/* ============================================================
   OEG Ads — Google AdSense (publisher ID ભરો એટલે આપોઆપ લોડ)
   દરેક પેજ પર slot લાગે છે; slot ખાલી હોય તો auto-format વાપરે
   ============================================================ */
OEG.ads = (() => {
  const BLOCKS = ["homeTop", "homeMid", "listTop", "listMid", "gradeTop", "viewTop", "viewMid", "videoTop", "quizTop", "quizResult", "gameTop", "footerTop", "contentBottom", "inFeed"];
  let injected = false, pushed = 0;

  const cfg = () => Object.assign({ publisherId: "", slots: {} }, (OEG.state.config || {}).adsense || {});
  const pub = () => String(cfg().publisherId || "").trim();
  const enabled = () => !!pub() && cfg().enabled !== false;
  const slotOf = (key) => String((cfg().slots || {})[key] || "").trim();

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
    const p = pub(), slot = slotOf(key);
    if (p && slot) {
      return `<div class="ad-slot ad-live ${extraClass || ""}" data-ad-key="${key}">${label}
        <ins class="adsbygoogle" style="display:block" data-ad-client="${OEG.esc(p)}" data-ad-slot="${OEG.esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
    }
    if (p) {
      return `<div class="ad-slot ad-auto ${extraClass || ""}" data-ad-key="${key}">${label}
        <ins class="adsbygoogle" style="display:block" data-ad-client="${OEG.esc(p)}" data-ad-format="auto"></ins></div>`;
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

  return { BLOCKS, enabled, pub, slotOf, head, render, flush, push };
})();
