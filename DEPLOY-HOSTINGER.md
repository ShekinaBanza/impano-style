# Passage à MySQL (Hostinger)

1. hPanel → **Bases de données → Gestion** : créez une base MySQL + un utilisateur (notez le nom de la base, l'utilisateur, le mot de passe).
2. Dans `public_html/api/config.php` (votre fichier actuel, ne le remplacez pas), ajoutez le bloc `db` (modèle : `api/config.sample.php`).
3. Envoyez `api/index.php` (et tous les fichiers du ZIP sauf `api/config.php`).
4. Ouvrez `https://VOTRE-SITE/api/index.php?r=ping` : vous devez voir `"moteur":"MySQL ..."`.
   Au premier appel, les tables sont créées et l'ancienne base SQLite (`api/storage/impano.sqlite`) est importée automatiquement (articles, catégories, textes, commandes, comptes clients).
5. Tout est ensuite dans MySQL : tables `products`, `categories`, `content`, `config`, `orders`, `users` (visibles dans phpMyAdmin).

---

# Mettre Impano sur Hostinger (PHP + SQLite (ancien))

Tout le site tourne sur votre hébergement : pages, base de données **SQLite** (un simple fichier), comptes clients, commandes, photos et vidéos envoyées depuis l'admin. Aucun service externe.

## 1. Envoyer les fichiers
1. hPanel → **Sites web** → votre domaine → **Gestionnaire de fichiers** (ou FTP).
2. Ouvrez `public_html`, supprimez le fichier par défaut (`default.php`), puis envoyez **tout le contenu du ZIP `impano-hostinger.zip`** (clic droit → *Extraire* dans `public_html`).
   Le dossier doit contenir : `index.html`, `.htaccess`, `api/`, `uploads/`, `assets/`, `js/`, `css/`…
3. Vérifiez que le fichier `.htaccess` est bien présent (activez « Afficher les fichiers cachés »).

## 2. Vérifier la version de PHP
hPanel → **Avancé → Configuration PHP** : PHP **8.1 ou plus**. Dans *Extensions*, `pdo_sqlite` et `sqlite3` doivent être cochées (c'est le cas par défaut).

## 3. Premier démarrage
- Ouvrez `https://votre-domaine/admin`.
- Connectez-vous : email `impano-style@impano.cd`, mot de passe initial = celui écrit dans `api/config.php` (fourni dans le ZIP, jamais publié sur GitHub).
- **Changez tout de suite le mot de passe** : Admin → Paramètres → Nouveau mot de passe (8 caractères minimum).
- La base `api/storage/impano.sqlite` se crée toute seule à la première visite.
- Ensuite, vous pouvez supprimer la ligne `admin_password` de `api/config.php` (elle ne sert qu'à la création du compte).

## 4. Utilisation
- Chaque modification dans l'admin (article, prix, photo, texte, vidéo) est **enregistrée automatiquement** dans la base et visible tout de suite par tous les visiteurs, sur tous les appareils.
- Les commandes arrivent dans l'onglet **Commandes** (avec statut) et sur WhatsApp.
- Les photos/vidéos envoyées sont rangées dans `uploads/`.

## 5. Sécurité (à faire)
- **HTTPS** : hPanel → *SSL* → activez le certificat gratuit (le `.htaccess` redirige ensuite tout vers https).
- **Sauvegardes** : copiez régulièrement `api/storage/impano.sqlite` et le dossier `uploads/` (ou activez les sauvegardes Hostinger).
- **Base hors du site (recommandé)** : créez un dossier `impano-data` à côté de `public_html`, puis dans `api/config.php` mettez `'db_dir' => '/home/uXXXXXXX/impano-data'` (le chemin exact figure dans le gestionnaire de fichiers). La base n'est alors plus du tout accessible depuis le web.
- Ne partagez jamais `api/config.php`. Il n'est pas publié sur GitHub.

## 6. Mises à jour du site
Pour une modification du code : envoyez les fichiers modifiés (ne remplacez ni `api/config.php`, ni `api/storage/`, ni `uploads/`).

## En local (test)
```
php -S localhost:5173 router.php
```
puis http://localhost:5173 (PHP 8.1+ avec pdo_sqlite).

> GitHub Pages ne sait pas exécuter PHP : l'ancienne adresse github.io continue d'afficher le catalogue d'origine, mais sans comptes ni commandes enregistrées. Utilisez votre domaine Hostinger.
