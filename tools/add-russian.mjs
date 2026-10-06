/* Wire Russian in, and make Greek the default.
 * ============================================================================
 *   node tools/add-russian.mjs
 *
 * Node rather than the shell: PowerShell's Set-Content writes the system
 * codepage, not UTF-8, and these files are full of Greek. Doing it there turned
 * twenty thousand Greek characters in i18n.js into mojibake and the files had
 * to be restored from git.
 *
 * Matching is done with regexes that tolerate either line ending. The first
 * version of this script used exact multi-line strings with \n, the files are
 * CRLF, and three of the five edits silently did nothing while the script
 * cheerfully reported success.
 *
 * Idempotent: every edit checks for itself first.
 * ========================================================================= */
import { readFileSync, writeFileSync, globSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => writeFileSync(path.join(ROOT, p), s, "utf8");
const nl = (s) => s.replace(/\r?\n/g, "\\r?\\n");          // literal -> line-ending-agnostic pattern
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rx = (s, flags) => new RegExp(nl(esc(s)), flags);

/* ---------- 1. i18n.js ---------------------------------------------------- */
let t = read("site/i18n.js");
const before = t;
const edits = [];

if (!t.includes("EVZO_RU")) {
  t = t.replace(rx('    if (cur === "el" && EL[k]) return EL[k];'),
`    if (cur === "el" && EL[k]) return EL[k];
    /* Russian lives in site/i18n-ru.js, loaded beside this file. Kept apart
       because this one is already nine hundred lines of Greek, and a missing
       entry falls through to English exactly as a missing Greek one does. */
    if (cur === "ru" && window.EVZO_RU && window.EVZO_RU[k]) return window.EVZO_RU[k];`);
  edits.push("ru lookup");
}

if (!t.includes('toggle("ru"')) {
  t = t.replace(rx(`    document.body.classList.toggle("gr", cur === "el");
    document.documentElement.setAttribute("lang", cur === "el" ? "el" : "en");`),
`    document.body.classList.toggle("gr", cur === "el");
    /* Anton carries no Cyrillic either, so .ru sends headlines to Commissioner
       800 by the same route .gr already uses. See site/evzo.css. */
    document.body.classList.toggle("ru", cur === "ru");
    document.documentElement.setAttribute("lang", cur);`);
  edits.push("ru body class + lang attr");
}

if (t.includes('var cur = "en";')) {
  t = t.replace(rx('  var cur = "en";'),
`  /* Greek by default: that is who the ads are for. The markup is authored in
     English because the dictionaries are keyed on English strings, so the page
     translates itself once on load rather than waiting for a button press.
     Pressing EN puts the original strings back untouched. */
  var cur = "el";`);
  edits.push("greek default");
}

if (!t.includes("Default language applied on load")) {
  t = t.replace(rx(`  document.addEventListener("DOMContentLoaded", function () {
    collect();`),
`  document.addEventListener("DOMContentLoaded", function () {
    collect();
    // Default language applied on load, before anybody touches the switch.
    if (cur !== "en") apply();`);
  edits.push("apply on load");
}

if (t !== before) { write("site/i18n.js", t); console.log("site/i18n.js  ->", edits.join(", ")); }
else console.log("site/i18n.js  already done");

/* ---------- 2. every page with a language switch -------------------------- */
const RU_BTN = '<button type="button" data-lang="ru" aria-pressed="false">РУ</button>';
const pages = globSync("**/*.html", { cwd: ROOT })
  .filter((p) => !p.startsWith("build") && read(p).includes("data-lang"));

for (const p of pages) {
  let h = read(p);
  const was = h;

  if (!h.includes('data-lang="ru"')) {
    h = h.replace(/<button type="button" data-lang="en" aria-pressed="[^"]*">EN<\/button>/,
                  '<button type="button" data-lang="en" aria-pressed="false">EN</button>');
    h = h.replace(/<button type="button" data-lang="el" aria-pressed="[^"]*">ΕΛ<\/button>/,
                  (m) => m.replace(/aria-pressed="[^"]*"/, 'aria-pressed="true"') + "\n      " + RU_BTN);
  }
  if (!h.includes("i18n-ru.js")) {
    h = h.replace(/<script src="([^"]*?)i18n\.js"><\/script>/,
                  (m, pre) => m + "\n" + `<script src="${pre}i18n-ru.js"></script>`);
  }
  if (h !== was) { write(p, h); console.log(`${p.padEnd(26)} wired`); }
}

/* ---------- 3. prove it, rather than report success ----------------------- */
const check = read("site/i18n.js");
const must = [
  ['var cur = "el";', "greek default"],
  ['window.EVZO_RU', "ru lookup"],
  ['toggle("ru", cur === "ru")', "ru body class"],
  ['setAttribute("lang", cur)', "lang attribute"],
  ["Default language applied on load", "apply on load"],
];
let ok = true;
console.log();
for (const [needle, name] of must) {
  const hit = check.includes(needle);
  if (!hit) ok = false;
  console.log((hit ? "  yes  " : "  MISS ") + name);
}
process.exit(ok ? 0 : 1);
