<?php
/* Impano — API (PHP + MySQL). Une seule porte d'entrée : api/index.php?r=<route> */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$ROOT = dirname(__DIR__);
$cfg = is_file(__DIR__ . '/config.php') ? (require __DIR__ . '/config.php') : [];
$cfg += ['admin_email' => 'impano-style@impano.cd', 'admin_password' => null, 'db_dir' => null];

function out($data, int $code = 200): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function fail(string $msg, int $code = 400): void { out(['error' => $msg], $code); }

/* ---------- Base MySQL ---------- */
$c = $cfg['db'] ?? null;
if (!is_array($c) || empty($c['name']) || empty($c['user'])) fail('MySQL non configuré : renseignez « db » (host, name, user, pass) dans api/config.php.', 500);
try {
  $db = new PDO('mysql:host=' . ($c['host'] ?? 'localhost') . ';port=' . ($c['port'] ?? 3306) . ';dbname=' . $c['name'] . ';charset=utf8mb4', $c['user'], (string)($c['pass'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
} catch (Throwable $e) { fail('Connexion MySQL impossible (' . preg_replace('/\s+/', ' ', $e->getMessage()) . ') — vérifiez host, name, user, pass dans api/config.php.', 500); }
$T = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
foreach ([
  "CREATE TABLE IF NOT EXISTS users(id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(190) NOT NULL UNIQUE, name VARCHAR(120), phone VARCHAR(40), pass VARCHAR(255) NOT NULL, is_admin TINYINT NOT NULL DEFAULT 0, created_at VARCHAR(40) NOT NULL)$T",
  "CREATE TABLE IF NOT EXISTS categories(rid INT AUTO_INCREMENT PRIMARY KEY, pos INT NOT NULL DEFAULT 0, id VARCHAR(80) NOT NULL, label VARCHAR(200), short VARCHAR(120), img VARCHAR(600), blurb TEXT, extra LONGTEXT, KEY ix_cid(id))$T",
  "CREATE TABLE IF NOT EXISTS products(rid INT AUTO_INCREMENT PRIMARY KEY, pos INT NOT NULL DEFAULT 0, id VARCHAR(120) NOT NULL, cat VARCHAR(80), name VARCHAR(240), price DECIMAL(10,2), img VARCHAR(600), gallery LONGTEXT, tag VARCHAR(120), color VARCHAR(200), descr TEXT, details LONGTEXT, sizes LONGTEXT, stock INT NULL, hidden TINYINT NOT NULL DEFAULT 0, added BIGINT NULL, extra LONGTEXT, KEY ix_pid(id), KEY ix_pcat(cat))$T",
  "CREATE TABLE IF NOT EXISTS content(k VARCHAR(190) PRIMARY KEY, v LONGTEXT, is_json TINYINT NOT NULL DEFAULT 0)$T",
  "CREATE TABLE IF NOT EXISTS config(k VARCHAR(120) PRIMARY KEY, v LONGTEXT)$T",
  "CREATE TABLE IF NOT EXISTS meta(k VARCHAR(60) PRIMARY KEY, updated_at VARCHAR(40) NOT NULL)$T",
  "CREATE TABLE IF NOT EXISTS orders(id INT AUTO_INCREMENT PRIMARY KEY, ref VARCHAR(40) NOT NULL UNIQUE, created_at VARCHAR(40) NOT NULL, user_id INT NULL, client LONGTEXT NOT NULL, items LONGTEXT NOT NULL, total DECIMAL(12,2) NOT NULL, shipping DECIMAL(10,2), delivery VARCHAR(60), payment VARCHAR(60), note TEXT, status VARCHAR(20) NOT NULL DEFAULT 'nouveau', ip VARCHAR(60), KEY ix_orders_user(user_id))$T",
  "CREATE TABLE IF NOT EXISTS attempts(k VARCHAR(190) NOT NULL, t INT NOT NULL, KEY ix_att(k,t))$T",
] as $q) $db->exec($q);

const PCOLS = ['id', 'cat', 'name', 'price', 'img', 'gallery', 'tag', 'color', 'desc', 'details', 'sizes', 'stock', 'hidden', 'added'];
const CCOLS = ['id', 'label', 'short', 'img', 'blurb'];
function J($v): string { return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); }
function touchMeta(PDO $db, string $k): void { $db->prepare('INSERT INTO meta(k,updated_at) VALUES(?,?) ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at)')->execute([$k, gmdate('c')]); }

/* Écrit une liste (catégories / articles / textes / réglages) dans ses vraies tables MySQL */
function saveKey(PDO $db, string $key, $val): void {
  if ($key === 'categories') {
    if (!is_array($val)) fail('Catégories invalides.');
    $db->exec('DELETE FROM categories'); $st = $db->prepare('INSERT INTO categories(pos,id,label,short,img,blurb,extra) VALUES(?,?,?,?,?,?,?)');
    foreach (array_values($val) as $i => $c) {
      if (!is_array($c) || empty($c['id'])) continue; $x = array_diff_key($c, array_flip(CCOLS));
      $st->execute([$i, (string)$c['id'], (string)($c['label'] ?? ''), (string)($c['short'] ?? ''), (string)($c['img'] ?? ''), (string)($c['blurb'] ?? ''), $x ? J($x) : null]);
    }
  } elseif ($key === 'products') {
    if (!is_array($val)) fail('Articles invalides.');
    $db->exec('DELETE FROM products'); $st = $db->prepare('INSERT INTO products(pos,id,cat,name,price,img,gallery,tag,color,descr,details,sizes,stock,hidden,added,extra) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach (array_values($val) as $i => $p) {
      if (!is_array($p) || !isset($p['id'])) continue; $x = array_diff_key($p, array_flip(PCOLS));
      $stock = (isset($p['stock']) && $p['stock'] !== '' && $p['stock'] !== null) ? (int)$p['stock'] : null;
      $st->execute([$i, (string)$p['id'], (string)($p['cat'] ?? ''), (string)($p['name'] ?? ''), (float)($p['price'] ?? 0), (string)($p['img'] ?? ''),
        isset($p['gallery']) ? J($p['gallery']) : null, (string)($p['tag'] ?? ''), (string)($p['color'] ?? ''), (string)($p['desc'] ?? ''),
        isset($p['details']) ? J($p['details']) : null, isset($p['sizes']) ? J($p['sizes']) : null, $stock, !empty($p['hidden']) ? 1 : 0,
        isset($p['added']) ? (int)$p['added'] : null, $x ? J($x) : null]);
    }
  } elseif ($key === 'content') {
    $db->exec('DELETE FROM content'); $st = $db->prepare('INSERT INTO content(k,v,is_json) VALUES(?,?,?)');
    foreach ((array)$val as $k => $v) $st->execute([(string)$k, is_string($v) ? $v : J($v), is_string($v) ? 0 : 1]);
  } elseif ($key === 'config') {
    $db->exec('DELETE FROM config'); $st = $db->prepare('INSERT INTO config(k,v) VALUES(?,?)');
    foreach ((array)$val as $k => $v) $st->execute([(string)$k, J($v)]);
  } else fail('Clé inconnue : ' . $key);
  touchMeta($db, $key);
}
/* Relit une liste depuis MySQL, dans le format que le site attend */
function loadKey(PDO $db, string $key) {
  $nz = fn($s) => ($s === null || $s === '') ? null : json_decode($s, true);
  if ($key === 'categories') {
    $o = [];
    foreach ($db->query('SELECT * FROM categories ORDER BY pos,rid')->fetchAll() as $r) {
      $c = ['id' => $r['id'], 'label' => $r['label'], 'short' => $r['short'], 'img' => $r['img'], 'blurb' => $r['blurb']];
      if ($r['extra']) $c += $nz($r['extra']) ?: []; $o[] = $c;
    }
    return $o;
  }
  if ($key === 'products') {
    $o = [];
    foreach ($db->query('SELECT * FROM products ORDER BY pos,rid')->fetchAll() as $r) {
      $p = ['id' => $r['id'], 'cat' => $r['cat'], 'name' => $r['name'], 'price' => $r['price'] + 0, 'img' => $r['img']];
      if ($r['gallery'] !== null) $p['gallery'] = $nz($r['gallery']);
      if ($r['tag'] !== '') $p['tag'] = $r['tag'];
      if ($r['color'] !== '') $p['color'] = $r['color'];
      if ($r['descr'] !== '') $p['desc'] = $r['descr'];
      if ($r['details'] !== null) $p['details'] = $nz($r['details']);
      if ($r['sizes'] !== null) $p['sizes'] = $nz($r['sizes']);
      if ($r['stock'] !== null) $p['stock'] = (int)$r['stock'];
      if ($r['hidden']) $p['hidden'] = true;
      if ($r['added'] !== null) $p['added'] = (int)$r['added'];
      if ($r['extra']) $p += $nz($r['extra']) ?: [];
      $o[] = $p;
    }
    return $o;
  }
  if ($key === 'content') { $o = []; foreach ($db->query('SELECT * FROM content')->fetchAll() as $r) $o[$r['k']] = $r['is_json'] ? json_decode($r['v'], true) : $r['v']; return $o ?: new stdClass; }
  if ($key === 'config') { $o = []; foreach ($db->query('SELECT * FROM config')->fetchAll() as $r) $o[$r['k']] = json_decode($r['v'], true); return $o ?: null; }
  return null;
}

/* Compte administrateur créé une seule fois, à partir de config.php */
if ((int)$db->query('SELECT COUNT(*) FROM users WHERE is_admin=1')->fetchColumn() === 0 && !empty($cfg['admin_password']) && $cfg['admin_password'] !== 'CHANGEZ-MOI') {
  $db->prepare('REPLACE INTO users(email,name,pass,is_admin,created_at) VALUES(?,?,?,1,?)')
     ->execute([strtolower($cfg['admin_email']), 'Administrateur', password_hash($cfg['admin_password'], PASSWORD_DEFAULT), gmdate('c')]);
}

/* Première installation : import de l'ancienne base SQLite si elle existe, sinon catalogue d'origine (seed.json) */
if ((int)$db->query('SELECT COUNT(*) FROM meta')->fetchColumn() === 0) {
  $old = ($cfg['db_dir'] ?: (__DIR__ . '/storage')) . '/impano.sqlite';
  $done = false;
  if (is_file($old) && in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    try {
      $lite = new PDO('sqlite:' . $old, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
      foreach ($lite->query('SELECT key,value FROM site_data')->fetchAll() as $r) { saveKey($db, $r['key'], json_decode($r['value'], true)); $done = true; }
      $ins = $db->prepare('INSERT IGNORE INTO orders(ref,created_at,user_id,client,items,total,shipping,delivery,payment,note,status,ip) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
      foreach ($lite->query('SELECT * FROM orders')->fetchAll() as $o) $ins->execute([$o['ref'], $o['created_at'], null, $o['client'], $o['items'], $o['total'], $o['shipping'], $o['delivery'], $o['payment'], $o['note'], $o['status'], $o['ip']]);
      $iu = $db->prepare('INSERT IGNORE INTO users(email,name,phone,pass,is_admin,created_at) VALUES(?,?,?,?,0,?)');
      foreach ($lite->query('SELECT * FROM users WHERE is_admin=0')->fetchAll() as $u) $iu->execute([$u['email'], $u['name'], $u['phone'], $u['pass'], $u['created_at']]);
    } catch (Throwable $e) { /* on retombe sur le catalogue d'origine */ }
  }
  if (!$done && is_file(__DIR__ . '/seed.json')) {
    $seed = json_decode((string)file_get_contents(__DIR__ . '/seed.json'), true);
    foreach (['products', 'categories', 'config'] as $k) if (!empty($seed[$k])) saveKey($db, $k, $seed[$k]);
  }
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
    $m = $db->query('SELECT k,updated_at FROM meta')->fetchAll(PDO::FETCH_KEY_PAIR); $rows = [];
    foreach (['products', 'categories', 'content', 'config'] as $k) if (isset($m[$k])) $rows[] = ['key' => $k, 'value' => loadKey($db, $k), 'updated_at' => $m[$k]];
    out($rows);

  case 'categories':
    out(['categories' => loadKey($db, 'categories')]);

  case 'ping':
    $k = [];
    foreach (['products', 'categories', 'content', 'config'] as $t) $k[$t] = ['lignes' => (int)$db->query("SELECT COUNT(*) FROM `$t`")->fetchColumn()];
    foreach ($db->query('SELECT k,updated_at FROM meta')->fetchAll() as $r) $k[$r['k']]['maj'] = $r['updated_at'];
    out(['version' => 30, 'moteur' => 'MySQL ' . $db->query('SELECT VERSION()')->fetchColumn(), 'php' => PHP_VERSION, 'cles' => $k, 'ecriture' => true, 'admin' => (bool)(($u = me($db)) && !empty($u['is_admin']))]);

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
    $saved = []; $db->beginTransaction();
    try { foreach ($rows as $r) { $k = $r['key'] ?? ''; saveKey($db, $k, $r['value'] ?? null); $saved[] = $k; } $db->commit(); }
    catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); fail('Enregistrement impossible : ' . $e->getMessage(), 500); }
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
