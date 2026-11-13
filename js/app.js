/* ============================================================
   OEG App — Router + Page Renderers + Shell
   ============================================================ */
(() => {
  /* ---------- 🧭 Nav & taxonomy (Admin માંથી શ્રેણી/ધોરણ ઉમેર-કાઢ થાય છે) ---------- */
  const HOME_NAV = { route: "home", icon: "🏠", key: "nav.home" };
  const ADMIN_NAV = { route: "admin", icon: "🛠️", key: "nav.admin" };
  /* ⚙️ Admin → સાઇટ સેટિંગ્સ માંથી આવતી ટૉગલ (સેક્શન બતાવવા/છુપાવવા, ગાર્ડ, શોધ…) */
  const uiCfg = () => (OEG.state.config && OEG.state.config.ui) || {};
  const sectionOn = (route) => { const sec = uiCfg().sections; return !sec || sec[route] !== false; };
  const guardOn = () => uiCfg().antiCopy !== false;
  const uiText = (k, fallback) => { const v = uiCfg()[k]; const t2 = v && typeof v === "object" ? OEG.langField(v) : (v || ""); return t2 || fallback; };

  const NAV = () => [HOME_NAV].concat(
    OEG.tax().types.filter(x => x.route).map(x => ({ route: x.route, icon: x.icon || "📄", key: "type." + x.key, label: OEG.typeLabel(x.key) })),
    [ADMIN_NAV]).filter(n => n.route === "home" || n.route === "admin" || sectionOn(n.route));
  const GRADES = () => OEG.tax().grades.filter(g => g.key !== "all").map(g => g.key);
  const REAL_GRADES = () => GRADES().filter(k => k === "balvatika" || /^\d+$/.test(k));
  const SUBJECTS = () => OEG.tax().subjects.map(s => s.key);
  const NAV_TOP = ["home", "textbooks", "workbooks", "quiz", "videos", "blog"];

  const $app = () => document.getElementById("app");
  const t = OEG.t;

  /* ---------- i18n apply ---------- */
  function applyI18n() {
    document.documentElement.lang = OEG.state.lang;
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = t(el.dataset.i18nPh));
    document.getElementById("langSelect").value = OEG.state.lang;
    const tag = uiText("tagline", "");
    const tagEl = document.getElementById("logoTagline");
    if (tagEl) tagEl.textContent = tag || t("hero.title");
    const sw = document.querySelector(".search-box");
    if (sw) sw.style.display = uiCfg().showSearch === false ? "none" : "";
    const lg = document.querySelector(".logo-mark");
    if (lg && uiCfg().logoEmoji) lg.textContent = uiCfg().logoEmoji;
    document.body.classList.toggle("allow-select", !guardOn());
    renderNav(); renderSidebar(); renderFooter(); renderAuthArea();
  }

  /* ---------- Shell ---------- */
  const visibleNav = NAV; /* Admin બટન હંમેશ દેખાય — ક્લિક પર માલિક-લોગિન માંગશે */
  const navTopCount = () => window.innerWidth >= 1400 ? 6 : 4;

  function renderNav() {
    const cur = currentRoute();
    const v = visibleNav();
    const topRoutes = NAV_TOP.slice(0, navTopCount());
    const link = (n) => `<a class="nav-link ${cur === n.route ? "active" : ""}" href="#/${n.route === "home" ? "" : n.route}">${OEG.esc(n.label || t(n.key))}</a>`;
    const top = v.filter(n => topRoutes.includes(n.route));
    const more = v.filter(n => !topRoutes.includes(n.route));
    document.getElementById("navDesktop").innerHTML = top.map(link).join("") + (more.length ? `
      <div class="nav-more">
        <button type="button" class="nav-link nav-more-btn ${more.some(m => m.route === cur) ? "active" : ""}" id="navMoreBtn" aria-haspopup="true">${t("nav.more")} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg></button>
        <div class="nav-drop">${more.map(link).join("")}</div>
      </div>` : "");
    const btn = document.getElementById("navMoreBtn");
    if (btn) btn.onclick = (e) => { e.stopPropagation(); btn.closest(".nav-more").classList.toggle("open"); };
  }
  let navResizeT;
  window.addEventListener("resize", () => { clearTimeout(navResizeT); navResizeT = setTimeout(renderNav, 180); });
  function renderSidebar() {
    document.getElementById("sideNav").innerHTML = visibleNav().map(n =>
      `<a class="side-link ${currentRoute() === n.route ? "active" : ""}" href="#/${n.route === "home" ? "" : n.route}"><span class="ic">${n.icon}</span>${OEG.esc(n.label || t(n.key))}</a>`).join("");
    /* ધોરણ — હવે પેજ પર બધાં પ્રકારનું મટિરિયલ દેખાય (ફક્ત પાઠ્યપુસ્તક નહીં) */
    document.getElementById("sideGrades").innerHTML = REAL_GRADES().map(g =>
      `<a class="side-link ${gradeInUrl() === g ? "active" : ""}" href="#/grade/${g}"><span class="ic">${OEG.gradeIcon(g)}</span>${OEG.esc(OEG.gradeLabel(g))}<small>${countOfGrade(g)}</small></a>`).join("");
    document.getElementById("sideShare").innerHTML = shareButtons();
    bindShare(document.getElementById("sideShare"));
  }
  const gradeInUrl = () => { const m = (location.hash || "").match(/#\/grade\/([\w-]+)/); return m ? m[1] : ""; };
  const countOfGrade = (g) => {
    const n = OEG.state.catalog.filter(i => i.grade === g).length;
    return n ? `<small>${n}</small>` : "";
  };

  function renderFooter() {
    document.getElementById("footerLinks").innerHTML = NAV().slice(0, 9).map(n =>
      `<a href="#/${n.route === "home" ? "" : n.route}">${OEG.esc(n.label || t(n.key))}</a>`).join("");
    document.getElementById("footerSocial").innerHTML = `<span class="fs-title">${t("follow.title")}</span>` + followButtons("fb-foot");
    const note = document.getElementById("footerNote");
    if (note) {
      const txtNote = uiText("footerNote", "");
      note.textContent = txtNote;
      note.style.display = txtNote ? "" : "none";
    }
    const about = document.getElementById("footerAbout");
    if (about) { const a = uiText("footerAbout", ""); if (a) about.textContent = a; }
    const ft = document.getElementById("footerTitle");
    if (ft) { const n2 = uiText("siteTitle", ""); ft.textContent = n2 ? "🎓 " + n2 : "🎓 Online Education Guru"; }
  }

  function followIcon(k) {
    const i = {
      instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.4"/><circle cx="12" cy="12" r="4.4"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" stroke="none"/></svg>',
      youtube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1.6" y="4.4" width="20.8" height="15.2" rx="4.4"/><path d="M10.2 9.1v5.8L15.4 12z" fill="currentColor" stroke="none"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07"/></svg>',
      telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.94 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m4.9 7.2-1.64 7.74c-.12.54-.44.67-.9.42l-2.5-1.84-1.2 1.16c-.13.13-.24.24-.5.24l.18-2.56 4.66-4.2c.2-.18-.04-.28-.31-.1L9.4 13.3l-2.48-.78c-.54-.17-.55-.54.11-.8l9.7-3.74c.44-.16.82.1.68.72z"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.1 4.9A10 10 0 0 0 2.3 17.1L.9 23.4l6.4-1.7a10 10 0 0 0 4.7 1.2h.01a10 10 0 0 0 7.1-17.9m-7.1 19.4a8.3 8.3 0 0 1-4.2-1.2l-.3-.2-3.8 1 1-3.6-.2-.3a8.3 8.3 0 1 1 7.5 4.3m4.6-6.2c-.25-.13-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.12-.17.25-.65.82-.8 1-.15.17-.29.2-.54.06-.25-.12-1.05-.38-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.1-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.13-.57-1.38-.79-1.88-.2-.5-.41-.42-.57-.43h-.48a.94.94 0 0 0-.68.32c-.23.25-.89.87-.89 2.13s.91 2.47 1.04 2.64c.13.17 1.8 2.74 4.35 3.84.61.26 1.08.42 1.45.54.61.19 1.16.17 1.6.1.49-.07 1.5-.61 1.71-1.2s.21-1.1.15-1.2c-.06-.11-.23-.17-.48-.3"/></svg>'
    };
    return i[k] || "🔗";
  }
  function followButtons(extra) {
    const s = OEG.state.config.social || {};
    const c = OEG.state.config;
    const defs = [
      { k: "instagram", url: s.instagram, handle: "@onlineeducationguru", name: "Instagram" },
      { k: "youtube", url: s.youtube, handle: "@EducationGuruOnline", name: "YouTube" },
      { k: "facebook", url: s.facebook, handle: "online.education.gurus", name: "Facebook" },
      { k: "telegram", url: s.telegram, handle: "", name: "Telegram" },
      { k: "whatsapp", url: s.whatsapp, handle: "", name: "WhatsApp" }
    ];
    const has = defs.filter(d => d.url);
    const list = has.length ? has : defs.slice(0, 3).map(d => Object.assign({}, d, { url: "https://www.google.com/search?q=" + encodeURIComponent("Online Education Guru " + d.name) }));
    const mail = c.contactEmail;
    return `<span class="follow-row ${extra || ""}">` + list.map(d =>
      `<a class="follow-btn soc-btn fb-${d.k}" href="${OEG.esc(d.url)}" target="_blank" rel="noopener" title="${d.name}" aria-label="${d.name}">${followIcon(d.k)}<span class="soc-name">${d.name}</span>${d.handle ? `<small>${OEG.esc(d.handle)}</small>` : ""}</a>`).join("") +
      (mail ? `<a class="follow-btn soc-btn fb-mail" href="mailto:${OEG.esc(mail)}" title="Email" aria-label="Email">✉️<span class="soc-name">Email</span></a>` : "") + "</span>";
  }

  function renderAuthArea() {
    const u = OEG.state.user;
    document.getElementById("authArea").innerHTML = u
      ? `<span style="font-weight:700;font-size:.88rem;margin-right:6px">👋 ${OEG.esc(u.name)}</span><button class="btn btn-outline btn-sm" id="logoutBtn">${t("nav.logout")}</button>`
      : `<a class="btn btn-outline btn-sm" href="#/login">${t("nav.login")}</a> <a class="btn btn-brand btn-sm" href="#/register">${t("nav.register")}</a>`;
    const lb = document.getElementById("logoutBtn");
    if (lb) lb.onclick = () => { OEG.auth.logout(); renderAuthArea(); OEG.toast(t("auth.logoutOk")); location.hash = "#/"; };
    renderNav(); renderSidebar();
  }
  function socialSvg(k) {
    const paths = {
      whatsapp: "M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35M12.04 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.89 9.88m8.42-18.3A11.82 11.82 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.4",
      facebook: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07",
      twitter: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z",
      telegram: "M11.94 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m4.9 7.2-1.64 7.74c-.12.54-.44.67-.9.42l-2.5-1.84-1.2 1.16c-.13.13-.24.24-.5.24l.18-2.56 4.66-4.2c.2-.18-.04-.28-.31-.1L9.4 13.3l-2.48-.78c-.54-.17-.55-.54.11-.8l9.7-3.74c.44-.16.82.1.68.72z"
    };
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${paths[k] || ""}"/></svg>`;
  }
  function shareButtons() {
    const url = encodeURIComponent(OEG.shareUrl()), title = encodeURIComponent(document.title);
    return `<span class="share-label">${t("share.title")}:</span>
      <a class="share-btn" target="_blank" rel="noopener" href="https://wa.me/?text=${title}%20${url}">${socialSvg("whatsapp")}${t("share.whatsapp")}</a>
      <a class="share-btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${url}">${socialSvg("facebook")}${t("share.facebook")}</a>
      <a class="share-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${title}&url=${url}">${socialSvg("twitter")}${t("share.twitter")}</a>
      <a class="share-btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=${url}&text=${title}">${socialSvg("telegram")}${t("share.telegram")}</a>
      <button class="share-btn" id="copyLinkBtn">🔗 ${t("btn.copyLink")}</button>`;
  }
  async function copyCurrentLink() {
    const link = OEG.shareUrl();
    try { await navigator.clipboard.writeText(link); OEG.toast(t("btn.copied")); return; }
    catch (e) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = link; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.left = "-9999px"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      OEG.toast(t("btn.copied"));
      ta.remove();
    } catch (e2) { window.prompt("Copy:", link); }
  }
  function bindShare(root) {
    (root || document).querySelectorAll("#copyLinkBtn,.copy-link-btn").forEach(b => { b.onclick = copyCurrentLink; });
  }
  /* શેર/કેનોનિકલ હંમેશા અત્યારના host પ્રમાણે (Blogger ⇒ blogspot, GitHub ⇒ github.io) */

  /* ---------- 📢 AdSense — દરેક પેજ પર (publisher + slot ભરો એટલે live) ---------- */
  function adSlot(slotKey, extraClass) {
    if (!slotKey) return "";
    return OEG.ads.render(slotKey, extraClass || "");
  }

  /* ---------- Components ---------- */
  function card(item, views) {
    const kind = OEG.fileKind(item);
    const n = views === undefined ? OEG.views.count(item.id) : views;
    const icon = OEG.typeIcon(item.type);
    const thumb = OEG.thumbnail(item);
    const img = thumb
      ? `<div class="card-img${kind === "video" || OEG.youtubeId(item.fileUrl) ? " has-play" : ""}"><img src="${OEG.esc(thumb)}" alt="" loading="lazy" draggable="false">${kind === "video" || OEG.youtubeId(item.fileUrl) ? '<span class="play-badge">▶</span>' : ""}</div>`
      : `<div class="card-img">${icon}</div>`;
    const isVid = !!OEG.youtubeId(item.fileUrl);
    const action = `<a class="btn ${item.fileUrl ? "btn-brand" : "btn-outline"} btn-sm" href="#/view/${item.id}">${isVid ? "▶ " + t("btn.play") : item.fileUrl ? t("btn.view") : t("btn.readMore")}</a>`;
    return `<article class="card reveal glow">${img}<div class="card-body">
      <span class="badge">${OEG.typeIcon(item.type)} ${OEG.esc(OEG.typeLabel(item.type))} • ${OEG.esc(OEG.gradeLabel(item.grade))}</span>
      <h3>${OEG.esc(OEG.title(item))}</h3><p>${OEG.esc(OEG.desc(item))}</p>
      <div class="card-meta">${n ? `<span>👁 ${n}</span>` : ""}<span>📅 ${OEG.esc(item.date || "")}</span>${item.subject ? `<span>🏷️ ${OEG.esc(OEG.subjectLabel(item.subject))}</span>` : ""}${kind !== "link" ? `<span>📄 ${kind.toUpperCase()}</span>` : ""}</div>
      <div class="card-actions">${action}</div></div></article>`;
  }

  function filtersHtml(typeKey, route, grade, subject, topic) {
    const ty = OEG.tax().types.filter(x => x.key === typeKey).length ? null : null;
    const cats = OEG.tax().types.filter(x => x.route);
    return `<div class="filters">
      <label>${t("filter.grade")}</label>
      <select id="fGrade"><option value="all">${t("filter.all")}</option>${GRADES().map(g => `<option value="${g}" ${g === grade ? "selected" : ""}>${OEG.esc(OEG.gradeLabel(g))}</option>`).join("")}</select>
      <label>${t("filter.subject")}</label>
      <select id="fSubject"><option value="all">${t("filter.all")}</option>${SUBJECTS().map(s => `<option value="${s}" ${s === subject ? "selected" : ""}>${OEG.esc(OEG.subjectLabel(s))}</option>`).join("")}</select>
      <label>${t("admin.catTab")}</label>
      <select id="fCat">${cats.map(c => `<option value="${c.route}" ${c.key === typeKey ? "selected" : ""}>${OEG.typeIcon(c.key)} ${OEG.esc(OEG.typeLabel(c.key))}</option>`).join("")}</select>
    </div>`;
  }

  function gridWithAd(items, startAt, adKey) {
    if (!items.length) return "";
    if (items.length < 7 || !adKey) return `<div class="grid">${items.map(card).join("")}</div>`;
    const a = items.slice(0, startAt), b = items.slice(startAt);
    return `<div class="grid">${a.map(card).join("")}</div>${adSlot(adKey, "ad-mid")}<div class="grid">${b.map(card).join("")}</div>`;
  }

  function listingPage(typeKey, route, query) {
    const grade = query.grade || "all", subject = query.subject || "all";
    let items = OEG.byType(typeKey);
    if (grade !== "all") items = items.filter(i => i.grade === grade || i.grade === "all");
    if (subject !== "all") items = items.filter(i => i.subject === subject);
    const label = OEG.typeLabel(typeKey);
    const body = items.length
      ? gridWithAd(items, 6, "listMid")
      : `<div class="panel" style="text-align:center;padding:50px 20px"><div style="font-size:3rem">📭</div><h3>${t("empty.title")}</h3><p style="color:var(--muted)">${t("empty.sub")}</p></div>`;
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${OEG.esc(label)}</div>
      <h1>${OEG.typeIcon(typeKey)} ${OEG.esc(label)}</h1>
      <p class="sub">${items.length} ${t("grade.items")}</p></div>
      ${filtersHtml(typeKey, route, grade, subject)}
      ${adSlot("listTop")}
      <div id="listWrap">${body}</div>${adSlot("contentBottom")}`;
  }

  function bindFilters(typeKey, route) {
    const g = document.getElementById("fGrade"), s = document.getElementById("fSubject"), c = document.getElementById("fCat");
    if (!g) return;
    const apply = () => {
      const q = [];
      if (g.value !== "all") q.push("grade=" + g.value);
      if (s.value !== "all") q.push("subject=" + s.value);
      location.hash = `#/${c && c.value !== route ? c.value : route}` + (q.length ? "?" + q.join("&") : "");
    };
    g.onchange = apply; s.onchange = apply; if (c) c.onchange = apply;
  }

  /* ---------- 🎓 ધોરણ પેજ — બધાં પ્રકારનું મટિરિયલ + ૭ વિષયો ---------- */
  function gradePage(grade, query) {
    const g = grade && grade !== "all" ? grade : (query.grade || "all");
    if (g === "all") {
      return `<div class="page-head"><h1>🎓 ${t("sec.grades")}</h1><p>${t("sec.gradesSub")}</p></div>
        <div class="grid-grades">${REAL_GRADES().map(k => gradeCard(k)).join("")}</div>${adSlot("contentBottom")}`;
    }
    const subject = query.subject || "all", cat = query.cat || "all";
    const subs = OEG.tax().gradeSubjects;
    let items = OEG.state.catalog.filter(i => i.grade === g || i.grade === "all");
    if (subject !== "all") items = items.filter(i => i.subject === subject);
    if (cat !== "all") items = items.filter(i => i.type === cat);
    const types = OEG.tax().types.filter(x => items.length || true);
    const counts = {};
    OEG.state.catalog.filter(i => i.grade === g || i.grade === "all").forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    const body = items.length ? gridWithAd(items, 6, "listMid")
      : `<div class="panel" style="text-align:center;padding:46px 20px"><div style="font-size:2.6rem">📭</div><h3>${t("grade.noItems")}</h3></div>`;
    return `<div class="page-head">
      <div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / <a href="#/grade">${t("sec.grades")}</a> / ${OEG.esc(OEG.gradeLabel(g))}</div>
      <h1>${OEG.gradeIcon(g)} ${OEG.esc(OEG.gradeLabel(g))}</h1>
      <p class="sub">${t("grade.materialsSub")}</p>
    </div>
    <div class="grade-tabs" id="gTypes">
      <a class="g-tab ${cat === "all" ? "on" : ""}" href="#/grade/${g}${subject !== "all" ? "?subject=" + subject : ""}">${t("grade.all")} <small>${OEG.state.catalog.filter(i => i.grade === g || i.grade === "all").length}</small></a>
      ${OEG.tax().types.filter(x => x.route).map(x => `<a class="g-tab ${cat === x.key ? "on" : ""}" href="#/grade/${g}?cat=${x.key}${subject !== "all" ? "&subject=" + subject : ""}">${x.icon || "📄"} ${OEG.esc(OEG.typeLabel(x.key))} <small>${counts[x.key] || 0}</small></a>`).join("")}
    </div>
    <div class="section-head"><div><h2>📚 ${t("grade.subjects")} <small style="font-weight:700;color:var(--muted)">(${subs.length})</small></h2><p>${t("grade.subjectsSub")} — ${OEG.esc(OEG.gradeLabel(g))}</p></div>
      <a href="#/quiz?cat=grade&grade=${g}">🧠 ${t("grade.quizNow")} →</a></div>
    <div class="subject-row" id="gSubs">
      ${subs.map(s => `<a class="sub-chip ${subject === s.key ? "on" : ""}" href="#/grade/${g}?subject=${s.key}${cat !== "all" ? "&cat=" + cat : ""}">${OEG.esc(OEG.subjectLabel(s.key))}<small>${OEG.state.catalog.filter(i => (i.grade === g || i.grade === "all") && i.subject === s.key).length}</small></a>`).join("")}
    </div>
    ${adSlot("gradeTop")}
    <div id="listWrap">${body}</div>
    ${adSlot("contentBottom")}`;
  }
  function gradeCard(k) {
    const n = OEG.state.catalog.filter(i => i.grade === k).length;
    return `<a class="grade-card reveal glow" href="#/grade/${k}"><div class="g-ic">${OEG.gradeIcon(k)}</div><b>${OEG.esc(OEG.gradeLabel(k))}</b><span class="g-meta">${n} ${t("grade.items")} · ${OEG.tax().gradeSubjects.length} ${t("grade.subjects")}</span></a>`;
  }

  /* 🧠 એક કેટેગરી = એક glowing કાર્ડ (ધોરણ/સબ-કેટેગરી નંબર સાથે) */
  function qzCatCard(c) {
    const mode = c.mode || "none";
    const subs = c.subs || [];
    const meta = mode === "grade"
      ? `🎓 ${OEG.tax().grades.filter(g => g.key === "balvatika" || /^\d+$/.test(g.key)).length} ${t("grade.pickGrade")} · 📘 ${(OEG.tax().gradeSubjects || []).length} ${t("grade.subjects")}`
      : mode === "sub" ? `🧩 ${subs.length} ${t("quiz.subCats")}` : `🧠 ${c.count} ${t("grade.items")}`;
    const chips = mode === "sub" && subs.length
      ? `<div class="qz-mini">${subs.slice(0, 4).map(x => `<span>${x.icon || "🏷️"} ${OEG.esc(OEG.taxLabel(x, "subject"))}<b>${OEG.quiz.subCount(c.key, x.key)}</b></span>`).join("")}</div>` : "";
    const empty = !c.count;
    return `<a class="card qz-cat-card glow${empty ? " qz-soon" : ""}" href="#/quiz?cat=${OEG.esc(c.key)}"${empty ? ' aria-disabled="true"' : ""}>
      <span class="qz-ic">${c.icon || "🧠"}</span>
      <h3>${OEG.esc(OEG.taxLabel(c, "subject"))}</h3>
      <p>${OEG.esc(meta)}</p>${chips}
      <span class="qz-go">${empty ? "🚧 " + t("quiz.noQuestions") : t("quiz.start") + " →"}</span></a>`;
  }
  /* 👁 સૌથી વધુ જોવાયેલ પોસ્ટ (localStorage + data/views.json) */
  function mostViewed() {
    const pool = OEG.state.catalog.filter(i => ["post", "video", "textbook", "workbook", "link"].includes(i.type));
    const top = OEG.views.ranked(pool, 4);
    const best = top.filter(x => x.n > 0);
    if (best.length) return best.slice(0, 4);
    return top.slice(0, 4).map(x => ({ item: x.item, n: 0 }));
  }

  /* ---------- 🧠 ક્વિઝ ---------- */
  function quizPage(query) {
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${t("page.quiz")}</div>
      <h1>🧠 ${OEG.esc(t("page.quiz"))}</h1><p class="sub">${t("quiz.sub")}</p></div>
      ${adSlot("quizTop")}
      <div id="quizMount" class="quiz-mount">${OEG.esc(t("quiz.start"))}…</div>
      ${adSlot("quizResult")}
      ${adSlot("contentBottom")}`;
  }

  /* ---------- Pages ---------- */
  function homePage() {
    const posts = OEG.byType("post").slice(0, 3);
    const vids = OEG.byType("video").slice(0, 6);
    const popular = OEG.state.catalog.filter(i => ["textbook", "workbook"].includes(i.type)).slice(0, 4);
    const quizCats = (OEG.quiz && OEG.quiz.cats ? OEG.quiz.cats() : []);
    const total = OEG.state.catalog.length;
    const quizN = OEG.state.catalog.filter(i => i.type === "quiz").length;
    return `
    <section class="hero">
      <h1>${OEG.esc(uiText("heroTitle", t("hero.title")))}</h1><p>${OEG.esc(uiText("heroSub", t("hero.sub")))}</p>
      <div class="hero-cta"><a class="btn btn-primary" href="#/textbooks">${t("hero.cta1")}</a><a class="btn btn-ghost" href="#/quiz">🧠 ${t("nav.quiz")}</a></div>
      <div class="hero-stats">
        <div><b>${total}+</b><span>${t("nav.textbooks")}</span></div>
        <div><b>${REAL_GRADES().length}</b><span>${t("sec.grades")}</span></div>
        <div><b>${OEG.tax().types.length}</b><span>${t("admin.catTab")}</span></div>
        <div><b>3</b><span>${t("lang.name")}</span></div>
      </div>
      <div class="follow-strip"><span class="fs-title">👉 ${t("follow.title")}</span>${followButtons("fb-sm")}</div>
    </section>
    ${adSlot("homeTop")}
    <section class="section"><div class="section-head"><div><h2>${t("sec.grades")}</h2><p>${t("grade.materialsSub")}</p></div><a href="#/grade">${t("grade.all")} →</a></div>
      <div class="grid-grades">${REAL_GRADES().map(gradeCard).join("")}</div>
    </section>
    <section class="section"><div class="section-head"><div><h2>${t("sec.features")}</h2></div></div>
      <div class="grid grid-feat">
        ${NAV().slice(1, 7).map(n => `<a class="card feature-card reveal glow" href="#/${n.route}"><span class="feat-ic">${n.icon}</span><h3>${OEG.esc(n.label || t(n.key))}</h3><span class="feat-go">${t("btn.open")} →</span></a>`).join("")}
      </div>
    </section>
    ${adSlot("homeMid")}
    <section class="section"><div class="section-head"><div><h2>🧠 ${t("page.quiz")}</h2><p>${t("quiz.sub")}</p></div><a href="#/quiz">${t("quiz.start")} →</a></div>
      <div class="grid grid-qz">${quizCats.map(qzCatCard).join("")}</div>
    </section>
    <section class="section"><div class="section-head"><div><h2>${t("sec.latest")}</h2></div><a href="#/blog">${t("btn.readMore")} →</a></div>
      <div class="grid">${posts.map(card).join("") || `<p style="color:var(--muted)">${t("empty.title")}</p>`}</div>
    </section>
    ${OEG.ads.render("inFeed", "ad-infeed")}
    <section class="section"><div class="section-head"><div><h2>${t("sec.videos")}</h2></div><a href="#/videos">${t("btn.readMore")} →</a></div>
      <div class="video-grid">${vids.map(videoCard).join("") || `<p style="color:var(--muted)">${t("empty.title")}</p>`}</div>
    </section>
    <section class="section"><div class="section-head"><div><h2>👁 ${t("sec.mostViewed")}</h2><p>${t("sec.mostViewedSub")}</p></div><a href="#/blog">${t("btn.readMore")} →</a></div>
      <div class="grid">${mostViewed().map(({ item, n }) => card(item, n)).join("") || popular.map(card).join("")}</div>
    </section>
    ${adSlot("contentBottom")}`;
  }

  /* ▶ વિડિયો — પોસ્ટર, ક્લિક કરતાં અહીં જ ચાલે (ડાઉનલોડ/બહાર જવું નહીં) */
  const ytThumbs = (id) => {
    const poster = OEG.yt ? OEG.yt.thumb(id, "hqdefault") : "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    const big = OEG.yt ? OEG.yt.thumb(id, "maxresdefault") : poster;
    return { poster, big };
  };
  function videoCard(item) {
    const id = OEG.youtubeId(item.fileUrl);
    if (!id) return "";
    const th = ytThumbs(id);
    const views = OEG.views.count(item.id);
    return `<article class="video-card reveal glow" data-yt="${id}" data-vid="${OEG.esc(item.id)}">
      <div class="ratio yt-poster" data-ytbox="${OEG.esc(id)}" data-play="${OEG.esc(id)}" role="button" tabindex="0" aria-label="▶ ${OEG.esc(OEG.title(item))}">
      <img src="${OEG.esc(th.big)}" onerror="this.onerror=null;this.src='${OEG.esc(th.poster)}'" alt="${OEG.esc(OEG.title(item))}" loading="lazy" draggable="false">
      <button type="button" class="yt-play" data-play="${OEG.esc(id)}" aria-label="▶"><span>▶</span></button>
      <span class="yt-note">${t("yt.playHere")}</span></div>
      <div class="vc-body"><h3>${OEG.esc(OEG.title(item))}</h3><p>${OEG.esc(OEG.desc(item))}</p>
      <div class="vc-meta">${item.channel ? `<span>📺 ${OEG.esc(item.channel)}</span>` : ""}<span>👁 ${views}</span><span>📅 ${OEG.esc(item.date || "")}</span></div>
      <div class="card-actions"><a class="btn btn-brand btn-sm" href="#/view/${item.id}">▶ ${t("btn.view")}</a></div></div></article>`;
  }
  /* ▶ અહીં જ ચાલે — youtube-nocookie, નહીં ચાલે તો youtube.com નો બીજો રસ્તો */
  function ytSrc(id, alt) {
    const host = alt ? "https://www.youtube.com/embed/" : "https://www.youtube-nocookie.com/embed/";
    const lang = (OEG.state && OEG.state.lang) || "gu";
    return host + encodeURIComponent(id) + "?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=0&hl=" + lang;
  }
  function playInline(box, id, autoplay, alt, keep) {
    if (!box || !id) return;
    if (!keep) box.dataset.alt = alt ? "1" : "0";
    const useAlt = alt === undefined ? box.dataset.alt === "1" : !!alt;
    box.innerHTML = `<iframe src="${ytSrc(id, useAlt)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" title="YouTube" loading="eager"></iframe>
      <span class="yt-altwrap"><button type="button" class="yt-alt" data-alt="${OEG.esc(id)}" title="${OEG.esc(t("yt.altServer"))}">↻ ${OEG.esc(t("yt.altServer"))}</button></span>`;
    box.classList.add("yt-live");
    const fr = box.querySelector("iframe");
    const ab = box.querySelector("[data-alt]");
    if (ab) ab.onclick = (e) => { e.preventDefault(); e.stopPropagation(); playInline(box, id, true, !useAlt, true); };
    if (fr) {
      let ok = false;
      fr.onload = () => { ok = true; };
      setTimeout(() => { if (!ok && !useAlt) playInline(box, id, true, true, true); }, 4000);
    }
  }
  function bindVideoPlayers(root) {
    const seen = [];
    (root || document).querySelectorAll("[data-play]").forEach(b => {
      if (seen.indexOf(b) >= 0) return;
      seen.push(b);
      const go = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const id = b.dataset.play;
        const box = b.closest("[data-ytbox]") || (b.parentElement && b.parentElement.querySelector("[data-ytbox]")) || b.parentElement;
        if (box && box.classList.contains("yt-live")) return;   /* પહેલેથી જ ચાલે છે */
        const card = b.closest("[data-vid]");
        if (card && card.dataset.vid) OEG.views.hit(card.dataset.vid);
        playInline(box, id, true, false);
      };
      b.onclick = go;
      b.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") go(e); };
    });
  }

  function videosPage(query) {
    const grade = (query && query.grade) || "all";
    let vids = OEG.byType("video");
    if (grade !== "all") vids = vids.filter(i => i.grade === grade || i.grade === "all");
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${t("page.videos")}</div><h1>▶️ ${t("page.videos")}</h1>
      <p class="sub">${vids.length} ${t("grade.items")} · ${t("yt.byUrlNote")}</p></div>
      <div class="filters"><label>${t("filter.grade")}</label><select id="fGrade"><option value="all">${t("filter.all")}</option>${GRADES().map(g => `<option value="${g}" ${g === grade ? "selected" : ""}>${OEG.esc(OEG.gradeLabel(g))}</option>`).join("")}</select></div>
      ${adSlot("videoTop")}
      ${vids.length ? `<div class="video-grid">${vids.map(videoCard).join("")}</div>` : `<div class="panel" style="text-align:center;padding:50px"><h3>${t("empty.title")}</h3><p style="color:var(--muted)">${t("empty.sub")}</p></div>`}
      ${adSlot("contentBottom")}`;
  }

  function gamesPage() {
    const uploaded = OEG.byType("game");
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${t("page.games")}</div><h1>🎮 ${t("page.games")}</h1>
      <p>${t("game.builtIn")} + ${t("game.uploaded")}</p></div>
      ${adSlot("gameTop")}
      <div class="grid" style="margin-bottom:26px">
        <div class="card glow" style="padding:24px"><div style="font-size:2rem">🧠</div><h3>${t("quiz.title")}</h3><p style="color:var(--muted);font-size:.9rem">${OEG.esc(t("quiz.sub"))}</p><div class="card-actions"><a class="btn btn-brand btn-sm" href="#/quiz">${t("quiz.start")}</a></div></div>
        <div class="card glow" style="padding:24px"><div style="font-size:2rem">🃏</div><h3>${t("game.memory")}</h3><div class="card-actions"><button class="btn btn-brand btn-sm" data-game="memory">${t("game.playNow")}</button></div></div>
        <div class="card glow" style="padding:24px"><div style="font-size:2rem">🔢</div><h3>${t("game.math")}</h3><div class="card-actions"><button class="btn btn-brand btn-sm" data-game="math">${t("game.playNow")}</button></div></div>
      </div>
      <div id="gameMount"></div>
      ${uploaded.length ? `<div class="section-head" style="margin-top:34px"><h2>${t("game.uploaded")}</h2></div><div class="grid">${uploaded.map(card).join("")}</div>` : ""}
      ${adSlot("contentBottom")}`;
  }

  function viewerFor(item) {
    const kind = OEG.fileKind(item);
    const yt = OEG.youtubeId(item.fileUrl);
    if (yt) {
      const id = yt;
      const th = ytThumbs(id);
      return `<div class="viewer"><div class="viewer-head"><b>▶️ ${OEG.esc(OEG.title(item))}</b>
          <span class="lock-tag">${t("yt.playHere")}</span></div>
        <div class="ratio yt-poster yt-big" data-ytbox="${OEG.esc(id)}" data-play="${OEG.esc(id)}" data-vid="${OEG.esc(item.id)}" role="button" tabindex="0" aria-label="▶ ${OEG.esc(OEG.title(item))}">
          <img src="${OEG.esc(th.big)}" onerror="this.onerror=null;this.src='${OEG.esc(th.poster)}'" alt="${OEG.esc(OEG.title(item))}" draggable="false">
          <button type="button" class="yt-play" data-play="${OEG.esc(id)}" aria-label="▶"><span>▶</span></button>
          <span class="yt-note">${t("yt.playHere")}</span>
        </div>
        <div class="yt-bar"><b>${OEG.esc(OEG.title(item))}</b>
          ${item.channel ? `<span>📺 ${OEG.esc(item.channel)}</span>` : ""}
          <span>👁 ${OEG.views.count(item.id)}</span></div></div>`;
    }
    if (kind === "pdf" && item.fileUrl) {
      return `<div class="viewer"><div class="viewer-head"><b>📄 ${t("viewer.pdf")}</b><span class="lock-tag">🔒</span></div>
        <iframe src="${OEG.esc(item.fileUrl)}" title="${OEG.esc(OEG.title(item))}"></iframe></div>`;
    }
    if (kind === "html" && item.fileUrl) {
      return `<div class="viewer"><div class="viewer-head"><b>🌐 ${t("viewer.html")}</b><span class="lock-tag">🔒</span></div>
        <iframe src="${OEG.esc(item.fileUrl)}" title="${OEG.esc(OEG.title(item))}" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe></div>`;
    }
    if (kind === "image" && item.fileUrl) {
      return `<div class="viewer"><div class="viewer-head"><b>🖼️ ${t("viewer.image")}</b><span class="lock-tag">🔒</span></div><img class="view-img" src="${OEG.esc(item.fileUrl)}" alt="" draggable="false"></div>`;
    }
    if (kind === "doc" && item.fileUrl) {
      const emb = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.fileUrl)}`;
      return `<div class="viewer"><div class="viewer-head"><b>${t("viewer.doc")}</b><span class="lock-tag">🔒</span></div>
        <iframe src="${emb}" title="${OEG.esc(OEG.title(item))}" allowfullscreen></iframe></div>`;
    }
    if (kind === "link" && item.fileUrl) {
      return `<div class="viewer"><div class="viewer-head"><b>🔗 ${OEG.esc(OEG.title(item))}</b>
        <span class="lock-tag" style="margin-left:auto">${t("viewer.linkNote")}</span>
        <a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="${OEG.esc(item.fileUrl)}">↗</a></div>
        <iframe src="${OEG.esc(item.fileUrl)}" title="${OEG.esc(OEG.title(item))}" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
    }
    return "";
  }

  function viewPage(id) {
    const item = OEG.byId(id);
    if (!item) return `<div class="panel" style="text-align:center;padding:50px"><h3>${t("empty.title")}</h3><a class="btn btn-brand" href="#/">${t("btn.back")}</a></div>`;
    const related = OEG.state.catalog.filter(i => i.id !== item.id && (i.grade === item.grade || i.subject === item.subject)).slice(0, 4);
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / <a href="#/${OEG.typeRoute(item.type)}">${OEG.esc(OEG.typeLabel(item.type))}</a>${item.grade && item.grade !== "all" ? ` / <a href="#/grade/${item.grade}">${OEG.esc(OEG.gradeLabel(item.grade))}</a>` : ""}</div>
      <h1>${OEG.esc(OEG.title(item))}</h1>
      <div class="card-meta" style="margin-top:8px"><span class="badge">${OEG.esc(OEG.gradeLabel(item.grade))}</span><span>📅 ${OEG.esc(item.date || "")}</span>${item.subject ? `<span>🏷️ ${OEG.esc(OEG.subjectLabel(item.subject))}</span>` : ""}</div></div>
      ${adSlot("viewTop")}
      ${item.image ? `<div class="post-hero"><img src="${OEG.esc(item.image)}" alt="" draggable="false"></div>` : ""}
      ${viewerFor(item)}
      ${OEG.langField(item.body) ? `<div class="post-body" data-allow-select style="margin-top:22px">${OEG.esc(OEG.langField(item.body))}</div>` : ""}
      ${adSlot("viewMid")}
      <div class="share-row">${shareButtons()}</div>
      ${related.length ? `<section class="section"><div class="section-head"><h2>🔗 ${t("sec.related")}</h2><a href="#/${OEG.esc(OEG.typeRoute(item.type))}">${t("btn.readMore")} →</a></div><div class="grid">${related.map(card).join("")}</div></section>` : ""}
      <div class="follow-strip"><span class="fs-title">👉 ${t("follow.title")}</span>${followButtons("fb-sm")}</div>
      ${adSlot("contentBottom")}`;
  }

  function postPage(id) { return viewPage(id); }

  function authPage(mode) {
    const isReg = mode === "register";
    return `<div class="form-card">
      <h2>${isReg ? "📝 " + t("page.register") : "🔑 " + t("page.login")}</h2>
      <div id="authMsg"></div>
      <form id="authForm">
        ${isReg ? `<div class="field"><label>${t("auth.name")}</label><input name="name" required autocomplete="name"></div>` : ""}
        <div class="field"><label>${t("auth.email")}</label><input name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label>${t("auth.password")}</label><input name="password" type="password" required minlength="6" autocomplete="${isReg ? "new-password" : "current-password"}"></div>
        ${isReg ? `<div class="field"><label>${t("auth.role")}</label><select name="role">
          <option value="student">${t("auth.student")}</option><option value="teacher">${t("auth.teacher")}</option><option value="principal">${t("auth.principal")}</option><option value="other">${t("auth.other")}</option></select></div>
        <div class="form-row">
          <div class="field"><label>${t("grade.pickGrade")}</label><select name="grade">${regGradeOpts()}</select></div>
          <div class="field"><label>${t("auth.subject")}</label><select name="subject">${regSubjectOpts()}</select></div>
        </div>` : ""}
        <button class="btn btn-brand" style="width:100%;justify-content:center" type="submit">${isReg ? t("auth.registerBtn") : t("auth.loginBtn")}</button>
      </form>
      <p style="text-align:center;margin-top:16px;font-size:.92rem"><a href="#/${isReg ? "login" : "register"}">${isReg ? t("auth.haveAccount") : t("auth.noAccount")}</a></p>
    </div>`;
  }

  function showRegisterPending(res) {
    const c = OEG.state.config;
    const msgTxt = "OEG Registration\nName: " + res.name + "\nEmail: " + res.email + "\nRole: " + res.role
      + "\nGrade: " + (res.grade ? OEG.gradeLabel(res.grade) : "-") + "\nSubject: " + (res.subject && res.subject !== "all" ? OEG.subjectLabel(res.subject) : "-");
    const enc = encodeURIComponent(msgTxt);
    const msgEl = document.getElementById("authMsg");
    if (!msgEl) return;
    msgEl.innerHTML = `<div class="alert alert-ok" style="text-align:left">
      <b>${t("auth.pendingTitle")}</b>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn btn-sm btn-outline" target="_blank" rel="noopener" href="https://wa.me/${OEG.esc(((c.social || {}).whatsapp || "").replace(/[^0-9]/g, ""))}?text=${enc}">📲 ${t("auth.sendWhatsApp")}</a>
        ${c.contactEmail ? `<a class="btn btn-sm btn-outline" href="mailto:${OEG.esc(c.contactEmail)}?subject=${encodeURIComponent("OEG Registration Request")}&body=${enc}">📧 ${t("auth.sendEmail")}</a>` : ""}
      </div></div>`;
    const f = document.getElementById("authForm");
    if (f) f.style.display = "none";
  }

  /* 🎓 રજિસ્ટ્રેશન: ધોરણ + વિષય (વિષયની યાદી હંમેશા એ જ ૭ વિષય) */
  function regGradeOpts() {
    const gs = OEG.tax().grades.filter(g => g.key === "balvatika" || /^\d+$/.test(g.key));
    return `<option value="all">${t("quiz.allGrades")}</option>` + gs.map(g => `<option value="${OEG.esc(g.key)}">${OEG.esc(OEG.gradeLabel(g.key))}</option>`).join("");
  }
  function regSubjectOpts() {
    const subs = OEG.tax().gradeSubjects || [];
    return `<option value="all">${t("quiz.allSubjects")}</option>` + subs.map(x => `<option value="${OEG.esc(x.key)}">${x.icon || "📘"} ${OEG.esc(OEG.subjectLabel(x.key))}</option>`).join("");
  }

  function bindAuth(mode) {
    document.getElementById("authForm").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const msgEl = document.getElementById("authMsg");
      try {
        const res = mode === "register"
          ? await OEG.auth.register({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: fd.get("role"), grade: fd.get("grade"), subject: fd.get("subject") })
          : await OEG.auth.login({ email: fd.get("email"), password: fd.get("password") });
        if (res && res.pending) { showRegisterPending(res); return; }
        renderAuthArea();
        OEG.toast("👋 " + t("auth.welcome") + ", " + (res.name || res.email));
        location.hash = "#/";
      } catch (err) {
        msgEl.innerHTML = `<div class="alert alert-error">${OEG.esc(err.message)}</div>`;
      }
    };
  }

  function searchPage(q) {
    const res = OEG.search(q);
    return `<div class="page-head"><h1>🔍 ${t("search.results")}: “${OEG.esc(q)}”</h1></div>
      ${res.length ? `<div class="grid">${res.map(card).join("")}</div>` : `<div class="panel" style="text-align:center;padding:50px"><h3>${t("search.none")}</h3></div>`}`;
  }

  /* ---------- Router ---------- */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const [pathPart, queryPart] = h.split("?");
    const seg = pathPart.split("/").filter(Boolean);
    const query = {};
    new URLSearchParams(queryPart || "").forEach((v, k) => query[k] = v);
    return { seg, query };
  }
  function currentRoute() {
    const { seg } = parseHash();
    return seg[0] || "home";
  }

  async function render() {
    const { seg, query } = parseHash();
    const route = seg[0] || "home";
    /* Admin માં ઉમેર્યું/કાઢ્યું/બદલ્યું હોય તો સાઇટ પર પાછા આવતાં જ તરત નવું દેખાય */
    if (OEG.state.__dirty && route !== "admin") {
      OEG.state.__dirty = false;
      try { await Promise.all([OEG.loadConfig(), OEG.loadCatalog(), OEG.quiz ? OEG.quiz.load() : Promise.resolve(), OEG.views ? OEG.views.load() : Promise.resolve()]); } catch (e) {}
    }
    const app = $app();
    window.scrollTo({ top: 0 });
    closeSidebar();
    let html = "", after = null;

    const ty = OEG.typeOfRoute(route);
    const CORE = ["home", "admin", "login", "register", "view", "search", "grade", "quiz"];
    if (!sectionOn(route) && CORE.indexOf(route) < 0) {
      app.innerHTML = `<section class="panel empty-state" style="text-align:center;padding:56px 20px">
        <div style="font-size:2.4rem">🚧</div><h2>${OEG.esc(t("ui.sectionOff"))}</h2>
        <p style="color:var(--muted);margin-top:8px">${OEG.esc(t("ui.sectionOffSub"))}</p>
        <div style="margin-top:16px"><a class="btn btn-brand" href="#/">← ${t("btn.home")}</a></div></section>`;
      renderSidebar();
      return;
    }
    switch (route) {
      case "home": html = homePage(); break;
      case "games": html = gamesPage(); after = () => {
        app.querySelectorAll("[data-game]").forEach(b => b.onclick = () => {
          const m = { quiz: OEG.games.mountQuiz, memory: OEG.games.mountMemory, math: OEG.games.mountMath }[b.dataset.game];
          m(document.getElementById("gameMount"));
          document.getElementById("gameMount").scrollIntoView({ behavior: "smooth" });
        });
      }; break;
      case "quiz": html = quizPage(query); after = () => {
        const u = OEG.state.user || {};
        OEG.quiz.mount(document.getElementById("quizMount"), { grade: query.grade, cat: query.cat, sub: query.sub, subject: query.subject || u.subject || "" });
      }; break;
      case "grade": html = gradePage(seg[1], query); break;
      case "videos": html = videosPage(query); after = () => {
        const g = document.getElementById("fGrade");
        if (g) g.onchange = () => { location.hash = g.value === "all" ? "#/videos" : "#/videos?grade=" + g.value; };
        bindVideoPlayers(app);
      }; break;
      case "view": html = viewPage(seg[1]); after = () => { OEG.views.hit(seg[1]); bindVideoPlayers(app); }; break;
      case "post": html = postPage(seg[1]); after = () => { OEG.views.hit(seg[1]); bindVideoPlayers(app); }; break;
      case "login": html = authPage("login"); after = () => bindAuth("login"); break;
      case "register": html = authPage("register"); after = () => bindAuth("register"); break;
      case "admin":
        if (!OEG.canAdmin()) { html = await adminLoginPage(); after = bindAdminLogin; }
        else { await OEG.auth.recallSecret(); html = `<div id="adminMount"></div>`; after = () => OEG.admin.render(document.getElementById("adminMount")); }
        break;
      case "search": html = searchPage(query.q || ""); break;
      default:
        if (ty) {
          if (ty.key === "video") { html = videosPage(query); after = () => { bindVideoPlayers(app); }; }
          else { html = listingPage(ty.key, route, query); after = () => { bindFilters(ty.key, route); bindVideoPlayers(app); }; }
        } else html = homePage();
    }
    app.innerHTML = html;
    if (after) after();
    if (route !== "admin" && route !== "login" && route !== "register") {
      bindShare(document);
      bindVideoPlayers(app);
      OEG.ads.flush(app);
      applySeo(route, query, seg, app);
    }
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .08 });
    app.querySelectorAll(".reveal").forEach(el => io.observe(el));
    renderNav();
    renderSidebar();
  }

  /* ---------- 🔎 SEO meta (title/desc/canonical/OG/JSON-LD) ---------- */
  function applySeo(route, query, seg, app) {
    if (!OEG.seo) return;
    const info = { key: null, pageTitle: null, title: null, desc: null, items: null, item: null, image: "", crumb: null, type: "website", fileUrl: "" };
    const home = { name: OEG.t("nav.home"), url: OEG.shareBase() };
    if (route === "home") { info.key = "hero.title"; }
    else if (route === "view" || route === "post") {
      const it = OEG.byId(seg[1]);
      if (it) {
        info.item = it;
        info.pageTitle = OEG.langField(it.title);
        info.desc = OEG.langField(it.desc) || OEG.langField(it.body);
        info.image = OEG.thumbnail(it);
        info.fileUrl = it.fileUrl || "";
        info.type = it.type === "video" ? "video.other" : it.type === "post" ? "article" : "website";
        info.crumb = [home, { name: OEG.typeLabel(it.type), url: OEG.shareUrl("#/" + OEG.typeRoute(it.type)) }, { name: OEG.langField(it.title), url: OEG.shareUrl() }];
      }
    } else if (route === "grade") {
      const g = seg[1];
      info.pageTitle = OEG.gradeLabel(g);
      info.title = OEG.gradeLabel(g) + " — " + OEG.t("grade.materials") + " | " + OEG.siteName();
      info.desc = OEG.t("grade.materialsSub");
      info.items = OEG.state.catalog.filter(i => i.grade === g || i.grade === "all");
      info.crumb = [home, { name: OEG.t("sec.grades"), url: OEG.shareUrl("#/grade") }, { name: OEG.gradeLabel(g), url: OEG.shareUrl() }];
    } else if (route === "quiz") {
      info.pageTitle = OEG.t("page.quiz"); info.desc = OEG.t("quiz.sub"); info.type = "website";
      info.crumb = [home, { name: OEG.t("page.quiz"), url: OEG.shareUrl() }];
    } else {
      const ty = OEG.typeOfRoute(route);
      if (ty) {
        info.pageTitle = OEG.typeLabel(ty.key);
        info.desc = OEG.t("grade.materialsSub");
        info.items = OEG.byType(ty.key);
        info.crumb = [home, { name: OEG.typeLabel(ty.key), url: OEG.shareUrl() }];
      } else if (route === "search") { info.title = OEG.t("search.results") + " — " + OEG.siteName(); }
    }
    const descEl = app && app.querySelector(".page-head .sub");
    if (!info.desc && descEl) info.desc = descEl.textContent.slice(0, 200);
    try { OEG.seo.apply(route, info); } catch (e) {}
  }

  /* બ્રાઉઝર autofill/password-manager રોકે: readonly → focus પર ખુલે */
  const noFill = 'autocomplete="off" data-lpignore="true" data-1p-ignore="true" readonly onfocus="this.removeAttribute(\'readonly\')"';
  async function adminLoginPage() {
    const adm = await OEG.auth.getAdminFile();
    const setup = !OEG.auth.adminConfigured(adm);
    const needTok = setup || !OEG.auth.hasSecret();
    const tokBlock = needTok
      ? `${setup ? "" : `<button type="button" class="linklike" id="admTokToggle" style="margin-bottom:10px">🔑 ${t("admin.useSecret")}</button>`}
         <div class="field"${setup ? "" : ` id="admTokWrap" style="display:none"`}><label>${t("admin.token")}</label>
           <input name="token" type="password" ${noFill}>
           <label class="chk"><input type="checkbox" name="remember" checked> ${t("admin.remember")}</label></div>`
      : `<p class="sub" style="margin-top:4px">${t("admin.onDevice")}</p>`;
    return `<div class="form-card" style="margin-top:34px">
      <h2>🛡️ ${t("admin.loginTitle")}</h2>
      ${setup ? "" : `<p class="sub">${t("admin.loginSub")}</p>`}
      <div id="admMsg"></div>
      <form id="admForm" autocomplete="off">
        <div class="field"><label>${t("auth.email")}</label><input name="email" type="email" required ${noFill}></div>
        <div class="field"><label>${t("auth.password")}</label><input name="password" type="password" required minlength="6" ${noFill}></div>
        ${tokBlock}
        <button class="btn btn-brand" style="width:100%;justify-content:center" type="submit">🔓 ${t("admin.enterBtn")}</button>
      </form>
    </div>`;
  }
  function bindAdminLogin() {
    const tt = document.getElementById("admTokToggle");
    if (tt) tt.onclick = (e) => {
      e.preventDefault();
      const f = document.getElementById("admTokWrap");
      if (!f) return;
      const show = f.style.display === "none";
      f.style.display = show ? "block" : "none";
      if (show) f.querySelector("[name=token]").focus();
    };
    const form = document.getElementById("admForm");
    if (!form) return;
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await OEG.auth.loginAdmin({ email: fd.get("email"), password: fd.get("password"), token: fd.get("token"), remember: !!fd.get("remember") });
        renderAuthArea();
        render();
      } catch (err) {
        document.getElementById("admMsg").innerHTML = `<div class="alert alert-error">${OEG.esc(err.message)}</div>`;
      }
    };
  }

  /* ---------- Sidebar / theme / lang ---------- */
  const sidebar = document.getElementById("sidebar"), scrim = document.getElementById("scrim"), burger = document.getElementById("hamburger");
  function closeSidebar() { sidebar.classList.remove("open"); scrim.classList.remove("show"); burger.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
  burger.onclick = () => {
    const open = sidebar.classList.toggle("open");
    scrim.classList.toggle("show", open); burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  scrim.onclick = closeSidebar;

  function applyTheme() {
    document.documentElement.dataset.theme = OEG.state.theme;
    const acc = uiCfg().accent;
    if (acc && /^#[0-9a-fA-F]{6}$/.test(acc)) {
      document.documentElement.style.setProperty("--brand", acc);
      document.documentElement.style.setProperty("--brand-2", acc);
    } else {
      document.documentElement.style.removeProperty("--brand");
      document.documentElement.style.removeProperty("--brand-2");
    }
    document.getElementById("themeToggle").textContent = OEG.state.theme === "dark" ? "☀️" : "🌙";
  }
  document.getElementById("themeToggle").onclick = () => {
    OEG.state.theme = OEG.state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("oeg-theme", OEG.state.theme);
    applyTheme();
  };
  document.getElementById("langSelect").onchange = (e) => {
    OEG.state.lang = e.target.value;
    localStorage.setItem("oeg-lang", OEG.state.lang);
    applyI18n(); render();
  };
  document.getElementById("globalSearch").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) location.hash = "#/search?q=" + encodeURIComponent(e.target.value.trim());
  });

  /* ---------- 🛡️ કોપી/રાઈટ-ક્લિક સુરક્ષા ----------
     ટેક્સ્ટ સિલેક્શન CSS માં બંધ છે (user-select:none);
     અહીં right-click, drag, copy, view-source/save/print, devtools શોર્ટકટ રોકાય છે.
     ફોર્મ ફીલ્ડ્સ (input/textarea) છૂટછાટ ધરાવે છે — admin કામ ચાલુ રહે. */
  const guardAllow = (el) => !!(el && el.closest && el.closest("input,textarea,select,[contenteditable],[data-allow-select]"));
  document.addEventListener("contextmenu", (e) => { if (!guardOn() || guardAllow(e.target)) return; e.preventDefault(); OEG.toast(t("prot.copy")); });
  document.addEventListener("dragstart", (e) => { if (guardOn() && !guardAllow(e.target)) e.preventDefault(); });
  document.addEventListener("copy", (e) => { if (!guardOn() || guardAllow(e.target)) return; e.preventDefault(); OEG.toast(t("prot.copy")); });
  document.addEventListener("keydown", (e) => {
    if (!guardOn()) return;
    const typing = guardAllow(document.activeElement);
    const k = (e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && !typing && ["u", "s", "p", "c", "x", "a"].includes(k)) { e.preventDefault(); OEG.toast(t("prot.copy")); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) { e.preventDefault(); OEG.toast(t("prot.copy")); return; }
    if (k === "f12" && !typing) { e.preventDefault(); OEG.toast(t("prot.copy")); }
  });

  window.addEventListener("hashchange", render);
  /* Admin માંથી કંઈ બદલાય/કઢાણ થાય એટલે સાઇટ તરત જ અપડેટ (reload કરવાની જરૂર નહીં) */
  OEG.refreshSite = async () => {
    try { await OEG.loadConfig(); } catch (e) {}
    try { await Promise.all([OEG.loadCatalog(), OEG.quiz ? OEG.quiz.load() : Promise.resolve()]); } catch (e) {}
    try { if (OEG.views) await OEG.views.load(); } catch (e) {}
    if (OEG.ads) { OEG.ads.head(); OEG.ads.flush(); }
    applyTheme();
    applyI18n();
    await render();
  };
  OEG.render = render;
  document.addEventListener("click", () => document.querySelectorAll(".nav-more.open").forEach(x => x.classList.remove("open")));

  /* ---------- Boot ---------- */
  (async () => {
    await OEG.loadConfig();
    try {
      const u0 = (OEG.state.config && OEG.state.config.ui) || {};
      if (u0.defaultLang && !localStorage.getItem("oeg-lang") && ["gu", "hi", "en"].indexOf(u0.defaultLang) >= 0) OEG.state.lang = u0.defaultLang;
      if (u0.defaultTheme && !localStorage.getItem("oeg-theme") && ["light", "dark"].indexOf(u0.defaultTheme) >= 0) OEG.state.theme = u0.defaultTheme;
    } catch (e) {}
    if (OEG.seo) OEG.seo.init();          // ?lang=… + pre-render meta
    if (OEG.ads) OEG.ads.head();          // AdSense script (publisher ભર્યું હોય તો)
    await Promise.all([OEG.loadCatalog(), OEG.quiz ? OEG.quiz.load() : Promise.resolve(), OEG.views ? OEG.views.load() : Promise.resolve()]);
    OEG.auth.load();
    applyTheme();
    applyI18n();
    render();
    if (OEG.state.configError) OEG.toast("⚠️ data/site-config.json માં JSON errors છે — તપાસો (દા.ત. \"emails\": [\"you@gmail.com\"] — કોટ સાથે)");
  })();
})();
