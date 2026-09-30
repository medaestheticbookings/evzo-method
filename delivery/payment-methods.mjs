/* Turns off the local payment methods that mean nothing to a Greek or Cypriot
 * buyer (Bancontact is Belgian, MB WAY Portuguese, Satispay Italian, EPS
 * Austrian). A checkout full of unrecognised logos reads as untrustworthy.
 *
 *   node payment-methods.mjs           show what is on
 *   node payment-methods.mjs --apply   turn the irrelevant ones off
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const VARS = join(dirname(fileURLToPath(import.meta.url)), ".dev.vars");
const KEY = (process.env.STRIPE_SECRET_KEY ||
  ((existsSync(VARS) ? readFileSync(VARS, "utf8") : "").match(/^STRIPE_SECRET_KEY=(.+)$/m) || [])[1] || "").trim();
if (!KEY) fail("No STRIPE_SECRET_KEY in .dev.vars");

/* Off: methods tied to a country EVZO does not sell into. Kept are the ones a
   Greek or Cypriot buyer recognises, card above all, plus the phone wallets.
   Belgian, Portuguese, Italian, Austrian, Polish, Korean, Brazilian. */
const OFF = ["bancontact", "mb_way", "satispay", "eps", "ideal", "p24", "blik",
             "przelewy24", "sofort", "giropay", "twint", "multibanco",
             "kakao_pay", "naver_pay", "payco", "pix", "alipay", "wechat_pay",
             "grabpay", "fpx", "oxxo", "boleto", "konbini", "paynow", "promptpay"];

const list = await api("GET", "payment_method_configurations");
if (!list.data?.length) fail("No payment method configurations returned.");
const cfg = list.data.find(c => c.is_default) || list.data[0];
console.log(`configuration: ${cfg.id}${cfg.is_default ? " (default)" : ""}\n`);

const on = Object.entries(cfg)
  .filter(([, v]) => v && typeof v === "object" && v.display_preference)
  .filter(([, v]) => v.display_preference.value === "on")
  .map(([k]) => k);
console.log("currently on:", on.join(", ") || "(none)");

const toOff = on.filter(m => OFF.includes(m));
console.log("would turn off:", toOff.join(", ") || "(nothing)");

if (!process.argv.includes("--apply")) {
  console.log("\nDry run. Re-run with --apply to change it.");
  process.exit(0);
}
if (!toOff.length) { console.log("\nNothing to change."); process.exit(0); }

const fields = {};
for (const m of toOff) fields[`${m}[display_preference][preference]`] = "off";
await api("POST", "payment_method_configurations/" + cfg.id, fields);
console.log(`\nturned off: ${toOff.join(", ")}`);

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
