/* Impano — client de l'API (PHP + SQLite sur Hostinger).
   Expose `window.sb`, avec les mêmes méthodes que le reste du site utilise (auth, from(), rpc(), storage).
   Sur GitHub Pages ou en fichier local il n'y a pas de serveur PHP : window.sb reste null (mode local). */
(function () {
  const host = location.hostname;
  if (location.protocol === "file:" || /\.github\.io$/.test(host) || (window.SB_CONFIG && window.SB_CONFIG.api === false)) { window.sb = null; return; }
  const ROOT = window.ROOT || "/";
  const base = ROOT + "api/index.php";
  const call = async (route, { method = "GET", body, query = "", form } = {}) => {
    try {
      const opt = { method, credentials: "same-origin", headers: { "X-Impano": "1" } };
      if (form) opt.body = form; else if (body !== undefined) { opt.body = JSON.stringify(body); opt.headers["Content-Type"] = "application/json"; }
      const r = await fetch(`${base}?r=${route}${query}`, opt);
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) return { data: null, error: { message: j.error || "Erreur serveur (" + r.status + ")" } };
      return { data: j, error: null };
    } catch (e) { return { data: null, error: { message: "Serveur injoignable." } }; }
  };

  /* ---- Authentification ---- */
  let user = null; const listeners = [];
  const emit = (u) => { user = u; listeners.forEach((f) => { try { f("CHANGE", u ? { user: u } : null); } catch (e) {} }); };
  const auth = {
    async getSession() { const { data } = await call("me"); user = data && data.user; return { data: { session: user ? { user } : null } }; },
    onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
    async signUp({ email, password, options }) {
      const m = (options && options.data) || {};
      const { data, error } = await call("register", { method: "POST", body: { email, password, name: m.name, phone: m.phone } });
      if (error) return { data: null, error };
      emit(data.user); return { data: { user: data.user, session: { user: data.user } }, error: null };
    },
    async signInWithPassword({ email, password }) {
      const { data, error } = await call("login", { method: "POST", body: { email, password } });
      if (error) return { data: null, error };
      emit(data.user); return { data: { user: data.user, session: { user: data.user } }, error: null };
    },
    async signOut() { await call("logout", { method: "POST", body: {} }); emit(null); return { error: null }; },
    async updateUser({ password }) { const { error } = await call("password", { method: "POST", body: { password } }); return { error }; }
  };

  /* ---- Requêtes de table : from("orders") / from("site_data") ---- */
  const from = (table) => {
    const q = { table, op: "select", cols: "*", filters: {}, payload: null };
    const b = {
      select(cols) { q.op = "select"; q.cols = cols || "*"; return b; },
      insert(row) { q.op = "insert"; q.payload = row; return b; },
      update(obj) { q.op = "update"; q.payload = obj; return b; },
      upsert(rows) { q.op = "upsert"; q.payload = rows; return b; },
      delete() { q.op = "delete"; return b; },
      eq(k, v) { q.filters[k] = v; return b; },
      order() { return b; }, limit() { return b; },
      then(res, rej) { return run().then(res, rej); }
    };
    async function run() {
      if (q.table === "site_data") {
        if (q.op === "select") { const { data, error } = await call("site"); return { data: error ? null : data, error }; }
        if (q.op === "upsert") { const { error } = await call("publish", { method: "POST", body: { rows: q.payload } }); return { error }; }
      }
      if (q.table === "orders") {
        if (q.op === "insert") { const { error } = await call("orders", { method: "POST", body: q.payload }); return { error }; }
        if (q.op === "select") { const { data, error } = await call("orders", { query: q.cols === "*" ? "" : "&mine=1" }); return { data: error ? null : data, error }; }
        if (q.op === "update") { const { error } = await call("orders", { method: "PATCH", query: "&id=" + encodeURIComponent(q.filters.id), body: q.payload }); return { error }; }
        if (q.op === "delete") { const { error } = await call("orders", { method: "DELETE", query: "&id=" + encodeURIComponent(q.filters.id), body: {} }); return { error }; }
      }
      return { data: null, error: { message: "Opération non prise en charge." } };
    }
    return b;
  };

  /* ---- Fonctions et fichiers ---- */
  const rpc = async (name) => {
    if (name === "is_admin") { const { data } = await call("me"); return { data: !!(data && data.user && data.user.is_admin), error: null }; }
    return { data: null, error: { message: "Fonction inconnue." } };
  };
  const storage = {
    from() {
      return {
        async upload(path, file) {
          const f = new FormData(); f.append("file", file, path.split("/").pop()); f.append("name", path.split("/").pop());
          const { data, error } = await call("upload", { method: "POST", form: f });
          if (error) return { data: null, error };
          this._last = data.url; storage._urls[path] = data.url; return { data: { path }, error: null };
        },
        getPublicUrl(path) { return { data: { publicUrl: storage._urls[path] || path } }; }
      };
    },
    _urls: {}
  };

  window.sb = { auth, from, rpc, storage };
  auth.getSession();
})();
