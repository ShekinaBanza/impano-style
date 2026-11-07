<?php
/* Impano — API (PHP + SQLite). Une seule porte d'entrée : api/index.php?r=<route> */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$ROOT = dirname(__DIR__);
$cfg = is_file(__DIR__ . '/config.php') ? (require __DIR__ . '/config.php') : [];
$cfg += ['admin_email' => 'impano-style@impano.cd', 'admin_password' => null, 'db_dir' => null];

function out($data, int $code = 200): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function fail(string $msg, int $code = 400): void { out(['error' => $msg], $code); }

/* ---------- Base SQLite ---------- */
$dir = $cfg['db_dir'] ?: (__DIR__ . '/storage');
if (!is_dir($dir)) @mkdir($dir, 0750, true);
try {
  $db = new PDO('sqlite:' . $dir . '/impano.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  $db->exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
} catch (Throwable $e) { fail('Base de données inaccessible : vérifiez les droits d’écriture du dossier api/storage.', 500); }
$db->exec("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE COLLATE NOCASE NOT NULL, name TEXT, phone TEXT, pass TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS site_data(key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL, user_id INTEGER, client TEXT NOT NULL, items TEXT NOT NULL, total REAL NOT NULL, shipping REAL, delivery TEXT, payment TEXT, note TEXT, status TEXT NOT NULL DEFAULT 'nouveau', ip TEXT);
CREATE TABLE IF NOT EXISTS attempts(k TEXT NOT NULL, t INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS ix_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS ix_att ON attempts(k,t);");

/* Compte administrateur créé une seule fois, à partir de config.php */
if ((int)$db->query('SELECT COUNT(*) FROM users WHERE is_admin=1')->fetchColumn() === 0 && !empty($cfg['admin_password']) && $cfg['admin_password'] !== 'CHANGEZ-MOI') {
  $db->prepare('INSERT OR REPLACE INTO users(email,name,pass,is_admin,created_at) VALUES(?,?,?,1,?)')
     ->execute([strtolower($cfg['admin_email']), 'Administrateur', password_hash($cfg['admin_password'], PASSWORD_DEFAULT), gmdate('c')]);
}

/* Catalogue d'origine : copié UNE SEULE FOIS dans la base (ensuite la base fait foi et l'admin modifie tout) */
if (is_file(__DIR__ . '/seed.json') && (int)$db->query("SELECT COUNT(*) FROM site_data WHERE key IN ('products','categories','config')")->fetchColumn() < 3) {
  $seed = json_decode((string)file_get_contents(__DIR__ . '/seed.json'), true);
  $ins = $db->prepare('INSERT OR IGNORE INTO site_data(key,value,updated_at) VALUES(?,?,?)');
  foreach (['products', 'categories', 'config'] as $k) if (!empty($seed[$k])) $ins->execute([$k, json_encode($seed[$k], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), gmdate('c')]);
}

/* ---------- Session ---------- */
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('impano');
session_set_cookie_params(['lifetime' => 60 * 60 * 24 * 30, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
ini_set('session.gc_maxlifetime', (string)(60 * 60 * 24 * 30));
session_start();

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['r'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';

/* Protection CSRF : toute requête qui modifie quelque chose doit porter l'en-tête maison (impossible à forger depuis un autre site) */
if ($method !== 'GET' && ($_SERVER['HTTP_X_IMPANO'] ?? '') !== '1') fail('Requête refusée.', 403);

function body(): array {
  $raw = file_get_contents('php://input'); if ($raw === '' || $raw === false) return [];
  $j = json_decode($raw, true); return is_array($j) ? $j : [];
}
function userOut(array $u): array {
  return ['id' => (int)$u['id'], 'email' => $u['email'], 'user_metadata' => ['name' => $u['name'], 'phone' => $u['phone']], 'is_admin' => (int)$u['is_admin'] === 1];
}
function me(PDO $db): ?array {
  if (empty($_SESSION['uid'])) return null;
  $s = $db->prepare('SELECT * FROM users WHERE id=?'); $s->execute([$_SESSION['uid']]); return $s->fetch() ?: null;
}
function needAdmin(PDO $db): array { $u = me($db); if (!$u || (int)$u['is_admin'] !== 1) fail('Accès réservé à l’administrateur.', 403); return $u; }
function tooMany(PDO $db, string $k, int $max, int $win): bool {
  $db->prepare('DELETE FROM attempts WHERE t < ?')->execute([time() - 86400]);
  $s = $db->prepare('SELECT COUNT(*) FROM attempts WHERE k=? AND t>?'); $s->execute([$k, time() - $win]); return (int)$s->fetchColumn() >= $max;
}
function hit(PDO $db, string $k): void { $db->prepare('INSERT INTO attempts(k,t) VALUES(?,?)')->execute([$k, time()]); }
function str($v, int $max): string { return mb_substr(trim((string)$v), 0, $max); }

switch ($route) {

  /* ----- Catalogue public ----- */
  case 'site':
    $rows = $db->query('SELECT key,value,updated_at FROM site_data')->fetchAll();
    foreach ($rows as &$r) $r['value'] = json_decode($r['value'], true);
    out($rows);

  case 'ping':
    $k = []; foreach ($db->query('SELECT key,updated_at,length(value) AS n FROM site_data')->fetchAll() as $r) $k[$r['key']] = ['maj' => $r['updated_at'], 'octets' => (int)$r['n']];
    out(['version' => 25, 'php' => PHP_VERSION, 'cles' => $k, 'ecriture' => is_writable(__DIR__ . '/storage'), 'admin' => (bool)(($u = me($db)) && !empty($u['is_admin']))]);

  /* ----- Comptes ----- */
  case 'me': $u = me($db); out(['user' => $u ? userOut($u) : null]);

  case 'register':
    $b = body(); $email = strtolower(str($b['email'] ?? '', 120)); $pw = (string)($b['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Adresse email invalide.');
    if (strlen($pw) < 6) fail('Mot de passe trop court (6 caractères minimum).');
    if (tooMany($db, "reg:$ip", 10, 3600)) fail('Trop de tentatives, réessayez plus tard.', 429);
    hit($db, "reg:$ip");
    $s = $db->prepare('SELECT 1 FROM users WHERE email=?'); $s->execute([$email]); if ($s->fetch()) fail('Un compte existe déjà avec cet email.', 409);
    $db->prepare('INSERT INTO users(email,name,phone,pass,created_at) VALUES(?,?,?,?,?)')->execute([$email, str($b['name'] ?? '', 80), str($b['phone'] ?? '', 30), password_hash($pw, PASSWORD_DEFAULT), gmdate('c')]);
    session_regenerate_id(true); $_SESSION['uid'] = (int)$db->lastInsertId(); out(['user' => userOut(me($db))]);

  case 'login':
    $b = body(); $email = strtolower(str($b['email'] ?? '', 120)); $pw = (string)($b['password'] ?? '');
    $k = "log:$ip:$email"; if (tooMany($db, $k, 6, 600)) fail('Trop d’essais. Réessayez dans 10 minutes.', 429);
    $s = $db->prepare('SELECT * FROM users WHERE email=?'); $s->execute([$email]); $u = $s->fetch();
    if (!$u || !password_verify($pw, $u['pass'])) { hit($db, $k); fail('Email ou mot de passe incorrect.', 401); }
    session_regenerate_id(true); $_SESSION['uid'] = (int)$u['id']; out(['user' => userOut($u)]);

  case 'logout': $_SESSION = []; session_destroy(); out(['ok' => true]);

  case 'password':
    $u = me($db) ?: fail('Connexion requise.', 401); $pw = (string)(body()['password'] ?? '');
    if (strlen($pw) < 8) fail('Mot de passe : 8 caractères minimum.');
    $db->prepare('UPDATE users SET pass=? WHERE id=?')->execute([password_hash($pw, PASSWORD_DEFAULT), $u['id']]); out(['ok' => true]);

  /* ----- Commandes ----- */
  case 'orders':
    if ($method === 'POST') {                                   // public : un client passe commande
      $b = body(); $items = $b['items'] ?? []; $client = $b['client'] ?? [];
      if (!is_array($items) || count($items) < 1 || count($items) > 50) fail('Panier invalide.');
      if (!is_array($client) || str($client['tel'] ?? '', 40) === '') fail('Téléphone requis.');
      if (tooMany($db, "ord:$ip", 8, 600)) fail('Trop de commandes, réessayez plus tard.', 429);
      hit($db, "ord:$ip");
      $clean = [];
      foreach ($items as $i) $clean[] = ['id' => str($i['id'] ?? '', 80), 'name' => str($i['name'] ?? '', 120), 'size' => str($i['size'] ?? '', 20), 'qty' => max(1, min(99, (int)($i['qty'] ?? 1))), 'price' => max(0, (float)($i['price'] ?? 0))];
      $cl = ['prenom' => str($client['prenom'] ?? '', 60), 'nom' => str($client['nom'] ?? '', 60), 'tel' => str($client['tel'] ?? '', 40), 'email' => str($client['email'] ?? '', 120), 'adresse' => str($client['adresse'] ?? '', 300)];
      $ref = preg_match('/^[A-Z0-9-]{4,24}$/', (string)($b['ref'] ?? '')) ? $b['ref'] : 'IM-' . strtoupper(bin2hex(random_bytes(3)));
      $u = me($db);
      try {
        $db->prepare('INSERT INTO orders(ref,created_at,user_id,client,items,total,shipping,delivery,payment,note,status,ip) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
           ->execute([$ref, gmdate('c'), $u ? $u['id'] : null, json_encode($cl, JSON_UNESCAPED_UNICODE), json_encode($clean, JSON_UNESCAPED_UNICODE), max(0, (float)($b['total'] ?? 0)), max(0, (float)($b['shipping'] ?? 0)), str($b['delivery'] ?? '', 40), str($b['payment'] ?? '', 60), str($b['note'] ?? '', 500), 'nouveau', $ip]);
      } catch (Throwable $e) { fail('Commande déjà enregistrée.', 409); }
      out(['ok' => true, 'ref' => $ref], 201);
    }
    if ($method === 'GET') {
      $u = me($db) ?: fail('Connexion requise.', 401);
      if (isset($_GET['mine']) || (int)$u['is_admin'] !== 1) { $s = $db->prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 100'); $s->execute([$u['id']]); }
      else $s = $db->query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500');
      $rows = $s->fetchAll();
      foreach ($rows as &$r) { $r['client'] = json_decode($r['client'], true); $r['items'] = json_decode($r['items'], true); unset($r['ip']); }
      out($rows);
    }
    if ($method === 'PATCH') {                                  // admin : changer le statut
      needAdmin($db); $b = body(); $st = $b['status'] ?? '';
      if (!in_array($st, ['nouveau', 'confirmé', 'payé', 'expédié', 'livré', 'annulé'], true)) fail('Statut invalide.');
      $db->prepare('UPDATE orders SET status=? WHERE id=?')->execute([$st, (int)($_GET['id'] ?? 0)]); out(['ok' => true]);
    }
    if ($method === 'DELETE') { needAdmin($db); $db->prepare('DELETE FROM orders WHERE id=?')->execute([(int)($_GET['id'] ?? 0)]); out(['ok' => true]); }
    fail('Méthode non permise.', 405);

  /* ----- Publication du catalogue (admin) ----- */
  case 'publish':
    needAdmin($db); $rows = body()['rows'] ?? []; if (!is_array($rows) || !$rows) fail('Rien à enregistrer.');
    $st = $db->prepare('INSERT INTO site_data(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at');
    $saved = [];
    foreach ($rows as $r) {
      $k = $r['key'] ?? '';
      if (!in_array($k, ['products', 'categories', 'content', 'config'], true)) fail('Clé inconnue : ' . $k);
      $st->execute([$k, json_encode($r['value'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), gmdate('c')]); $saved[] = $k;
    }
    out(['ok' => true, 'saved' => $saved]);

  /* ----- Envoi de photos / vidéos (admin) ----- */
  case 'upload':
    needAdmin($db); if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) fail('Fichier non reçu (taille maximale dépassée ?).');
    $f = $_FILES['file']; $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif', 'video/mp4' => 'mp4', 'video/webm' => 'webm'][$mime] ?? null;
    if (!$ext) fail('Type de fichier non autorisé (jpg, png, webp, gif, mp4, webm).');
    if ($f['size'] > 60 * 1024 * 1024) fail('Fichier trop lourd (60 Mo maximum).');
    $sub = str_starts_with($mime, 'video') ? 'video' : 'img';
    $name = preg_replace('/[^a-z0-9-]+/', '-', strtolower(pathinfo((string)($_POST['name'] ?? 'f'), PATHINFO_FILENAME))); $name = trim(substr($name, 0, 40), '-') ?: 'f';
    $rel = "uploads/$sub/" . $name . '-' . substr(sha1_file($f['tmp_name']), 0, 10) . '.' . $ext;
    if (!is_dir("$ROOT/uploads/$sub")) mkdir("$ROOT/uploads/$sub", 0755, true);
    if (!move_uploaded_file($f['tmp_name'], "$ROOT/$rel")) fail('Écriture impossible dans le dossier uploads/.', 500);
    out(['url' => $rel]);

  default: fail('Route inconnue.', 404);
}
