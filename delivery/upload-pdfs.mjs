/* Uploads every PDF named in site/config.js to the private R2 bucket the Worker
 * serves from. Re-run it after `node ebooks/build.mjs` so buyers get the
 * current edition.
 *
 *   node upload-pdfs.mjs
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = createRequire(import.meta.url)(join(HERE, "..", "site", "config.js"));
const BUCKET = "evzo-pdfs";

const files = CONFIG.ebooks.books.map(b => b.file);
const missing = files.filter(f => !existsSync(join(HERE, "..", "ebooks", f)));
if (missing.length) {
  console.error("Not built yet, run node ebooks/build.mjs first:\n  " + missing.join("\n  "));
  process.exit(1);
}

for (const f of files) {
  console.log("uploading", f);
  execFileSync("npx", ["wrangler", "r2", "object", "put", `${BUCKET}/books/${f}`,
    "--file", join(HERE, "..", "ebooks", f), "--content-type", "application/pdf", "--remote"],
    { cwd: HERE, stdio: "inherit", shell: process.platform === "win32" });
}
console.log(`\n${files.length} PDFs uploaded to ${BUCKET}.`);
