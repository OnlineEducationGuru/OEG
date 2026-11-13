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
    return {
      title: txt(o.title) || T("quiz.certTitle"),
      sub: txt(o.sub) || T("quiz.certSub"),
      site: o.site || OEG.siteName(),
      url: (o.url || OEG.siteUrl() || "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
      name: name,
      praise: txt(praise),
      subject: txt(o.subjectLabel) || txt(SUBJECT_LABEL[subjKey] || ""),
      subjectKey: subjKey,
      catLabel: o.catLabel || txt(cat.label || key) || T("page.quiz"),
      grade: o.grade && o.grade !== "all" ? OEG.gradeLabel(o.grade) : "",
      body: body,
      pct: pct, right: Number(o.right) || 0, total: Number(o.total) || 0, pass: Number(o.pass) || 60,
      date: date, id: o.id || "", lang: OEG.state.lang
    };
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
  const measured = (c, text, font) => { c.font = font; return c.measureText(text).width; };
  /* મોટાઈ ઘટાડીને લાઈન ફિટ કરો */
  const fit = (c, text, weight, size, family, maxW) => {
    let s = size;
    while (s > 14 && measured(c, text, weight + " " + s + "px " + family) > maxW) s -= Math.max(1, s * 0.04);
    return s;
  };
  const wrap = (c, text, font, maxW, maxLines) => {
    c.font = font;
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = []; let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
      if (lines.length === maxLines) break;
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    return lines;
  };
  const center = (c, text, font, y, color, maxW, weight, family) => {
    if (maxW) { const s = fit(c, text, weight, sizeOf(font), family || BODY, maxW); font = weight + " " + s + "px " + (family || BODY); }
    c.font = font; c.textAlign = "center"; c.fillStyle = color; c.fillText(text, W / 2, y);
  };
  const sizeOf = (font) => { const m = /(\d+(?:\.\d+)?)px/.exec(font); return m ? Number(m[1]) : 32; };

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
  function paint(canvas, o) {
    const I = info(o);
    const c = canvas.getContext("2d");
    if (!c) return I;
    canvas.width = W; canvas.height = H;
    c.clearRect(0, 0, W, H);

    /* 1) બેકગ્રાઉન્ડ: ઊંડો ગ્રેડિયન્ટ + કોણિયာશી આભા + સૂક્ષ્મ રેખાઓ */
    const bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#141a3c"); bg.addColorStop(0.45, "#1d2456"); bg.addColorStop(1, "#0f2036");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    [[W * 0.12, H * 0.1, W * 0.5, "rgba(99,102,241,.34)"], [W * 0.92, H * 0.94, W * 0.45, "rgba(6,182,212,.24)"], [W * 0.86, H * 0.06, W * 0.3, "rgba(217,119,6,.20)"]]
      .forEach(([x, y, rad, col]) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    c.save(); c.globalAlpha = 0.06; c.strokeStyle = "#dbeafe"; c.lineWidth = 1.2;
    for (let i = -H; i < W; i += 26) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); }
    c.restore();

    /* 2) સોનેરી ફ્રેમ + ખૂણાના ઓર્નામેન્ટ */
    c.save();
    rr(c, 40, 40, W - 80, H - 80, 30); c.lineWidth = 5; c.strokeStyle = GOLD2; c.stroke();
    rr(c, 62, 62, W - 124, H - 124, 22); c.lineWidth = 1.6; c.strokeStyle = "rgba(232,196,106,.55)"; c.stroke();
    c.lineWidth = 2.4; c.strokeStyle = GOLD2;
    [[92, 92, 1, 1], [W - 92, 92, -1, 1], [92, H - 92, 1, -1], [W - 92, H - 92, -1, -1]].forEach(([x, y, sx, sy]) => {
      c.beginPath(); c.moveTo(x, y + sy * 74); c.quadraticCurveTo(x, y, x + sx * 74, y); c.stroke();
      c.beginPath(); c.arc(x + sx * 30, y + sy * 30, 9, 0, Math.PI * 2); c.stroke();
    });
    c.restore();

    /* 3) અંદરનું ક્રીમ પાનું */
    rr(c, 104, 104, W - 208, H - 208, 16);
    const card = c.createLinearGradient(104, 104, W - 104, H - 104);
    card.addColorStop(0, "#fdfaf3"); card.addColorStop(0.5, "#fbf6ea"); card.addColorStop(1, "#f6f1e4");
    c.fillStyle = card; c.fill();
    c.save(); rr(c, 104, 104, W - 208, H - 208, 16); c.clip();
    c.globalAlpha = 0.05; c.fillStyle = DEEP;
    for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(W / 2, H * 0.52, 200 + i * 92, 0, Math.PI * 2); c.lineWidth = 1.1; c.strokeStyle = DEEP; c.stroke(); }
    c.restore();

    let y = 208;
    /* 4) બ્રાન્ડ + વેબસાઈટ એડ્રેસ (નાના અક્ષરે) */
    crest(c, W / 2 - (measured(c, I.site, "800 62px " + DISPLAY) / 2 + 46), y - 22, 30, GOLD);
    center(c, I.site, "800 62px " + DISPLAY, y, INK, 0);
    y += 46;
    c.textAlign = "center"; c.font = "600 27px " + BODY;
    const urlW = c.measureText(I.url).width;
    c.fillStyle = "#9a7b23"; c.fillText(I.url, W / 2, y);
    c.save(); c.strokeStyle = "rgba(185,138,31,.5)"; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(W / 2 - urlW / 2 - 130, y - 9); c.lineTo(W / 2 - urlW / 2 - 34, y - 9); c.stroke();
    c.beginPath(); c.moveTo(W / 2 + urlW / 2 + 34, y - 9); c.lineTo(W / 2 + urlW / 2 + 130, y - 9); c.stroke();
    c.restore();

    /* 5) શીર્ષક: પ્રમાણપત્ર */
    y += 116;
    const tSize = fit(c, I.title, "800", 112, DISPLAY, W - 620);
    c.font = "800 " + tSize + "px " + DISPLAY; c.textAlign = "center";
    const tg = c.createLinearGradient(W / 2 - 360, 0, W / 2 + 360, 0);
    tg.addColorStop(0, "#7c5a12"); tg.addColorStop(0.42, "#c99a2e"); tg.addColorStop(0.6, "#e8c46a"); tg.addColorStop(1, "#8a6a1c");
    c.fillStyle = tg; c.fillText(I.title, W / 2, y);
    try { c.save(); c.lineWidth = 1.2; c.strokeStyle = "rgba(140,105,20,.45)"; c.strokeText(I.title, W / 2, y); c.restore(); } catch (e) {}
    y += 44;
    center(c, I.sub, "600 34px " + BODY, y, SOFT, W - 700);
    /* પુનઃ: શીર્ષક પછીની સુશોભન રેખા */
    c.save(); c.strokeStyle = "rgba(185,138,31,.75)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(W / 2 - 300, y + 30); c.lineTo(W / 2 - 26, y + 30); c.stroke();
    c.beginPath(); c.moveTo(W / 2 + 26, y + 30); c.lineTo(W / 2 + 300, y + 30); c.stroke();
    c.fillStyle = GOLD; c.save(); c.translate(W / 2, y + 30); c.rotate(Math.PI / 4); c.fillRect(-8, -8, 16, 16); c.restore();
    c.restore();

    /* 6) "આ પ્રમાણપત્ર … આપવામાં આવે છે" */
    y += 106;
    center(c, I.body.presented, "400 33px " + BODY, y, SOFT, W - 640);

    /* 7) નામ (સૌથી મોટું) + નીચે પ્રશંસાની લાઈન */
    y += 92;
    const nSize = fit(c, I.name, "800", 96, DISPLAY, W - 660);
    c.font = "800 " + nSize + "px " + DISPLAY; c.textAlign = "center"; c.fillStyle = DEEP;
    c.fillText(I.name, W / 2, y);
    const nW = Math.max(360, c.measureText(I.name).width + 120);
    c.save(); c.translate(W / 2, y + 30);
    const ng = c.createLinearGradient(-nW / 2, 0, nW / 2, 0);
    ng.addColorStop(0, "rgba(201,154,46,0)"); ng.addColorStop(0.2, "#c99a2e"); ng.addColorStop(0.8, "#c99a2e"); ng.addColorStop(1, "rgba(201,154,46,0)");
    c.fillStyle = ng; c.fillRect(-nW / 2, 0, nW, 4);
    c.beginPath(); c.arc(-nW / 2, 2, 6, 0, Math.PI * 2); c.arc(nW / 2, 2, 6, 0, Math.PI * 2); c.fillStyle = GOLD; c.fill();
    c.restore();
    y += 76;
    const pl = wrap(c, I.praise, "italic 600 33px " + BODY, W - 700, 2);
    c.font = "italic 600 33px " + BODY; c.fillStyle = "#7a5f1b"; c.textAlign = "center";
    pl.forEach((ln, i) => c.fillText(ln, W / 2, y + i * 44));

    /* 8) કયા વિષયની ક્વિઝ — મુજબનું લખાણ */
    y += 44 * pl.length + 60;
    const quizLine = (I.lang === "en"
      ? "has successfully completed the " + I.catLabel + " online assessment"
      : I.lang === "hi" ? "ने “" + I.catLabel + "” ऑनलाइन प्रश्नोत्तरी सफलतापूर्वक पूरी की"
      : "એ “" + I.catLabel + "” ઓનલાઇન પ્રશ્નોત્તરી સફળતાપૂર્વક પૂરી કરી છે");
    const bl = wrap(c, quizLine, "400 34px " + BODY, W - 560, 2);
    c.font = "400 34px " + BODY; c.fillStyle = INK; c.textAlign = "center";
    bl.forEach((ln, i) => c.fillText(ln, W / 2, y + i * 46));
    y += 46 * bl.length + 10;

    /* 9) આંકડાની પટ્ટી */
    const chips = [
      { k: I.body.right, v: I.right + " / " + I.total },
      { k: I.body.score, v: I.pct + "%" },
      { k: I.body.pass, v: I.pass + "%" },
      { k: I.body.subject, v: I.subject || "—" }
    ];
    if (I.grade) chips.push({ k: I.body.grade, v: I.grade });
    const gap = 22, cw = Math.min(318, (W - 320 - gap * (chips.length - 1)) / chips.length), tot = cw * chips.length + gap * (chips.length - 1);
    let bx = (W - tot) / 2;
    y += 22;
    chips.forEach((ch) => {
      rr(c, bx, y, cw, 104, 14); c.fillStyle = "rgba(42,47,107,.05)"; c.fill();
      c.lineWidth = 1.4; c.strokeStyle = "rgba(185,138,31,.4)"; c.stroke();
      c.textAlign = "center"; c.font = "700 21px " + BODY; c.fillStyle = "#8d93ad";
      c.fillText(String(ch.k).toUpperCase(), bx + cw / 2, y + 38);
      const vs = fit(c, String(ch.v), "800", 38, DISPLAY, cw - 26);
      c.font = "800 " + vs + "px " + DISPLAY; c.fillStyle = DEEP;
      c.fillText(String(ch.v), bx + cw / 2, y + 82);
      bx += cw + gap;
    });

    /* 10) તારીખ + ક્રમાંક + મોહર */
    const by = H - 176;
    c.textAlign = "left"; c.font = "700 21px " + BODY; c.fillStyle = "#8d93ad";
    c.fillText(String(I.body.date).toUpperCase(), 214, by - 34);
    c.font = "800 33px " + DISPLAY; c.fillStyle = INK; c.fillText(I.date, 214, by + 8);
    if (I.id) {
      c.font = "700 21px " + BODY; c.fillStyle = "#8d93ad";
      c.fillText(String(I.body.no).toUpperCase(), 214, by + 58);
      c.font = "800 27px " + BODY; c.fillStyle = "#7a5f1b"; c.fillText(I.id, 214, by + 94);
    }
    seal(c, W - 250, by + 8, 88, I.body.badge);
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
