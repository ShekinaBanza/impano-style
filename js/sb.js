/* Crée le client Supabase (window.sb) — reste null tant que js/config.js n'est pas rempli. */
(function () {
  const c = window.SB_CONFIG || {};
  window.sb = null;
  if (!c.url || !c.anonKey || !window.supabase) return;
  window.sb = window.supabase.createClient(c.url, c.anonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "impano-auth" } });
})();
