/* ============================================================
   OEG Notify — ૧) બ્રેકિંગ-ન્યૂઝ સ્ટ્રીપ  ૨) સૂચના (mobile/laptop)
                ૩) નવી પોસ્ટ ⇒ વૉટ્સએપ મેસેજ
   --------------------------------------------------------
   બધું set data/site-config.json માંથી (news / notify) ⇒ Admin પેનલ માંથી બદલાય.
   કોઈ સર્વર નહીં: સૂચના = browser Notification API (+ sw.js GitHub Pages પર),
   નવી પોસ્ટ ની માહિતી = data/notice.json + data/catalog.json તપાસીને.
   ============================================================ */

/* ================= ૧) 📰 બ્રેકિંગ ન્યૂઝ સ્ટ્રીપ ================= */
OEG.news = (() => {
  const DEF = {
    enabled: true,
    label: "Breaking News",           /* પટ્ટી નાં ડાબે નું chip નામ (વપરાશકર્તા બદલી શકે નહીં) */
    speed: 46,                 /* અક્ષર પ્રતિ સેકંડ — જેટલું મોટું એટલું ઝડપી */
    autoPosts: true,           /* નવી પોસ્ટ નું ટાઈટલ આપોઆપ ઉમેરાય */
    autoTypes: "post",
    autoDays: 45,
    autoCount: 6,
    pauseOnHover: true,
    dismissible: false,
    items: []                  /* [{text, url}]  — Admin માંથી "લખાણ | લિંક" દરેક લીટીએ */
  };
  const LS_OFF = "oeg.news.off";
  const cfg = () => {
    const a = (OEG.state.config && OEG.state.config.news) || {};
    const o = {};
    Object.keys(DEF).forEach((k) => { o[k] = (a[k] === undefined || a[k] === null) ? DEF[k] : a[k]; });
    return o;
  };
  const on = () => cfg().enabled !== false;
  const cleanUrl = (u) => {
    const s = String(u || "").trim();
    if (!s || s === "#") return "";
    if (/^(#|https?:|mailto:|\/)/i.test(s)) return s;
    return "#/" + s.replace(/^\/+/, "");
  };
  function manual() {
    const raw = cfg().items;
    const list = Array.isArray(raw) ? raw : String(raw || "").split(/\r?\n/);
    return list.map((x) => {
      if (x && typeof x === "object") return { text: OEG.langField(x.text || x.title || ""), url: cleanUrl(x.url || x.href) };
      const parts = String(x || "").split("|");
      return { text: (parts[0] || "").trim(), url: cleanUrl(parts[1] || "") };
    }).filter((x) => x.text);
  }
  function auto() {
    const c = cfg();
    if (!c.autoPosts) return [];
    const types = String(c.autoTypes || "post").split(/[\s,]+/).filter(Boolean);
    const all = (OEG.state.catalog || []).slice();
    let list = types.length ? all.filter((i) => types.indexOf(i.type) >= 0) : all;
    if (!list.length && types.length) list = all;                 /* એ type નું કંઈ ન હોય ⇒ બધું */
    const days = Number(c.autoDays || 0);
    if (days > 0) {
      const cut = Date.now() - days * 864e5;
      const fresh = list.filter((i) => { const t2 = Date.parse(i.date || i.updated || ""); return t2 && t2 >= cut; });
      if (fresh.length) list = fresh;
    }
    list.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.id || "").localeCompare(String(a.id || "")));
    return list.slice(0, Number(c.autoCount || 6)).map((i) => ({
      text: OEG.title(i), url: "#/view/" + i.id, icon: OEG.typeIcon(i.type) || "📌"
    })).filter((x) => x.text);
  }
  const items = () => {
    const seen = {};
    return manual().concat(auto()).filter((x) => {
      const k = x.text.toLowerCase();
      if (seen[k]) return false;
      seen[k] = 1; return true;
    });
  };
  const sig = (list) => { let h = 7; list.forEach((x) => { for (const ch of x.text) h = (h * 31 + ch.charCodeAt(0)) | 0; }); return (h >>> 0).toString(36); };
  /* 📰 પટ્ટી હેડર ની *બહાર* (ઉપર, સાદા પ્રવાહ માં) બેસે — sticky હેડર માં ભળે નહીં,
     એટલે સ્ક્રિન પર કંઈ ઢંકાતું / નડતું નથી અને પાનું સરકાવો તો પટ્ટી પણ સાથે સરકે. */
  function mount(el) {
    const hd = document.querySelector(".header");
    if (hd && hd.parentNode) hd.parentNode.insertBefore(el, hd);
    else document.body.insertBefore(el, document.body.firstChild || null);
  }
  function render() {
    let el = document.getElementById("newsStrip");
    const c = cfg();
    const list = on() ? items() : [];
    const dism = c.dismissible === true;              /* default ⇒ ✕ નહીં (વપરાશકર્તા પટ્ટી હટાવી શકે નહીં) */
    if (!dism) clearDismiss();                        /* એક વાર કાઢેલી હોય તોય હવે દેખાય */
    let off = "";
    try { off = localStorage.getItem(LS_OFF) || ""; } catch (e) {}
    const s = list.length ? sig(list) : "";
    if (!list.length || (dism && off && off === s)) {
      if (el) el.remove();
      document.body.classList.remove("has-news");
      return false;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = "newsStrip";
      el.className = "news-strip";
      mount(el);
    } else if (el.parentNode && el.parentNode.classList && el.parentNode.classList.contains("header")) {
      mount(el);                                      /* જૂનું sticky header અંદર નું placement તાજું કરો */
    }
    const one = list.map((x) =>
      `<a class="ns-item" href="${OEG.esc(x.url || "#/")}"${/^https?:/i.test(x.url || "") ? ' target="_blank" rel="noopener"' : ""}><span class="ns-ic">${x.icon || "📌"}</span>${OEG.esc(x.text)}</a>`
    ).join(`<span class="ns-sep">◆</span>`);
    const cps = Math.min(120, Math.max(12, Number(c.speed || DEF.speed)));
    const chars = list.reduce((n, x) => n + x.text.length + 6, 0);
    const dur = Math.max(14, Math.round(chars / cps));
    el.innerHTML = `<div class="ns-in">
        <span class="ns-tag">🔴 ${OEG.esc(OEG.langField(c.label) || "Breaking News")}</span>
        <div class="ns-vp"><div class="ns-run" style="animation-duration:${dur}s"${c.pauseOnHover === false ? " data-nopause" : ""}>
          <span class="ns-seq">${one}</span><span class="ns-seq" aria-hidden="true">${one}</span>
        </div></div>
        ${dism ? '<button type="button" class="ns-x" aria-label="close">✕</button>' : ""}
      </div>`;
    document.body.classList.add("has-news");
    const xb = el.querySelector(".ns-x");
    if (xb) xb.onclick = (e) => { e.preventDefault(); try { localStorage.setItem(LS_OFF, s); } catch (err) {} render(); };
    if (c.pauseOnHover !== false) {
      const run = el.querySelector(".ns-run");
      el.onmouseenter = () => { if (run) run.style.animationPlayState = "paused"; };
      el.onmouseleave = () => { if (run) run.style.animationPlayState = ""; };
    }
    return true;
  }
  function clearDismiss() { try { localStorage.removeItem(LS_OFF); } catch (e) {} }
  return { cfg, DEF, on, items, render, clearDismiss, manual, auto, cleanUrl, sig };
})();

/* ============ ૨) 🔔 સૂચના + ૩) 🟢 વૉટ્સએપ પ્રસાર ============ */
OEG.notify = (() => {
  const FILE = "data/notice.json";
  const LS_SEEN = "oeg.n.seen";
  const LS_INBOX = "oeg.n.inbox";
  const LS_POSTS = "oeg.n.posts";
  const LS_SENT = "oeg.wa.sent";
  const LS_ASK = "oeg.n.asked";
  const DEF = {
    enabled: true, bell: true, onNewPosts: true, pollMinutes: 15, askOnce: true, days: 30,
    waBroadcast: true, waNumber: "", waAuto: "admin", waTemplate: ""
  };
  const cfg = () => {
    const a = (OEG.state.config && OEG.state.config.notify) || {};
    const o = {};
    Object.keys(DEF).forEach((k) => { o[k] = (a[k] === undefined || a[k] === null) ? DEF[k] : a[k]; });
    if (!o.label) o.label = ((OEG.state.config || {}).siteName) || "Online Education Guru";
    return o;
  };
  const read = (k, def) => { try { const j = JSON.parse(localStorage.getItem(k) || "null"); return (j && typeof j === "object") ? j : def; } catch (e) { return def; } };
  const write = (k, o) => { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} };

  /* ---------- permission / service worker ---------- */
  const supported = () => typeof window !== "undefined" && "Notification" in window;
  const permission = () => (supported() ? Notification.permission : "unsupported");
  const isHttps = () => location.protocol === "https:" || location.hostname === "localhost";
  async function swReg() {
    if (OEG.remote() || !isHttps() || !("serviceWorker" in navigator)) return null;
    try { return await navigator.serviceWorker.register("sw.js", { scope: "./" }); } catch (e) { return null; }
  }
  async function show(o) {
    const title = o.title || cfg().label;
    const body = String(o.text || "").slice(0, 240);
    if (permission() === "granted") {
      try {
        const reg = await swReg();
        if (reg) {
          await reg.showNotification(title, { body, tag: "oeg-" + o.id, icon: OEG.base("favicon.svg"), badge: OEG.base("favicon.svg"), data: o.url || "", renotify: false });
          return "sw";
        }
      } catch (e) {}
      try {
        const n = new Notification(title, { body, tag: "oeg-" + o.id, icon: OEG.base("favicon.svg"), data: o.url || "" });
        n.onclick = () => { try { window.focus(); if (o.url) location.hash = o.url.replace(/^.*#/, "#"); } catch (e) {} n.close(); };
        return "page";
      } catch (e) {}
    }
    try { OEG.toast("🔔 " + title + " — " + body.slice(0, 70)); } catch (e) {}
    return "toast";
  }
  async function enable() {
    if (!supported()) return { ok: false, why: "unsupported" };
    let p = permission();
    if (p !== "granted") {
      try { p = await Notification.requestPermission(); } catch (e) { p = "denied"; }
    }
    try { localStorage.setItem(LS_ASK, p); } catch (e) {}
    if (p === "granted") {
      await swReg();
      await show({ id: "welcome", title: OEG.t("n.title"), text: OEG.t("n.onOk") });
      renderBell();
      return { ok: true };
    }
    return { ok: false, why: p };
  }

  /* ---------- 📥 data/notice.json + નવી પોસ્ટ ---------- */
  async function notices() {
    const j = await OEG.data.readJson(FILE + "?ts=" + Date.now(), { v: 1, items: [] });   /* CDN કૅશ ચૂકી તાજું વાંચો */
    const items = Array.isArray(j.items) ? j.items : [];
    return items.map((x, i) => ({
      id: String(x.id || "n" + i),
      title: OEG.langField(x.title) || cfg().label,
      text: OEG.langField(x.text) || OEG.langField(x.title) || "",
      url: OEG.news.cleanUrl(x.url || x.link || ""),
      at: x.at || "",
      level: x.level || "info"
    }));
  }
  function postsNew() {
    const c = cfg();
    if (!c.onNewPosts) return Promise.resolve([]);
    const known = read(LS_POSTS, null);
    const list = (OEG.state.catalog || []).slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const now = {};
    list.forEach((i) => { now[i.id] = 1; });
    if (!known || typeof known !== "object") { write(LS_POSTS, now); return Promise.resolve([]); }   /* પહેલી વાર ⇒ કંઈ નહીં */
    const days = Number(c.days || 0);
    const cut = Date.now() - days * 864e5;
    const out = list.filter((i) => !known[i.id]).filter((i) => {
      if (!(days > 0)) return true;
      const t2 = Date.parse(i.date || i.updated || "");
      return !t2 || t2 >= cut;
    }).slice(0, 6).map((i) => ({
      id: "p" + i.id, title: OEG.typeIcon(i.type) + " " + OEG.title(i),
      text: String(OEG.desc(i) || OEG.t("n.newPost")).slice(0, 200),
      url: "#/view/" + i.id, at: i.date || "", level: "post", itemId: i.id
    }));
    write(LS_POSTS, now);
    return Promise.resolve(out);
  }
  async function check(force) {
    const c = cfg();
    if (!c.enabled) return { count: 0, list: [] };
    const seen = read(LS_SEEN, {});
    const inbox = read(LS_INBOX, []);
    let list = [];
    try { list = (await notices()).concat(await postsNew()); } catch (e) { list = await postsNew().catch(() => []); }
    const fresh = list.filter((x) => x.id && !seen[x.id]);
    if (fresh.length) {
      fresh.forEach((x) => { seen[x.id] = Date.now(); inbox.unshift({ id: x.id, title: x.title, text: x.text, url: x.url, at: x.at, level: x.level }); });
      while (inbox.length > 20) inbox.pop();
      write(LS_SEEN, seen); write(LS_INBOX, inbox);
      if (force !== "silent") fresh.slice(0, 4).forEach((x) => show(x));
    }
    renderBell();
    return { count: fresh.length, list: fresh };
  }
  const inbox = () => read(LS_INBOX, []);
  const unread = () => { const seen = read(LS_SEEN, {}); return inbox().filter((x) => !x.read).length; };
  function markRead() { const list = inbox(); list.forEach((x) => { x.read = 1; }); write(LS_INBOX, list); renderBell(); }
  function clearAll() { write(LS_INBOX, []); write(LS_SEEN, {}); try { localStorage.removeItem(LS_POSTS); } catch (e) {} renderBell(); }

  /* ---------- 🔔 હેડર ની ઘંટડી ---------- */
  function renderBell() {
    const host = document.querySelector(".header-actions");
    if (!host) return;
    const c = cfg();
    let btn = document.getElementById("nBell");
    if (!c.enabled || !c.bell) { if (btn) btn.remove(); const old = document.getElementById("nPanel"); if (old) old.remove(); return; }
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "nBell";
      btn.className = "icon-btn n-bell";
      btn.setAttribute("aria-label", OEG.t("n.title"));
      host.insertBefore(btn, host.firstChild);
      btn.onclick = (e) => { e.stopPropagation(); togglePanel(); };
      document.addEventListener("click", (e) => { const p = document.getElementById("nPanel"); if (p && !p.contains(e.target) && e.target !== btn) p.classList.remove("open"); });
    }
    const n = unread();
    btn.innerHTML = `🔔${n ? `<i class="n-dot">${n > 9 ? "9+" : n}</i>` : ""}`;
    btn.title = permission() === "granted" ? OEG.t("n.on") : OEG.t("n.off");
    const p = document.getElementById("nPanel");
    if (p && p.classList.contains("open")) paintPanel(p);
  }
  function paintPanel(p) {
    const list = inbox();
    const perma = permission();
    p.innerHTML = `<div class="np-head">🔔 ${OEG.t("n.title")}
        ${perma === "granted" ? `<button type="button" class="btn btn-outline btn-sm" data-n="test">${OEG.t("n.test")}</button>`
                              : `<button type="button" class="btn btn-brand btn-sm" data-n="on">${OEG.t("n.enable")}</button>`}
      </div>
      <div class="np-list">${list.length ? list.slice(0, 8).map((x) =>
        `<a class="np-item" href="${OEG.esc(x.url || "#/")}"${/^https?:/i.test(x.url || "") ? ' target="_blank" rel="noopener"' : ""}>
          <b>${OEG.esc(x.title || "")}</b><span>${OEG.esc(x.text || "")}</span>${x.at ? `<small>${OEG.esc(String(x.at).slice(0, 10))}</small>` : ""}</a>`).join("")
        : `<p class="np-none">${OEG.esc(OEG.t("n.empty"))}</p>`}</div>
      <div class="np-foot">
        <span>${perma === "granted" ? "✅ " + OEG.t("n.on") : perma === "denied" ? "⛔ " + OEG.t("n.denied") : OEG.t("n.note")}</span>
        <span><button type="button" class="btn btn-outline btn-sm" data-n="refresh">🔄</button>
        <button type="button" class="btn btn-outline btn-sm" data-n="read">${OEG.t("n.read")}</button></span>
      </div>`;
    p.querySelectorAll("[data-n]").forEach((b) => {
      b.onclick = async (e) => {
        e.preventDefault(); e.stopPropagation();
        const a = b.dataset.n;
        if (a === "on") await enable();
        else if (a === "test") await show({ id: "test" + Date.now(), title: OEG.t("n.title"), text: OEG.t("n.testText") });
        else if (a === "refresh") { await check("silent"); }
        else if (a === "read") markRead();
        paintPanel(p); renderBell();
      };
    });
  }
  function togglePanel() {
    let p = document.getElementById("nPanel");
    if (!p) {
      p = document.createElement("div");
      p.id = "nPanel";
      p.className = "n-panel";
      (document.querySelector(".header") || document.body).appendChild(p);
    }
    const open = p.classList.toggle("open");
    if (open) { p.style.top = (document.querySelector(".header") || { offsetHeight: 68 }).offsetHeight + "px"; paintPanel(p); }
  }

  /* ---------- 🟢 વૉટ્સએપ પ્રસાર ---------- */
  const TPL_DEFAULT = "📢 {site}\n\n{icon} {title}\n{desc}\n\n👉 {link}";
  const itemLink = (it) => OEG.shareUrl("#/view/" + it.id);
  function waText(it) {
    const c = cfg();
    const tpl = String(c.waTemplate || TPL_DEFAULT);
    const desc = String(OEG.desc(it) || "").replace(/\s+/g, " ").trim().slice(0, 180);
    return tpl
      .replace(/\{site\}/g, OEG.siteName())
      .replace(/\{icon\}/g, OEG.typeIcon(it.type) || "📌")
      .replace(/\{title\}/g, OEG.title(it))
      .replace(/\{desc\}/g, desc || OEG.t("n.newPost"))
      .replace(/\{link\}/g, itemLink(it))
      .replace(/\{grade\}/g, OEG.gradeLabel(it.grade || "all"))
      .replace(/\{type\}/g, OEG.typeLabel(it.type))
      .split("\n").map((l) => l.trim()).join("\n")
      .replace(/\n{3,}/g, "\n\n").trim();
  }
  function waLink(text, number) {
    const n = String(number == null ? cfg().waNumber : number).replace(/[^\d]/g, "");
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(text);
  }
  const sentMap = () => read(LS_SENT, {});
  function markSent(id) { const m = sentMap(); m[id] = Date.now(); write(LS_SENT, m); }
  function markAll(ids) { const m = sentMap(); (ids || []).forEach((i) => { m[i] = Date.now(); }); write(LS_SENT, m); }
  function resetSent() { try { localStorage.removeItem(LS_SENT); } catch (e) {} }
  function pending() {
    const m = sentMap();
    return (OEG.state.catalog || [])
      .filter((i) => !m[i.id])
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }
  function sendOne(it, number) {
    markSent(it.id);
    window.open(waLink(waText(it), number), "_blank", "noopener");
    return true;
  }
  function sendMany(list, number) {
    const c = cfg();
    const text = (list || []).map((it) => waText(it)).join("\n\n" + "➖".repeat(14) + "\n\n").slice(0, 5500);
    markAll((list || []).map((it) => it.id));
    window.open(waLink(text, number == null ? c.waNumber : number), "_blank", "noopener");
    return true;
  }
  /* 🟢 નવી પોસ્ટ ⇒ વૉટ્સએપ: પાનાં પર કોઈ તરતું બોક્સ નહીં (screen નડતું હતું એટલે કાઢી હાબ).
     યાદ રહે એટલે બસ ⇒ Admin → 📣 (અથવા 📰 પટ્ટી) પૅનલ માંથી જ મોકલાય.
     clearChip() ફક્ત જૂના cache માં બચેલું બોક્સ હટાવવા. */
  function clearChip() {
    const el = document.getElementById("waChip");
    if (el) el.remove();
    try { localStorage.removeItem("oeg.wa.chip"); } catch (e) {}
    return false;
  }

  /* ---------- ⏱ પોલિંગ ---------- */
  let timer = 0;
  function start() {
    const c = cfg();
    clearInterval(timer);
    if (!c.enabled) return;
    const mins = Math.max(1, Number(c.pollMinutes || DEF.pollMinutes));
    timer = setInterval(() => { try { if (document.visibilityState !== "hidden") check(); } catch (e) {} }, mins * 60000);
  }
  /* પ્રથમ વાર (એક જ) સૂચના ચાલુ કરવા આમંત્રણ — Admin ના પેનલ માંથી બંધ થાય */
  async function maybeAsk() {
    const c = cfg();
    if (!supported() || !c.enabled || !c.askOnce || !isHttps()) return;
    if (permission() !== "default") return;
    let asked = "";
    try { asked = localStorage.getItem(LS_ASK) || ""; } catch (e) {}
    if (asked) return;
    try { localStorage.setItem(LS_ASK, "asked"); } catch (e) {}
    setTimeout(() => {
      try {
        if (permission() !== "default") return;
        OEG.toast(OEG.t("n.invite"));
      } catch (e) {}
    }, 25000);
  }
  return {
    cfg, DEF, FILE, TPL_DEFAULT, supported, permission, isHttps, enable, show, notices, check, start, maybeAsk,
    inbox, unread, markRead, clearAll, renderBell, clearChip, swReg,
    waText, waLink, waNumber: () => cfg().waNumber, pending, markSent, markAll, resetSent, sendOne, sendMany, itemLink
  };
})();
