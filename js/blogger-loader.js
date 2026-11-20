/* ============================================================
   OEG → બ્લોગર "એવરગ્રીન" લોડર
   ------------------------------------------------------------
   scripts/blogger.mjs આ ફાઈલ ને બ્લોગર થીમ માં ભરે છે.
   થીમ માં હવે markup ની કૉપિ (snapshot) ફકત પહેલી પેઇન્ટ + fallback માટે હોય છે,
   આજે ચાલતું બધું (markup + CSS + js/*.js) પાનું ખૂલે એટલે repo થી લવાય
   (jsDelivr → unpkg → raw) ⇒ GitHub માં push કરો એટલે બ્લોગર માં આપોઆપ નવું દેખાય,
   ક્યારેય થીમ ફરી upload કરવાનું નહીં.
   ============================================================ */
(function () {
  "use strict";
  /* ↓ આ લીટી scripts/blogger.mjs બદલીને ખરો config ભરે (બિના બદલાવે ફાઈલ ચાલે એ માટે default રાખ્યું) */
  var CFG = {
    cdn: "https://cdn.jsdelivr.net/gh/OnlineEducationGuru/OEG@main/",
    hosts: ["https://cdn.jsdelivr.net/gh/OnlineEducationGuru/OEG@main/", "https://unpkg.com/OnlineEducationGuru/OEG@main/", "https://raw.githubusercontent.com/OnlineEducationGuru/OEG/main/"],
    raw: "https://raw.githubusercontent.com/OnlineEducationGuru/OEG/main/",
    pages: "https://onlineeducationguru.github.io/OEG/",
    fb: [],
    slots: [["oeg-top", "header", "afterbegin"], ["oeg-side", "#sidebar", "afterbegin"], ["oeg-foot", "footer", "beforeend"]],
    pagesLinks: false,
    shell: "oeg-shell"
  };
  if (window.__oegEver) return;
  window.__oegEver = 1;

  var byId = function (id) { return document.getElementById(id); };
  var shell = byId(CFG.shell) || document.body;
  var p2 = function (n) { return (n < 10 ? "0" : "") + n; };
  var d0 = new Date();
  /* ૧૦ મિનિટ નો ટૅગ ⇒ browser નો કૉપિ તાજો રહે (CDN નો કૉપિ GitHub Actions તાજો કરે છે) */
  var B = "" + d0.getUTCFullYear() + p2(d0.getUTCMonth() + 1) + p2(d0.getUTCDate()) + p2(d0.getUTCHours()) + p2(Math.floor(d0.getUTCMinutes() / 10));

  var abs = function (base, rel) {
    rel = String(rel || "");
    return /^(https?:)?\/\//i.test(rel) || /^data:/.test(rel) ? rel : base + rel.replace(/^\.?\//, "");
  };
  var bust = function (u) { return String(u).indexOf("b=") >= 0 ? u : u + (String(u).indexOf("?") >= 0 ? "&" : "?") + "b=" + B; };
  var pathOf = function (u) { return String(u || "").replace(/^https?:\/\/[^/]+/, "").split("?")[0].split("#")[0].replace(/^\.?\//, ""); };
  /* CDN નો આગળ નો ભાગ કાઢી નાખીને ફકત ફાઈલ નો રાહ દેખીએ ⇒ jsDelivr/unpkg/raw એ જ ફાઈલ ગણાય */
  var tail = function (u) {
    u = pathOf(u);
    for (var i = 0; i < CFG.hosts.length; i++) {
      var pre = pathOf(CFG.hosts[i]);
      if (pre && u.indexOf(pre) === 0) return u.slice(pre.length);
    }
    return u.replace(/^\/+/, "");
  };
  var isLocal = function (u) { u = pathOf(u); return /^(js|assets|vendor)\//.test(u) || /^(styles\.css|favicon\.svg|manifest\.webmanifest)$/.test(u); };

  /* SEO પાનાં (g/ p/ q/) બ્લોગર પર નથી ⇒ એ જ પાનાં નાં app routes (જેમ build વખતે થાય) */
  var seo = function (u) {
    u = String(u || "").replace(/^\.?\//, "");
    if (CFG.pagesLinks) return /^(g|p|q)\//.test(u) || /^(sitemap\.xml|robots\.txt)$/.test(u) ? CFG.pages + u : "";
    var m = /^g\/(\d+)\.html$/.exec(u); if (m) return "#/grade/" + m[1];
    if (u === "g/balvatika.html") return "#/grade/balvatika";
    if (u === "g/all.html") return "#/textbooks";
    m = /^q\/[\w.-]+\.html$/.exec(u); if (m) return "#/quiz";
    m = /^p\/([\w.-]+)\.html$/.exec(u); if (m) return "#/view/" + m[1];
    if (/^(sitemap\.xml|robots\.txt)$/.test(u)) return "";
    return "";
  };
  /* તાજા markup ની લિંક: SEO પાનાં ⇒ app routes · local ફાઈલ ⇒ repo ની CDN (બ્લોગર પર relative તૂટે) */
  var fixUrls = function (scope, base) {
    var els = scope.querySelectorAll ? scope.querySelectorAll("a[href],[src],[poster]") : [];
    for (var i = els.length - 1; i >= 0; i--) {
      var el = els[i];
      var at = el.getAttribute("href") !== null ? "href" : (el.getAttribute("poster") !== null ? "poster" : "src");
      var h = el.getAttribute(at) || "";
      if (!h || /^(https?:)?\/\//i.test(h) || /^(data|mailto|tel|javascript):/i.test(h) || h.charAt(0) === "#") continue;
      var rel = pathOf(h);
      if (/^(g|p|q)\//.test(rel) || /^(sitemap\.xml|robots\.txt)$/.test(rel)) {
        var to = seo(rel);
        if (to) el.setAttribute(at, to);
        else if (at === "href" && el.parentNode) el.parentNode.removeChild(el);   /* sitemap/robots બ્લોગર પર અર્થહીન */
        continue;
      }
      if (base) el.setAttribute(at, abs(base, rel));
    }
  };

  /* head ની ફાઈલો (CSS/favicon/manifest) તાજા ટૅગ સાથે — જૂની હોય તો એની જગ્યા એ બદલો */
  var headRefresh = function (doc, base) {
    var ll = doc.getElementsByTagName("link"), i, l, rel, u, have;
    if (!document.head) return;
    var mine = document.head.getElementsByTagName("link");
    for (i = 0; i < ll.length; i++) {
      l = ll[i]; rel = pathOf(l.getAttribute("href") || "");
      if (!isLocal(rel)) continue;
      u = bust(abs(base, rel));
      have = null;
      for (var j = 0; j < mine.length; j++) {
        if (tail(mine[j].getAttribute("href") || "") === rel) { have = mine[j]; break; }
      }
      if (have) { if (have.getAttribute("href") !== u) have.setAttribute("href", u); continue; }
      var n = document.createElement("link");
      n.setAttribute("rel", l.getAttribute("rel") || "stylesheet");
      n.setAttribute("href", u);
      if (l.getAttribute("type")) n.setAttribute("type", l.getAttribute("type"));
      if (l.getAttribute("crossorigin")) n.setAttribute("crossorigin", l.getAttribute("crossorigin"));
      document.head.appendChild(n);
    }
  };
  /* બ્લોગર નાં Layout gadget (header/sidebar/footer) ને નવા markup માં ખસેડો */
  var moveSlots = function (scope) {
    for (var i = 0; i < CFG.slots.length; i++) {
      var s = CFG.slots[i], el = byId(s[0]);
      if (!el || !scope.querySelector) continue;
      var host = scope.querySelector(s[1]);
      if (host && host !== el.parentNode) { try { host.insertAdjacentElement(s[2], el); } catch (e) { } }
    }
  };
  var paintFlag = function (txt, cls) {
    try { shell.className = "oeg-live " + (cls || ""); } catch (e) { }
    var t = byId("oeg-boot");
    if (t) { if (txt) { t.className = "oeg-boot-err"; t.innerHTML = txt; } else if (t.parentNode) t.parentNode.removeChild(t); }
  };

  /* ફાઈલ ને એક પછી એક લાદો (js/app.js બાકી નાં module ઉપર નિર્ભર ⇒ ક્રમ જોઈએ) */
  var run = function (list, base) {
    var i = 0, bad = [];
    var cfgs = document.createElement("script");
    cfgs.text = "window.OEG_BASE=" + JSON.stringify(base) + ";window.OEG_V=" + JSON.stringify(B) + ";";
    document.body.appendChild(cfgs);
    var next = function () {
      if (i >= list.length) {
        if (bad.length) {
          var msg = '\u26a0\ufe0f ' + bad.length + ' ફાઈલ ન લાડી — ';
          msg += '<a href="' + (CFG.pages || '#/') + '">GitHub Pages નું પાનું</a>';
          msg += ' \u00b7 <a href="#" id="oeg-retry">\u21bb ફરી પ્રયત્ન કરો</a>';
          paintFlag(msg, 'oeg-warn');
          var r = byId('oeg-retry');
          if (r) r.onclick = function () { location.reload(); };
        } else paintFlag("", "");
        return;
      }
      var src = list[i++], s = document.createElement("script"), over = false;
      var over2 = function () { if (over) return; over = true; bad.push(src); next(); };
      /* એ ફાઈલ ટેંગાય (CDN ધીમો) તો આખું પાનું રોકાય નહીં — ૧૨ સેકંડ પછી આગળ વધો */
      var timer = setTimeout(over2, 12000);
      var fin = function () { if (over) return; over = true; clearTimeout(timer); next(); };
      s.onload = fin;
      s.onerror = over2;
      s.src = bust(abs(base, src));
      document.body.appendChild(s);
    };
    next();
  };

  var applyDoc = function (doc, base) {
    var body = doc.body ? doc.body.cloneNode(true) : null;
    if (!body || !body.firstChild) throw 0;
    var list = [], sc = body.getElementsByTagName("script"), i;
    for (i = 0; i < sc.length; i++) { if (sc[i].getAttribute("src")) list.push(sc[i].getAttribute("src")); }
    for (i = sc.length - 1; i >= 0; i--) { if (sc[i].parentNode) sc[i].parentNode.removeChild(sc[i]); }
    if (!list.length) throw 0;
    if (shell !== document.body) shell.innerHTML = "";
    while (body.firstChild) shell.appendChild(body.firstChild);
    fixUrls(shell, base);
    headRefresh(doc, base);
    moveSlots(shell);
    run(list.length ? list : CFG.fb, base);
  };

  var tryHost = function (k) {
    if (k >= CFG.hosts.length) {                       /* repo ન મળે ⇒ થીમ ની કૉપિ પ્રમાણે ચલાવો */
      fixUrls(shell, CFG.cdn); moveSlots(shell);
      run(CFG.fb, CFG.cdn);
      return;
    }
    var base = CFG.hosts[k];
    /* raw.githubusercontent.com js ને text/plain આપે ⇒ એ ઠેકાણે ફાઈલ jsDelivr થી લાવવી પડે */
    var fbase = base.indexOf("raw.githubusercontent.com") >= 0 ? CFG.cdn : base;
    var p = null;
    try { p = fetch(bust(base + "index.html"), { cache: "no-store" }); } catch (e) { p = null; }
    if (!p || !p.then) { tryHost(k + 1); return; }
    p.then(function (r) { if (!r || !r.ok) throw 0; return r.text(); })
      .then(function (txt) {
        var doc = new DOMParser().parseFromString(String(txt || ""), "text/html");
        applyDoc(doc, fbase);
      })
      ["catch"](function () { tryHost(k + 1); });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { tryHost(0); });
  else tryHost(0);
})();
