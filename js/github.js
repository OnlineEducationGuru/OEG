/* ============================================================
   OEG GitHub Client — Contents API + Git Data API
   Token: fine-grained PAT (Contents: Write). Memory only.
   ============================================================ */
OEG.gh = (() => {
  const api = () => `https://api.github.com/repos/${OEG.state.gh.owner}/${OEG.state.gh.repo}`;
  const headers = () => ({
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${OEG.state.gh.token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  });
  const connected = () => !!(OEG.state.gh.owner && OEG.state.gh.repo && OEG.state.gh.token);

  async function req(method, path, body) {
    const r = await fetch(api() + path, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.message || r.statusText) + (j.errors ? " — " + JSON.stringify(j.errors) : ""));
    return j;
  }

  /* --- Read a file (returns {content, sha}) --- */
  async function getFile(path) {
    const j = await req("GET", `/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${OEG.state.gh.branch}`);
    return { content: atob(j.content.replace(/\n/g, "")), sha: j.sha };
  }

  /* --- Write/update a file via Contents API (≤1MB) --- */
  async function putFile(path, content, message) {
    let sha;
    try { sha = (await getFile(path)).sha; } catch (e) { sha = undefined; }
    return req("PUT", `/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
      message, content: btoa(unescape(encodeURIComponent(content))), sha, branch: OEG.state.gh.branch
    });
  }

  /* --- Upload binary via Git Data API (blob → tree → commit → ref) --- */
  async function uploadFile(path, base64, message) {
    const ref = await req("GET", `/git/ref/heads/${OEG.state.gh.branch}`);
    const headSha = ref.object.sha;
    const commit = await req("GET", `/git/commits/${headSha}`);
    const blob = await req("POST", "/git/blobs", { content: base64, encoding: "base64" });
    const tree = await req("POST", "/git/trees", {
      base_tree: commit.tree.sha,
      tree: [{ path, mode: "100644", type: "blob", sha: blob.sha }]
    });
    const newCommit = await req("POST", "/git/commits", {
      message, tree: tree.sha, parents: [headSha]
    });
    await req("PATCH", `/git/refs/heads/${OEG.state.gh.branch}`, { sha: newCommit.sha });
    return newCommit;
  }

  /* --- List files in a folder (recursive tree) --- */
  async function listFiles(prefix = "uploads") {
    const ref = await req("GET", `/git/ref/heads/${OEG.state.gh.branch}`);
    const commit = await req("GET", `/git/commits/${ref.object.sha}`);
    const tree = await req("GET", `/git/trees/${commit.tree.sha}?recursive=1`);
    return tree.tree
      .filter(t => t.type === "blob" && (!prefix || t.path.startsWith(prefix)))
      .map(t => ({ path: t.path, size: t.size, sha: t.sha }));
  }

  /* --- Delete a file --- */
  async function deleteFile(path, message) {
    const { sha } = await getFile(path);
    return req("DELETE", `/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
      message: message || `Delete ${path}`, sha, branch: OEG.state.gh.branch
    });
  }

  /* --- Update catalog.json --- */
  async function saveCatalog(catalog, message) {
    return putFile("data/catalog.json", JSON.stringify(catalog, null, 2), message || "Update catalog");
  }

  /* --- Update site-config.json --- */
  async function saveSiteConfig(cfg, message) {
    return putFile("data/site-config.json", JSON.stringify(cfg, null, 2), message || "Update site config");
  }

  /* --- Verify token --- */
  async function testConnection() {
    const j = await req("GET", "");
    return { name: j.full_name, private: j.private };
  }

  const rawUrl = (path) => `https://raw.githubusercontent.com/${OEG.state.gh.owner}/${OEG.state.gh.repo}/${OEG.state.gh.branch}/${path}`;
  const pagesUrl = (path) => `${OEG.state.config.siteUrl || ""}${path}`;

  return { connected, getFile, putFile, uploadFile, listFiles, deleteFile, saveCatalog, saveSiteConfig, testConnection, rawUrl, pagesUrl };
})();
