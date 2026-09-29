/* Removes test-mode checkoutUrl values from site/config.js.
 * Test links must never reach the live site: they open a checkout marked TEST
 * MODE that takes no money. Run after `setup-stripe.mjs --write-test-links`
 * has been used to try the flow locally. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = join(dirname(fileURLToPath(import.meta.url)), "..", "site", "config.js");
const src = readFileSync(CONFIG, "utf8");
const re = /\s*checkoutUrl:\s*"https:\/\/buy\.stripe\.com\/test_[^"]*",/g;
const n = (src.match(re) || []).length;
writeFileSync(CONFIG, src.replace(re, ""));
console.log(`removed ${n} test checkout links from site/config.js`);
