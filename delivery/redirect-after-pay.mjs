/* Send buyers back to evzomethod.com after they pay.
 * ============================================================================
 *   node redirect-after-pay.mjs          # show what would change
 *   node redirect-after-pay.mjs --apply  # change it
 *
 * By default a Stripe Payment Link finishes on a Stripe-hosted confirmation
 * page, so the buyer never returns and this site never learns a sale happened.
 * That is why the Meta dataset had no Purchase event to optimise against.
 *
 * This points every link at /thank-you/, carrying two things:
 *
 *   v   the amount, written into the URL per link. Each link has one fixed
 *       price, so this is accurate, and reading the real figure back out of
 *       Stripe would need a server this site does not have.
 *   id  {CHECKOUT_SESSION_ID}, which Stripe substitutes. Used only to show an
 *       order reference and to keep the Purchase event from firing twice if
 *       the page is reloaded.
 *
 * Re-running is safe: it only writes where the URL is missing or different.
 * ========================================================================= */
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

const APPLY = process.argv.includes("--apply");
const MODE = /_live_/.test(KEY) ? "live" : "test";
const BASE = CONFIG.site.baseUrl.replace(/\/$/, "");

/* Price per link, so the Purchase event reports what was actually paid. */
const PRICES = {};
(CONFIG.packages || []).forEach(p => { PRICES[p.checkoutUrl] = p.priceAmount; });
(CONFIG.ebooks.books || []).forEach(b => {
  if (b.checkoutUrl) PRICES[b.checkoutUrl] = b.priceAmount ?? CONFIG.ebooks.bundle.priceAmount;
});
const bundle = CONFIG.ebooks.bundle;
if (bundle && bundle.checkoutUrl) PRICES[bundle.checkoutUrl] = bundle.priceAmount;

const links = await api("GET", "payment_links?limit=100");
let changed = 0, skipped = 0;

for (const link of links.data) {
  const price = PRICES[link.url];
  if (price === undefined) {
    console.log(`${link.id}  no price known for ${link.url}, left alone`);
    skipped++;
    continue;
  }
  const want = `${BASE}/thank-you/?v=${price}&id={CHECKOUT_SESSION_ID}`;
  const have = link.after_completion?.redirect?.url;
  if (have === want) { console.log(`${link.id}  ok`); continue; }

  console.log(`${link.id}  ${APPLY ? "set" : "would set"}  -> ?v=${price}`);
  if (APPLY) {
    await api("POST", "payment_links/" + link.id, {
      "after_completion[type]": "redirect",
      "after_completion[redirect][url]": want
    });
  }
  changed++;
}

console.log(`\n${MODE}: ${changed} link(s) ${APPLY ? "updated" : "would change"}, ${skipped} skipped.`);
if (!APPLY && changed) console.log("Re-run with --apply to write them.");

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
