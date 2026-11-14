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
    OEG.audAllow(OEG.tax().types.filter(x => x.route)).map(x => ({ route: x.route, icon: x.icon || "📄", key: "type." + x.key, label: OEG.typeLabel(x.key) })),
    [ADMIN_NAV]).filter(n => n.route === "home" || n.route === "admin" || sectionOn(n.route));
  const GRADES = () => OEG.tax().grades.filter(g => g.key !== "all").map(g => g.key);
  const REAL_GRADES = () => GRADES().filter(k => k === "balvatika" || /^\d+$/.test(k));
  const SUBJECTS = () => OEG.tax().subjects.map(s => s.key);
  /* 🧭 ટોચની મેનુ: હોમ + વિદ્યાર્થી + શિક્ષક + ઓફિસ — બાકીનું બધું હોવર સબમેનુ માં */
  const NAV_GROUP_OF = {
    textbooks: "student", workbooks: "student", quiz: "student", games: "student", videos: "student", students: "student", grade: "student",
    teachers: "teacher", blog: "teacher",
    office: "office", links: "office", admin: "office"
  };
  const NAV_GROUPS = [
    { key: "student", icon: "🎓", label: "nav.grp.student" },
    { key: "teacher", icon: "🧑\u200d🏫", label: "nav.grp.teacher" },
    { key: "office", icon: "🗂️", label: "nav.grp.office" }
  ];

  const $app = () => document.getElementById("app");
  const t = OEG.t;
  /* 👁 મુલાકાતી/વિદ્યાર્થીને "Admin માંથી ઉમેરો" જેવી સૂચના દેખાતી નથી —
     એ લીટી ફક્ત Admin લોગિન હોય ત્યારે જ જોવાય (સાઈટ સાજી કરવાનું કામ માલિકનું) */
  const adminTip = (k) => {
    let on = false;
    try { on = !!(OEG.canAdmin && OEG.canAdmin()); } catch (e) { on = false; }
    return on ? " " + t(k) : "";
  };
  const emptySub = () => t("empty.sub") + adminTip("empty.subAdmin");
  /* 🎯 પ્રેક્ષક પ્રમાણે યાદી — login ન હોય કે Admin હોય તો બધું દેખાય */
  const mine = (list) => OEG.mine(list || []);
  const gViewKeys = () => OEG.gradeTypes().map(x => x.key);
  const gView = (list) => { const k = gViewKeys(); return (list || []).filter(i => k.indexOf(i.type) >= 0); };
  const audChips = (typeKey, cur) => {
    const aud = OEG.typeAud(typeKey);
    const subs = (aud && aud !== "all") ? OEG.audSubs(aud) : [];
    if (!subs.length) return "";
    return `<div class="aud-row"><span class="aud-lab">🎯 ${OEG.esc(OEG.audLabel(aud))}</span>
      <a class="sub-chip ${!cur ? "on" : ""}" href="#/${OEG.esc(OEG.typeRoute(typeKey))}">${t("filter.all")}</a>
      ${subs.map(x => `<a class="sub-chip ${cur === x.key ? "on" : ""}" href="#/${OEG.esc(OEG.typeRoute(typeKey))}?audSub=${OEG.esc(x.key)}">${x.icon || "📄"} ${OEG.esc(OEG.taxLabel(x, "subject"))}</a>`).join("")}
      ${(() => { const kids = ((subs.filter(y => y.key === cur)[0] || {}).subs) || []; return kids.length ? `<span class="aud-kids-row">` + kids.map(y => `<a class="sub-chip sm" href="#/${OEG.esc(OEG.typeRoute(typeKey))}?audSub=${OEG.esc(cur)}&audSub2=${OEG.esc(y.key)}">${y.icon || "🔹"} ${OEG.esc(OEG.taxLabel(y, "subject"))}</a>`).join("") + `</span>` : ""; })()}</div>`;
  };

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

  /* ▸ એક ધોરણ-યાદી (ઉપમેનુ માટે) */
  const gradeKids = (cat) => REAL_GRADES().map(k => ({
    label: OEG.gradeLabel(k), icon: OEG.gradeIcon(k),
    href: "#/grade/" + k + (cat ? "?cat=" + cat : "")
  }));
  const quizCatKids = (onlyExam) => {
    let C = [];
    try { C = (OEG.quiz && OEG.quiz.cats ? OEG.quiz.cats() : []).slice(); } catch (e) { C = []; }
    if (onlyExam) C = C.filter(c => c.key !== "grade");
    if (!C.length) C = (OEG.tax().quizCats || []).map(c => ({ key: c.key, icon: c.icon, label: c.label, count: 0 }));
    return C.map((c) => {
      /* ત્રીજું સ્તર: mode=grade → વિષય · mode=sub → સબ-કેટેગરી */
      let kids = [];
      try {
        if (c.mode === "grade") kids = (OEG.tax().gradeSubjects || []).filter(x => x && x.key && x.key !== "all").map(x => ({ label: OEG.subjectLabel(x.key), icon: x.icon || "📘", href: "#/quiz?cat=" + encodeURIComponent(c.key) + "&subject=" + encodeURIComponent(x.key) }));
        else if (c.mode === "sub") kids = (c.subs || []).map(x => ({ label: OEG.taxLabel(x, "subject"), icon: x.icon || "🏷️", href: "#/quiz?cat=" + encodeURIComponent(c.key) + "&sub=" + encodeURIComponent(x.key) }));
      } catch (e) { kids = []; }
      return { label: OEG.taxLabel(c, "subject"), icon: c.icon || "🧠", href: "#/quiz?cat=" + encodeURIComponent(c.key), note: c.count ? c.count + " " + t("grade.items") : "", kids: kids };
    });
  };
  /* 🧭 Admin → 🧭 મેનુ માંથી સેટ થયેલી કસ્ટમ યાદી (ui.nav). ન હોય તો ઑટો વૃક્ષ. */
  const navLabel = (n) => {
    const raw = (n && (n.label || n.text || n.name)) || n && n.key || "";
    const t2 = (typeof raw === "string") ? raw : (OEG.langField(raw) || raw.gu || raw.hi || raw.en || "");
    return String(t2 || "").trim();
  };
  function normNav(list, depth) {
    const d = Number(depth) || 1;
    const out = (Array.isArray(list) ? list : []).map((x) => {
      const o = typeof x === "string" ? { label: x, href: "#/" } : (x && typeof x === "object" ? x : null);
      if (!o) return null;
      const label = navLabel(o);
      if (!label) return null;
      const href = String(o.href || o.link || o.url || "").trim() || "#/";
      const n = { key: String(o.key || label).slice(0, 24), label: label, icon: String(o.icon || "").slice(0, 6), href: href };
      const kids = d < 3 ? normNav(o.subs || o.kids, d + 1) : [];
      if (kids.length) n.kids = kids;
      return n;
    }).filter(Boolean);
    return out.slice(0, 8);
  }
  const customNav = () => { const v = uiCfg().nav; const list = normNav(v, 1); return (Array.isArray(v) && list.length) ? list : null; };
  const navRouteOf = (href) => { const m = String(href || "").match(/^#\/([\w-]+)/); return m ? m[1] : "home"; };
  const navOn = (n, cur) => {
    if (!n) return false;
    if (navRouteOf(n.href) === cur) return true;
    return (n.kids || []).some(k => navOn(k, cur));
  };
  /* ▸ મેનુ વૃક્ષ: ગ્રુપ → આઇટમ → ઉપ-આઇટમ (બધું taxonomy/quiz માંથી જીવંત) */
  function autoNavTree() {
    const v = visibleNav().filter(n => n.route !== "home");
    const G = {};
    NAV_GROUPS.forEach(g => { G[g.key] = { key: g.key, icon: g.icon, label: t(g.label), kids: [] }; });
    const nodeOf = (n) => ({ label: n.label || t(n.key), icon: n.icon || "📄", route: n.route, href: "#/" + n.route, kids: [] });
    const byRoute = {};
    v.forEach((n) => { byRoute[n.route] = nodeOf(n); });
    const gradeNode = { label: t("nav.byGrade"), icon: "🎓", href: "#/grade", kids: gradeKids("") };
    if (byRoute.textbooks) byRoute.textbooks.kids = gradeKids("textbook");
    if (byRoute.workbooks) byRoute.workbooks.kids = gradeKids("workbook");
    if (byRoute.quiz) byRoute.quiz.kids = [{ label: t("quiz.pickCat"), icon: "🗂️", href: "#/quiz", kids: [] }].concat(quizCatKids(false));
    /* 🎯 શિક્ષક/આચાર્ય/ઓફિસ પાનાંની બાબતો પણ મેનુમાં (બીજું-ત્રીજું સ્તર) */
    Object.keys(byRoute).forEach((r) => {
      const n = byRoute[r], ty = OEG.tax().types.filter(x => x.route === r)[0];
      const aud = ty ? (ty.aud || "") : "";
      const subs = aud && aud !== "all" ? OEG.audSubs(aud) : [];
      if (!subs.length) return;
      n.kids = (n.kids || []).concat(subs.map(x => {
        const kids2 = (x.subs || []).map(y => ({ label: OEG.taxLabel(y, "subject"), icon: y.icon || "🔹", href: "#/" + r + "?audSub=" + x.key + "&audSub2=" + y.key, kids: [] }));
        return { label: OEG.taxLabel(x, "subject"), icon: x.icon || "📄", href: "#/" + r + "?audSub=" + x.key, kids: kids2 };
      }));
    });
    const put = (route, grp) => { const n = byRoute[route]; if (n) { (G[grp] || G.student).kids.push(n); delete byRoute[route]; } };
    Object.keys(NAV_GROUP_OF).forEach(r => put(r, NAV_GROUP_OF[r]));
    Object.keys(byRoute).forEach(r => { G.student.kids.push(byRoute[r]); });   /* નવું ઉમેરાયેલું ક્યાંય ખોવાય નહીં */
    if (G.student.kids.length) G.student.kids.push(gradeNode);
    const teach = G.teacher;
    teach.kids.push({ label: t("nav.quizCats"), icon: "🧠", href: "#/quiz", kids: quizCatKids(true) });
    const home = { key: "home", label: t("nav.home"), icon: "🏠", href: "#/", route: "home", kids: [] };
    return [home].concat(NAV_GROUPS.map(g => G[g.key]).filter(g => g.kids.length));
  }
  /* કસ્ટમ હોય તો એ જ, નહીં તો ઑટો — બધી જગ્યાએ (header + sidebar) એ જ વૃક્ષ ચાલે */
  function navTree() { return customNav() || autoNavTree(); }
  const navKids = (n) => (n.kids || []).filter(Boolean);
  /* બહારની સાઈટની લિંક નવી ટૅબમાં ખુલે (admin મેનુમાં https://… લખી શકાય) */
  const navExt = (href) => /^https?:\/\//i.test(String(href || ""));
  const navX = (href) => (navExt(href) ? ' target="_blank" rel="noopener"' : "");
  const navItem = (n, depth) => {
    const kids = navKids(n);
    const cur = currentRoute();
    const on = navRouteOf(n.href) === cur;
    const body = `<span class="ni-ic">${OEG.esc(n.icon || "📄")}</span><b>${OEG.esc(n.label || "")}</b>${n.note ? `<small>${OEG.esc(n.note)}</small>` : ""}${kids.length ? `<span class="ni-ar">›</span>` : ""}`;
    if (!kids.length) return `<a class="nav-item ${on ? "on" : ""}" href="${OEG.esc(n.href || "#/")}"${navX(n.href)}>${body}</a>`;
    return `<div class="nav-sub" data-depth="${Math.min(3, depth || 1)}">
      <a class="nav-item has-kids ${on ? "on" : ""}" href="${OEG.esc(n.href || "#/")}"${navX(n.href)} aria-haspopup="true">${body}</a>
      <div class="nav-fly">${kids.map(k => navItem(k, (depth || 1) + 1)).join("")}</div>
    </div>`;
  };
  const navTopItem = (n) => {
    const kids = navKids(n);
    if (!kids.length) return `<a class="nav-link ${navRouteOf(n.href) === currentRoute() ? "active" : ""}" href="${OEG.esc(n.href || "#/")}"${navX(n.href)}>${n.icon ? OEG.esc(n.icon) + " " : ""}${OEG.esc(n.label)}</a>`;
    return `<div class="nav-grp" data-grp="${OEG.esc(n.key || "")}">
      <button type="button" class="nav-link nav-gbtn ${navOn({ kids: kids }, currentRoute()) ? "active" : ""}" aria-haspopup="true">${n.icon ? OEG.esc(n.icon) + " " : ""}${OEG.esc(n.label)} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="nav-drop nav-drop-lg">${kids.map(k => navItem(k, 1)).join("")}</div>
    </div>`;
  };
  function renderNav() {
    const tree = navTree();
    const el = document.getElementById("navDesktop");
    if (!el) return;
    el.innerHTML = tree.map(navTopItem).join("");
    el.querySelectorAll(".nav-gbtn").forEach(btn => {
      btn.onclick = (e) => { e.stopPropagation(); const g = btn.closest(".nav-grp"); const open = g.classList.contains("open"); el.querySelectorAll(".nav-grp.open").forEach(x => x.classList.remove("open")); if (!open) g.classList.add("open"); };
    });
    el.querySelectorAll(".nav-sub > .nav-item.has-kids").forEach(a => {
      a.onclick = (e) => { if (window.matchMedia("(hover: none)").matches) { e.preventDefault(); a.parentNode.classList.toggle("open"); } };
    });
  }
  let navResizeT;
  window.addEventListener("resize", () => { clearTimeout(navResizeT); navResizeT = setTimeout(renderNav, 180); });
  const sideItem = (n, depth) => {
    const kids = navKids(n);
    const on = navRouteOf(n.href) === currentRoute();
    if (!kids.length) return `<a class="side-link sd${depth} ${on ? "active" : ""}" href="${OEG.esc(n.href || "#/")}"${navX(n.href)}"><span class="ic">${OEG.esc(n.icon || "📄")}</span>${OEG.esc(n.label || "")}</a>`;
    return `<div class="side-branch">
      <a class="side-link ${on ? "active" : ""}" href="${OEG.esc(n.href || "#/")}"${navX(n.href)}"><span class="ic">${OEG.esc(n.icon || "📄")}</span>${OEG.esc(n.label || "")}<i class="side-ar">▾</i></a>
      <button type="button" class="side-open" aria-label="open">＋</button>
      <div class="side-kids">${kids.map(k => sideItem(k, depth + 1)).join("")}</div>
    </div>`;
  };
  const canAdminNow = () => { try { return !!(OEG.canAdmin && OEG.canAdmin()); } catch (e) { return false; } };
  function renderSidebar() {
    const tree = navTree();
    const custom = !!customNav();
    document.getElementById("sideNav").innerHTML = tree.map((g) => navKids(g).length
      ? `<div class="side-grp"><span class="side-cap">${g.icon ? OEG.esc(g.icon) + " " : ""}${OEG.esc(g.label)}</span>${navKids(g).map(k => sideItem(k, 1)).join("")}</div>`
      : sideItem(Object.assign({ kids: [] }, g), 1)).join("");
    if (custom && canAdminNow()) document.getElementById("sideNav").insertAdjacentHTML("beforeend", `<p class="side-note">🧭 ${t("nav.customNote")}</p>`);
    document.querySelectorAll("#sideNav .side-open").forEach(b => {
      b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); b.closest(".side-branch").classList.toggle("open"); };
    });
    /* ધોરણ — હવે પેજ પર બધાં પ્રકારનું મટિરિયલ દેખાય (ફક્ત પાઠ્યપુસ્તક નહીં) */
    document.getElementById("sideGrades").innerHTML = REAL_GRADES().map(g =>
      `<a class="side-link ${gradeInUrl() === g ? "active" : ""}" href="#/grade/${g}"><span class="ic">${OEG.gradeIcon(g)}</span>${OEG.esc(OEG.gradeLabel(g))}<small>${countOfGrade(g)}</small></a>`).join("");
    document.getElementById("sideShare").innerHTML = shareButtons();
    bindShare(document.getElementById("sideShare"));
  }
  const gradeInUrl = () => { const m = (location.hash || "").match(/#\/grade\/([\w-]+)/); return m ? m[1] : ""; };
  const countOfGrade = (g) => {
    const n = gView(mine(OEG.state.catalog.filter(i => i.grade === g))).length;
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
    const cats = OEG.audAllow(OEG.tax().types.filter(x => x.route));
    /* 🎯 ફક્ત વિદ્યાર્થી માટેની શ્રેણીમાં જ ધોરણ + વિષયનું છાંટણં (ઓફિસ/શિક્ષક પાનાં પર નહીં) */
    const stu = OEG.typeAud(typeKey) === "student" || OEG.gradeView(typeKey);
    const subs = OEG.tax().gradeSubjects.map(x => x.key);
    return `<div class="filters">
      ${stu ? `<label>${t("filter.grade")}</label>
      <select id="fGrade"><option value="all">${t("filter.all")}</option>${GRADES().map(g => `<option value="${g}" ${g === grade ? "selected" : ""}>${OEG.esc(OEG.gradeLabel(g))}</option>`).join("")}</select>
      <label>${t("filter.subject")}</label>
      <select id="fSubject"><option value="all">${t("filter.all")}</option>${subs.map(x => `<option value="${x}" ${x === subject ? "selected" : ""}>${OEG.esc(OEG.subjectLabel(x))}</option>`).join("")}</select>` : ""}
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
    const grade = query.grade || "all", subject = query.subject || "all", audSub = query.audSub || "", audSub2 = query.audSub2 || "";
    let items = mine(OEG.byType(typeKey));
    if (grade !== "all") items = items.filter(i => i.grade === grade || i.grade === "all");
    if (subject !== "all") items = items.filter(i => i.subject === subject);
    if (audSub) items = items.filter(i => !i.audSub || i.audSub === audSub);
    if (audSub2) items = items.filter(i => !i.audSub2 || i.audSub2 === audSub2);
    const label = OEG.typeLabel(typeKey);
    const body = items.length
      ? gridWithAd(items, 6, "listMid")
      : `<div class="panel" style="text-align:center;padding:50px 20px"><div style="font-size:3rem">📭</div><h3>${t("empty.title")}</h3><p style="color:var(--muted)">${OEG.esc(emptySub())}</p></div>`;
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${OEG.esc(label)}</div>
      <h1>${OEG.typeIcon(typeKey)} ${OEG.esc(label)}</h1>
      <p class="sub">${items.length} ${t("grade.items")}</p></div>
      ${audChips(typeKey, audSub)}
      ${filtersHtml(typeKey, route, grade, subject)}
      ${adSlot("listTop")}
      <div id="listWrap">${body}</div>${adSlot("contentBottom")}`;
  }

  function bindFilters(typeKey, route) {
    const g = document.getElementById("fGrade"), s = document.getElementById("fSubject"), c = document.getElementById("fCat");
    if (!g && !c) return;
    const apply = () => {
      const q = [];
      if (g && g.value !== "all") q.push("grade=" + g.value);
      if (s && s.value !== "all") q.push("subject=" + s.value);
      location.hash = `#/${c && c.value !== route ? c.value : route}` + (q.length ? "?" + q.join("&") : "");
    };
    if (g) g.onchange = apply;
    if (s) s.onchange = apply;
    if (c) c.onchange = apply;
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
    /* એ ધોરણ મુજબની બાબતો જ — પાઠ્યપુસ્તક · સ્વાધ્યાયપોથી · વિડિયો · રમત (Office/Teachers Helper વગેરે નહીં) */
    const gBase = gView(mine(OEG.state.catalog.filter(i => i.grade === g || i.grade === "all")));
    let items = gBase;
    if (subject !== "all") items = items.filter(i => i.subject === subject);
    if (cat !== "all") items = items.filter(i => i.type === cat);
    const counts = {};
    gBase.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    const body = items.length ? gridWithAd(items, 6, "listMid")
      : `<div class="panel" style="text-align:center;padding:46px 20px"><div style="font-size:2.6rem">📭</div><h3>${t("grade.noItems")}</h3></div>`;
    return `<div class="page-head">
      <div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / <a href="#/grade">${t("sec.grades")}</a> / ${OEG.esc(OEG.gradeLabel(g))}</div>
      <h1>${OEG.gradeIcon(g)} ${OEG.esc(OEG.gradeLabel(g))}</h1>
      <p class="sub">${t("grade.materialsSub")}</p>
    </div>
    <div class="grade-tabs" id="gTypes">
      <a class="g-tab ${cat === "all" ? "on" : ""}" href="#/grade/${g}${subject !== "all" ? "?subject=" + subject : ""}">${t("grade.all")} <small>${gBase.length}</small></a>
      ${OEG.gradeTypes().map(x => `<a class="g-tab ${cat === x.key ? "on" : ""}" href="#/grade/${g}?cat=${x.key}${subject !== "all" ? "&subject=" + subject : ""}">${x.icon || "📄"} ${OEG.esc(OEG.typeLabel(x.key))} <small>${counts[x.key] || 0}</small></a>`).join("")}
    </div>
    <div class="section-head"><div><h2>📚 ${t("grade.subjects")} <small style="font-weight:700;color:var(--muted)">(${subs.length})</small></h2><p>${t("grade.subjectsSub")} — ${OEG.esc(OEG.gradeLabel(g))}</p></div>
      ${OEG.gradeTypes().some(x => x.key === "quiz") ? `<a href="#/quiz?cat=grade&grade=${g}">🧠 ${t("grade.quizNow")} →</a>` : ""}</div>
    <div class="subject-row" id="gSubs">
      ${subs.map(s => `<a class="sub-chip ${subject === s.key ? "on" : ""}" href="#/grade/${g}?subject=${s.key}${cat !== "all" ? "&cat=" + cat : ""}">${OEG.esc(OEG.subjectLabel(s.key))}<small>${gBase.filter(i => i.subject === s.key).length}</small></a>`).join("")}
    </div>
    ${adSlot("gradeTop")}
    <div id="listWrap">${body}</div>
    ${adSlot("contentBottom")}`;
  }
  function gradeCard(k) {
    const n = gView(mine(OEG.state.catalog.filter(i => i.grade === k))).length;
    return `<a class="grade-card reveal glow" href="#/grade/${k}"><div class="g-ic">${OEG.gradeIcon(k)}</div><b>${OEG.esc(OEG.gradeLabel(k))}</b><span class="g-meta">${n} ${t("grade.items")} · ${OEG.tax().gradeSubjects.length} ${t("grade.subjects")}</span></a>`;
  }

  /* 🧠 એક કેટેગરી = એક glowing કાર્ડ (ધોરણ/સબ-કેટેગરી નંબર સાથે) */
  function qzCatCard(c) {
    const mode = c.mode || "none";
    const subs = c.subs || [];
    /* 🧩 ઉપ-શ્રેણીની નામની યાદી નહીં — ફક્ત કેટલી છે એટલો અંક */
    const nCh = (OEG.quiz && OEG.quiz.chapsOf) ? subs.reduce((a, x) => a + OEG.quiz.chapsOf(c.key, x.key).length, 0) : 0;
    const nSub = mode === "grade" ? ((OEG.quiz.subsOf ? OEG.quiz.subsOf(c.key) : []).length || (OEG.tax().gradeSubjects || []).length) : subs.length;
    const bits = [];
    if (mode === "grade") bits.push(`🎓 ${OEG.tax().grades.filter(g => g.key === "balvatika" || /^\d+$/.test(g.key)).length} ${t("grade.pickGrade")}`);
    if (mode !== "none") bits.push(`${mode === "grade" ? "📘" : "🧩"} ${nSub} ${t(mode === "grade" ? "grade.subjects" : "quiz.subCats")}`);
    if (nCh) bits.push(`📗 ${nCh} ${t("admin.chapters")}`);
    bits.push(`🧠 ${c.count} ${t("grade.items")}`);
    const empty = !c.count;
    return `<a class="card qz-cat-card glow${empty ? " qz-soon" : ""}" href="#/quiz?cat=${OEG.esc(c.key)}"${empty ? ' aria-disabled="true"' : ""}>
      <span class="qz-ic">${c.icon || "🧠"}</span>
      <h3>${OEG.esc(OEG.taxLabel(c, "subject"))}</h3>
      <p>${OEG.esc(bits.join(" · "))}</p>
      <span class="qz-go">${empty ? "🚧 " + t("quiz.noQuestions") : t("quiz.start") + " →"}</span></a>`;
  }
  /* 👁 સૌથી વધુ જોવાયેલ પોસ્ટ (localStorage + data/views.json) */
  function mostViewed() {
    const pool = mine(OEG.state.catalog.filter(i => ["post", "video", "textbook", "workbook", "link"].includes(i.type)));
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
    const posts = mine(OEG.byType("post")).slice(0, 3);
    const vids = mine(OEG.byType("video")).slice(0, 6);
    const popular = mine(OEG.state.catalog.filter(i => ["textbook", "workbook"].includes(i.type))).slice(0, 4);
    const quizCats = (OEG.quiz && OEG.quiz.cats ? OEG.quiz.cats() : []);
    const total = mine(OEG.state.catalog).length;
    const quizN = mine(OEG.state.catalog.filter(i => i.type === "quiz")).length;
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
    let vids = mine(OEG.byType("video"));
    if (grade !== "all") vids = vids.filter(i => i.grade === grade || i.grade === "all");
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${t("page.videos")}</div><h1>▶️ ${t("page.videos")}</h1>
      <p class="sub">${vids.length} ${t("grade.items")} · ${t("yt.byUrlNote")}</p></div>
      <div class="filters"><label>${t("filter.grade")}</label><select id="fGrade"><option value="all">${t("filter.all")}</option>${GRADES().map(g => `<option value="${g}" ${g === grade ? "selected" : ""}>${OEG.esc(OEG.gradeLabel(g))}</option>`).join("")}</select></div>
      ${adSlot("videoTop")}
      ${vids.length ? `<div class="video-grid">${vids.map(videoCard).join("")}</div>` : `<div class="panel" style="text-align:center;padding:50px"><h3>${t("empty.title")}</h3><p style="color:var(--muted)">${OEG.esc(emptySub())}</p></div>`}
      ${adSlot("contentBottom")}`;
  }

  function gamesPage() {
    const uploaded = mine(OEG.byType("game"));
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
    const related = mine(OEG.state.catalog.filter(i => i.id !== item.id && (i.grade === item.grade || i.subject === item.subject))).slice(0, 4);
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
        <div class="form-row" id="regGradeRow">
          <div class="field"><label>${t("grade.pickGrade")}</label><select name="grade">${regGradeOpts()}</select></div>
          <div class="field"><label>${t("auth.subject")}</label><select name="subject">${regSubjectOpts()}</select></div>
        </div>
        <p class="auth-role-note" id="regRoleNote">ℹ️ ${t("auth.roleNote")}</p>` : ""}
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
    /* આચાર્ય/અન્ય માટે ધોરણ-વિષય પૂછાતું નથી (ફક્ત વિદ્યાર્થી-શિક્ષક માટે લાગુ) */
    const roleSel = document.querySelector('#authForm [name="role"]');
    const gRow = document.getElementById("regGradeRow");
    const syncRole = () => {
      if (!gRow) return;
      const on = !roleSel || /student|teacher/.test(roleSel.value);
      gRow.style.display = on ? "" : "none";
      const note = document.getElementById("regRoleNote");
      if (note) note.style.display = on ? "" : "none";
    };
    if (roleSel) { roleSel.onchange = syncRole; syncRole(); }
    document.getElementById("authForm").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const msgEl = document.getElementById("authMsg");
      try {
        const res = mode === "register"
          ? await OEG.auth.register({
            name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: fd.get("role"),
            grade: (gRow && gRow.style.display === "none") ? "all" : fd.get("grade"),
            subject: (gRow && gRow.style.display === "none") ? "all" : fd.get("subject")
          })
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
    const res = mine(OEG.search(q));
    return `<div class="page-head"><h1>🔍 ${t("search.results")}: “${OEG.esc(q)}”</h1></div>
      ${res.length ? `${adSlot("listTop")}<div class="grid">${res.map(card).join("")}</div>${adSlot("listMid")}` : `<div class="panel" style="text-align:center;padding:50px"><h3>${t("search.none")}</h3></div>`}`;
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
        <p style="color:var(--muted);margin-top:8px">${OEG.esc(t("ui.sectionOffSub") + adminTip("ui.sectionOffSubAdmin"))}</p>
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
        OEG.quiz.mount(document.getElementById("quizMount"), { grade: query.grade, cat: query.cat, sub: query.sub, subject: query.subject || u.subject || "", chap: query.chap });
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
    if (route !== "admin") html += adSlot("footerTop");   /* 📢 દરેક પાનાનાં તળિયે એક વધુ જગ્યા */
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
    /* mobile browser bar પણ થીમ પ્રમાણે રહે */
    const tc = document.getElementById("themeColor") || document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute("content", OEG.state.theme === "dark" ? "#0d0f1a" : "#4f46e5");
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
  OEG.applyNav = () => { try { renderNav(); renderSidebar(); } catch (e) {} };
  OEG.navAuto = autoNavTree;
  document.addEventListener("click", () => document.querySelectorAll(".nav-grp.open, .nav-sub.open").forEach(x => x.classList.remove("open")));

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
