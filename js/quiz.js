/* ============================================================
   OEG Quiz — પ્રશ્નોત્તરી ઇજન (4 વિકલ્પ, સાચું/ખોટું, પ્રમાણપત્ર)
   data/quiz.json માંથી પ્રશ્નો; Admin Panel માંથી ઉમેર/કાઢી
   ============================================================ */
OEG.quiz = (() => {
  const t = () => OEG.t;
  let bank = { v: 1, passPercent: 60, seconds: 45, cats: [], questions: [] };
  let run = null;           // ચાલતી ક્વિઝની સ્થિતિ
  let mountEl = null;

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
          if (Array.isArray(bank.questions)) {
            bank.questions = bank.questions.map((q) => {
              const o = Object.assign({}, q);
              ["q", "ex", "explain"].forEach((k) => { if (o[k] !== undefined) o[k] = fixQ(o[k]); });
              if (Array.isArray(o.opts)) o.opts = o.opts.map(fixQ);
              return o;
            });
          }
        }
      }
    } catch (e) { /* ફાઈલ ન મળે તો ખાલી બેંક */ }
    return bank;
  }
  const fixQ = (v) => (v && typeof v === "object" && !Array.isArray(v))
    ? Object.keys(v).reduce((a, k) => (a[k] = OEG.demojibake(v[k]), a), {})
    : (typeof v === "string" ? OEG.demojibake(v) : v);

  const all = () => bank.questions || [];
  const cats = () => (OEG.tax().quizCats.length ? OEG.tax().quizCats : bank.cats.map((c) => (typeof c === "string" ? { key: c } : c)));
  const catLabel = (c) => OEG.taxLabel(c, "subject");
  const catIcon = (c) => c.icon || ({ grade: "🎓", gk: "🌍", tat: "📝", htat: "🏫", reasoning: "🧩", current: "📰" }[c.key] || "🧠");
  const countIn = (key, grade) => all().filter((q) => (q.cat || "gk") === key && (!grade || grade === "all" || (q.grade || "all") === grade || (q.grade || "all") === "all")).length;

  function pick(cat, grade, n) {
    let qs = all().filter((q) => (q.cat || "gk") === cat);
    if (grade && grade !== "all") qs = qs.filter((q) => (q.grade || "all") === grade || (q.grade || "all") === "all");
    qs = qs.slice();
    for (let i = qs.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const x = qs[i]; qs[i] = qs[j]; qs[j] = x; }
    return n ? qs.slice(0, n) : qs;
  }

  /* ---------- માઉન્ટ ---------- */
  async function mount(el, opts) {
    mountEl = el;
    if (!all().length) await load();
    opts = opts || {};
    if (opts.cat) start(opts.cat, opts.grade || "all", opts.n || 0);
    else setup(opts.grade);
  }

  function paint(html) {
    if (!mountEl) return;
    mountEl.innerHTML = html;
    bind();
  }

  /* ---------- સેટ-અપ સ્ક્રીન ---------- */
  function setup(gradePreset) {
    const T = t(), C = cats();
    const gSel = gradePreset && gradePreset !== "all" ? gradePreset : "all";
    paint(`<div class="quiz-shell">
      <div class="quiz-head"><h2>🧠 ${T("quiz.title")}</h2><p>${T("quiz.sub")}</p></div>
      <div class="quiz-picks">
        <div class="quiz-block"><h3>📚 ${T("quiz.pickCat")}</h3>
          <div class="chip-row" id="qzCats">${C.map((c, i) =>
            `<button type="button" class="qz-chip ${i === 0 ? "on" : ""}" data-cat="${OEG.esc(c.key)}"><span>${catIcon(c)}</span><b>${OEG.esc(catLabel(c))}</b><small>${countIn(c.key, gSel)} ${T("grade.items")}</small></button>`).join("")}</div>
        </div>
        <div class="quiz-block"><h3>🎓 ${T("quiz.pickGrade")}</h3>
          <div class="chip-row sm" id="qzGrades">
            <button type="button" class="qz-chip ${gSel === "all" ? "on" : ""}" data-grade="all"><span>🗂️</span><b>${T("quiz.allGrades")}</b></button>
            ${OEG.tax().grades.filter(g => g.key === "balvatika" || /^\d+$/.test(g.key)).map(g => `<button type="button" class="qz-chip ${g.key === gSel ? "on" : ""}" data-grade="${OEG.esc(g.key)}"><span>${g.icon || "🎓"}</span><b>${OEG.gradeLabel(g.key)}</b></button>`).join("")}
          </div></div>
        <div class="quiz-block"><h3>🔢 ${T("quiz.count")}</h3>
          <div class="chip-row sm" id="qzN">
            ${[5, 10, 15, 0].map((n, i) => `<button type="button" class="qz-chip ${i === 1 ? "on" : ""}" data-n="${n}"><b>${n || T("grade.all")}</b></button>`).join("")}
          </div></div>
      </div>
      <div class="quiz-foot"><button class="btn btn-brand btn-lg" id="qzStart">▶ ${T("quiz.start")}</button></div>
      <div id="qzList"></div>
    </div>`);
  }

  /* ---------- ચાલુ ક્વિઝ ---------- */
  function start(cat, grade, n) {
    const qs = pick(cat, grade, n);
    const C = t();
    if (!qs.length) {
      paint(`<div class="quiz-shell panel" style="text-align:center;padding:44px 20px">
        <div style="font-size:2.6rem">📭</div><h3>${C("quiz.noQuestions")}</h3>
        <div style="margin-top:14px"><button class="btn btn-outline" id="qzBack">← ${C("quiz.back")}</button></div></div>`);
      return;
    }
    run = { cat: cat, grade: grade, qs: qs, i: 0, marks: [], t0: Date.now(), best: 0, streak: 0, timer: null, left: 0 };
    question();
  }

  function seconds() { return Math.max(10, Number(bank.seconds) || 45); }
  const passPct = () => Math.min(100, Math.max(1, Number(bank.passPercent) || 60));

  function question() {
    const C = t(), q = run.qs[run.i], total = run.qs.length;
    const opts = (q.opts || []).slice(0, 4);
    const pct = Math.round((run.i / total) * 100);
    const catKey = q.cat || run.cat;
    clearInterval(run.timer);
    run.left = seconds();
    paint(`<div class="quiz-shell quiz-run">
      <div class="qz-top">
        <div class="qz-prog"><i style="width:${pct}%"></i></div>
        <div class="qz-toprow">
          <span class="qz-pill">${C("quiz.q")} ${run.i + 1} ${C("quiz.of")} ${total}</span>
          <span class="qz-pill">🏷️ ${OEG.esc(catLabel(OEG.taxFind(cats(), catKey)))}</span>
          ${q.grade && q.grade !== "all" ? `<span class="qz-pill">🎓 ${OEG.gradeLabel(q.grade)}</span>` : ""}
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
  function result() {
    clearInterval(run.timer);
    const C = t(), total = run.qs.length;
    const right = run.marks.filter(m => m === 1).length;
    const pct = Math.round((right / total) * 100);
    const passed = pct >= passPct();
    const secs = Math.max(1, Math.round((Date.now() - run.t0) / 1000));
    const cat = OEG.taxFind(cats(), run.cat);
    const name = (OEG.state.user && OEG.state.user.name) || "";
    const verdict = pct >= 90 ? C("quiz.great") : pct >= passPct() ? C("quiz.good") : C("quiz.keepTrying");
    const cid = certId(name, pct);
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
            <div><span>${C("quiz.level")}</span><b>${OEG.esc(catLabel(cat))}</b></div>
          </div>
          ${passed ? `<p class="qr-ok">✅ ${C("quiz.certOk")}</p>` : `<p class="qr-no">🎯 ${C("quiz.need")} ${passPct()}% — ${C("quiz.certNo")}</p>`}
        </div>
      </div>
      <div class="qz-bar center">
        <button class="btn btn-brand" id="qzAgain">🔄 ${C("quiz.playAgain")}</button>
        <button class="btn btn-outline" id="qzReview">📋 ${C("quiz.review")}</button>
        <button class="btn btn-outline" id="qzBack">← ${C("quiz.back")}</button>
        ${passed ? `<button class="btn btn-gold" id="qzCert">🏅 ${C("quiz.cert")}</button>` : ""}
      </div>
      <div id="qzCertMount"></div>
      ${passed ? `<div class="share-row" id="qzShare">${resultShare(pct, cat)}</div>` : ""}
    </div>`);
    run.last = { right: right, total: total, pct: pct, passed: passed, cid: cid, name: name, cat: cat };
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

  function certId(name, pct) {
    const src = (name || "guest") + "|" + pct + "|" + new Date().toISOString().slice(0, 10);
    let h = 5381;
    for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) >>> 0;
    return "OEG-" + h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
  }

  function certificate() {
    const C = t(), L = run.last, date = new Date().toLocaleDateString(OEG.state.lang === "gu" ? "gu-IN" : "en-IN", { year: "numeric", month: "long", day: "numeric" });
    const catName = OEG.langField(L.cat.label || L.cat.key);
    mountEl.querySelector("#qzCertMount").innerHTML = `
      <div class="cert-wrap reveal in">
        <div class="cert-card">
          <div class="cert-bg"></div>
          <div class="cert-in">
            <div class="cert-brand"><span class="cert-mark">🎓</span><b>${OEG.esc(OEG.siteName())}</b><small>${OEG.esc(OEG.siteHost())}</small></div>
            <h3 class="cert-title">${C("quiz.certTitle")}</h3>
            <p class="cert-line">${C("quiz.certSigned")}</p>
            <div class="cert-field"><small>${C("quiz.certName")}</small><b class="cert-name" contenteditable="true" spellcheck="false" id="certName">${OEG.esc(L.name || "—")}</b></div>
            <p class="cert-body">${OEG.state.lang === "en" ? "has successfully completed the" : OEG.state.lang === "hi" ? "ने सफलतापूर्वक पूरा किया:" : "એ સફળતાપૂર્વક પૂરું કર્યું છે:"}</p>
            <div class="cert-quiz"><b>${OEG.esc(catName)} ${C("page.quiz")}</b><span>${L.total} ${C("quiz.q")} · ${C("quiz.certScore")} ${L.right}/${L.total} (${L.pct}%)</span></div>
            <div class="cert-grid">
              <div><small>${C("quiz.passLine")}</small><b>${passPct()}%</b></div>
              <div><small>${C("quiz.certDate")}</small><b>${OEG.esc(date)}</b></div>
              <div><small>${C("quiz.certId")}</small><b>${L.cid}</b></div>
            </div>
            <div class="cert-sign">
              <div class="cert-sig">
                <span class="cert-hand">Online Education Guru</span>
                <i></i>
                <small>Founder · Online Education Guru</small>
              </div>
              <div class="cert-seal"><span>🏅</span><b>OEG</b><small>VERIFIED</small></div>
            </div>
          </div>
        </div>
        <div class="qz-bar center no-print">
          <button class="btn btn-brand" id="certPrint">🖨 ${C("quiz.printCert")}</button>
          <button class="btn btn-outline" id="certShare">📤 ${C("quiz.share")}</button>
          <button class="btn btn-outline" id="certClose">✕</button>
        </div>
      </div>`;
    const nm = mountEl.querySelector("#certName");
    if (nm) nm.addEventListener("input", () => { run.last.name = nm.textContent.trim(); });
    mountEl.querySelector("#certPrint").onclick = () => printCert();
    mountEl.querySelector("#certClose").onclick = () => { mountEl.querySelector("#qzCertMount").innerHTML = ""; };
    mountEl.querySelector("#certShare").onclick = async () => {
      const text = "🏅 " + C("quiz.certTitle") + " — " + (run.last.name || "") + " · " + run.last.pct + "%\n" + OEG.shareUrl();
      try { await navigator.clipboard.writeText(text); OEG.toast(C("btn.copied")); } catch (e) {}
    };
    mountEl.querySelector("#qzCertMount").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function printCert() {
    document.body.classList.add("cert-print");
    const done = () => { document.body.classList.remove("cert-print"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    try { window.print(); } catch (e) { done(); }
    setTimeout(done, 20000);
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
    const sel = { cat: null, grade: "all", n: 10 };
    const st = mountEl._sel || (mountEl._sel = sel);
    if (!st.cat) { const first = q("#qzCats .qz-chip"); if (first) st.cat = first.dataset.cat; }
    mountEl.querySelectorAll("#qzCats .qz-chip").forEach(b => {
      b.onclick = () => { st.cat = b.dataset.cat; mountEl.querySelectorAll("#qzCats .qz-chip").forEach(x => x.classList.toggle("on", x === b)); updateList(); };
    });
    mountEl.querySelectorAll("#qzGrades .qz-chip").forEach(b => {
      b.onclick = () => { st.grade = b.dataset.grade; mountEl.querySelectorAll("#qzGrades .qz-chip").forEach(x => x.classList.toggle("on", x === b)); updateList(); };
    });
    mountEl.querySelectorAll("#qzN .qz-chip").forEach(b => {
      b.onclick = () => { st.n = Number(b.dataset.n); mountEl.querySelectorAll("#qzN .qz-chip").forEach(x => x.classList.toggle("on", x === b)); };
    });
    if (q("#qzStart")) q("#qzStart").onclick = () => start(st.cat || (cats()[0] && cats()[0].key), st.grade, st.n);
    if (q("#qzBack")) q("#qzBack").onclick = () => { mountEl._sel = null; setup(st.grade); };
    if (q("#qzOpts")) mountEl.querySelectorAll("#qzOpts .qz-opt").forEach(b => b.onclick = () => answer(Number(b.dataset.i), false));
    if (q("#qzNext")) q("#qzNext").onclick = next;
    if (q("#qzSkip")) q("#qzSkip").onclick = () => answer(-2, false);
    if (q("#qzAgain")) q("#qzAgain").onclick = () => start(run.cat, run.grade, run.qs.length);
    if (q("#qzReview")) q("#qzReview").onclick = review;
    if (q("#qzCert")) q("#qzCert").onclick = certificate;
    mountEl.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); OEG.toast(t()("btn.copied")); } catch (e) {}
    });
    updateList();
  }

  function updateList() {
    const box = mountEl && mountEl.querySelector("#qzList");
    if (!box) return;
    const st = mountEl._sel || {};
    const n = countIn(st.cat, st.grade);
    box.innerHTML = n ? `<p class="qz-hint">ℹ️ ${n} ${t()("grade.items")}${st.n && st.n < n ? " · " + st.n + " " + t()("quiz.q") : ""}</p>` : "";
  }

  /* ---------- Admin માટે helper ---------- */
  const raw = () => bank;
  async function save(newBank) {
    if (newBank) bank = newBank;
    return OEG.data.writeJson("data/quiz.json", bank, "quiz: update questions via admin");
  }

  return { load, mount, raw, save, pick, cats, countIn, passPct, all };
})();
