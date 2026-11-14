/* ============================================================
   OEG Admin Panel — GitHub upload, post editor, video, AdSense
   ============================================================ */
OEG.admin = (() => {
  /* બધી યાદી taxonomy પ્રમાણે — Admin → 🏷️ માંથી ઉમેરાય/કઢાણ હોય એ જ દેખાય */
  const gradeList = () => OEG.tax().grades.map(g => g.key);
  const typeList = () => OEG.tax().types.map(t => t.key);
  const subjList = () => ["all"].concat(OEG.tax().subjects.map(s => s.key));
  const FOLDERS = { textbook: "uploads/textbooks", workbook: "uploads/workbooks", game: "uploads/games", office: "uploads/office", teacher: "uploads/teachers", student: "uploads/students", post: "uploads/posts", video: "uploads/videos", quiz: "uploads/quizzes", link: "uploads/misc" };
  const folderOf = (type) => FOLDERS[type] || ("uploads/" + String(type || "misc").replace(/[^a-z0-9-]/gi, "").toLowerCase() + "s");

  const opts = (arr, sel, labelFn) => arr.map(v => `<option value="${v}" ${v === sel ? "selected" : ""}>${labelFn ? labelFn(v) : v}</option>`).join("");
  /* નામ પરથી આપોઆપ key (કોઈ માન્ય kī field નહીં) — Admin → ફોર્મમાં ફક્ત નામ ભરો */
  const slugOf = (v) => {
    const t2 = String(v || "").replace(/[\u0ae6-\u0aef]/g, c => String(c.charCodeAt(0) - 0x0ae6)).replace(/[\u09e6-\u09ef]/g, c => String(c.charCodeAt(0) - 0x09e6));
    const dig = (t2.match(/[0-9]+/g) || []).join("");
    const raw = t2.replace(/^#\//, "").replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 20);
    if (/^[a-z0-9][a-z0-9-]*$/.test(raw)) return raw;
    if (dig) return dig.slice(0, 8);
    return raw.replace(/^[^a-z0-9]+/, "").slice(0, 20) || ("x" + Date.now().toString(36).slice(-5));
  };
  const uniqKey = (name, arr) => {
    let k = slugOf(name), i = 2;
    while ((arr || []).some(x => x && x.key === k)) k = slugOf(name) + "-" + (i++);
    return k;
  };
  const lab3 = (v, key) => { const t2 = String(v || "").trim() || key; return { gu: t2, hi: t2, en: t2 }; };
  const gradeOpts = (sel) => opts(gradeList(), sel, g => OEG.gradeLabel(g));
  const typeOpts = (sel) => opts(typeList(), sel, t => (OEG.typeIcon(t) ? OEG.typeIcon(t) + " " : "") + OEG.typeLabel(t));
  const subjOpts = (sel) => opts(subjList(), sel, s => OEG.subjectLabel(s));
  /* 🧠 ક્વિઝ/ખાતાં માટે ફક્ત સત્તાવાર ૭ વિષય (taxonomy.gradeSubjects) */
  const qzSubjList = () => ["all"].concat((OEG.auth && OEG.auth.SUBJECTS7 ? OEG.auth.SUBJECTS7() : (OEG.tax().gradeSubjects || [])).map(x => x.key));
  const qzSubjOpts = (sel) => opts(qzSubjList(), sel, s => { const g = (OEG.tax().gradeSubjects || []).filter(x => x.key === s)[0] || {}; return (g.icon ? g.icon + " " : "") + OEG.subjectLabel(s); });
  const qzGradeList = () => ["all"].concat(OEG.tax().grades.filter(g => g.key === "balvatika" || /^\d+$/.test(g.key)).map(g => g.key));
  const qzGradeOpts = (sel) => opts(qzGradeList(), sel, g => OEG.gradeLabel(g));

  /* ---------- 🎯 પ્રેક્ષક (audience) cascade — Upload · ✍️ · 🎬 બધે એ જ વ્યવસ્થા ----------
     પ્રેક્ષક પસંદ કરો → વિદ્યાર્થી હોય તો ધોરણ (પછી જ વિષય), નહીં તો એ પ્રેક્ષકની બાબતો.
     દરેક dropdown પાસે ➕ (નવું ઉમેરો) + 🗑 (કાઢી નાખો) — key ક્યાંય પૂછાતું નથી. */
  const audSelOpts = (sel) => [{ key: "all" }].concat(OEG.auds()).map(a =>
    `<option value="${OEG.esc(a.key)}" ${a.key === (sel || "all") ? "selected" : ""}>${a.icon || "🎯"} ${OEG.esc(a.key === "all" ? OEG.t("aud.all") : OEG.audLabel(a.key))}</option>`).join("");
  const audSubList = (aud) => OEG.audSubs(aud || "");
  const audSubOpts = (aud, sel) => `<option value="">${OEG.t("aud.any")}</option>` + audSubList(aud).map(x =>
    `<option value="${OEG.esc(x.key)}" ${x.key === sel ? "selected" : ""}>${x.icon || "📄"} ${OEG.esc(OEG.taxLabel(x, "subject"))}</option>`).join("");
  const typeOptsAud = (aud, sel) => {
    const all = OEG.tax().types.filter(x => x.route);
    const list = (!aud || aud === "all") ? all : all.filter(x => x.aud === aud || x.aud === "all" || !x.aud || (aud === "office") === (x.aud === "principal"));
    const use = list.length ? list : all;
    return use.map(x => `<option value="${OEG.esc(x.key)}" ${x.key === sel ? "selected" : ""}>${x.icon || "📄"} ${OEG.esc(OEG.typeLabel(x.key))}</option>`).join("");
  };
  const cscBtn = (act) => `<span class="csc-btns"><button type="button" class="btn btn-outline btn-sm" data-cscadd="${act}" title="${OEG.t("admin.cscAdd")}">➕</button><button type="button" class="btn btn-outline btn-sm" data-cscdel="${act}" title="${OEG.t("admin.cscDel")}">🗑</button></span>`;
  /* p = id-prefix; v = {aud,type,grade,subject,audSub,audSub2} */
  function cascadeHtml(p, v) {
    v = v || {};
    const aud = v.aud || "all";
    const stu = aud === "student";
    const noType = !!v.noType;
    const subs = stu ? [] : audSubList(aud);
    const sub2Src = (subs.find(x => x.key === v.audSub) || {}).subs;
    return `<div class="csc" data-csc="${p}">
      <div class="form-row">
        <div class="field"><label>🎯 ${OEG.t("admin.audience")}</label>
          <div class="csc-auds" data-csc-auds>${OEG.auds().concat([{ key: "all", icon: "🌐", label: { gu: OEG.t("aud.all") } }]).map(z => `<button type="button" class="csc-aud ${z.key === aud ? "on" : ""}" data-audpick="${OEG.esc(z.key)}">${z.icon || "🎯"} ${OEG.esc(z.key === "all" ? OEG.t("aud.all") : OEG.audLabel(z.key))}</button>`).join("")}
            <span class="csc-btns"><button type="button" class="btn btn-outline btn-sm" data-cscadd="aud" title="${OEG.t("admin.cscAdd")}">➕</button><button type="button" class="btn btn-outline btn-sm" data-cscdel="aud" title="${OEG.t("admin.cscDel")}">🗑</button></span></div>
          <select id="${p}Aud" class="csc-aud-sel" hidden>${audSelOpts(aud)}</select></div>
        <div class="field"${noType ? ' style="display:none"' : ""}><label>${OEG.t("admin.type")}</label>
          <div class="csc-line"><select id="${p}Type">${typeOptsAud(aud, v.type || "post")}</select></div></div>
      </div>
      <div class="form-row csc-stu" data-csc-row="stu"${stu ? "" : " style=\"display:none\""}>
        <div class="field"><label>🎓 ${OEG.t("admin.grade")}</label>
          <div class="csc-line"><select id="${p}Grade">${gradeOpts(v.grade || "all")}</select>${cscBtn("grade")}</div></div>
        <div class="field csc-subj"${v.grade && v.grade !== "all" || (v.subject && v.subject !== "all") ? "" : " style=\"display:none\""}"><label>📘 ${OEG.t("admin.subject")}</label>
          <div class="csc-line"><select id="${p}Subject">${subjOpts(v.subject || "all")}</select>${cscBtn("subject")}</div></div>
      </div>
      <div class="form-row csc-aud" data-csc-row="aud"${stu || !subs.length ? " style=\"display:none\"" : ""}>
        <div class="field"><label>🧩 ${OEG.t("admin.audTopic")}</label>
          <div class="csc-line"><select id="${p}AudSub">${audSubOpts(aud, v.audSub)}</select>${cscBtn("audSub")}</div></div>
        <div class="field csc-aud2"${sub2Src && sub2Src.length ? "" : " style=\"display:none\""}"><label>🔹 ${OEG.t("admin.audTopic2")}</label>
          <div class="csc-line"><select id="${p}AudSub2">${opts((sub2Src || []).map(x => x.key), v.audSub2, k => { const f = (sub2Src || []).find(y => y.key === k) || {}; return OEG.taxLabel(f, "subject"); })}</select>${cscBtn("audSub2")}</div></div>
      </div>
    </div>`;
  }

  /* ---------- 🌐 ભાષાંતર (એક ભાષા → બાકીની ભાષાઓ auto-fill) ---------- */
  const TR_LANGS = ["gu", "hi", "en"];
  async function trText(text, from, to) {
    text = String(text || "").trim();
    if (!text || from === to) return text;
    const short = text.slice(0, 1200);
    try {
      const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(short)}`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        const out = ((j && j[0]) || []).map(x => x && x[0]).filter(Boolean).join("").trim();
        if (out) return out;
      }
    } catch (e) {}
    try {
      const r2 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(short.slice(0, 500))}&langpair=${from}|${to}`, { cache: "no-store" });
      if (r2.ok) {
        const j2 = await r2.json();
        const o = j2 && j2.responseData && j2.responseData.translatedText;
        if (o && String(o).trim() && String(o).indexOf("INVALID") < 0) return String(o).trim();
      }
    } catch (e) {}
    return text; /* ઑફલાઈન / બ્લોક હોય તો એ જ લખાણ રાખો — કોઈ ભાષા ખાલી રહે નહીં */
  }
  async function fillLangs(vals, translate) {
    const out = {};
    TR_LANGS.forEach(k => { out[k] = String(vals[k] == null ? "" : vals[k]).trim(); });
    const src = TR_LANGS.find(k => out[k]);
    if (!src) return out;
    for (const k of TR_LANGS) {
      if (!out[k]) out[k] = translate ? await trText(out[src], src, k) : out[src];
    }
    return out;
  }

  /* ---------- 🗂️ ટૉબ: એક વખતે એ જ સેક્શન દેખાય (એડમિન ગડબડ ન લાગે) ---------- */
  const TABS = [
    { k: "connect", ic: "🔗" }, { k: "site", ic: "⚙️" }, { k: "material", ic: "✍️" },
    { k: "upload", ic: "📤" }, { k: "youtube", ic: "🎬" }, { k: "items", ic: "🗂️" },
    { k: "tax", ic: "🏷️" }, { k: "nav", ic: "🧭" }, { k: "quiz", ic: "🧠" }, { k: "cert", ic: "🏅" },
    { k: "ads", ic: "💰" }, { k: "seo", ic: "🔎" }, { k: "users", ic: "👥" }, { k: "news", ic: "📣" },
    { k: "files", ic: "📁" }, { k: "account", ic: "🛡️" }
  ];
  let admTab = "";
  let admFlash = null;
  const tabLabel = (k) => { const v = OEG.t("tab." + k); return v && v !== "tab." + k ? v : k; };
  const tabHint = (k) => { const v = OEG.t("tab.hint." + k); return v && v !== "tab.hint." + k ? v : ""; };
  function tabsHtml() {
    return `<div class="adm-tabs" role="tablist">${TABS.map(x =>
      `<button type="button" role="tab" class="adm-tab" data-tab="${x.k}"><b>${x.ic}</b><span>${OEG.esc(tabLabel(x.k))}</span></button>`).join("")}</div>
      <div class="adm-hint" id="admHint"></div>`;
  }

  function render(root) {
    const gh = OEG.state.gh, cfg = OEG.state.config;
    if (!admTab) {
      try { admTab = localStorage.getItem("oeg-adm-tab") || ""; } catch (e) {}
      if (!admTab) admTab = OEG.gh.connected() ? "material" : "connect";
    }
    if (!TABS.some(x => x.k === admTab)) admTab = "material";
    const ce = ((OEG.quiz && OEG.quiz.raw ? OEG.quiz.raw() : {}).cert) || null;
    const triRow = (id, label, val) => {
      const o = val && typeof val === "object" ? val : { gu: val || "", hi: val || "", en: val || "" };
      return `<div class="form-row">
        <div class="field"><label>${label} · ગુ</label><input id="${id}" value="${OEG.esc(o.gu || (typeof val === "string" ? val : ""))}"></div>
        <div class="field"><label>हि</label><input id="${id}Hi" value="${OEG.esc(o.hi || "")}"></div>
        <div class="field"><label>En</label><input id="${id}En" value="${OEG.esc(o.en || "")}"></div>
      </div>`;
    };
    root.innerHTML = `
    <div class="page-head"><h1>🛠️ ${OEG.t("page.admin")}</h1>
      <p><span class="status-dot ${OEG.gh.connected() ? "on" : "off"}"></span>
      ${OEG.gh.connected() ? OEG.t("admin.connected") + ": " + OEG.esc(gh.owner + "/" + gh.repo) : OEG.t("admin.notConnected")}</p></div>

    ${tabsHtml()}
    <div class="admin-grid">
      <!-- GitHub Connect -->
      <section class="panel adm-sec" data-sec="connect">
        <h3>🔗 ${OEG.t("admin.connect")}</h3>
        <div class="field"><label>${OEG.t("admin.owner")}</label><input id="ghOwner" value="${OEG.esc(gh.owner)}" placeholder="OnlineEducationGuru"></div>
        <div class="field"><label>${OEG.t("admin.repo")}</label><input id="ghRepo" value="${OEG.esc(gh.repo)}" placeholder="OEG"></div>
        <div class="field"><label>${OEG.t("admin.branch")}</label><input id="ghBranch" value="${OEG.esc(gh.branch)}" placeholder="main"></div>
        <div class="field"><label>${OEG.t("admin.token")}</label><input id="ghToken" type="password" autocomplete="off">
          <button type="button" class="linklike" id="ghHelpBtn">${OEG.t("admin.howTo")}</button>
          <div class="help-box" id="ghHelp" style="display:none">${OEG.t("admin.howBody")}</div></div>
        <div class="field"><label class="chk"><input type="checkbox" id="ghRemember" checked> ${OEG.t("admin.remember")}</label>
          <span class="vault-state" id="ghVault">${OEG.auth.hasSecret() ? OEG.t("admin.deviceSaved") : OEG.t("admin.deviceNone")}
          ${OEG.auth.hasSecret() ? `<button type="button" class="linklike" id="ghForget">${OEG.t("admin.forgetBtn")}</button>` : ""}</span>
          <span class="vault-warn">${OEG.t("admin.rememberWarn")}</span></div>
        <div class="alert alert-info">${OEG.t("admin.tokenNote")}</div>
        <button class="btn btn-brand" id="ghConnect">${OEG.t("admin.connect")}</button>
        <div id="ghMsg" style="margin-top:12px"></div>
      </section>

      <!-- ⚙️ Site settings -->
      <section class="panel adm-sec" data-sec="site">
        <h3>⚙️ ${OEG.t("admin.site")}</h3>
        <p class="adm-sec-note">${OEG.t("admin.siteNote")}</p>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.siteName")}</label><input id="stName" value="${OEG.esc(cfg.siteName || "")}"></div>
          <div class="field"><label>${OEG.t("admin.siteUrlL")}</label><input id="stUrl" value="${OEG.esc(cfg.siteUrl || "")}" placeholder="https://…"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.logoIcon")}</label><input id="stLogo" maxlength="4" value="${OEG.esc(((cfg.ui || {}).logoEmoji) || "🎓")}"></div>
          <div class="field"><label>${OEG.t("admin.accent")}</label><input id="stAccent" type="color" value="${OEG.esc(((cfg.ui || {}).accent) || "#4f46e5")}"></div>
          <div class="field"><label>${OEG.t("admin.defLang")}</label><select id="stLang">${[["gu", "ગુજરાતી"], ["hi", "हिन्दी"], ["en", "English"]].map(x => `<option value="${x[0]}" ${((cfg.ui || {}).defaultLang) === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}<option value="" ${!(cfg.ui || {}).defaultLang ? "selected" : ""}>${OEG.t("admin.keepUser")}</option></select></div>
          <div class="field"><label>${OEG.t("admin.defTheme")}</label><select id="stTheme"><option value="" ${!["light", "dark"].includes(((cfg.ui || {}).defaultTheme)) ? "selected" : ""}>${OEG.t("admin.keepUser")}</option><option value="light" ${((cfg.ui || {}).defaultTheme) === "light" ? "selected" : ""}>☀️ Light</option><option value="dark" ${((cfg.ui || {}).defaultTheme) === "dark" ? "selected" : ""}>🌙 Dark</option></select></div>
        </div>

        <h4 style="margin:18px 0 6px">🏷️ ${OEG.t("admin.brandTexts")}</h4>
        <div class="alert alert-info">🌐 ${OEG.t("admin.triNote")}</div>
        ${triRow("stTag", OEG.t("admin.tagline"), (cfg.ui || {}).tagline)}
        ${triRow("stHero", OEG.t("admin.heroTitle"), (cfg.ui || {}).heroTitle)}
        ${triRow("stHeroSub", OEG.t("admin.heroSub"), (cfg.ui || {}).heroSub)}
        ${triRow("stAbout", OEG.t("admin.footerAbout"), (cfg.ui || {}).footerAbout)}
        <div class="field"><label>${OEG.t("admin.footerNote")}</label><input id="stNote" value="${OEG.esc(OEG.langField((cfg.ui || {}).footerNote) || "")}" placeholder="${OEG.t("admin.footerNotePh")}"></div>
        <div class="form-row">
          <div class="field"><label>👁 ${OEG.t("admin.viewersBase")}</label><input id="stVisitors" type="number" min="0" step="1000" value="${OEG.esc(String((cfg.ui || {}).viewersBase != null ? (cfg.ui || {}).viewersBase : 1000000))}">
            <p class="adm-sec-note">${OEG.t("admin.viewersBaseNote")}</p></div>
        </div>

        <h4 style="margin:18px 0 6px">${OEG.t("admin.logoTitle")}</h4>
        <p class="adm-sec-note">${OEG.t("admin.logoNote")}</p>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.logoUpload")}</label>
            <input id="stLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/x-icon">
            <p class="adm-sec-note" style="margin-top:6px"><button type="button" class="btn btn-brand btn-sm" id="stLogoUp">🖼 ${OEG.t("admin.logoUpload")}</button> · <span id="stLogoPrev">—</span></p></div>
          <div class="field"><label>${OEG.t("admin.logoUrl")}</label>
            <input id="stLogoUrl" placeholder="uploads/branding/logo.png  ·  https://…" value="${OEG.esc(((cfg.ui || {}).logoUrl) || "")}">
            <p class="adm-sec-note" style="margin-top:6px"><button type="button" class="btn btn-outline btn-sm" id="stLogoClear">${OEG.t("admin.logoClear")}</button></p></div>
        </div>

        <h4 style="margin:18px 0 6px">🔢 ${OEG.t("admin.countsTitle")}</h4>
        <div class="form-row">
          ${[["stCntSt", "home.countStudents", "student"], ["stCntTe", "home.countTeachers", "teacher"], ["stCntPr", "home.countPrincipals", "principal"], ["stCntOt", "home.countOthers", "other"]].map((x) => `
            <div class="field"><label>➕ ${OEG.t(x[1])}</label><input id="${x[0]}" type="number" min="0" step="10" value="${OEG.esc(String(((((cfg.ui || {}).counts || {})[x[2]]) != null ? (((cfg.ui || {}).counts || {})[x[2]]) : (OEG.counts ? OEG.counts.base()[x[2]] : 0))))}"></div>`).join("")}
        </div>
        <p class="adm-sec-note">${OEG.t("admin.countsNote")}</p>

        <h4 style="margin:18px 0 6px">👁️ ${OEG.t("admin.visibility")}</h4>
        <p class="adm-sec-note">${OEG.t("admin.visibilityNote")}</p>
        <div class="tgl-grid" id="stVis"></div>

        <h4 style="margin:18px 0 6px">📞 ${OEG.t("admin.contactSocial")}</h4>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.contactEmail")}</label><input id="stEmail" type="email" value="${OEG.esc(cfg.contactEmail || "")}"></div>
          <div class="field"><label>▶️ YouTube</label><input id="socYt" value="${OEG.esc(((cfg.social || {}).youtube) || "")}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>📘 Facebook</label><input id="socFb" value="${OEG.esc(((cfg.social || {}).facebook) || "")}"></div>
          <div class="field"><label>📸 Instagram</label><input id="socIg" value="${OEG.esc(((cfg.social || {}).instagram) || "")}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>✈️ Telegram</label><input id="socTg" value="${OEG.esc(((cfg.social || {}).telegram) || "")}"></div>
          <div class="field"><label>📲 WhatsApp</label><input id="socWa" value="${OEG.esc(((cfg.social || {}).whatsapp) || "")}"></div>
        </div>
        <button class="btn btn-brand" id="siteSave">💾 ${OEG.t("btn.save")}</button>
        <div id="siteMsg" style="margin-top:12px"></div>
      </section>

      <!-- Upload -->
      <section class="panel adm-sec" data-sec="upload">
        <h3>📤 ${OEG.t("admin.uploadTitle")}</h3>
        <p class="adm-sec-note">🎯 ${OEG.t("admin.audNote")}</p>
        <div class="field"><label>${OEG.t("admin.file")}</label><input id="upFile" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.html,.htm,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip"></div>
        <div class="field"><label>${OEG.t("admin.folder")}</label><input id="upFolder" value="uploads/misc"></div>
        ${cascadeHtml("up", { aud: "student", type: "textbook", grade: "all" })}
        <button class="btn btn-brand" id="upBtn">${OEG.t("btn.upload")}</button>
        <div class="progress hidden" id="upProg"><div></div></div>
        <div id="upMsg" style="margin-top:12px"></div>
      </section>

      <!-- Post / Material editor -->
      <section class="panel adm-sec" data-sec="material">
        <h3>✍️ ${OEG.t("admin.postTitle")}</h3>
        <div class="field"><label>${OEG.t("admin.title")}</label><input id="pTitleGu"></div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.titleHi")}</label><input id="pTitleHi"></div>
          <div class="field"><label>${OEG.t("admin.titleEn")}</label><input id="pTitleEn"></div>
        </div>
        ${cascadeHtml("p", { aud: "all", type: "post", grade: "all" })}
        <div class="alert alert-info">🌐 ${OEG.t("admin.autoLangNote")}</div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.srcLang")}</label><select id="pSrcLang"><option value="gu">ગુજરાતી</option><option value="hi">हिन्दी / Hindi</option><option value="en">English</option></select></div>
          <div class="field"><label>&nbsp;</label><button type="button" class="btn btn-outline" id="pTrBtn" style="width:100%;justify-content:center">🌐 ${OEG.t("admin.trBtn")}</button></div>
        </div>
        <div class="field"><label>${OEG.t("admin.desc")}</label><textarea id="pDesc" placeholder="${OEG.t("admin.autoLangPh")}"></textarea></div>
        <div class="field"><label>${OEG.t("admin.body")}</label><textarea id="pBody" placeholder="${OEG.t("admin.autoLangPh")}"></textarea></div>
        <div id="pTrOut" class="help-box" style="display:none"></div>
        <div class="field"><label>${OEG.t("admin.image")}</label><input id="pImage" placeholder="https://..."></div>
        <div class="field"><label>${OEG.t("admin.fileUrl")}</label><input id="pFileUrl" placeholder="https://.../file.pdf"></div>
        <div class="field"><label>${OEG.t("admin.youtube")}</label><input id="pYoutube" placeholder="https://youtube.com/watch?v=..."></div>
        <div id="pYtPrev" class="yt-prev2"></div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.date")}</label><input id="pDate" type="date"></div>
          <div class="field"><label>${OEG.t("admin.tags")}</label><input id="pTags" placeholder="gcert, 8, science"></div>
        </div>
        <label class="chk" style="display:block;margin-bottom:10px"><input type="checkbox" id="pHidden"> 🙈 ${OEG.t("admin.saveHidden")}</label>
        <button class="btn btn-brand" id="pSave">${OEG.t("btn.save")}</button>
        <div id="pMsg" style="margin-top:12px"></div>
      </section>

      <!-- 🎬 YouTube — ફક્ત લિંક -->
      <section class="panel adm-sec" data-sec="youtube">
        <h3>🎬 ${OEG.t("yt.byUrl")}</h3>
        <div class="alert alert-info">🔒 ${OEG.t("yt.byUrlNote")}</div>
        <div class="field"><label>${OEG.t("admin.youtube")}</label><input id="ytUrl" placeholder="https://www.youtube.com/watch?v=…"></div>
        ${cascadeHtml("yt", { aud: "student", type: "video", grade: "all", noType: true })}
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.srcLang")}</label><select id="ytSrc"><option value="gu">ગુજરાતી</option><option value="hi">हिन्दी</option><option value="en">English</option></select></div>
          <div class="field"><label>&nbsp;</label><button type="button" class="btn btn-outline" id="ytFetchBtn" style="width:100%;justify-content:center">🔎 ${OEG.t("yt.fetch")}</button></div>
        </div>
        <div class="field"><label>${OEG.t("admin.title")}</label><input id="ytTitle" placeholder="${OEG.t("yt.fetch")}"></div>
        <div id="ytPrev"></div>
        <button class="btn btn-brand" id="ytSave">➕ ${OEG.t("btn.save")}</button>
        <div id="ytMsg" style="margin-top:12px"></div>
      </section>

      <!-- 🗂️ Items (edit / delete) -->
      <section class="panel adm-sec" data-sec="items">
        <h3>🗂️ ${OEG.t("admin.items")} <button class="btn btn-outline btn-sm" id="itRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <div class="form-row">
          <div class="field"><label>${OEG.t("nav.search")}</label><input id="itSearch" placeholder="…"></div>
          <div class="field"><label>${OEG.t("admin.catTab")}</label><select id="itType"><option value="all">${OEG.t("filter.all")}</option>${typeOpts("all")}<option value="hidden">🙈 ${OEG.t("admin.hiddenOnly")}</option></select></div>
        </div>
        <div class="sub-cat" style="margin-bottom:12px">
          <div class="sub-cat-head"><b>👁 ${OEG.t("sec.mostViewed")}</b>
            <button type="button" class="btn btn-outline btn-sm" id="vwCommit" style="margin-left:auto">⬆️ ${OEG.t("admin.viewsCommit")}</button>
            <button type="button" class="btn btn-outline btn-sm" id="vwReset">♻️ ${OEG.t("admin.viewsReset")}</button></div>
          <p class="adm-sec-note" style="margin:6px 0 0">${OEG.t("admin.viewsNote")}</p>
          <div class="vw-list" id="vwList"><p style="color:var(--muted);font-size:.86rem">—</p></div>
        </div>
        <div class="file-list" id="itList"><p style="color:var(--muted)">—</p></div>
      </section>

      <!-- 🏷️ Taxonomy -->
      <section class="panel adm-sec" data-sec="tax">
        <h3>🏷️ ${OEG.t("admin.tax")}</h3>
        <div class="alert alert-info">${OEG.t("admin.taxNote")}<br>💡 ${OEG.t("admin.seqNote")}</div>
        <div class="tax-cols">
          <div>
            <h4>${OEG.t("admin.catTab")}</h4>
            <div id="taxTypes"></div>
            <div class="tax-add">
              <input id="taxTypeLabel" placeholder="${OEG.t("admin.newLabel")}" maxlength="30">
              <input id="taxTypeIcon" class="tax-ic" placeholder="🗒️" maxlength="4">
              <select id="taxTypeAud" title="${OEG.t("admin.catAud")}">${audSelOpts("all")}</select>
              <button class="btn btn-brand btn-sm" id="taxAddType">➕ ${OEG.t("admin.addCat")}</button>
            </div>
            <label class="chk tax-gv"><input type="checkbox" id="taxTypeGV"> ${OEG.t("admin.gradeViewL")}</label>
          </div>
          <div>
            <h4>${OEG.t("admin.gradeTab")}</h4>
            <div id="taxGrades"></div>
            <div class="tax-add">
              <input id="taxGradeLabel" placeholder="${OEG.t("admin.newLabel")}" maxlength="30">
              <input id="taxGradeIcon" class="tax-ic" placeholder="🎓" maxlength="4">
              <button class="btn btn-brand btn-sm" id="taxAddGrade">➕ ${OEG.t("admin.addGrade")}</button>
            </div>
          </div>
          <div>
            <h4>📘 ${OEG.t("grade.subjects")} <small>${OEG.t("admin.onlyStudent")}</small></h4>
            <div id="taxSubjects"></div>
            <div class="tax-add">
              <input id="taxSubjectLabel" placeholder="${OEG.t("admin.newLabel")}" maxlength="30">
              <input id="taxSubjectIcon" class="tax-ic" placeholder="📘" maxlength="4">
              <button class="btn btn-brand btn-sm" id="taxAddSubject">➕ ${OEG.t("admin.addSubject")}</button>
            </div>
          </div>
          <div>
            <h4>${OEG.t("admin.quizCats")}</h4>
            <div id="taxQz"></div>
            <div class="tax-add">
              <input id="taxQzLabel" placeholder="${OEG.t("admin.newLabel")}" maxlength="30">
              <input id="taxQzIcon" class="tax-ic" placeholder="🧠" maxlength="4">
              <button class="btn btn-brand btn-sm" id="taxAddQz">➕ ${OEG.t("admin.addQuizCat")}</button>
            </div>
          </div>
        </div>
        <h4 style="margin:20px 0 6px">🎯 ${OEG.t("admin.audMgmt")}</h4>
        <p class="adm-sec-note">${OEG.t("admin.audNote")} · ${OEG.t("admin.reorder")}</p>
        <div id="taxAud" class="aud-cols"></div>
        <div class="tax-add">
          <input id="taxAudLabel" placeholder="${OEG.t("admin.newLabel")}" maxlength="30">
          <input id="taxAudIcon" class="tax-ic" placeholder="🎯" maxlength="4">
          <button class="btn btn-brand btn-sm" id="taxAddAud">➕ ${OEG.t("admin.addAud")}</button>
        </div>
        <h4 style="margin:20px 0 6px">🧩 ${OEG.t("admin.subCats")} ▸ ${OEG.t("admin.chapters")}</h4>
        <p class="adm-sec-note">${OEG.t("admin.subNote")}<br>🌳 ${OEG.t("admin.taxTreeNote")}</p>
        <div id="taxSubs" class="sub-mgr"></div>
        <div id="taxMsg" style="margin-top:12px"></div>
      </section>

      <!-- 🧭 Menu manager -->
      <section class="panel adm-sec" data-sec="nav">
        <h3>🧭 ${OEG.t("admin.navTitle")} <button class="btn btn-outline btn-sm" id="navRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <p class="adm-sec-note">${OEG.t("admin.navNote")}</p>
        <div class="sub-mgr">
          <div class="sub-cat">
            <div class="sub-cat-head">
              <b id="navMode"></b>
              <button type="button" class="btn btn-outline btn-sm" id="navCopy">⬇️ ${OEG.t("admin.navCopy")}</button>
              <button type="button" class="btn btn-danger btn-sm" id="navReset">↩️ ${OEG.t("admin.navReset")}</button>
            </div>
            <div class="nav-rows" id="navList"></div>
            <div class="sub-add">
              <input id="navTIcon" placeholder="🏠 / 🎓" maxlength="4">
              <input id="navTLabel" placeholder="${OEG.t("admin.navLabel")}" maxlength="30">
              <input id="navTLink" list="navLinks" value="#/" maxlength="160" placeholder="#/videos · https://…">
              <button type="button" class="btn btn-brand btn-sm" id="navTAdd">➕ ${OEG.t("admin.navAddTop")}</button>
            </div>
          </div>
        </div>
        <div id="navEd"></div>
        <datalist id="navLinks"></datalist>
        <div class="help-box" style="margin-top:12px">💡 ${OEG.t("admin.navHelp")}</div>
        <div id="navMsg" style="margin-top:12px"></div>
      </section>

      <!-- 🧠 Quiz manager -->
      <section class="panel adm-sec" data-sec="quiz">
        <h3>🧠 ${OEG.t("admin.qManager")} <button class="btn btn-outline btn-sm" id="qzRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.qCat")}</label><select id="qzCat">${opts(OEG.quiz.cats().map(c => c.key), "gk")}</select></div>
          <div class="field" id="qzGradeField"><label>${OEG.t("admin.qGrade")}</label><select id="qzGrade">${qzGradeOpts("all")}</select></div>
          <div class="field" id="qzSubField"><label>${OEG.t("quiz.pickSubject")}</label><select id="qzSub">${qzSubjOpts("all")}</select></div>
          <div class="field" id="qzSubCatField"><label>${OEG.t("admin.qSubCat")}</label><select id="qzSubCat"></select></div>
          <div class="field" id="qzChapField"><label>${OEG.t("admin.chapters")}</label><select id="qzChap"></select></div>
        </div>
        <div class="help-box" id="qzCatHint"></div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("quiz.difficulty")}</label><select id="qzDiff"><option value="easy">${OEG.t("admin.diffEasy")}</option><option value="medium">${OEG.t("admin.diffMedium")}</option><option value="hard">${OEG.t("admin.diffHard")}</option></select></div>
          <div class="field"><label>${OEG.t("admin.passMark")}</label><input id="qzPass" type="number" min="1" max="100" value="60"></div>
          <div class="field"><label>${OEG.t("admin.qTime")}</label><input id="qzSec" type="number" min="10" max="300" value="45"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.srcLang")}</label><select id="qzSrc"><option value="gu">ગુજરાતી</option><option value="hi">हिन्दी</option><option value="en">English</option></select></div>
          <div class="field"><label>&nbsp;</label><button type="button" class="btn btn-outline" id="qzTrBtn" style="width:100%;justify-content:center">🌐 ${OEG.t("admin.trBtn")}</button></div>
        </div>
        <div class="field"><label>${OEG.t("admin.qText")} (🌐 auto gu/hi/en)</label><textarea id="qzText" placeholder="${OEG.t("admin.qText")}"></textarea></div>
        ${[1, 2, 3, 4].map(n => `<div class="form-row"><div class="field"><label>${OEG.t("admin.qOpt")} ${n}</label><input id="qzOpt${n}"></div>
          <div class="field"><label>${OEG.t("admin.qCorrect")}</label><input type="radio" name="qzAns" value="${n - 1}" ${n === 1 ? "checked" : ""}></div></div>`).join("")}
        <div class="field"><label>${OEG.t("admin.qExplain")}</label><input id="qzEx"></div>
        <div class="form-row">
          <button class="btn btn-brand" id="qzAdd">➕ ${OEG.t("admin.qAdd")}</button>
          <button class="btn btn-outline" id="qzCfg">💾 ${OEG.t("admin.passMark")}</button>
        </div>
        <div id="qzTrOut" class="help-box" style="display:none"></div>
        <div id="qzMsg" style="margin-top:12px"></div>
        <div class="file-list" id="qzList" style="margin-top:12px"><p style="color:var(--muted)">—</p></div>
        <h4 style="margin:16px 0 6px">${OEG.t("admin.qCatFlags")}</h4>
        <div class="help-box">${OEG.t("admin.qNoGradeNote")}</div>
        <div class="file-list" id="qzFlags" style="margin-top:8px"></div>
        <h4 style="margin:16px 0 6px">${OEG.t("admin.qBulk")}</h4>
        <div class="help-box">${OEG.t("admin.qCols")}</div>
        <div class="form-row" style="align-items:flex-end">
          <div class="field" style="flex:2"><label>.xlsx / .csv</label><input type="file" id="qzFile" accept=".xlsx,.xls,.csv"></div>
          <div class="field"><button type="button" class="btn btn-outline" id="qzPreview" style="width:100%;justify-content:center">${OEG.t("admin.qImport")}</button></div>
          <div class="field"><button type="button" class="btn btn-outline" id="qzTpl" style="width:100%;justify-content:center">${OEG.t("admin.qTemplate")}</button></div>
        </div>
        <label class="chk" style="display:block;margin:4px 0 8px"><input type="checkbox" id="qzTrRows"> ${OEG.t("admin.qTranslate")}</label>
        <div id="qzImp" style="margin-top:8px"></div>
      </section>

      <!-- 🏅 પ્રમાણપત્ર design -->
      <section class="panel adm-sec" data-sec="cert">
        <h3>🏅 ${OEG.t("admin.cert")}</h3>
        <p class="adm-sec-note">${OEG.t("admin.certNote")}</p>
        <div class="tgl-grid">
          <label class="tgl"><input type="checkbox" id="ceOn" ${!ce || ce.enabled !== false ? "checked" : ""}><span class="tr"></span><span class="tl">${OEG.t("admin.certOn")}</span></label>
          <label class="tgl"><input type="checkbox" id="ceUrl" ${!ce || ce.showUrl !== false ? "checked" : ""}><span class="tr"></span><span class="tl">🔗 ${OEG.t("admin.certUrl")}</span></label>
          <label class="tgl"><input type="checkbox" id="ceSeal" ${!ce || ce.showSeal !== false ? "checked" : ""}><span class="tr"></span><span class="tl">🔏 ${OEG.t("admin.certSeal")}</span></label>
          <label class="tgl"><input type="checkbox" id="ceScore" ${!ce || ce.showScore !== false ? "checked" : ""}><span class="tr"></span><span class="tl">🎯 ${OEG.t("admin.certScore")}</span></label>
        </div>
        <div class="form-row">
          <div class="field"><label>🎨 ${OEG.t("admin.certTheme")}</label><select id="ceTheme">${((OEG.cert && OEG.cert.themeKeys) ? OEG.cert.themeKeys() : ["royal"]).map(k =>
            `<option value="${OEG.esc(k)}" ${((ce || {}).theme || "royal") === k ? "selected" : ""}>${OEG.esc(OEG.cert.themeName(k))}</option>`).join("")}</select></div>
          <div class="field"><label>&nbsp;</label><p class="adm-sec-note" style="margin:0">💡 ${OEG.t("admin.certThemeNote")}</p></div>
        </div>
        ${triRow("ceTitle", OEG.t("admin.certTitleL"), (ce || {}).title)}
        ${triRow("ceSub", OEG.t("admin.certSubL"), (ce || {}).sub)}
        <div class="field"><label>${OEG.t("admin.certFooter")}</label><input id="ceFooter" value="${OEG.esc(OEG.langField((ce || {}).footer) || "")}"></div>
        <h4 style="margin:16px 0 6px">🧪 ${OEG.t("admin.certSample")}</h4>
        <div class="form-row">
          <div class="field"><label>${OEG.t("quiz.yourName")}</label><input id="ceName" value="રાધિકા દિનેશભાઈ પટેલ"></div>
          <div class="field"><label>${OEG.t("admin.qCat")}</label><select id="ceCat"></select></div>
          <div class="field"><label>${OEG.t("admin.qGrade")}</label><select id="ceGrade">${gradeOpts("all")}</select></div>
          <div class="field"><label>${OEG.t("admin.certScore2")}</label><input id="ceSc" type="number" min="0" max="100" value="92"></div>
        </div>
        <div class="form-row" style="align-items:center">
          <button class="btn btn-outline" id="cePreview">👁 ${OEG.t("admin.certPreview")}</button>
          <button class="btn btn-brand" id="ceSave">💾 ${OEG.t("admin.certSave")}</button>
        </div>
        <div id="ceMsg" style="margin-top:12px"></div>
        <div class="cert-wrap"><canvas id="ceCanvas" class="cert-canvas"></canvas></div>
        <h4 style="margin:18px 0 6px">💬 ${OEG.t("admin.certPra")}</h4>
        <p class="adm-sec-note">${OEG.t("admin.certPraNote")}</p>
        <div id="cePra" class="file-list"></div>
        <div class="alert alert-info" style="margin-top:12px">${OEG.t("admin.certLayoutNote")}</div>
      </section>

      <!-- 💰 AdSense + 🔎 SEO -->
      <section class="panel adm-sec" data-sec="ads">
        <h3>💰 ${OEG.t("admin.adsense")}</h3>
        <div class="alert alert-info">📢 ${OEG.t("ads.autoNote")}<br>${OEG.t("ads.everywhere")}</div>
        <div class="field"><label>${OEG.t("admin.publisher")}</label><input id="adPub" value="${OEG.esc((cfg.adsense && cfg.adsense.publisherId) || "")}" placeholder="ca-pub-XXXXXXXXXXXXXXXX"></div>
        <div class="form-row">
          <div class="field"><label>📏 ${OEG.t("ads.size")}</label>
            <select id="adSize">${((OEG.ads && OEG.ads.SIZES) || [["auto", "Auto"]]).map(z => `<option value="${OEG.esc(z[0])}" ${((cfg.adsense || {}).size || "auto") === z[0] ? "selected" : ""}>${OEG.esc(z[1])}</option>`).join("")}</select></div>
          <div class="field"><label>&nbsp;</label><p class="adm-sec-note" style="margin:0">💡 ${OEG.t("ads.sizeNote")}</p></div>
        </div>
        <div class="form-row">
          <div class="field"><label class="chk"><input type="checkbox" id="adOn" ${!cfg.adsense || cfg.adsense.enabled !== false ? "checked" : ""}> Ads ચાલુ</label></div>
          <div class="field"><label class="chk"><input type="checkbox" id="adAuto" ${!cfg.adsense || cfg.adsense.autoAds !== false ? "checked" : ""}> Auto ads</label></div>
        </div>
        <div class="form-row">
          <div class="field"><label>homeTop Slot</label><input id="adHomeTop" value="${OEG.esc(((cfg.adsense || {}).slots || {}).homeTop || "")}"></div>
          <div class="field"><label>homeMid Slot</label><input id="adHomeMid" value="${OEG.esc(((cfg.adsense || {}).slots || {}).homeMid || "")}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>contentBottom Slot</label><input id="adBottom" value="${OEG.esc(((cfg.adsense || {}).slots || {}).contentBottom || "")}"></div>
        </div>
        <h4 style="margin:12px 0 6px">${OEG.t("ads.slotsMore")}</h4>
        <div class="form-row">
          ${["listTop", "listMid", "gradeTop", "viewTop"].map(k => `<div class="field"><label>${k}</label><input data-adslot="${k}" value="${OEG.esc((((cfg.adsense || {}).slots) || {})[k] || "")}"></div>`).join("")}
        </div>
        <div class="form-row">
          ${["viewMid", "videoTop", "quizTop", "quizResult"].map(k => `<div class="field"><label>${k}</label><input data-adslot="${k}" value="${OEG.esc((((cfg.adsense || {}).slots) || {})[k] || "")}"></div>`).join("")}
        </div>
        <div class="form-row">
          ${["gameTop", "inFeed"].map(k => `<div class="field"><label>${k}</label><input data-adslot="${k}" value="${OEG.esc((((cfg.adsense || {}).slots) || {})[k] || "")}"></div>`).join("")}
        </div>
        <button class="btn btn-brand" id="adSave">${OEG.t("btn.save")}</button>
        <div id="adMsg" style="margin-top:12px"></div>
        <div class="help-box" style="margin-top:12px;white-space:pre-line">${OEG.t("ads.steps")}</div>
      </section>

      <section class="panel adm-sec" data-sec="seo">
        <h3>🔎 ${OEG.t("seo.meta")}</h3>
        <div class="alert alert-info">${OEG.t("seo.note")}</div>
        <div class="field"><label>${OEG.t("seo.title")} (gu)</label><input id="seoTitleGu" value="${OEG.esc(OEG.langField((cfg.seo || {}).title))}"></div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("seo.title")} (hi)</label><input id="seoTitleHi" value="${OEG.esc(((cfg.seo || {}).title || {}).hi || "")}"></div>
          <div class="field"><label>${OEG.t("seo.title")} (en)</label><input id="seoTitleEn" value="${OEG.esc(((cfg.seo || {}).title || {}).en || "")}"></div>
        </div>
        <div class="field"><label>${OEG.t("seo.desc")} (gu)</label><textarea id="seoDesc">${OEG.esc(OEG.langField((cfg.seo || {}).description))}</textarea></div>
        <div class="form-row">
          <div class="field"><label>(hi)</label><textarea id="seoDescHi">${OEG.esc(((cfg.seo || {}).description || {}).hi || "")}</textarea></div>
          <div class="field"><label>(en)</label><textarea id="seoDescEn">${OEG.esc(((cfg.seo || {}).description || {}).en || "")}</textarea></div>
        </div>
        <div class="field"><label>${OEG.t("seo.keywords")}</label><textarea id="seoKeys">${OEG.esc((cfg.seo || {}).keywords || "")}</textarea></div>
        <div class="field"><label>Google site verification</label><input id="seoVerify" value="${OEG.esc((cfg.seo || {}).siteVerification || "")}"></div>
        <button class="btn btn-brand" id="seoSave">${OEG.t("btn.save")} · sitemap.xml + robots.txt</button>
        <button type="button" class="btn btn-outline" id="seoPagesBtn">🧱 SEO પાનાંની યાદી</button>
        <div id="seoMsg" style="margin-top:12px"></div>
        <div class="help-box" style="margin-top:12px;white-space:pre-line">${OEG.t("seo.steps")}</div>
        <div id="seoPages" style="display:none;margin-top:10px"></div>
      </section>

      <!-- Admin account -->
      <section class="panel adm-sec" data-sec="account">
        <h3>🛡️ ${OEG.t("admin.access")}</h3>
        <p style="color:var(--muted);font-size:.9rem" id="accNow">…</p>
        <div class="alert alert-info">${OEG.t("admin.accessNote")}</div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("auth.email")}</label><input id="accEmail" type="email" placeholder="you@gmail.com"></div>
          <div class="field"><label>${OEG.t("admin.newPass")}</label><input id="accPass" type="text" placeholder="••••••" autocomplete="new-password"></div>
        </div>
        <button class="btn btn-brand" id="accSave">${OEG.t("btn.save")}</button>
        <div id="accMsg" style="margin-top:12px"></div>
      </section>

      <!-- Users + 📋 રજિસ્ટ્રેશન યાદી + 🔐 નિયમ -->
      <section class="panel adm-sec" data-sec="users">
        <h3>👥 ${OEG.t("admin.users")} <button class="btn btn-outline btn-sm" id="uRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <div class="alert alert-info">${OEG.t("admin.usersNote")}</div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("auth.name")}</label><input id="uName" placeholder="નામ / Name"></div>
          <div class="field"><label>${OEG.t("auth.email")}</label><input id="uEmail" type="email" placeholder="user@gmail.com"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("auth.role")}</label><select id="uRole">
            <option value="teacher">${OEG.t("auth.teacher")}</option>
            <option value="student">${OEG.t("auth.student")}</option>
            <option value="principal">${OEG.t("auth.principal")}</option>
            <option value="admin">${OEG.t("admin.roleAdmin")}</option>
          </select></div>
          <div class="field"><label>${OEG.t("auth.password")}</label><input id="uPass" type="text" minlength="6" placeholder="••••••"></div>
          <div class="field"><label>📱 ${OEG.t("auth.phone")}</label><input id="uPhone" inputmode="tel" placeholder="+91 98••• •••••"></div>
        </div>
        <div class="form-row" id="uGradeRow">
          <div class="field"><label>🎓 ${OEG.t("grade.pickGrade")}</label><select id="uGrade">${userGradeOpts()}</select></div>
          <div class="field"><label>📘 ${OEG.t("auth.subject")}</label><select id="uSubject">${userSubjectOpts()}</select></div>
        </div>
        <p class="adm-sec-note" id="uRoleNote">ℹ️ ${OEG.t("auth.roleNote")}</p>
        <button class="btn btn-brand" id="uAdd">➕ ${OEG.t("admin.addUser")}</button>
        <div class="acc-tools">
          <input class="acc-search" id="accQ" placeholder="${OEG.t("admin.searchAcc")}">
          <button class="btn btn-outline btn-sm" id="accCsv">📋 ${OEG.t("admin.csv")}</button>
        </div>
        <div class="acc-sum" id="accSum"></div>
        <div class="acc-wrap"><table class="acc-tbl" id="uTable"></table></div>
        <div id="uMsg" style="margin-top:12px"></div>

        <h3 style="margin-top:24px">${OEG.t("admin.regTitle")}</h3>
        <p class="adm-sec-note">${OEG.t("admin.regNote")}</p>
        <div class="acc-tools">
          <button class="btn btn-outline btn-sm" id="regRefresh">${OEG.t("admin.regRefresh")}</button>
          <button class="btn btn-brand btn-sm" id="regSave">${OEG.t("admin.regSave")}</button>
          <button class="btn btn-outline btn-sm" id="regSheet">${OEG.t("admin.regSheet")}</button>
          <button class="btn btn-outline btn-sm" id="regAll">${OEG.t("admin.regAll")}</button>
          <input class="acc-search" id="regPass" placeholder="${OEG.t("auth.password")}" style="max-width:170px">
        </div>
        <div class="acc-sum" id="regSum"></div>
        <div class="acc-wrap"><table class="acc-tbl" id="regTable"></table></div>
        <div id="regMsg" style="margin-top:12px"></div>

        <h3 style="margin-top:24px">${OEG.t("admin.ruleTitle")}</h3>
        <div class="form-row">
          <div class="field"><label>📧 ${OEG.t("admin.ruleDomains")}</label><input id="arDom" placeholder="gmail.com"></div>
          <div class="field"><label>🔐 ${OEG.t("admin.ruleGid")}</label><input id="arGid" placeholder="xxxxxxxx.apps.googleusercontent.com"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>🔢 ${OEG.t("admin.ruleOtp")}</label><input id="arOtp" placeholder="https://script.google.com/macros/s/…/exec"></div>
          <div class="field"><label>📤 ${OEG.t("admin.ruleHook")}</label><input id="arHook" placeholder="https://script.google.com/macros/s/…/exec"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>📊 ${OEG.t("admin.ruleHookList")}</label><input id="arHookList" placeholder="https://script.google.com/macros/s/…/exec"></div>
          <div class="field" style="align-self:end"><div class="tgl-grid">
            <label class="tgl"><input type="checkbox" id="arPhoneReq"><span class="tr"></span><span class="tl">📱 ${OEG.t("admin.rulePhone")}</span></label>
            <label class="tgl"><input type="checkbox" id="arPattern"><span class="tr"></span><span class="tl">🚯 ${OEG.t("admin.rulePattern")}</span></label>
            <label class="tgl"><input type="checkbox" id="arGReq"><span class="tr"></span><span class="tl">✅ ${OEG.t("admin.ruleGReq")}</span></label>
          </div></div>
        </div>
        <button class="btn btn-brand" id="arSave">${OEG.t("admin.ruleSave")}</button>
        <div id="arMsg" style="margin-top:12px"></div>
      </section>

      <!-- 📣 સમાચાર પટ્ટી + 🔔 સૂચના + 🟢 વૉટ્સએપ -->
      <section class="panel adm-sec" data-sec="news">
        <h3>${OEG.t("admin.newsTitle")}</h3>
        <div class="alert alert-info">${OEG.t("admin.newsNote")}</div>
        <div class="tgl-grid">
          <label class="tgl"><input type="checkbox" id="nwOn"><span class="tr"></span><span class="tl">📰 ${OEG.t("admin.newsOn")}</span></label>
          <label class="tgl"><input type="checkbox" id="nwAuto"><span class="tr"></span><span class="tl">🆕 ${OEG.t("admin.newsAuto")}</span></label>
          <label class="tgl"><input type="checkbox" id="nwPause"><span class="tr"></span><span class="tl">⏸ ${OEG.t("admin.newsPause")}</span></label>
        </div>
        <div class="form-row" style="margin-top:10px">
          ${triRow("nwLabel", "🏷️ " + OEG.t("admin.newsLabel"), ((OEG.state.config.news || {}).label) || "")}
        </div>
        <div class="form-row">
          <div class="field"><label>⚡ ${OEG.t("admin.newsSpeed")}</label><input id="nwSpeed" type="number" min="12" max="120" step="2"></div>
          <div class="field"><label>🔢 ${OEG.t("admin.newsAutoCount")}</label><input id="nwCount" type="number" min="0" max="20"></div>
          <div class="field"><label>📅 ${OEG.t("admin.newsAutoDays")}</label><input id="nwDays" type="number" min="0" max="3650"></div>
          <div class="field"><label>🏷️ ${OEG.t("admin.newsAutoTypes")}</label><input id="nwTypes" placeholder="post, video"></div>
        </div>
        <div class="field"><label>✍️ ${OEG.t("admin.newsItems")}</label><textarea id="nwItems" placeholder="${OEG.t("admin.newsItemsPh")}"></textarea></div>
        <div class="acc-tools">
          <button class="btn btn-brand btn-sm" id="nwSave">${OEG.t("admin.newsSave")}</button>
          <button class="btn btn-outline btn-sm" id="nwTest">${OEG.t("admin.newsTest")}</button>
          <button class="btn btn-outline btn-sm" id="nwReset">${OEG.t("admin.newsReset")}</button>
        </div>
        <div id="nwMsg" style="margin-top:10px"></div>

        <h3 style="margin-top:26px">${OEG.t("admin.notiTitle")}</h3>
        <div class="alert alert-info">${OEG.t("admin.notiNote")}</div>
        <div class="tgl-grid">
          <label class="tgl"><input type="checkbox" id="ntOn"><span class="tr"></span><span class="tl">🔔 ${OEG.t("admin.notiOn")}</span></label>
          <label class="tgl"><input type="checkbox" id="ntBell"><span class="tr"></span><span class="tl">🛎 ${OEG.t("admin.notiBell")}</span></label>
          <label class="tgl"><input type="checkbox" id="ntPosts"><span class="tr"></span><span class="tl">🆕 ${OEG.t("admin.notiPosts")}</span></label>
          <label class="tgl"><input type="checkbox" id="ntAsk"><span class="tr"></span><span class="tl">❓ ${OEG.t("admin.notiAsk")}</span></label>
        </div>
        <div class="form-row" style="margin-top:10px">
          <div class="field"><label>⏱ ${OEG.t("admin.notiPoll")}</label><input id="ntPoll" type="number" min="1" max="720"></div>
          <div class="field"><label>📅 ${OEG.t("admin.notiDays")}</label><input id="ntDays" type="number" min="0" max="3650"></div>
          <div class="field" style="align-self:end"><p class="adm-sec-note" id="ntPerm">—</p></div>
        </div>
        <div class="form-row">
          ${triRow("ntTitle", "📌 " + OEG.t("admin.notiTitleL"), "")}
        </div>
        <div class="field"><label>💬 ${OEG.t("admin.notiTextL")}</label><textarea id="ntText" rows="3" placeholder="…"></textarea></div>
        <div class="form-row">
          <div class="field"><label>🔗 ${OEG.t("admin.notiUrlL")}</label><input id="ntUrl" placeholder="#/view/…"></div>
          <div class="field" style="align-self:end"><div class="acc-tools" style="margin:0">
            <button class="btn btn-brand btn-sm" id="ntSend">📣 ${OEG.t("admin.notiSend")}</button>
            <button class="btn btn-outline btn-sm" id="ntOn2">🔔 ${OEG.t("n.enable")}</button>
            <button class="btn btn-outline btn-sm" id="ntTest">🧪 ${OEG.t("n.test")}</button>
          </div></div>
        </div>
        <p class="adm-sec-note">${OEG.t("admin.notiList")}</p>
        <div class="file-list" id="ntList"><p style="color:var(--muted)">—</p></div>
        <div id="ntMsg" style="margin-top:10px"></div>

        <h3 style="margin-top:26px">${OEG.t("admin.waTitle")}</h3>
        <div class="alert alert-info">${OEG.t("admin.waNote")}</div>
        <div class="form-row">
          <div class="field"><label>📱 ${OEG.t("admin.waNum")}</label><input id="waNum" inputmode="tel" placeholder="9198••••••••"></div>
          <div class="field"><label>👀 ${OEG.t("admin.waWho")}</label><select id="waWho">
            <option value="admin">🛠️ ${OEG.t("nav.admin")}</option>
            <option value="all">👥 ${OEG.t("admin.users")}</option>
            <option value="off">🚫 ${OEG.t("admin.no")}</option>
          </select></div>
        </div>
        <div class="field"><label>📝 ${OEG.t("admin.waTpl")} <span style="font-weight:400;color:var(--muted)">— ${OEG.t("admin.waTplNote")}</span></label>
          <textarea id="waTpl" rows="6"></textarea></div>
        <div class="acc-tools">
          <button class="btn btn-brand btn-sm" id="waSave">💾 ${OEG.t("btn.save")}</button>
          <button class="btn btn-outline btn-sm" id="waPrev">👁 ${OEG.t("admin.waPrev")}</button>
          <button class="btn btn-outline btn-sm" id="waMark">✅ ${OEG.t("admin.waMark")}</button>
          <button class="btn btn-outline btn-sm" id="waAgain">🔄 ${OEG.t("admin.waReset")}</button>
        </div>
        <div id="waPrevOut" class="help-box" style="display:none;white-space:pre-wrap"></div>
        <p class="adm-sec-note" style="margin-top:12px">🟢 ${OEG.t("wa.title")} <span id="waCount"></span></p>
        <div class="file-list" id="waList"><p style="color:var(--muted)">—</p></div>
        <div id="waMsg" style="margin-top:10px"></div>
      </section>

      <!-- File manager -->
      <section class="panel adm-sec" data-sec="files">
        <h3>📁 ${OEG.t("admin.files")} <button class="btn btn-outline btn-sm" id="fmRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <div class="file-list" id="fmList"><p style="color:var(--muted)">—</p></div>
      </section>
    </div>`;

    const $ = (id) => root.querySelector("#" + id);
    const msg = (id, text, ok) => { const el = $(id); if (!el) return; el.innerHTML = `<div class="alert ${ok ? "alert-ok" : "alert-error"}">${OEG.esc(text)}</div>`; };
    /* સેવ/ડિલીટ પછી સંદેશો બતાવવા માટે પેનલ ફરી બનાવો (નવી યાદી + સંદેશો બંને સાથે) */
    const notify = (id, text, ok) => { admFlash = { id: id, text: text, ok: ok }; render(root); };
    /* સાઇટ પર કંઈ બદલાયું એટલે નિશાની — public પાનાં પર પાછા આવતાં જ તરત નવું દેખાશે */
    const dirty = () => { OEG.state.__dirty = true; };
    const needGh = () => { if (!OEG.gh.connected()) { OEG.toast(OEG.t("admin.notConnected")); return false; } return true; };

    $("ghHelpBtn").onclick = () => { const b = $("ghHelp"); b.style.display = b.style.display === "none" ? "block" : "none"; };
    if ($("ghForget")) $("ghForget").onclick = (e) => {
      e.preventDefault();
      OEG.auth.forgetSecret();
      msg("ghMsg", "🗑️ " + OEG.t("admin.forgetDone"), true);
      render(root);
    };
    $("ghConnect").onclick = async () => {
      OEG.state.gh.owner = $("ghOwner").value.trim();
      OEG.state.gh.repo = $("ghRepo").value.trim();
      OEG.state.gh.branch = $("ghBranch").value.trim() || "main";
      const tok = $("ghToken").value.trim() || (await OEG.auth.recallSecret());
      OEG.state.gh.token = tok;
      $("ghToken").value = "";
      try {
        const info = await OEG.gh.testConnection();
        if (tok && $("ghRemember")) {
          if ($("ghRemember").checked) await OEG.auth.saveSecret(tok);
          else { OEG.auth.forgetSecret(); OEG.state.gh.token = tok; }
        }
        msg("ghMsg", "✅ " + info.name + (OEG.auth.hasSecret() ? " · " + OEG.t("admin.deviceSaved") : ""), true);
        render(root);
      } catch (e) { msg("ghMsg", OEG.t("admin.error") + " " + e.message, false); }
    };

    $("upType").onchange = () => { $("upFolder").value = folderOf($("upType").value); };
    $("upType").onchange();

    $("upBtn").onclick = async () => {
      if (!needGh()) return;
      const f = $("upFile").files[0];
      if (!f) { msg("upMsg", OEG.t("admin.error") + " file", false); return; }
      const folder = $("upFolder").value.replace(/^\/+|\/+$/g, "") || "uploads/misc";
      const path = folder + "/" + f.name.replace(/[^\w.\-() ]/g, "_");
      $("upProg").classList.remove("hidden");
      $("upProg").firstElementChild.style.width = "40%";
      try {
        const buf = await f.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        $("upProg").firstElementChild.style.width = "80%";
        await OEG.gh.uploadFile(path, b64, `Upload ${path}`);
        $("upProg").firstElementChild.style.width = "100%";
        const url = OEG.gh.pagesUrl(path);
        $("pFileUrl").value = url;
        /* 📌 ફાઈલ ચઢાવી એટલે સામગ્રી યાદીમાં પણ ઉમેરાય (પ્રેક્ષક ▸ ધોરણ ▸ વિષય સાથે) */
        const z = cscVal("up");
        const nm = ($("upName").value || f.name.replace(/\.[^.]+$/, "")).trim();
        const ext = (f.name.split(".").pop() || "").toLowerCase();
        const kind = ["png", "jpg", "jpeg", "gif", "webp", "svg"].indexOf(ext) >= 0 ? "image" : ext === "pdf" ? "pdf" : "file";
        try {
          const cur = await OEG.gh.getFile("data/catalog.json");
          const catalog = JSON.parse(cur.content);
          catalog.items = catalog.items || [];
          catalog.items.unshift({
            id: "item-" + Date.now(),
            type: z.type || "textbook",
            aud: z.aud, audSub: z.audSub || "", audSub2: z.audSub2 || "",
            grade: z.grade, subject: z.subject,
            title: { gu: nm, hi: nm, en: nm },
            desc: { gu: path, hi: path, en: path },
            fileUrl: url, fileType: kind,
            date: new Date().toISOString().slice(0, 10),
            tags: [], hidden: false
          });
          catalog.updated = new Date().toISOString().slice(0, 10);
          await OEG.gh.saveCatalog(catalog, "Add: " + nm.slice(0, 40));
          await OEG.loadCatalog();
          dirty();
          msg("upMsg", "✅ " + path + " · ➕ " + OEG.t("admin.taxSaved"), true);
        } catch (e2) { msg("upMsg", "✅ " + path + " · ⚠️ " + OEG.t("admin.error") + " " + e2.message, false); }
        loadFiles();
        renderAll();
      } catch (e) { msg("upMsg", OEG.t("admin.error") + " " + e.message, false); }
      setTimeout(() => $("upProg").classList.add("hidden"), 1200);
    };

    $("pSave").onclick = async () => {
      if (!needGh()) return;
      const yt = $("pYoutube").value.trim();
      const srcLang = ($("pSrcLang") || {}).value || "gu";
      const btn = $("pSave");
      btn.disabled = true; btn.textContent = "⏳ " + OEG.t("admin.trBusy");
      let item;
      const editing = editId && OEG.byId(editId);
      try {
        const title = await fillLangs({ gu: $("pTitleGu").value, hi: $("pTitleHi").value, en: $("pTitleEn").value }, true);
        const desc = await fillLangs({ [srcLang]: $("pDesc").value }, true);
        const bodyObj = String($("pBody").value || "").trim() ? await fillLangs({ [srcLang]: $("pBody").value }, true) : "";
        item = {
          id: "item-" + Date.now(),
          type: yt ? "video" : $("pType").value,
          grade: ($("pGrade") || {}).value || "all",
          subject: ($("pSubject") || {}).value || "all",
          aud: ($("pAud") || {}).value || "all",
          audSub: ($("pAudSub") || {}).value || "",
          audSub2: ($("pAudSub2") || {}).value || "",
          title, desc, body: bodyObj,
          image: $("pImage").value.trim(),
          fileUrl: yt || encodeURI($("pFileUrl").value.trim()),
          fileType: yt ? "video" : undefined,
          date: ($("pDate") && $("pDate").value) || new Date().toISOString().slice(0, 10),
          tags: (($("pTags") && $("pTags").value) || "").split(",").map(x => x.trim()).filter(Boolean),
          hidden: !!($("pHidden") && $("pHidden").checked)
        };
        if (!item.title.gu && !item.title.hi && !item.title.en) { msg("pMsg", OEG.t("admin.error") + " title", false); return; }
        const cur = await OEG.gh.getFile("data/catalog.json");
        const catalog = JSON.parse(cur.content);
        catalog.items = catalog.items || [];
        if (editing) {
          const at = catalog.items.findIndex(x => x.id === editId);
          item.id = editId;
          const prev = catalog.items[at] || {};
          item.date = ($("pDate") && $("pDate").value) || prev.date;
          item.seo = prev.seo;
          if (at >= 0) catalog.items[at] = item; else catalog.items.unshift(item);
        } else catalog.items.unshift(item);
        catalog.updated = new Date().toISOString().slice(0, 10);
        await OEG.gh.saveCatalog(catalog, (editing ? "Update: " : "Add: ") + (item.title.gu || item.title.en));
        await OEG.loadCatalog();
        dirty();
        renderItems(root); renderTax(root);
        msg("pMsg", "✅ " + OEG.t("admin.saved") + " · 🌐 gu/hi/en", true);
        ["pTitleGu", "pTitleHi", "pTitleEn", "pDesc", "pBody", "pImage", "pFileUrl", "pYoutube", "pTags"].forEach(id => { const el = $(id); if (el) el.value = ""; });
        if ($("pHidden")) $("pHidden").checked = false;
        if (editing) { editId = ""; const b = $("pEditOn"); if (b) b.remove(); }
      } catch (e) { msg("pMsg", OEG.t("admin.error") + " " + e.message, false); }
      finally { btn.disabled = false; btn.textContent = OEG.t("btn.save"); }
    };

    /* 🌐 અગાઉથી ભાષાંતર જોઈ/ભરી લો (save પહેલાં તપાસ) */
    if ($("pTrBtn")) $("pTrBtn").onclick = async () => {
      const btn = $("pTrBtn");
      btn.disabled = true; btn.textContent = "⏳ " + OEG.t("admin.trBusy");
      const srcLang = ($("pSrcLang") || {}).value || "gu";
      try {
        const t = await fillLangs({ gu: $("pTitleGu").value, hi: $("pTitleHi").value, en: $("pTitleEn").value }, true);
        const map = { gu: "pTitleGu", hi: "pTitleHi", en: "pTitleEn" };
        TR_LANGS.forEach(k => { const el = $(map[k]); if (el && !el.value.trim()) el.value = t[k]; });
        const d = await fillLangs({ [srcLang]: $("pDesc").value }, true);
        const b2 = await fillLangs({ [srcLang]: $("pBody").value }, true);
        const rows = TR_LANGS.map(k => `<p><b>${OEG.t("lang." + k) || k}</b><br>📌 ${OEG.esc(t[k] || "—")}</p>${d[k] ? `<p>📝 ${OEG.esc(d[k])}</p>` : ""}${b2[k] ? `<p>📄 ${OEG.esc(String(b2[k]).slice(0, 220))}${String(b2[k]).length > 220 ? "…" : ""}</p>` : ""}`).join("");
        const out = $("pTrOut");
        out.innerHTML = `<b>🌐 ${OEG.t("admin.trPreview")}</b>${rows}`;
        out.style.display = "block";
      } catch (e) { msg("pMsg", OEG.t("admin.error") + " " + e.message, false); }
      btn.disabled = false; btn.textContent = "🌐 " + OEG.t("admin.trBtn");
    };

    async function patchConfig(mutate, message) {
      const cur = await OEG.gh.getFile("data/site-config.json");
      const cfg2 = JSON.parse(cur.content);
      await mutate(cfg2);
      await OEG.gh.saveSiteConfig(cfg2, message);
      /* જે કૉપિ લખી એ જ memory માં — Pages ની જૂની ફાઈલ ફેરફાર ધોઈ ન શકે */
      OEG.applyConfig(cfg2);
      OEG.markConfigWritten(cfg2);
      try {
        const r = await fetch(OEG.base("data/site-config.json"), { cache: "no-store" });
        if (r.ok) {
          let j = null;
          try { j = JSON.parse(await r.text()); } catch (e) { j = null; }
          if (j && OEG.cfgSame(j, OEG.state.config)) OEG.configPending = null;   /* Pages પર આવી ગઈ */
        }
      } catch (e) {}
      return cfg2;
    }
    const adIds = { homeTop: "adHomeTop", homeMid: "adHomeMid", contentBottom: "adBottom" };
    $("adSave").onclick = async () => {
      if (!needGh()) return;
      try {
        await patchConfig((cfg2) => {
          const slots = Object.assign({}, (cfg2.adsense || {}).slots || {});
          Object.keys(adIds).forEach(k => { slots[k] = $(adIds[k]).value.trim(); });
          root.querySelectorAll("[data-adslot]").forEach(inp => { slots[inp.dataset.adslot] = inp.value.trim(); });
          cfg2.adsense = {
            publisherId: $("adPub").value.trim(),
            size: ($("adSize") || {}).value || "auto",
            enabled: $("adOn") ? $("adOn").checked : true,
            autoAds: $("adAuto") ? $("adAuto").checked : true,
            slots: slots
          };
        }, "Update AdSense config");
        dirty();
        msg("adMsg", "✅ " + OEG.t("admin.saved") + " · " + OEG.t("ads.everywhere") + " · " + OEG.t("ads.size"), true);
        if (OEG.ads) { OEG.ads.head(); OEG.ads.flush(document); }
      } catch (e) { msg("adMsg", OEG.t("admin.error") + " " + e.message, false); }
    };

    /* ---------- 🔎 SEO panel ---------- */
    if ($("seoPagesBtn")) $("seoPagesBtn").onclick = () => {
      const box = $("seoPages");
      if (box.style.display !== "none") { box.style.display = "none"; return; }
      const list = OEG.seo ? OEG.seo.routes() : [];
      box.innerHTML = `<b>🧱 ${list.length} SEO પાનાં</b>
        <div class="help-box" style="max-height:220px;overflow:auto">${list.map(r => `<p><code>${OEG.esc(r.p)}</code> <small>prio ${r.pri} · ${r.freq}</small></p>`).join("")}</div>
        <p style="color:var(--muted);font-size:.8rem">પાનાં બનાવવા: <code>node scripts/seo.mjs</code> ચલાવી commit કરો — Admin માંથી sitemap.xml + robots.txt તરત જ સેવ થાય છે.</p>`;
      box.style.display = "block";
    };
    $("seoSave").onclick = async () => {
      if (!needGh()) return;
      try {
        await patchConfig((cfg2) => {
          cfg2.seo = Object.assign({}, cfg2.seo || {});
          const guT = $("seoTitleGu").value.trim();
          if (guT) cfg2.seo.title = { gu: guT, hi: $("seoTitleHi").value.trim() || guT, en: $("seoTitleEn").value.trim() || guT };
          const guD = $("seoDesc").value.trim();
          if (guD) cfg2.seo.description = { gu: guD, hi: $("seoDescHi").value.trim() || guD, en: $("seoDescEn").value.trim() || guD };
          if ($("seoKeys").value.trim()) cfg2.seo.keywords = $("seoKeys").value.trim();
          if ($("seoVerify").value.trim()) cfg2.seo.siteVerification = $("seoVerify").value.trim();
        }, "Update SEO meta");
        if (OEG.seo) {
          const day = new Date().toISOString().slice(0, 10);
          const xml = OEG.seo.sitemapXml((OEG.state.config.siteUrl || "").replace(/\/$/, ""));
          const robots = OEG.seo.robotsTxt((OEG.state.config.siteUrl || "").replace(/\/$/, ""));
          await OEG.gh.putFile("sitemap.xml", xml, "seo: sitemap");
          await OEG.gh.putFile("robots.txt", robots, "seo: robots");
        }
        dirty();
        msg("seoMsg", "✅ " + OEG.t("seo.saved"), true);
      } catch (e) { msg("seoMsg", OEG.t("admin.error") + " " + e.message, false); }
    };

    /* ---------- 🏷️ Taxonomy: ઉમેરો · કાઢી નાખો · સરકાવીને ક્રમ બદલો (કોઈ key ફીલ્ડ નહીં) ---------- */
    async function writeTax(mutate, okMsg) {
      if (!needGh()) return;
      const box = $("taxMsg");
      try {
        await patchConfig((cfg2) => {
          cfg2.taxonomy = Object.assign({ types: [], grades: [], subjects: [], gradeSubjects: [], quizCats: [], audiences: [] }, cfg2.taxonomy || {});
          mutate(cfg2.taxonomy);
        }, "tax: update");
        await OEG.loadCatalog().catch(() => {});
        box.innerHTML = `<div class="alert alert-ok">✅ ${OEG.esc(okMsg)}</div>`;
        dirty();
        renderAll();
      } catch (e) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message)}</div>`; }
    }
    const TAX_KEY = { types: "types", grades: "grades", subjects: "subjects", qz: "quizCats", aud: "audiences", gradeSubjects: "gradeSubjects" };
    const DEFIC = { types: "📄", grades: "🎓", subjects: "📘", qz: "🧠", aud: "🎯" };
    const taxList = (tx, kind) => {
      const k = TAX_KEY[kind] || kind;
      if (!Array.isArray(tx[k]) || !tx[k].length) tx[k] = JSON.parse(JSON.stringify(OEG.tax()[k] || []));
      return tx[k];
    };
    const taxSay = (kind, text) => { const b = $("taxMsg"); if (b) b.innerHTML = `<div class="alert alert-${kind}">${OEG.esc(text)}</div>`; else OEG.toast(String(text)); };
    /* audience tree (૩ સ્તર) માં path પ્રમાણે container + item */
    function audAt(tx, path) {
      const L = taxList(tx, "aud");
      if (path.length === 1) return { list: L, item: L.filter(x => x && x.key === path[0])[0] };
      const a = L.filter(x => x && x.key === path[0])[0]; if (!a) return {};
      if (!Array.isArray(a.subs)) a.subs = [];
      if (path.length === 2) return { list: a.subs, item: a.subs.filter(x => x && x.key === path[1])[0] };
      const x = a.subs.filter(y => y && y.key === path[1])[0]; if (!x) return {};
      if (!Array.isArray(x.subs)) x.subs = [];
      return { list: x.subs, item: x.subs.filter(y => y && y.key === path[2])[0] };
    }
    const taxAt = (tx, kind, path) => (kind === "aud" ? audAt(tx, path) : (() => {
      const L = taxList(tx, kind);
      return { list: L, item: L.filter(x => x && x.key === path[0])[0] };
    })());
    async function taxAdd(kind, name, icon, extra) {
      if (!needGh()) return;
      name = String(name || "").trim();
      if (!name) { taxSay("error", OEG.t("admin.needLabel")); return; }
      try {
        await writeTax((tx) => {
          const L = taxList(tx, kind);
          if (L.some(x => OEG.langField(x.label) === name)) throw new Error("⚠️ " + OEG.t("admin.dupExists"));
          const key = uniqKey(name, L);
          const o = { key: key, icon: String(icon || "").trim() || DEFIC[kind] || "📄", label: lab3(name, key) };
          if (kind === "types") { o.route = (extra && extra.route) || key; o.aud = (extra && extra.aud) || "all"; o.gradeView = !!(extra && extra.gradeView); }
          if (kind === "qz" || kind === "aud") o.subs = [];
          if (kind === "grades") {
            const at = L.findIndex(x => x.key === "all");
            if (at >= 0) { L.splice(at, 0, o); return; }
          }
          L.push(o);
          if (kind === "subjects") {
            const gs = taxList(tx, "gradeSubjects");
            if (!gs.some(x => x.key === key)) gs.push({ key: key, icon: o.icon, label: o.label });
          }
        }, OEG.t("admin.taxSaved") + " · " + name);
      } catch (e) { taxSay("error", e.message); }
    }
    const affectedBy = (kind, path) => {
      const items = OEG.state.catalogAll || OEG.state.catalog || [];
      if (kind === "types") return items.filter(i => i.type === path[0]);
      if (kind === "grades") return items.filter(i => i.grade === path[0]);
      if (kind === "subjects") return items.filter(i => i.subject === path[0]);
      if (kind === "aud") return items.filter(i => OEG.audOfItem(i) === path[0]);
      return [];
    };
    async function taxOp(act, kind, path, val) {
      if (!needGh()) return;
      const key = path[path.length - 1];
      if (act === "del") {
        /* ક્વિઝની કેટેગરી → પ્રશ્નો સાથે રદ (એ જ જૂની સલામત રીત) */
        if (kind === "qz" && path.length === 1) { window.OEG_admin_tax_remove("qz", key); return; }
        const used = path.length === 1 ? affectedBy(kind, path) : [];
        if (used.length && !confirm(OEG.t("admin.delConfirm") + " — " + key + " · " + used.length + " " + OEG.t("admin.qCount"))) return;
        if (!used.length && !confirm(OEG.t("admin.delConfirm") + " — " + key + "?")) return;
        try {
          if (used.length) {
            const ids = {};
            used.forEach(x => { ids[x.id] = 1; });
            await writeCatalog((OEG.state.catalogAll || OEG.state.catalog).filter(x => !ids[x.id]), "Remove: " + key);
          } else if (path.length > 1) {
            await untagItems(path.length === 2 ? "audSub" : "audSub2", key);
          }
        } catch (e) { taxSay("error", e.message); return; }
      }
      try {
        await writeTax((tx) => {
          const r = taxAt(tx, kind, path);
          if (!r || !r.item) throw new Error(OEG.t("admin.deleted") + "? " + key);
          if (act === "del") {
            r.list.splice(r.list.indexOf(r.item), 1);
            if (kind === "subjects") { const gs = taxList(tx, "gradeSubjects"); for (let i = gs.length - 1; i >= 0; i--) if (gs[i].key === key) gs.splice(i, 1); }
            return;
          }
          const i = r.list.indexOf(r.item), j = i + (act === "up" ? -1 : 1);
          if (j < 0 || j >= r.list.length) return;
          r.list[j] = r.list.splice(i, 1, r.list[j])[0];
        }, act === "del" ? OEG.t("admin.deleted") + " · " + key : OEG.t("admin.taxMoved"));
      } catch (e) { taxSay("error", e.message); }
    }
    async function taxSet(kind, path, what, val) {
      if (!needGh()) return;
      try {
        await writeTax((tx) => {
          if (kind === "subjects" && what === "gv") {
            const L = taxList(tx, "subjects"), gs = taxList(tx, "gradeSubjects");
            const it = L.filter(x => x.key === path[0])[0];
            for (let i = gs.length - 1; i >= 0; i--) if (gs[i].key === path[0]) gs.splice(i, 1);
            if (val) gs.push({ key: path[0], icon: (it || {}).icon || "📘", label: (it || {}).label || lab3(path[0], path[0]) });
            return;
          }
          const r = taxAt(tx, kind, path);
          if (!r || !r.item) throw new Error(OEG.t("admin.tax") + " · " + path.join("/"));
          if (what === "label") {
            const lg = OEG.state.lang;
            const src = (r.item.label && typeof r.item.label === "object") ? r.item.label : {};
            const o = Object.assign({}, src);
            o[lg] = val;
            if (!o.gu) o.gu = val; if (!o.hi) o.hi = o.gu; if (!o.en) o.en = o.gu;
            r.item.label = o;
          }
          if (what === "aud") r.item.aud = val;
          if (what === "gv") r.item.gradeView = !!val;
        }, OEG.t("admin.taxSaved"));
      } catch (e) { taxSay("error", e.message); }
    }
    /* યાદી: નામ બદલો + ⬆⬇ + 🗑 (બધી જગ્યાએ એ જ નિયમ) */
    const taxRows = (list, kind) => (list || []).map((x, i) => {
      const lab = OEG.taxLabel(x, kind === "grades" ? "grade" : kind === "types" ? "type" : "subject");
      const inGv = kind === "subjects" ? (OEG.tax().gradeSubjects || []).some(g => g.key === x.key) : null;
      return `<div class="tax-row">
        <span class="tax-ic">${x.icon || "•"}</span>
        <input class="tax-ren" data-ren="${kind}:${OEG.esc(x.key)}" value="${OEG.esc(lab || x.key)}" maxlength="30">
        <code>${OEG.esc(x.key)}</code>
        ${kind === "types" ? `<select data-taud="${OEG.esc(x.key)}" title="${OEG.t("admin.catAud")}">${audSelOpts(x.aud || "all")}</select>
          <label class="chk tax-gv" title="${OEG.t("admin.gradeViewL")}"><input type="checkbox" data-tgv="${OEG.esc(x.key)}" ${x.gradeView !== false ? "checked" : ""}></label>` : ""}
        ${inGv !== null ? `<label class="chk tax-gv" title="${OEG.t("admin.gradeViewL")}"><input type="checkbox" data-tgv2="${OEG.esc(x.key)}" ${inGv ? "checked" : ""}></label>` : ""}
        <span class="tax-mv">
          <button type="button" class="btn btn-outline btn-sm" data-tmv="${kind}:${OEG.esc(x.key)}:-1" title="⬆">⬆</button>
          <button type="button" class="btn btn-outline btn-sm" data-tmv="${kind}:${OEG.esc(x.key)}:1" title="⬇">⬇</button>
          ${x.key !== "all" ? `<button type="button" class="btn btn-danger btn-sm" data-tdel="${kind}:${OEG.esc(x.key)}" title="${OEG.t("admin.delete")}">🗑</button>` : ""}
        </span></div>`;
    }).join("");
    function audCols() {
      const tx = OEG.tax();
      return (tx.audiences || []).map((a) => {
        const subs = Array.isArray(a.subs) ? a.subs : [];
        return `<div class="aud-col">
          <div class="aud-head">
            <span class="tax-ic">${a.icon || "🎯"}</span>
            <input class="tax-ren" data-ren="aud:${OEG.esc(a.key)}" value="${OEG.esc(OEG.audLabel(a.key))}" maxlength="24">
            <code>${OEG.esc(a.key)}</code>
            <span class="tax-mv">
              <button type="button" class="btn btn-outline btn-sm" data-tmv="aud:${OEG.esc(a.key)}:-1">⬆</button>
              <button type="button" class="btn btn-outline btn-sm" data-tmv="aud:${OEG.esc(a.key)}:1">⬇</button>
              <button type="button" class="btn btn-danger btn-sm" data-tdel="aud:${OEG.esc(a.key)}">🗑</button>
            </span>
          </div>
          ${a.key === "student" ? `<p class="sub-none">🎓 ${OEG.t("admin.studentTopicsNote")}</p>` : ""}
          <div class="aud-subs">${subs.length ? subs.map(x => {
            const kids = Array.isArray(x.subs) ? x.subs : [];
            return `<div class="tax-row lv2"><span class="tax-ic">${x.icon || "🏷️"}</span>
              <input class="tax-ren" data-ren="aud:${OEG.esc(a.key)}:${OEG.esc(x.key)}" value="${OEG.esc(OEG.taxLabel(x, "subject"))}" maxlength="30">
              <code>${OEG.esc(x.key)}</code>
              <span class="tax-mv">
                <button type="button" class="btn btn-outline btn-sm" data-tmv="aud:${OEG.esc(a.key)}:${OEG.esc(x.key)}:-1">⬆</button>
                <button type="button" class="btn btn-outline btn-sm" data-tmv="aud:${OEG.esc(a.key)}:${OEG.esc(x.key)}:1">⬇</button>
                <button type="button" class="btn btn-danger btn-sm" data-tdel="aud:${OEG.esc(a.key)}:${OEG.esc(x.key)}">🗑</button>
              </span>
              <div class="aud-kids">${kids.map(y => `<div class="tax-row lv3"><span class="tax-ic">${y.icon || "🔹"}</span>
                  <input class="tax-ren" data-ren="aud:${OEG.esc(a.key)}:${OEG.esc(x.key)}:${OEG.esc(y.key)}" value="${OEG.esc(OEG.taxLabel(y, "subject"))}" maxlength="30">
                  <span class="tax-mv"><button type="button" class="btn btn-outline btn-sm" data-tmv="aud:${OEG.esc(a.key)}:${OEG.esc(x.key)}:${OEG.esc(y.key)}:-1">⬆</button>
                    <button type="button" class="btn btn-outline btn-sm" data-tmv="aud:${OEG.esc(a.key)}:${OEG.esc(x.key)}:${OEG.esc(y.key)}:1">⬇</button>
                    <button type="button" class="btn btn-danger btn-sm" data-tdel="aud:${OEG.esc(a.key)}:${OEG.esc(x.key)}:${OEG.esc(y.key)}">🗑</button></span></div>`).join("")}
                <div class="tax-add mini"><input data-a2lab="${OEG.esc(a.key)}:${OEG.esc(x.key)}" placeholder="${OEG.t("admin.audTopic2")}" maxlength="30">
                  <button type="button" class="btn btn-brand btn-sm" data-a2add="${OEG.esc(a.key)}:${OEG.esc(x.key)}">➕</button></div>
              </div>
            </div>`;
          }).join("") : `<p class="sub-none">${OEG.t("admin.noTopics")}</p>`}</div>
          ${a.key === "student" ? "" : `<div class="tax-add mini"><input data-alab="${OEG.esc(a.key)}" placeholder="${OEG.t("admin.audTopic")}" maxlength="30">
            <input data-aic="${OEG.esc(a.key)}" class="tax-ic" placeholder="🏷️" maxlength="4">
            <button type="button" class="btn btn-brand btn-sm" data-aadd="${OEG.esc(a.key)}">➕ ${OEG.t("admin.subAdd")}</button></div>`}
        </div>`;
      }).join("");
    }
    function bindTax() {
      const box = $("taxTypes");
      if (!box) return;
      const tx = OEG.tax();
      box.innerHTML = taxRows(tx.types, "types");
      $("taxGrades").innerHTML = taxRows(tx.grades.filter(g => g.key !== "all"), "grades");
      $("taxSubjects").innerHTML = taxRows(tx.subjects, "subjects");
      $("taxQz").innerHTML = taxRows(tx.quizCats, "qz");
      $("taxAud").innerHTML = audCols();
      const all = root;
      Array.prototype.forEach.call(all.querySelectorAll("[data-tmv]"), (b) => {
        b.onclick = () => { const p = b.dataset.tmv.split(":"); const dir = p.pop(); taxOp(dir === "-1" ? "up" : "down", p[0], p.slice(1)); };
      });
      Array.prototype.forEach.call(all.querySelectorAll("[data-tdel]"), (b) => {
        b.onclick = () => { const p = b.dataset.tdel.split(":"); taxOp("del", p[0], p.slice(1)); };
      });
      Array.prototype.forEach.call(all.querySelectorAll("[data-ren]"), (inp) => {
        inp.onchange = () => { const p = inp.dataset.ren.split(":"); const v = inp.value.trim(); if (v) taxSet(p[0], p.slice(1), "label", v); };
      });
      Array.prototype.forEach.call(all.querySelectorAll("[data-taud]"), (sel) => {
        sel.onchange = () => taxSet("types", [sel.dataset.taud], "aud", sel.value);
      });
      Array.prototype.forEach.call(all.querySelectorAll("[data-tgv]"), (ck) => {
        ck.onchange = () => taxSet("types", [ck.dataset.tgv], "gv", ck.checked);
      });
      Array.prototype.forEach.call(all.querySelectorAll("[data-tgv2]"), (ck) => {
        ck.onchange = () => taxSet("subjects", [ck.dataset.tgv2], "gv", ck.checked);
      });
      Array.prototype.forEach.call(all.querySelectorAll("[data-aadd]"), (b) => {
        b.onclick = () => {
          const k = b.dataset.aadd;
          const inp = all.querySelector('[data-alab="' + k + '"]'), ic = all.querySelector('[data-aic="' + k + '"]');
          const name = ((inp || {}).value || "").trim();
          if (!name) { if (inp) inp.focus(); taxSay("error", OEG.t("admin.needLabel")); return; }
          addAudSub(k, name, ((ic || {}).value || "").trim(), null);
        };
      });
      Array.prototype.forEach.call(all.querySelectorAll("[data-a2add]"), (b) => {
        b.onclick = () => {
          const k = b.dataset.a2add;
          const inp = all.querySelector('[data-a2lab="' + k + '"]');
          const name = ((inp || {}).value || "").trim();
          if (!name) { if (inp) inp.focus(); taxSay("error", OEG.t("admin.needLabel")); return; }
          addAudSub(k.split(":")[0], name, "", k.split(":")[1]);
        };
      });
    }
    async function addAudSub(audKey, name, icon, subKey) {
      if (!needGh()) return;
      try {
        await writeTax((tx) => {
          const path = subKey ? [audKey, subKey] : [audKey];
          const r = audAt(tx, path);
          if (!r || !r.list) throw new Error(OEG.t("admin.tax") + " · " + audKey);
          const L = subKey ? r.list : (r.item.subs = r.item.subs || []);
          if (L.some(x => OEG.langField(x.label) === name)) throw new Error("⚠️ " + OEG.t("admin.dupExists"));
          const key = uniqKey(name, L);
          const o = { key: key, icon: icon || (subKey ? "🔹" : "🏷️"), label: lab3(name, key) };
          if (!subKey) o.subs = [];
          L.push(o);
        }, (subKey ? OEG.t("admin.subAdded2") : OEG.t("admin.topicAdded")) + " · " + name);
      } catch (e) { taxSay("error", e.message); }
    }
    /* બાબત/ઉપ-બાબત કાઢી નાખો → એ ટૅગ ધરાવતી આઇટમમાંથી ટૅગ દૂર (સામગ્રી રહે) */
    async function untagItems(field, key) {
      const items = (OEG.state.catalogAll || OEG.state.catalog || []).map(x => (x[field] === key ? Object.assign({}, x, { [field]: "" }) : x));
      await writeCatalog(items, "Untag " + field + ": " + key);
    }
    /* જુના બટન (key ફીલ્ડ વગર હવે ફક્ત નામ પરથી) */
    $("taxAddType").onclick = () => taxAdd("types", $("taxTypeLabel").value, $("taxTypeIcon").value,
      { aud: ($("taxTypeAud") || {}).value || "all", gradeView: !!($("taxTypeGV") || {}).checked });
    $("taxAddGrade").onclick = () => taxAdd("grades", $("taxGradeLabel").value, $("taxGradeIcon").value, null);
    $("taxAddSubject").onclick = () => taxAdd("subjects", $("taxSubjectLabel").value, $("taxSubjectIcon").value, null);
    $("taxAddQz").onclick = () => taxAdd("qz", $("taxQzLabel").value, $("taxQzIcon").value, null);
    $("taxAddAud").onclick = () => taxAdd("aud", $("taxAudLabel").value, $("taxAudIcon").value, null);
    /* quiz category કાઢવી હોય તો પ્રશ્નો પણ સાથે જ રદ (અગાઉ પ્રમાણે) */
    window.OEG_admin_tax_remove = async (kind, key) => {
      const box = $("taxMsg");
      if (kind === "qz") {
        const bank = OEG.quiz.raw();
        const qs = (bank.questions || []).filter(q => (q.cat || "gk") === key);
        if (qs.length && !confirm(OEG.t("admin.qzDelCatAsk") + "\n" + key + " → " + qs.length + " " + OEG.t("admin.qCount"))) return;
        if (!qs.length && !confirm(OEG.t("admin.delConfirm") + " — " + key + "?")) return;
        try {
          await saveBank((b) => {
            b.questions = (b.questions || []).filter(q => (q.cat || "gk") !== key);
            b.cats = (Array.isArray(b.cats) ? b.cats : []).filter(c => (typeof c === "string" ? c : c.key) !== key);
            return b;
          }, "", "taxMsg");
        } catch (e) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message)}</div>`; return; }
        await writeTax((tx) => {
          tx.quizCats = (tx.quizCats && tx.quizCats.length ? tx.quizCats : OEG.tax().quizCats).filter(x => x.key !== key);
        }, OEG.t("admin.deleted") + " · " + key + (qs.length ? ` (${qs.length} ${OEG.t("admin.qCount")})` : ""));
        return;
      }
      taxOp("del", kind === "grades" ? "grades" : kind, [key]);
    };
    /* ---------- 🧠 Quiz questions ---------- */
    const say = (box, kind, html) => {
      if (box) box.innerHTML = `<div class="alert alert-${kind}">${html}</div>`;
      else OEG.toast(String(html).replace(/<[^>]*>/g, ""));
    };
    async function saveBank(next, okMsg, msgId) {
      if (!needGh()) return;
      const box = $(msgId) || $("qzMsg") || $("taxMsg");
      try {
        const cur = await OEG.gh.getFile("data/quiz.json");
        const bank = JSON.parse(cur.content);
        const out = next(bank) || bank;
        await OEG.data.writeJson("data/quiz.json", out, "quiz: update");
        /* Pages ની સ્ટૅટિક ફાઈલ હજી જૂની હોઈ શકે — એટલે load() નહીં, લખેલી બેંક જ માની લો */
        OEG.quiz.applyBank(out);
        if (OEG.quiz.markSaved) OEG.quiz.markSaved(out);
        dirty();
        renderAll();
        say(box, "ok", "✅ " + OEG.esc(okMsg));
      } catch (e) { say(box, "error", "❌ " + OEG.esc(e && e.message ? e.message : String(e))); }
    }
    /* 🌳 taxonomy (કેટેગરી / ઉપ-શ્રેણી / ચેપ્ટર) — quiz.js ના helper થી લખાય, એક જ રસ્તો */
    async function taxGo(fn, okMsg) {
      const box = $("taxMsg");
      if (!OEG.gh.connected()) { say(box, "error", "❌ " + OEG.esc(OEG.t("admin.notConnected"))); return false; }
      try {
        await fn();
        dirty(); renderAll();
        say(box, "ok", "✅ " + OEG.esc(okMsg));
        return true;
      } catch (e) { say(box, "error", "❌ " + OEG.esc(e && e.message ? e.message : String(e))); return false; }
    }
    $("qzAdd").onclick = async () => {
      const cat = $("qzCat").value, mode = OEG.quiz.modeOf(cat);
      const grade = mode === "grade" ? $("qzGrade").value : "all";
      const subject = mode === "grade" && $("qzSub") ? $("qzSub").value : "all";
      const sub = mode === "sub" ? ($("qzSubCat") || {}).value || "all" : "";
      const chap = ($("qzChap") || {}).value || "all";
      if (mode === "sub") {
        const box0 = $("qzMsg");
        if (!OEG.quiz.subsOf(cat).length) { box0.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(OEG.t("admin.qNeedSub"))}</div>`; return; }
        if (sub === "all") { box0.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(OEG.t("admin.qPickSub"))}</div>`; return; }
      }
      const diff = $("qzDiff").value;
      const src = ($("qzSrc") || {}).value || "gu";
      const stem = $("qzText").value.trim();
      const opt = [1, 2, 3, 4].map(i => $("qzOpt" + i).value.trim());
      const a = Number((root.querySelector('input[name="qzAns"]:checked') || {}).value || 0);
      const ex = $("qzEx").value.trim();
      const box = $("qzMsg");
      if (!stem || opt.filter(Boolean).length < 4) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(OEG.t("admin.qText"))} + 4 × ${OEG.esc(OEG.t("admin.qOpt"))}</div>`; return; }
      const btn = $("qzAdd");
      btn.disabled = true; btn.textContent = "⏳ " + OEG.t("admin.trBusy");
      try {
        const tStem = await fillLangs({ [src]: stem }, true);
        const tEx = ex ? await fillLangs({ [src]: ex }, true) : { gu: "", hi: "", en: "" };
        const tOpts = [];
        for (const o of opt) tOpts.push(o ? await fillLangs({ [src]: o }, true) : { gu: "", hi: "", en: "" });
        await saveBank((bank) => {
          bank.questions = bank.questions || [];
          const same = bank.questions.filter(q => q.cat === cat);
          const stamp = Date.now().toString(36).slice(-4);
          bank.questions.unshift({
            id: "q-" + cat + "-" + String(same.length + 1).padStart(2, "0") + "-" + stamp,
            cat, grade, diff, q: tStem, opts: tOpts, a, ex: tEx, marks: 1
          });
          if (subject && subject !== "all") bank.questions[0].subject = subject;
          if (sub && sub !== "all") bank.questions[0].sub = sub;
          if (chap && chap !== "all") bank.questions[0].chap = chap;
          bank.passPercent = Number($("qzPass").value) || bank.passPercent || 60;
          bank.seconds = Number($("qzSec").value) || bank.seconds || 45;
          return bank;
        }, OEG.t("admin.qSaved"));
        ["qzText", "qzOpt1", "qzOpt2", "qzOpt3", "qzOpt4", "qzEx"].forEach(id => $(id).value = "");
      } catch (e) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message)}</div>`; }
      btn.disabled = false; btn.textContent = "➕ " + OEG.t("admin.qAdd");
    };
    window.OEG_admin_qz_del = (id) => {
      if (!confirm(OEG.t("admin.delConfirm"))) return;
      saveBank((bank) => { bank.questions = (bank.questions || []).filter(q => q.id !== id); return bank; }, OEG.t("admin.qDeleted"));
    };
    window.OEG_admin_qz_cfg = () => saveBank((bank) => {
      bank.passPercent = Number($("qzPass").value) || 60;
      bank.seconds = Number($("qzSec").value) || 45;
      return bank;
    }, OEG.t("admin.taxSaved"));

    /* ---------- કેટેગરી પ્રમાણે ધોરણ/વિષય ફિલ્ડ ચાલુ-બંધ ---------- */
    /* વિષય / ઉપ-શ્રેણી dropdown = taxonomy + admin એ ઉમેરેલી ઉપ-શ્રેણીઓ (એક જ સ્રોત) */
    function fillQzSubSel(cat) {
      const el = $("qzSub");
      if (!el) return;
      const key = cat || (($("qzCat") || {}).value);
      const list = OEG.quiz.subsOf(key);
      const v = el.value;
      el.innerHTML = `<option value="all">${OEG.t("quiz.allSubjects")}</option>` + list.map(x =>
        `<option value="${OEG.esc(x.key)}">${x.icon || "📘"} ${OEG.esc(OEG.quiz.subLabel(key, x.key))} · ${OEG.quiz.countIn(key, "all", x.key, "all", "all")}</option>`).join("");
      if (Array.prototype.some.call(el.options, o => o.value === v)) el.value = v;
    }
    function fillChapSel(cat) {
      const el = $("qzChap");
      if (!el) return;
      const key = cat || ($("qzCat") || {}).value;
      const mode = OEG.quiz.modeOf(key);
      const l2 = mode === "grade" ? (($("qzSub") || {}).value || "all") : (($("qzSubCat") || {}).value || "all");
      const chaps = l2 && l2 !== "all" ? OEG.quiz.chapsOf(key, l2) : [];
      const v = el.value;
      el.innerHTML = `<option value="all">📗 ${OEG.t("quiz.allChaps")}</option>` + chaps.map(x =>
        `<option value="${OEG.esc(x.key)}">${OEG.esc(OEG.quiz.chapTitle(key, l2, x.key))} · ${OEG.quiz.chapCount(key, l2, x.key, "all")}</option>`).join("");
      if (Array.prototype.some.call(el.options, o => o.value === v)) el.value = v;
    }
    function fillSubSel(cat) {
      const el = $("qzSubCat");
      if (!el) return;
      const key = cat || ($("qzCat") || {}).value;
      const subs = OEG.quiz.subsOf(key);
      const v = el.value;
      el.innerHTML = `<option value="all">${OEG.t("admin.subAll")} (${OEG.quiz.countIn(key, "all", "all", "all")})</option>`
        + subs.map(x => `<option value="${OEG.esc(x.key)}">${x.icon || "🏷️"} ${OEG.esc(OEG.taxLabel(x, "subject"))} · ${OEG.quiz.subCount(key, x.key)}</option>`).join("");
      if (Array.prototype.some.call(el.options, o => o.value === v)) el.value = v;
    }
    function syncCat() {
      const sel = $("qzCat");
      if (!sel) return;
      const mode = OEG.quiz.modeOf(sel.value);
      const gf = $("qzGradeField"), sf = $("qzSubField"), hint = $("qzCatHint"), sc = $("qzSubCatField");
      if (gf) gf.style.display = mode === "grade" ? "" : "none";
      if (sf) {
        sf.style.display = mode === "grade" ? "" : "none";
        if (sf.style.display === "none" && $("qzSub")) $("qzSub").value = "all";
      }
      if (sc) sc.style.display = mode === "sub" ? "" : "none";
      fillSubSel(sel.value);
      fillQzSubSel(sel.value);
      const cf = $("qzChapField");
      if (cf) cf.style.display = mode === "none" ? "none" : "";
      fillChapSel(sel.value);
      if (hint) hint.textContent = mode === "grade"
        ? "🎓 + 📖 " + OEG.t("admin.qHintGrade")
        : mode === "sub" ? "🧩 " + OEG.t("admin.qHintSub") : "🚫 " + OEG.t("admin.qHintNone");
    }
    const qzCatSel0 = $("qzCat");
    if (qzCatSel0) qzCatSel0.addEventListener("change", () => { fillQzSubSel(($("qzCat") || {}).value); fillChapSel(($("qzCat") || {}).value); });
    const qzSubSel0 = $("qzSub");
    if (qzSubSel0) qzSubSel0.onchange = () => fillChapSel(($("qzCat") || {}).value);
    const qzSubCatSel0 = $("qzSubCat");
    if (qzSubCatSel0) qzSubCatSel0.onchange = () => fillChapSel(($("qzCat") || {}).value);
    const CAT_MODES = [["grade", "🎓 " + OEG.t("admin.modeGrade")], ["sub", "🧩 " + OEG.t("admin.modeSub")], ["none", "🚫 " + OEG.t("admin.modeNone")]];
    function renderFlags(r) {
      const box = (r || root).querySelector("#qzFlags");
      if (!box) return;
      const list = OEG.quiz.cats();
      box.innerHTML = list.map((c) => `<div class="file-item">
          <b>${c.icon || "🧠"} ${OEG.esc(OEG.taxLabel(c, "subject"))}</b>
          <code>${OEG.esc(c.key)}</code>
          <span class="badge">${c.count} ${OEG.t("grade.items")}</span>
          <label>${OEG.t("admin.qAfter")}</label>
          <select data-qmode="${OEG.esc(c.key)}">${CAT_MODES.map(m => `<option value="${m[0]}" ${(c.mode || "none") === m[0] ? "selected" : ""}>${m[1]}</option>`).join("")}</select>
          <span class="badge">🧩 ${(c.subs || []).length} ${OEG.t("admin.subCats")}</span>
        </div>`).join("")
        + `<p class="adm-sec-note" style="margin-top:8px">🧩 ${OEG.t("admin.qzFlagsNote")}</p>`;
      box.querySelectorAll("[data-qmode]").forEach(sel => { sel.onchange = () => window.OEG_admin_cat_mode(sel.dataset.qmode, sel.value); });
    }
    /* જૂની key પર આધારિત ફ્લેગ હવે mode માંથી સેટ થાય (પાછલા ડેટા સાથે સુસંગત) */
    window.OEG_admin_qz_flag = (key, on, kind) => {
      const cur = OEG.quiz.modeOf(key);
      const mode = kind === "useGrade" ? (on ? "grade" : "none") : (on || cur === "grade" ? "grade" : cur);
      window.OEG_admin_cat_mode(key, mode);
    };

    /* ---------- 📥 Excel / CSV થી બધા પ્રશ્નો (4 વિકલ્પ + સાચો જવાબ) ---------- */
    let impRows = [];
    const XLSX_SRC = "assets/vendor/xlsx.mini.js";
    let libPromise = null;
    function loadLib() {
      if (window.XLSX) return Promise.resolve(window.XLSX);
      if (!libPromise) libPromise = new Promise((res, rej) => {
        const el = document.createElement("script");
        el.src = XLSX_SRC; el.async = true;
        el.onload = () => window.XLSX ? res(window.XLSX) : rej(new Error(OEG.t("admin.qNeedLib")));
        el.onerror = () => { libPromise = null; rej(new Error(OEG.t("admin.qNeedLib"))); };
        document.head.appendChild(el);
      });
      return libPromise;
    }
    const LANG_TOK = { gu: ["gu", "guj", "gujarati", "ગુ", "ગુજરાતી", "गु", "गुजराती"], hi: ["hi", "hin", "hindi", "हि", "हिन्दी", "हिंदी"], en: ["en", "eng", "english", "અં", "અંગ્રેજી", "इं", "अंग्रेजी"] };
    const hnorm = (h) => String(h == null ? "" : h).replace(/\u00a0/g, " ").trim().toLowerCase().replace(/[():.]/g, " ").replace(/\s+/g, " ").trim();
    const hlang = (h) => { const tk = hnorm(h).split(" "); const ks = Object.keys(LANG_TOK); for (const k of ks) if (LANG_TOK[k].some(x => tk.indexOf(x) >= 0)) return k; return ""; };
    /* "Question (en)" નું ક્ષેત્ર shodhવા ભાષા-token દૂર કરો */
    const LANG_ALL = ["gu", "guj", "gujarati", "ગુ", "ગુજરાતી", "गु", "गुजराती", "hi", "hin", "hindi", "हि", "हिन्दी", "हिंदी", "en", "eng", "english", "અં", "અંગ્રેજી", "इं", "अंग्रेजी"];
    const hstrip = (h) => hnorm(h).split(" ").filter(tk => LANG_ALL.indexOf(tk) < 0).join(" ").trim();
    const ABC = { a: "1", b: "2", c: "3", d: "4" };
    function hfield(h) {
      const t = hstrip(h);
      if (!t) return "";
      const op = /^(option|opt|વિકલ્પ|विकल्प|choice)\s*([1-4abcd])/.exec(t);
      if (op) return "o" + (ABC[op[2]] || op[2]);
      if (/^[abcd]$/.test(t)) return "o" + ABC[t];
      if (/^(q|question|પ્રશ્ન|प्रश्न|stem|query)$/.test(t)) return "q";
      if (/^(options|વિકલ્પો|विकल्प|choices)$/.test(t)) return "opts";
      if (/^(answer|ans|right|correct|સાચો|साचा|উত্তর|उत्तर|जवाब)/.test(t)) return "a";
      if (/^(ex|explain|explanation|reason|સમજૂતી|व्याख्या|કારણ)/.test(t)) return "ex";
      if (/^(cat|category|શ્રેણી|કેટેગરી|श्रेणी|quiz cat|type)$/.test(t)) return "cat";
      if (/^(sub|subcat|sub-cat|subcategory|sub category|ઉપ-?કેટેગરી|સબ(?:-?કેટેગરી)?|सब-?श्रेणी|उप-?श्रेणी)$/.test(t)) return "sub";
      if (/^(grade|class|standard|std|ધોરણ|कक्षा)$/.test(t)) return "grade";
      if (/^(subject|વિષય|विषय)$/.test(t)) return "subject";
      if (/^(diff|difficulty|level|અઘણતા|અઘણુ|स्तर|સ્તર)$/.test(t)) return "diff";
      if (/^(marks|mark|ગુણ|अंक)$/.test(t)) return "marks";
      return "";
    }
    const cell = (row, i) => (i == null ? "" : String(row[i] == null ? "" : row[i]).trim());
    const guessLang = (v) => /[\u0a80-\u0aff]/.test(v) ? "gu" : /[\u0900-\u097f]/.test(v) ? "hi" : "en";
    /* એક જ કૉલમ → ત્રણેય ભાષામાં એ જ લખાણ (ખાલી જગ્યા રહે નહીં); 🌐 tick કરો તો અનુવાદ થાય */
    const obj3 = (v) => { const s = String(v || "").trim(); return { gu: s, hi: s, en: s }; };
    const slug = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u0a80-\u0aff\u0900-\u097f-]/g, "").replace(/^-+|-+$/g, "");
    function catKeyFor(val) {
      const raw = String(val || "").trim();
      if (!raw) return { key: "gk", isNew: false };
      const norm = raw.toLowerCase();
      const hit = OEG.quiz.cats().filter(c => c.key.toLowerCase() === norm || Object.keys(c.label || {}).some(k => String(c.label[k]).toLowerCase() === norm))[0];
      if (hit) return { key: hit.key, isNew: false };
      const k = /^[a-z0-9][a-z0-9_-]{1,18}$/.test(norm.replace(/\s+/g, "-")) ? norm.replace(/\s+/g, "-") : slug(raw).slice(0, 18);
      return { key: k || ("cat-" + Date.now().toString(36).slice(-4)), isNew: true, label: raw };
    }
    function subKeyFor(val, catKey) {
      const raw = String(val || "").trim();
      if (!raw || /^(all|બધા|सभी|-|—)$/.test(raw)) return { key: "", isNew: false };
      const norm = raw.toLowerCase();
      const hit = OEG.quiz.subsOf(catKey).filter(x => String(x.key).toLowerCase() === norm || Object.keys(x.label || {}).some(k => String(x.label[k]).toLowerCase() === norm))[0];
      if (hit) return { key: hit.key, isNew: false };
      const k = /^[a-z0-9][a-z0-9_-]{1,18}$/.test(norm.replace(/\s+/g, "-")) ? norm.replace(/\s+/g, "-") : slug(raw).slice(0, 18);
      return { key: k || ("sub-" + Date.now().toString(36).slice(-4)), isNew: true, label: raw };
    }
    function gradeFor(val) {
      const raw = String(val || "").trim();
      if (!raw) return "all";
      if (/બાલ|balv|bal/i.test(raw)) return "balvatika";
      const n = (raw.match(/\d+/) || [])[0];
      const keys = OEG.tax().grades.map(g => g.key);
      if (n && keys.indexOf(n) >= 0) return n;
      if (keys.indexOf(raw.toLowerCase()) >= 0) return raw.toLowerCase();
      return "all";
    }
    function diffFor(val) {
      const t = String(val || "").trim().toLowerCase();
      if (/hard|કઠિન|कठिन|મુશ્કેલ/.test(t)) return "hard";
      if (/med|medium|મધ્યમ|अधिम|ઊંચા/.test(t)) return "medium";
      if (/easy|સરળ|आसान|कठिन/.test(t)) return "easy";
      return "easy";
    }
    function subjFor(val) {
      const t = String(val || "").trim().toLowerCase();
      if (!t) return "";
      const hit = OEG.tax().subjects.filter(s => s.key.toLowerCase() === t || Object.keys(s.label || {}).some(k => String(s.label[k]).toLowerCase() === t))[0];
      return hit ? hit.key : "";
    }
    const IND = { "૧": 1, "૨": 2, "૩": 3, "૪": 4, "१": 1, "२": 2, "३": 3, "४": 4 };
    const fixDigits = (v) => String(v).replace(/[૧૨૩૪१२३४]/g, (c) => String(IND[c]));
    function answerFor(val, opts) {
      const t = fixDigits(String(val || "")).trim().replace(/[).\s]+$/, "").replace(/^(option|opt|વિકલ્પ|विकल्प)\s*/i, "").trim();
      if (!t) return -1;
      if (/^[abcd]$/i.test(t)) return "ABCD".indexOf(t.toUpperCase());
      if (/^[1-4]$/.test(t)) return Number(t) - 1;
      if (/^[abcd](?=[)\s]|$)/i.test(t)) return "ABCD".indexOf(t[0].toUpperCase());
      const n = t.toLowerCase().replace(/^[abcd][).:\s]+/i, "");
      const i = opts.findIndex(o => String(o).trim().toLowerCase().replace(/^[abcd][).:\s]+/i, "") === n && n);
      return i;
    }
    function parseRows(rows) {
      const head = rows[0] || [];
      const cols = {}, lcols = {};
      head.forEach((h, i) => {
        const f = hfield(h);
        if (!f) return;
        const lg = hlang(h);
        if (lg && !lcols[f + "@" + lg]) lcols[f + "@" + lg] = i;
        if (!cols[f]) cols[f] = i;
      });
      const out = [];
      (rows.slice(1) || []).forEach((row, ri) => {
        if (!row || !row.some(c => String(c == null ? "" : c).trim())) return;
        const n = ri + 2;
        const g = (f, lg) => (lg && lcols[f + "@" + lg] != null ? cell(row, lcols[f + "@" + lg]) : "");
        const get = (f) => cell(row, cols[f]);
        /* કોઈ ફીલ્ડ માટે ભાષા-કૉલમ હોય તો એ લો, નહીં તો base કૉલમનું લખાણ ત્રણેય ભાષામાં */
        const field3 = (f, fallback) => {
          const has = ["gu", "hi", "en"].some((lg) => lcols[f + "@" + lg] != null);
          const base = String(fallback == null ? "" : fallback).trim();
          if (!has) return obj3(base);
          const o = { gu: g(f, "gu"), hi: g(f, "hi"), en: g(f, "en") };
          ["gu", "hi", "en"].forEach((k) => { if (!o[k]) o[k] = base; });
          return o;
        };
        const stem = get("q");
        let opts = [1, 2, 3, 4].map(i => get("o" + i));
        if (opts.filter(Boolean).length < 4 && get("opts")) opts = get("opts").split(/\s*[|;\n]\s*/);
        opts = opts.slice(0, 4).map(o => String(o || "").trim());
        const errs = [];
        if (!stem) errs.push("q");
        if (opts.filter(Boolean).length < 4) errs.push("4 × option");
        const a = answerFor(get("a"), opts);
        if (a < 0) errs.push("answer");
        if (errs.length) { out.push({ n: n, err: errs.join(", ") }); return; }
        const cc = catKeyFor(get("cat"));
        const sc = subKeyFor(get("sub"), cc.key);
        out.push({
          newSub: sc.isNew ? { key: sc.key, label: sc.label || sc.key, cat: cc.key } : null,
          n: n,
          obj: {
            id: "q-" + cc.key + "-" + n + "-" + Date.now().toString(36).slice(-4),
            cat: cc.key, grade: gradeFor(get("grade")), subject: subjFor(get("subject")), sub: sc.key,
            diff: diffFor(get("diff")),
            q: field3("q", stem),
            opts: opts.map((o, j) => field3("o" + (j + 1), o)),
            a: a, ex: field3("ex", get("ex")),
            marks: Number(get("marks")) || 1
          },
          raw: { q: stem, opts: opts, ex: get("ex") }
        });
      });
      return { cols: cols, rows: out };
    }
    window.OEG_admin_qz_parse = parseRows;
    /* ભાષા-સ્લોટ ભરો: ખાલી હોય એ જ ભરાય (વિદ્યાર્થીએ ભરેલું ક્યારેય ન કૂચોળાય) */
    async function langFill(base, src, existing) {
      const have = Object.assign({ gu: "", hi: "", en: "" }, existing || {});
      const s = String(src || "").trim();
      if (!s) return have;
      const t = await fillLangs({ [guessLang(s)]: s }, true);
      const keep = guessLang(s);
      ["gu", "hi", "en"].forEach((k) => { if (k !== keep && (!have[k] || have[k] === s)) have[k] = t[k] || s; });
      return have;
    }
    async function translateRows(rows) {
      const box = $("qzImp");
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r.err) continue;
        r.obj.q = await langFill("q", r.raw.q, r.obj.q);
        r.obj.ex = await langFill("ex", r.raw.ex, r.obj.ex);
        for (let j = 0; j < 4; j++) r.obj.opts[j] = await langFill("o" + (j + 1), r.raw.opts[j], r.obj.opts[j]);
        if (i % 6 === 0 && box) box.innerHTML = `<p style="color:var(--muted)">🌐 ${i + 1}/${rows.length} …</p>`;
      }
    }
    function paintImport() {
      const box = $("qzImp");
      if (!box) return;
      const okRows = impRows.filter(r => !r.err), bad = impRows.filter(r => r.err);
      if (!impRows.length) { box.innerHTML = ""; return; }
      box.innerHTML = `<div class="alert ${okRows.length ? "alert-ok" : "alert-error"}">
          ${okRows.length ? "✅ " + okRows.length + " " + OEG.t("admin.qImported") : "⚠️ " + OEG.t("admin.qNoRows")}${bad.length ? " · ⚠️ " + bad.length + " " + OEG.t("admin.qBadRows") : ""}
        </div>
        ${bad.length ? `<div class="help-box">⚠️ ${bad.slice(0, 6).map(b => "row " + b.n + ": " + OEG.esc(b.err)).join(" · ")}</div>` : ""}
        <div class="file-list">${okRows.slice(0, 10).map(r => `<div class="file-item"><span>${r.obj.n || r.n}</span>
            <code>${OEG.esc(String(r.obj.q.gu || r.obj.q.en).slice(0, 54))}</code>
            <span class="badge">${OEG.esc(r.obj.cat)}</span>${r.obj.sub ? `<span class="badge">🧩 ${OEG.esc(r.obj.sub)}</span>` : ""}<span class="badge">${OEG.gradeLabel(r.obj.grade)}</span>
            <span class="badge">✅ ${"ABCD"[r.obj.a]}</span></div>`).join("")}${okRows.length > 10 ? `<p style="color:var(--muted);font-size:.84rem">+${okRows.length - 10}…</p>` : ""}</div>
        <div class="form-row" style="margin-top:8px">
          <button class="btn btn-brand" id="qzCommit">${OEG.t("admin.qCommit")} (${okRows.length})</button>
          <button class="btn btn-outline" id="qzCancel">✕</button>
        </div>`;
      const cm = $("qzCommit");
      if (cm) cm.onclick = commitImport;
      const cx = $("qzCancel");
      if (cx) cx.onclick = () => { impRows = []; $("qzFile").value = ""; paintImport(); };
    }
    async function commitImport() {
      const rows = impRows.filter(r => !r.err).map(r => r.obj);
      const newSubs = impRows.filter(r => !r.err && r.newSub).map(r => r.newSub);
      if (!rows.length) { $("qzImp").innerHTML = `<div class="alert alert-error">⚠️ ${OEG.esc(OEG.t("admin.qNoRows"))}</div>`; return; }
      const btn = $("qzCommit");
      if (btn) { btn.disabled = true; btn.textContent = "⏳ " + OEG.t("admin.qCommit"); }
      try {
        if ($("qzTrRows") && $("qzTrRows").checked) {
          const src = impRows.filter(r => !r.err);
          await translateRows(src);
          rows.forEach((o, i) => { if (src[i]) o.q = src[i].obj.q, o.opts = src[i].obj.opts, o.ex = src[i].obj.ex; });
        }
        const newCats = [];
        await saveBank((bank) => {
          bank.cats = (Array.isArray(bank.cats) ? bank.cats : []).map(c => (typeof c === "string" ? { key: c } : c));
          bank.questions = rows.concat(bank.questions || []);
          rows.forEach((o) => {
            if (!bank.cats.some(c => c.key === o.cat)) {
              const lab = o.catLabel || o.cat;
              bank.cats.push({ key: o.cat, icon: "🧠", label: { gu: lab, hi: lab, en: lab }, mode: OEG.quiz.isExamCat(o.cat) ? "none" : "grade", subs: [] });
              newCats.push(o.cat);
            }
          });
          const addedSubs = [];
          newSubs.forEach((ns) => {
            const c = bank.cats.filter(x => x.key === (ns.cat || (rows[0] || {}).cat))[0];
            if (!c) return;
            if (!c.subs || !c.subs.some(x => x.key === ns.key)) {
              c.subs = (c.subs || []).concat([{ key: ns.key, icon: "🏷️", label: { gu: ns.label, hi: ns.label, en: ns.label } }]);
              if (!c.mode || c.mode === "none") c.mode = "sub";
              addedSubs.push(ns.cat + "/" + ns.key);
            }
          });
          return bank;
        }, rows.length + " " + OEG.t("admin.qImported") + (newCats.length ? " · 🏷️ " + newCats.join(", ") : "") + (addedSubs.length ? " · 🧩 " + addedSubs.join(", ") : ""));
        impRows = [];
        const f = $("qzFile"); if (f) f.value = "";
        renderQuiz(root); renderFlags(root); renderTax(root); renderSubs();
      } catch (e) { $("qzMsg").innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message)}</div>`; }
      if (btn) { btn.disabled = false; }
    }
    if ($("qzPreview")) $("qzPreview").onclick = async () => {
      const inp = $("qzFile"), box = $("qzImp");
      const file = inp && inp.files && inp.files[0];
      if (!file) { box.innerHTML = `<div class="alert alert-error">⚠️ .xlsx / .csv</div>`; return; }
      const btn = $("qzPreview"); btn.disabled = true; btn.textContent = "⏳";
      try {
        let rows;
        if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
          const X = await loadLib();
          const wb = X.read(await file.text(), { type: "string" });
          rows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false });
        } else {
          const X = await loadLib();
          const buf = new Uint8Array(await file.arrayBuffer());
          const wb = X.read(buf, { type: "array" });
          rows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false, defval: "" });
        }
        const parsed = parseRows(rows);
        impRows = parsed.rows;
        const needCat = impRows.filter(r => !r.err && !OEG.quiz.cats().some(c => c.key === r.obj.cat));
        needCat.forEach(r => { r.obj.catLabel = r.obj.cat; });
        paintImport();
        if (!parsed.cols.q) $("qzMsg").innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(OEG.t("admin.qCols"))}</div>`;
      } catch (e) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message || OEG.t("admin.qNeedLib"))}</div>`; }
      btn.disabled = false; btn.textContent = OEG.t("admin.qImport");
    };
    if ($("qzTpl")) $("qzTpl").onclick = async () => {
      const csv = "cat,sub,grade,subject,diff,પ્રશ્ન,વિકલ્પ A,વિકલ્પ B,વિકલ્પ C,વિકલ્પ D,સાચો,સમજૂતી\ngk,india,all,,easy,ભારતની રાજધાની કઈ?,દિલ્હી,મુંબઈ,ચંદીગઢ,પાટના,A,ભારતની રાજધાની નવી દિલ્હી છે\nmaths,,5,,medium,9 × 7 = ?,54,63,72,81,B,અંકગણિતનો પાટો\ntat,pedagogy,all,,hard,બાળકની પ્રથમ શિક્ષક કોણ?,શિક્ષક,માતા,પડોશી,મિત્ર,B,ઘરેલું શિક્ષણ — માતા પ્રથમ ગુરૂ";
      try { await navigator.clipboard.writeText(csv); OEG.toast(OEG.t("btn.copied")); } catch (e) { $("qzImp").innerHTML = `<div class="help-box"><code>${OEG.esc(csv)}</code></div>`; }
    };
    if ($("qzFile")) $("qzFile").onchange = () => { if ($("qzFile").files.length) paintImport(); };

    /* ✍️ સંપાદકમાં YouTube લિંક મૂકો એટલે thumb + title તરત દેખાય */
    function renderYtPrev() {
      const box = $("pYtPrev");
      if (!box) return;
      const u = ($("pYoutube") || {}).value || "";
      const f = ($("pFileUrl") || {}).value || "";
      const id = OEG.youtubeId(u.trim()) || OEG.youtubeId(f.trim());
      if (!id) { box.innerHTML = ""; return; }
      const title = ($("pTitleGu") || {}).value || "";
      box.innerHTML = `<div class="ytp"><img src="${OEG.esc(OEG.yt ? OEG.yt.thumb(id, "hqdefault") : "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg")}" alt="">
        <div><b>${OEG.esc(title || "YouTube")}</b><span><code>${OEG.esc(id)}</code> · ▶ ${OEG.esc(OEG.t("yt.playHere"))}</span></div></div>`;
    }
    ["pYoutube", "pFileUrl", "pTitleGu"].forEach((id) => {
      const el = $(id);
      if (el) { el.addEventListener("input", renderYtPrev); el.addEventListener("change", renderYtPrev); }
    });
    renderYtPrev();

    /* ---------- 🎬 YouTube — ફક્ત લિંક પરથી પોસ્ટ ---------- */
    let ytBusy = false;
    async function ytFetch(silent) {
      const url = $("ytUrl").value.trim();
      const id = OEG.yt.parse(url);
      const box = $("ytMsg"), prev = $("ytPrev");
      if (!id) { box.innerHTML = `<div class="alert alert-error">❌ youtube link?</div>`; return null; }
      const m = await OEG.yt.meta(url.indexOf("http") === 0 ? url : "https://www.youtube.com/watch?v=" + id);
      if (m.title) { $("ytTitle").value = m.title; if (!m.desc) m.desc = ""; }
      prev.innerHTML = `<div class="yt-prev"><img src="${OEG.esc(OEG.yt.thumb(id, "hqdefault"))}" alt=""><div><b>${OEG.esc(m.title || OEG.t("yt.noFetch"))}</b><span>🖼️ ${OEG.t("yt.thumb")} · ID <code>${id}</code></span><span class="badge">▶ ${OEG.t("yt.playHere")}</span></div></div>`;
      if (!silent) box.innerHTML = `<div class="alert ${m.title ? "alert-ok" : "alert-info"}">${m.title ? "✅ " + OEG.t("yt.fetched") : "⚠️ " + OEG.t("yt.noFetch")}</div>`;
      return { id, m };
    }
    $("ytFetchBtn").onclick = () => ytFetch(false);
    $("ytUrl").addEventListener("paste", () => setTimeout(() => ytFetch(true), 220));
    $("ytUrl").addEventListener("change", () => ytFetch(true));
    $("ytSave").onclick = async () => {
      if (!needGh()) return;
      const box = $("ytMsg");
      const url = $("ytUrl").value.trim();
      const id = OEG.yt.parse(url);
      if (!id) { box.innerHTML = `<div class="alert alert-error">❌ youtube link?</div>`; return; }
      const m = await OEG.yt.meta("https://www.youtube.com/watch?v=" + id);
      const title = $("ytTitle").value.trim() || m.title || "YouTube video";
      const btn = $("ytSave");
      btn.disabled = true;
      try {
        const t3 = await fillLangs({ [($("ytSrc").value || "gu")]: title }, true);
        const cur = await OEG.gh.getFile("data/catalog.json");
        const catalog = JSON.parse(cur.content);
        catalog.items = catalog.items || [];
        catalog.items.unshift({
          id: "item-" + Date.now(), type: "video",
          grade: ($("ytGrade") || {}).value || "all", subject: ($("ytSubject") || {}).value || "all",
          aud: (cscVal("yt").aud) || "all", audSub: cscVal("yt").audSub || "", audSub2: cscVal("yt").audSub2 || "",
          title: t3, desc: t3, body: "", image: OEG.yt.thumb(id, "maxresdefault"),
          fileUrl: "https://www.youtube.com/watch?v=" + id, fileType: "video", ytId: id,
          channel: m.author || "",
          date: new Date().toISOString().slice(0, 10), tags: []
        });
        catalog.updated = new Date().toISOString().slice(0, 10);
        await OEG.gh.saveCatalog(catalog, "Add video: " + title.slice(0, 40));
        await OEG.loadCatalog();
        box.innerHTML = `<div class="alert alert-ok">✅ ${OEG.t("admin.saved")} · <a href="#/view/${catalog.items[0].id}">${OEG.t("btn.view")}</a></div>`;
        $("ytUrl").value = ""; $("ytTitle").value = ""; $("ytPrev").innerHTML = "";
      } catch (e) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message)}</div>`; }
      btn.disabled = false;
    };

    /* ---------- 🗂️ Items — edit / delete ---------- */
    let editId = "";
    async function writeCatalog(items, message) {
      if (!needGh()) return;
      const cur = await OEG.gh.getFile("data/catalog.json");
      const catalog = JSON.parse(cur.content);
      catalog.items = items;
      catalog.updated = new Date().toISOString().slice(0, 10);
      await OEG.gh.saveCatalog(catalog, message);
      await OEG.loadCatalog();
      dirty();
      renderItems(root); renderTax(root);
    }
    async function renderItems(r) {
      const box = r.querySelector("#itList");
      if (!box) return;
      const q = (r.querySelector("#itSearch").value || "").toLowerCase().trim();
      const fType = r.querySelector("#itType").value;
      let items = (OEG.state.catalogAll || OEG.state.catalog).slice();
      items = fType === "hidden" ? items.filter(i => i.hidden) : items.filter(i => !i.hidden && (fType === "all" || i.type === fType));
      if (q) items = items.filter(i => (OEG.title(i) + " " + OEG.desc(i) + " " + (i.id || "")).toLowerCase().includes(q));
      box.innerHTML = items.length ? items.slice(0, 40).map((i) => {
        const th = OEG.thumbnail(i);
        const isYt = !!OEG.youtubeId(i.fileUrl || "") || i.fileType === "video" || i.type === "video";
        return `
        <div class="file-item${i.id === editId ? " editing" : ""}">
          ${th ? `<img class="it-thumb" src="${OEG.esc(th)}" alt="" loading="lazy">` : `<span>${OEG.typeIcon(i.type)}</span>`}
          <code title="${OEG.esc(i.id)}">${OEG.esc(String(OEG.title(i) || i.id).slice(0, 54))}</code>
          ${isYt ? `<span class="badge">▶ ${OEG.t("yt.playHere")}</span>` : ""}
          <span class="badge">${OEG.esc(OEG.typeLabel(i.type))}</span>
          <span class="badge">🎯 ${OEG.esc(OEG.audLabel(i.aud))}</span>
          <span class="badge">${OEG.esc(OEG.gradeLabel(i.grade))}</span>${i.hidden ? `<span class="badge">🙈 ${OEG.t("admin.hidden")}</span>` : ""}
          <a class="btn btn-outline btn-sm" href="#/view/${i.id}" target="_blank" rel="noopener">${OEG.t("btn.view")}</a>
          <button class="btn btn-outline btn-sm" data-edit="${OEG.esc(i.id)}">✏️ ${OEG.t("admin.edit")}</button>
          <button class="btn btn-outline btn-sm" data-hide="${OEG.esc(i.id)}">${i.hidden ? "👁️ " + OEG.t("admin.unhide") : "🙈 " + OEG.t("admin.hide")}</button>
          <button class="btn btn-danger btn-sm" data-del-item="${OEG.esc(i.id)}">🗑 ${OEG.t("admin.delete")}</button></div>`;
      }).join("")
        + (items.length > 40 ? `<p style="color:var(--muted);font-size:.84rem">+${items.length - 40}…</p>` : "")
        : `<p style="color:var(--muted)">${OEG.t("empty.title")}</p>`;
      box.querySelectorAll("[data-del-item]").forEach(b => b.onclick = async () => {
        const it = OEG.byId(b.dataset.delItem);
        if (!it) return;
        if (!confirm(OEG.t("admin.delConfirm") + "\n" + OEG.title(it))) return;
        b.textContent = "⏳";
        try {
          await writeCatalog((OEG.state.catalogAll || OEG.state.catalog).filter(x => x.id !== it.id).map(x => x), "Delete item: " + String(OEG.title(it)).slice(0, 40));
          OEG.toast("🗑 " + OEG.t("admin.deleted"));
        } catch (e) { OEG.toast(OEG.t("admin.delFail") + ": " + e.message); b.textContent = "🗑 " + OEG.t("admin.delete"); }
      });
      box.querySelectorAll("[data-hide]").forEach(b => b.onclick = async () => {
        const it = OEG.byId(b.dataset.hide);
        if (!it) return;
        const items = (OEG.state.catalogAll || OEG.state.catalog).map(x => x.id === it.id ? Object.assign({}, x, { hidden: !x.hidden }) : x);
        b.textContent = "⏳";
        try { await writeCatalog(items, (it.hidden ? "Publish: " : "Hide: ") + String(OEG.title(it)).slice(0, 40)); OEG.toast(it.hidden ? "👁️" : "🙈"); }
        catch (e) { OEG.toast(e.message); b.textContent = "🙈"; }
      });
      /* ✏️ સુધારો: પહેલાં ✍️ ટૅબ ખોલો (પાનાં છુપા હોય ત્યારે ભરાયેલું ફોર્મ દેખાતું નથી), પછી ભરો */
      box.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
        const it = OEG.byId(b.dataset.edit);
        if (!it) { OEG.toast("❓ " + OEG.t("admin.error")); return; }
        editId = it.id;
        admTab = "material";
        try { localStorage.setItem("oeg-adm-tab", admTab); } catch (e) {}
        applyTabs();
        const set = (id, val) => { const el = $(id); if (el) el.value = val; };
        const tt = it.title || {};
        set("pTitleGu", (typeof tt === "string" ? tt : tt.gu) || "");
        set("pTitleHi", (tt && tt.hi) || "");
        set("pTitleEn", (tt && tt.en) || "");
        set("pDesc", (typeof it.desc === "string" ? it.desc : (it.desc || {}).gu) || "");
        set("pBody", (typeof it.body === "string" ? it.body : (it.body || {}).gu) || "");
        set("pImage", it.image || "");
        set("pYoutube", OEG.youtubeId(it.fileUrl) ? it.fileUrl : "");
        set("pFileUrl", OEG.youtubeId(it.fileUrl) ? "" : (it.fileUrl || ""));
        set("pDate", it.date || "");
        set("pTags", (it.tags || []).join(", "));
        const hd = $("pHidden"); if (hd) hd.checked = !!it.hidden;
        cscSet("p", { aud: it.aud || OEG.typeAud(it.type) || "all", type: it.type || "post", grade: it.grade || "all", subject: it.subject || "all", audSub: it.audSub || "", audSub2: it.audSub2 || "" });
        const sv = $("pSave");
        if (sv) { sv.textContent = "💾 " + OEG.t("admin.update"); sv.scrollIntoView({ behavior: "smooth", block: "center" }); }
        const pm = $("pMsg");
        if (pm) pm.innerHTML = `<div class="alert alert-info">✏️ ${OEG.esc(OEG.title(it))}</div>`;
      });
    }


    OEG.auth.getAdminFile().then(a => {
      const el = $("accNow");
      if (el) el.textContent = a.email ? "📧 " + a.email + " · " + (a.updated || "") : OEG.t("admin.notConfigured");
    }).catch(() => {});
    $("accSave").onclick = async () => {
      if (!needGh()) return;
      try {
        await OEG.auth.setAdminAccount({ email: $("accEmail").value.trim(), password: $("accPass").value });
        msg("accMsg", "✅ " + OEG.t("admin.saved"), true);
        $("accPass").value = "";
        OEG.auth.getAdminFile().then(a => { const el = $("accNow"); if (el && a.email) el.textContent = "📧 " + a.email; });
      } catch (e) { msg("accMsg", OEG.t("admin.error") + " " + e.message, false); }
    };

    /* ---- 👥 Users (GitHub users.json) ---- */
    /* વિષયની યાદી હંમેશા ટેક્સનોમીના ૭ વિષય જ */
    function userSubjectOpts(cur) {
      const subs = (OEG.auth.SUBJECTS7 ? OEG.auth.SUBJECTS7() : (OEG.tax().gradeSubjects || []));
      return `<option value="all">${OEG.t("quiz.allSubjects")}</option>` + subs.map(x =>
        `<option value="${OEG.esc(x.key)}" ${x.key === cur ? "selected" : ""}>${x.icon || "📘"} ${OEG.esc(OEG.subjectLabel(x.key))}</option>`).join("");
    }
    function userGradeOpts(cur) {
      const gs = (OEG.tax().grades || []).filter(g => g.key === "balvatika" || /^\d+$/.test(g.key));
      return `<option value="all">${OEG.t("quiz.allGrades")}</option>` + gs.map(g =>
        `<option value="${OEG.esc(g.key)}" ${g.key === cur ? "selected" : ""}>${OEG.esc(OEG.gradeLabel(g.key))}</option>`).join("");
    }
    $("uAdd").onclick = async () => {
      if (!needGh()) return;
      const email = $("uEmail").value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg("uMsg", "❌ " + OEG.t("auth.email"), false); return; }
      if (($("uPass").value || "").length < 6) { msg("uMsg", "❌ " + OEG.t("auth.password"), false); return; }
      try {
        const uHide = ($("uGradeRow") || {}).style && $("uGradeRow").style.display === "none";
        await OEG.auth.addUser({
          name: $("uName").value.trim() || email.split("@")[0], email, password: $("uPass").value, role: $("uRole").value,
          grade: uHide ? "all" : ($("uGrade") || {}).value || "all",
          subject: uHide ? "all" : ($("uSubject") || {}).value || "all",
          phone: ($("uPhone") || {}).value || "", verified: ""
        });
        msg("uMsg", "✅ " + OEG.t("admin.saved"), true);
        ["uName", "uEmail", "uPass", "uPhone"].forEach(id => { const el = $(id); if (el) el.value = ""; });
        loadAccounts(); await loadRegs();
      } catch (e) { msg("uMsg", OEG.t("admin.error") + " " + e.message, false); }
    };
    $("uRefresh").onclick = () => { loadAccounts(); loadRegs(); };

    /* ---------- 👥 ખાતાં + 📋 રજિસ્ટ્રેશન યાદી (નામ · મોબાઈલ · ઈમેઈલ · block/unblock) ---------- */
    const accSt = { users: [], regs: [], blocks: {}, doc: { users: [], blockedEmails: [] } };
    const escV = (v) => OEG.esc(v == null ? "" : String(v));
    const phoneFmt = (p2) => {
      const d = String(p2 || "").replace(/\D/g, "");
      if (d.length !== 10) return d || "";
      const cc = (OEG.verify ? OEG.verify.cfg().phoneCountry : "91") || "91";
      return "+" + cc + " " + d.slice(0, 5) + " " + d.slice(5);
    };
    const isBlocked = (email) => {
      const em = String(email || "").toLowerCase();
      const u = (accSt.users || []).find((x) => String(x.email || "").toLowerCase() === em);
      const b = (accSt.doc.blockedEmails || []).find((x) => String((x && x.email) || x || "").toLowerCase() === em);
      const st = accSt.blocks[em];
      return (u && u.blocked) ? String(u.blocked === true ? "" : u.blocked) : (b && (b.reason || " ")) || (st ? st.reason || " " : "");
    };
    const roleLab = (r) => { const k = "auth." + (r || "student"); const v = OEG.t(k); return v && v !== k ? v : (r || ""); };
    const accMatch = (x, q) => !q || [x.name, x.email, x.phone, x.role].join(" ").toLowerCase().indexOf(q) >= 0;
    function accHead() {
      return `<thead><tr><th>${OEG.t("admin.tblName")}</th><th>${OEG.t("admin.tblPhone")}</th><th>${OEG.t("admin.tblEmail")}</th>
        <th>${OEG.t("admin.tblRole")}</th><th>${OEG.t("admin.tblAt")}</th><th>${OEG.t("admin.tblState")}</th><th style="text-align:right">${OEG.t("admin.tblAct")}</th></tr></thead>`;
    }
    function stateBadges(x, blocked) {
      const out = [];
      if (blocked) out.push(`<span class="badge badge-blk">🚫 ${OEG.t("admin.block")}</span>`);
      else if (x.verified) out.push(`<span class="badge badge-ok">✅ ${OEG.t("admin.verified")}</span>`);
      else out.push(`<span class="badge badge-no">⏳ ${OEG.t("admin.unverified")}</span>`);
      if (x.device) out.push(`<span class="badge badge-dev">💻 ${OEG.t("admin.device")}</span>`);
      if (x.inUsers) out.push(`<span class="badge">👤</span>`);
      return out.join(" ");
    }
    function accRow(x, kind) {
      const blocked = !!x.blockedReason;
      return `<tr class="${blocked ? "blk" : ""}">
        <td><b>${escV(x.name || "—")}</b></td>
        <td>${x.phone ? `<a href="https://wa.me/${escV(x.dial || "")}" target="_blank" rel="noopener">${escV(phoneFmt(x.phone))}</a>` : "<span style='color:var(--muted)'>—</span>"}</td>
        <td><code>${escV(x.email)}</code></td>
        <td>${escV(roleLab(x.role))}</td>
        <td>${escV(x.at || x.created || "")}</td>
        <td>${stateBadges(x, blocked)}</td>
        <td><div class="acc-act">
          <button class="btn btn-outline btn-sm" data-wa1="${escV(x.email)}" title="${OEG.t("admin.waOpen")}">🟢</button>
          ${blocked ? `<button class="btn btn-outline btn-sm" data-unb="${escV(x.email)}" data-k="${kind}">${OEG.t("admin.unblock")}</button>`
                    : `<button class="btn btn-outline btn-sm" data-blk="${escV(x.email)}" data-k="${kind}">${OEG.t("admin.block")}</button>`}
          ${kind === "user" ? `<button class="btn btn-outline btn-sm" data-rp="${escV(x.email)}">🔑</button>
             <button class="btn btn-danger btn-sm" data-ru="${escV(x.email)}">${OEG.t("btn.delete")}</button>`
             : (x.inUsers ? "" : `<button class="btn btn-brand btn-sm" data-regu="${escV(x.email)}">${OEG.t("admin.regToUser")}</button>`)}
        </div></td></tr>`;
    }
    function bindAccRows(list) {
      list.querySelectorAll("[data-blk],[data-unb]").forEach((b) => {
        b.onclick = async () => {
          const on = b.hasAttribute("data-blk");
          const email = (on ? b.dataset.blk : b.dataset.unb);
          let reason = "";
          if (on) { try { reason = prompt(OEG.t("admin.blockWhy"), "") || ""; } catch (e) { reason = ""; } }
          try {
            await OEG.auth.setBlocked(email, on, reason);
            msg("uMsg", (on ? "🚫 " : "✅ ") + OEG.t(on ? "admin.blockDone" : "admin.unblockDone"), true);
            await loadAccounts(); await loadRegs();
          } catch (e) { msg("uMsg", OEG.t("admin.error") + " " + e.message, false); }
        };
      });
      list.querySelectorAll("[data-rp]").forEach((b) => {
        b.onclick = async () => {
          const p2 = prompt(OEG.t("auth.password") + " — " + b.dataset.rp);
          if (!p2 || p2.length < 6) return;
          try { await OEG.auth.resetPassword(b.dataset.rp, p2); msg("uMsg", "✅ " + OEG.t("admin.saved"), true); } catch (e) { msg("uMsg", OEG.t("admin.error") + " " + e.message, false); }
        };
      });
      list.querySelectorAll("[data-ru]").forEach((b) => {
        b.onclick = async () => {
          if (!needGh()) return;
          if (OEG.state.user && OEG.state.user.email === b.dataset.ru) { OEG.toast("⛔"); return; }
          if (!confirm(b.dataset.ru)) return;
          try { await OEG.auth.removeUser(b.dataset.ru); await loadAccounts(); } catch (e) { OEG.toast(e.message); }
        };
      });
      list.querySelectorAll("[data-wa1]").forEach((b) => {
        b.onclick = () => {
          const em = b.dataset.wa1, u = (accSt.users || []).concat(accSt.regs || []).find((x) => String(x.email).toLowerCase() === em.toLowerCase());
          const txt = "📩 " + OEG.siteName() + " — " + (u && u.name ? u.name : "") + "\n" + (u && u.email ? u.email : "") + (u && u.phone ? "\n📱 +" + String(u.phone) : "");
          window.open(OEG.notify.waLink(txt, ""), "_blank", "noopener");
        };
      });
      list.querySelectorAll("[data-regu]").forEach((b) => {
        b.onclick = async () => {
          if (!needGh()) return;
          const em = b.dataset.regu.toLowerCase();
          const rec = (accSt.regs || []).find((x) => String(x.email).toLowerCase() === em);
          let pass = ($("regPass") || {}).value || "";
          if (pass.length < 6) { try { pass = prompt(OEG.t("auth.password") + " (≥6)", "") || ""; } catch (e) { pass = ""; } }
          if (pass.length < 6) { msg("regMsg", "❌ " + OEG.t("auth.password"), false); return; }
          try {
            await OEG.auth.addRegAsUser(rec, pass);
            msg("regMsg", "✅ " + OEG.t("admin.saved") + " · " + escV(em), true);
            await loadAccounts(); await loadRegs();
          } catch (e) { msg("regMsg", OEG.t("admin.error") + " " + e.message, false); }
        };
      });
    }
    async function loadAccounts() {
      const doc = await OEG.auth.fetchUsers();
      accSt.doc = doc; accSt.users = doc.users || [];
      try { accSt.blocks = await OEG.auth.blockList(); } catch (e) { accSt.blocks = {}; }
      paintAcc();
    }
    function paintAcc() {
      const list = $("uTable"); if (!list) return;
      const q = (($("accQ") || {}).value || "").trim().toLowerCase();
      const rows = accSt.users.map((u) => {
        const d = String(u.phone || "").replace(/\D/g, "");
        return Object.assign({}, u, {
          at: u.created || "", phone: d, dial: "91" + d.slice(-10),
          blockedReason: isBlocked(u.email), inUsers: 1
        });
      }).filter((x) => accMatch(x, q));
      const nblk = rows.filter((x) => x.blockedReason).length;
      const sum = $("accSum");
      if (sum) sum.innerHTML = `<span>👥 ${rows.length}</span><span>🚫 ${nblk}</span><span>✅ ${rows.filter((x) => x.verified && !x.blockedReason).length} ${OEG.t("admin.verified")}</span>`;
      list.innerHTML = accHead() + "<tbody>" + (rows.length ? rows.map((x) => accRow(x, "user")).join("")
        : `<tr><td colspan="7" style="color:var(--muted);padding:14px">${OEG.t("empty.title")}</td></tr>`) + "</tbody>";
      bindAccRows(list);
    }
    async function loadRegs() {
      const r = await OEG.auth.fetchRegs();
      accSt.regs = r.all || [];
      paintRegs();
    }
    function paintRegs() {
      const list = $("regTable"); if (!list) return;
      const q = (($("accQ") || {}).value || "").trim().toLowerCase();
      const emails = {};
      (accSt.users || []).forEach((u) => { emails[String(u.email).toLowerCase()] = 1; });
      const rows = accSt.regs.map((x) => {
        const d = String(x.phone || "").replace(/\D/g, "");
        const em = String(x.email || "").toLowerCase();
        return Object.assign({}, x, {
          phone: d, dial: "91" + d.slice(-10), inUsers: emails[em] ? 1 : 0,
          blockedReason: isBlocked(em), device: x.device ? 1 : 0
        });
      }).filter((x) => accMatch(x, q));
      const dev = rows.filter((x) => x.device).length;
      const sum = $("regSum");
      if (sum) sum.innerHTML = `<span>📋 ${rows.length} ${OEG.t("admin.regCount")}</span><span>💻 ${dev}</span>`
        + `<span>✅ ${rows.filter((x) => x.verified).length} ${OEG.t("admin.verified")}</span>`
        + `<span>🚫 ${rows.filter((x) => x.blockedReason).length}</span>`;
      list.innerHTML = accHead() + "<tbody>" + (rows.length ? rows.map((x) => accRow(x, "reg")).join("")
        : `<tr><td colspan="7" style="color:var(--muted);padding:14px">${OEG.t("admin.regEmpty")}</td></tr>`) + "</tbody>";
      bindAccRows(list);
    }
    if ($("accQ")) $("accQ").oninput = () => { paintAcc(); paintRegs(); };
    if ($("regRefresh")) $("regRefresh").onclick = async () => { await loadRegs(); msg("regMsg", "🔄 " + OEG.t("admin.saved"), true); };
    if ($("regSave")) $("regSave").onclick = async () => {
      if (!needGh()) return;
      const items = accSt.regs.filter((x) => !x.device).concat(accSt.regs.filter((x) => x.device))
        .map((x) => ({ name: x.name || "", email: x.email, phone: x.phone || "", role: x.role || "student", grade: x.grade || "all", subject: x.subject || "all", at: x.at || "", verified: x.verified || "" }));
      try {
        await OEG.auth.saveRegs(items);
        msg("regMsg", "✅ " + OEG.t("admin.saved") + " · " + items.length + " " + OEG.t("admin.regCount"), true);
        await loadRegs();
      } catch (e) { msg("regMsg", OEG.t("admin.error") + " " + e.message, false); }
    };
    if ($("regSheet")) $("regSheet").onclick = async () => {
      try {
        const remote = await OEG.auth.fetchRegsRemote();
        if (!remote.length) { msg("regMsg", "ℹ️ " + OEG.t("admin.regEmpty"), false); return; }
        accSt.regs = remote.concat(accSt.regs.filter((x) => !remote.some((y) => String(y.email).toLowerCase() === String(x.email).toLowerCase())));
        paintRegs();
        msg("regMsg", "✅ " + remote.length + " " + OEG.t("admin.regCount"), true);
      } catch (e) { msg("regMsg", OEG.t("admin.error") + " " + e.message, false); }
    };
    if ($("regAll")) $("regAll").onclick = async () => {
      if (!needGh()) return;
      let pass = ($("regPass") || {}).value || "";
      if (pass.length < 6) { try { pass = prompt(OEG.t("auth.password") + " (≥6)", "") || ""; } catch (e) { pass = ""; } }
      if (pass.length < 6) { msg("regMsg", "❌ " + OEG.t("auth.password"), false); return; }
      const emails = {};
      (accSt.users || []).forEach((u) => { emails[String(u.email).toLowerCase()] = 1; });
      const todo = accSt.regs.filter((x) => x.email && !emails[String(x.email).toLowerCase()]);
      let done = 0, bad = "";
      for (const rec of todo) {
        try { await OEG.auth.addRegAsUser(rec, pass); done++; } catch (e) { bad = e.message; }
      }
      msg("regMsg", (done ? "✅ " + done + " · " : "") + (bad ? "⚠️ " + bad : OEG.t("admin.saved")), !bad);
      await loadAccounts(); await loadRegs();
    };
    if ($("accCsv")) $("accCsv").onclick = () => {
      const rows = [["name", "mobile", "email", "role", "date", "state"]];
      accSt.regs.forEach((x) => rows.push([x.name || "", "+" + String(x.phone || "").replace(/\D/g, ""), x.email || "", x.role || "", x.at || "", x.verified ? "verified" : "unverified"]));
      accSt.users.forEach((x) => { if (!accSt.regs.some((r2) => String(r2.email).toLowerCase() === String(x.email).toLowerCase())) rows.push([x.name || "", "+" + String(x.phone || "").replace(/\D/g, ""), x.email || "", x.role || "", x.created || "", x.blocked ? "blocked" : "active"]); });
      const csv = rows.map((r2) => r2.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(",")).join("\n");
      try {
        const a2 = document.createElement("a");
        a2.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
        a2.download = "oeg-registrations.csv";
        document.body.appendChild(a2); a2.click(); a2.remove();
        msg("regMsg", "📋 CSV", true);
      } catch (e) { OEG.toast(e.message); }
    };
    loadAccounts(); loadRegs();

    /* ---------- 🔐 રજિસ્ટ્રેશન નાં નિયમ (data/site-config.json → auth) ---------- */
    (function rules() {
      const ac = Object.assign({ emailDomains: "gmail.com", requirePhone: true, checkPatterns: true, googleClientId: "", requireGoogle: false, otpEndpoint: "", webhook: "", webhookList: "" }, (OEG.state.config || {}).auth || {});
      $("arDom").value = ac.emailDomains || "";
      $("arGid").value = ac.googleClientId || "";
      $("arOtp").value = ac.otpEndpoint || "";
      $("arHook").value = ac.webhook || "";
      $("arHookList").value = ac.webhookList || "";
      $("arPhoneReq").checked = ac.requirePhone !== false;
      $("arPattern").checked = ac.checkPatterns !== false;
      $("arGReq").checked = !!ac.requireGoogle;
      $("arSave").onclick = async () => {
        if (!needGh()) return;
        try {
          await patchConfig((c) => {
            c.auth = {
              emailDomains: $("arDom").value.trim() || "gmail.com",
              requirePhone: $("arPhoneReq").checked,
              checkPatterns: $("arPattern").checked,
              phoneCountry: "91", phoneLen: 10,
              googleClientId: $("arGid").value.trim(),
              requireGoogle: $("arGReq").checked,
              otpEndpoint: $("arOtp").value.trim(),
              webhook: $("arHook").value.trim(),
              webhookList: $("arHookList").value.trim()
            };
          }, "OEG: registration rules");
          dirty();
          msg("arMsg", "✅ " + OEG.t("admin.saved"), true);
        } catch (e) { msg("arMsg", OEG.t("admin.error") + " " + e.message, false); }
      };
    })();

    async function loadFiles() {
      const list = $("fmList");
      if (!OEG.gh.connected()) { list.innerHTML = `<p style="color:var(--muted)">${OEG.t("admin.notConnected")}</p>`; return; }
      list.innerHTML = `<p style="color:var(--muted)">${OEG.t("admin.uploading")}</p>`;
      try {
        const files = await OEG.gh.listFiles("uploads");
        list.innerHTML = files.length ? files.map(f => `
          <div class="file-item"><span>📄</span><code>${OEG.esc(f.path)}</code>
          <a class="btn btn-outline btn-sm" href="${OEG.gh.pagesUrl(f.path)}" target="_blank" rel="noopener">${OEG.t("btn.view")}</a>
          <button class="btn btn-danger btn-sm" data-del="${OEG.esc(f.path)}">${OEG.t("btn.delete")}</button></div>`).join("")
          : `<p style="color:var(--muted)">${OEG.t("empty.title")}</p>`;
        list.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
          if (!confirm(b.dataset.del)) return;
          try { await OEG.gh.deleteFile(b.dataset.del); loadFiles(); } catch (e) { OEG.toast(e.message); }
        });
      } catch (e) { list.innerHTML = `<p style="color:#dc2626">${OEG.esc(e.message)}</p>`; }
    }
    $("fmRefresh").onclick = loadFiles;
    loadFiles();

    /* ---------- 🏷️ Taxonomy lists ---------- */
    const MODES = [["grade", "🎓 " + OEG.t("admin.modeGrade")], ["sub", "🧩 " + OEG.t("admin.modeSub")], ["none", "🚫 " + OEG.t("admin.modeNone")]];
    function renderSubs() {
      const box = $("taxSubs");
      if (!box) return;
      const cats = OEG.quiz.cats();
      box.innerHTML = cats.map((c) => {
        const mode = c.mode || "none";
        const subs = OEG.quiz.subsOf(c.key);
        const nCh = subs.reduce((a2, x) => a2 + OEG.quiz.chapsOf(c.key, x.key).length, 0);
        return `<div class="sub-cat" data-catkey="${OEG.esc(c.key)}">
          <div class="sub-cat-head">
            <b>${c.icon || "🧠"} ${OEG.esc(OEG.taxLabel(c, "subject"))}</b>
            <code>${OEG.esc(c.key)}</code>
            <span class="badge">📚 ${subs.length} · 📗 ${nCh}</span>
            <select data-cmode="${OEG.esc(c.key)}">${MODES.map(m => `<option value="${m[0]}" ${mode === m[0] ? "selected" : ""}>${m[1]}</option>`).join("")}</select>
            <button type="button" class="btn btn-danger btn-sm" data-catdel="${OEG.esc(c.key)}">🗑 ${OEG.t("admin.delCat")}</button>
          </div>
          <div class="sub-list">${subs.length ? subs.map(x => subNode(c.key, x, mode)).join("") : `<span class="sub-none">${OEG.t("admin.noSubsYet")}</span>`}</div>
          <div class="sub-add">
            <input data-sublabel="${OEG.esc(c.key)}" placeholder="${OEG.t("admin.newLabel")}" maxlength="40">
            <input data-subicon="${OEG.esc(c.key)}" placeholder="🏷️" maxlength="4">
            <button type="button" class="btn btn-brand btn-sm" data-subadd="${OEG.esc(c.key)}">➕ ${OEG.t("admin.addSub")}</button>
          </div>
        </div>`;
      }).join("");
      Array.prototype.forEach.call(box.querySelectorAll("[data-cmode]"), (sel) => {
        sel.onchange = () => { window.OEG_admin_cat_mode(sel.dataset.cmode, sel.value); };
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-subadd]"), (b2) => {
        b2.onclick = () => {
          const at = (nm) => box.querySelector('[data-' + nm + '="' + b2.dataset.subadd + '"]');
          const label = ((at("sublabel") || {}).value || "").trim();
          const icon = ((at("subicon") || {}).value || "").trim();
          window.OEG_admin_sub_add(b2.dataset.subadd, "", label, icon);
        };
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-submv]"), (b2) => {
        b2.onclick = () => { const p = b2.dataset.submv.split(":"); window.OEG_admin_sub_move(p[0], p[1], Number(p[2])); };
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-chapmv]"), (b2) => {
        b2.onclick = () => { const p = b2.dataset.chapmv.split(":"); window.OEG_admin_chap_move(p[0], p[1], p[2], Number(p[3])); };
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-subdel]"), (b2) => {
        b2.onclick = () => { const p = b2.dataset.subdel.split(":"); window.OEG_admin_sub_del(p[0], p.slice(1).join(":")); };
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-chapnew]"), (b2) => {
        b2.onclick = () => {
          const f = b2.closest(".sub-node") && b2.closest(".sub-node").querySelector(".kid-add");
          if (!f) return;
          delete f.dataset.edit;
          f.classList.toggle("on");
          f.classList.remove("is-edit");
          const g = f.querySelector(".ka-go"); if (g) g.innerHTML = "➕ " + OEG.t("admin.addChap");
          const i = f.querySelector(".ka-num"); if (i) i.focus();
        };
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-chapedit]"), (b2) => {
        b2.onclick = () => {
          const node = b2.closest(".sub-node"), f = node && node.querySelector(".kid-add");
          if (!f) return;
          const p = b2.dataset.chapedit.split(":");
          const ch = OEG.quiz.chapOf(p[0], p[1], p[2]);
          f.classList.add("on", "is-edit");
          f.dataset.edit = p[2];
          f.querySelector(".ka-num").value = (ch && ch.num) || String(p[2]).replace(/^ch/, "");
          f.querySelector(".ka-lab").value = OEG.langField((ch && ch.label) || {}) || "";
          const gs = f.querySelector(".ka-gr"); if (gs) gs.value = (ch && ch.grade) || "all";
          f.querySelector(".ka-go").innerHTML = "💾 " + OEG.t("btn.save");
          f.querySelector(".ka-num").focus();
        };
      });
      Array.prototype.forEach.call(box.querySelectorAll(".ka-cancel"), (b2) => {
        b2.onclick = () => { const f = b2.closest(".kid-add"); if (f) { f.classList.remove("on", "is-edit"); delete f.dataset.edit; } };
      });
      Array.prototype.forEach.call(box.querySelectorAll(".ka-go"), (b2) => {
        b2.onclick = () => {
          const f = b2.closest(".kid-add");
          const p = String(f.dataset.kidform || "").split(":");
          const cat = p[0], sub = p.slice(1).join(":");
          const num = (f.querySelector(".ka-num").value || "").trim();
          const lab = (f.querySelector(".ka-lab").value || "").trim();
          const gr = ((f.querySelector(".ka-gr") || {}).value || "all").trim();
          if (f.dataset.edit) window.OEG_admin_chap_edit(cat, sub, f.dataset.edit, num, lab, gr);
          else window.OEG_admin_chap_add(cat, sub, num, lab, gr);
        };
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-chapdel]"), (b2) => {
        b2.onclick = () => { const p = b2.dataset.chapdel.split(":"); window.OEG_admin_chap_del(p[0], p[1], p.slice(2).join(":")); };
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-catdel]"), (b2) => {
        b2.onclick = () => window.OEG_admin_cat_del(b2.dataset.catdel);
      });
    }
    /* બીજું સ્તર (વિષય / સબ-કેટેગરી) + એની અંદર ત્રીજું સ્તર (ચેપ્ટર નંબર + નામ) */
    function subNode(catKey, x, mode) {
      const chaps = OEG.quiz.chapsOf(catKey, x.key);
      const cnt = mode === "grade" ? OEG.quiz.countIn(catKey, "all", x.key, "all", "all") : OEG.quiz.subCount(catKey, x.key);
      return `<div class="sub-node">
        <div class="sub-node-head">
          <span class="sn-ic">${x.icon || "🏷️"}</span><b>${OEG.esc(OEG.quiz.subLabel(catKey, x.key))}</b><code>${OEG.esc(x.key)}</code>
          <span class="badge">${cnt} ${OEG.t("admin.qCount")}</span>
          <button type="button" class="btn btn-outline btn-sm" data-submv="${OEG.esc(catKey)}:${OEG.esc(x.key)}:-1" title="⬆">⬆</button>
          <button type="button" class="btn btn-outline btn-sm" data-submv="${OEG.esc(catKey)}:${OEG.esc(x.key)}:1" title="⬇">⬇</button>
          <button type="button" class="btn btn-outline btn-sm" data-chapnew="${OEG.esc(catKey)}:${OEG.esc(x.key)}">📗 ${OEG.t("admin.addChap")}</button>
          <button type="button" class="btn btn-danger btn-sm sub-x" data-subdel="${OEG.esc(catKey)}:${OEG.esc(x.key)}" title="${OEG.t("admin.removeSub")}">🗑</button>
        </div>
        <div class="sub-kids">${chaps.length ? chaps.map((ch) => `<div class="kid-row">
            <span class="kid-num">📗 ${OEG.esc(ch.num ? OEG.quiz.guNum(ch.num) : "•")}</span>
            <b>${OEG.esc(OEG.taxLabel(ch, "subject"))}</b><code>${OEG.esc(ch.key)}</code>${ch.grade ? `<span class="badge">🎓 ${OEG.esc(OEG.gradeLabel(ch.grade))}</span>` : ""}
            <span class="badge">${OEG.quiz.chapCount(catKey, x.key, ch.key, "all")}</span>
            <button type="button" class="btn btn-outline btn-sm" data-chapmv="${OEG.esc(catKey)}:${OEG.esc(x.key)}:${OEG.esc(ch.key)}:-1" title="⬆">⬆</button>
            <button type="button" class="btn btn-outline btn-sm" data-chapmv="${OEG.esc(catKey)}:${OEG.esc(x.key)}:${OEG.esc(ch.key)}:1" title="⬇">⬇</button>
            <button type="button" class="btn btn-outline btn-sm" data-chapedit="${OEG.esc(catKey)}:${OEG.esc(x.key)}:${OEG.esc(ch.key)}" title="${OEG.t("admin.edit")}">✏️</button>
            <button type="button" class="btn btn-danger btn-sm sub-x" data-chapdel="${OEG.esc(catKey)}:${OEG.esc(x.key)}:${OEG.esc(ch.key)}" title="${OEG.t("admin.delete")}">🗑</button>
          </div>`).join("") : `<span class="sub-none">${OEG.t("quiz.noChaps")}</span>`}</div>
        <div class="kid-add" data-kidform="${OEG.esc(catKey)}:${OEG.esc(x.key)}">
          <input class="ka-num" placeholder="${OEG.t("admin.chapNum")}" maxlength="6" inputmode="numeric">
          <input class="ka-lab" placeholder="${OEG.t("admin.chapName")}" maxlength="60">
          <select class="ka-gr"><option value="all">${OEG.t("quiz.allGrades")}</option>${OEG.tax().grades.filter(g => g.key === "balvatika" || /^\d+$/.test(g.key)).map(g => `<option value="${OEG.esc(g.key)}">${OEG.esc(OEG.gradeLabel(g.key))}</option>`).join("")}</select>
          <button type="button" class="btn btn-brand btn-sm ka-go">➕ ${OEG.t("admin.addChap")}</button>
          <button type="button" class="btn btn-outline btn-sm ka-cancel">${OEG.t("btn.cancel")}</button>
        </div>
      </div>`;
    }
    window.OEG_admin_cat_mode = (key, mode) => taxGo(() => OEG.quiz.setMode(key, mode), OEG.t("admin.taxSaved") + " · " + key + " → " + mode);
    window.OEG_admin_sub_add = (catKey, key, label, icon) => {
      if (!label && !key) { say($("taxMsg"), "error", "❌ " + OEG.esc(OEG.t("admin.needLabel"))); return; }
      taxGo(() => OEG.quiz.addSub(catKey, key, label, icon), OEG.t("admin.subAdded") + " · " + (label || key));
    };
    window.OEG_admin_sub_del = (catKey, subKey) => {
      const n = OEG.quiz.subCount(catKey, subKey);
      const lab = OEG.quiz.subLabel(catKey, subKey);
      const kids = OEG.quiz.chapsOf(catKey, subKey).length;
      if (!confirm(OEG.t("admin.delConfirm") + " — " + lab + (kids ? ` · 📗 ${kids}` : "") + (n ? ` · ${n} ${OEG.t("admin.qCount")}` : ""))) return;
      taxGo(() => OEG.quiz.delSub(catKey, subKey), OEG.t("admin.subDeleted") + " · " + lab + (n ? ` (${n} ${OEG.t("admin.qCount")})` : ""));
    };
    window.OEG_admin_sub_move = (catKey, subKey, dir) => taxGo(() => OEG.quiz.moveSub(catKey, subKey, dir), OEG.t("admin.taxMoved"));
    window.OEG_admin_chap_move = (catKey, subKey, chapKey, dir) => taxGo(() => OEG.quiz.moveChap(catKey, subKey, chapKey, dir), OEG.t("admin.taxMoved"));
    window.OEG_admin_chap_add = (catKey, subKey, num, label, grade) => taxGo(() => OEG.quiz.addChap(catKey, subKey, num, label, "", grade), OEG.t("admin.chapAdded") + " · " + (label || num));
    window.OEG_admin_chap_edit = (catKey, subKey, chapKey, num, label, grade) => taxGo(() => OEG.quiz.setChap(catKey, subKey, chapKey, num, label, "", grade), OEG.t("admin.taxSaved") + " · " + (label || chapKey));
    window.OEG_admin_chap_del = (catKey, subKey, chapKey) => {
      const lab = OEG.quiz.chapTitle(catKey, subKey, chapKey);
      const n = OEG.quiz.chapCount(catKey, subKey, chapKey, "all");
      if (!confirm(OEG.t("admin.delConfirm") + " — " + lab + (n ? ` · ${n} ${OEG.t("admin.qCount")}` : ""))) return;
      taxGo(() => OEG.quiz.delChap(catKey, subKey, chapKey), OEG.t("admin.chapDeleted") + " · " + lab);
    };
    window.OEG_admin_cat_del = (catKey) => {
      const c = OEG.quiz.catOf(catKey);
      const lab = OEG.langField((c && c.label) || {}) || catKey;
      const n = (c && c.count) || 0;
      const kids = ((c && c.subs) || []).length;
      if (!confirm(OEG.t("admin.delConfirm") + " — " + lab + ` · 📚 ${kids} · ${n} ${OEG.t("admin.qCount")}`)) return;
      taxGo(() => OEG.quiz.delCat(catKey), OEG.t("admin.catDeleted") + " · " + lab);
    };

    /* ================= 🧭 મેનુ સંચાલન (ટોચનું મેનુ ▸ ઉપ-મેનુ ▸ સબ-સબ મેનુ) =================
       ડેટા: data/site-config.json → ui.nav = [{ key, icon, label{gu,hi,en}, href, subs:[…] }]
       ખાલી હોય તો સાઇટ ઑટો-મેનુ (taxonomy પ્રમાણે) ચલાવે; પહેલી એડપીઝ ઑટો યાદી કૉપી કરી દે. */
    const navLab = (o) => {
      const v = (o && o.label) || (typeof o === "string" ? o : "") || (o && o.key) || "";
      return typeof v === "string" ? v : (OEG.langField(v) || v.gu || v.hi || v.en || "");
    };
    const navClone = (list, depth) => (Array.isArray(list) ? list : []).map((x) => {
      const o = typeof x === "string" ? { label: x } : (x || {});
      const n = { key: String(o.key || navLab(o)).replace(/[^\w\-]/g, "").slice(0, 20) || ("m" + Date.now().toString(36).slice(-4)) };
      if (o.icon) n.icon = String(o.icon).slice(0, 6);
      const src = (o.label && typeof o.label === "object") ? o.label : {};
      const l = String(navLab(o) || "").trim();
      n.label = { gu: src.gu || l || n.key, hi: src.hi || "", en: src.en || "" };
      n.href = String(o.href || "#/").slice(0, 160);
      const kids = (depth || 1) < 3 ? navClone(o.kids || o.subs, (depth || 1) + 1) : [];
      if (kids.length) n.subs = kids;
      return n;
    }).filter(Boolean);
    const navTreeNow = () => {
      const v = ((OEG.state.config || {}).ui || {}).nav;
      return (Array.isArray(v) && v.length) ? v : navClone(OEG.navAuto ? OEG.navAuto() : [], 1);
    };
    /* navSibs = પંક્તિની અંદરની સૂચિ (એટલે કે તે નોડનો સમૂહ) · navKids = તે નોડના બાળકો */
    const navSibs = (tree, path) => {
      const p = String(path || "").split(".").filter(x => x !== "").map(Number);
      let list = tree;
      for (let k = 0; k + 1 < p.length; k++) { const n = list && list[p[k]]; if (!n) return null; list = Array.isArray(n.subs) ? n.subs : (n.subs = []); }
      return Array.isArray(list) ? list : null;
    };
    const navKids = (tree, path) => {
      const p = String(path || "").split(".").filter(x => x !== "").map(Number);
      let list = tree;
      for (const i of p) { const n = list && list[i]; if (!n) return null; list = Array.isArray(n.subs) ? n.subs : (n.subs = []); }
      return Array.isArray(list) ? list : null;
    };
    const LINK_GROUPS = () => {
      const tx = OEG.tax();
      const pages = [[OEG.t("nav.home"), "#/"]];
      tx.types.filter(x => x.route).forEach(x => pages.push([(x.icon || "📄") + " " + OEG.typeLabel(x.key), "#/" + x.route]));
      [["🎓 " + OEG.t("sec.grades"), "#/grade"], ["🧠 " + OEG.t("page.quiz"), "#/quiz"]].forEach(p => pages.push(p));
      const grades = tx.grades.filter(g => g.key !== "all").map(g => [OEG.gradeLabel(g.key), "#/grade/" + g.key]);
      const quiz = [];
      try {
        (OEG.quiz.cats() || []).forEach(c => {
          quiz.push([(c.icon || "🧠") + " " + OEG.taxLabel(c, "subject"), "#/quiz?cat=" + c.key]);
          if (c.mode === "grade") (OEG.quiz.subsOf("grade") || []).forEach(x => quiz.push([OEG.quiz.subLabel("grade", x.key), "#/quiz?cat=grade&subject=" + x.key]));
          else if (c.mode === "sub") (c.subs || []).forEach(x => quiz.push([(x.icon || "🏷️") + " " + OEG.taxLabel(x, "subject"), "#/quiz?cat=" + c.key + "&sub=" + x.key]));
        });
      } catch (e) {}
      const other = [["🔑 " + OEG.t("nav.login"), "#/login"], ["📝 " + OEG.t("nav.register"), "#/register"], ["🛠️ " + OEG.t("nav.admin"), "#/admin"]].filter(x => x[1]);
      return [[OEG.t("admin.navPages"), pages], [OEG.t("admin.navByGrade"), grades], [OEG.t("admin.navQuiz"), quiz], [OEG.t("admin.navOther"), other]]
        .filter(g => g[1].length);
    };
    /* પેજની લિંક: ડ્રૉપડાઉન જેવી સૂચનો + કોઈ પણ સરનામું લખી શકાય (datalist) */
    const linkOpts = () => LINK_GROUPS().map(([g, items]) => items.map(([lab, href]) =>
      `<option value="${OEG.esc(href)}">${OEG.esc(g + " · " + lab)}</option>`).join("")).join("");
    const linkInput = (id, val) => `<input id="${id}" list="navLinks" value="${OEG.esc(val || "#/")}" maxlength="160" placeholder="#/videos · https://…">`;
    let navEd = null;   /* { path: "0.1" | "", mode: "add"|"edit", parent: "0" } */
    function renderNavMgr() {
      const box = $("navList");
      if (!box) return;
      const tree = navTreeNow();
      const custom = !!(((OEG.state.config || {}).ui || {}).nav || []).length;
      const mode = $("navMode");
      if (mode) mode.innerHTML = custom ? "🧭 " + OEG.t("admin.navCustom2") : "♻️ " + OEG.t("admin.navAutoMode");
      const dl = $("navLinks");
      if (dl && !dl.options.length) dl.innerHTML = linkOpts();
      box.innerHTML = tree.length ? tree.map((n, i) => navRow(n, String(i), 1)).join("") : `<span class="sub-none">${OEG.t("admin.navNone")}</span>`;
      bindNav(box);
      renderNavEd();
    }
    function navRow(n, path, depth) {
      const kids = Array.isArray(n.subs) ? n.subs : [];
      const href = String(n.href || "#/");
      const d = Number(depth) || 1;
      return `<div class="nav-row d${d}" data-navrow="${OEG.esc(path)}">
        <span class="nr-ic">${n.icon ? OEG.esc(String(n.icon)) : (d === 1 ? "🧭" : "📄")}</span>
        <b>${OEG.esc(navLab(n) || n.key || "")}</b><code>${OEG.esc(href)}</code>
        ${kids.length ? `<span class="badge">▾ ${kids.length}</span>` : ""}
        <span class="nr-btns">
          <button type="button" class="btn btn-outline btn-sm" data-navup="${OEG.esc(path)}" title="↑">↑</button>
          <button type="button" class="btn btn-outline btn-sm" data-navdown="${OEG.esc(path)}" title="↓">↓</button>
          <button type="button" class="btn btn-outline btn-sm" data-navedit="${OEG.esc(path)}" title="${OEG.t("admin.edit")}">✏️</button>
          ${d < 3 ? `<button type="button" class="btn btn-outline btn-sm" data-navadd="${OEG.esc(path)}">➕ ${OEG.t(d === 1 ? "admin.navAddSub" : "admin.navAddSub2")}</button>` : ""}
          <button type="button" class="btn btn-danger btn-sm" data-navdel="${OEG.esc(path)}" title="${OEG.t("admin.delete")}">🗑</button>
        </span>
        ${kids.length ? `<div class="nr-kids">${kids.map((k, i) => navRow(k, path + "." + i, d + 1)).join("")}</div>` : ""}
      </div>`;
    }
    function renderNavEd() {
      const box = $("navEd");
      if (!box) return;
      if (!navEd) { box.innerHTML = ""; return; }
      const tree = navTreeNow();
      const sibs = navEd.path ? navSibs(tree, navEd.path) : null;
      const at = Number(String(navEd.path || "").split(".").pop());
      const node = navEd.mode === "edit" && Array.isArray(sibs) ? sibs[at] : null;
      const cur = node || {};
      const lab = (cur && cur.label && typeof cur.label === "object") ? cur.label : { gu: (cur && navLab(cur)) || "", hi: "", en: "" };
      const href = String((cur && cur.href) || "#/");
      box.innerHTML = `<div class="nav-ed">
        <h4>${navEd.mode === "edit" ? "✏️ " + OEG.t("admin.navEdit") : "➕ " + OEG.t(navEd.parent ? "admin.navAddSub" : "admin.navAddTop")}${navEd.parent ? ` · <code>${OEG.esc(navEd.parent)}</code>` : ""}</h4>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.newIcon")}</label><input id="neIcon" value="${OEG.esc((cur && cur.icon) || "")}" maxlength="4" placeholder="🗒️"></div>
          <div class="field"><label>&nbsp;</label><p class="adm-sec-note" style="margin:0">💡 ${OEG.t("admin.seqNote")}</p></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.navLabel")} · ગુ</label><input id="neGu" value="${OEG.esc(lab.gu || "")}" maxlength="30"></div>
          <div class="field"><label>हि</label><input id="neHi" value="${OEG.esc(lab.hi || "")}" maxlength="30"></div>
          <div class="field"><label>En</label><input id="neEn" value="${OEG.esc(lab.en || "")}" maxlength="30"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.navLink")}</label>${linkInput("neLink", href)}</div>
          <div class="field"><label>&nbsp;</label><p class="adm-sec-note" style="margin:0">💡 ${OEG.t("admin.navLinkNote")}</p></div>
        </div>
        <div class="nav-ed-btns">
          <button type="button" class="btn btn-brand btn-sm" id="neSave">💾 ${OEG.t("btn.save")}</button>
          <button type="button" class="btn btn-outline btn-sm" id="neCancel">${OEG.t("btn.cancel")}</button>
          ${navEd.mode === "edit" ? `<button type="button" class="btn btn-danger btn-sm" id="neDel">🗑 ${OEG.t("admin.delete")}</button>` : ""}
        </div>
      </div>`;
      if ($("neCancel")) $("neCancel").onclick = () => { navEd = null; renderNavEd(); };
      if ($("neSave")) $("neSave").onclick = saveNavEd;
      if ($("neDel")) $("neDel").onclick = () => navRemove(navEd.path);
    }
    async function saveNavEd() {
      const gu = ($("neGu").value || "").trim();
      const hi = ($("neHi").value || "").trim();
      const en = ($("neEn").value || "").trim();
      if (!gu && !hi && !en) { say($("navMsg"), "error", "❌ " + OEG.esc(OEG.t("admin.navNeedLabel"))); return; }
      const custom = String(($("neLink") || {}).value || "").trim();
      if (!custom) { say($("navMsg"), "error", "❌ " + OEG.esc(OEG.t("admin.navNeedLink"))); return; }
      const key = slugKey(custom || gu);
      const icon = ($("neIcon").value || "").trim();
      const node = { key: key, icon: icon, label: { gu: gu || hi || en, hi: hi || gu || en, en: en || gu || hi }, href: custom.slice(0, 160) };
      const parent = navEd && navEd.parent;
      const path = navEd && navEd.path;
      const mode = navEd && navEd.mode;
      try {
        await patchConfig((cfg2) => {
          cfg2.ui = Object.assign({}, cfg2.ui || {});
          const tree = (Array.isArray(cfg2.ui.nav) && cfg2.ui.nav.length) ? cfg2.ui.nav : navClone(OEG.navAuto ? OEG.navAuto() : [], 1);
          if (mode === "edit") {
            const sibs = navSibs(tree, path);
            const i = Number(String(path).split(".").pop());
            const old = sibs && sibs[i];
            if (old && Array.isArray(old.subs)) node.subs = old.subs;
            if (sibs) sibs[i] = node;
          } else if (parent || parent === 0) {
            const kids = navKids(tree, parent);
            if (kids) kids.push(node);
          } else tree.push(node);
          cfg2.ui.nav = tree;
          return cfg2;
        }, "nav: update menu");
        navEd = null;
        dirty(); renderAll();
        if (OEG.applyNav) OEG.applyNav();
        say($("navMsg"), "ok", "✅ " + OEG.esc(OEG.t("admin.navSaved")));
      } catch (e) { say($("navMsg"), "error", "❌ " + OEG.esc(e && e.message ? e.message : String(e))); }
    }
    const slugKey = (v) => (String(v || "").replace(/^#\//, "").replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 20) || "m" + Date.now().toString(36).slice(-4));
    async function navWrite(mut, okMsg) {
      try {
        await patchConfig((cfg2) => {
          cfg2.ui = Object.assign({}, cfg2.ui || {});
          const tree = (Array.isArray(cfg2.ui.nav) && cfg2.ui.nav.length) ? cfg2.ui.nav : navClone(OEG.navAuto ? OEG.navAuto() : [], 1);
          cfg2.ui.nav = mut(tree) || tree;
          return cfg2;
        }, "nav: update menu");
        dirty(); renderAll();
        if (OEG.applyNav) OEG.applyNav();
        say($("navMsg"), "ok", "✅ " + OEG.esc(okMsg));
      } catch (e) { say($("navMsg"), "error", "❌ " + OEG.esc(e && e.message ? e.message : String(e))); }
    }
    function navRemove(path) {
      const tree = navTreeNow();
      const sibs = navSibs(tree, path);
      const i = Number(String(path).split(".").pop());
      const node = sibs && sibs[i];
      const nKids = node && Array.isArray(node.subs) ? node.subs.length : 0;
      if (!confirm(OEG.t("admin.delConfirm") + " — " + navLab(node || {}) + (nKids ? ` · ▾ ${nKids}` : ""))) return;
      navWrite((t2) => {
        const s2 = navSibs(t2, path); const k = Number(String(path).split(".").pop());
        if (s2) s2.splice(k, 1);
        return t2;
      }, OEG.t("admin.navDeleted") + " · " + navLab(node || {}));
      if (navEd) { navEd = null; renderNavEd(); }
    }
    function bindNav(box) {
      const at = (attr, fn) => Array.prototype.forEach.call(box.querySelectorAll("[" + attr + "]"), (b) => { b.onclick = () => fn(b); });
      at("data-navdel", (b) => navRemove(b.dataset.navdel));
      at("data-navedit", (b) => { navEd = { mode: "edit", path: b.dataset.navedit, parent: "" }; renderNavEd(); $("navEd").scrollIntoView({ behavior: "smooth", block: "center" }); });
      at("data-navadd", (b) => { navEd = { mode: "add", path: "", parent: b.dataset.navadd }; renderNavEd(); $("navEd").scrollIntoView({ behavior: "smooth", block: "center" }); });
      const move = (path, dir) => navWrite((t2) => {
        const sibs = navSibs(t2, path); const i = Number(String(path).split(".").pop());
        const j = i + dir;
        if (sibs && j >= 0 && j < sibs.length) { const x = sibs[i]; sibs[i] = sibs[j]; sibs[j] = x; }
        return t2;
      }, OEG.t("admin.navSaved"));
      at("data-navup", (b) => move(b.dataset.navup, -1));
      at("data-navdown", (b) => move(b.dataset.navdown, 1));
    }
    $("navRefresh").onclick = () => { navEd = null; renderNavMgr(); };
    $("navCopy").onclick = () => navWrite((t2) => navClone(OEG.navAuto ? OEG.navAuto() : [], 1), OEG.t("admin.navCopied"));
    $("navReset").onclick = () => {
      if (!confirm(OEG.t("admin.navResetAsk"))) return;
      patchConfig((cfg2) => { cfg2.ui = Object.assign({}, cfg2.ui || {}); delete cfg2.ui.nav; return cfg2; }, "nav: back to auto menu")
        .then(() => { navEd = null; dirty(); renderAll(); if (OEG.applyNav) OEG.applyNav(); say($("navMsg"), "ok", "✅ " + OEG.esc(OEG.t("admin.navAutoMode"))); })
        .catch((e) => say($("navMsg"), "error", "❌ " + OEG.esc(e && e.message ? e.message : String(e))));
    };
    $("navTAdd").onclick = async () => {
      const gu = ($("navTLabel").value || "").trim();
      const href = String(($("navTLink") || {}).value || "").trim();
      if (!gu) { say($("navMsg"), "error", "❌ " + OEG.esc(OEG.t("admin.navNeedLabel"))); return; }
      if (!href) { say($("navMsg"), "error", "❌ " + OEG.esc(OEG.t("admin.navNeedLink"))); return; }
      await navWrite((t2) => { t2.push({ key: slugKey(href || gu), icon: ($("navTIcon").value || "").trim(), label: { gu: gu, hi: gu, en: gu }, href: href.slice(0, 160) }); return t2; }, OEG.t("admin.navSaved") + " · " + gu);
      $("navTLabel").value = ""; $("navTIcon").value = "";
    };

    function renderTax(r) {
      const box = (r || root).querySelector("#taxTypes");
      if (!box) return;
      bindTax();
      const s = (r || root).querySelector("#qzCat");
      if (s) {
        const keys = (OEG.quiz.cats ? OEG.quiz.cats() : []).map(c => c.key);
        OEG.tax().quizCats.forEach(c => { if (keys.indexOf(c.key) < 0) keys.push(c.key); });
        const v = s.value;
        s.innerHTML = opts(keys, v || keys[0] || "gk");
        if (v !== s.value && Array.prototype.some.call(s.options, o => o.value === v)) s.value = v;
      }
      const it = (r || root).querySelector("#itType");
      if (it) {
        const v0 = it.value;
        it.innerHTML = `<option value="all">${OEG.t("filter.all")}</option>` + OEG.tax().types.map(x => `<option value="${x.key}">${x.icon || ""} ${OEG.esc(OEG.typeLabel(x.key))}</option>`).join("") + `<option value="hidden">🙈 ${OEG.t("admin.hiddenOnly")}</option>`;
        if (Array.prototype.some.call(it.options, o => o.value === v0)) it.value = v0;
      }
      /* 🎯 પ્રેક્ષક cascade ની બધી dropdown તરત જ અપડેટ (વર્તમાન પસંદગી રાખીને) */
      ["up", "p", "yt"].forEach((pfx) => {
        const A = (r || root).querySelector("#" + pfx + "Aud");
        if (A) { const v = A.value; A.innerHTML = audSelOpts(v); if (Array.prototype.some.call(A.options, o => o.value === v)) A.value = v; }
        cscApply(pfx);
      });
    }
    renderTax(root); renderSubs(); renderNavMgr(); bindCascades(); bindUserRoles();

    /* 👥 આચાર્ય/ઓફિસ વપરાશકર્તા માટે ધોરણ-વિષય દેખાતું નથી */
    function bindUserRoles() {
      const sel = $("uRole"), row = $("uGradeRow");
      if (!sel || !row) return;
      const sync = () => {
        const on = /student|teacher/.test(sel.value || "");
        row.style.display = on ? "" : "none";
        const n = $("uRoleNote");
        if (n) n.style.display = on ? "none" : "";
      };
      sel.onchange = sync;
      sync();
    }

    /* ---------- 🎯 પ્રેક્ષક cascade binding (Upload · ✍️ · 🎬) ---------- */
    function cscVal(p) {
      const g = (n) => { const e = $(p + n); return e ? String(e.value || "") : ""; };
      const aud = g("Aud") || "all";
      const stu = aud === "student";
      return {
        aud: aud, type: g("Type") || "",
        grade: stu ? (g("Grade") || "all") : "all",
        subject: stu ? (g("Subject") || "all") : "all",
        audSub: stu ? "" : g("AudSub"), audSub2: stu ? "" : g("AudSub2")
      };
    }
    function cscApply(p) {
      const box = root.querySelector('.csc[data-csc="' + p + '"]');
      if (!box) return;
      const aud = ($(p + "Aud") || {}).value || "all";
      const stu = aud === "student";
      const subs = stu ? [] : OEG.audSubs(aud);
      const chips = box.querySelector("[data-csc-auds]");
      if (chips) Array.prototype.forEach.call(chips.querySelectorAll("[data-audpick]"), (b2) => {
        b2.classList.toggle("on", (b2.dataset.audpick || "all") === aud);
        if (!b2.bound) { b2.bound = 1; b2.onclick = () => { const A2 = $(p + "Aud"); if (A2) { A2.value = b2.dataset.audpick || "all"; A2.dispatchEvent(new Event("change")); } }; }
      });
      const T = $(p + "Type");
      if (T) { const tv = T.value; T.innerHTML = typeOptsAud(aud, tv || v0(p)); if (!Array.prototype.some.call(T.options, o => o.value === tv)) T.value = v0(p); }
      const rStu = box.querySelector('[data-csc-row="stu"]'), rAud = box.querySelector('[data-csc-row="aud"]');
      if (rStu) rStu.style.display = stu ? "" : "none";
      if (rAud) rAud.style.display = (!stu && subs.length) ? "" : "none";
      const gSel = $(p + "Grade"), sFld = box.querySelector(".csc-subj");
      if (sFld) sFld.style.display = (stu && gSel && gSel.value && gSel.value !== "all") ? "" : "none";
      const a1 = $(p + "AudSub");
      if (a1) { const keep1 = a1.value; a1.innerHTML = audSubOpts(aud, keep1); }
      const a2 = $(p + "AudSub2"), f2 = box.querySelector(".csc-aud2");
      const kids = ((subs.filter(x => a1 && x.key === a1.value)[0] || {}).subs) || [];
      if (f2) f2.style.display = kids.length ? "" : "none";
      if (a2) { const keep2 = a2.value; a2.innerHTML = opts(kids.map(x => x.key), keep2, k => OEG.taxLabel(kids.filter(y => y.key === k)[0] || {}, "subject")); }
    }
    function cscSet(p, v) {
      const set = (n, val) => { const e = $(p + n); if (e && val !== undefined && val !== null) e.value = val; };
      set("Aud", v.aud || "all"); set("Type", v.type);
      cscApply(p);
      set("Grade", v.grade || "all"); set("Subject", v.subject || "all");
      set("AudSub", v.audSub || ""); set("AudSub2", v.audSub2 || "");
      cscApply(p);
    }
    function bindCascades() {
      ["up", "p", "yt"].forEach((p) => {
        const A = $(p + "Aud"), G = $(p + "Grade"), S1 = $(p + "AudSub");
        if (A) A.onchange = () => {
          const T = $(p + "Type");
          if (T) T.innerHTML = typeOptsAud(A.value || "all", T.value || v0(p));
          cscApply(p);
        };
        if (G) G.onchange = () => cscApply(p);
        if (S1) S1.onchange = () => cscApply(p);
        cscApply(p);
        const box = root.querySelector('.csc[data-csc="' + p + '"]');
        if (!box) return;
        Array.prototype.forEach.call(box.querySelectorAll("[data-cscadd]"), (b) => { b.onclick = () => cscAdd(p, b.dataset.cscadd, b); });
        Array.prototype.forEach.call(box.querySelectorAll("[data-cscdel]"), (b) => { b.onclick = () => cscDel(p, b.dataset.cscdel); });
      });
    }
    function v0(p) { return p === "yt" ? "video" : p === "up" ? "textbook" : "post"; }
    /* ➕ / 🗑 — નામ પરથી key આપોઆપ; કોઈ કી ફીલ્ડ નહીં */
    function cscAdd(p, what, btn) {
      const box = root.querySelector('.csc[data-csc="' + p + '"]');
      if (!box) return;
      const old = box.querySelector(".csc-pop");
      if (old) { old.remove(); if (old.dataset.what === what) return; }
      const lab = { aud: OEG.t("admin.audience"), grade: OEG.t("admin.grade"), subject: OEG.t("admin.subject"), audSub: OEG.t("admin.audTopic"), audSub2: OEG.t("admin.audTopic2") }[what] || what;
      const pop = document.createElement("div");
      pop.className = "csc-pop"; pop.dataset.what = what;
      pop.innerHTML = `<label>➕ ${OEG.esc(lab)}</label><input placeholder="${OEG.t("admin.newName")}" maxlength="40"><input class="csc-ic" placeholder="🏷️" maxlength="4">
        <button type="button" class="btn btn-brand btn-sm">${OEG.t("admin.addBtn") || "➕"}</button><button type="button" class="btn btn-outline btn-sm csc-x">✕</button>`;
      box.appendChild(pop);
      const inp = pop.querySelector("input"), go = pop.querySelector(".btn-brand");
      inp.focus();
      const done = () => pop.remove();
      pop.querySelector(".csc-x").onclick = done;
      const run = () => {
        const name = inp.value.trim();
        if (!name) { inp.focus(); return; }
        cscAddDo(p, what, name, (pop.querySelector(".csc-ic").value || "").trim()).then((k) => { if (k) { cscApply(p); const e = $(p + (what === "aud" ? "Aud" : what === "grade" ? "Grade" : what === "subject" ? "Subject" : what === "audSub" ? "AudSub" : "AudSub2")); if (e) { e.value = k; e.dispatchEvent(new Event("change")); } } done(); });
      };
      go.onclick = run;
      inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); run(); } };
    }
    async function cscAddDo(p, what, name, icon) {
      if (!needGh()) return "";
      const cur = cscVal(p);
      let out = "";
      try {
        await writeTax((tx) => {
          tx.audiences = (tx.audiences && tx.audiences.length ? tx.audiences : OEG.tax().audiences || []);
          const push = (arr, obj) => { if (!Array.isArray(arr)) return ""; const k = uniqKey(name, arr); arr.push(obj); obj.key = k; return k; };
          if (what === "aud") { const k = uniqKey(name, tx.audiences); tx.audiences.push({ key: k, icon: icon || "🎯", label: lab3(name, k), subs: [] }); out = k; return; }
          if (what === "grade") {
            tx.grades = (tx.grades && tx.grades.length ? tx.grades : OEG.tax().grades || []);
            const k = uniqKey(name, tx.grades); const o = { key: k, icon: icon || "🎓", label: lab3(name, k) };
            const at = tx.grades.findIndex(x => x.key === "all");
            if (at >= 0) tx.grades.splice(at, 0, o); else tx.grades.push(o);
            out = k; return;
          }
          if (what === "subject") {
            tx.subjects = (tx.subjects && tx.subjects.length ? tx.subjects : OEG.tax().subjects || []);
            const k = uniqKey(name, tx.subjects); tx.subjects.push({ key: k, icon: icon || "📘", label: lab3(name, k) });
            tx.gradeSubjects = (tx.gradeSubjects && tx.gradeSubjects.length ? tx.gradeSubjects : OEG.tax().gradeSubjects || []);
            if (!tx.gradeSubjects.some(x => x.key === k)) tx.gradeSubjects.push({ key: k, icon: icon || "📘", label: lab3(name, k) });
            out = k; return;
          }
          const a = (tx.audiences || []).filter(x => x.key === (cur.aud === "all" ? "teacher" : cur.aud))[0] || (tx.audiences || [])[0];
          if (!a) { out = ""; return; }
          if (!Array.isArray(a.subs)) a.subs = [];
          if (what === "audSub") { const k = uniqKey(name, a.subs); a.subs.push({ key: k, icon: icon || "🏷️", label: lab3(name, k), subs: [] }); out = k; return; }
          const x = a.subs.filter(y => y.key === cur.audSub)[0] || a.subs[0];
          if (!x) { out = ""; return; }
          if (!Array.isArray(x.subs)) x.subs = [];
          const k2 = uniqKey(name, x.subs); x.subs.push({ key: k2, icon: icon || "🔹", label: lab3(name, k2) }); out = k2;
        }, OEG.t("admin.taxSaved"));
      } catch (e) { msg(p + "Msg", OEG.t("admin.error") + " " + e.message, false); }
      return out;
    }
    async function cscDel(p, what) {
      if (!needGh()) return;
      const cur = cscVal(p);
      const nm = { aud: cur.aud, grade: cur.grade, subject: cur.subject, audSub: cur.audSub, audSub2: cur.audSub2 }[what] || "";
      if (!nm || nm === "all") { msg(p + "Msg", OEG.t("aud.any"), false); return; }
      if (!confirm(OEG.t("admin.delConfirm") + " — " + nm + "?")) return;
      try {
        await writeTax((tx) => {
          const cut = (arr) => (Array.isArray(arr) ? arr : []).filter(x => x && x.key !== nm);
          if (what === "aud") { tx.audiences = cut(tx.audiences.length ? tx.audiences : OEG.tax().audiences); return; }
          if (what === "grade") { tx.grades = cut(tx.grades.length ? tx.grades : OEG.tax().grades); return; }
          if (what === "subject") {
            tx.subjects = cut(tx.subjects.length ? tx.subjects : OEG.tax().subjects);
            tx.gradeSubjects = cut(tx.gradeSubjects.length ? tx.gradeSubjects : OEG.tax().gradeSubjects);
            return;
          }
          const a = (tx.audiences || []).filter(x => x.key === cur.aud)[0];
          if (!a) return;
          if (what === "audSub") a.subs = (a.subs || []).filter(x => x.key !== nm);
          else { const x = (a.subs || []).filter(y => y.key === cur.audSub)[0]; if (x) x.subs = (x.subs || []).filter(y => y.key !== nm); }
        }, OEG.t("admin.deleted") + " · " + nm);
      } catch (e) { msg(p + "Msg", OEG.t("admin.error") + " " + e.message, false); }
    }

    /* ---------- 🧠 Quiz list ---------- */
    function renderQuiz(r) {
      const box = (r || root).querySelector("#qzList");
      if (!box) return;
      const bank = OEG.quiz.raw();
      const catSel = (r || root).querySelector("#qzCat");
      if (catSel) { const v = catSel.value; catSel.innerHTML = opts(OEG.quiz.cats().map(c => c.key), v || "gk"); if (catSel.value !== v && Array.prototype.some.call(catSel.options, o => o.value === v)) catSel.value = v; }
      const cat = (r || root).querySelector("#qzCat").value;
      (r || root).querySelector("#qzPass").value = bank.passPercent || 60;
      (r || root).querySelector("#qzSec").value = bank.seconds || 45;
      const mode = OEG.quiz.modeOf(cat);
      const subSel = (mode === "sub" && $("qzSubCat")) ? $("qzSubCat").value : "all";
      const gSel = (mode === "grade" && $("qzGrade")) ? $("qzGrade").value : "all";
      const sSel = (mode === "grade" && $("qzSub")) ? $("qzSub").value : "all";
      const qs = (bank.questions || []).filter(q => (q.cat || "gk") === cat
        && (subSel === "all" || (q.sub || "") === subSel)
        && (gSel === "all" || (q.grade || "all") === gSel || (q.grade || "all") === "all")
        && (sSel === "all" || (q.subject && q.subject !== "all" ? q.subject : "") === sSel));
      box.innerHTML = qs.length ? qs.slice(0, 60).map(q => `
        <div class="file-item"><span>${q.diff === "hard" ? "🔥" : q.diff === "medium" ? "⭐" : "🟢"}</span>
          <code>${OEG.esc(String(OEG.langField(q.q)).slice(0, 60))}</code>
          ${q.sub ? `<span class="badge">🧩 ${OEG.esc(OEG.quiz.subLabel(q.cat || "gk", q.sub))}</span>` : ""}
          ${q.subject && q.subject !== "all" ? `<span class="badge">📘 ${OEG.esc(OEG.subjectLabel(q.subject))}</span>` : ""}
          <span class="badge">A-D: ${"ABCD"[q.a]}</span>
          <button class="btn btn-danger btn-sm" data-qd="${OEG.esc(q.id)}">🗑</button></div>`).join("")
        + (qs.length > 60 ? `<p style="color:var(--muted);font-size:.84rem">+${qs.length - 60}…</p>` : "")
        : `<p style="color:var(--muted)">${OEG.t("admin.qNone")}</p>`;
      box.querySelectorAll("[data-qd]").forEach(b => b.onclick = () => window.OEG_admin_qz_del(b.dataset.qd));
    }
    if ($("qzCat")) $("qzCat").onchange = () => { syncCat(); renderQuiz(root); };
    ["qzSubCat", "qzGrade", "qzSub"].forEach(id => { const el = $(id); if (el) el.onchange = () => renderQuiz(root); });
    syncCat();
    if ($("qzCfg")) $("qzCfg").onclick = () => window.OEG_admin_qz_cfg();
    if ($("qzTrBtn")) $("qzTrBtn").onclick = async () => {
      const src = ($("qzSrc") || {}).value || "gu";
      const out = $("qzTrOut"), btn = $("qzTrBtn");
      btn.disabled = true; btn.textContent = "⏳ " + OEG.t("admin.trBusy");
      try {
        const fields = [["qzText", "📌"], ["qzOpt1", "A"], ["qzOpt2", "B"], ["qzOpt3", "C"], ["qzOpt4", "D"], ["qzEx", "💡"]];
        let html = "";
        for (const [id, tag] of fields) {
          const v = $(id).value.trim();
          if (!v) continue;
          const t3 = await fillLangs({ [src]: v }, true);
          html += `<p><b>${tag}</b> ${OEG.esc(t3.gu)} · ${OEG.esc(t3.hi)} · ${OEG.esc(t3.en)}</p>`;
        }
        out.innerHTML = html ? `<b>🌐 ${OEG.t("admin.trPreview")}</b>${html}` : `<p>—</p>`;
        out.style.display = "block";
      } catch (e) { $("qzMsg").innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message)}</div>`; }
      btn.disabled = false; btn.textContent = "🌐 " + OEG.t("admin.trBtn");
    };
    if ($("qzRefresh")) $("qzRefresh").onclick = async () => { await OEG.quiz.load(); renderAll(); };
    renderQuiz(root); renderFlags(root);

    /* ---------- 🗂️ Items ---------- */
    if ($("itRefresh")) $("itRefresh").onclick = async () => { await OEG.loadCatalog(); renderAll(); };
    if ($("itSearch")) $("itSearch").oninput = () => renderItems(root);
    if ($("vwCommit")) $("vwCommit").onclick = () => window.OEG_admin_views_commit();
    if ($("vwReset")) $("vwReset").onclick = () => window.OEG_admin_views_reset();
    if ($("itType")) $("itType").onchange = () => renderItems(root);
    renderItems(root);

    /* ---------- 📣 સમાચાર પટ્ટી · 🔔 સૂચના · 🟢 વૉટ્સએપ પ્રસાર ---------- */
    (function newsPanel() {
      const NCFG = Object.assign({}, OEG.news.DEF, (OEG.state.config || {}).news || {});
      const NT = Object.assign({}, OEG.notify.DEF, (OEG.state.config || {}).notify || {});
      const tri = (id) => ({
        gu: ($(id).value || "").trim(), hi: ($(id + "Hi").value || "").trim(), en: ($(id + "En").value || "").trim()
      });
      const lab = (o) => (o && typeof o === "object" ? o : { gu: String(o || ""), hi: "", en: "" });

      /* --- 📰 પટ્ટી --- */
      $("nwOn").checked = NCFG.enabled !== false;
      $("nwAuto").checked = NCFG.autoPosts !== false;
      $("nwPause").checked = NCFG.pauseOnHover !== false;
      const nl = lab(NCFG.label);
      $("nwLabel").value = nl.gu || ""; $("nwLabelHi").value = nl.hi || ""; $("nwLabelEn").value = nl.en || "";
      $("nwSpeed").value = NCFG.speed || 46;
      $("nwCount").value = NCFG.autoCount || 6;
      $("nwDays").value = NCFG.autoDays || 0;
      $("nwTypes").value = NCFG.autoTypes || "post";
      $("nwItems").value = (NCFG.items || []).map((x) => (typeof x === "string" ? x : [x.text || x.title || "", x.url || ""].filter(Boolean).join(" | "))).join("\n");
      $("nwSave").onclick = async () => {
        if (!needGh()) return;
        const items = $("nwItems").value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
          const p2 = l.split("|");
          return { text: (p2[0] || "").trim(), url: (p2[1] || "").trim() };
        }).filter((x) => x.text);
        try {
          await patchConfig((c) => {
            c.news = {
              enabled: $("nwOn").checked, label: tri("nwLabel"), speed: Number($("nwSpeed").value) || 46,
              autoPosts: $("nwAuto").checked, autoTypes: $("nwTypes").value.trim() || "post",
              autoDays: Number($("nwDays").value) || 0, autoCount: Number($("nwCount").value) || 6,
              pauseOnHover: $("nwPause").checked, dismissible: true, items
            };
          }, "OEG: news strip");
          dirty();
          OEG.news.clearDismiss();
          try { OEG.news.render(); } catch (e) {}
          const n2 = (OEG.news.items() || []).length;
          msg("nwMsg", "✅ " + OEG.t("admin.saved") + " · 📰 " + n2 + " lines · " + ($("nwOn").checked ? OEG.t("admin.yes") : OEG.t("admin.no")), true);
        } catch (e) { msg("nwMsg", OEG.t("admin.error") + " " + e.message, false); }
      };
      $("nwTest").onclick = () => {
        OEG.news.clearDismiss();
        try { OEG.news.render(); } catch (e) {}
        const el = document.getElementById("newsStrip");
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); msg("nwMsg", "👀 " + OEG.t("admin.newsTest"), true); }
        else msg("nwMsg", "⚠️ " + OEG.t("admin.newsOn"), false);
      };
      $("nwReset").onclick = () => { $("nwItems").value = ""; msg("nwMsg", "🧹", true); };

      /* --- 🔔 સૂચના --- */
      $("ntOn").checked = NT.enabled !== false;
      $("ntBell").checked = NT.bell !== false;
      $("ntPosts").checked = NT.onNewPosts !== false;
      $("ntAsk").checked = NT.askOnce !== false;
      $("ntPoll").value = NT.pollMinutes || 15;
      $("ntDays").value = NT.days || 30;
      const permLine = () => {
        const el = $("ntPerm"); if (!el) return;
        const pm = OEG.notify.permission();
        const txt = pm === "granted" ? "✅ " + OEG.t("n.on") : pm === "denied" ? "⛔ " + OEG.t("n.denied") : "⚪ " + OEG.t("n.off");
        el.textContent = OEG.t("admin.notiPerm") + " " + txt + (OEG.notify.isHttps() ? "" : " · https");
      };
      const saveNoti = async (extra, okMsg, mid) => {
        if (!needGh()) return false;
        try {
          await patchConfig((c) => {
            c.notify = Object.assign({}, c.notify || {}, {
              enabled: $("ntOn").checked, bell: $("ntBell").checked, onNewPosts: $("ntPosts").checked,
              askOnce: $("ntAsk").checked, pollMinutes: Number($("ntPoll").value) || 15, days: Number($("ntDays").value) || 30
            }, extra || {});
          }, "OEG: notifications");
          dirty();
          try { OEG.notify.start(); } catch (e) {}
          try { OEG.notify.renderBell(); } catch (e) {}
          if (okMsg) msg(mid, "✅ " + OEG.t("admin.saved") + (extra ? " · " + okMsg : ""), true);
          return true;
        } catch (e) { msg(mid, OEG.t("admin.error") + " " + e.message, false); return false; }
      };
      ["ntOn", "ntBell", "ntPosts", "ntAsk"].forEach((id) => { $(id).onchange = () => saveNoti(null, "", "ntMsg"); });
      $("ntPoll").onchange = () => saveNoti(null, "", "ntMsg");
      $("ntDays").onchange = () => saveNoti(null, "", "ntMsg");
      $("ntOn2").onclick = async () => {
        const r = await OEG.notify.enable();
        msg("ntMsg", r.ok ? "✅ " + OEG.t("n.onOk") : "⛔ " + OEG.t(r.why === "unsupported" ? "n.unsupported" : "n.denied"), r.ok);
        permLine();
      };
      $("ntTest").onclick = () => OEG.notify.show({ id: "admtest" + Date.now(), title: OEG.t("n.title"), text: OEG.t("n.testText") });
      async function noticesDoc() { return await OEG.data.readJson(OEG.notify.FILE + "?ts=" + Date.now(), { v: 1, items: [] }); }
      async function renderNotices() {
        const box = $("ntList"); if (!box) return;
        let doc = { v: 1, items: [] };
        try { doc = await noticesDoc(); } catch (e) {}
        const items = (doc.items || []).slice(0, 12);
        box.innerHTML = items.length ? items.map((x) => {
          const tg = OEG.langField(x.title) || OEG.langField(x.text) || "";
          return `<div class="file-item"><span>🔔</span><b style="font-size:.86rem">${OEG.esc(tg)}</b>
            <span style="color:var(--muted);font-size:.82rem;flex:1 1 200px">${OEG.esc(String(OEG.langField(x.text) || "").slice(0, 90))}</span>
            <code>${OEG.esc(x.id || "")}</code><span style="color:var(--muted);font-size:.78rem">${OEG.esc(String(x.at || "").slice(0, 10))}</span>
            <button class="btn btn-danger btn-sm" data-ndel="${OEG.esc(x.id || "")}">${OEG.t("admin.notiDel")}</button></div>`;
        }).join("") : `<p style="color:var(--muted)">${OEG.t("n.empty")}</p>`;
        box.querySelectorAll("[data-ndel]").forEach((b) => {
          b.onclick = async () => {
            if (!needGh()) return;
            try {
              const d2 = await noticesDoc();
              d2.items = (d2.items || []).filter((x) => String(x.id) !== b.dataset.ndel);
              await OEG.data.writeJson(OEG.notify.FILE, { v: 1, updated: new Date().toISOString().slice(0, 10), items: d2.items }, "OEG: notice del " + b.dataset.ndel);
              renderNotices(); msg("ntMsg", "🗑 " + OEG.t("admin.saved"), true);
            } catch (e) { msg("ntMsg", OEG.t("admin.error") + " " + e.message, false); }
          };
        });
      }
      $("ntSend").onclick = async () => {
        if (!needGh()) return;
        const title = tri("ntTitle"), text = ($("ntText").value || "").trim();
        if (!title.gu && !title.hi && !title.en && !text) { msg("ntMsg", "❌ " + OEG.t("admin.notiTextL"), false); return; }
        try {
          const d2 = await noticesDoc();
          const id = "n" + Date.now().toString(36);
          d2.items = [{ id, title: title, text: text, url: ($("ntUrl").value || "").trim(), at: new Date().toISOString().slice(0, 10), level: "notice" }]
            .concat((d2.items || []).slice(0, 11));
          await OEG.data.writeJson(OEG.notify.FILE, { v: 1, updated: new Date().toISOString().slice(0, 10), items: d2.items }, "OEG: notice " + id);
          dirty();
          renderNotices();
          try { OEG.notify.markRead(); await OEG.notify.check("silent"); } catch (e) {}
          msg("ntMsg", "📣 ✅ " + OEG.t("admin.saved") + " · " + OEG.t("n.on"), true);
          $("ntTitle").value = ""; $("ntTitleHi").value = ""; $("ntTitleEn").value = ""; $("ntText").value = ""; $("ntUrl").value = "";
        } catch (e) { msg("ntMsg", OEG.t("admin.error") + " " + e.message, false); }
      };
      renderNotices(); permLine();

      /* --- 🟢 વૉટ્સએપ --- */
      $("waNum").value = NT.waNumber || "";
      $("waWho").value = NT.waAuto || "admin";
      $("waTpl").value = NT.waTemplate || OEG.notify.TPL_DEFAULT;
      function renderWa() {
        const box = $("waList"); if (!box) return;
        const list = OEG.notify.pending().slice(0, 14);
        const cnt = $("waCount");
        if (cnt) cnt.textContent = list.length ? "· " + list.length + " 🆕" : "";
        box.innerHTML = list.length ? list.map((it) => `<div class="file-item"><span>${OEG.typeIcon(it.type) || "📄"}</span>
            <b style="font-size:.86rem">${OEG.esc(OEG.title(it))}</b>
            <span style="color:var(--muted);font-size:.8rem">${OEG.esc(OEG.typeLabel(it.type))}</span>
            <button class="btn btn-brand btn-sm" data-was="${OEG.esc(it.id)}">${OEG.t("admin.waOpen")}</button>
            <button class="btn btn-outline btn-sm" data-wask="${OEG.esc(it.id)}">✅</button></div>`).join("")
          : `<p style="color:var(--muted)">${OEG.t("admin.waNone")}</p>`;
        box.querySelectorAll("[data-was]").forEach((b) => {
          b.onclick = () => {
            const it = OEG.byId(b.dataset.was); if (!it) return;
            OEG.notify.sendOne(it, $("waNum").value.trim());
            msg("waMsg", "🟢 " + OEG.t("wa.done"), true);
            renderWa();
          };
        });
        box.querySelectorAll("[data-wask]").forEach((b) => {
          b.onclick = () => { OEG.notify.markSent(b.dataset.wask); renderWa(); };
        });
      }
      $("waSave").onclick = async () => {
        const tpl = $("waTpl").value;
        if (!await saveNoti({ waNumber: $("waNum").value.replace(/[^\d+]/g, ""), waAuto: $("waWho").value, waTemplate: tpl }, "🟢", "waMsg")) return;
        renderWa();
      };
      $("waPrev").onclick = () => {
        const out = $("waPrevOut");
        const it = OEG.notify.pending()[0] || (OEG.state.catalog || [])[0];
        if (!it) { out.textContent = OEG.t("admin.waNone"); out.style.display = "block"; return; }
        out.textContent = OEG.notify.waText(it);
        out.style.display = "block";
      };
      $("waMark").onclick = () => { OEG.notify.markAll(OEG.notify.pending().map((x) => x.id)); renderWa(); msg("waMsg", "✅ " + OEG.t("admin.waMark"), true); };
      $("waAgain").onclick = () => { OEG.notify.resetSent(); renderWa(); msg("waMsg", "🔄", true); };
      renderWa();

    })();

    /* ---------- 🔄 પેનલ-વચ્ચે જોડાણ: ઉમેરો/કાઢી નાખો તરત જ બધી યાદીમાં દેખાય ---------- */
    function renderVis() {
      const box = $("stVis");
      if (!box) return;
      const ui = (OEG.state.config || {}).ui || {};
      const sec = ui.sections || {};
      box.innerHTML = (OEG.tax().types || []).filter(x => x.route).map(x =>
        `<label class="tgl"><input type="checkbox" data-vis="${OEG.esc(x.route)}" ${sec[x.route] !== false ? "checked" : ""}><span class="tr"></span><span class="tl">${x.icon || "📄"} ${OEG.esc(OEG.typeLabel(x.key))}</span></label>`).join("")
        + `<label class="tgl"><input type="checkbox" id="stSearch" ${ui.showSearch !== false ? "checked" : ""}><span class="tr"></span><span class="tl">🔍 ${OEG.t("nav.search")}</span></label>`
        + `<label class="tgl"><input type="checkbox" id="stGuard" ${ui.antiCopy !== false ? "checked" : ""}><span class="tr"></span><span class="tl">🛡️ ${OEG.t("admin.guard")}</span></label>`;
    }
    function renderCertPra() {
      const box = $("cePra");
      if (!box) return;
      const cats = OEG.quiz.cats();
      box.innerHTML = cats.map(c => `<div class="file-item" style="display:block">
          <div style="margin-bottom:6px"><b>${c.icon || "🧠"} ${OEG.esc(OEG.taxLabel(c, "subject"))}</b> <code>${OEG.esc(c.key)}</code> <span class="badge">${c.count} ${OEG.t("grade.items")}</span></div>
          <input data-pra="${OEG.esc(c.key)}" value="${OEG.esc(OEG.langField(c.praise) || "")}" placeholder="${OEG.t("admin.certPraPh")}">
        </div>`).join("");
      const sel = $("ceCat");
      if (sel) { const v = sel.value; sel.innerHTML = opts(cats.map(c => c.key), v || "gk"); }
    }
    function readTri(id) {
      const v = (el) => (el ? String(el.value || "").trim() : "");
      return { gu: v($(id)), hi: v($(id + "Hi")), en: v($(id + "En")) };
    }
    function certForm() {
      const cats = OEG.quiz.cats();
      const key = ($("ceCat") || {}).value || "gk";
      const cat = cats.filter(c => c.key === key)[0] || { key: key };
      const pra = root.querySelector('[data-pra="' + key + '"]');
      const pct = Math.max(0, Math.min(100, Number(($("ceSc") || {}).value) || 0));
      const t3 = readTri("ceTitle"), t3s = readTri("ceSub");
      const L = OEG.state.lang;
      const pick3 = (o) => (o && (o[L] || o.gu || o.en || o.hi)) || "";
      return {
        name: (($("ceName") || {}).value || "").trim() || OEG.t("quiz.certGuest"),
        cat: cat, catKey: key, grade: ($("ceGrade") || {}).value || "all", subject: "all",
        right: Math.round(pct * 0.5), total: 50, pct: pct, pass: Number((OEG.quiz.raw() || {}).passPercent) || 60,
        id: "OEG-PREVIEW1", date: new Date(),
        title: pick3(t3) || undefined, sub: pick3(t3s) || undefined,
        footer: (($("ceFooter") || {}).value || "").trim() || undefined,
        praise: pra && pra.value.trim() ? pra.value.trim() : undefined,
        showUrl: !$("ceUrl") || $("ceUrl").checked, showSeal: !$("ceSeal") || $("ceSeal").checked,
        showScore: !$("ceScore") || $("ceScore").checked,
        palette: ((OEG.cert.THEMES || {})[($("ceTheme") || {}).value || "royal"]) || null
      };
    }
    async function certPreview() {
      const cv = $("ceCanvas");
      if (!cv || !OEG.cert) return;
      try { await OEG.cert.render(cv, certForm()); } catch (e) {}
    }
    function renderViews() {
      const box = $("vwList");
      if (!box) return;
      const pool = OEG.state.catalog || [];
      const top = OEG.views.ranked(pool, 8);
      box.innerHTML = top.length
        ? top.map((x, i) => `<div class="vw-row"><b>${i + 1}.</b><span class="vw-ic">${OEG.typeIcon(x.item.type)}</span>
            <code>${OEG.esc(String(OEG.langField(x.item.title) || x.item.id).slice(0, 52))}</code>
            <span class="badge">${OEG.esc(x.item.type)}</span>
            <span class="vw-n">👁 ${x.n}</span></div>`).join("")
          + `<p class="adm-sec-note" style="margin:8px 0 0">${OEG.t("admin.viewsLocal")} · ${Object.keys(OEG.views.read()).length}</p>`
        : `<p style="color:var(--muted);font-size:.86rem">${OEG.t("empty.title")}</p>`;
    }
    window.OEG_admin_views_commit = async () => {
      if (!needGh()) return;
      try {
        await OEG.views.commit();
        await OEG.views.load();
        msg("itMsg", "✅ " + OEG.t("admin.saved"), true);
        renderViews();
      } catch (e) { msg("itMsg", "❌ " + e.message, false); }
    };
    window.OEG_admin_views_reset = () => {
      try { localStorage.removeItem("oeg.views"); } catch (e) {}
      OEG.views.reload();
      renderViews();
    };

    function renderAll() {
      renderTax(root); renderQuiz(root); renderFlags(root); renderItems(root); renderCertPra(); renderVis(); renderSubs(); renderViews(); renderNavMgr(); syncCat();
      const keep = (id, html) => {
        const el = $(id);
        if (!el) return;
        const v = el.value;
        el.innerHTML = html;
        if (Array.prototype.some.call(el.options, o => o.value === v)) el.value = v;
      };
      keep("qzGrade", qzGradeOpts(($("qzGrade") || {}).value || "all"));
      keep("qzSub", qzSubjOpts(($("qzSub") || {}).value || "all"));
      ["up", "p", "yt"].forEach(cscApply);
      keep("ceGrade", gradeOpts("all"));
    }

    /* ---------- 🖼 લોગો ચઢાવો (repo માં uploads/branding/) + લાઈવ પૂર્વદર્શન ---------- */
    const logoPrev = (v) => {
      const el = $("stLogoPrev"); if (!el) return;
      const url = String(v || "").trim();
      el.innerHTML = url
        ? `<img src="${OEG.esc(/^https?:/i.test(url) ? url : OEG.base(url))}" alt="" style="height:34px;vertical-align:middle;border:1px solid var(--border);border-radius:8px;padding:2px;background:var(--surface-2)"> <code>${OEG.esc(url)}</code>`
        : "—";
    };
    if ($("stLogoFile")) {
      logoPrev(($("stLogoUrl") || {}).value || "");
      $("stLogoFile").onchange = () => {
        const f = $("stLogoFile").files[0];
        logoPrev(f ? (f.name + " (" + Math.round(f.size / 1024) + " KB)") : "");
        if (f && !/^image\//.test(f.type || "")) msg("siteMsg", "❌ PNG / JPG / SVG / WEBP", false);
      };
    }
    if ($("stLogoUrl")) $("stLogoUrl").oninput = (e) => logoPrev(e.target.value);
    if ($("stLogoUp")) $("stLogoUp").onclick = uploadLogo;
    if ($("stLogoClear")) $("stLogoClear").onclick = () => { $("stLogoUrl").value = ""; logoPrev(""); msg("siteMsg", "🧹 ઈમોજિ પર પાછા — 💾 સેવ કરો", true); };
    async function uploadLogo() {
      if (!needGh()) return;
      const f = ($("stLogoFile") || {}).files && $("stLogoFile").files[0];
      if (!f) { msg("siteMsg", "❌ " + OEG.t("admin.logoUpload"), false); return; }
      if (f.size > 900 * 1024) { msg("siteMsg", "❌ 900 KB from vadu nathi", false); return; }
      const btn = $("stLogoUp"); btn.disabled = true; btn.textContent = "⏳";
      try {
        const buf = await f.arrayBuffer();
        const b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
        const ext = (String(f.name).split(".").pop() || "png").toLowerCase();
        const path = "uploads/branding/logo." + (ext === "jpeg" ? "jpg" : ext);
        await OEG.gh.uploadFile(path, b64, "OEG: site logo");
        $("stLogoUrl").value = path;
        logoPrev(path);
        msg("siteMsg", "✅ " + OEG.t("admin.saved") + " · " + path + " · 💾 " + OEG.t("btn.save"), true);
      } catch (e) { msg("siteMsg", OEG.t("admin.error") + " " + e.message, false); }
      btn.disabled = false; btn.textContent = "🖼 " + OEG.t("admin.logoUpload");
    }

    /* ---------- ⚙️ Site settings ---------- */
    if ($("siteSave")) $("siteSave").onclick = async () => {
      if (!needGh()) return;
      const btn = $("siteSave");
      btn.disabled = true; btn.textContent = "⏳";
      try {
        const tri = async (id) => {
          const o = readTri(id);
          if (!o.gu && !o.hi && !o.en) return "";
          return await fillLangs(o, true);
        };
        const tag = await tri("stTag"), hero = await tri("stHero"), hsub = await tri("stHeroSub"), about = await tri("stAbout");
        const sections = {};
        root.querySelectorAll("[data-vis]").forEach(cb => { sections[cb.dataset.vis] = cb.checked; });
        await patchConfig((c) => {
          c.siteName = $("stName").value.trim() || c.siteName || "Online Education Guru";
          if ($("stUrl").value.trim()) c.siteUrl = $("stUrl").value.trim().replace(/\/+$/, "") + "/";
          c.contactEmail = $("stEmail").value.trim() || c.contactEmail;
          c.social = {
            youtube: $("socYt").value.trim(), facebook: $("socFb").value.trim(),
            instagram: $("socIg").value.trim(), telegram: $("socTg").value.trim(), whatsapp: $("socWa").value.trim()
          };
          c.ui = Object.assign({}, c.ui || {}, {
            logoEmoji: $("stLogo").value.trim() || "🎓",
            accent: $("stAccent").value.trim() || "#4f46e5",
            defaultLang: $("stLang").value || "", defaultTheme: $("stTheme").value || "",
            tagline: tag, heroTitle: hero, heroSub: hsub, footerAbout: about,
            footerNote: $("stNote").value.trim(),
            viewersBase: Math.max(0, Math.round(Number($("stVisitors").value) || 0)),
            logoUrl: ($("stLogoUrl").value || "").trim().replace(/^\/+/, ""),
            counts: {
              student: Math.max(0, Math.round(Number($("stCntSt").value) || 0)),
              teacher: Math.max(0, Math.round(Number($("stCntTe").value) || 0)),
              principal: Math.max(0, Math.round(Number($("stCntPr").value) || 0)),
              other: Math.max(0, Math.round(Number($("stCntOt").value) || 0))
            },
            showSearch: $("stSearch").checked, antiCopy: $("stGuard").checked,
            sections: sections
          });
        }, "site: settings");
        dirty();
        try { if (OEG.paintLogo) OEG.paintLogo(); } catch (e) {}
        try { if (OEG.paintCounts) OEG.paintCounts(); } catch (e) {}
        notify("siteMsg", "✅ " + OEG.t("admin.saved") + " · " + OEG.t("admin.savedSite"), true);
      } catch (e) { msg("siteMsg", OEG.t("admin.error") + " " + e.message, false); }
      btn.disabled = false; btn.textContent = "💾 " + OEG.t("btn.save");
    };

    /* ---------- 🏅 પ્રમાણપત્ર સેટિંગ્સ ---------- */
    if ($("cePreview")) $("cePreview").onclick = () => certPreview();
    if ($("ceTheme")) $("ceTheme").onchange = () => certPreview();
    ["ceName", "ceCat", "ceGrade", "ceSc"].forEach(id => { const el = $(id); if (el) el.onchange = () => certPreview(); });
    if ($("ceSave")) $("ceSave").onclick = async () => {
      if (!needGh()) return;
      const btn = $("ceSave");
      btn.disabled = true; btn.textContent = "⏳";
      try {
        const title = await fillLangs(readTri("ceTitle"), true);
        const sub = await fillLangs(readTri("ceSub"), true);
        const note = $("ceFooter").value.trim();
        const on = $("ceOn").checked, url = $("ceUrl").checked, sl = $("ceSeal").checked, sc = $("ceScore").checked;
        const praise = {};
        root.querySelectorAll("[data-pra]").forEach(inp => { const v = inp.value.trim(); if (v) praise[inp.dataset.pra] = { gu: v, hi: v, en: v }; });
        const thm = ($("ceTheme") || {}).value || "royal";
        await saveBank((bank) => {
          bank.cert = {
            enabled: on, showUrl: url, showSeal: sl, showScore: sc, theme: thm,
            title: title.gu ? title : (bank.cert || {}).title || "",
            sub: sub.gu ? sub : (bank.cert || {}).sub || "",
            footer: note || (bank.cert || {}).footer || ""
          };
          bank.cats = (Array.isArray(bank.cats) ? bank.cats : []).map(c => (typeof c === "string" ? { key: c } : c));
          Object.keys(praise).forEach((k) => {
            let c = bank.cats.filter(x => x.key === k)[0];
            if (!c) { c = { key: k }; bank.cats.push(c); }
            c.praise = praise[k];
          });
          (bank.cats || []).forEach((c) => { if (praise[c.key] === undefined && c.praise) delete c.praise; });
          return bank;
        }, OEG.t("admin.certSaved"), "ceMsg");
        dirty();
        certPreview();
      } catch (e) { msg("ceMsg", OEG.t("admin.error") + " " + e.message, false); }
      btn.disabled = false; btn.textContent = "💾 " + OEG.t("admin.certSave");
    };
    renderCertPra(); renderVis();

    /* ---------- 🗂️ ટૉબ ચાલુ કરો ---------- */
    function applyTabs() {
      Array.prototype.forEach.call(root.querySelectorAll(".adm-sec"), (el) => { el.style.display = el.dataset.sec === admTab ? "" : "none"; });
      Array.prototype.forEach.call(root.querySelectorAll(".adm-tab"), (b) => {
        const on = b.dataset.tab === admTab;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.onclick = () => {
          if (admTab === b.dataset.tab) return;
          admTab = b.dataset.tab;
          try { localStorage.setItem("oeg-adm-tab", admTab); } catch (e) {}
          applyTabs();
          if (admTab === "cert") certPreview();
          const bar = root.querySelector(".adm-tabs");
          if (bar) bar.scrollIntoView({ behavior: "smooth", block: "start" });
        };
      });
      const h = $("admHint");
      if (h) {
        const hint = tabHint(admTab);
        const n = TABS.findIndex(x => x.k === admTab) + 1;
        h.innerHTML = `<span class="adm-step">${n}</span><span>${OEG.esc(hint || tabLabel(admTab))}</span>`;
      }
    }
    applyTabs();
    if (admFlash) { msg(admFlash.id, admFlash.text, admFlash.ok); admFlash = null; }
    if (admTab === "cert") certPreview();
  }

  return { render };
})();
