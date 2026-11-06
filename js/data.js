/* =========================================================
   IMPANO — configuration & catalogue
   ⚠️ Prix, numéro WhatsApp et villes : à adapter à votre réalité.
   ========================================================= */
window.CONFIG = {
  brand: "Impano",
  tagline: "Wear the Gift · Be the Gift",
  whatsapp: "243978134902",           // numéro WhatsApp (format international, sans +)
  currency: "$",
  freeShippingFrom: 150,
  shipping: { lubumbashi: 5, autre: 15, retrait: 0 },
  instagram: "https://www.instagram.com/"
};

window.CATEGORIES = [
  { id: "bonnets", label: "Bonnets & Chapeaux", short: "Bonnets", img: "assets/img/p32.jpg", blurb: "Crochet ajouré, cauris et motifs ancestraux." },
  { id: "sacs", label: "Sacs bananes", short: "Sacs", img: "assets/img/p20.jpg", blurb: "Le sac de tous les jours, tricoté main." },
  { id: "pret-a-porter", label: "Prêt-à-porter crochet", short: "Prêt-à-porter", img: "assets/img/p07.jpg", blurb: "Ensembles sculptés fil après fil." }
];

const DEFAULT_PRODUCTS = [
  /* ---------- BONNETS & CHAPEAUX ---------- */
  {
    id: "bonnet-cauri-savane", cat: "bonnets", name: "Bonnet Cauri Savane", price: 38,
    img: "assets/img/p14c.jpg", gallery: ["assets/img/p14c.jpg", "assets/img/p15.jpg"],
    tag: "Pièce unique", color: "Sable & cuivre",
    desc: "Un filet de crochet aux nuances de savane, relevé d’un cauri discret. Léger, respirant, il se glisse sous le soleil comme sous la pluie.",
    details: ["100 % fait main", "Cauri naturel cousu", "Taille unique, très extensible", "Pièce n’existant qu’en un exemplaire"]
  },
  {
    id: "bonnet-nacre", cat: "bonnets", name: "Bonnet Nacre", price: 36,
    img: "assets/img/p23c.jpg", gallery: ["assets/img/p23c.jpg"],
    tag: "Nouveau", color: "Blanc & perles",
    desc: "Maille ouverte blanche, minuscules perles noires et dorées sur le pourtour. La légèreté d’un voile, la signature d’un bijou.",
    details: ["100 % fait main", "Perles africaines", "Taille unique", "Entretien : lavage main à froid"]
  },
  {
    id: "bonnet-emeraude", cat: "bonnets", name: "Bonnet Émeraude", price: 38,
    img: "assets/img/p27.jpg", gallery: ["assets/img/p27.jpg"],
    tag: "Pièce unique", color: "Vert émeraude",
    desc: "Un vert profond, un dessin sur le dessus, de petites perles noires sur le côté. Il fait partie de la récente collection.",
    details: ["100 % fait main", "Perles noires cousues", "Taille unique", "Pièce n’existant qu’en un exemplaire"]
  },
  {
    id: "bonnet-pourpre-cowrie", cat: "bonnets", name: "Bonnet Pourpre Cowrie", price: 40,
    img: "assets/img/p32.jpg", gallery: ["assets/img/p32.jpg", "assets/img/p29.jpg"],
    tag: "Pièce unique", color: "Violet royal",
    desc: "Une belle couleur violette et une petite touche de cowries. Un accessoire qui complète le look et y rajoute une touche d’originalité.",
    details: ["100 % fait main", "Cauri naturel", "Taille unique", "Pièce n’existant qu’en un exemplaire"]
  },
  {
    id: "bob-terre", cat: "bonnets", name: "Bob Couleurs de la Terre", price: 52,
    img: "assets/img/p28.jpg", gallery: ["assets/img/p28.jpg", "assets/img/p31.jpg"],
    tag: "En stock", color: "Terre & chocolat",
    desc: "Le bob qui se marie avec tout : des teintes de terre, un motif graphique et l’étiquette Impano cousue main.",
    details: ["100 % fait main", "Bord souple", "Taille unique", "Disponible immédiatement"]
  },
  {
    id: "casquette-motifs", cat: "bonnets", name: "Casquette Motifs Terre", price: 48,
    img: "assets/img/p31.jpg", gallery: ["assets/img/p31.jpg"],
    tag: "Collection", color: "Brun & beige",
    desc: "Couleurs rappelant la terre, imprimé géométrique inspiré des motifs traditionnels. Une visière, une allure.",
    details: ["100 % fait main", "Visière structurée", "Taille unique"]
  },
  {
    id: "chapeau-wosoko", cat: "bonnets", name: "Chapeau Wosoko", price: 55,
    img: "assets/img/p33c.jpg", gallery: ["assets/img/p33c.jpg"],
    tag: "Série imprimés", color: "Noir & blanc",
    desc: "Première pièce de notre série d’imprimés traditionnels africains : un hommage à des siècles de motifs, de proverbes et d’histoire.",
    details: ["100 % fait main", "Broderie de motifs Bogolanfini-inspirés", "Taille unique"]
  },
  {
    id: "collection-six-bonnets", cat: "bonnets", name: "Coffret Six Bonnets", price: 195,
    img: "assets/img/p29.jpg", gallery: ["assets/img/p29.jpg"],
    tag: "Édition", color: "Assortiment",
    desc: "Six bonnets, six personnalités. La collection complète réunie dans un coffret cadeau — chaque pièce est unique.",
    details: ["6 bonnets assortis", "Emballage cadeau", "Pièces uniques"]
  },

  /* ---------- SACS BANANES ---------- */
  {
    id: "sac-aztec", cat: "sacs", name: "Sac Banane Aztèque", price: 42,
    img: "assets/img/p18.jpg", gallery: ["assets/img/p18.jpg", "assets/img/p35.jpg"],
    tag: "Sur commande", color: "Noir, rouge & blanc",
    desc: "Motifs géométriques tricotés dans un noir profond relevé de rouge. Le sac banane qui te suit partout et te facilite la vie.",
    details: ["100 % fait main", "Zip solide, sangle réglable", "Doublure intérieure", "Délai : 7 à 10 jours"]
  },
  {
    id: "sac-papillon", cat: "sacs", name: "Sac Banane Papillon", price: 42,
    img: "assets/img/p20.jpg", gallery: ["assets/img/p20.jpg"],
    tag: "Sur commande", color: "Noir & violet",
    desc: "Un papillon violet tricoté en intarsia sur fond noir. Discret, poétique, indispensable.",
    details: ["100 % fait main", "Zip solide, sangle réglable", "Délai : 7 à 10 jours"]
  },
  {
    id: "sac-fusee", cat: "sacs", name: "Sac Banane Fusée", price: 45,
    img: "assets/img/p21.jpg", gallery: ["assets/img/p21.jpg"],
    tag: "Sur commande", color: "Noir multicolore",
    desc: "Une fusée, des étoiles, un clin d’œil joueur sur un fond noir intense. Pour les rêveurs du quotidien.",
    details: ["100 % fait main", "Zip solide, sangle réglable", "Délai : 7 à 10 jours"]
  },
  {
    id: "sac-lune", cat: "sacs", name: "Sac Banane Lune", price: 45,
    img: "assets/img/p22.jpg", gallery: ["assets/img/p22.jpg"],
    tag: "Sur commande", color: "Noir & or",
    desc: "Croissant de lune et soleil dorés brodés au point serré. Le sac de tous les jours, version céleste.",
    details: ["100 % fait main", "Zip solide, sangle réglable", "Délai : 7 à 10 jours"]
  },

  /* ---------- PRÊT-À-PORTER ---------- */
  {
    id: "ensemble-cascade", cat: "pret-a-porter", name: "Ensemble Cascade", price: 210,
    img: "assets/img/p01.jpg", gallery: ["assets/img/p01.jpg", "assets/img/p02.jpg", "assets/img/p03.jpg", "assets/img/p04.jpg"],
    tag: "Sur mesure", color: "Orange brûlé & chocolat", sizes: ["S", "M", "L", "XL"],
    desc: "Haut bustier et pantalon large en crochet, orange brûlé comme la terre du Katanga. Fait pour les cascades, les rivières et les grands jours.",
    details: ["Fait main sur mesure", "Pantalon taille haute", "Fil de coton doux", "Délai : 2 à 3 semaines"]
  },
  {
    id: "gilet-soleil", cat: "pret-a-porter", name: "Gilet Soleil", price: 95,
    img: "assets/img/p05.jpg", gallery: ["assets/img/p05.jpg", "assets/img/p06.jpg"],
    tag: "Défilé", color: "Orange vif", sizes: ["S", "M", "L"],
    desc: "Vu sur le tapis rouge de la Lubumbashi Fashion Week. Un gilet crochet orange éclatant, à porter sur du vert, du noir ou rien du tout.",
    details: ["Fait main", "Coupe courte", "Fil de coton", "Délai : 10 à 14 jours"]
  },
  {
    id: "ensemble-ivoire", cat: "pret-a-porter", name: "Ensemble Ivoire", price: 230,
    img: "assets/img/p07.jpg", gallery: ["assets/img/p07.jpg", "assets/img/p10.jpg", "assets/img/p08.jpg", "assets/img/p09.jpg"],
    tag: "Sur mesure", color: "Ivoire", sizes: ["S", "M", "L", "XL"],
    desc: "Top à manches évasées en filet et mini-short assorti. Un crochet aérien, presque architectural, fait pour sublimer la lumière.",
    details: ["Fait main sur mesure", "Manches cloche", "Top + short", "Délai : 2 à 3 semaines"]
  }
];

/* ---- Données modifiables depuis /admin.html (stockées dans le navigateur) ---- */
(function () {
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const cfg = read("impano_config");
  if (cfg) Object.assign(CONFIG, cfg, { shipping: Object.assign({}, CONFIG.shipping, cfg.shipping || {}) });
  window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
  window.ALL_PRODUCTS = read("impano_products") || DEFAULT_PRODUCTS;   // tout (pour l'admin)
  window.PRODUCTS = window.ALL_PRODUCTS.filter((p) => !p.hidden);       // visible en boutique
})();

window.fmt = (n) => CONFIG.currency + Number(n).toFixed(0);
window.byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);
