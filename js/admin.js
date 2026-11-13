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
  const gradeOpts = (sel) => opts(gradeList(), sel, g => OEG.gradeLabel(g));
  const typeOpts = (sel) => opts(typeList(), sel, t => (OEG.typeIcon(t) ? OEG.typeIcon(t) + " " : "") + OEG.typeLabel(t));
  const subjOpts = (sel) => opts(subjList(), sel, s => OEG.subjectLabel(s));

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
        <div class="field"><label class="chk"><input type="checkbox" id="ghRemember" checked> ${OEG.t("admin.remember")}</label>
          <span class="vault-state" id="ghVault">${OEG.auth.hasSecret() ? OEG.t("admin.deviceSaved") : OEG.t("admin.deviceNone")}
          ${OEG.auth.hasSecret() ? `<button type="button" class="linklike" id="ghForget">${OEG.t("admin.forgetBtn")}</button>` : ""}</span>
          <span class="vault-warn">${OEG.t("admin.rememberWarn")}</span></div>
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

      <!-- 🎬 YouTube — ફક્ત લિંક -->
      <section class="panel">
        <h3>🎬 ${OEG.t("yt.byUrl")}</h3>
        <div class="alert alert-info">🔒 ${OEG.t("yt.byUrlNote")}</div>
        <div class="field"><label>${OEG.t("admin.youtube")}</label><input id="ytUrl" placeholder="https://www.youtube.com/watch?v=…"></div>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.grade")}</label><select id="ytGrade">${gradeOpts("all")}</select></div>
          <div class="field"><label>${OEG.t("admin.subject")}</label><select id="ytSubject">${subjOpts("all")}</select></div>
        </div>
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
      <section class="panel">
        <h3>🗂️ ${OEG.t("admin.items")} <button class="btn btn-outline btn-sm" id="itRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <div class="form-row">
          <div class="field"><label>${OEG.t("nav.search")}</label><input id="itSearch" placeholder="…"></div>
          <div class="field"><label>${OEG.t("admin.catTab")}</label><select id="itType"><option value="all">${OEG.t("filter.all")}</option>${typeOpts("all")}</select></div>
        </div>
        <div class="file-list" id="itList"><p style="color:var(--muted)">—</p></div>
      </section>

      <!-- 🏷️ Taxonomy -->
      <section class="panel">
        <h3>🏷️ ${OEG.t("admin.tax")}</h3>
        <div class="alert alert-info">${OEG.t("admin.taxNote")}</div>
        <div class="tax-cols">
          <div>
            <h4>${OEG.t("admin.catTab")}</h4>
            <div id="taxTypes"></div>
            <div class="field"><label>${OEG.t("admin.newKey")}</label><input id="taxTypeKey" placeholder="notes"></div>
            <div class="field"><label>${OEG.t("admin.newLabel")}</label><input id="taxTypeLabel" placeholder="નોંસ બુક"></div>
            <div class="form-row">
              <div class="field"><label>${OEG.t("admin.newIcon")}</label><input id="taxTypeIcon" placeholder="🗒️"></div>
              <div class="field"><label>${OEG.t("admin.newRoute")}</label><input id="taxTypeRoute" placeholder="notes"></div>
            </div>
            <button class="btn btn-brand btn-sm" id="taxAddType">➕ ${OEG.t("admin.addCat")}</button>
          </div>
          <div>
            <h4>${OEG.t("admin.gradeTab")}</h4>
            <div id="taxGrades"></div>
            <div class="field"><label>${OEG.t("admin.newKey")}</label><input id="taxGradeKey" placeholder="9"></div>
            <div class="field"><label>${OEG.t("admin.newLabel")}</label><input id="taxGradeLabel" placeholder="ધોરણ ૯"></div>
            <div class="field"><label>${OEG.t("admin.newIcon")}</label><input id="taxGradeIcon" placeholder="9️⃣"></div>
            <button class="btn btn-brand btn-sm" id="taxAddGrade">➕ ${OEG.t("admin.addGrade")}</button>
          </div>
          <div>
            <h4>${OEG.t("admin.quizCats")}</h4>
            <div id="taxQz"></div>
            <div class="field"><label>${OEG.t("admin.newKey")}</label><input id="taxQzKey" placeholder="cet"></div>
            <div class="field"><label>${OEG.t("admin.newLabel")}</label><input id="taxQzLabel" placeholder="CET"></div>
            <div class="field"><label>${OEG.t("admin.newIcon")}</label><input id="taxQzIcon" placeholder="🎯"></div>
            <button class="btn btn-brand btn-sm" id="taxAddQz">➕ ${OEG.t("admin.addQuizCat")}</button>
          </div>
        </div>
        <div id="taxMsg" style="margin-top:12px"></div>
      </section>

      <!-- 🧠 Quiz manager -->
      <section class="panel">
        <h3>🧠 ${OEG.t("admin.qManager")} <button class="btn btn-outline btn-sm" id="qzRefresh" style="margin-left:auto">${OEG.t("admin.refresh")}</button></h3>
        <div class="form-row">
          <div class="field"><label>${OEG.t("admin.qCat")}</label><select id="qzCat">${opts((OEG.tax().quizCats || []).map(c => c.key), "gk")}</select></div>
          <div class="field"><label>${OEG.t("admin.qGrade")}</label><select id="qzGrade">${gradeOpts("all")}</select></div>
        </div>
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
      </section>

      <!-- 💰 AdSense + 🔎 SEO -->
      <section class="panel">
        <h3>💰 ${OEG.t("admin.adsense")}</h3>
        <div class="alert alert-info">📢 ${OEG.t("ads.autoNote")}<br>${OEG.t("ads.everywhere")}</div>
        <div class="field"><label>${OEG.t("admin.publisher")}</label><input id="adPub" value="${OEG.esc((cfg.adsense && cfg.adsense.publisherId) || "")}" placeholder="ca-pub-XXXXXXXXXXXXXXXX"></div>
        <div class="form-row">
          <div class="field"><label class="chk"><input type="checkbox" id="adOn" ${!cfg.adsense || cfg.adsense.enabled !== false ? "checked" : ""}> Ads ચાલુ</label></div>
          <div class="field"><label class="chk"><input type="checkbox" id="adAuto" ${!cfg.adsense || cfg.adsense.autoAds !== false ? "checked" : ""}> Auto ads</label></div>
        </div>
        <div class="form-row">
          <div class="field"><label>homeTop Slot</label><input id="adHomeTop" value="${OEG.esc(((cfg.adsense || {}).slots || {}).homeTop || "")}"></div>
          <div class="field"><label>homeMid Slot</label><input id="adHomeMid" value="${OEG.esc(((cfg.adsense || {}).slots || {}).homeMid || "")}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>sidebar Slot</label><input id="adSidebar" value="${OEG.esc(((cfg.adsense || {}).slots || {}).sidebar || "")}"></div>
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

      <section class="panel">
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
      const editing = editId && OEG.byId(editId);
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
        if (editing) {
          const at = catalog.items.findIndex(x => x.id === editId);
          item.id = editId;
          item.date = catalog.items[at] && catalog.items[at].date;
          item.seo = catalog.items[at] && catalog.items[at].seo;
          if (at >= 0) catalog.items[at] = item; else catalog.items.unshift(item);
        } else catalog.items.unshift(item);
        catalog.updated = new Date().toISOString().slice(0, 10);
        await OEG.gh.saveCatalog(catalog, (editing ? "Update: " : "Add: ") + (item.title.gu || item.title.en));
        await OEG.loadCatalog();
        msg("pMsg", "✅ " + OEG.t("admin.saved") + " · 🌐 gu/hi/en", true);
        ["pTitleGu", "pTitleHi", "pTitleEn", "pDesc", "pBody", "pImage", "pFileUrl", "pYoutube"].forEach(id => $(id).value = "");
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
      await OEG.loadConfig();
      return cfg2;
    }
    const adIds = { homeTop: "adHomeTop", homeMid: "adHomeMid", sidebar: "adSidebar", contentBottom: "adBottom" };
    $("adSave").onclick = async () => {
      if (!needGh()) return;
      try {
        await patchConfig((cfg2) => {
          const slots = Object.assign({}, (cfg2.adsense || {}).slots || {});
          Object.keys(adIds).forEach(k => { slots[k] = $(adIds[k]).value.trim(); });
          root.querySelectorAll("[data-adslot]").forEach(inp => { slots[inp.dataset.adslot] = inp.value.trim(); });
          cfg2.adsense = {
            publisherId: $("adPub").value.trim(),
            enabled: $("adOn") ? $("adOn").checked : true,
            autoAds: $("adAuto") ? $("adAuto").checked : true,
            slots: slots
          };
        }, "Update AdSense config");
        msg("adMsg", "✅ " + OEG.t("admin.saved") + " · " + OEG.t("ads.everywhere"), true);
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
        msg("seoMsg", "✅ " + OEG.t("seo.saved"), true);
      } catch (e) { msg("seoMsg", OEG.t("admin.error") + " " + e.message, false); }
    };

    /* ---------- 🏷️ Taxonomy: ઉમેર / કાઢી નાખો ---------- */
    async function writeTax(mutate, okMsg) {
      if (!needGh()) return;
      const box = $("taxMsg");
      try {
        await patchConfig((cfg2) => {
          cfg2.taxonomy = Object.assign({ types: [], grades: [], subjects: [], gradeSubjects: [], quizCats: [] }, cfg2.taxonomy || {});
          mutate(cfg2.taxonomy);
        }, "tax: update");
        await OEG.loadCatalog().catch(() => {});
        box.innerHTML = `<div class="alert alert-ok">✅ ${OEG.esc(okMsg)}</div>`;
        renderTax(root);
      } catch (e) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message)}</div>`; }
    }
    const inUse = (kind, key) => {
      const items = OEG.state.catalog || [];
      if (kind === "types") return items.filter(i => i.type === key);
      if (kind === "grades") return items.filter(i => i.grade === key);
      return [];
    };
    const dupMsg = (box) => { box.innerHTML = `<div class="alert alert-info">⚠️ ${OEG.esc(OEG.t("admin.dupExists"))}</div>`; };
    const keyOk = (k) => /^[a-z][a-z0-9-]{0,20}$/.test(k);

    $("taxAddType").onclick = () => {
      const box = $("taxMsg");
      const key = $("taxTypeKey").value.trim().toLowerCase().replace(/\s+/g, "-");
      const label = $("taxTypeLabel").value.trim();
      if (!keyOk(key)) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(OEG.t("admin.newKey"))}: a–z, 0–9, - </div>`; return; }
      if ((OEG.tax().types || []).some(x => x.key === key) || (OEG.tax().types || []).some(x => (x.label && x.label.gu) === label && label)) { dupMsg(box); return; }
      const route = $("taxTypeRoute").value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || key + "s";
      writeTax((tx) => {
        tx.types = (tx.types && tx.types.length ? tx.types : null) || OEG.tax().types;
        tx.types.push({ key, icon: $("taxTypeIcon").value.trim() || "📄", route, label: { gu: label || key, hi: label || key, en: label || key } });
      }, OEG.t("admin.taxSaved") + " · " + label);
    };
    $("taxAddGrade").onclick = () => {
      const box = $("taxMsg");
      const key = $("taxGradeKey").value.trim().toLowerCase().replace(/\s+/g, "-");
      const label = $("taxGradeLabel").value.trim();
      if (!keyOk(key) && !/^\d+$/.test(key)) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(OEG.t("admin.newKey"))}</div>`; return; }
      if ((OEG.tax().grades || []).some(x => x.key === key) || (OEG.tax().grades || []).some(x => (x.label && x.label.gu) === label && label)) { dupMsg(box); return; }
      writeTax((tx) => {
        tx.grades = (tx.grades && tx.grades.length ? tx.grades : null) || OEG.tax().grades;
        const at = tx.grades.findIndex(x => x.key === "all");
        const obj = { key, icon: $("taxGradeIcon").value.trim() || "🎓", label: { gu: label || key, hi: label || key, en: label || key } };
        if (at >= 0) tx.grades.splice(at, 0, obj); else tx.grades.push(obj);
      }, OEG.t("admin.taxSaved") + " · " + label);
    };
    $("taxAddQz").onclick = () => {
      const box = $("taxMsg");
      const key = $("taxQzKey").value.trim().toLowerCase().replace(/\s+/g, "-");
      const label = $("taxQzLabel").value.trim();
      if (!keyOk(key)) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(OEG.t("admin.newKey"))}</div>`; return; }
      if ((OEG.tax().quizCats || []).some(x => x.key === key) || (OEG.tax().quizCats || []).some(x => (x.label && x.label.gu) === label && label)) { dupMsg(box); return; }
      writeTax((tx) => {
        tx.quizCats = (tx.quizCats && tx.quizCats.length ? tx.quizCats : null) || OEG.tax().quizCats;
        tx.quizCats.push({ key, icon: $("taxQzIcon").value.trim() || "🧠", label: { gu: label || key, hi: label || key, en: label || key } });
      }, OEG.t("admin.taxSaved") + " · " + label);
    };
    /* quiz sub-cat નું નામ બદલવાનું રાખ્યું છે — ઉમેર/કાઢી બંને ચાલે */
    window.OEG_admin_tax_remove = (kind, key) => {
      const box = $("taxMsg");
      const used = inUse(kind, key);
      if (used.length) { box.innerHTML = `<div class="alert alert-error">⛔ ${OEG.esc(OEG.t("admin.cannotRemove"))} (${used.length})</div>`; return; }
      if (!confirm(OEG.t("admin.delConfirm") + " — " + key + "?")) return;
      writeTax((tx) => {
        const path = kind === "qz" ? "quizCats" : kind;
        tx[path] = (tx[path] && tx[path].length ? tx[path] : OEG.tax()[path]).filter(x => x.key !== key);
      }, OEG.t("admin.deleted") + " · " + key);
    };

    /* ---------- 🧠 Quiz questions ---------- */
    async function saveBank(next, okMsg) {
      if (!needGh()) return;
      const box = $("qzMsg");
      try {
        const cur = await OEG.gh.getFile("data/quiz.json");
        const bank = JSON.parse(cur.content);
        await OEG.data.writeJson("data/quiz.json", next(bank), "quiz: update");
        await OEG.quiz.load();
        box.innerHTML = `<div class="alert alert-ok">✅ ${OEG.esc(okMsg)}</div>`;
        renderQuiz(root);
      } catch (e) { box.innerHTML = `<div class="alert alert-error">❌ ${OEG.esc(e.message)}</div>`; }
    }
    $("qzAdd").onclick = async () => {
      const cat = $("qzCat").value, grade = $("qzGrade").value, diff = $("qzDiff").value;
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
          id: "item-" + Date.now(), type: "video", grade: $("ytGrade").value, subject: $("ytSubject").value,
          title: t3, desc: t3, body: "", image: OEG.yt.thumb(id, "maxresdefault"),
          fileUrl: "https://www.youtube.com/watch?v=" + id, fileType: "video", ytId: id,
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
      renderItems(root);
    }
    async function renderItems(r) {
      const box = r.querySelector("#itList");
      if (!box) return;
      const q = (r.querySelector("#itSearch").value || "").toLowerCase().trim();
      const fType = r.querySelector("#itType").value;
      let items = OEG.state.catalog.slice();
      if (fType !== "all") items = items.filter(i => i.type === fType);
      if (q) items = items.filter(i => (OEG.title(i) + " " + OEG.desc(i) + " " + (i.id || "")).toLowerCase().includes(q));
      box.innerHTML = items.length ? items.slice(0, 40).map(i => `
        <div class="file-item${i.id === editId ? " editing" : ""}"><span>${OEG.typeIcon(i.type)}</span>
          <code title="${OEG.esc(i.id)}">${OEG.esc(String(OEG.title(i) || i.id).slice(0, 54))}</code>
          <span class="badge">${OEG.esc(OEG.typeLabel(i.type))}</span>
          <span class="badge">${OEG.esc(OEG.gradeLabel(i.grade))}</span>
          <a class="btn btn-outline btn-sm" href="#/view/${i.id}" target="_blank" rel="noopener">${OEG.t("btn.view")}</a>
          <button class="btn btn-outline btn-sm" data-edit="${OEG.esc(i.id)}">✏️ ${OEG.t("admin.edit")}</button>
          <button class="btn btn-danger btn-sm" data-del-item="${OEG.esc(i.id)}">🗑 ${OEG.t("admin.delete")}</button></div>`).join("")
        + (items.length > 40 ? `<p style="color:var(--muted);font-size:.84rem">+${items.length - 40}…</p>` : "")
        : `<p style="color:var(--muted)">${OEG.t("empty.title")}</p>`;
      box.querySelectorAll("[data-del-item]").forEach(b => b.onclick = async () => {
        const it = OEG.byId(b.dataset.delItem);
        if (!it) return;
        if (!confirm(OEG.t("admin.delConfirm") + "\n" + OEG.title(it))) return;
        b.textContent = "⏳";
        try {
          await writeCatalog(OEG.state.catalog.filter(x => x.id !== it.id).map(x => x), "Delete item: " + String(OEG.title(it)).slice(0, 40));
          OEG.toast("🗑 " + OEG.t("admin.deleted"));
        } catch (e) { OEG.toast(OEG.t("admin.delFail") + ": " + e.message); b.textContent = "🗑 " + OEG.t("admin.delete"); }
      });
      box.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
        const it = OEG.byId(b.dataset.edit);
        if (!it) return;
        editId = it.id;
        $("pTitleGu").value = it.title && it.title.gu || (typeof it.title === "string" ? it.title : "");
        $("pTitleHi").value = (it.title || {}).hi || "";
        $("pTitleEn").value = (it.title || {}).en || "";
        $("pType").value = it.type || "post";
        $("pGrade").value = it.grade || "all";
        $("pSubject").value = it.subject || "all";
        $("pDesc").value = (it.desc || {}).gu || (typeof it.desc === "string" ? it.desc : "");
        $("pBody").value = (it.body || {}).gu || (typeof it.body === "string" ? it.body : "");
        $("pImage").value = it.image || "";
        $("pYoutube").value = OEG.youtubeId(it.fileUrl) ? it.fileUrl : "";
        $("pFileUrl").value = OEG.youtubeId(it.fileUrl) ? "" : (it.fileUrl || "");
        $("pSave").textContent = "💾 " + OEG.t("admin.update");
        $("pMsg").innerHTML = `<div class="alert alert-info">✏️ ${OEG.esc(OEG.title(it))}</div>`;
        const anchor = $("pSave");
        anchor.scrollIntoView({ behavior: "smooth", block: "center" });
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

    /* ---------- 🏷️ Taxonomy lists ---------- */
    const chipRow = (list, kind, removable) => (list || []).map(x => `
      <div class="tax-row"><span>${x.icon || "•"}</span><b>${OEG.esc(OEG.taxLabel(x, kind === "grades" ? "grade" : kind === "qz" ? "subject" : "type"))}</b><code>${OEG.esc(x.key)}</code>
      ${x.route ? `<small>/${OEG.esc(x.route)}</small>` : ""}
      ${removable && x.key !== "post" && x.key !== "all" ? `<button class="btn btn-danger btn-sm" data-tax="${kind}:${OEG.esc(x.key)}">🗑</button>` : ""}</div>`).join("");
    function renderTax(r) {
      const box = (r || root).querySelector("#taxTypes");
      if (!box) return;
      const tx = OEG.tax();
      box.innerHTML = chipRow(tx.types, "types", true);
      (r || root).querySelector("#taxGrades").innerHTML = chipRow(tx.grades.filter(g => g.key !== "all"), "grades", true);
      (r || root).querySelector("#taxQz").innerHTML = chipRow(tx.quizCats, "qz", true);
      (r || root).querySelectorAll("[data-tax]").forEach(b => b.onclick = () => {
        const parts = b.dataset.tax.split(":");
        window.OEG_admin_tax_remove(parts[0], parts.slice(1).join(":"));
      });
      const s = (r || root).querySelector("#qzCat");
      if (s) s.innerHTML = opts(tx.quizCats.map(c => c.key), s.value || "gk");
      const it = (r || root).querySelector("#itType");
      if (it) it.innerHTML = `<option value="all">${OEG.t("filter.all")}</option>` + tx.types.map(x => `<option value="${x.key}">${x.icon || ""} ${OEG.esc(OEG.typeLabel(x.key))}</option>`).join("");
      /* બાકીની dropdown પણ તરત જ અપડેટ (વર્તમાન પસંદગી રાખીને) */
      const keep = (id, html) => {
        const el = (r || root).querySelector("#" + id);
        if (!el) return;
        const v = el.value;
        el.innerHTML = html;
        if (Array.prototype.some.call(el.options, o => o.value === v)) el.value = v;
      };
      keep("pType", typeOpts((OEG.tax().types[0] || {}).key || "post"));
      keep("upType", typeOpts("post"));
      keep("pGrade", gradeOpts("all"));
      keep("upGrade", gradeOpts("all"));
      keep("pSubject", subjOpts("all"));
    }
    renderTax(root);
    const taxTypeKey0 = $("taxTypeKey");
    if (taxTypeKey0) taxTypeKey0.value = "";

    /* ---------- 🧠 Quiz list ---------- */
    function renderQuiz(r) {
      const box = (r || root).querySelector("#qzList");
      if (!box) return;
      const bank = OEG.quiz.raw();
      const cat = (r || root).querySelector("#qzCat").value;
      (r || root).querySelector("#qzPass").value = bank.passPercent || 60;
      (r || root).querySelector("#qzSec").value = bank.seconds || 45;
      const qs = (bank.questions || []).filter(q => (q.cat || "gk") === cat);
      box.innerHTML = qs.length ? qs.slice(0, 60).map(q => `
        <div class="file-item"><span>${q.diff === "hard" ? "🔥" : q.diff === "medium" ? "⭐" : "🟢"}</span>
          <code>${OEG.esc(String(OEG.langField(q.q)).slice(0, 60))}</code>
          <span class="badge">${OEG.gradeLabel(q.grade)}</span>
          <span class="badge">A-D: ${"ABCD"[q.a]}</span>
          <button class="btn btn-danger btn-sm" data-qd="${OEG.esc(q.id)}">🗑</button></div>`).join("")
        + (qs.length > 60 ? `<p style="color:var(--muted);font-size:.84rem">+${qs.length - 60}…</p>` : "")
        : `<p style="color:var(--muted)">${OEG.t("admin.qNone")}</p>`;
      box.querySelectorAll("[data-qd]").forEach(b => b.onclick = () => window.OEG_admin_qz_del(b.dataset.qd));
    }
    if ($("qzCat")) $("qzCat").onchange = renderQuiz;
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
    if ($("qzRefresh")) $("qzRefresh").onclick = async () => { await OEG.quiz.load(); renderQuiz(root); renderTax(root); renderItems(root); };
    renderQuiz(root);

    /* ---------- 🗂️ Items ---------- */
    if ($("itRefresh")) $("itRefresh").onclick = async () => { await OEG.loadCatalog(); renderItems(root); renderTax(root); };
    if ($("itSearch")) $("itSearch").oninput = () => renderItems(root);
    if ($("itType")) $("itType").onchange = () => renderItems(root);
    renderItems(root);
  }

  return { render };
})();
