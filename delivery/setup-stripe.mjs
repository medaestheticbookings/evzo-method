/* Creates (or updates) one Stripe product + price + Payment Link per book in
 * site/config.js, plus one for the whole-library bundle, then writes each
 * link into config.js as `checkoutUrl` so the shop's Buy buttons use it.
 *
 *   node setup-stripe.mjs      (reads STRIPE_SECRET_KEY from .dev.vars)
 *
 * Safe to re-run: it remembers what it made in stripe-links.json and only
 * creates a new price/link when a book's price has changed. Run it with a
 * sk_test_ key first, then again with sk_live_ (test and live are separate
 * worlds in Stripe, so each gets its own links and its own state file).
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(HERE, "..", "site", "config.js");
const CONFIG = createRequire(import.meta.url)(CONFIG_PATH);

const VARS = join(HERE, ".dev.vars");
const KEY = process.env.STRIPE_SECRET_KEY ||
  ((existsSync(VARS) ? readFileSync(VARS, "utf8") : "").match(/^STRIPE_SECRET_KEY=(.+)$/m) || [])[1];
if (!/^sk_(test|live)_/.test((KEY || "").trim())) exit("Put STRIPE_SECRET_KEY=sk_test_... or sk_live_... in .dev.vars.");
// After paying, buyers land on the site's own thank-you page. The PDFs follow
// by email from deliver.mjs within a few minutes.
const THANKS = CONFIG.site.baseUrl.replace(/\/$/, "") + "/shop/thanks.html";
const MODE = KEY.startsWith("sk_live_") ? "live" : "test";
const STATE_PATH = join(HERE, `stripe-links.${MODE}.json`);
const state = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, "utf8")) : {};

const SHOP = CONFIG.ebooks;

/* The personalised guide packages. These are NOT books:
   - fulfilment is by hand, so there is no PDF for deliver.mjs to attach and
     `evzo_files` stays empty. The order still needs acting on, which is what
     the Stripe email to the owner is for.
   - the 6-month package does include the whole ebook library, so that one
     carries every file and is delivered automatically like a bundle.
   - they are one-off payments covering N monthly rebuilds, not subscriptions;
     Stripe would otherwise auto-charge on a cadence the fulfilment cannot keep. */
const PACKAGES = (CONFIG.packages || []).map(p => ({
  id: p.id,
  name: CONFIG.product.name + ", " + p.name,
  files: p.months >= 6 ? SHOP.books.map(b => b.file) : [],
  amount: p.priceAmount,
  description: p.summary,
  manual: true,
  months: p.months
}));

const products = [
  ...SHOP.books.map(b => ({
    id: b.id, name: b.name, files: [b.file],
    amount: b.priceAmount || SHOP.singlePriceAmount, description: b.blurb
  })),
  {
    id: SHOP.bundle.id, name: SHOP.bundle.name, files: SHOP.books.map(b => b.file),
    amount: SHOP.bundle.priceAmount, description: SHOP.bundle.blurb
  },
  ...PACKAGES
];

// Shown on the Stripe checkout page, beside the Pay button. EU law: a digital
// download starts immediately only with the buyer's express consent and their
// acknowledgement that the 14-day withdrawal right is lost.
const WAIVER = "By paying you ask for the PDF to be emailed to you straight away and acknowledge " +
  "that you lose your 14-day right of withdrawal once it has been sent.";

// The guide is written to the buyer's own measurements and answers, so it is a
// made-to-order item, and it is not delivered instantly. Reusing the ebook
// wording here would promise a download that does not arrive for a day.
const WAIVER_MANUAL = "Your guide is built from your own answers and emailed within 24 hours. " +
  "By paying you ask for work to begin now and acknowledge that, because it is made to your " +
  "specification, the 14-day right of withdrawal does not apply once it has been sent.";

for (const p of products) {
  const cents = Math.round(p.amount * 100);
  const files = p.files.join(",");
  if (files.length > 500) exit(`${p.id}: file list is over Stripe's 500-character metadata limit.`);
  const s = state[p.id] || {};

  // Product: one per book, carrying the PDF file names the Worker delivers.
  const productFields = {
    name: "EVZO, " + p.name, description: p.description,
    "metadata[evzo_id]": p.id, "metadata[evzo_files]": files,
    "metadata[evzo_manual]": p.manual ? "1" : "0"
  };
  if (p.months) productFields["metadata[evzo_months]"] = String(p.months);
  s.product = s.product
    ? (await api("POST", "products/" + s.product, productFields)).id
    : (await api("POST", "products", productFields)).id;

  // Price and link: Stripe prices are immutable, so a new amount means a new
  // price and a new link. The old link is switched off so it cannot be used.
  if (s.amount !== cents || !s.link) {
    const price = await api("POST", "prices", {
      product: s.product, currency: SHOP.currency.toLowerCase(), unit_amount: cents
    });
    if (s.linkId) await api("POST", "payment_links/" + s.linkId, { active: "false" });
    const link = await api("POST", "payment_links", {
      "line_items[0][price]": price.id, "line_items[0][quantity]": 1,
      "after_completion[type]": "redirect",
      "after_completion[redirect][url]": THANKS,
      "custom_text[submit][message]": p.manual ? WAIVER_MANUAL : WAIVER,
      allow_promotion_codes: "true",
      "metadata[evzo_id]": p.id,
      // Marked so deliver.mjs does not treat a hand-built guide as a missing
      // attachment, and so the owner can spot orders that need work doing.
      "metadata[evzo_manual]": p.manual ? "1" : "0"
    });
    Object.assign(s, { price: price.id, amount: cents, link: link.url, linkId: link.id });
    console.log(`${p.id.padEnd(12)} €${p.amount.toFixed(2).padStart(6)}  NEW  ${link.url}`);
  } else {
    console.log(`${p.id.padEnd(12)} €${p.amount.toFixed(2).padStart(6)}  ok   ${s.link}`);
  }
  state[p.id] = s;
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// Write the links into config.js. Only the live links belong on the website, // test links would take real customers to a checkout that charges nothing and
// is labelled TEST MODE.
if (MODE === "live" || process.argv.includes("--write-test-links")) {
  let src = readFileSync(CONFIG_PATH, "utf8");
  for (const p of products) {
    const re = new RegExp(`(id: "${p.id}",)(\\s*checkoutUrl: "[^"]*",)?`);
    if (!re.test(src)) exit(`Could not find id: "${p.id}" in config.js`);
    src = src.replace(re, `$1 checkoutUrl: "${state[p.id].link}",`);
  }
  writeFileSync(CONFIG_PATH, src);
  console.log(`\nWrote ${products.length} checkout links into site/config.js.`);
} else {
  console.log("\nTest mode: config.js left alone. Open a link above and pay with 4242 4242 4242 4242.");
  console.log("(Pass --write-test-links to put the test links on the local site anyway.)");
}

/* ---- helpers --- */

async function api(method, path, fields) {
  const res = await fetch("https://api.stripe.com/v1/" + path, {
    method,
    headers: { Authorization: "Bearer " + KEY.trim(), "Content-Type": "application/x-www-form-urlencoded" },
    body: fields ? new URLSearchParams(fields) : undefined
  });
  const json = await res.json();
  if (!res.ok) exit(`Stripe ${method} ${path}: ${json.error && json.error.message}`);
  return json;
}

function exit(msg) {
  console.error(msg);
  process.exit(1);
}
