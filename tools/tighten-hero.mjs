/* Shorter hero copy in Greek and Russian. Node, never the shell. Idempotent.
   The English fits in three lines of Anton; the same words in Commissioner 800,
   which is far wider, ran to six lines in Greek plus four of paragraph, and the
   first screen was nothing but type. */
import { readFileSync, writeFileSync } from "node:fs";

function set(file, key, value) {
  let t = readFileSync(file, "utf8");
  const re = new RegExp(`(\\n\\s*${JSON.stringify(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*\\r?\\n?\\s*)"(?:[^"\\\\]|\\\\.)*"`);
  if (!re.test(t)) throw new Error(`${key} not found in ${file}`);
  t = t.replace(re, `$1${JSON.stringify(value)}`);
  writeFileSync(file, t, "utf8");
}

// Greek: the second half of the headline becomes the phrase Marco picked.
set("site/i18n.js", "A plan built around your real life.", "Φτιαγμένο για σένα.");
set("site/i18n.js",
  "Answer a few short questions. Get a month of meals built from your own numbers, and from Mediterranean food you will actually want to eat.",
  "Λίγες σύντομες ερωτήσεις. Ένας μήνας γεύματα από τους δικούς σου αριθμούς.");

// Russian, the same cut.
set("site/i18n-ru.js", "A plan built around your real life.", "Составлено для вас.");
set("site/i18n-ru.js",
  "Answer a few short questions. Get a month of meals built from your own numbers, and from Mediterranean food you will actually want to eat.",
  "Несколько коротких вопросов. Месяц питания по вашим цифрам.");

// And the size: Commissioner set at Anton's size is roughly a third wider.
let css = readFileSync("site/evzo.css", "utf8");
if (!css.includes("body.gr .hero h1")) {
  css += `

/* Greek and Russian headlines are set in Commissioner 800, which is about a
   third wider than Anton at the same size, so the hero headline that fits in
   three lines in English ran to six in Greek. Scaled down to match the English
   line count rather than the English point size. */
body.gr .hero h1,body.ru .hero h1{font-size:clamp(30px,4.6vw,48px);line-height:1.08}
body.gr .hero .sub,body.ru .hero .sub{max-width:34ch}
`;
  writeFileSync("site/evzo.css", css, "utf8");
}
console.log("hero tightened");
