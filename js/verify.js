/* ============================================================
   OEG Verify — રજિસ્ટ્રેશન ની ચકાસણી (ઈમેઈલ + વૉટ્સએપ નંબર)
   ------------------------------------------------------------
   નિયમ Admin → 👥 ખાતાં માંથી બદલાય (data/site-config.json → auth):
     emailDomains   : ફક્ત આ ડોમેઈન ચાલે (ધોર: gmail.com)
     requirePhone   : વૉટ્સએપ નંબર ફરજિયાત
     googleClientId : ભર્યું હોય તો "Google વડે ચકાસો" ⇒ ઈમેઈલ ખરેખર ચાલુ (active)
                      અને હస్తાંમાં જ હોય એની ખાતરી (કોઈ સર્વર નહીં)
     otpEndpoint    : Apps Script/OTP webhook ભર્યું હોય તો નંબર OTP થી ચકાસાય
   ============================================================ */
OEG.verify = (() => {
  const DEF = {
    emailDomains: "gmail.com",
    userMin: 6,
    userMax: 30,
    requirePhone: true,
    phoneCountry: "91",
    phoneLen: 10,
    checkPatterns: true,
    googleClientId: "",
    requireGoogle: false,
    otpEndpoint: ""
  };
  const cfg = () => {
    const a = (OEG.state.config && OEG.state.config.auth) || {};
    const o = {};
    Object.keys(DEF).forEach((k) => {
      const v = a[k];
      o[k] = (v === undefined || v === null || v === "") ? DEF[k] : v;
    });
    return o;
  };
  const msg = (key, arg) => {
    const txt = OEG.t(key);
    if (!txt || txt === key) return String(arg || key || "");
    return txt.replace(/\{x\}/g, String(arg == null ? "" : arg));
  };
  const t = (key, params) => {
    let s = OEG.t(key);
    Object.keys(params || {}).forEach((k) => { s = s.split("{" + k + "}").join(params[k]); });
    return s;
  };
  const domains = () => String(cfg().emailDomains || "")
    .split(/[\s,;]+/).map((d) => d.trim().replace(/^@+/, "").toLowerCase()).filter(Boolean);

  /* ---------- 📧 ઈમેઈલ ---------- */
  /* Gmail નાં નિયમ: ૬–૩૦ અક્ષર, ફક્ત a–z 0–9 . _  (ડ્રાફ્ટ માં - ન ચાલે), બીજ/અંતે . નહીં, .. નહીં */
  const NEAR = {
    "gmial.com": 1, "gmai.com": 1, "gmail.co": 1, "gmail.cm": 1, "gmail.con": 1, "gmail.om": 1,
    "gmail.con.in": 2, "gmail.com.in": 2, "gamil.com": 1, "gmil.com": 1, "gmaill.com": 1,
    "gmail.net": 2, "gmail.org": 2, "googlemail.com": 2, "gmail.commm": 2
  };
  function lev(a, b) {
    a = String(a); b = String(b);
    if (a === b) return 0;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }
  function suggestDomain(dom) {
    const list = domains();
    if (NEAR[dom] && list.indexOf("gmail.com") >= 0) return "gmail.com";
    let best = "", bd = 3;
    list.forEach((d) => { const x = lev(dom, d); if (x < bd) { bd = x; best = d; } });
    return best;
  }
  function email(raw) {
    const c = cfg();
    const v = String(raw == null ? "" : raw).trim().toLowerCase();
    if (!v) return { ok: false, key: "v.emailEmpty" };
    if ((v.match(/@/g) || []).length !== 1) return { ok: false, key: "v.emailBad" };
    const at = v.indexOf("@");
    const user = v.slice(0, at), dom = v.slice(at + 1);
    if (!user || !dom || dom.indexOf("@") >= 0) return { ok: false, key: "v.emailBad" };
    if (!/^[a-z0-9._]+$/.test(user)) return { ok: false, key: "v.emailChars" };
    if (/^\./.test(user) || /\.$/.test(user) || /\.\./.test(user)) return { ok: false, key: "v.emailDots" };
    if (user.length < Number(c.userMin || 6)) return { ok: false, key: "v.emailShort", arg: String(c.userMin) };
    if (user.length > Number(c.userMax || 30)) return { ok: false, key: "v.emailLong", arg: String(c.userMax) };
    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(dom)) return { ok: false, key: "v.emailBad" };
    const list = domains();
    const value = user + "@" + dom;
    if (list.indexOf(dom) < 0) {
      const near = suggestDomain(dom);
      if (near && near !== dom) return { ok: false, key: "v.emailTypo", arg: user + "@" + near, fix: user + "@" + near, bad: value };
      return { ok: false, key: "v.emailDomain", arg: list.join(", ") };
    }
    return { ok: true, value, user, domain: dom };
  }

  /* ---------- 📱 વૉટ્સએપ / મોબાઈલ નંબર ---------- */
  const BAD = ["1234567890", "9876543210", "1234512345", "9999999999", "8888888888", "7777777777",
    "0000000000", "1111111111", "1234509876", "6789101112", "9876501234", "1020304050", "9090909090"];
  function runs(s, n) {                 /* n અંક ની સતત ચડતા/ઉતરતા શ્રેણી */
    s = String(s);
    for (let i = 0; i + n <= s.length; i++) {
      let up = 1, dn = 1;
      for (let j = 1; j < n; j++) {
        const d = s.charCodeAt(i + j) - s.charCodeAt(i + j - 1);
        if (d !== 1) up = 0;
        if (d !== -1) dn = 0;
      }
      if (up || dn) return s.slice(i, i + n);
    }
    return "";
  }
  const repCount = (s) => { const m = {}; let best = 0; for (const ch of s) { m[ch] = (m[ch] || 0) + 1; if (m[ch] > best) best = m[ch]; } return best; };
  function phone(raw) {
    const c = cfg();
    const cc = String(c.phoneCountry || "91").replace(/\D/g, "") || "91";
    const len = Number(c.phoneLen || 10);
    let s = String(raw == null ? "" : raw).replace(/[^\d+]/g, "");
    if (/^\+/.test(s)) {
      const d = s.replace(/\D/g, "");
      if (d.indexOf(cc) !== 0) return { ok: false, key: "v.phoneCountry", arg: "+" + cc };
      s = d.slice(cc.length);
    } else if (/^00/.test(s)) {
      const d = s.replace(/\D/g, "").slice(2);
      s = d.indexOf(cc) === 0 ? d.slice(cc.length) : d;
    } else {
      s = s.replace(/\D/g, "");
      if (s.length === len + 1 && s[0] === "0") s = s.slice(1);
      else if (s.length === len + cc.length && s.indexOf(cc) === 0) s = s.slice(cc.length);
    }
    if (!s) return { ok: false, key: "v.phoneEmpty" };
    if (!new RegExp("^\\d{" + len + "}$").test(s)) return { ok: false, key: "v.phoneLen", arg: String(len) };
    if (String(c.phoneStart || "6-9") === "6-9" && !/^[6-9]/.test(s)) return { ok: false, key: "v.phoneStart" };
    if (c.checkPatterns) {
      if (BAD.indexOf(s) >= 0) return { ok: false, key: "v.phoneFake" };
      if (repCount(s) >= 6) return { ok: false, key: "v.phoneRepeat" };
      if (runs(s, 6)) return { ok: false, key: "v.phoneSeq" };
      if (/^(\d)\1{2,}/.test(s.slice(5))) return { ok: false, key: "v.phoneRepeat" };
    }
    return { ok: true, value: s, e164: "+" + cc + s, intl: "+" + cc + " " + s.slice(0, 5) + " " + s.slice(5) };
  }

  /* ---------- 🔓 Google Identity (ઈમેઈલ ખરેખર ચાલુ છે એની ખાતરી) ---------- */
  let gsiLoading = null;
  function loadGsi() {
    if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve(true);
    if (gsiLoading) return gsiLoading;
    gsiLoading = new Promise((res) => {
      try {
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = 1; s.defer = 1;
        s.onload = () => res(true);
        s.onerror = () => { gsiLoading = null; res(false); };
        document.head.appendChild(s);
      } catch (e) { gsiLoading = null; res(false); }
    });
    return gsiLoading;
  }
  function jwtPayload(tok) {
    try {
      const p = String(tok).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(p + "=".repeat((4 - (p.length % 4)) % 4));
      const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
      return JSON.parse(new TextDecoder("utf-8").decode(bytes));
    } catch (e) { return null; }
  }
  /* popup માં Google account માં sign-in ⇒ token નું email + email_verified ચકાસો */
  async function googleCheck(wantEmail) {
    const cid = String(cfg().googleClientId || "").trim();
    if (!cid) return { ok: false, key: "v.gsiNoId" };
    if (location.protocol !== "https:" && location.hostname !== "localhost") return { ok: false, key: "v.gsiInsecure" };
    const ok = await loadGsi();
    if (!ok || !window.google || !google.accounts || !google.accounts.id) return { ok: false, key: "v.gsiBlocked" };
    return await new Promise((res) => {
      let done = false;
      const finish = (r) => { if (done) return; done = true; res(r); };
      try {
        google.accounts.id.initialize({
          client_id: cid,
          callback: (resp) => {
            const p = jwtPayload(resp && resp.credential);
            if (!p) return finish({ ok: false, key: "v.gsiFail" });
            if (p.aud && p.aud !== cid) return finish({ ok: false, key: "v.gsiWrongApp" });
            const em = String(p.email || "").toLowerCase();
            if (!em || p.email_verified === false) return finish({ ok: false, key: "v.gsiUnverified" });
            if (wantEmail && em !== String(wantEmail).toLowerCase()) return finish({ ok: false, key: "v.gsiMismatch", arg: em });
            finish({ ok: true, email: em, at: Date.now(), picture: p.picture || "", name: p.name || "" });
          }
        });
        if (google.accounts.id.prompt) {
          google.accounts.id.prompt((n) => {
            if (n && n.isNotDisplayed && n.isNotDisplayed()) finish({ ok: false, key: "v.gsiNoFrame" });
            if (n && n.isSkippedMoment && n.isSkippedMoment()) finish({ ok: false, key: "v.gsiSkip" });
          });
          setTimeout(() => finish({ ok: false, key: "v.gsiWait" }), 240000);
        } else finish({ ok: false, key: "v.gsiBlocked" });
      } catch (e) { finish({ ok: false, key: "v.gsiBlocked", arg: String(e && e.message || "") }); }
    });
  }

  /* ---------- 🔢 વૉટ્સએપ OTP (વૈકલ્પિક webhook — Apps Script/Twilio/MSG91) ---------- */
  async function otpSend(number) {
    const ep = String(cfg().otpEndpoint || "").trim();
    if (!ep) return { ok: false, key: "v.otpOff" };
    const r = await fetch(ep + (ep.indexOf("?") < 0 ? "?" : "&") + "action=send&phone=" + encodeURIComponent(number), { method: "GET", mode: "cors" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.ok === false) throw new Error(j.message || OEG.t("v.otpFail"));
    return { ok: true };
  }
  async function otpCheck(number, code) {
    const ep = String(cfg().otpEndpoint || "").trim();
    if (!ep) return { ok: false, key: "v.otpOff" };
    const r = await fetch(ep + (ep.indexOf("?") < 0 ? "?" : "&") + "action=check&phone=" + encodeURIComponent(number) + "&code=" + encodeURIComponent(code), { method: "GET", mode: "cors" });
    const j = await r.json().catch(() => ({}));
    return j.ok ? { ok: true } : { ok: false, key: "v.otpBad" };
  }
  const otpReady = () => !!String(cfg().otpEndpoint || "").trim();

  /* ---------- 📤 webhook (આ ઉપકરણ બહાર નોંધ મોકલવા — v1 માં બંધ) ---------- */
  async function post(url, obj) {
    /* text/plain ⇒ browser preflight કરતું નથી (Apps Script doPost માં ચાલે) */
    const r = await fetch(String(url), {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(obj), mode: "cors", keepalive: true
    });
    return r.ok;
  }

  const googleOn = () => !!String(cfg().googleClientId || "").trim();
  const requireGoogle = () => googleOn() && !!cfg().requireGoogle;

  return { cfg, domains, msg, email, phone, googleCheck, googleOn, requireGoogle, otpSend, otpCheck, otpReady, post, lev };
})();
