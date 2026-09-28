/* Encrypts every PDF named in site/config.js into delivery/books/<file>.enc,
 * which is what deliver.mjs attaches to the buyer's email. Re-run it after
 * `node ebooks/build.mjs`, then commit and push, so buyers get the current edition.
 *
 *   node encrypt-pdfs.mjs
 *
 * The repo is public, so only the encrypted copies are ever committed. The key
 * is EVZO_PDF_KEY in .dev.vars (git-ignored). The first run creates it; copy it
 * to GitHub with:  node set-secrets.mjs
 * Never change the key once live without re-running this and set-secrets.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCipheriv, randomBytes } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = createRequire(import.meta.url)(join(HERE, "..", "site", "config.js"));
const VARS = join(HERE, ".dev.vars");

let key = (existsSync(VARS) ? readFileSync(VARS, "utf8") : "").match(/^EVZO_PDF_KEY=(.+)$/m);
key = key ? key[1].trim() : null;
if (!key) {
  key = randomBytes(32).toString("base64");
  appendFileSync(VARS, (existsSync(VARS) && !readFileSync(VARS, "utf8").endsWith("\n") ? "\n" : "") +
    "EVZO_PDF_KEY=" + key + "\n");
  console.log("Created a new EVZO_PDF_KEY in .dev.vars. Run node set-secrets.mjs to copy it to GitHub.");
}

const files = CONFIG.ebooks.books.map(b => b.file);
const missing = files.filter(f => !existsSync(join(HERE, "..", "ebooks", f)));
if (missing.length) {
  console.error("Not built yet, run node ebooks/build.mjs first:\n  " + missing.join("\n  "));
  process.exit(1);
}

mkdirSync(join(HERE, "books"), { recursive: true });
for (const f of files) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", Buffer.from(key, "base64"), iv);
  const body = Buffer.concat([c.update(readFileSync(join(HERE, "..", "ebooks", f))), c.final()]);
  writeFileSync(join(HERE, "books", f + ".enc"), Buffer.concat([iv, c.getAuthTag(), body]));
  console.log("encrypted", f);
}
console.log(`\n${files.length} PDFs encrypted into delivery/books/. Commit and push them.`);
