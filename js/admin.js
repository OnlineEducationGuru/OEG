/* ============================================================
   OEG Admin Panel — GitHub upload, post editor, video, AdSense
   ============================================================ */
OEG.admin = (() => {
  const GRADES = ["balvatika", "1", "2", "3", "4", "5", "6", "7", "8", "1-5", "6-8", "all"];
  const TYPES = ["textbook", "workbook", "game", "office", "teacher", "student", "video", "post", "link"];
  const SUBJECTS = ["all", "gujarati", "hindi", "english", "maths", "science", "social", "office", "planning", "exam", "news", "official", "blog"];
  const FOLDERS = { textbook: "uploads/textbooks", workbook: "uploads/workbooks", game: "uploads/games", office: "uploads/office", teacher: "uploads/teachers", student: "uploads/students", post: "uploads/posts", video: "uploads/videos", link: "uploads/misc" };

  const opts = (arr, sel, labelFn) => arr.map(v => `<option value="${v}" ${v === sel ? "selected" : ""}>${labelFn ? labelFn(v) : v}</option>`).join("");
  const gradeOpts = (sel) => opts(GRADES, sel, g => OEG.gradeLabel(g));
  const typeOpts = (sel) => opts(TYPES, sel, t => OEG.typeLabel(t));
  const subjOpts = (sel) => opts(SUBJECTS, sel, s => OEG.subjectLabel(s));

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

  function render(root) {
    const gh = OEG.state.gh, cfg = OEG.state.config;
    root.innerHTML = `
    <div class="page-head"><h1>🛠️ ${OEG.t("page.admin")}</h1>
      <p><span class="status-dot ${OEG.gh.connected() ? "on" : "off"}"></span>
      ${OEG.gh.connected() ? OEG.t("admin.connected") + ": " + OEG.esc(gh.owner + "/" + gh.repo) : OEG.t("admin.notConnected")}</p></div>

    <div class="admin-grid">
      <!-- GitHub Connect -->
      <section class="panel">
        <h3>🔗 ${OEG.t("admin.connect")}</h3>
        <div class="field"><label>${OEG.t("admin.owner")}</label><input id="ghOwner" value="${OEG.esc(gh.owner)}" placeholder="OnlineEducationGuru"></div>
        <div class="field"><label>${OEG.t("admin.repo")}</label><input id="ghRepo" value="${OEG.esc(gh.repo)}" placeholder="OEG"></div>
        <div class="field"><label>${OEG.t("admin.branch")}</label><input id="ghBranch" value="${OEG.esc(gh.branch)}" placeholder="main"></div>
        <div class="field"><label>${OEG.t("admin.token")}</label><input id="ghToken" type="password" autocomplete="off">
          <button type="button" class="linklike" id="ghHelpBtn">${OEG.t("admin.howTo")}</button>
          <div class="help-box" id="ghHelp" style="display:none">${OEG.t("admin.howBody")}</div></div>
        <div class="alert alert-info">${OEG.t("admin.tokenNote")}</div>
        <button class="btn btn-brand" id="ghConnect">${OEG.t("admin.connect")}</button>
        <div id="ghMsg" style="margin-top:12px"></div>
      </section>

      <!-- Upload -->
      <section class="panel">
        <h3>📤 ${OEG.t("admin.uploadTitle")}</h3>
        <div class="field"><label>${OEG.t("admin.file")}</label><input id="upFile" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.html,.htm,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip"></div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.type")}</label><select id="upType">${typeOpts("post")}</select></div>
          <div class="field"><label>${OEG.t("admin.grade")}</label><select id="upGrade">${gradeOpts("all")}</select></div>
        </div>
        <div class="field"><label>${OEG.t("admin.folder")}</label><input id="upFolder" value="uploads/misc"></div>
        <button class="btn btn-brand" id="upBtn">${OEG.t("btn.upload")}</button>
        <div class="progress hidden" id="upProg"><div></div></div>
        <div id="upMsg" style="margin-top:12px"></div>
      </section>

      <!-- Post / Material editor -->
      <section class="panel">
        <h3>✍️ ${OEG.t("admin.postTitle")}</h3>
        <div class="field"><label>${OEG.t("admin.title")}</label><input id="pTitleGu"></div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.titleHi")}</label><input id="pTitleHi"></div>
          <div class="field"><label>${OEG.t("admin.titleEn")}</label><input id="pTitleEn"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.type")}</label><select id="pType">${typeOpts("post")}</select></div>
          <div class="field"><label>${OEG.t("admin.grade")}</label><select id="pGrade">${gradeOpts("all")}</select></div>
        </div>
        <div class="field"><label>${OEG.t("admin.subject")}</label><select id="pSubject">${subjOpts("all")}</select></div>
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
        <button class="btn btn-brand" id="pSave">${OEG.t("btn.save")}</button>
        <div id="pMsg" style="margin-top:12px"></div>
      </section>

      <!-- AdSense -->
      <section class="panel">
        <h3>💰 ${OEG.t("admin.adsense")}</h3>
        <div class="field"><label>${OEG.t("admin.publisher")}</label><input id="adPub" value="${OEG.esc(cfg.adsense.publisherId || "")}" placeholder="ca-pub-XXXXXXXXXXXXXXXX"></div>
        <div class="form-row">
          <div class="field"><label>homeTop Slot</label><input id="adHomeTop" value="${OEG.esc(cfg.adsense.slots.homeTop || "")}"></div>
          <div class="field"><label>homeMid Slot</label><input id="adHomeMid" value="${OEG.esc(cfg.adsense.slots.homeMid || "")}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>sidebar Slot</label><input id="adSidebar" value="${OEG.esc(cfg.adsense.slots.sidebar || "")}"></div>
          <div class="field"><label>contentBottom Slot</label><input id="adBottom" value="${OEG.esc(cfg.adsense.slots.contentBottom || "")}"></div>
        </div>
        <button class="btn btn-brand" id="adSave">${OEG.t("btn.save")}</button>
        <div id="adMsg" style="margin-top:12px"></div>
      </section>

      <!-- Admin account -->
      <section class="panel">
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

      <!-- Users -->
      <section class="panel">
        <h3>👥 ${OEG.t("admin.users")} <button class="btn btn-outline btn-sm" id="uRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <div class="alert alert-info">${OEG.t("admin.usersNote")}</div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("auth.name")}</label><input id="uName" placeholder="नाम / Name"></div>
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
        </div>
        <button class="btn btn-brand" id="uAdd">➕ ${OEG.t("admin.addUser")}</button>
        <div id="uMsg" style="margin-top:12px"></div>
        <div class="file-list" id="uList" style="margin-top:14px"><p style="color:var(--muted)">—</p></div>
      </section>

      <!-- File manager -->
      <section class="panel">
        <h3>📁 ${OEG.t("admin.files")} <button class="btn btn-outline btn-sm" id="fmRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <div class="file-list" id="fmList"><p style="color:var(--muted)">—</p></div>
      </section>
    </div>`;

    const $ = (id) => root.querySelector("#" + id);
    const msg = (id, text, ok) => { $(id).innerHTML = `<div class="alert ${ok ? "alert-ok" : "alert-error"}">${OEG.esc(text)}</div>`; };
    const needGh = () => { if (!OEG.gh.connected()) { OEG.toast(OEG.t("admin.notConnected")); return false; } return true; };

    $("ghHelpBtn").onclick = () => { const b = $("ghHelp"); b.style.display = b.style.display === "none" ? "block" : "none"; };
    $("ghConnect").onclick = async () => {
      OEG.state.gh.owner = $("ghOwner").value.trim();
      OEG.state.gh.repo = $("ghRepo").value.trim();
      OEG.state.gh.branch = $("ghBranch").value.trim() || "main";
      OEG.state.gh.token = $("ghToken").value.trim();
      $("ghToken").value = "";
      try {
        const info = await OEG.gh.testConnection();
        msg("ghMsg", "✅ " + info.name, true);
        render(root);
      } catch (e) { msg("ghMsg", OEG.t("admin.error") + " " + e.message, false); }
    };

    $("upType").onchange = () => { $("upFolder").value = FOLDERS[$("upType").value] || "uploads/misc"; };
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
        $("pFileUrl").value = OEG.gh.pagesUrl(path);
        msg("upMsg", "✅ " + path, true);
        loadFiles();
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
      try {
        const title = await fillLangs({ gu: $("pTitleGu").value, hi: $("pTitleHi").value, en: $("pTitleEn").value }, true);
        const desc = await fillLangs({ [srcLang]: $("pDesc").value }, true);
        const bodyObj = String($("pBody").value || "").trim() ? await fillLangs({ [srcLang]: $("pBody").value }, true) : "";
        item = {
          id: "item-" + Date.now(),
          type: yt ? "video" : $("pType").value,
          grade: $("pGrade").value,
          subject: $("pSubject").value,
          title, desc, body: bodyObj,
          image: $("pImage").value.trim(),
          fileUrl: yt || encodeURI($("pFileUrl").value.trim()),
          fileType: yt ? "video" : undefined,
          date: new Date().toISOString().slice(0, 10),
          tags: []
        };
        if (!item.title.gu && !item.title.hi && !item.title.en) { msg("pMsg", OEG.t("admin.error") + " title", false); return; }
        const cur = await OEG.gh.getFile("data/catalog.json");
        const catalog = JSON.parse(cur.content);
        catalog.items = catalog.items || [];
        catalog.items.unshift(item);
        catalog.updated = new Date().toISOString().slice(0, 10);
        await OEG.gh.saveCatalog(catalog, `Add: ${item.title.gu || item.title.en}`);
        await OEG.loadCatalog();
        msg("pMsg", "✅ " + OEG.t("admin.saved") + " · 🌐 gu/hi/en", true);
        ["pTitleGu", "pTitleHi", "pTitleEn", "pDesc", "pBody", "pImage", "pFileUrl", "pYoutube"].forEach(id => $(id).value = "");
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

    $("adSave").onclick = async () => {
      if (!needGh()) return;
      try {
        const cur = await OEG.gh.getFile("data/site-config.json");
        const cfg2 = JSON.parse(cur.content);
        cfg2.adsense = {
          publisherId: $("adPub").value.trim(),
          slots: { homeTop: $("adHomeTop").value.trim(), homeMid: $("adHomeMid").value.trim(), sidebar: $("adSidebar").value.trim(), contentBottom: $("adBottom").value.trim() }
        };
        await OEG.gh.saveSiteConfig(cfg2, "Update AdSense config");
        await OEG.loadConfig();
        msg("adMsg", "✅ " + OEG.t("admin.saved"), true);
      } catch (e) { msg("adMsg", OEG.t("admin.error") + " " + e.message, false); }
    };

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
    async function loadUsers() {
      const list = $("uList");
      list.innerHTML = `<p style="color:var(--muted)">…</p>`;
      const data = await OEG.auth.fetchUsers();
      const users = data.users || [];
      list.innerHTML = users.length ? users.map(u => `
        <div class="file-item"><span>👤</span><code>${OEG.esc(u.email)}</code>
        <span class="badge">${OEG.esc(u.role || "user")}</span>
        <span style="color:var(--muted);font-size:.85rem">${OEG.esc(u.name || "")}</span>
        <button class="btn btn-outline btn-sm" data-rp="${OEG.esc(u.email)}">${OEG.t("admin.resetPw")}</button>
        <button class="btn btn-danger btn-sm" data-ru="${OEG.esc(u.email)}">${OEG.t("btn.delete")}</button></div>`).join("")
        : `<p style="color:var(--muted)">${OEG.t("empty.title")}</p>`;
      list.querySelectorAll("[data-ru]").forEach(b => b.onclick = async () => {
        if (!needGh()) return;
        if (OEG.state.user && OEG.state.user.email === b.dataset.ru) { OEG.toast("⛔"); return; }
        if (!confirm(b.dataset.ru)) return;
        try { await OEG.auth.removeUser(b.dataset.ru); loadUsers(); } catch (e) { OEG.toast(e.message); }
      });
      list.querySelectorAll("[data-rp]").forEach(b => b.onclick = async () => {
        if (!needGh()) return;
        const p = prompt(OEG.t("auth.password") + " — " + b.dataset.rp);
        if (!p || p.length < 6) return;
        try { await OEG.auth.resetPassword(b.dataset.rp, p); msg("uMsg", "✅ " + OEG.t("admin.saved"), true); } catch (e) { msg("uMsg", OEG.t("admin.error") + " " + e.message, false); }
      });
    }
    $("uAdd").onclick = async () => {
      if (!needGh()) return;
      const email = $("uEmail").value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg("uMsg", "❌ " + OEG.t("auth.email"), false); return; }
      if (($("uPass").value || "").length < 6) { msg("uMsg", "❌ " + OEG.t("auth.password"), false); return; }
      try {
        await OEG.auth.addUser({ name: $("uName").value.trim() || email.split("@")[0], email, password: $("uPass").value, role: $("uRole").value });
        msg("uMsg", "✅ " + OEG.t("admin.saved"), true);
        ["uName", "uEmail", "uPass"].forEach(id => $(id).value = "");
        loadUsers();
      } catch (e) { msg("uMsg", OEG.t("admin.error") + " " + e.message, false); }
    };
    $("uRefresh").onclick = loadUsers;
    loadUsers();

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
  }

  return { render };
})();
