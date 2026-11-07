# Impano — Wear the Gift · Be the Gift

Boutique en ligne (HTML, JS, Tailwind CSS) de crochet fait main, Lubumbashi. Installable (PWA).

- Adresses propres : `/`, `/boutique`, `/boutique/sacs`, `/produit/<id>`, `/commande`, `/histoire`, `/admin` (fichiers `*.html` correspondants ; `404.html` gère `/produit/<id>` sur GitHub Pages)
- `/admin` : espace admin (email + mot de passe, base MySQL sur le serveur) — articles, prix, photos, vidéos, textes, commandes.
- Hébergement : voir `DEPLOY-HOSTINGER.md` (PHP + MySQL). Test local : `php -S localhost:5173 router.php`
- Catalogue d'origine et réglages : `js/data.js`

## Administration
- `admin.html` → **Articles**, **Contenu du site**, **Commandes**, **Paramètres**, **Publier**.
- Sur le serveur Hostinger, chaque modification est enregistrée automatiquement dans `api/storage/impano.sqlite` (API : `api/index.php`).
- Sur GitHub Pages (sans PHP), l'admin retombe en mode local + publication GitHub (`data/site.js`).
- Pour rendre un nouveau texte/photo éditable : ajouter `data-cms="cle"` (texte), `data-cms-img="cle"` ou `data-cms-video="cle"` + `data-cms-label="Section › Nom"`.
