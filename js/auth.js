/* ============================================================
   OEG Auth — GitHub Files (no Firebase)
   ------------------------------------------------------------
   સામાન્ય વપરાશકર્તા (વિદ્યાર્થી/શિક્ષક/આચાર્ય/અન્ય):
     login → data/users.json (Admin panel થી ઉમેરાયેલાં ખાતાં) + આ ઉપકરણ ની રજિસ્ટ્રેશન યાદી
     register → ખાતું બને એટલે તરત login (Admin ની મંજૂરી નહીં)
       • email + વૉટ્સએપ નંબર ની ચકાસણી: OEG.verify (js/verify.js)
       • નોંધ data/registrations.json માં સેવ કરી શકાય ⇒ Admin ને નામ/મોબાઈલ/ઈમેઈલ યાદી મળે
       • Admin ⇒ block / unblock (data/users.json માં blocked + blockedEmails) ⇒ બ્લોક ખાતું login કરી શકે નહીં
   Admin Panel:
     ફક્ત data/admin.json માં રાખેલ email + પાસવર્ડ થી જ ખુલે
     (પાસવર્ડ SHA-256 hash સ્વરૂપે સેવ — plaintext નહીં)
   ============================================================ */
OEG.auth = (() => {
  const LS_USER = "oeg-user";
  const LS_LOCAL = "oeg-users-local";   /* રજિસ્ટ્રેશન થયેલું ખાતું (એ જ ઉપકરણે login ચાલુ રહે) */
  const LS_REG = "oeg-reg-queue";       /* રજિસ્ટ્રેશન ની નોંધ (Admin યાદી માટે repo માં સેવ થાય) */
  const SS_ADMIN = "oeg-admin";
  const USERS_FILE = "data/users.json";
  const REG_FILE = "data/registrations.json";
  const ADMIN_FILE = "data/admin.json";

  const cfg = () => OEG.state.config || {};
  const apiKey = () => (cfg().firebase && cfg().firebase.apiKey) || "";
  const isFirebase = () => !!apiKey();
  const norm = (e) => String(e || "").trim().toLowerCase();

  const save = (u) => { OEG.state.user = u; try { localStorage.setItem(LS_USER, JSON.stringify(u)); } catch (e) {} };
  const load = () => { try { OEG.state.user = JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch (e) { OEG.state.user = null; } return OEG.state.user; };
  const localUsers = () => { try { const a = JSON.parse(localStorage.getItem(LS_LOCAL) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const addLocalUser = (u) => { try { localStorage.setItem(LS_LOCAL, JSON.stringify(localUsers().concat([u]))); } catch (e) {} };
  const localRegs = () => { try { const a = JSON.parse(localStorage.getItem(LS_REG) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const addLocalReg = (r) => {
    const list = localRegs().filter((x) => norm(x.email) !== norm(r.email));
    list.unshift(r);
    try { localStorage.setItem(LS_REG, JSON.stringify(list.slice(0, 200))); } catch (e) {}
  };
  const today = () => new Date().toISOString().slice(0, 10);
  const vk = (key, arg) => {
    try { if (OEG.verify && OEG.verify.msg) return OEG.verify.msg(key, arg); } catch (e) {}
    const txt = OEG.t(key);
    return txt && txt !== key ? txt.replace("{x}", arg || "") : (arg || key);
  };
  /* 🔒 બ્લોક સ્થિતિ — repo નાં ખાતાં (users[].blocked), repo ની બ્લોક યાદી, અને ઉપકરણ નું ખાતું */
  function blockState(email, doc) {
    const em = norm(email);
    if (!em) return { blocked: false };
    const u = ((doc && doc.users) || []).find((x) => norm(x.email) === em);
    if (u && u.blocked) return { blocked: true, reason: String(u.blocked === true ? "" : u.blocked) };
    const b = ((doc && doc.blockedEmails) || []).find((x) => norm(x && x.email ? x.email : x) === em);
    if (b) return { blocked: true, reason: String((b && b.reason) || "") };
    const loc = localUsers().find((x) => norm(x.email) === em);
    if (loc && loc.blocked) return { blocked: true, reason: String(loc.blocked === true ? "" : loc.blocked) };
    return { blocked: false };
  }
  const blockedMsg = (st) => {
    const why = st && st.reason ? " · " + OEG.t("auth.blockReason").replace("{x}", st.reason) : "";
    const ce = (OEG.state.config || {}).contactEmail;
    return "⛔ " + OEG.t("auth.blocked") + why + (ce ? " · " + ce : "");
  };

  /* ---- SHA-256 (pure JS — દરેક environment માં એકજ પરિણામ) ---- */
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  function sha256hex(str) {
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length, bitLen = len * 8;
    const total = (((len + 9 + 63) >> 6) << 6);
    const buf = new Uint8Array(total);
    buf.set(bytes); buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 8, Math.floor(bitLen / 4294967296), false);
    dv.setUint32(total - 4, bitLen >>> 0, false);
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H = [(H[0]+a)>>>0,(H[1]+b)>>>0,(H[2]+c)>>>0,(H[3]+d)>>>0,(H[4]+e)>>>0,(H[5]+f)>>>0,(H[6]+g)>>>0,(H[7]+h)>>>0];
    }
    return H.map(x => x.toString(16).padStart(8, "0")).join("");
  }
  function randSalt() {
    const a = new Uint8Array(8);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 256);
    return [...a].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  const cleanSub = (v) => {
    const k = String(v || "").trim().toLowerCase();
    const subs = ((OEG.tax && OEG.tax().gradeSubjects) || []).map(x => x.key);
    return k && k !== "all" && subs.indexOf(k) >= 0 ? k : "all";
  };
  const cleanGrade = (v) => {
    const k = String(v || "").trim().toLowerCase();
    if (!k || k === "all") return "all";
    const gs = ((OEG.tax && OEG.tax().grades) || []).map(x => x.key);
    return gs.indexOf(k) >= 0 ? k : "all";
  };
  async function makeUserRecord({ name, email, password, role, grade, subject, phone, verified }) {
    const salt = randSalt();
    const rec = { id: "u" + Date.now().toString(36), name: String(name || email).slice(0, 60), email: norm(email), role: role || "student", grade: cleanGrade(grade), subject: cleanSub(subject), phone: String(phone || "").replace(/\D/g, "").slice(-10), salt, hash: sha256hex(salt + ":" + password), created: new Date().toISOString().slice(0, 10) };
    if (verified) rec.verified = today();
    return rec;
  }

  /* ---- વપરાશકર્તા-લિસ્ટ: raw.githubusercontent (તરત અપડેટ), પછી Pages કોપી ---- */
  async function fetchUsers() {
    const g = cfg().github || {};
    const urls = [];
    if (g.owner && g.repo) urls.push(`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${g.branch || "main"}/${USERS_FILE}`);
    urls.push(OEG.base(USERS_FILE) + "?ts=" + Date.now());   /* બ્લોગર (CDN મોડ) પર પણ વાંચી શકાય */
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok) {
        const j = await r.json();
        if (j && Array.isArray(j.users)) {
          if (!Array.isArray(j.blockedEmails)) j.blockedEmails = [];
          return j;
        }
      }
      } catch (e) {}
    }
    return { version: 2, users: [], blockedEmails: [] };
  }

  /* ---- 📋 રજિસ્ટ્રેશન ની યાદી (repo data/registrations.json + આ ઉપકરણ ની નોંધ) ----
     Admin ને નામ / મોબાઈલ / ઈમેઈલ ની સંપૂર્ણ યાદી અહીંથી દેખાય.
     repo ફાઈલ = બધા ઉપકરણ માટે એક જ યાદી; ઉપકરણ ની નોંધ = ફક્ત એ જ browser. */
  async function fetchRegs() {
    const g = cfg().github || {};
    let doc = { v: 1, items: [] };
    const urls = [];
    if (g.owner && g.repo) urls.push(`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${g.branch || "main"}/${REG_FILE}`);
    urls.push(OEG.base(REG_FILE) + "?ts=" + Date.now());
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.items)) { doc = j; break; } }
      } catch (e) {}
    }
    const items = (doc.items || []).slice();
    const have = {};
    items.forEach((x) => { have[norm(x.email)] = 1; });
    const local = localRegs().filter((x) => !have[norm(x.email)]).map((x) => Object.assign({}, x, { device: 1 }));
    return { v: 1, items, all: local.concat(items) };
  }
  async function saveRegs(items, message) {
    await OEG.data.writeJson(REG_FILE, { v: 1, updated: today(), items: items || [] }, message || ("OEG: registrations " + (items || []).length));
    return true;
  }
  /* webhook (Google Sheet) ભર્યું હોય તો ત્યાં ની યાદી પણ જોડી શકાય */
  async function fetchRegsRemote() {
    const url = String(((cfg().auth || {}).webhookList || (cfg().auth || {}).webhook || "")).trim();
    if (!url) return [];
    const sep = url.indexOf("?") < 0 ? "?" : "&";
    try {
      const r = await fetch(url + sep + "action=list", { cache: "no-store" });
      if (!r.ok) return [];
      const j = await r.json();
      const list = Array.isArray(j) ? j : (j && Array.isArray(j.items) ? j.items : []);
      return list.map((x) => ({ name: x.name || "", email: norm(x.email || x[1] || ""), phone: String(x.phone || x.mobile || x[2] || "").replace(/\D/g, "").slice(-10), role: x.role || "student", at: String(x.at || x.date || "").slice(0, 10), verified: x.verified || "", source: "sheet" }));
    } catch (e) { return []; }
  }
  /* ---- 🚫 block / ✅ unblock (Admin) ---- */
  async function writeUsersDoc(doc, message) {
    const out = { version: 2, users: (doc.users || []).slice() };
    if ((doc.blockedEmails || []).length) out.blockedEmails = doc.blockedEmails.slice();
    out.updated = today();
    await OEG.gh.putFile(USERS_FILE, JSON.stringify(out, null, 2), message);
    return out;
  }
  async function setBlocked(email, on, reason) {
    email = norm(email);
    if (!email) throw new Error(OEG.t("auth.email"));
    let touched = false;
    const loc = localUsers();
    const li = loc.findIndex((u) => norm(u.email) === email);
    if (li >= 0) {
      if (on) loc[li].blocked = reason || today(); else delete loc[li].blocked;
      try { localStorage.setItem(LS_LOCAL, JSON.stringify(loc)); } catch (e) {}
      touched = true;
    }
    if (OEG.gh && OEG.gh.connected()) {
      const doc = await fetchUsers();
      doc.blockedEmails = (doc.blockedEmails || []).slice();
      const i = (doc.users || []).findIndex((u) => norm(u.email) === email);
      if (i >= 0) { if (on) doc.users[i].blocked = reason || today(); else delete doc.users[i].blocked; }
      doc.blockedEmails = doc.blockedEmails.filter((x) => norm(x && x.email ? x.email : x) !== email);
      if (on && i < 0) doc.blockedEmails.push({ email, reason: reason || "", at: today() });
      await writeUsersDoc(doc, "OEG: " + (on ? "block " : "unblock ") + email);
      touched = true;
    }
    if (!touched) throw new Error(OEG.t("admin.notConnected"));
    const cur = OEG.state.user;
    if (on && cur && norm(cur.email) === email) logout();
    return true;
  }
  async function blockList() {
    const doc = await fetchUsers();
    const out = {};
    (doc.users || []).forEach((u) => { if (u.blocked) out[norm(u.email)] = { reason: String(u.blocked === true ? "" : u.blocked), repo: 1 }; });
    (doc.blockedEmails || []).forEach((b) => { const k = norm(b && b.email ? b.email : b); out[k] = { reason: (b && b.reason) || "", repo: 1 }; });
    localUsers().forEach((u) => { if (u.blocked && !out[norm(u.email)]) out[norm(u.email)] = { reason: String(u.blocked === true ? "" : u.blocked), device: 1 }; });
    return out;
  }
  /* બ્લોક થયેલું ખાતું login કરી જ ન શકે ⇒ સેશન ચાલુ હોય તો તરત બંધ */
  async function enforceSession() {
    const u = OEG.state.user;
    if (!u || !u.email) return false;
    if (isFirebase()) return false;
    try {
      const doc = await fetchUsers();
      const st = blockState(u.email, doc);
      if (st.blocked) {
        logout();
        OEG.toast("⛔ " + blockedMsg(st));
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* ---- Firebase (optional — key ભર્યું હોય તો જ) ---- */
  async function firebaseCall(endpoint, body) {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${apiKey()}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "Firebase error");
    return j;
  }

  /* ---- રજિસ્ટ્રેશન (વિદ્યાર્થી/શિક્ષક/આચાર્ય/ઓફિસ) — મંજૂરી વગર તરત login ---- */
  async function register({ name, email, password, role, grade, subject, phone, verified }) {
    email = norm(email);
    /* ✅ ચકાસણી (Admin → 👥 ખાતાં માંથી નિયમ): ઈમેઈલ + વૉટ્સએપ નંબર */
    if (OEG.verify) {
      const e = OEG.verify.email(email);
      if (!e.ok) throw new Error(vk(e.key, e.arg || e.fix || ""));
      email = e.value;
      const needPhone = OEG.verify.cfg().requirePhone !== false;
      if (needPhone || phone) {
        const p = OEG.verify.phone(phone);
        if (!p.ok) throw new Error(vk(p.key, p.arg || ""));
        phone = p.value;
      }
      if (OEG.verify.requireGoogle() && !verified) throw new Error(OEG.t("v.gsiNeed"));
    }
    if (isFirebase()) {
      const j = await firebaseCall("accounts:signUp", { email, password, returnSecureToken: true });
      const user = { name, email, role, phone: String(phone || ""), uid: j.localId, provider: "firebase" };
      save(user); return user;
    }
    const users = await fetchUsers();
    const bs = blockState(email, users);
    if (bs.blocked) throw new Error(blockedMsg(bs));
    const all = (users.users || []).concat(localUsers());
    if (all.some(u => norm(u.email) === email)) throw new Error(OEG.t("auth.exists"));
    const rec = await makeUserRecord({ name, email, password, role, grade, subject, phone, verified });
    addLocalUser(rec);
    const reg = { name: rec.name, email, phone: rec.phone || "", role: rec.role, grade: rec.grade, subject: rec.subject, at: rec.created, verified: rec.verified || "", source: "web" };
    try { OEG.counts.add(email, rec.role); } catch (e) {}
    addLocalReg(reg);
    const user = { name: rec.name, email, role: rec.role, grade: rec.grade, subject: rec.subject, phone: rec.phone || "", provider: "local" };
    save(user);
    /* 🔁 webhook ભર્યું હોય (Google Sheet / Apps Script) ⇒ નોંધ તરત ત્યાં મોકલાય (બધા ઉપકરણ ની યાદી એ જ જગ્યાએ) */
    const hook = String(((OEG.state.config || {}).auth || {}).webhook || "").trim();
    if (hook) { try { await OEG.verify.post(hook, { type: "register", ...reg }); } catch (e) {} }
    return user;                                  /* ⇒ કોઈ Admin મંજૂરી નહીં, એકાઉન્ટ તરત ચાલુ */
  }

  /* ---- લોગિન ---- */
  async function login({ email, password }) {
    email = norm(email);
    if (isFirebase()) {
      const j = await firebaseCall("accounts:signInWithPassword", { email, password, returnSecureToken: true });
      const user = { name: email.split("@")[0], email, role: "user", uid: j.localId, provider: "firebase" };
      save(user); return user;
    }
    const users = await fetchUsers();
    const u = (users.users || []).concat(localUsers()).find(x => norm(x.email) === email);
    if (!u) throw new Error(OEG.t("auth.noUser"));
    const bs = blockState(email, users);
    if (bs.blocked) throw new Error(blockedMsg(bs));
    if (sha256hex(u.salt + ":" + password) !== u.hash) throw new Error(OEG.t("auth.badpass"));
    const user = { name: u.name, email, role: u.role || "user", grade: u.grade || "all", subject: cleanSub(u.subject), phone: u.phone || "", provider: "github" };
    save(user);
    return user;
  }

  /* ============ ADMIN — ફક્ત data/admin.json ના email+password થી ============ */
  /* ---- data/admin.json (v2): email base64 માં + પાસવર્ડ sha256 hash માં ----
     { "v": 2, "email": "<base64>", "pass": "<sha256-hex>", "updated": "YYYY-MM-DD" }
     જાતે GitHub પર edit કરો તો પણ ચાલે: plain email, plain pass, passHash — બધું ટોલરેટ થાય. */
  const b64enc = (v) => btoa(unescape(encodeURIComponent(String(v))));
  const b64dec = (v) => {
    const t = String(v == null ? "" : v).trim();
    if (!t || t.length % 4 === 1 || /[^A-Za-z0-9+/=]/.test(t)) return t;
    try {
      const d = decodeURIComponent(escape(atob(t)));
      return /^[\x20-\x7E\u00A0-\uFFFF]+$/.test(d) ? d : t;
    } catch (e) { return t; }
  };
  const HEX64 = /^[0-9a-f]{64}$/;
  function parseAdminCreds(raw) {
    raw = raw || {};
    let email = String(raw.email || "").trim();
    if (email && email.indexOf("@") < 0) email = b64dec(email);
    email = norm(email);
    const cand = [raw.pass, raw.passHash, raw.pwdHash, raw.pwd && raw.pwd.hash].filter(v => v != null && String(v).trim() !== "")[0];
    let val = String(cand == null ? "" : cand).trim();
    const dec = b64dec(val);
    if (dec && dec.indexOf("sha256:") === 0) val = dec.slice(7);
    if (HEX64.test(val)) return { email, hash: val.toLowerCase(), plain: "", updated: raw.updated || "" };
    return { email, hash: "", plain: val, updated: raw.updated || "" };
  }
  function adminRecord({ email, password }, prev) {
    const rec = { v: 2 };
    rec.email = b64enc(email ? norm(email) : (prev && prev.email) || "");
    rec.pass = password ? sha256hex(String(password)) : ((prev && (prev.hash || prev.plain)) || "");
    rec.updated = new Date().toISOString().slice(0, 10);
    return rec;
  }
  const adminConfigured = (adm) => !!(adm && adm.email && (adm.hash || adm.plain));

  async function getAdminFile() {
    const g = cfg().github || {};
    const urls = [];
    if (g.owner && g.repo) urls.push(`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${g.branch || "main"}/${ADMIN_FILE}`);
    urls.push(OEG.base(ADMIN_FILE) + "?ts=" + Date.now());
    for (const u of urls) {
      try { const r = await fetch(u, { cache: "no-store" }); if (r.ok) return parseAdminCreds(await r.json()); } catch (e) {}
    }
    return parseAdminCreds(null);
  }
  const unlocked = () => { try { return sessionStorage.getItem(SS_ADMIN) === "1"; } catch (e) { return false; } };
  const lockAdmin = () => { try { sessionStorage.removeItem(SS_ADMIN); sessionStorage.removeItem(SS_TOKEN); } catch (e) {} };

  async function loginAdmin({ email, password, token, remember }) {
    const adm = await getAdminFile();
    const typed = String(token || "").trim();
    let tok = typed;
    const wantsSetup = !!typed || !adminConfigured(adm);
    if (!tok) tok = await recallSecret();          /* 📱 ઉપકરણ પર સેવ કરેલો કોડ (સિધું login માં setup ન કરે) */
    if (wantsSetup) {
      /* Setup / પાસવર્ડ રીસેટ: email + પાસવર્ડ + સિક્રેટ કોડ (એકવાર) → hash કરી સુરક્ષિત સેવ */
      if (!tok) throw new Error(OEG.t("admin.setupNeedToken"));
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) throw new Error(OEG.t("admin.badCred"));
      if (String(password).length < 6) throw new Error(OEG.t("admin.badCred"));
      OEG.state.gh.token = tok;
      await OEG.gh.putFile(ADMIN_FILE, JSON.stringify(adminRecord({ email, password }), null, 2), "OEG: admin account setup");
      if (typed && remember !== false) await saveSecret(typed);
      try { sessionStorage.setItem(SS_ADMIN, "1"); } catch (e) {}
      return { setup: true };
    }
    if (norm(email) !== adm.email) throw new Error(OEG.t("admin.badCred"));
    const pw = String(password);
    if (typed && remember !== false) await saveSecret(typed);
    const ok = adm.hash ? sha256hex(pw) === adm.hash : pw === adm.plain;
    if (!ok) throw new Error(OEG.t("admin.badCred"));
    try { sessionStorage.setItem(SS_ADMIN, "1"); } catch (e) {}
    if (!adm.hash && OEG.gh.connected()) {
      /* plain password મળ્યું હોય તો તરત hash માં સુરક્ષિત કરી દો */
      try { await OEG.gh.putFile(ADMIN_FILE, JSON.stringify(adminRecord({ email: adm.email, password: pw }, adm), null, 2), "OEG: secure admin password"); } catch (e) {}
    }
    return { ok: true };
  }
  async function setAdminAccount({ email, password }) {
    const adm = await getAdminFile();
    const rec = adminRecord({ email: email || adm.email, password }, adm);
    await OEG.gh.putFile(ADMIN_FILE, JSON.stringify(rec, null, 2), "OEG: update admin account");
    return true;
  }

  /* ---- Admin Panel થી વપરાશકર્તા મેનેજમેન્ટ (GitHub જોડાયેલું હોવું જોઈએ) ---- */
  async function saveUsers(users, message) {
    const doc = await fetchUsers().catch(() => ({ blockedEmails: [] }));
    await writeUsersDoc({ users, blockedEmails: doc.blockedEmails || [] }, message);
  }
  async function addUser({ name, email, password, role, grade, subject, phone, verified }) {
    email = norm(email);
    const users = await fetchUsers();
    if (users.users.some(u => norm(u.email) === email)) throw new Error(OEG.t("auth.exists"));
    users.users.push(await makeUserRecord({ name, email, password, role, grade, subject, phone, verified }));
    await writeUsersDoc(users, "OEG: add user " + email);
    return true;
  }
  /* રજિસ્ટ્રેશન ની નોંધ ⇒ ખાતું (Admin ઈચ્છે તો) — પાસવર્ડ Admin પોતે ભરે */
  async function addRegAsUser(rec, password) {
    if (!rec || !rec.email) throw new Error(OEG.t("auth.email"));
    await addUser({
      name: rec.name, email: rec.email, password, phone: rec.phone, verified: rec.verified,
      role: rec.role || "student", grade: rec.grade || "all", subject: rec.subject || "all"
    });
    const list = localRegs().filter((x) => norm(x.email) !== norm(rec.email));
    try { localStorage.setItem(LS_REG, JSON.stringify(list)); } catch (e) {}
    return true;
  }
  async function removeUser(email) {
    const users = await fetchUsers();
    const next = users.users.filter(u => norm(u.email) !== norm(email));
    if (next.length === users.users.length) throw new Error(OEG.t("auth.noUser"));
    await saveUsers(next, "OEG: remove user " + norm(email));
    return true;
  }
  async function resetPassword(email, password) {
    const users = await fetchUsers();
    const u = users.users.find(x => norm(x.email) === norm(email));
    if (!u) throw new Error(OEG.t("auth.noUser"));
    const salt = randSalt();
    u.salt = salt; u.hash = sha256hex(salt + ":" + password);
    await saveUsers(users.users, "OEG: reset password " + norm(email));
    return true;
  }

  function logout() { OEG.state.user = null; lockAdmin(); try { localStorage.removeItem(LS_USER); } catch (e) {} }


  /* ---- 📱 Device Vault — સિક્રેટ કોડ ફક્ત આ બ્રાઉઝરમાં (GitHub પર ક્યાંય નહીં) ----
     localStorage માં AES-GCM એન્ક્રિપ્ટેડ રૂપમાં રહે છે (device key વડે),
     એટલે repo/folder માં શોધો તો કંઈ મળે નહીં, અને localStorage ખોલો તો પણ
     ગબડતું random string સિવાય કંઈ દેખાશે નહીં. Tab દરમિયાન sessionStorage cache
     રાખે છે જેથી reload પર ફરી પૂછવું ન પડે. lockAdmin()/logout() એ cache કાઢી નાખે છે. */
  const LS_VAULT = "oeg.v.9f2c";
  const LS_MASK = "oeg.k.9f2c";
  const SS_TOKEN = "oeg.t.9f2c";
  const enc8 = new TextEncoder(), dec8 = new TextDecoder();
  const b64f = (buf) => { const a = new Uint8Array(buf); let o = ""; for (let i = 0; i < a.length; i++) o += String.fromCharCode(a[i]); return btoa(o); };
  const unb64f = (str) => Uint8Array.from(atob(String(str)), c => c.charCodeAt(0));
  const rndBytes = (n) => {
    const a = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    return a;
  };
  const hasSubtle = () => !!(window.crypto && crypto.subtle && crypto.subtle.importKey && crypto.subtle.deriveKey);
  function keystream(seed, len) {
    const out = new Uint8Array(len);
    for (let off = 0; off < len; off += 32) {
      const hex = sha256hex(seed + "|" + (off >> 5));
      for (let j = 0; j < 32 && off + j < len; j++) out[off + j] = parseInt(hex.substr(j * 2, 2), 16);
    }
    return out;
  }
  function xorBytes(bytes, ks) { const o = new Uint8Array(bytes.length); for (let i = 0; i < bytes.length; i++) o[i] = bytes[i] ^ ks[i]; return o; }
  function devKey() {
    let masked = null;
    try { masked = localStorage.getItem(LS_MASK); } catch (e) {}
    if (!masked) {
      const k = b64f(rndBytes(24));
      try { localStorage.setItem(LS_MASK, b64f(xorBytes(enc8.encode(k), keystream(LS_MASK, k.length)))); } catch (e) {}
      return k;
    }
    try { return dec8.decode(xorBytes(unb64f(masked), keystream(LS_MASK, unb64f(masked).length))); } catch (e) { return masked; }
  }
  const vaultMaterial = () => devKey() + "|oeg-v1";
  async function seal(plain) {
    plain = String(plain || "").trim();
    if (!plain) return "";
    const material = vaultMaterial();
    if (hasSubtle()) {
      const salt = rndBytes(16), iv = rndBytes(12), iter = 120000;
      const base = await crypto.subtle.importKey("raw", enc8.encode(material), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc8.encode(plain));
      return JSON.stringify({ a: "A", i: iter, s: b64f(salt), v: b64f(iv), d: b64f(ct) });
    }
    const bytes = enc8.encode(plain), salt = b64f(rndBytes(6));
    const ks = keystream(material + "|" + salt + "|" + bytes.length, bytes.length);
    /* k = integrity tag: ખોટું ઉપકરણ / બદલાયેલો ડેટા તરત પકડાય */
    return JSON.stringify({ a: "X", s: salt, k: sha256hex(plain).slice(0, 12), d: b64f(xorBytes(bytes, ks)) });
  }
  async function open(blob) {
    try {
      const j = typeof blob === "string" ? JSON.parse(blob) : blob;
      if (!j || !j.d) return "";
      const material = vaultMaterial();
      if (j.a === "A") {
        if (!hasSubtle()) return "";
        const base = await crypto.subtle.importKey("raw", enc8.encode(material), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: unb64f(j.s), iterations: j.i || 120000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        return dec8.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64f(j.v) }, key, unb64f(j.d))).trim();
      }
      const bytes = unb64f(j.d);
      const pt = dec8.decode(xorBytes(bytes, keystream(material + "|" + (j.s || "") + "|" + bytes.length, bytes.length))).trim();
      if (j.k && sha256hex(pt).slice(0, 12) !== j.k) return "";
      return pt;
    } catch (e) { return ""; }
  }
  async function saveSecret(token) {
    token = String(token || OEG.state.gh.token || "").trim();
    if (!token) return false;
    const blob = await seal(token);
    try { if (blob) localStorage.setItem(LS_VAULT, blob); } catch (e) { return false; }
    try { sessionStorage.setItem(SS_TOKEN, token); } catch (e) {}
    OEG.state.gh.token = token;
    return true;
  }
  async function recallSecret() {
    let tok = "";
    try { tok = sessionStorage.getItem(SS_TOKEN) || ""; } catch (e) {}
    if (tok) { OEG.state.gh.token = tok; return tok; }
    let blob = null;
    try { blob = localStorage.getItem(LS_VAULT); } catch (e) {}
    if (!blob) return "";
    tok = await open(blob);
    if (tok) {
      OEG.state.gh.token = tok;
      try { sessionStorage.setItem(SS_TOKEN, tok); } catch (e) {}
    }
    return tok;
  }
  const hasSecret = () => { try { return !!(localStorage.getItem(LS_VAULT) || sessionStorage.getItem(SS_TOKEN)); } catch (e) { return false; } };
  function forgetSecret() {
    try { localStorage.removeItem(LS_VAULT); localStorage.removeItem(LS_MASK); sessionStorage.removeItem(SS_TOKEN); } catch (e) {}
    OEG.state.gh.token = "";
  }

  /* ---------- 👥 હોમ પેજ નાં સભ્ય આંકડા ----------
     Admin (⚙️ સાઇટ સેટિંગ્સ) ભરેલી શરૂઆત ની સંખ્યા + ખરાં ખાતાં/રજિસ્ટ્રેશન (એક ઈમેઈલ ⇒ એક વાર).
     નવું રજિસ્ટ્રેશન થાય એટલે add() ⇒ આંક તરત વધે (repo સેવ થાય એટલે બધા ઉપકરણ પર). */
  OEG.counts = (() => {
    const ROLES = ["student", "teacher", "principal", "other"];
    const DEF = { student: 1250, teacher: 96, principal: 24, other: 38 };
    const key = (r) => { const k = String(r || "").toLowerCase(); return ROLES.indexOf(k) >= 0 ? k : "other"; };
    const base = () => {
      const c = ((OEG.state.config || {}).ui || {}).counts || {};
      const o = {};
      ROLES.forEach((k) => { const n = Number(c[k]); o[k] = isFinite(n) && n >= 0 ? Math.round(n) : DEF[k]; });
      return o;
    };
    let recs = {}, out = null, job = null, loaded = false;
    function calc() {
      const o = base(); o.total = 0; o.real = 0;
      Object.keys(recs).forEach((e) => { const k = recs[e]; o[k] = (o[k] || 0) + 1; o.real++; });
      ROLES.forEach((k) => { o.total += o[k]; });
      out = o;
      return o;
    }
    function add(email, role) {
      const e = String(email || "").toLowerCase();
      if (!e || recs[e]) return out || calc();
      recs[e] = key(role);
      return calc();
    }
    async function refresh(force) {
      if (loaded && !force) return out;
      if (job && !force) return job;
      job = (async () => {
        const rows = {};
        const put = (x) => {
          const e = String((x && x.email) || "").toLowerCase();
          if (!e || rows[e] || (x && x.blocked)) return;
          rows[e] = key(x.role);
        };
        try { const u = await fetchUsers(); (u.users || []).forEach(put); } catch (e) {}
        try { const r = await fetchRegs(); (r.all || []).forEach(put); } catch (e) {}
        recs = rows; job = null; loaded = true;
        return calc();
      })();
      return job;
    }
    return { ROLES, key, base, get: () => out || calc(), add, refresh };
  })();

  const SUBJECTS7 = () => ((OEG.tax && OEG.tax().gradeSubjects) || []).slice();
  return { SUBJECTS7, register, login, logout, load, isFirebase, fetchUsers, makeUserRecord, addUser, removeUser, resetPassword,
    REG_FILE, localRegs, addLocalReg, fetchRegs, saveRegs, fetchRegsRemote, setBlocked, blockList, blockState, enforceSession, addRegAsUser, writeUsersDoc, sha256hex, getAdminFile, loginAdmin, setAdminAccount, adminRecord, parseAdminCreds, adminConfigured, unlocked, lockAdmin, saveSecret, recallSecret, hasSecret, forgetSecret };
})();
