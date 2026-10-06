/* Guard against the mistake that cost an hour today.
 * ============================================================================
 *   node tools/check-encoding.mjs
 *
 * PowerShell's Set-Content writes the system codepage, not UTF-8. Editing a
 * file full of Greek with it turns every Greek character into mojibake, and
 * the damage reads as valid UTF-8 afterwards so a decode check will not catch
 * it. This looks for the byte patterns that double-encoding actually produces.
 * ========================================================================= */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

/* Î and Ã are what Greek and accented Latin become when UTF-8 bytes are read
   as cp1252 and written back out. â€ is the same for curly quotes and dashes. */
const SIGNS = /Î[\u0080-¿‘-„•‹›]|â€|Ã[\u0080-¿]|Â[ -¿]/g;

const files = globSync("**/*.{html,js,css,json,md}", { cwd: ROOT })
  .filter((p) => !p.startsWith("build") && !p.includes("node_modules") && !p.startsWith(".git"));

let bad = 0;
for (const f of files) {
  const t = readFileSync(path.join(ROOT, f), "utf8");
  const hits = t.match(SIGNS);
  if (hits) {
    bad++;
    console.log(`DAMAGED  ${f}  (${hits.length} sequences, e.g. ${JSON.stringify(hits[0])})`);
  }
}
console.log(bad ? `\n${bad} file(s) need restoring from git.` : `\n${files.length} files checked, all clean.`);
process.exit(bad ? 1 : 0);
