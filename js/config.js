/* Connexion Supabase (base de données, comptes, photos).
   Collez ici l'URL du projet et la clé « anon public » (Project Settings → API).
   La clé anon est publique par conception : la sécurité vient des règles (RLS) de supabase/schema.sql.
   ⚠️ N'écrivez JAMAIS la clé « service_role » dans ce fichier. */
window.SB_CONFIG = {
  url: "",
  anonKey: ""
};
if (window.SB_CONFIG.url && window.SB_CONFIG.anonKey) {
  document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"><\/script>');
}
