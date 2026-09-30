/* Puts a picture on every Stripe product, so the checkout page shows the book
 * cover (or the guide's own card) instead of a grey placeholder.
 *
 *   node product-images.mjs
 *
 * Stripe takes image URLs, not uploads, for product images, and the covers are
 * already published on the site, so it points at those. Re-running is safe: it
 * only writes when the image is missing or different.
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = createRequire(import.meta.url)(join(HERE, "..", "site", "config.js"));
const VARS = join(HERE, ".dev.vars");
const KEY = (process.env.STRIPE_SECRET_KEY ||
  ((existsSync(VARS) ? readFileSync(VARS, "utf8") : "").match(/^STRIPE_SECRET_KEY=(.+)$/m) || [])[1] || "").trim();
if (!KEY) fail("No STRIPE_SECRET_KEY in .dev.vars");

const MODE = /_live_/.test(KEY) ? "live" : "test";
const STATE = JSON.parse(readFileSync(join(HERE, `stripe-links.${MODE}.json`), "utf8"));
const BASE = CONFIG.site.baseUrl.replace(/\/$/, "");

/* Books show their own cover. The guide packages have no cover of their own, so
   they share the brand card, which is at least EVZO's and not a grey square. */
const GUIDE_IMG = `${BASE}/brand/og-shop.png`;
const image = id => {
  const book = CONFIG.ebooks.books.find(b => b.id === id);
  if (book) return `${BASE}/brand/covers/${book.file.replace(/\.pdf$/, "")}.png`;
  return GUIDE_IMG;
};

let changed = 0;
for (const [id, s] of Object.entries(STATE)) {
  if (!s.product) continue;
  const url = image(id);
  const current = await api("GET", "products/" + s.product);
  if ((current.images || [])[0] === url) {
    console.log(`${id.padEnd(12)} ok`);
    continue;
  }
  await api("POST", "products/" + s.product, { "images[0]": url });
  console.log(`${id.padEnd(12)} set  ${url.split("/").pop()}`);
  changed++;
}
console.log(`\n${changed} product image(s) updated.`);

async function api(method, path, fields) {
  const res = await fetch("https://api.stripe.com/v1/" + path, {
    method,
    headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body: fields ? new URLSearchParams(fields) : undefined
  });
  const json = await res.json();
  if (!res.ok) fail(`${method} ${path}: ${json.error?.message}`);
  return json;
}

function fail(msg) { console.error("FAILED, " + msg); process.exit(1); }
