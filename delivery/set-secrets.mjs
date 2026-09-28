/* Copies the delivery secrets from .dev.vars into the GitHub repo's Actions
 * secrets, without printing them. Needs the GitHub CLI logged in (gh auth login).
 *
 *   node set-secrets.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const vars = Object.fromEntries(readFileSync(join(HERE, ".dev.vars"), "utf8").split(/\r?\n/)
  .map(l => l.match(/^([A-Z_]+)=(.+)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]));

for (const name of ["STRIPE_SECRET_KEY", "RESEND_API_KEY", "EVZO_PDF_KEY"]) {
  if (!vars[name]) { console.log(`skip  ${name} (not in .dev.vars yet)`); continue; }
  execFileSync("gh", ["secret", "set", name], { cwd: HERE, input: vars[name], stdio: ["pipe", "ignore", "inherit"] });
  console.log(`set   ${name}`);
}
