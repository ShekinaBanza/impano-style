/* =========================================================
   IMPANO — logique partagée : en-tête, panier, pied de page
   ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  window.$ = $; window.$$ = $$;

  /* ---------- PANIER (localStorage) ---------- */
  const KEY = "impano_cart_v1";
  const Cart = {
    items: JSON.parse(localStorage.getItem(KEY) || "[]").filter((i) => byId(i.id)),
    save() { localStorage.setItem(KEY, JSON.stringify(this.items)); this.render(); },
    add(id, size = null, qty = 1) {
      const row = this.items.find((i) => i.id === id && i.size === size);
      if (row) row.qty += qty; else this.items.push({ id, size, qty });
      this.save();
      toast(`${byId(id).name} ajouté au panier`);
    },
    setQty(idx, q) { if (q < 1) this.items.splice(idx, 1); else this.items[idx].qty = Math.min(q, 20); this.save(); },
    clear() { this.items = []; this.save(); },
    count() { return this.items.reduce((n, i) => n + i.qty, 0); },
    subtotal() { return this.items.reduce((s, i) => s + byId(i.id).price * i.qty, 0); },
    render() {
      const n = this.count();
      $$("[data-cart-count]").forEach((el) => { el.textContent = n; el.classList.toggle("hidden", n === 0); });
      const list = $("#cart-items"); if (!list) return;
      if (!this.items.length) {
        list.innerHTML = `<div class="h-full grid place-items-center text-center px-8">
          <div><svg class="w-10 h-14 mx-auto mb-6 text-terra"><use href="#cowrie"/></svg>
          <p class="display text-3xl mb-3">Votre panier est vide</p>
          <p class="text-sm opacity-60 mb-8">Chaque pièce attend sa propre histoire.</p>
          <a href="boutique.html" class="btn btn-ink">Voir la boutique</a></div></div>`;
        $("#cart-foot").classList.add("hidden"); return;
      }
      $("#cart-foot").classList.remove("hidden");
      list.innerHTML = this.items.map((it, i) => {
        const p = byId(it.id);
        return `<div class="flex gap-5 py-6 border-b border-ink/10">
          <a href="produit.html?id=${p.id}" class="w-24 h-32 shrink-0 overflow-hidden bg-bone"><img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover"></a>
          <div class="flex-1 flex flex-col">
            <div class="flex justify-between gap-3"><h4 class="display text-xl leading-tight">${p.name}</h4><span class="text-sm">${fmt(p.price * it.qty)}</span></div>
            <p class="text-xs opacity-60 mt-1">${p.color}${it.size ? " · Taille " + it.size : ""}</p>
            <div class="mt-auto flex items-center justify-between">
              <div class="flex items-center border border-ink/20">
                <button class="w-8 h-8" data-q="${i}" data-d="-1" aria-label="Moins">−</button>
                <span class="w-8 text-center text-sm">${it.qty}</span>
                <button class="w-8 h-8" data-q="${i}" data-d="1" aria-label="Plus">+</button>
              </div>
              <button class="text-[.65rem] tracking-[.2em] uppercase opacity-50 hover:opacity-100 ulink" data-rm="${i}">Retirer</button>
            </div></div></div>`;
      }).join("");
      $("#cart-sub").textContent = fmt(this.subtotal());
      const left = CONFIG.freeShippingFrom - this.subtotal();
      $("#cart-ship").textContent = left > 0 ? `Plus que ${fmt(left)} pour la livraison offerte` : "Livraison offerte à Lubumbashi ✦";
      $("#cart-bar").style.width = Math.min(100, (this.subtotal() / CONFIG.freeShippingFrom) * 100) + "%";
    }
  };
  window.Cart = Cart;

  /* ---------- TOAST ---------- */
  function toast(msg) {
    const t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.remove("opacity-0", "translate-y-6");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add("opacity-0", "translate-y-6"), 2600);
  }
  window.toast = toast;

  /* ---------- CARTE PRODUIT (réutilisée partout) ---------- */
  window.productCard = function (p, extra = "") {
    const second = p.gallery[1];
    return `<article class="group relative ${extra}">
      <a href="produit.html?id=${p.id}" class="block relative overflow-hidden bg-bone aspect-[4/5]">
        <img src="${p.img}" alt="${p.name}" loading="lazy" class="zoom absolute inset-0 w-full h-full object-cover">
        ${second ? `<img src="${second}" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700">` : ""}
        <span class="absolute top-4 left-4 eyebrow bg-ivory/90 text-ink px-3 py-1.5 !text-[.58rem]">${p.soldout ? "Épuisé" : p.tag}</span>
      </a>
      ${p.soldout ? "" : `<button data-quick="${p.id}" class="absolute left-3 right-3 bottom-[5.6rem] btn btn-ink !py-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">${p.sizes ? "Choisir la taille" : "Ajouter au panier"}</button>`}
      <div class="pt-5 flex justify-between gap-4">
        <div><h3 class="display text-2xl leading-none"><a href="produit.html?id=${p.id}" class="ulink">${p.name}</a></h3>
        <p class="text-xs opacity-55 mt-2 tracking-wide">${p.color}</p></div>
        <p class="text-sm pt-1">${fmt(p.price)}</p>
      </div></article>`;
  };
  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-quick]"); if (!q) return;
    const p = byId(q.dataset.quick);
    if (p.sizes) location.href = "produit.html?id=" + p.id; else { Cart.add(p.id); openCart(); }
  });

  /* ---------- CHROME : annonce, en-tête, menu, panier, pied de page ---------- */
  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <symbol id="cowrie" viewBox="0 0 40 60"><ellipse cx="20" cy="30" rx="17" ry="27" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M20 8c-5 12-5 32 0 44" fill="none" stroke="currentColor" stroke-width="1.6"/>${Array.from({length: 9}, (_, i) => `<path d="M${15 - (i % 2)} ${16 + i * 4}h-4M${25 + (i % 2)} ${16 + i * 4}h4" stroke="currentColor" stroke-width="1.2"/>`).join("")}</symbol>
    <symbol id="bag" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></symbol>
    <symbol id="arrow" viewBox="0 0 24 12"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></symbol>
  </defs></svg>`;

  const NAV = [
    ["boutique.html", "Boutique"],
    ["boutique.html?cat=bonnets", "Bonnets"],
    ["boutique.html?cat=sacs", "Sacs"],
    ["boutique.html?cat=pret-a-porter", "Prêt-à-porter"],
    ["histoire.html", "La Maison"]
  ];

  function chrome() {
    const onHero = document.body.hasAttribute("data-hero");
    const cur = location.pathname.split("/").pop() + location.search;
    document.body.insertAdjacentHTML("afterbegin", sprite + `
    <div class="bg-ink text-ivory text-center py-2.5 eyebrow !text-[.62rem] !tracking-[.3em] relative z-[60]">
      Chaque pièce est faite main &nbsp;✦&nbsp; Livraison offerte dès ${fmt(CONFIG.freeShippingFrom)}
    </div>
    <header id="header" class="${onHero ? "on-hero " : "solid "}fixed top-[34px] inset-x-0 z-50 border-b border-transparent">
      <div class="max-w-[1500px] mx-auto px-5 md:px-10 h-20 grid grid-cols-3 items-center">
        <nav class="hidden lg:flex gap-8 eyebrow">
          ${NAV.slice(0, 4).map(([h, l]) => `<a href="${h}" class="ulink ${cur === h ? "active" : ""}">${l}</a>`).join("")}
        </nav>
        <button id="burger" class="lg:hidden justify-self-start eyebrow flex items-center gap-3" aria-label="Menu"><span class="block w-6 h-px bg-current relative before:absolute before:-top-1.5 before:w-6 before:h-px before:bg-current after:absolute after:top-1.5 after:w-4 after:h-px after:bg-current"></span></button>
        <a href="index.html" class="justify-self-center text-center leading-none" aria-label="Impano — accueil">
          <span class="logo text-[2.1rem] md:text-[2.6rem] block">impano</span>
          <span class="logo-tag block text-[.45rem] mt-1.5 opacity-70">Wear the gift · Be the gift</span>
        </a>
        <div class="justify-self-end flex items-center gap-6 eyebrow">
          <a href="histoire.html" class="hidden lg:inline ulink">La Maison</a>
          <button id="open-cart" class="relative flex items-center gap-2" aria-label="Ouvrir le panier">
            <span class="hidden sm:inline">Panier</span>
            <svg class="w-6 h-6"><use href="#bag"/></svg>
            <span data-cart-count class="hidden absolute -top-2 -right-3 sm:static sm:ml-0 bg-terra text-cowrie rounded-full min-w-[1.25rem] h-5 px-1 grid place-items-center !text-[.65rem] !tracking-normal"></span>
          </button>
        </div>
      </div>
    </header>

    <div id="menu" class="fixed inset-0 z-[70] pointer-events-none">
      <div id="menu-ov" class="overlay absolute inset-0 bg-ink/60 opacity-0"></div>
      <aside class="drawer absolute left-0 top-0 h-full w-[88%] max-w-md bg-ivory -translate-x-full p-8 flex flex-col">
        <button id="close-menu" class="self-end eyebrow mb-10">Fermer ✕</button>
        <nav class="flex flex-col gap-6">
          ${[["index.html", "Accueil"], ...NAV].map(([h, l]) => `<a href="${h}" class="display text-5xl italic">${l}</a>`).join("")}
        </nav>
        <div class="mt-auto pt-10 text-sm opacity-60">Lubumbashi · RD Congo<br>Wear the Gift · Be the Gift</div>
      </aside>
    </div>

    <div id="cart" class="fixed inset-0 z-[80] pointer-events-none">
      <div id="cart-ov" class="overlay absolute inset-0 bg-ink/60 opacity-0"></div>
      <aside class="drawer absolute right-0 top-0 h-full w-full max-w-[28rem] bg-ivory translate-x-full flex flex-col">
        <div class="flex items-center justify-between px-7 h-20 border-b border-ink/10">
          <h3 class="display text-3xl italic">Votre panier</h3>
          <button id="close-cart" class="eyebrow">Fermer ✕</button>
        </div>
        <div id="cart-items" class="flex-1 overflow-y-auto px-7"></div>
        <div id="cart-foot" class="hidden border-t border-ink/10 px-7 py-6 bg-bone">
          <div class="h-px bg-ink/15 mb-3 relative"><div id="cart-bar" class="absolute inset-y-0 left-0 bg-terra h-[3px] -top-px transition-all duration-700"></div></div>
          <p id="cart-ship" class="text-xs opacity-70 mb-5"></p>
          <div class="flex justify-between items-end mb-5"><span class="eyebrow">Sous-total</span><span id="cart-sub" class="display text-3xl"></span></div>
          <a href="commande.html" class="btn btn-ink w-full">Commander</a>
          <p class="text-[.7rem] opacity-55 text-center mt-3">Frais de livraison calculés à l’étape suivante</p>
        </div>
      </aside>
    </div>
    <div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[95] bg-ink text-ivory text-sm px-6 py-3.5 opacity-0 translate-y-6 pointer-events-none"></div>`);

    const mount = $("#footer");
    if (mount) mount.innerHTML = `
    <footer class="bg-ink text-ivory relative overflow-hidden">
      <div class="max-w-[1500px] mx-auto px-5 md:px-10 pt-24 pb-10">
        <div class="grid lg:grid-cols-12 gap-14">
          <div class="lg:col-span-5">
            <p class="logo text-[clamp(4.5rem,13vw,10rem)]">impano</p>
            <p class="logo-tag text-xs mt-8 opacity-60">Wear the gift<br>Be the gift</p>
            <p class="mt-8 max-w-sm opacity-70 leading-relaxed">« Impano » signifie <em>le don</em>. Chaque fil que nous nouons est un cadeau — pour celui qui le crée, pour celui qui le porte.</p>
          </div>
          <div class="lg:col-span-2 lg:col-start-7"><p class="eyebrow opacity-50 mb-6">Boutique</p><ul class="space-y-3 text-sm">
            <li><a class="ulink" href="boutique.html?cat=bonnets">Bonnets & Chapeaux</a></li><li><a class="ulink" href="boutique.html?cat=sacs">Sacs bananes</a></li><li><a class="ulink" href="boutique.html?cat=pret-a-porter">Prêt-à-porter</a></li><li><a class="ulink" href="boutique.html">Tout voir</a></li></ul></div>
          <div class="lg:col-span-2"><p class="eyebrow opacity-50 mb-6">Maison</p><ul class="space-y-3 text-sm">
            <li><a class="ulink" href="histoire.html">Notre histoire</a></li><li><a class="ulink" href="histoire.html#cauris">Le langage des cauris</a></li><li><a class="ulink" href="histoire.html#atelier">L’atelier</a></li><li><a class="ulink" href="commande.html">Ma commande</a></li></ul></div>
          <div class="lg:col-span-2"><p class="eyebrow opacity-50 mb-6">Service</p><ul class="space-y-3 text-sm opacity-90">
            <li>Paiement Mobile Money</li><li>Paiement à la livraison</li><li>Commande sur WhatsApp</li><li>Retrait à l’atelier</li></ul></div>
        </div>
        <div class="mt-20 pt-6 border-t border-ivory/15 flex flex-col md:flex-row gap-3 justify-between text-xs opacity-50">
          <p>© ${new Date().getFullYear()} Impano — Lubumbashi, RD Congo. Fait main avec amour.</p>
          <p>100 % crochet · pièces uniques · slow fashion</p>
        </div>
      </div>
    </footer>`;

    /* Interactions */
    const hdr = $("#header");
    let last = 0;
    const onScroll = () => {
      const y = scrollY;
      hdr.style.top = Math.max(0, 34 - y) + "px";
      hdr.classList.toggle("solid", y > 40 || !onHero);
      hdr.classList.toggle("hide", y > 400 && y > last);
      last = y;
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    const toggle = (root, ov, panel, open) => {
      root.classList.toggle("pointer-events-none", !open);
      $(ov).classList.toggle("opacity-0", !open);
      panel.classList.toggle(root.id === "menu" ? "-translate-x-full" : "translate-x-full", !open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    const menu = $("#menu"), cart = $("#cart");
    window.openCart = () => { Cart.render(); toggle(cart, "#cart-ov", $("aside", cart), true); };
    const closeCart = () => toggle(cart, "#cart-ov", $("aside", cart), false);
    $("#open-cart").onclick = openCart; $("#close-cart").onclick = closeCart; $("#cart-ov").onclick = closeCart;
    $("#burger").onclick = () => toggle(menu, "#menu-ov", $("aside", menu), true);
    const closeMenu = () => toggle(menu, "#menu-ov", $("aside", menu), false);
    $("#close-menu").onclick = closeMenu; $("#menu-ov").onclick = closeMenu;
    addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); closeMenu(); } });

    $("#cart-items").addEventListener("click", (e) => {
      const q = e.target.closest("[data-q]"), r = e.target.closest("[data-rm]");
      if (q) Cart.setQty(+q.dataset.q, Cart.items[+q.dataset.q].qty + +q.dataset.d);
      if (r) Cart.setQty(+r.dataset.rm, 0);
    });
    Cart.render();
  }

  /* ---------- REVEAL + VIDÉOS ---------- */
  function observers() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    const watch = () => $$(".reveal:not(.in), .mask-in:not(.in)").forEach((el) => io.observe(el));
    watch(); window.watchReveal = watch;

    // Lecture automatique des vidéos visibles uniquement
    const vo = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target; if (e.isIntersecting) { v.play().catch(() => {}); } else v.pause();
    }), { threshold: 0.35 });
    $$("video[data-auto]").forEach((v) => vo.observe(v));
  }

  document.addEventListener("DOMContentLoaded", () => { chrome(); observers(); });
  if ("serviceWorker" in navigator && location.protocol !== "file:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
})();
