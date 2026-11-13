/* ============================================================
   OEG App — Router + Page Renderers + Shell
   ============================================================ */
(() => {
  const NAV = [
    { route: "home", icon: "🏠", key: "nav.home" },
    { route: "textbooks", icon: "📚", key: "nav.textbooks" },
    { route: "workbooks", icon: "📝", key: "nav.workbooks" },
    { route: "games", icon: "🎮", key: "nav.games" },
    { route: "office", icon: "🗂️", key: "nav.office" },
    { route: "teachers", icon: "👩‍🏫", key: "nav.teachers" },
    { route: "students", icon: "🧑‍🎓", key: "nav.students" },
    { route: "videos", icon: "▶️", key: "nav.videos" },
    { route: "blog", icon: "📰", key: "nav.blog" },
    { route: "links", icon: "🔗", key: "nav.links" },
    { route: "admin", icon: "🛠️", key: "nav.admin" }
  ];
  const GRADES = ["balvatika", "1", "2", "3", "4", "5", "6", "7", "8"];
  const GRADE_ICONS = { balvatika: "🧸", 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣" };
  const TYPE_ICONS = { textbook: "📚", workbook: "📝", game: "🎮", office: "🗂️", teacher: "👩‍🏫", student: "🧑‍🎓", video: "▶️", post: "📰", link: "🔗" };
  const TYPE_ROUTE = { textbook: "textbooks", workbook: "workbooks", game: "games", office: "office", teacher: "teachers", student: "students", video: "videos", post: "blog", link: "links" };
  const SUBJECTS = ["all", "gujarati", "hindi", "english", "maths", "science", "social", "office", "planning", "exam", "news", "official", "blog"];

  const $app = () => document.getElementById("app");
  const t = OEG.t;

  /* ---------- i18n apply ---------- */
  function applyI18n() {
    document.documentElement.lang = OEG.state.lang;
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    document.querySelectorAll("[data-i18n-ph]").forEach(el => el.placeholder = t(el.dataset.i18nPh));
    document.getElementById("langSelect").value = OEG.state.lang;
    renderNav(); renderSidebar(); renderFooter(); renderAuthArea();
  }

  /* ---------- Shell ---------- */
  function renderNav() {
    const cur = currentRoute();
    document.getElementById("navDesktop").innerHTML = NAV.map(n =>
      `<a class="nav-link ${cur === n.route ? "active" : ""}" href="#/${n.route === "home" ? "" : n.route}">${t(n.key)}</a>`).join("");
  }
  function renderSidebar() {
    document.getElementById("sideNav").innerHTML = NAV.map(n =>
      `<a class="side-link ${currentRoute() === n.route ? "active" : ""}" href="#/${n.route === "home" ? "" : n.route}"><span class="ic">${n.icon}</span>${t(n.key)}</a>`).join("");
    document.getElementById("sideGrades").innerHTML = GRADES.map(g =>
      `<a class="side-link" href="#/textbooks?grade=${g}"><span class="ic">${GRADE_ICONS[g]}</span>${OEG.gradeLabel(g)}</a>`).join("");
    document.getElementById("sideShare").innerHTML = shareButtons();
  }
  function renderFooter() {
    document.getElementById("footerLinks").innerHTML = NAV.slice(0, 8).map(n =>
      `<a href="#/${n.route === "home" ? "" : n.route}">${t(n.key)}</a>`).join("");
    const s = OEG.state.config.social || {};
    const icons = { youtube: s.youtube, facebook: s.facebook, telegram: s.telegram, whatsapp: s.whatsapp };
    document.getElementById("footerSocial").innerHTML = Object.entries(icons).filter(([, v]) => v).map(([k, v]) =>
      `<a href="${OEG.esc(v)}" target="_blank" rel="noopener" aria-label="${k}">${socialSvg(k)}</a>`).join("");
  }
  function renderAuthArea() {
    const u = OEG.state.user;
    document.getElementById("authArea").innerHTML = u
      ? `<span style="font-weight:700;font-size:.88rem;margin-right:6px">👋 ${OEG.esc(u.name)}</span><button class="btn btn-outline btn-sm" id="logoutBtn">${t("nav.logout")}</button>`
      : `<a class="btn btn-outline btn-sm" href="#/login">${t("nav.login")}</a> <a class="btn btn-brand btn-sm" href="#/register">${t("nav.register")}</a>`;
    const lb = document.getElementById("logoutBtn");
    if (lb) lb.onclick = () => { OEG.auth.logout(); renderAuthArea(); OEG.toast(t("auth.logoutOk")); location.hash = "#/"; };
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
    const url = encodeURIComponent(location.href), title = encodeURIComponent(document.title);
    return `<span class="share-label">${t("share.title")}:</span>
      <a class="share-btn" target="_blank" rel="noopener" href="https://wa.me/?text=${title}%20${url}">${socialSvg("whatsapp")}${t("share.whatsapp")}</a>
      <a class="share-btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${url}">${socialSvg("facebook")}${t("share.facebook")}</a>
      <a class="share-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${title}&url=${url}">${socialSvg("twitter")}${t("share.twitter")}</a>
      <a class="share-btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=${url}&text=${title}">${socialSvg("telegram")}${t("share.telegram")}</a>
      <button class="share-btn" id="copyLinkBtn">🔗 ${t("btn.copyLink")}</button>`;
  }
  function bindShare(root) {
    const b = root.querySelector("#copyLinkBtn") || document.getElementById("copyLinkBtn");
    if (b) b.onclick = async () => { try { await navigator.clipboard.writeText(location.href); OEG.toast(t("btn.copied")); } catch (e) {} };
  }

  /* ---------- AdSense (policy-safe placement) ---------- */
  function adSlot(slotKey, extraClass = "") {
    const ads = OEG.state.config.adsense || {};
    const pub = ads.publisherId, slot = ads.slots && ads.slots[slotKey];
    if (pub && slot) {
      return `<div class="ad-slot ${extraClass}"><span class="ad-label">${t("ad.label")}</span>
        <ins class="adsbygoogle" style="display:block" data-ad-client="${OEG.esc(pub)}" data-ad-slot="${OEG.esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script></div>`;
    }
    return `<div class="ad-slot ${extraClass}"><span class="ad-label">${t("ad.label")}</span><div class="ad-box">📢 ${t("ad.placeholder")}</div></div>`;
  }

  /* ---------- Components ---------- */
  function card(item) {
    const kind = OEG.fileKind(item);
    const icon = item.image ? "" : (TYPE_ICONS[item.type] || "📄");
    const img = item.image ? `<div class="card-img"><img src="${OEG.esc(item.image)}" alt="" loading="lazy"></div>` : `<div class="card-img">${icon}</div>`;
    const action = item.type === "video" && OEG.youtubeId(item.fileUrl)
      ? `<a class="btn btn-brand btn-sm" href="#/videos">${t("btn.play")}</a>`
      : item.fileUrl
        ? `<a class="btn btn-brand btn-sm" href="#/view/${item.id}">${t("btn.view")}</a><a class="btn btn-outline btn-sm" href="${OEG.esc(item.fileUrl)}" download ${item.external ? 'target="_blank" rel="noopener"' : ""}>${t("btn.download")}</a>`
        : `<a class="btn btn-outline btn-sm" href="#/view/${item.id}">${t("btn.readMore")}</a>`;
    return `<article class="card reveal">${img}<div class="card-body">
      <span class="badge">${OEG.typeLabel(item.type)} • ${OEG.gradeLabel(item.grade)}</span>
      <h3>${OEG.esc(OEG.title(item))}</h3><p>${OEG.esc(OEG.desc(item))}</p>
      <div class="card-meta"><span>📅 ${OEG.esc(item.date || "")}</span><span>🏷️ ${OEG.subjectLabel(item.subject)}</span>${kind !== "link" ? `<span>📄 ${kind.toUpperCase()}</span>` : ""}</div>
      <div class="card-actions">${action}</div></div></article>`;
  }

  function filtersHtml(grade, subject) {
    return `<div class="filters">
      <label>${t("filter.grade")}</label>
      <select id="fGrade"><option value="all">${t("filter.all")}</option>${GRADES.map(g => `<option value="${g}" ${g === grade ? "selected" : ""}>${OEG.gradeLabel(g)}</option>`).join("")}</select>
      <label>${t("filter.subject")}</label>
      <select id="fSubject"><option value="all">${t("filter.all")}</option>${SUBJECTS.map(s => `<option value="${s}" ${s === subject ? "selected" : ""}>${OEG.subjectLabel(s)}</option>`).join("")}</select>
    </div>`;
  }

  function listingPage(type, pageKey, query) {
    const grade = query.grade || "all", subject = query.subject || "all";
    let items = OEG.byType(type);
    if (grade !== "all") items = items.filter(i => i.grade === grade || i.grade === "all");
    if (subject !== "all") items = items.filter(i => i.subject === subject);
    const body = items.length
      ? `<div class="grid">${items.map(card).join("")}</div>`
      : `<div class="panel" style="text-align:center;padding:50px 20px"><div style="font-size:3rem">📭</div><h3>${t("empty.title")}</h3><p style="color:var(--muted)">${t("empty.sub")}</p></div>`;
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${t(pageKey)}</div><h1>${t(pageKey)}</h1></div>
      ${filtersHtml(grade, subject)}<div id="listWrap">${body}</div>${adSlot("contentBottom")}`;
  }

  function bindFilters(type, pageKey) {
    const apply = () => {
      const g = document.getElementById("fGrade").value, s = document.getElementById("fSubject").value;
      location.hash = `#/${pageKey}?grade=${g}&subject=${s}`;
    };
    document.getElementById("fGrade").onchange = apply;
    document.getElementById("fSubject").onchange = apply;
  }

  /* ---------- Pages ---------- */
  function homePage() {
    const posts = OEG.byType("post").slice(0, 3);
    const vids = OEG.byType("video").slice(0, 3);
    const popular = OEG.state.catalog.filter(i => ["textbook", "workbook"].includes(i.type)).slice(0, 4);
    const total = OEG.state.catalog.length;
    return `
    <section class="hero">
      <h1>${t("hero.title")}</h1><p>${t("hero.sub")}</p>
      <div class="hero-cta"><a class="btn btn-primary" href="#/textbooks">${t("hero.cta1")}</a><a class="btn btn-ghost" href="#/games">${t("hero.cta2")}</a></div>
      <div class="hero-stats">
        <div><b>${total}+</b><span>${t("nav.textbooks")}</span></div>
        <div><b>9</b><span>${t("sec.grades")}</span></div>
        <div><b>3</b><span>${t("nav.games")}</span></div>
        <div><b>3</b><span>${t("lang.name")}</span></div>
      </div>
    </section>
    ${adSlot("homeTop")}
    <section class="section"><div class="section-head"><div><h2>${t("sec.grades")}</h2><p>${t("sec.gradesSub")}</p></div></div>
      <div class="grid-grades">${GRADES.map(g => `<a class="grade-card reveal" href="#/textbooks?grade=${g}"><div class="g-ic">${GRADE_ICONS[g]}</div><b>${OEG.gradeLabel(g)}</b><span>${t("nav.textbooks")}</span></a>`).join("")}</div>
    </section>
    <section class="section"><div class="section-head"><div><h2>${t("sec.features")}</h2></div></div>
      <div class="grid">
        ${NAV.slice(1, 7).map(n => `<a class="card reveal" href="#/${n.route}" style="padding:24px;align-items:flex-start"><div style="font-size:2rem;margin-bottom:8px">${n.icon}</div><h3>${t(n.key)}</h3></a>`).join("")}
      </div>
    </section>
    ${adSlot("homeMid")}
    <section class="section"><div class="section-head"><div><h2>${t("sec.latest")}</h2></div><a href="#/blog">${t("btn.readMore")} →</a></div>
      <div class="grid">${posts.map(card).join("") || `<p style="color:var(--muted)">${t("empty.title")}</p>`}</div>
    </section>
    <section class="section"><div class="section-head"><div><h2>${t("sec.videos")}</h2></div><a href="#/videos">${t("btn.readMore")} →</a></div>
      <div class="video-grid">${vids.map(videoCard).join("") || `<p style="color:var(--muted)">${t("empty.title")}</p>`}</div>
    </section>
    <section class="section"><div class="section-head"><div><h2>${t("sec.popular")}</h2></div></div>
      <div class="grid">${popular.map(card).join("")}</div>
    </section>
    ${adSlot("contentBottom")}`;
  }

  function videoCard(item) {
    const id = OEG.youtubeId(item.fileUrl);
    if (!id) return "";
    return `<article class="video-card reveal"><div class="ratio">
      <iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${OEG.esc(OEG.title(item))}" loading="lazy" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>
      <div class="vc-body"><h3>${OEG.esc(OEG.title(item))}</h3><p>${OEG.esc(OEG.desc(item))}</p></div></article>`;
  }

  function videosPage() {
    const vids = OEG.byType("video");
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${t("page.videos")}</div><h1>▶️ ${t("page.videos")}</h1></div>
      ${vids.length ? `<div class="video-grid">${vids.map(videoCard).join("")}</div>` : `<div class="panel" style="text-align:center;padding:50px"><h3>${t("empty.title")}</h3><p style="color:var(--muted)">${t("empty.sub")}</p></div>`}
      ${adSlot("contentBottom")}`;
  }

  function gamesPage() {
    const uploaded = OEG.byType("game");
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / ${t("page.games")}</div><h1>🎮 ${t("page.games")}</h1>
      <p>${t("game.builtIn")} + ${t("game.uploaded")}</p></div>
      <div class="grid" style="margin-bottom:26px">
        <div class="card" style="padding:24px"><div style="font-size:2rem">🧠</div><h3>${t("game.quiz")}</h3><div class="card-actions"><button class="btn btn-brand btn-sm" data-game="quiz">${t("game.playNow")}</button></div></div>
        <div class="card" style="padding:24px"><div style="font-size:2rem">🃏</div><h3>${t("game.memory")}</h3><div class="card-actions"><button class="btn btn-brand btn-sm" data-game="memory">${t("game.playNow")}</button></div></div>
        <div class="card" style="padding:24px"><div style="font-size:2rem">🔢</div><h3>${t("game.math")}</h3><div class="card-actions"><button class="btn btn-brand btn-sm" data-game="math">${t("game.playNow")}</button></div></div>
      </div>
      <div id="gameMount"></div>
      ${uploaded.length ? `<div class="section-head" style="margin-top:34px"><h2>${t("game.uploaded")}</h2></div><div class="grid">${uploaded.map(card).join("")}</div>` : ""}
      ${adSlot("contentBottom")}`;
  }

  function viewPage(id) {
    const item = OEG.byId(id);
    if (!item) return `<div class="panel" style="text-align:center;padding:50px"><h3>${t("empty.title")}</h3><a class="btn btn-brand" href="#/">${t("btn.back")}</a></div>`;
    const kind = OEG.fileKind(item);
    const yt = OEG.youtubeId(item.fileUrl);
    let viewer = "";
    if (yt) {
      viewer = `<div class="viewer"><div class="viewer-head"><b>▶️ ${OEG.esc(OEG.title(item))}</b></div>
        <div class="ratio" style="position:relative;padding-top:56.25%"><iframe style="position:absolute;inset:0;width:100%;height:100%;border:none" src="https://www.youtube-nocookie.com/embed/${yt}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div></div>`;
    } else if (kind === "pdf" && item.fileUrl) {
      viewer = `<div class="viewer"><div class="viewer-head"><b>📄 ${t("viewer.pdf")}</b><a class="btn btn-brand btn-sm" style="margin-left:auto" href="${OEG.esc(item.fileUrl)}" download>${t("btn.download")}</a></div>
        <iframe src="${OEG.esc(item.fileUrl)}" title="${OEG.esc(OEG.title(item))}"></iframe></div>`;
    } else if (kind === "html" && item.fileUrl) {
      viewer = `<div class="viewer"><div class="viewer-head"><b>🌐 ${t("viewer.html")}</b><a class="btn btn-brand btn-sm" style="margin-left:auto" href="${OEG.esc(item.fileUrl)}" target="_blank" rel="noopener">${t("btn.open")}</a></div>
        <iframe src="${OEG.esc(item.fileUrl)}" title="${OEG.esc(OEG.title(item))}" sandbox="allow-scripts allow-same-origin"></iframe></div>`;
    } else if (kind === "image" && item.fileUrl) {
      viewer = `<div class="viewer"><div class="viewer-head"><b>🖼️ ${t("viewer.image")}</b></div><img class="view-img" src="${OEG.esc(item.fileUrl)}" alt=""></div>`;
    } else if (kind === "doc" && item.fileUrl) {
      viewer = `<div class="viewer"><div class="viewer-note"><div style="font-size:2.4rem;margin-bottom:10px">📑</div><p>${t("viewer.doc")}</p>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a class="btn btn-brand" href="${OEG.esc(item.fileUrl)}" download>${t("btn.download")}</a>
        <a class="btn btn-outline" target="_blank" rel="noopener" href="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(item.fileUrl)}">${t("viewer.openOffice")}</a></div></div></div>`;
    }
    return `<div class="page-head"><div class="breadcrumb"><a href="#/">${t("nav.home")}</a> / <a href="#/${TYPE_ROUTE[item.type] || ""}">${OEG.typeLabel(item.type)}</a></div>
      <h1>${OEG.esc(OEG.title(item))}</h1>
      <div class="card-meta" style="margin-top:8px"><span class="badge">${OEG.gradeLabel(item.grade)}</span><span>📅 ${OEG.esc(item.date || "")}</span><span>🏷️ ${OEG.subjectLabel(item.subject)}</span></div></div>
      ${item.image ? `<div class="post-hero"><img src="${OEG.esc(item.image)}" alt=""></div>` : ""}
      ${viewer}
      ${item.body ? `<div class="post-body" style="margin-top:22px">${OEG.esc(item.body)}</div>` : ""}
      <div class="share-row">${shareButtons()}</div>
      ${adSlot("contentBottom")}`;
  }

  function postPage(id) { return viewPage(id); }

  function authPage(mode) {
    const isReg = mode === "register";
    return `<div class="form-card">
      <h2>${isReg ? "📝 " + t("page.register") : "🔑 " + t("page.login")}</h2>
      <p class="sub">${OEG.auth.isFirebase() ? "" : t("auth.demo")}</p>
      <div id="authMsg"></div>
      <form id="authForm">
        ${isReg ? `<div class="field"><label>${t("auth.name")}</label><input name="name" required autocomplete="name"></div>` : ""}
        <div class="field"><label>${t("auth.email")}</label><input name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label>${t("auth.password")}</label><input name="password" type="password" required minlength="6" autocomplete="${isReg ? "new-password" : "current-password"}"></div>
        ${isReg ? `<div class="field"><label>${t("auth.role")}</label><select name="role">
          <option value="teacher">${t("auth.teacher")}</option><option value="student">${t("auth.student")}</option><option value="principal">${t("auth.principal")}</option></select></div>` : ""}
        <button class="btn btn-brand" style="width:100%;justify-content:center" type="submit">${isReg ? t("auth.registerBtn") : t("auth.loginBtn")}</button>
      </form>
      <p style="text-align:center;margin-top:16px;font-size:.92rem"><a href="#/${isReg ? "login" : "register"}">${isReg ? t("auth.haveAccount") : t("auth.noAccount")}</a></p>
    </div>`;
  }

  function bindAuth(mode) {
    document.getElementById("authForm").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const msgEl = document.getElementById("authMsg");
      try {
        const user = mode === "register"
          ? await OEG.auth.register({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: fd.get("role") })
          : await OEG.auth.login({ email: fd.get("email"), password: fd.get("password") });
        renderAuthArea();
        OEG.toast("👋 " + t("auth.welcome") + ", " + user.name);
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
    const app = $app();
    window.scrollTo({ top: 0 });
    closeSidebar();
    let html = "", after = null;

    switch (route) {
      case "home": html = homePage(); break;
      case "textbooks": html = listingPage("textbook", "page.textbooks", query); after = () => bindFilters("textbook", "textbooks"); break;
      case "workbooks": html = listingPage("workbook", "page.workbooks", query); after = () => bindFilters("workbook", "workbooks"); break;
      case "office": html = listingPage("office", "page.office", query); after = () => bindFilters("office", "office"); break;
      case "teachers": html = listingPage("teacher", "page.teachers", query); after = () => bindFilters("teacher", "teachers"); break;
      case "students": html = listingPage("student", "page.students", query); after = () => bindFilters("student", "students"); break;
      case "links": html = listingPage("link", "page.links", query); break;
      case "blog": html = listingPage("post", "page.blog", query); break;
      case "games": html = gamesPage(); after = () => {
        app.querySelectorAll("[data-game]").forEach(b => b.onclick = () => {
          const m = { quiz: OEG.games.mountQuiz, memory: OEG.games.mountMemory, math: OEG.games.mountMath }[b.dataset.game];
          m(document.getElementById("gameMount"));
          document.getElementById("gameMount").scrollIntoView({ behavior: "smooth" });
        });
      }; break;
      case "videos": html = videosPage(); break;
      case "view": html = viewPage(seg[1]); break;
      case "post": html = postPage(seg[1]); break;
      case "login": html = authPage("login"); after = () => bindAuth("login"); break;
      case "register": html = authPage("register"); after = () => bindAuth("register"); break;
      case "admin": html = `<div id="adminMount"></div>`; after = () => OEG.admin.render(document.getElementById("adminMount")); break;
      case "search": html = searchPage(query.q || ""); break;
      default: html = homePage();
    }
    app.innerHTML = html;
    if (after) after();
    bindShare(app);
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .08 });
    app.querySelectorAll(".reveal").forEach(el => io.observe(el));
    renderNav();
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

  window.addEventListener("hashchange", render);

  /* ---------- Boot ---------- */
  (async () => {
    await OEG.loadConfig();
    await OEG.loadCatalog();
    OEG.auth.load();
    applyTheme();
    applyI18n();
    render();
  })();
})();
