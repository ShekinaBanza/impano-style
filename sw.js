/* Impano — service worker : adresses propres + mode hors-ligne pour les pages et images vues */
const VERSION = "impano-v30";
const ROOT = new URL("./", self.registration.scope).pathname;           // ex. /impano-style/
const CORE = ["./", "index.html", "boutique.html", "produit.html", "commande.html", "histoire.html", "admin.html",
  "css/style.css", "js/app.js", "js/data.js", "js/config.js", "js/sb.js", "js/tw-config.js", "data/site.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png"];

/* /boutique/sacs -> boutique.html ; /produit/<id> -> produit.html ; /histoire -> histoire.html ; / -> index.html */
function pageFile(url) {
  const p = url.pathname.slice(ROOT.length).replace(/\/+$/, "");
  if (!p || p === "index.html") return "index.html";
  const seg = p.split("/")[0];
  if (seg === "produit" || seg === "boutique") return seg + ".html";
  if (/\.[a-z0-9]+$/i.test(p)) return null;
  return p + ".html";
}

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
  if (sameOrigin && url.pathname.indexOf("/api/") !== -1) return;           // API : jamais en cache

  if (sameOrigin && req.mode === "navigate") {                               // pages : réseau d'abord, cache en secours
    const f = pageFile(url);
    if (f) {
      const key = new Request(ROOT + f);
      e.respondWith(fetch(key, { cache: "no-cache" }).then((r) => {
        if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(key, cp)); return r; }
        return fetch(req);                                                   // inconnue : laisser 404.html faire sa redirection
      }).catch(() => caches.match(key).then((r) => r || caches.match(ROOT + "index.html"))));
      return;
    }
  }
  if (sameOrigin && /\.(js|css|html|webmanifest)$/.test(url.pathname)) {   // code : réseau d'abord
    e.respondWith(fetch(req.url, { cache: "no-cache" }).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {   // images, polices, Tailwind : cache d'abord
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return r;
  }).catch(() => hit)));
});
