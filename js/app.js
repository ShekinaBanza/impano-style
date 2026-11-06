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
      <button data-fav="${p.id}" class="fav absolute top-3 right-3 z-10 w-10 h-10 grid place-items-center bg-ivory/90 rounded-full ${Fav.has(p.id) ? "on" : ""}" aria-label="Ajouter aux favoris" aria-pressed="${Fav.has(p.id)}"><svg class="w-5 h-5"><use href="#heart"/></svg></button>
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
    <symbol id="user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
    <symbol id="search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m16 16 5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
    <symbol id="heart" viewBox="0 0 24 24"><path d="M12 20.5S3.5 15 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9C20.5 15 12 20.5 12 20.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></symbol>
    <symbol id="wa" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7s1.8 2.8 4.4 3.9c1.6.7 2.2.7 3 .6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.4Z"/></symbol>
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
    <div class="bg-ink text-ivory text-center py-2.5 eyebrow !text-[.62rem] !tracking-[.3em] relative z-[60]" data-cms="global.announce">
      Chaque pièce est faite main &nbsp;✦&nbsp; Livraison offerte dès ${fmt(CONFIG.freeShippingFrom)}
    </div>
    <header id="header" class="${onHero ? "on-hero " : "solid "}fixed top-[34px] inset-x-0 z-50 border-b border-transparent">
      <div class="max-w-[1500px] mx-auto px-5 md:px-10 h-20 grid grid-cols-3 items-center">
        <nav class="hidden lg:flex gap-8 eyebrow">
          ${NAV.slice(0, 4).map(([h, l]) => `<a href="${h}" class="ulink ${cur === h ? "active" : ""}">${l}</a>`).join("")}
        </nav>
        <button id="burger" class="lg:hidden justify-self-start eyebrow flex items-center gap-3" aria-label="Menu"><span class="block w-6 h-px bg-current relative before:absolute before:-top-1.5 before:w-6 before:h-px before:bg-current after:absolute after:top-1.5 after:w-4 after:h-px after:bg-current"></span></button>
        <a href="index.html" class="hlogo justify-self-center text-center leading-none" aria-label="Impano — accueil">
          <span class="logo text-[2.1rem] md:text-[2.6rem] block">impano</span>
          <span class="logo-tag block text-[.45rem] mt-1.5 opacity-70">Wear the gift · Be the gift</span>
        </a>
        <div class="justify-self-end flex items-center gap-4 md:gap-6 eyebrow">
          <a href="histoire.html" class="hidden lg:inline ulink">La Maison</a>
          <button id="open-search" class="flex items-center gap-2" aria-label="Rechercher"><svg class="w-[22px] h-[22px]"><use href="#search"/></svg></button>
          <button id="open-acct" class="flex items-center gap-2" aria-label="Se connecter"><svg class="w-[22px] h-[22px]"><use href="#user"/></svg><span id="acct-label" class="hidden lg:inline">Se connecter</span></button>
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
        <button id="menu-acct" class="eyebrow ulink self-start mt-10">Se connecter / Mon compte</button>
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
            <p class="logo-tag text-xs mt-8 opacity-60" data-cms="global.footer.tag">Wear the gift<br>Be the gift</p>
            <p class="mt-8 max-w-sm opacity-70 leading-relaxed" data-cms="global.footer.blurb">« Impano » signifie <em>le don</em>. Chaque fil que nous nouons est un cadeau — pour celui qui le crée, pour celui qui le porte.</p>
          </div>
          <div class="lg:col-span-2 lg:col-start-7"><p class="eyebrow opacity-50 mb-6">Boutique</p><ul class="space-y-3 text-sm">
            <li><a class="ulink" href="boutique.html?cat=bonnets">Bonnets & Chapeaux</a></li><li><a class="ulink" href="boutique.html?cat=sacs">Sacs bananes</a></li><li><a class="ulink" href="boutique.html?cat=pret-a-porter">Prêt-à-porter</a></li><li><a class="ulink" href="boutique.html">Tout voir</a></li></ul></div>
          <div class="lg:col-span-2"><p class="eyebrow opacity-50 mb-6">Maison</p><ul class="space-y-3 text-sm">
            <li><a class="ulink" href="histoire.html">Notre histoire</a></li><li><a class="ulink" href="histoire.html#cauris">Le langage des cauris</a></li><li><a class="ulink" href="histoire.html#atelier">L’atelier</a></li><li><a class="ulink" href="commande.html">Ma commande</a></li><li><a class="ulink" href="admin.html">Espace admin</a></li></ul></div>
          <div class="lg:col-span-2"><p class="eyebrow opacity-50 mb-6">Service</p><ul class="space-y-3 text-sm opacity-90">
            <li>Paiement Mobile Money</li><li>Paiement à la livraison</li><li>Commande sur WhatsApp</li><li>Retrait à l’atelier</li><li><button class="ulink opacity-100" onclick="installApp()">📲 Installer l’app</button></li></ul></div>
        </div>
        <div class="mt-20 pt-6 border-t border-ivory/15 flex flex-col md:flex-row gap-3 justify-between text-xs opacity-50">
          <p data-cms="global.footer.copy">© ${new Date().getFullYear()} Impano — Lubumbashi, RD Congo. Fait main avec amour.</p>
          <p data-cms="global.footer.right">100 % crochet · pièces uniques · slow fashion</p>
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



  /* ---------- CONTENU ÉDITABLE (textes, photos, vidéos) ---------- */
  const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // mini-balisage : *italique*, retour à la ligne, {free} = seuil de livraison offerte
  window.mk = (v) => escH(v).replace(/\{free\}/g, fmt(CONFIG.freeShippingFrom)).replace(/\n/g, "<br>").replace(/\*([^*]+)\*/g, '<span class="italic">$1</span>');
  window.applyCms = function (root = document) {
    const C = window.CONTENT || {};
    $$("[data-cms]", root).forEach((el) => { const v = C[el.dataset.cms]; if (v) el.innerHTML = mk(v); });
    $$("[data-cms-img]", root).forEach((el) => { const v = C[el.dataset.cmsImg]; if (v) { el.removeAttribute("srcset"); el.src = v; } });
    $$("[data-cms-video]", root).forEach((el) => {
      const v = C[el.dataset.cmsVideo]; if (!v) return;
      el.removeAttribute("poster"); el.src = v; el.load(); if (el.autoplay) el.play().catch(() => {});
    });
  };

  /* ---------- FAVORIS ---------- */
  const Fav = {
    ids: JSON.parse(localStorage.getItem("impano_fav") || "[]"),
    has(id) { return this.ids.includes(id); },
    toggle(id) {
      this.ids = this.has(id) ? this.ids.filter((x) => x !== id) : [...this.ids, id];
      localStorage.setItem("impano_fav", JSON.stringify(this.ids));
      $$(`[data-fav="${id}"]`).forEach((b) => { b.classList.toggle("on", this.has(id)); b.setAttribute("aria-pressed", this.has(id)); });
      document.dispatchEvent(new CustomEvent("favchange")); return this.has(id);
    }
  };
  window.Fav = Fav;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav]"); if (!b) return;
    e.preventDefault(); const on = Fav.toggle(b.dataset.fav); toast(on ? "Ajouté à vos favoris ♥" : "Retiré des favoris");
  });

  /* ---------- COMPTE CLIENT (local à l'appareil) ---------- */
  const hashPw = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("impano|" + s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const Account = {
    users() { try { return JSON.parse(localStorage.getItem("impano_users") || "{}"); } catch (e) { return {}; } },
    user() { const e = localStorage.getItem("impano_session"), u = this.users()[e]; return u ? { email: e, name: u.name, phone: u.phone } : null; },
    async signup({ name, email, phone, password }) {
      email = email.trim().toLowerCase(); const us = this.users();
      if (us[email]) throw new Error("Un compte existe déjà avec cet email.");
      us[email] = { name: name.trim(), phone: phone.trim(), hash: await hashPw(password) };
      localStorage.setItem("impano_users", JSON.stringify(us)); localStorage.setItem("impano_session", email);
    },
    async login(email, password) {
      email = email.trim().toLowerCase(); const u = this.users()[email];
      if (!u || u.hash !== (await hashPw(password))) throw new Error("Email ou mot de passe incorrect.");
      localStorage.setItem("impano_session", email);
    },
    logout() { localStorage.removeItem("impano_session"); },
    orders() {
      const e = (this.user() || {}).email;
      return JSON.parse(localStorage.getItem("impano_orders") || "[]").filter((o) => e && (o.account === e || (o.client && (o.client.email || "").toLowerCase() === e))).reverse();
    }
  };
  window.Account = Account;

  function acctButton() {
    const u = Account.user(), l = $("#acct-label"); if (!l) return;
    l.textContent = u ? u.name.split(" ")[0] : "Se connecter";
    $("#open-acct").setAttribute("aria-label", u ? "Mon compte" : "Se connecter");
    $("#open-acct").classList.toggle("text-terra", !!u);
  }
  function acctView(view = "login") {
    const box = $("#acct-body"), u = Account.user();
    const field = (n, l, t = "text", extra = "") => `<label class="block"><span class="field-label">${l}</span><input name="${n}" type="${t}" ${extra} class="field"></label>`;
    if (u) {
      const os = Account.orders();
      box.innerHTML = `<p class="eyebrow text-terra mb-3">Mon compte</p><h2 class="display text-4xl italic mb-1">Bonjour ${escH(u.name.split(" ")[0])}</h2>
        <p class="text-sm opacity-60 mb-8">${escH(u.email)}${u.phone ? " · " + escH(u.phone) : ""}</p>
        <h3 class="eyebrow mb-4">Mes commandes</h3>
        <div class="space-y-3 mb-8 max-h-56 overflow-y-auto">${os.map((o) => `<div class="flex justify-between border-b border-ink/10 pb-3 text-sm"><span><b class="font-medium">${escH(o.ref)}</b><br><span class="opacity-55 text-xs">${new Date(o.date).toLocaleDateString("fr-FR")} · ${o.items.reduce((n, i) => n + i.qty, 0)} article(s)</span></span><span>${fmt(o.total)}</span></div>`).join("") || '<p class="text-sm opacity-55">Aucune commande pour le moment.</p>'}</div>
        <div class="flex gap-3 flex-wrap"><a href="boutique.html" class="btn btn-ink !py-3">Continuer mes achats</a><button id="acct-out" class="btn btn-ghost !py-3">Se déconnecter</button></div>`;
      $("#acct-out").onclick = () => { Account.logout(); acctButton(); acctView("login"); toast("À bientôt ✦"); document.dispatchEvent(new CustomEvent("accountchange")); };
      return;
    }
    const signup = view === "signup";
    box.innerHTML = `<p class="eyebrow text-terra mb-3">${signup ? "Nouveau compte" : "Connexion"}</p>
      <h2 class="display text-4xl md:text-5xl italic mb-2">${signup ? "Rejoignez Impano" : "Bon retour"}</h2>
      <p class="text-sm opacity-60 mb-8">${signup ? "Gardez vos coordonnées et retrouvez vos commandes." : "Connectez-vous pour commander plus vite."}</p>
      <form id="acct-form" class="space-y-6" novalidate>
        ${signup ? field("name", "Nom complet *", "text", 'autocomplete="name"') : ""}
        ${field("email", "Email *", "email", 'autocomplete="email"')}
        ${signup ? field("phone", "Téléphone / WhatsApp", "tel", 'autocomplete="tel"') : ""}
        ${field("password", "Mot de passe *", "password", `autocomplete="${signup ? "new" : "current"}-password"`)}
        <p id="acct-err" class="text-terra text-sm min-h-[1.25rem]"></p>
        <button class="btn btn-ink w-full">${signup ? "Créer mon compte" : "Se connecter"}</button>
      </form>
      <p class="text-sm text-center mt-6 opacity-80">${signup ? "Déjà un compte ?" : "Pas encore de compte ?"} <button id="acct-switch" class="ulink text-terra">${signup ? "Se connecter" : "Créer un compte"}</button></p>
      <p class="text-[.7rem] text-center mt-6 opacity-45">Votre compte est enregistré sur cet appareil. · <a href="admin.html" class="ulink">Espace administrateur</a></p>`;
    $("#acct-switch").onclick = () => acctView(signup ? "login" : "signup");
    $("#acct-form").onsubmit = async (e) => {
      e.preventDefault(); const f = e.target, err = $("#acct-err");
      try {
        if (signup && !f.name.value.trim()) throw new Error("Indiquez votre nom.");
        if (!f.email.value.includes("@")) throw new Error("Email invalide.");
        if (f.password.value.length < 6) throw new Error("Mot de passe : 6 caractères minimum.");
        if (signup) await Account.signup({ name: f.name.value, email: f.email.value, phone: f.phone.value, password: f.password.value });
        else await Account.login(f.email.value, f.password.value);
        acctButton(); acctView(); toast("Connecté ✦"); document.dispatchEvent(new CustomEvent("accountchange"));
      } catch (er) { err.textContent = er.message; }
    };
  }
  window.openAccount = (v) => { acctView(v); $("#acct").classList.remove("hidden"); document.body.style.overflow = "hidden"; };
  const closeAccount = () => { $("#acct").classList.add("hidden"); document.body.style.overflow = ""; };

  /* ---------- RECHERCHE ---------- */
  function searchUI() {
    const sr = $("#search"), inp = $("#search-q"), out = $("#search-out");
    const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const run = () => {
      const q = norm(inp.value.trim());
      if (!q) { out.innerHTML = `<p class="opacity-55 text-sm">Essayez : « cauri », « sac », « vert », « ensemble »…</p>`; return; }
      const toks = q.split(/\s+/);
      const res = PRODUCTS.filter((p) => { const h = norm([p.name, p.color, p.desc, p.tag, (CATEGORIES.find((c) => c.id === p.cat) || {}).label].join(" ")); return toks.every((t) => h.includes(t)); }).slice(0, 8);
      out.innerHTML = res.length
        ? `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">${res.map((p) => `<a href="produit.html?id=${p.id}" class="group block"><div class="aspect-[4/5] overflow-hidden bg-bone"><img src="${p.img}" alt="" class="zoom w-full h-full object-cover"></div><p class="display text-xl mt-3 leading-tight">${escH(p.name)}</p><p class="text-sm opacity-60">${fmt(p.price)}</p></a>`).join("")}</div>`
        : `<p class="opacity-70">Aucun résultat pour « ${escH(inp.value)} ». <a class="ulink text-terra" href="boutique.html">Voir toute la boutique</a></p>`;
    };
    const close = () => { sr.classList.add("hidden"); document.body.style.overflow = ""; };
    window.openSearch = () => { sr.classList.remove("hidden"); document.body.style.overflow = "hidden"; inp.value = ""; run(); setTimeout(() => inp.focus(), 50); };
    window.closeSearch = close;
    inp.oninput = run; $("#search-x").onclick = close; $("#search-ov").onclick = close;
    $("#search-chips").innerHTML = CATEGORIES.map((c) => `<a href="boutique.html?cat=${c.id}" class="eyebrow border border-ink/25 px-4 py-2 hover:bg-ink hover:text-ivory transition">${escH(c.short)}</a>`).join("");
  }

  function extras() {
    document.body.insertAdjacentHTML("beforeend", `
    <div id="search" class="fixed inset-0 z-[85] hidden">
      <div id="search-ov" class="absolute inset-0 bg-ink/60"></div>
      <div class="relative bg-ivory max-h-[90vh] overflow-y-auto px-5 md:px-10 pt-8 pb-12 shadow-2xl">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center gap-4 border-b border-ink/30 pb-3">
            <svg class="w-6 h-6 opacity-60"><use href="#search"/></svg>
            <input id="search-q" type="search" placeholder="Rechercher une pièce…" aria-label="Rechercher" class="flex-1 bg-transparent display text-3xl md:text-5xl italic outline-none placeholder:opacity-35">
            <button id="search-x" class="eyebrow">Fermer ✕</button>
          </div>
          <div id="search-chips" class="flex gap-3 flex-wrap mt-5 mb-8"></div>
          <div id="search-out"></div>
        </div>
      </div>
    </div>
    <div id="acct" class="fixed inset-0 z-[90] hidden">
      <div id="acct-ov" class="absolute inset-0 bg-ink/60"></div>
      <div class="absolute inset-0 overflow-y-auto grid place-items-center p-4 pointer-events-none">
        <div class="relative pointer-events-auto bg-ivory w-full max-w-md p-8 md:p-10 shadow-2xl">
          <button id="acct-x" class="absolute top-5 right-5 eyebrow" aria-label="Fermer">✕</button>
          <div id="acct-body"></div>
        </div>
      </div>
    </div>
    <a id="wa-float" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Bonjour Impano 👋")}" target="_blank" rel="noopener" aria-label="Discuter sur WhatsApp" class="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[100] w-14 h-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-xl hover:scale-110 transition-transform"><svg class="w-7 h-7"><use href="#wa"/></svg></a>`);
    searchUI();
    $("#open-search").onclick = () => openSearch();
    $("#open-acct").onclick = () => openAccount();
    const ma = $("#menu-acct"); if (ma) ma.onclick = () => { $("#close-menu").click(); openAccount(); };
    $("#acct-x").onclick = closeAccount; $("#acct-ov").onclick = closeAccount;
    addEventListener("keydown", (e) => { if (e.key === "Escape") { closeAccount(); closeSearch(); } });
    acctButton();
  }

  /* ---------- INVITE D'INSTALLATION PWA ---------- */
  let deferred = null;
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const SNOOZE = "impano_install_snooze";
  function showInstall(ios) {
    if ($("#install") || standalone()) return;
    const until = +localStorage.getItem(SNOOZE) || 0;
    if (Date.now() < until) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div id="install" class="fixed inset-x-0 bottom-0 z-[110] p-4 md:p-6 pointer-events-none">
        <div class="pointer-events-auto max-w-xl mx-auto bg-ink text-cowrie shadow-2xl p-6 flex gap-5 items-start translate-y-8 opacity-0 transition-all duration-700" id="install-card">
          <img src="icons/icon-192.png" alt="" class="w-16 h-16 shrink-0 ring-1 ring-cowrie/30">
          <div class="flex-1">
            <p class="display text-2xl italic leading-tight">Installez l’application Impano</p>
            <p class="text-sm opacity-75 mt-1.5 leading-snug">${ios ? "Touchez <b>Partager</b> <span aria-hidden='true'>⎋</span> puis <b>« Sur l’écran d’accueil »</b> pour l’avoir comme une vraie app." : "Accès direct depuis votre écran d’accueil, boutique rapide et hors-ligne."}</p>
            <div class="flex gap-3 mt-4">
              ${ios ? "" : '<button id="install-yes" class="btn btn-light !py-2.5 !px-5 !text-[.65rem]">Installer</button>'}
              <button id="install-no" class="eyebrow !text-[.62rem] opacity-70 hover:opacity-100 px-2">Plus tard</button>
            </div>
          </div>
        </div>
      </div>`);
    requestAnimationFrame(() => $("#install-card")?.classList.remove("translate-y-8", "opacity-0"));
    const hide = (days) => { localStorage.setItem(SNOOZE, Date.now() + days * 864e5); $("#install").remove(); };
    $("#install-no").onclick = () => hide(3);
    const yes = $("#install-yes");
    if (yes) yes.onclick = async () => {
      if (!deferred) return hide(3);
      deferred.prompt(); const { outcome } = await deferred.userChoice; deferred = null;
      hide(outcome === "accepted" ? 3650 : 3);
    };
  }
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; setTimeout(() => showInstall(false), 2500); });
  addEventListener("appinstalled", () => { localStorage.setItem(SNOOZE, Date.now() + 3650 * 864e5); $("#install")?.remove(); toast("Impano est installée ✦"); });
  if (isIOS && !standalone()) addEventListener("load", () => setTimeout(() => showInstall(true), 3500));
  window.installApp = () => deferred ? (localStorage.removeItem(SNOOZE), showInstall(false)) : (isIOS ? (localStorage.removeItem(SNOOZE), showInstall(true)) : toast("Utilisez le menu du navigateur : « Installer l’application »"));

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

  document.addEventListener("DOMContentLoaded", () => { chrome(); extras(); applyCms(); observers(); });
  if ("serviceWorker" in navigator && location.protocol !== "file:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
})();
