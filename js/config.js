/* Connexion Supabase (base de données, comptes, photos).
   La clé « publishable » est publique par conception : la sécurité vient des règles (RLS) de supabase/schema.sql.
   ⚠️ N'écrivez JAMAIS la clé « secret » ni le mot de passe de la base dans ce fichier. */
window.SB_CONFIG = {
  url: "https://hduvdwljmkmevqmadgys.supabase.co",
  anonKey: "sb_publishable_p3XtK7oZsLu2wtMmDo43wQ_mkFkEHw_"
};
if (window.SB_CONFIG.url && window.SB_CONFIG.anonKey) {
  document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"><\/script>');
}
