/* ============================================================
   OEG Auth — GitHub Users Store (no Firebase needed)
   ------------------------------------------------------------
   બધા એકાઉન્ટ્સ રિપોની data/users.json ફાઈલમાં સેવ થાય છે.
   પાસવર્ડ ક્યારેય plaintext માં નથી — SHA-256 + per-user salt.
   Firebase apiKey ભર્યું હોય તો એ માર્ગો વાપરાય છે (optional).
   ============================================================ */
OEG.auth = (() => {
  const LS_USER = "oeg-user";
  const USERS_FILE = "data/users.json";

  const cfg = () => OEG.state.config || {};
  const apiKey = () => (cfg().firebase && cfg().firebase.apiKey) || "";
  const isFirebase = () => !!apiKey();

  const save = (u) => { OEG.state.user = u; try { localStorage.setItem(LS_USER, JSON.stringify(u)); } catch (e) {} };
  const load = () => { try { OEG.state.user = JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch (e) { OEG.state.user = null; } return OEG.state.user; };
  const norm = (e) => String(e || "").trim().toLowerCase();

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
  async function makeUserRecord({ name, email, password, role }) {
    const salt = randSalt();
    return { id: "u" + Date.now().toString(36), name: String(name || email).slice(0, 60), email: norm(email), role: role || "student", salt, hash: sha256hex(salt + ":" + password), created: new Date().toISOString().slice(0, 10) };
  }

  /* ---- વપરાશકર્તા-લિસ્ટ: પહેલા raw.githubusercontent (તરત અપડેટ), પછી Pages કોપી ---- */
  async function fetchUsers() {
    const g = cfg().github || {};
    const urls = [];
    if (g.owner && g.repo) urls.push(`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${g.branch || "main"}/${USERS_FILE}`);
    urls.push(USERS_FILE + "?ts=" + Date.now());
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.users)) return j; }
      } catch (e) {}
    }
    return { version: 1, users: [] };
  }

  function isAdminEmail(email) {
    const list = (((cfg().admin || {}).emails) || []).map(norm);
    return list.includes("*") || list.includes(norm(email));
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

  /* ---- રજિસ્ટર ----
     GitHub-Store મોડમાં: ફક્ત admin.emails લિસ્ટવાળો માલિક જાતે જ એકાઉન્ટ બનાવી શકે
     (એકવાર GitHub Token ભરીને — users.json રિપોમાં commit થાય).
     બાકીના સૌ માટે: Admin ને સંપર્ક કરો સંદેશ. */
  async function register({ name, email, password, role, token }) {
    email = norm(email);
    if (isFirebase()) {
      const j = await firebaseCall("accounts:signUp", { email, password, returnSecureToken: true });
      const user = { name, email, role, uid: j.localId, provider: "firebase" };
      save(user); return user;
    }
    if (!isAdminEmail(email)) { const e = new Error(OEG.t("auth.contactAdmin")); e.code = "need-admin"; throw e; }
    if (!token || !String(token).trim()) throw new Error(OEG.t("auth.tokenNeeded"));
    const users = await fetchUsers();
    if (users.users.some(u => norm(u.email) === email)) throw new Error(OEG.t("auth.exists"));
    users.users.push(await makeUserRecord({ name, email, password, role: "admin" }));
    const prevToken = OEG.state.gh.token;
    OEG.state.gh.token = String(token).trim();
    try {
      await OEG.gh.putFile(USERS_FILE, JSON.stringify(users, null, 2), "OEG: register owner account");
    } catch (err) { OEG.state.gh.token = prevToken; throw err; }
    /* આ ટેબમાં ટોકન રહે છે — Admin Panel તરત કનેક્ટેડ મળશે */
    const user = { name, email, role: "admin", provider: "github" };
    save(user);
    return user;
  }

  async function login({ email, password }) {
    email = norm(email);
    if (isFirebase()) {
      const j = await firebaseCall("accounts:signInWithPassword", { email, password, returnSecureToken: true });
      const user = { name: email.split("@")[0], email, role: "user", uid: j.localId, provider: "firebase" };
      save(user); return user;
    }
    const users = await fetchUsers();
    const u = users.users.find(x => norm(x.email) === email);
    if (!u) throw new Error(OEG.t("auth.noUser"));
    if (sha256hex(u.salt + ":" + password) !== u.hash) throw new Error(OEG.t("auth.badpass"));
    const user = { name: u.name, email, role: u.role || "user", provider: "github" };
    save(user);
    return user;
  }

  /* ---- Admin Panel થી વપરાશકર્તા મેનેજમેન્ટ (GitHub જોડાયેલું હોવું જોઈએ) ---- */
  async function saveUsers(users, message) {
    await OEG.gh.putFile(USERS_FILE, JSON.stringify({ version: 1, users }, null, 2), message);
  }
  async function addUser({ name, email, password, role }) {
    email = norm(email);
    const users = await fetchUsers();
    if (users.users.some(u => norm(u.email) === email)) throw new Error(OEG.t("auth.exists"));
    users.users.push(await makeUserRecord({ name, email, password, role }));
    await saveUsers(users.users, "OEG: add user " + email);
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

  function logout() { OEG.state.user = null; try { localStorage.removeItem(LS_USER); } catch (e) {} }

  return { register, login, logout, load, isFirebase, fetchUsers, makeUserRecord, addUser, removeUser, resetPassword, isAdminEmail, sha256hex };
})();
