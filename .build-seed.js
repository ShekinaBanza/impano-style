// Génère api/seed.json (catalogue d'origine) à partir de js/data.js : node .build-seed.js
const fs = require("fs"), vm = require("vm");
const W = { SITE: {} }; const ctx = { window: W, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, sessionStorage: { getItem: () => null }, document: {}, console, SITE: {} };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext("var window = this;", ctx); ctx.window = ctx; ctx.SITE = {};
vm.runInContext(fs.readFileSync("js/data.js", "utf8") + "\n;this.__P = window.DEFAULT_PRODUCTS || DEFAULT_PRODUCTS; this.__C = window.CONFIG;", ctx);
const P = ctx.__P, C = ctx.__C;
fs.writeFileSync("api/seed.json", JSON.stringify({ products: P, config: C }));
console.log(P.length, "articles;", JSON.stringify(C));
console.log("sans description:", P.filter((p) => !p.desc).length, "| sans détails:", P.filter((p) => !p.details || !p.details.length).length, "| sans prix:", P.filter((p) => !p.price).length);
