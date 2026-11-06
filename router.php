<?php
/* Serveur local de test (équivalent du .htaccess) :  php -S localhost:5173 router.php */
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . $path;
if ($path !== '/' && is_file($file) && !preg_match('/\.(sqlite|sql|md)$/', $path) && !str_starts_with($path, '/api/storage')) return false;   // fichier statique ou api/index.php
$seg = explode('/', trim($path, '/'))[0] ?? '';
if (in_array($seg, ['boutique', 'produit', 'histoire', 'commande', 'admin'], true)) { header('Content-Type: text/html; charset=utf-8'); readfile(__DIR__ . "/$seg.html"); return true; }
if ($path === '/') { readfile(__DIR__ . '/index.html'); return true; }
http_response_code(404); readfile(__DIR__ . '/404.html');
