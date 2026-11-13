/* ============================================================
   OEG પ્રમાણપત્ર (Certificate) — canvas રેન્ડરર
   એ જ ડિઝાઈન સ્ક્રીન પર, PDF માં અને Image માં (એક જ સ્રોત, કોઈ drift નહીં)
   ============================================================ */
OEG.cert = (() => {
  const W = 2000, H = 1410;                       /* ~A4 landscape @150dpi */
  const DISPLAY = '"Baloo Bhai 2","Noto Sans Gujarati Variable",system-ui,sans-serif';
  const BODY = '"Noto Sans Gujarati Variable","Noto Sans Devanagari Variable",system-ui,sans-serif';
  const INK = "#1d2340", SOFT = "#6d7392", GOLD = "#b98a1f", GOLD2 = "#e8c46a", DEEP = "#2a2f6b";

  /* વિષય મુજબ પ્રશંસાની લાઈન (નામની નીચે દેખાય) */
  const PRAISE = {
    gk: { gu: "સામાન્ય જ્ઞાન અને સમકાલીન ઘટનાઓ પરની પકડ ખરેખર પ્રશંસનીય છે", hi: "सामान्य ज्ञान और समसामयिकी पर पकड़ सराहनीय है", en: "A commendable command of general knowledge and current affairs" },
    current: { gu: "સમકાલીન ઘટનાઓની ખબર દરેક વિદ્યાર્થી માટે પ્રેરણારૂપ છે", hi: "समकालीन घटनाओं की जानकारी प्रेरणादायी है", en: "Impressive awareness of current events" },
    maths: { gu: "અંકગણિતમાં તર્ક અને ગતિ — બંને ઉત્કૃષ્ટ રહ્યાં છે", hi: "गणित में तर्क और गति दोनों उत्कृष्ट रही", en: "Excellent speed and logic in mathematics" },
    science: { gu: "વિજ્ઞાનના ખ્યાલો સમજવાની શૈલી ખૂબ સ્પષ્ટ છે", hi: "विज्ञान की अवधारणाएँ समझने का तरीका बेहद स्पष्ट है", en: "A notably clear way of understanding science" },
    social: { gu: "સામાજિક વિજ્ઞાનના ભાગો વચ્ચેનો સંબંધ સુંદર રીતે સમજાયો છે", hi: "सामाजिक विज्ञान की अवधारणाएँ सुंदर ढंग से समझी गईं", en: "A fine grasp of social-science concepts and their links" },
    gujarati: { gu: "ગુજરાતી ભાષા, વ્યાકરણ અને સાહિત્ય પ્રત્યેનો લાગણીશીલ સંબંધ ભાવુક કરે છે", hi: "गुजराती भाषा और साहित्य के प्रति लगाव हृदयस्पर्शी है", en: "A heartfelt bond with Gujarati language and literature" },
    hindi: { gu: "હિન્દી ભાષા અને વ્યાકરણમાં સરસ પકડ દેખાઈ છે", hi: "हिन्दी भाषा और व्याकरण पर अच्छी पकड़ दिखी", en: "A sound hold over Hindi language and grammar" },
    english: { gu: "English ભાષાના શબ્દભંડોળ અને વ્યાકરણમાં સુધારો શાનદાર છે", hi: "English शब्दावली और व्याकरण में सुधार शानदार है", en: "Splendid growth in English vocabulary and grammar" },
    sanskrit: { gu: "સંસ્કૃત ભાષા અને શ્લોકોને સમજવાનો ઉત્સાહ અભિનંદન પાત્ર છે", hi: "संस्कृत भाषा और श्लोकों को समझने का उत्साह अभिनंदनीय है", en: "A praiseworthy enthusiasm for Sanskrit and its verses" },
    reasoning: { gu: "તર્કશક્તિ અને પેટર્ન સમજવાની ક્ષમતા શાનદાર રહી છે", hi: "तर्कशक्ति और पैटर्न समझने की क्षमता शानदार रही", en: "Outstanding reasoning ability and pattern sense" },
    tat: { gu: "શિક્ષક ભરતીની તૈયારીમાં દેખાયેલો આત્મવિશ્વાસ અને અભ્યાસ પ્રશંસનીય છે", hi: "शिक्षक भर्ती की तैयारी में लगन और आत्मविश्वास सराहनीय है", en: "Dedication and confidence in teacher-recruitment prep are commendable" },
    htat: { gu: "માધ્યમિક શિક્ષક ભરતી માટેની મહેનત ખરેખર રંગ લાવી છે", hi: "माध्यमिक शिक्षक भर्ती की मेहनत रंग लाई है", en: "Hard work for the senior-teacher recruitment has truly paid off" },
    grade: { gu: "પાઠ્યપુસ્તકના ખ્યાલો પરની પકડ સમગ્ર અને મજબૂત રહી છે", hi: "पाठ्यपुस्तक की अवधारणाओं पर पकड़ समग्र और मजबूत रही", en: "A complete and sturdy grip on the syllabus" }
  };
  const SUBJECT_LABEL = {
    gujarati: { gu: "ગુજરાતી", hi: "गुजराती", en: "Gujarati" }, hindi: { gu: "હિન્દી", hi: "हिन्दी", en: "Hindi" },
    english: { gu: "English", hi: "English", en: "English" }, maths: { gu: "ગણિત", hi: "गणित", en: "Maths" },
    science: { gu: "વિજ્ઞાન", hi: "विज्ञान", en: "Science" }, social: { gu: "સામાજિક વિજ્ઞાન", hi: "सामाजिक विज्ञान", en: "Social Science" },
    sanskrit: { gu: "સંસ્કૃત", hi: "संस्कृत", en: "Sanskrit" }, gk: { gu: "સામાન્ય જ્ઞાન", hi: "सामान्य ज्ञान", en: "General Knowledge" },
    current: { gu: "સમકાલીન ઘટનાઓ", hi: "समकालीन घटनाएँ", en: "Current Affairs" }, reasoning: { gu: "તર્કશક્તિ", hi: "तर्कशक्ति", en: "Reasoning" },
    tat: { gu: "TAT શિક્ષક ભરતી", hi: "TAT शिक्षक भर्ती", en: "TAT Teacher Recruitment" }, htat: { gu: "HTAT શિક્ષક ભરતી", hi: "HTAT शिक्षक भर्ती", en: "HTAT Teacher Recruitment" },
    grade: { gu: "ધોરણ મુજબ સમગ્ર અભ્યાસ", hi: "कक्षा अनुसार पाठ्यक्रम", en: "Full syllabus of the grade" }
  };

  const txt = (v) => (v && typeof v === "object" && !Array.isArray(v)) ? (v[OEG.state.lang] || v.gu || v.en || "") : (v == null ? "" : String(v));

  /* ---------- ડેટા સાફ કરો ---------- */
  function info(o) {
    o = o || {};
    const T = OEG.t;
    const cat = o.cat || {};
    const key = cat.key || o.catKey || "gk";
    const subjKey = (o.subject && o.subject !== "all") ? o.subject : (o.subjectKey || (SUBJECT_LABEL[key] ? key : ""));
    const praise = PRAISE[subjKey] || PRAISE[key] || PRAISE.grade;
    const name = (o.name || "").trim() || T("quiz.certGuest");
    const pct = Math.max(0, Math.min(100, Number(o.pct) || 0));
    const dateObj = o.date instanceof Date ? o.date : new Date();
    const loc = OEG.state.lang === "en" ? "en-IN" : OEG.state.lang === "hi" ? "hi-IN" : "gu-IN";
    let date = "";
    try { date = dateObj.toLocaleDateString(loc, { year: "numeric", month: "long", day: "numeric" }); } catch (e) { date = dateObj.toISOString().slice(0, 10); }
    const body = {
      gu: { presented: "આ પ્રમાણપત્ર ગૌરવપૂર્વક આપવામાં આવે છે", to: "ને", for: "માટે", score: "ગુણ", date: "તારીખ", no: "પ્રમાણપત્ર ક્રમાંક", pass: "પાસ માર્ક", grade: "ધોરણ", subject: "વિષય", questions: "પ્રશ્નો", right: "સાચા", badge: "ચકાસાયેલ" },
      hi: { presented: "यह प्रमाणपत्र गर्व से प्रदान किया जाता है", to: "को", for: "के लिए", score: "अंक", date: "दिनांक", no: "प्रमाणपत्र क्रमांक", pass: "पास मार्क", grade: "कक्षा", subject: "विषय", questions: "प्रश्न", right: "सही", badge: "सत्यापित" },
      en: { presented: "This certificate is proudly presented to", to: "", for: "for", score: "Score", date: "Date", no: "Certificate no.", pass: "Pass mark", grade: "Grade", subject: "Subject", questions: "Questions", right: "Correct", badge: "Verified" }
    }[OEG.state.lang] || {};
    const I = {
      title: txt(o.title) || T("quiz.certTitle"),
      sub: txt(o.sub) || T("quiz.certSub"),
      site: o.site || OEG.siteName(),
      url: (o.url || OEG.siteUrl() || "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
      name: name,
      praise: txt(o.praise) || txt(praise),
      issuer: txt(o.issuer) || OEG.siteName(),
      subject: txt(o.subjectLabel) || txt(SUBJECT_LABEL[subjKey] || ""),
      subjectKey: subjKey,
      catLabel: o.catLabel || txt(cat.label || key) || T("page.quiz"),
      grade: o.grade && o.grade !== "all" ? OEG.gradeLabel(o.grade) : "",
      body: body,
      pct: pct, right: Number(o.right) || 0, total: Number(o.total) || 0, pass: Number(o.pass) || 60,
      date: date, id: o.id || "", lang: OEG.state.lang,
      showUrl: o.showUrl !== false, showSeal: o.showSeal !== false, showScore: o.showScore !== false,
      footer: txt(o.footer) || T("quiz.certFooter"),
      catName: txt(cat.label || key) || T("page.quiz"),
      chips: (function () {
        const list = [
          { k: body.right, v: (Number(o.right) || 0) + " / " + (Number(o.total) || 0) },
          { k: body.score, v: pct + "%" },
          { k: body.pass, v: (Number(o.pass) || 60) + "%" }
        ];
        const subjLabel = txt(o.subjectLabel) || txt(SUBJECT_LABEL[subjKey] || "");
        if (subjKey || subjLabel) list.push({ k: body.subject, v: subjLabel });
        if (o.grade && o.grade !== "all") list.push({ k: body.grade, v: OEG.gradeLabel(o.grade) });
        return list.filter(function (x) { return x.v; });
      })()
    };
    I.awarded = String(o.awarded || "").trim() || (I.lang === "en"
      ? "has successfully completed the " + I.catName + " online assessment"
      : I.lang === "hi"
        ? "ने “" + I.catName + "” ऑनलाइन प्रश्नोत्तरी सफलतापूर्वक पूरी की है"
        : "એ “" + I.catName + "” ઓનલાઇન પ્રશ્નોત્તરી સફળતાપૂર્વક પૂરી કરી છે");
    return I;
  }

  /* ---------- canvas helper ---------- */
  const rr = (c, x, y, w, h, r) => {
    const k = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + k, y); c.lineTo(x + w - k, y); c.quadraticCurveTo(x + w, y, x + w, y + k);
    c.lineTo(x + w, y + h - k); c.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
    c.lineTo(x + k, y + h); c.quadraticCurveTo(x, y + h, x, y + h - k);
    c.lineTo(x, y + k); c.quadraticCurveTo(x, y, x + k, y); c.closePath();
  };
  /* ---------- ટેક્સ્ટ લેઆઉટ એન્જિન (માપ → લપેટ → જો જરૂર પડે તો ઘટાડો) ----------
     હેતુ: બધું અંદરના પાનામાં બંધાયેલું રહે, બે લાઈન એકબીજા પર ન ચઢે અને ફ્રેમ કપાતી ન આવે. */
  const fontOf = (weight, size, family) => weight + " " + (Math.round(size * 100) / 100) + "px " + family;
  const wrap = (c, text, font, maxW, maxLines) => {
    c.font = font;
    const words = String(text == null ? "" : text).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const out = [];
    let cur = "", cut = false;
    const ell = (t) => {
      let x = t;
      while (x.length > 1 && c.measureText(x + "\u2026").width > maxW) x = x.slice(0, -1);
      return x + "\u2026";
    };
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const t = cur ? cur + " " + w : w;
      if (c.measureText(t).width <= maxW || !cur) { cur = t; continue; }
      if (out.length >= (maxLines || 1) - 1) { out.push(ell(cur + " " + words.slice(i).join(" "))); cut = true; return { lines: out, truncated: cut }; }
      out.push(cur); cur = w;
    }
    if (cur) {
      if (c.measureText(cur).width > maxW) { cur = ell(cur); cut = true; }
      if (out.length < (maxLines || 1)) out.push(cur); else { out[out.length - 1] = ell(out[out.length - 1] + " " + cur); cut = true; }
    }
    return { lines: out.length ? out : [""], truncated: cut };
  };
  function layout(c, text, weight, size, family, maxW, maxLines) {
    let s = Math.max(12, size), r = { lines: [""], truncated: false };
    for (let i = 0; i < 26; i++) {
      r = wrap(c, text, fontOf(weight, s, family), maxW, maxLines || 1);
      let widest = 0;
      for (const ln of r.lines) { const w = c.measureText(ln).width; if (w > widest) widest = w; }
      if ((!r.truncated && widest <= maxW + 1) || s <= 14) break;
      s = Math.max(14, s - Math.max(1, size * 0.045));
    }
    return { size: s, lines: r.lines };
  }

  /* crest — grad-cap + આભામંડળ (emoji વગર, બધા બ્રાઉઝરમાં ચોખ્ખું) */
  function crest(c, cx, cy, s, color) {
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = s * 0.06; c.lineJoin = "round";
    c.beginPath(); c.moveTo(cx - s, cy - s * 0.15); c.lineTo(cx, cy - s * 0.62); c.lineTo(cx + s, cy - s * 0.15); c.lineTo(cx, cy + s * 0.3); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(cx - s * 0.5, cy + s * 0.08); c.lineTo(cx - s * 0.5, cy + s * 0.55);
    c.quadraticCurveTo(cx, cy + s * 0.85, cx + s * 0.5, cy + s * 0.55); c.lineTo(cx + s * 0.5, cy + s * 0.08); c.stroke();
    c.beginPath(); c.moveTo(cx + s * 0.92, cy - s * 0.05); c.lineTo(cx + s * 0.92, cy + s * 0.5); c.stroke();
    c.beginPath(); c.arc(cx + s * 0.92, cy + s * 0.58, s * 0.09, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  /* મોહર (seal) */
  function seal(c, cx, cy, r, label) {
    c.save();
    c.beginPath();
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const rad = r * (i % 2 ? 0.86 : 1); c.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
    c.closePath();
    const g = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, "#f2d489"); g.addColorStop(0.5, "#c99a2e"); g.addColorStop(1, "#8f6a15");
    c.fillStyle = g; c.fill();
    c.beginPath(); c.arc(cx, cy, r * 0.68, 0, Math.PI * 2); c.fillStyle = "#fffaf0"; c.fill();
    c.lineWidth = 3; c.strokeStyle = "#b98a1f"; c.stroke();
    c.textAlign = "center"; c.fillStyle = DEEP;
    c.font = "800 " + Math.round(r * 0.44) + "px " + DISPLAY; c.fillText("OEG", cx, cy + r * 0.06);
    c.font = "700 " + Math.round(r * 0.17) + "px " + BODY; c.fillStyle = "#8a6c22";
    c.fillText(String(label || "").toUpperCase(), cx, cy + r * 0.45);
    c.beginPath(); c.moveTo(cx - r * 0.3, cy - r * 0.34); c.lineTo(cx - r * 0.06, cy - r * 0.12); c.lineTo(cx + r * 0.34, cy - r * 0.52);
    c.lineWidth = r * 0.12; c.strokeStyle = "#2f7d3f"; c.lineCap = "round"; c.stroke();
    c.restore();
  }

  /* ---------- મુખ્ય રેન્ડર ---------- */
  const MAXW = W - 336;                       /* અંદરના પાનાની ટેક્સ્ટ પહોળાઈ */
  function backdrop(c) {
    const bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#141a3c"); bg.addColorStop(0.45, "#1d2456"); bg.addColorStop(1, "#0f2036");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const glow = [[W * 0.12, H * 0.1, W * 0.5, "rgba(99,102,241,.34)"], [W * 0.92, H * 0.94, W * 0.45, "rgba(6,182,212,.24)"], [W * 0.86, H * 0.06, W * 0.3, "rgba(217,119,6,.20)"]];
    glow.forEach((g) => {
      const rad = c.createRadialGradient(g[0], g[1], 0, g[0], g[1], g[2]);
      rad.addColorStop(0, g[3]); rad.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = rad; c.fillRect(0, 0, W, H);
    });
    c.save(); c.globalAlpha = 0.06; c.strokeStyle = "#dbeafe"; c.lineWidth = 1.2;
    for (let i = -H; i < W; i += 26) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); }
    c.restore();
    rr(c, 40, 40, W - 80, H - 80, 30); c.lineWidth = 5; c.strokeStyle = GOLD2; c.stroke();
    rr(c, 62, 62, W - 124, H - 124, 22); c.lineWidth = 1.6; c.strokeStyle = "rgba(232,196,106,.55)"; c.stroke();
    c.save(); c.lineWidth = 2.4; c.strokeStyle = GOLD2;
    const corners = [[92, 92, 1, 1], [W - 92, 92, -1, 1], [92, H - 92, 1, -1], [W - 92, H - 92, -1, -1]];
    corners.forEach((q) => {
      c.beginPath(); c.moveTo(q[0], q[1] + q[3] * 74); c.quadraticCurveTo(q[0], q[1], q[0] + q[2] * 74, q[1]); c.stroke();
      c.beginPath(); c.arc(q[0] + q[2] * 30, q[1] + q[3] * 30, 9, 0, Math.PI * 2); c.stroke();
    });
    c.restore();
    rr(c, 104, 104, W - 208, H - 208, 16);
    const card = c.createLinearGradient(104, 104, W - 104, H - 104);
    card.addColorStop(0, "#fdfaf3"); card.addColorStop(0.5, "#fbf6ea"); card.addColorStop(1, "#f6f1e4");
    c.fillStyle = card; c.fill();
    c.save(); rr(c, 104, 104, W - 208, H - 208, 16); c.clip();
    c.globalAlpha = 0.045; c.strokeStyle = DEEP; c.lineWidth = 1.1;
    for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(W / 2, H * 0.5, 190 + i * 92, 0, Math.PI * 2); c.stroke(); }
    c.restore();
  }

  function paint(canvas, o) {
    const I = info(o);
    const c = canvas.getContext("2d");
    if (!c) return I;
    canvas.width = W; canvas.height = H;
    c.clearRect(0, 0, W, H);
    backdrop(c);

    /* બ્લોક-પ્લાન બનાવો → કુલ ઊંચાઈ માપો → જગ્યા ઓછી પડે તો સ્કેલ ઘટાડો → વચ્ચે સેંટર કરી દોરો */
    const TOP = 168, BOTTOM = H - 330, AVAIL = BOTTOM - TOP;
    function build(k) {
      const B = [];
      const size = (n) => Math.max(11, Math.round(n * k * 100) / 100);
      const text = (txt, weight, n, family, color, opt) => {
        opt = opt || {};
        const lay = layout(c, txt, weight, size(n), family, opt.maxW || MAXW, opt.lines || 1);
        const lh = lay.size * (opt.lh || 1.24);
        B.push({ kind: "text", lines: lay.lines, size: lay.size, lh: lh, height: lay.lines.length * lh,
          weight: weight, family: family, color: color, gap: opt.gap || 0, grad: !!opt.grad, rule: !!opt.rule, maxW: opt.maxW || MAXW });
      };
      const gap = (h) => B.push({ kind: "gap", height: h * k });
      const rule = () => B.push({ kind: "rule", height: 34 * k });
      const chips = (list) => B.push({ kind: "chips", list: list, height: 112 * k });
      const brand = () => B.push({ kind: "brand", height: 118 * k });

      brand();
      text(I.title, "800", 104, DISPLAY, GOLD, { grad: true, gap: 6 });
      text(I.sub, "600", 32, BODY, SOFT, { lines: 2 });
      rule();
      text(I.body.presented, "400", 30, BODY, SOFT, { lines: 1, gap: 14 });
      text(I.name, "800", 86, DISPLAY, DEEP, { rule: true, gap: 6 });
      text(I.praise, "italic 600", 30, BODY, "#7a5f1b", { lines: 2, gap: 16 });
      text(I.awarded, "400", 31, BODY, INK, { lines: 2, gap: 20 });
      if (I.showScore !== false && I.chips && I.chips.length) chips(I.chips);
      return B;
    }
    let blocks = build(1);
    let total = blocks.reduce((sum, b) => sum + b.height + (b.gap || 0), 0);
    for (let i = 0; total > AVAIL && i < 4; i++) {
      blocks = build(Math.max(0.62, (AVAIL / total) * 0.98));
      total = blocks.reduce((sum, b) => sum + b.height + (b.gap || 0), 0);
    }
    let y = TOP + Math.max(0, (AVAIL - total) / 2);

    c.textAlign = "center"; c.textBaseline = "alphabetic";
    blocks.forEach((b) => {
      if (b.kind === "gap") { y += b.height; return; }
      if (b.kind === "rule") {
        c.save(); c.strokeStyle = "rgba(185,138,31,.7)"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(W / 2 - 300, y + b.height / 2); c.lineTo(W / 2 - 26, y + b.height / 2); c.stroke();
        c.beginPath(); c.moveTo(W / 2 + 26, y + b.height / 2); c.lineTo(W / 2 + 300, y + b.height / 2); c.stroke();
        c.translate(W / 2, y + b.height / 2); c.rotate(Math.PI / 4); c.fillStyle = GOLD; c.fillRect(-7, -7, 14, 14);
        c.restore();
        y += b.height; return;
      }
      if (b.kind === "brand") {
        const fs0 = 56 * (b.height / 118);
        const lay = layout(c, I.site, "800", fs0, DISPLAY, MAXW - 130, 1);
        const fs = lay.size;
        c.font = fontOf("800", fs, DISPLAY);
        const tw = c.measureText(I.site).width;
        crest(c, W / 2 - tw / 2 - 46, y + 30, 26, GOLD);
        c.textAlign = "center"; c.fillStyle = INK;
        c.fillText(I.site, W / 2 + 24, y + 42);
        if (I.showUrl && I.url) {
          const ul = layout(c, I.url, "600", fs * 0.44, BODY, MAXW - 210, 1);
          c.font = fontOf("600", ul.size, BODY); c.fillStyle = "#9a7b23";
          const uw = c.measureText(ul.lines[0]).width;
          c.fillText(ul.lines[0], W / 2, y + 94);
          c.save(); c.strokeStyle = "rgba(185,138,31,.45)"; c.lineWidth = 1.3;
          c.beginPath(); c.moveTo(W / 2 - uw / 2 - 156, y + 87); c.lineTo(W / 2 - uw / 2 - 26, y + 87); c.stroke();
          c.beginPath(); c.moveTo(W / 2 + uw / 2 + 26, y + 87); c.lineTo(W / 2 + uw / 2 + 156, y + 87); c.stroke();
          c.restore();
        }
        y += b.height; return;
      }
      if (b.kind === "chips") {
        const list = b.list, gapx = 20;
        const cw = Math.min(330, (W - 360 - gapx * (list.length - 1)) / list.length);
        let bx = (W - (cw * list.length + gapx * (list.length - 1))) / 2;
        const ch = 100 * (b.height / 112);
        list.forEach((it) => {
          rr(c, bx, y, cw, ch, 13); c.fillStyle = "rgba(42,47,107,.05)"; c.fill();
          c.lineWidth = 1.4; c.strokeStyle = "rgba(185,138,31,.4)"; c.stroke();
          c.textAlign = "center";
          c.font = fontOf("700", Math.max(11, ch * 0.2), BODY); c.fillStyle = "#8d93ad";
          c.fillText(String(it.k).toUpperCase(), bx + cw / 2, y + ch * 0.36);
          const lay = layout(c, String(it.v), "800", ch * 0.36, DISPLAY, cw - 22, 1);
          c.font = fontOf("800", lay.size, DISPLAY); c.fillStyle = DEEP;
          c.fillText(lay.lines[0], bx + cw / 2, y + ch * 0.78);
          bx += cw + gapx;
        });
        y += b.height; return;
      }
      /* text block */
      b.lines.forEach((ln, i) => {
        const base = y + b.size * 0.82 + i * b.lh;
        c.font = fontOf(b.weight, b.size, b.family);
        if (b.grad) {
          const g = c.createLinearGradient(W / 2 - 340, 0, W / 2 + 340, 0);
          g.addColorStop(0, "#7c5a12"); g.addColorStop(0.42, "#c99a2e"); g.addColorStop(0.62, "#e8c46a"); g.addColorStop(1, "#8a6a1c");
          c.fillStyle = g; c.fillText(ln, W / 2, base);
          c.save(); c.lineWidth = 1.1; c.strokeStyle = "rgba(140,105,20,.35)"; c.strokeText(ln, W / 2, base); c.restore();
        } else {
          c.fillStyle = b.color; c.fillText(ln, W / 2, base);
        }
        if (b.rule && i === b.lines.length - 1) {
          const tw = Math.max(340, c.measureText(ln).width + 110);
          const uy = base + b.size * 0.16;
          c.save();
          const ng = c.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
          ng.addColorStop(0, "rgba(201,154,46,0)"); ng.addColorStop(0.18, "#c99a2e"); ng.addColorStop(0.82, "#c99a2e"); ng.addColorStop(1, "rgba(201,154,46,0)");
          c.fillStyle = ng; c.fillRect(W / 2 - tw / 2, uy, tw, 4);
          c.fillStyle = GOLD;
          c.beginPath(); c.arc(W / 2 - tw / 2, uy + 2, 5.5, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(W / 2 + tw / 2, uy + 2, 5.5, 0, Math.PI * 2); c.fill();
          c.restore();
          y += b.size * 0.2;
        }
      });
      y += b.height + (b.gap || 0);
    });

    /* નીચેની પંક્તિ: તારીખ + ક્રમાંક (ડાબે), ફૂટર (વચ્ચે), મોહર (જમણે) — બધું માપીને */
    const by = H - 300;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    const dl = layout(c, I.date, "800", 30, DISPLAY, 520, 1);
    c.font = fontOf("700", 19, BODY); c.fillStyle = "#8d93ad";
    c.fillText(String(I.body.date).toUpperCase(), 210, by);
    c.font = fontOf("800", dl.size, DISPLAY); c.fillStyle = INK;
    c.fillText(dl.lines[0], 210, by + 38);
    if (I.id) {
      c.font = fontOf("700", 19, BODY); c.fillStyle = "#8d93ad";
      c.fillText(String(I.body.no).toUpperCase(), 210, by + 82);
      const il = layout(c, I.id, "800", 24, BODY, 520, 1);
      c.font = fontOf("800", il.size, BODY); c.fillStyle = "#7a5f1b";
      c.fillText(il.lines[0], 210, by + 110);
    }
    if (I.showSeal) seal(c, W - 246, by + 30, 84, I.body.badge);
    if (I.footer) {
      const fy = H - 150;
      const fl = layout(c, I.footer, "600", 21, BODY, W - 480, 2);
      c.textAlign = "center"; c.font = fontOf("600", fl.size, BODY); c.fillStyle = "#9a9fb8";
      fl.lines.forEach((ln, i) => c.fillText(ln, W / 2, fy + i * (fl.size * 1.3)));
    }
    return I;
  }

  /* ફોન્ટ લોડ થવા રાહ જુઓ (Gujarati/Devanagari glyph માટે જરૂરી) */
  function ready() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const list = ["800 62px " + DISPLAY, "800 96px " + DISPLAY, "400 34px " + BODY, "700 21px " + BODY, "italic 600 33px " + BODY];
    return Promise.all(list.map((f) => { try { return document.fonts.load(f); } catch (e) { return Promise.resolve(); } }))
      .then(() => document.fonts.ready).catch(() => {});
  }
  async function render(canvas, o) { await ready(); return paint(canvas, o); }

  /* ---------- બ્લોબ / ડાઉનલોડ / PDF / શેર ---------- */
  function dataURL(canvas, type) { return canvas.toDataURL(type, 0.95); }
  function b64ToBytes(b64) {
    const bin = atob(b64.replace(/\s/g, ""));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 255;
    return out;
  }
  function blobFromDataURL(u) {
    const i = u.indexOf(",");
    const head = u.slice(0, i), body = u.slice(i + 1);
    const type = (head.match(/data:([^;,]+)/) || [, "application/octet-stream"])[1];
    if (/;base64/i.test(head)) return new Blob([b64ToBytes(body)], { type: type });
    return new Blob([decodeURIComponent(body)], { type: type });
  }
  /* toBlob કૉલબેક ન આપે (જૂના/છેડેલા બ્રાઉઝર) તો dataURL થી આગળ વધો */
  const grab = (canvas, type) => new Promise((res) => {
    let done = false;
    const fb = () => { if (done) return; done = true; res(blobFromDataURL(dataURL(canvas, type))); };
    if (canvas.toBlob) {
      try {
        canvas.toBlob((b) => { if (done) return; done = true; res(b || blobFromDataURL(dataURL(canvas, type))); }, type, 0.95);
        setTimeout(fb, 2500);
        return;
      } catch (e) { }
    }
    fb();
  });

  /* JPEG → એક-પાનાં PDF (કોઈ લાઇબ્રેરી વગર) */
  function pdfFromJpeg(jpegUrl, wpx, hpx) {
    const bin = atob(jpegUrl.split(",")[1]);
    const img = bin;                                   /* latin1 સ્ટ્રિંગ = બાઇટ */
    const pw = +(wpx * 0.48).toFixed(2), ph = +(hpx * 0.48).toFixed(2);
    const content = "q\n" + pw + " 0 0 " + ph + " 0 0 cm\n/Im0 Do\nQ\n";
    const objs = [
      "<</Type /Catalog /Pages 2 0 R>>",
      "<</Type /Pages /Kids [3 0 R] /Count 1>>",
      "<</Type /Page /Parent 2 0 R /MediaBox [0 0 " + pw + " " + ph + "] /Resources <</XObject <</Im0 4 0 R>> /ProcSet [/PDF /ImageC]>> /Contents 5 0 R>>",
      "<</Type /XObject /Subtype /Image /Width " + wpx + " /Height " + hpx + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + img.length + ">>\nstream\n" + img + "\nendstream",
      "<</Length " + content.length + ">>\nstream\n" + content + "endstream",
      "<</Producer (Online Education Guru) /Title (Certificate) /CreationDate (D:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z())>>"
    ];
    let pdf = "%PDF-1.4\n";
    const off = [];
    objs.forEach((o, i) => { off.push(pdf.length); pdf += (i + 1) + " 0 obj\n" + o + "\nendobj\n"; });
    const xref = pdf.length;
    let t = "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n";
    off.forEach((p) => { t += String(p).padStart(10, "0") + " 00000 n \n"; });
    t += "trailer\n<</Size " + (objs.length + 1) + " /Root 1 0 R /Info " + (objs.length) + " 0 R>>\nstartxref\n" + xref + "\n%%EOF\n";
    const bytes = new Uint8Array(pdf.length + t.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 255;
    for (let i = 0; i < t.length; i++) bytes[pdf.length + i] = t.charCodeAt(i) & 255;
    return new Blob([bytes], { type: "application/pdf" });
  }

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.rel = "noopener";
    a.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 4000);
    return true;
  }
  const fileBase = (I) => ("OEG-" + (I.name || "student").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 34)) + (I.id ? "-" + I.id : "") ;

  async function download(canvas, I, kind) {
    if (kind === "pdf") {
      const blob = pdfFromJpeg(dataURL(canvas, "image/jpeg"), W, H);
      return saveBlob(blob, fileBase(I) + ".pdf");
    }
    const blob = await grab(canvas, "image/png");
    return saveBlob(blob, fileBase(I) + ".png");
  }
  async function share(canvas, I) {
    const blob = await grab(canvas, "image/png");
    const file = new File([blob], fileBase(I) + ".png", { type: "image/png" });
    const text = "🏅 " + OEG.t("quiz.certTitle") + " — " + I.name + " · " + I.catLabel + " · " + I.pct + "%\n" + OEG.siteUrl();
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: OEG.siteName(), text: text }); return "shared"; } catch (e) { if (e && e.name === "AbortError") return "cancel"; }
    }
    if (navigator.share) { try { await navigator.share({ title: OEG.siteName(), text: text, url: OEG.siteUrl() }); return "shared"; } catch (e) { if (e && e.name === "AbortError") return "cancel"; } }
    saveBlob(blob, fileBase(I) + ".png");
    return "saved";
  }

  return { W: W, H: H, info: info, paint: paint, render: render, download: download, share: share, pdfFromJpeg: pdfFromJpeg, PRAISE: PRAISE, SUBJECT_LABEL: SUBJECT_LABEL };
})();
