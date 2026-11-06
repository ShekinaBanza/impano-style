<?php
/* Copiez ce fichier en config.php (sur le serveur) et adaptez-le. config.php n'est jamais publié sur GitHub. */
return [
  'admin_email'    => 'impano-style@impano.cd',
  'admin_password' => 'CHANGEZ-MOI',   // utilisé UNE SEULE FOIS pour créer le compte admin à la première visite
  // Optionnel : dossier de la base SQLite. Le plus sûr = HORS de public_html, ex. '/home/uXXXX/impano-data'
  'db_dir'         => null,            // null = api/storage (protégé par .htaccess)
];
