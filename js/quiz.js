/* ============================================================
   OEG Quiz — પ્રશ્નોત્તરી ઇજન (4 વિકલ્પ, સાચું/ખોટું, પ્રમાણપત્ર)
   data/quiz.json માંથી પ્રશ્નો; Admin Panel માંથી ઉમેર/કાઢી/Excel ઇમ્પોર્ટ
   કેટેગરી પ્રમાણે ધોરણ/વિષય પસંદગી ચાલુ-બંધ (Admin સેટ કરે એમ)
   ============================================================ */
OEG.quiz = (() => {
  const t = () => OEG.t;
  let bank = { v: 2, passPercent: 60, seconds: 45, cats: [], questions: [] };
  let run = null;           /* ચાલતી ક્વિઝની સ્થિતિ */
  let mountEl = null;
  let certCanvas = null;

  const EXAM_KEYS = ["gk", "current", "reasoning", "tat", "htat", "cet", "pet", "tet", "uptet", "reet", "cdet", "gyan", "interview", "oral"];
  /* 🎓 ફક્ત આ ૭ વિષય ધોરણ મુજબ ક્વિઝમાં ખુલે (taxonomy.gradeSubjects) */
  const SUB7 = () => (OEG.tax().gradeSubjects || []).map(x => x.key);
  const isExamCat = (k) => EXAM_KEYS.indexOf(String(k || "").toLowerCase()) >= 0 || /^(10|12)th/.test(String(k || ""));

  /* ---------- લોડ ---------- */
  async function load() {
    try {
      const r = await fetch("data/quiz.json", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j && typeof j === "object") {
          bank = Object.assign(bank, j);
          bank.questions = Array.isArray(j.questions) ? j.questions : [];
          bank.cats = Array.isArray(j.cats) ? j.cats : [];
          const S7 = SUB7().length ? SUB7() : ["gujarati", "hindi", "english", "maths", "science", "social", "sanskrit"];
          bank.questions = bank.questions.map((q) => {
            const o = Object.assign({}, q);
            ["q", "ex", "explain"].forEach((k) => { if (o[k] !== undefined) o[k] = fixQ(o[k]); });
            if (Array.isArray(o.opts)) o.opts = o.opts.map(fixQ);
            /* જૂની રચના: વિષય = મેઈન કેટેગરી → હવે ધોરણ મુજબ કેટેગરી અંદરનું વિષય */
            if (S7.indexOf(o.cat) >= 0) { if (!o.subject || o.subject === "all") o.subject = o.cat; o.cat = "grade"; }
            return o;
          });
        }
      }
    } catch (e) { /* ફાઈલ ન મળે તો ખાલી બેંક */ }
    return bank;
  }
  const fixQ = (v) => (v && typeof v === "object" && !Array.isArray(v))
    ? Object.keys(v).reduce((a, k) => (a[k] = OEG.demojibake(v[k]), a), {})
    : (typeof v === "string" ? OEG.demojibake(v) : v);

  const all = () => bank.questions || [];
  const catSrc = (key) => {
    const inBank = (bank.cats || []).filter(c => c && (c.key || c) === key).pop();
    const inTax = OEG.tax().quizCats.filter(c => c.key === key)[0];
    return Object.assign({}, inTax || {}, inBank || {});
  };
  const flagOf = (key) => { const m = modeOf(key); return { useGrade: m === "grade", useSubject: m === "grade" }; };
  /* કેટેગરી પછી શું દેખાય: "grade" = ધોરણ+વિષય · "sub" = સબ-કેટેગરી · "none" = સીધો ક્વિઝ */
  const normSubs = (list) => (Array.isArray(list) ? list : [])
    .map(x => (typeof x === "string" ? { key: x, label: { gu: x, hi: x, en: x } } : (x && x.key ? x : null)))
    .filter(x => x && /^[\w\-]+$/.test(String(x.key)));
  const modeOf = (key) => {
    const src = catSrc(key);
    if (src.mode === "grade" || src.mode === "sub" || src.mode === "none") return src.mode;
    if (key === "grade") return "grade";
    if (src.useGrade === true) return "grade";          /* જૂની data ફાઈલ સાથે સુસંગત */
    return normSubs(src.subs).length ? "sub" : "none";
  };
  const subsOf = (key) => {
    const out = normSubs(catSrc(key).subs);
    const seen = out.map(x => x.key);
    all().forEach((q) => {
      if ((q.cat || "gk") === key && q.sub && seen.indexOf(q.sub) < 0) { out.push({ key: q.sub, label: { gu: q.sub, hi: q.sub, en: q.sub } }); seen.push(q.sub); }
    });
    return out;
  };
  const subOf = (key, sub) => subsOf(key).filter(x => x.key === sub)[0] || null;
  const subLabel = (key, sub) => { const x = subOf(key, sub); return x ? OEG.taxLabel(x, "subject") : (sub || ""); };
  /* Admin ની યાદી — taxonomy (ક્રમ/icon) + quiz.json (લેબલ/ફ્લેગ) + પ્રશ્નોની કેટેગરી, બધું ભેગું */
  function cats() {
    const tx = OEG.tax().quizCats || [];
    const bc = (bank.cats || []).map(c => (typeof c === "string" ? { key: c } : (c || {})));
    const keys = [];
    const push = (k) => { if (k && keys.indexOf(k) < 0) keys.push(k); };
    tx.forEach(c => push(c && c.key));
    bc.forEach(c => push(c.key));
    all().forEach(q => push(q.cat || "gk"));
    const S7 = SUB7();
    const main = keys.filter(k => !k || (S7.indexOf(k) < 0 || k === "grade"));
    return main.map((key) => {
      const t = tx.filter(c => c.key === key)[0] || {};
      const b = bc.filter(c => c.key === key)[0] || {};
      const s = OEG.tax().subjects.filter(x => x.key === key)[0] || {};
      const mode = modeOf(key);
      return {
        key: key, icon: t.icon || b.icon || s.icon || "🧠",
        label: t.label || b.label || s.label || { gu: key, hi: key, en: key },
        useGrade: mode === "grade", useSubject: mode === "grade", mode: mode, subs: subsOf(key),
        count: countIn(key, "all", "all", "all"),
        praise: t.praise || b.praise || "", certLine: t.certLine || b.certLine || ""
      };
    });
  }
  const catOf = (key) => cats().filter(c => c.key === key)[0] || { key: key, icon: "🧠", mode: modeOf(key), subs: subsOf(key), useGrade: modeOf(key) === "grade", useSubject: modeOf(key) === "grade", count: 0, label: { gu: key, hi: key, en: key } };
  const catLabel = (c) => (c && c.label) ? OEG.taxLabel(c, "subject") : (c && c.key) || "";
  const catIcon = (c) => c.icon || ({ grade: "🎓", gk: "🌍", tat: "📝", htat: "🏫", reasoning: "🧩", current: "📰" }[c.key] || "🧠");

  /* પ્રશ્નનો વિષય: સ્પષ્ટ subject field, નહીં તો subject-કેટેગરી પરથી */
  const subjOf = (q) => (q.subject && q.subject !== "all") ? q.subject : (SUB7().indexOf(q.cat) >= 0 ? q.cat : "");
  const subOf_ = (q) => (q.sub && q.sub !== "all") ? q.sub : "";
  const matches = (q, cat, grade, subject, sub) => {
    if (cat && (q.cat || "gk") !== cat) return false;
    const m = cat ? modeOf(cat) : "none";
    if (m === "grade") {
      if (grade && grade !== "all") {
        const gq = q.grade || "all";
        if (gq !== "all" && gq !== grade) return false;
      }
      if (subject && subject !== "all" && subjOf(q) !== subject) return false;
    } else if (m === "sub") {
      if (sub && sub !== "all" && subOf_(q) !== sub) return false;
    }
    return true;
  };
  const countIn = (key, grade, subject, sub) => all().filter(q => matches(q, key, grade || "all", subject || "all", sub || "all")).length;
  const subCount = (key, sub) => countIn(key, "all", "all", sub);

  function pick(cat, grade, subject, n, sub) {
    let qs = all().filter(q => matches(q, cat, grade || "all", subject || "all", sub || "all")).slice();
    for (let i = qs.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const x = qs[i]; qs[i] = qs[j]; qs[j] = x; }
    return n ? qs.slice(0, n) : qs;
  }

  /* ---------- માઉન્ટ ---------- */
  async function mount(el, opts) {
    mountEl = el;
    if (!all().length) await load();
    opts = opts || {};
    mountEl._sel = null;
    if (opts.cat) {
      const c = catOf(opts.cat);
      if (opts.subject) mountEl._sel = Object.assign(mountEl._sel || {}, { subject: opts.subject });
      if (opts.sub) mountEl._sel = Object.assign(mountEl._sel || {}, { sub: opts.sub });
      const g = c.mode === "grade" ? (opts.grade || "all") : "all";
      const sb = c.mode === "grade" ? (opts.subject || "all") : "all";
      const su = c.mode === "sub" ? (opts.sub || "all") : "all";
      /* નામ વગર પ્રમાણપત્ર અધૂરું રહે — એટલે પહેલા setup માંથી જ નામ લેવો */
      if (!curName()) { mountEl._sel = Object.assign(mountEl._sel || {}, { cat: opts.cat, grade: g, subject: mountEl._sel && mountEl._sel.subject || sb, sub: mountEl._sel && mountEl._sel.sub || su, n: opts.n || 10 }); setup(g); return; }
      start(opts.cat, g, sb, opts.n || 0, su);
    } else setup(opts.grade);
  }

  function paint(html) {
    if (!mountEl) return;
    certCanvas = null;
    mountEl.innerHTML = html;
    bind();
  }

  const nameStore = () => { try { return localStorage.getItem("oeg.qname") || ""; } catch (e) { return ""; } };
  const nameSave = (v) => { try { localStorage.setItem("oeg.qname", v); } catch (e) {} OEG.state.quizName = v; };
  const curName = () => (OEG.state.quizName || nameStore() || (OEG.state.user && OEG.state.user.name) || "").trim();

  /* ---------- સેટ-અપ સ્ક્રીન (નામ + કેટેગરી + [ધોરણ] + [વિષય] + ગણતરી) ---------- */
  function setup(gradePreset) {
    const T = t(), C = cats();
    const st = mountEl._sel || (mountEl._sel = {});
    if (!st.cat || !C.some(c => c.key === st.cat)) st.cat = (C[0] || {}).key;
    if (st.grade === undefined) st.grade = gradePreset && gradePreset !== "all" ? gradePreset : "all";
    if (st.subject === undefined) st.subject = "all";
    if (st.sub === undefined) st.sub = "all";
    if (st.n === undefined) st.n = 10;
    const cur = catOf(st.cat);
    const mode = cur.mode || "none";
    if (mode !== "sub" && st.sub !== "all") st.sub = "all";
    const grades = OEG.tax().grades.filter(g => g.key === "balvatika" || /^\d+$/.test(g.key));
    const subjects = (OEG.tax().gradeSubjects || []).filter(x => x.key !== "all");
    const subs = cur.subs || [];
    const avail = countIn(st.cat, mode === "grade" ? st.grade : "all", mode === "grade" ? st.subject : "all", mode === "sub" ? st.sub : "all");
    return paint(`<div class="quiz-shell quiz-setup">
      <div class="quiz-head"><h2>🧠 ${T("quiz.title")}</h2><p>${T("quiz.setupSub")}</p></div>
      <div class="quiz-picks">
        <div class="quiz-block qz-name"><h3>🧑 ${T("quiz.yourName")}</h3>
          <input id="qzName" class="qz-name-in" maxlength="46" placeholder="${T("quiz.namePh")}" value="${OEG.esc(curName())}" autocomplete="off">
          <p class="qz-hint">🏅 ${T("quiz.nameNote")}</p>
        </div>
        <div class="quiz-block"><h3>📚 ${T("quiz.pickCat")}</h3>
          <div class="chip-row" id="qzCats">${C.map((c) => {
            const m2 = c.mode || "none";
            const tail = m2 === "grade" ? "🎓 " + T("quiz.gradeThenSub") : m2 === "sub" ? "🏷️ " + (c.subs || []).length + " " + T("quiz.subCats") : "🧠 " + T("quiz.directStart");
            return `<button type="button" class="qz-chip ${c.key === st.cat ? "on" : ""}" data-cat="${OEG.esc(c.key)}"><span>${catIcon(c)}</span><b>${OEG.esc(catLabel(c))}</b><small>${c.count} ${T("grade.items")} · ${tail}</small></button>`;
          }).join("")}</div>
        </div>
        ${mode === "grade" ? `<div class="quiz-block"><h3>🎓 ${T("quiz.pickGrade")}</h3>
          <div class="chip-row sm" id="qzGrades">
            <button type="button" class="qz-chip ${st.grade === "all" ? "on" : ""}" data-grade="all"><span>🗂️</span><b>${T("quiz.allGrades")}</b></button>
            ${grades.map(g => `<button type="button" class="qz-chip ${g.key === st.grade ? "on" : ""}" data-grade="${OEG.esc(g.key)}"><span>${g.icon || "🎓"}</span><b>${OEG.gradeLabel(g.key)}</b></button>`).join("")}
          </div></div>` : ""}
        ${mode === "grade" ? `<div class="quiz-block"><h3>📖 ${T("quiz.pickSubject")}</h3>
          <div class="chip-row sm" id="qzSubs">
            <button type="button" class="qz-chip ${st.subject === "all" ? "on" : ""}" data-sub="all"><span>🗂️</span><b>${T("quiz.allSubjects")}</b></button>
            ${subjects.map(x => `<button type="button" class="qz-chip ${x.key === st.subject ? "on" : ""}" data-sub="${OEG.esc(x.key)}"><span>${x.icon || "📘"}</span><b>${OEG.esc(OEG.subjectLabel(x.key))}</b><small>${countIn(st.cat, st.grade, x.key, "all")}</small></button>`).join("")}
          </div></div>` : ""}
        ${mode === "sub" ? `<div class="quiz-block"><h3>🏷️ ${T("quiz.pickSub")}</h3>
          ${subs.length ? `<div class="chip-row sm" id="qzSubCats">
            <button type="button" class="qz-chip ${st.sub === "all" ? "on" : ""}" data-subcat="all"><span>🗂️</span><b>${T("quiz.allSubs")}</b><small>${countIn(st.cat, "all", "all", "all")}</small></button>
            ${subs.map(x => `<button type="button" class="qz-chip ${x.key === st.sub ? "on" : ""}" data-subcat="${OEG.esc(x.key)}"><span>${x.icon || "🏷️"}</span><b>${OEG.esc(OEG.taxLabel(x, "subject"))}</b><small>${subCount(st.cat, x.key)}</small></button>`).join("")}
          </div>` : `<p class="qz-hint">🧠 ${T("quiz.noSubs")}</p>`}
        </div>` : ""}
        <div class="quiz-block"><h3>🔢 ${T("quiz.count")}</h3>
          <div class="chip-row sm" id="qzN">
            ${[5, 10, 15, 0].map((n) => `<button type="button" class="qz-chip ${Number(st.n) === n ? "on" : ""}" data-n="${n}"><b>${n || T("grade.all")}</b></button>`).join("")}
          </div></div>
      </div>
      <div class="quiz-foot">
        <span class="qz-avail">${avail ? avail + " " + T("grade.items") : "🚧 " + T("quiz.noQuestions")} · ${T("quiz.passLine")} ${passPct()}% · ⏱ ${seconds()}s</span>
        <button class="btn btn-brand btn-lg" id="qzStart" ${avail ? "" : "disabled"}>▶ ${T("quiz.start")}</button>
      </div>
    </div>`);
  }

  /* ---------- ચાલુ ક્વિઝ ---------- */
  function start(cat, grade, subject, n, sub) {
    const C = t(), c = catOf(cat);
    const m = c.mode || "none";
    const g = m === "grade" ? (grade || "all") : "all";
    const s = m === "grade" ? (subject || "all") : "all";
    const su = m === "sub" ? (sub || "all") : "all";
    const name = curName();
    const qs = pick(cat, g, s, n, su);
    if (!qs.length) {
      paint(`<div class="quiz-shell panel" style="text-align:center;padding:44px 20px">
        <div style="font-size:2.6rem">📭</div><h3>${C("quiz.noQuestions")}</h3>
        <div style="margin-top:14px"><button class="btn btn-outline" id="qzBack">← ${C("quiz.back")}</button></div></div>`);
      return;
    }
    run = { cat: cat, grade: g, subject: s, sub: su, name: name, qs: qs, i: 0, marks: [], t0: Date.now(), best: 0, streak: 0, timer: null, left: 0 };
    question();
  }

  function seconds() { return Math.max(10, Number(bank.seconds) || 45); }
  const passPct = () => Math.min(100, Math.max(1, Number(bank.passPercent) || 60));
  const certOn = () => !bank.cert || bank.cert.enabled !== false;

  function question() {
    const C = t(), q = run.qs[run.i], total = run.qs.length;
    const opts = (q.opts || []).slice(0, 4);
    const pct = Math.round((run.i / total) * 100);
    const catKey = q.cat || run.cat;
    clearInterval(run.timer);
    run.left = seconds();
    const sub = subjOf(q);
    paint(`<div class="quiz-shell quiz-run">
      <div class="qz-top">
        <div class="qz-prog"><i style="width:${pct}%"></i></div>
        <div class="qz-toprow">
          <span class="qz-pill">${C("quiz.q")} ${run.i + 1} ${C("quiz.of")} ${total}</span>
          <span class="qz-pill">🏷️ ${OEG.esc(catLabel(catOf(catKey)))}</span>
          ${catOf(catKey).mode === "grade" && q.grade && q.grade !== "all" ? `<span class="qz-pill">🎓 ${OEG.gradeLabel(q.grade)}</span>` : ""}
          ${catOf(catKey).mode === "sub" && q.sub ? `<span class="qz-pill">🏷️ ${OEG.esc(subLabel(catKey, q.sub))}</span>` : ""}
          ${sub ? `<span class="qz-pill">📘 ${OEG.esc(OEG.subjectLabel(sub))}</span>` : ""}
          ${q.diff ? `<span class="qz-pill">${C("quiz.level")}: ${C("admin.diff" + q.diff.charAt(0).toUpperCase() + q.diff.slice(1))}</span>` : ""}
          <span class="qz-pill qz-time" id="qzTime">⏱ <b>${run.left}</b>s</span>
          <span class="qz-pill qz-score">✅ ${run.marks.filter(m => m === 1).length}</span>
        </div>
      </div>
      <div class="qz-question"><h2>${OEG.esc(OEG.langField(q.q || q.text) || "")}</h2></div>
      <div class="qz-opts" id="qzOpts">
        ${opts.map((o, i) => `<button type="button" class="qz-opt" data-i="${i}">
            <span class="qz-key">${"ABCD"[i]}</span><span class="qz-ot">${OEG.esc(OEG.langField(o) || "")}</span></button>`).join("")}
      </div>
      <div id="qzFeed"></div>
      <div class="qz-bar"><button class="btn btn-outline" id="qzSkip">${C("quiz.skip")}</button>
        <button class="btn btn-brand" id="qzNext" disabled>${run.i + 1 === total ? C("quiz.finish") : C("quiz.next")} →</button></div>
    </div>`);
    run.timer = setInterval(tick, 1000);
  }

  function tick() {
    run.left--;
    const el = document.getElementById("qzTime");
    if (el) { el.innerHTML = "⏱ <b>" + Math.max(0, run.left) + "</b>s"; if (run.left <= 10) el.classList.add("low"); }
    if (run.left <= 0) { clearInterval(run.timer); answer(-1, true); }
  }

  /* ---------- જવાબ ---------- */
  function answer(i, timedOut) {
    clearInterval(run.timer);
    const C = t(), q = run.qs[run.i], correct = Number(q.a != null ? q.a : q.answer);
    const ok = i === correct;
    run.marks[run.i] = ok ? 1 : 0;
    run.streak = ok ? run.streak + 1 : 0;
    run.best = Math.max(run.best, run.streak);
    const opts = (q.opts || []).slice(0, 4);
    document.querySelectorAll("#qzOpts .qz-opt").forEach(b => {
      const bi = Number(b.dataset.i);
      b.disabled = true;
      if (bi === correct) b.classList.add("right");
      else if (bi === i) b.classList.add("wrong");
    });
    const feed = document.getElementById("qzFeed");
    if (feed) {
      const ex = OEG.langField(q.ex || q.explain);
      feed.innerHTML = `<div class="qz-feed ${ok ? "ok" : "no"}">
        <b>${timedOut ? "⏱ " + C("quiz.timeUp") : ok ? "✅ " + C("quiz.correct") : "❌ " + C("quiz.wrong")}</b>
        ${ok || !opts[correct] ? "" : `<div class="qz-ans">${C("quiz.answer")}: <b>${OEG.esc(OEG.langField(opts[correct]))}</b></div>`}
        ${ex ? `<div class="qz-ex">${C("quiz.explain")}: ${OEG.esc(ex)}</div>` : ""}
        <div class="qz-streak">🔥 ${C("quiz.streak")}: ${run.best}</div></div>`;
    }
    const nx = document.getElementById("qzNext");
    if (nx) nx.disabled = false;
  }

  function next() {
    run.i++;
    if (run.i >= run.qs.length) result();
    else question();
  }

  /* ---------- પરિણામ + પ્રમાણપત્ર ---------- */
  function certId(name, pct) {
    const src = (name || "guest") + "|" + pct + "|" + new Date().toISOString().slice(0, 10);
    let h = 5381;
    for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) >>> 0;
    return "OEG-" + h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
  }

  function result() {
    clearInterval(run.timer);
    const C = t(), total = run.qs.length;
    const right = run.marks.filter(m => m === 1).length;
    const pct = Math.round((right / total) * 100);
    const passed = pct >= passPct();
    const secs = Math.max(1, Math.round((Date.now() - run.t0) / 1000));
    const cat = catOf(run.cat);
    const verdict = pct >= 90 ? C("quiz.great") : passed ? C("quiz.good") : C("quiz.keepTrying");
    const cid = certId(run.name, pct);
    run.last = { right: right, total: total, pct: pct, passed: passed, cid: cid, name: run.name, cat: cat, grade: run.grade, subject: run.subject, sub: run.sub };
    paint(`<div class="quiz-shell quiz-result">
      <div class="qr-top">
        <div class="qr-ring ${passed ? "pass" : "fail"}" style="--p:${pct}"><b>${pct}%</b></div>
        <div class="qr-info">
          <h2>${passed ? "🎉 " + C("quiz.passed") : "💪 " + C("quiz.failed")}</h2>
          <p class="qr-verdict">${verdict}</p>
          <div class="qr-rows">
            <div><span>${C("quiz.right")}</span><b>${right}/${total}</b></div>
            <div><span>${C("quiz.wrongCount")}</span><b>${total - right}</b></div>
            <div><span>${C("quiz.passLine")}</span><b>${passPct()}%</b></div>
            <div><span>${C("quiz.streak")}</span><b>${run.best}</b></div>
            <div><span>${C("quiz.time")}</span><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}</b></div>
            <div><span>${C("quiz.level")}</span><b>${OEG.esc(catLabel(cat))}${run.sub && run.sub !== "all" ? " · " + OEG.esc(subLabel(run.cat, run.sub)) : ""}</b></div>
          </div>
          <p class="qr-name">🧑 ${OEG.esc(run.name || C("quiz.certGuest"))}
            <button type="button" class="qz-link" id="qzEditName">✏️ ${C("quiz.changeName")}</button></p>
          ${passed ? `<p class="qr-ok">✅ ${C("quiz.certOk")}</p>` : `<p class="qr-no">🎯 ${C("quiz.need")} ${passPct()}% — ${C("quiz.certNo")}</p>`}
        </div>
      </div>
      <div class="qz-bar center">
        <button class="btn btn-brand" id="qzAgain">🔄 ${C("quiz.playAgain")}</button>
        <button class="btn btn-outline" id="qzReview">📋 ${C("quiz.review")}</button>
        <button class="btn btn-outline" id="qzBack">← ${C("quiz.back")}</button>
        ${passed && certOn() ? `<button class="btn btn-gold" id="qzCert">🏅 ${C("quiz.cert")}</button>` : ""}
      </div>
      <div id="qzCertMount"></div>
      ${passed ? `<div class="share-row" id="qzShare">${resultShare(pct, cat)}</div>` : ""}
    </div>`);
    if (passed && certOn()) certificate();
  }

  function resultShare(pct, cat) {
    const url = encodeURIComponent(OEG.shareUrl()), title = encodeURIComponent("🧠 " + OEG.siteName() + " — " + OEG.langField(cat.label || cat.key) + " " + pct + "% · Online Education Guru");
    const C = t();
    return `<span class="share-label">${C("quiz.share")}:</span>
      <a class="share-btn" target="_blank" rel="noopener" href="https://wa.me/?text=${title}%20${url}">📲 WhatsApp</a>
      <a class="share-btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=${url}&text=${title}">✈️ Telegram</a>
      <a class="share-btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${url}">👍 ${C("share.facebook")}</a>
      <button class="share-btn" data-copy="${OEG.esc(decodeURIComponent(url))}">🔗 ${C("btn.copyLink")}</button>`;
  }

  /* ---------- પ્રમાણપત્ર (canvas = એ જ PDF/Image) ---------- */
  function certData() {
    const L = run.last;
    const cc = bank.cert || {};
    return {
      name: L.name, cat: L.cat, catLabel: catLabel(L.cat), grade: L.grade, subject: L.subject,
      subjectLabel: L.subject && L.subject !== "all" ? OEG.subjectLabel(L.subject) : (L.sub && L.sub !== "all" ? subLabel(L.cat && L.cat.key, L.sub) : ""),
      subKey: L.sub && L.sub !== "all" ? L.sub : "",
      subjectKey: L.sub && L.sub !== "all" ? L.sub : "",
      right: L.right, total: L.total, pct: L.pct, pass: passPct(), id: L.cid,
      title: cc.title, sub: cc.subtitle, footer: cc.footer, issuer: cc.issuer,
      awarded: L.cat.certLine, praise: L.cat.praise,
      showUrl: cc.showUrl !== false, showSeal: cc.showSeal !== false, showScore: cc.showScore !== false
    };
  }
  async function certificate() {
    const C = t(), host = mountEl.querySelector("#qzCertMount");
    if (!host) return;
    host.innerHTML = `<div class="cert-wrap reveal in">
        <div class="cert-card"><canvas id="certCanvas" class="cert-canvas" aria-label="${C("quiz.certTitle")}"></canvas></div>
        <div class="qz-bar center no-print cert-actions">
          <button class="btn btn-brand" id="certPdf">📄 ${C("quiz.certPdf")}</button>
          <button class="btn btn-outline" id="certImg">🖼️ ${C("quiz.certImg")}</button>
          <button class="btn btn-gold" id="certShareFile">📤 ${C("quiz.certShareFile")}</button>
          <button class="btn btn-outline" id="certClose">✕</button>
        </div>
        <p class="qz-hint center no-print">${C("quiz.certNote")}</p>
      </div>`;
    const cv = host.querySelector("#certCanvas");
    certCanvas = cv;
    const I = await OEG.cert.render(cv, certData());
    run.last.name = I.name;
    host.querySelectorAll("#certPdf,#certImg,#certShareFile").forEach(b => {
      b.onclick = async () => {
        const old = b.textContent;
        b.disabled = true; b.textContent = "⏳ " + C("quiz.certBusy");
        try {
          if (b.id === "certShareFile") {
            const r = await OEG.cert.share(cv, OEG.cert.info(certData()));
            if (r === "cancel") OEG.toast(C("quiz.certCancel"));
            else if (r === "saved") OEG.toast(C("quiz.certSaved"));
          } else {
            await OEG.cert.download(cv, OEG.cert.info(certData()), b.id === "certPdf" ? "pdf" : "png");
            OEG.toast(C("quiz.certSaved"));
          }
        } catch (e) { OEG.toast("⚠️ " + (e && e.message ? e.message : C("quiz.certFail"))); }
        b.disabled = false; b.textContent = old;
      };
    });
    host.querySelector("#certClose").onclick = () => { host.innerHTML = ""; certCanvas = null; };
    host.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function changeName() {
    const C = t();
    const v = prompt(C("quiz.yourName"), run.last.name || curName());
    if (v === null) return;
    run.last.name = v.trim(); run.name = v.trim(); nameSave(v.trim());
    result();
  }

  function review() {
    const C = t();
    const rows = run.qs.map((q, i) => {
      const opts = (q.opts || []).slice(0, 4);
      const correct = Number(q.a != null ? q.a : q.answer);
      return `<div class="rv-row ${run.marks[i] ? "rv-ok" : "rv-no"}">
        <div class="rv-n">${i + 1}</div>
        <div class="rv-b"><b>${OEG.esc(OEG.langField(q.q || q.text) || "")}</b>
          <div class="rv-opts">${opts.map((o, j) => `<span class="${j === correct ? "rv-right" : ""}">${"ABCD"[j]}. ${OEG.esc(OEG.langField(o) || "")}</span>`).join("")}</div>
        </div></div>`;
    }).join("");
    mountEl.querySelector(".quiz-shell").innerHTML = `<div class="qz-top"><div class="qz-toprow">
        <span class="qz-pill">📋 ${C("quiz.review")}</span></div></div>
      <div class="rv-list">${rows}</div>
      <div class="qz-bar"><button class="btn btn-outline" id="rvBack">← ${C("quiz.score")}</button></div>`;
    mountEl.querySelector("#rvBack").onclick = result;
  }

  /* ---------- બાઇન્ડ ---------- */
  function bind() {
    if (!mountEl) return;
    const q = (s) => mountEl.querySelector(s);
    const st = mountEl._sel || (mountEl._sel = {});
    mountEl.querySelectorAll("#qzCats .qz-chip").forEach(b => {
      b.onclick = () => { st.cat = b.dataset.cat; setup(st.grade); };
    });
    mountEl.querySelectorAll("#qzGrades .qz-chip").forEach(b => {
      b.onclick = () => { st.grade = b.dataset.grade; setup(st.grade); };
    });
    mountEl.querySelectorAll("#qzSubs .qz-chip").forEach(b => {
      b.onclick = () => { st.subject = b.dataset.sub; setup(st.grade); };
    });
    mountEl.querySelectorAll("#qzN .qz-chip").forEach(b => {
      b.onclick = () => { st.n = Number(b.dataset.n); setup(st.grade); };
    });
    mountEl.querySelectorAll("#qzSubCats .qz-chip").forEach(b => {
      b.onclick = () => { st.sub = b.dataset.subcat; setup(st.grade); };
    });
    const nm = q("#qzName");
    if (nm) nm.oninput = () => { nameSave(nm.value.trim()); };
    if (q("#qzStart")) q("#qzStart").onclick = () => {
      if (nm) nameSave(nm.value.trim());
      const m = c2mode(st.cat);
      start(st.cat, m === "grade" ? st.grade : "all", m === "grade" ? st.subject : "all", st.n, m === "sub" ? st.sub : "all");
    };
    if (q("#qzBack")) q("#qzBack").onclick = () => { mountEl._sel = { cat: run ? run.cat : st.cat, grade: run ? run.grade : st.grade, subject: run ? run.subject : st.subject, sub: run ? run.sub : st.sub, n: st.n }; setup(mountEl._sel.grade); };
    if (q("#qzOpts")) mountEl.querySelectorAll("#qzOpts .qz-opt").forEach(b => b.onclick = () => answer(Number(b.dataset.i), false));
    if (q("#qzNext")) q("#qzNext").onclick = next;
    if (q("#qzSkip")) q("#qzSkip").onclick = () => answer(-2, false);
    if (q("#qzAgain")) q("#qzAgain").onclick = () => start(run.cat, run.grade, run.subject, run.qs.length, run.sub);
    if (q("#qzReview")) q("#qzReview").onclick = review;
    if (q("#qzCert")) q("#qzCert").onclick = certificate;
    if (q("#qzEditName")) q("#qzEditName").onclick = changeName;
    mountEl.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); OEG.toast(t()("btn.copied")); } catch (e) {}
    });
  }

  const c2mode = (key) => modeOf(key);

  /* ---------- Admin માટે helper ---------- */
  const raw = () => bank;
  async function save(newBank) {
    if (newBank) bank = newBank;
    return OEG.data.writeJson("data/quiz.json", bank, "quiz: update questions via admin");
  }
  /* Admin ટૂલ: કેટેગરી ફ્લેગ + પ્રશ્નો બદલો (એક જ જગ્યાએથી લખાય) */
  function mutate(fn) { const next = fn(Object.assign({}, bank, { cats: (bank.cats || []).slice(), questions: (bank.questions || []).slice() })) || bank; bank = next; return next; }

  return { load, mount, raw, save, mutate, pick, cats, catOf, flagOf, isExamCat, subjOf, countIn, subCount, passPct, seconds, certOn, all, matches, modeOf, subsOf, subLabel, normSubs };
})();
