/* ============================================================
   OEG Built-in Educational Games — Quiz / Memory / Math
   ============================================================ */
OEG.games = (() => {
  const QUIZ = [
    { q: { gu: "ગુજરાતની રાજધાની કઈ છે?", hi: "गुजरात की राजधानी कौन सी है?", en: "What is the capital of Gujarat?" }, opts: ["અમદાવાદ", "ગાંધીનગર", "સુરત", "વડોદરા"], a: 1 },
    { q: { gu: "15 + 27 = ?", hi: "15 + 27 = ?", en: "15 + 27 = ?" }, opts: ["32", "42", "52", "41"], a: 1 },
    { q: { gu: "પાણીનું રાસાયણિક સૂત્ર શું છે?", hi: "पानी का रासायनिक सूत्र क्या है?", en: "What is the chemical formula of water?" }, opts: ["CO2", "O2", "H2O", "NaCl"], a: 2 },
    { q: { gu: "ભારતમાં કુલ કેટલા રાજ્યો છે?", hi: "भारत में कुल कितने राज्य हैं?", en: "How many states are there in India?" }, opts: ["28", "29", "30", "25"], a: 0 },
    { q: { gu: "સૂર્યની સૌથી નજીકનો ગ્રહ કયો?", hi: "सूर्य के सबसे निकट ग्रह कौन सा है?", en: "Which planet is closest to the Sun?" }, opts: ["શુક્ર", "બુધ", "પૃથ્વી", "મંગળ"], a: 1 },
    { q: { gu: "8 × 7 = ?", hi: "8 × 7 = ?", en: "8 × 7 = ?" }, opts: ["54", "56", "64", "48"], a: 1 },
    { q: { gu: "ગુજરાતી ભાષાનું મૂળ ક્યાંથી?", hi: "गुजराती भाषा की उत्पत्ति कहाँ से?", en: "Gujarati language originates from?" }, opts: ["સંસ્કૃત", "હિન્દી", "ઉર્દૂ", "અંગ્રેજી"], a: 0 },
    { q: { gu: "ત્રિકોણના ત્રણ ખૂણાનો સરવાળો?", hi: "त्रिभुज के तीनों कोणों का योग?", en: "Sum of angles of a triangle?" }, opts: ["90°", "180°", "270°", "360°"], a: 1 }
  ];
  const MEMO = ["🍎", "🐘", "🚀", "🌸", "⚽", "🎵", "🐠", "⭐"];

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function mountQuiz(root) {
    let idx = 0, score = 0, order = shuffle(QUIZ.map((_, i) => i));
    const render = () => {
      if (idx >= order.length) {
        root.innerHTML = `<div class="game-shell"><h3>🎉 ${OEG.t("game.quiz")}</h3>
          <div class="game-score">${OEG.t("game.score")}: ${score} / ${order.length}</div>
          <div class="game-center"><button class="btn btn-brand" id="gRestart">${OEG.t("game.restart")}</button></div></div>`;
        root.querySelector("#gRestart").onclick = () => mountQuiz(root);
        return;
      }
      const item = QUIZ[order[idx]];
      root.innerHTML = `<div class="game-shell"><h3>🧠 ${OEG.t("game.quiz")}</h3>
        <div class="game-score">${OEG.t("game.score")}: ${score} &nbsp;•&nbsp; ${idx + 1}/${order.length}</div>
        <div class="game-q">${OEG.esc(item.q[OEG.state.lang] || item.q.gu)}</div>
        <div class="game-opts">${shuffle(item.opts.map((_, i) => i)).map((i) => `<button class="game-opt" data-i="${i}">${OEG.esc(item.opts[i])}</button>`).join("")}</div>
        <div class="game-feedback" id="gFb"></div></div>`;
      root.querySelectorAll(".game-opt").forEach(btn => btn.onclick = () => {
        const i = +btn.dataset.i;
        const fb = root.querySelector("#gFb");
        if (i === item.a) { score++; btn.classList.add("correct"); fb.textContent = "✅ " + OEG.t("game.correct"); fb.style.color = "#16a34a"; }
        else { btn.classList.add("wrong"); fb.textContent = "❌ " + OEG.t("game.wrong") + " " + item.opts[item.a]; fb.style.color = "#dc2626"; }
        root.querySelectorAll(".game-opt").forEach(b => b.disabled = true);
        setTimeout(() => { idx++; render(); }, 1100);
      });
    };
    render();
  }

  function mountMemory(root) {
    const deck = shuffle([...MEMO, ...MEMO]);
    let open = [], matched = 0, moves = 0;
    root.innerHTML = `<div class="game-shell"><h3>🃏 ${OEG.t("game.memory")}</h3>
      <div class="game-score">${OEG.t("game.score")}: ${matched}/${MEMO.length}</div>
      <div class="memory-grid">${deck.map((e, i) => `<button class="mem-card" data-i="${i}" data-e="${e}">?</button>`).join("")}</div>
      <div class="game-center"><button class="btn btn-outline btn-sm" id="gRestart">${OEG.t("game.restart")}</button></div></div>`;
    root.querySelector("#gRestart").onclick = () => mountMemory(root);
    root.querySelectorAll(".mem-card").forEach(card => card.onclick = () => {
      if (card.classList.contains("flipped") || card.classList.contains("matched") || open.length === 2) return;
      card.textContent = card.dataset.e; card.classList.add("flipped"); open.push(card);
      if (open.length === 2) {
        moves++;
        if (open[0].dataset.e === open[1].dataset.e) {
          open.forEach(c => c.classList.add("matched")); matched++;
          root.querySelector(".game-score").textContent = `${OEG.t("game.score")}: ${matched}/${MEMO.length}`;
          open = [];
          if (matched === MEMO.length) OEG.toast("🎉 " + OEG.t("game.score") + ": " + moves);
        } else {
          const [a, b] = open; open = [];
          setTimeout(() => { a.textContent = "?"; b.textContent = "?"; a.classList.remove("flipped"); b.classList.remove("flipped"); }, 750);
        }
      }
    });
  }

  function mountMath(root) {
    let score = 0, round = 0; const TOTAL = 10;
    const next = () => {
      if (round >= TOTAL) {
        root.innerHTML = `<div class="game-shell"><h3>🔢 ${OEG.t("game.math")}</h3>
          <div class="game-score">${OEG.t("game.score")}: ${score} / ${TOTAL}</div>
          <div class="game-center"><button class="btn btn-brand" id="gRestart">${OEG.t("game.restart")}</button></div></div>`;
        root.querySelector("#gRestart").onclick = () => mountMath(root);
        return;
      }
      const a = 2 + Math.floor(Math.random() * 20), b = 2 + Math.floor(Math.random() * 20);
      const ops = ["+", "−", "×"]; const op = ops[Math.floor(Math.random() * ops.length)];
      const ans = op === "+" ? a + b : op === "−" ? a - b : a * b;
      const opts = shuffle([ans, ans + 1, ans - 1, ans + 2].filter((v, i, arr) => arr.indexOf(v) === i)).slice(0, 3);
      if (!opts.includes(ans)) opts[0] = ans;
      round++;
      root.innerHTML = `<div class="game-shell"><h3>🔢 ${OEG.t("game.math")}</h3>
        <div class="game-score">${OEG.t("game.score")}: ${score} &nbsp;•&nbsp; ${round}/${TOTAL}</div>
        <div class="game-q">${a} ${op} ${b} = ?</div>
        <div class="game-opts">${opts.map(o => `<button class="game-opt" data-v="${o}">${o}</button>`).join("")}</div>
        <div class="game-feedback" id="gFb"></div></div>`;
      root.querySelectorAll(".game-opt").forEach(btn => btn.onclick = () => {
        const ok = +btn.dataset.v === ans;
        if (ok) { score++; btn.classList.add("correct"); } else btn.classList.add("wrong");
        const fb = root.querySelector("#gFb");
        fb.textContent = ok ? "✅ " + OEG.t("game.correct") : "❌ " + OEG.t("game.wrong") + " " + ans;
        fb.style.color = ok ? "#16a34a" : "#dc2626";
        root.querySelectorAll(".game-opt").forEach(b => b.disabled = true);
        setTimeout(next, 900);
      });
    };
    next();
  }

  return { mountQuiz, mountMemory, mountMath };
})();
