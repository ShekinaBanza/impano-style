/* Impano — service worker : fonctionne hors-ligne pour les pages et images vues */
const VERSION = "impano-v2";
const CORE = ["./", "index.html", "boutique.html", "produit.html", "commande.html", "histoire.html",
  "css/style.css", "js/app.js", "js/data.js", "js/tw-config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.headers.has("range") || /\.mp4$/.test(url.pathname)) return;      // vidéos : réseau direct
  const sameOrigin = url.origin === location.origin;
  const isPage = req.mode === "navigate" || /\.(js|css|html|webmanifest)$/.test(url.pathname);
  if (sameOrigin && isPage) {                                                // réseau d'abord, cache en secours
    e.respondWith(fetch(req.url, { cache: "no-cache" }).then((r) => { caches.open(VERSION).then((c) => c.put(req, r.clone())); return r; })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {   // images, polices, Tailwind : cache d'abord
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return r;
  }).catch(() => hit)));
});
