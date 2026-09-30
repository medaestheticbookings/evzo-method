/* Sets the Stripe checkout branding (icon, logo, colours) from the brand files,
 * so the payment page does not look like a stranger's after the site.
 *
 *   node brand-stripe.mjs
 *
 * Needs a key with File write and Account write. The "One-time payments"
 * restricted template does NOT include those, so this may refuse; if it does,
 * the same four values have to be set by hand at
 * dashboard.stripe.com/settings/branding. */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BRAND = join(HERE, "..", "brand");
const VARS = join(HERE, ".dev.vars");
const KEY = (process.env.STRIPE_SECRET_KEY ||
  ((existsSync(VARS) ? readFileSync(VARS, "utf8") : "").match(/^STRIPE_SECRET_KEY=(.+)$/m) || [])[1] || "").trim();
if (!KEY) fail("No STRIPE_SECRET_KEY in .dev.vars");

const NAVY = "#0B1220";
const YELLOW = "#FFE14D";

const who = await api("GET", "account");
console.log(`account: ${who.id}  ${who.business_profile?.name || "(no public name)"}`);

const icon = await upload(join(BRAND, "evzo-profile-navy.png"));
const logo = await upload(join(BRAND, "evzo-wordmark-white.png"));
console.log(`uploaded icon ${icon}  logo ${logo}`);

await api("POST", "accounts/" + who.id, {
  "settings[branding][icon]": icon,
  "settings[branding][logo]": logo,
  "settings[branding][primary_color]": NAVY,
  "settings[branding][secondary_color]": YELLOW
});
console.log(`branding set: icon + logo, primary ${NAVY}, secondary ${YELLOW}`);

/* ---- helpers ---- */

async function upload(path) {
  const bytes = readFileSync(path);
  const form = new FormData();
  form.append("purpose", "business_logo");
  form.append("file", new Blob([bytes], { type: "image/png" }), basename(path));
  const res = await fetch("https://files.stripe.com/v1/files", {
    method: "POST", headers: { Authorization: "Bearer " + KEY }, body: form
  });
  const json = await res.json();
  if (!res.ok) fail(`file upload ${basename(path)}: ${json.error?.message}`);
  return json.id;
}

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
