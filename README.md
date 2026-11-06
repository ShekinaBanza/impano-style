# Impano — Wear the Gift · Be the Gift

Boutique en ligne (HTML, JS, Tailwind CSS) de crochet fait main, Lubumbashi. Installable (PWA).

- Adresses propres : `/`, `/boutique`, `/boutique/sacs`, `/produit/<id>`, `/commande`, `/histoire`, `/admin` (fichiers `*.html` correspondants ; `404.html` gère `/produit/<id>` sur GitHub Pages)
- `/admin` : espace admin (mot de passe par défaut `impano2025`, à changer dans Paramètres) — ajout/modification des articles, prix, photos, commandes, sauvegarde.
- Lancer en local : `python serve.py 5173` puis http://localhost:5173
- Catalogue d'origine et réglages : `js/data.js`

## Administration & publication
- `admin.html` → onglets **Articles**, **Contenu du site** (textes, photos, vidéos de chaque page), **Commandes**, **Paramètres**, **Publier**.
- Les modifications sont des brouillons (navigateur de l'admin). **Publier** envoie `data/site.js` (+ photos dans `assets/uploads/`) sur GitHub via un jeton « Contents : Read and write » limité à ce dépôt ; GitHub Pages met le site à jour en 1–2 min.
- Pour rendre un nouveau texte/photo éditable : ajouter `data-cms="cle"` (texte), `data-cms-img="cle"` ou `data-cms-video="cle"` + `data-cms-label="Section › Nom"` sur l'élément.
