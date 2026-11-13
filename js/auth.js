/* ============================================================
   OEG Auth — Firebase Auth REST (real) + Demo Mode fallback
   Firebase Web API Key config.js / site-config.json માં ભરો.
   ============================================================ */
OEG.auth = (() => {
  const LS_USER = "oeg-user";
  const LS_DEMO = "oeg-demo-users";
  const apiKey = () => (OEG.state.config.firebase && OEG.state.config.firebase.apiKey) || "";
  const isFirebase = () => !!apiKey();

  const save = (u) => { OEG.state.user = u; try { localStorage.setItem(LS_USER, JSON.stringify(u)); } catch (e) {} };
  const load = () => { try { OEG.state.user = JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch (e) { OEG.state.user = null; } return OEG.state.user; };
  const demoUsers = () => { try { return JSON.parse(localStorage.getItem(LS_DEMO) || "{}"); } catch (e) { return {}; } };
  const saveDemo = (u) => { try { localStorage.setItem(LS_DEMO, JSON.stringify(u)); } catch (e) {} };

  async function firebaseCall(endpoint, body) {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${apiKey()}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "Firebase error");
    return j;
  }

  async function register({ name, email, password, role }) {
    if (isFirebase()) {
      const j = await firebaseCall("accounts:signUp", { email, password, returnSecureToken: true });
      const user = { name, email, role, uid: j.localId, provider: "firebase" };
      save(user); return user;
    }
    const users = demoUsers();
    if (users[email]) throw new Error("Email already registered (demo)");
    users[email] = { name, email, password, role };
    saveDemo(users);
    const user = { name, email, role, uid: "demo-" + Date.now(), provider: "demo" };
    save(user); return user;
  }

  async function login({ email, password }) {
    if (isFirebase()) {
      const j = await firebaseCall("accounts:signInWithPassword", { email, password, returnSecureToken: true });
      const user = { name: email.split("@")[0], email, role: "user", uid: j.localId, provider: "firebase" };
      save(user); return user;
    }
    const users = demoUsers();
    const u = users[email];
    if (!u || u.password !== password) throw new Error("Invalid email or password (demo)");
    const user = { name: u.name, email: u.email, role: u.role, uid: "demo-" + email, provider: "demo" };
    save(user); return user;
  }

  function logout() { OEG.state.user = null; try { localStorage.removeItem(LS_USER); } catch (e) {} }
  return { register, login, logout, load, isFirebase };
})();
