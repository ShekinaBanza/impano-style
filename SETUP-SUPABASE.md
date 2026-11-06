# Activer le stockage sécurisé (Supabase)

1. Créez un projet gratuit sur https://supabase.com (région proche, ex. Europe).
2. **SQL Editor** → New query → collez le contenu de `supabase/schema.sql` → Run.
3. **Authentication → Users → Add user → Create new user** : email `impano-style@impano.cd`, un mot de passe fort, cochez *Auto Confirm User*.
4. Dans le SQL Editor, lancez : `select public.make_admin('impano-style@impano.cd');`
5. (Optionnel) **Authentication → Providers → Email** : désactivez « Confirm email » pour que les clients puissent s'inscrire sans mail de confirmation.
6. **Project Settings → API** : copiez *Project URL* et la clé **anon public**, puis collez-les dans `js/config.js` :
   `window.SB_CONFIG = { url: "https://xxxx.supabase.co", anonKey: "eyJ..." };`
7. Poussez sur GitHub. Connectez-vous ensuite sur `/admin` avec l'email et le mot de passe.

⚠ N'utilisez jamais la clé `service_role` dans le site. La clé `anon` est publique par conception : la sécurité vient des règles RLS du schéma.

Fonctionnement : les commandes ouvrent WhatsApp avec le panier complet puis sont enregistrées dans la table `orders` (visibles dans l'onglet Commandes de l'admin, avec statut). Articles, textes, photos et vidéos sont publiés dans `site_data` et le bucket `media`.
