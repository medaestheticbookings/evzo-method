/* EVZO — ebook builder
 * ============================================================================
 * Builds the two upsell products as print-ready PDFs:
 *
 *   node ebooks/build.mjs
 *     -> ebooks/EVZO-Healthy-Recipes.pdf          (order bump, EUR 9.99)
 *     -> ebooks/EVZO-30-Day-Meal-Variety.pdf      (upsell, EUR 29)
 *
 * Same approach as tools/render.mjs: drives the Chrome already on the machine,
 * no npm install, no dependencies.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: every calorie and macro figure printed
 * in either book is computed here, from foods.json, by arithmetic. None of them
 * are written by hand in the content files and none are produced by a model.
 * Change a number in foods.json and both books change with it.
 * ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import * as NUTRITION from "./nutrition.mjs";
import * as FITNESS from "./fitness.mjs";
const { food, macros, cost } = NUTRITION;
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BRAND = join(HERE, "..", "brand");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(p => existsSync(p));

if (!CHROME) {
  console.error("No Chrome or Edge found. Install one, or edit the CHROME list.");
  process.exit(1);
}

const FOODS   = NUTRITION.FOODS;
const RECIPES = JSON.parse(readFileSync(join(HERE, "recipes.json"), "utf8")).recipes;
const PLAN    = JSON.parse(readFileSync(join(HERE, "plan.json"), "utf8"));
const WORKBOOK = JSON.parse(readFileSync(join(HERE, "workbook.json"), "utf8"));

const logoLight = readFileSync(join(BRAND, "evzo-wordmark-ev-yellow.svg"), "utf8"); // for navy pages
const logoDark  = readFileSync(join(BRAND, "evzo-wordmark-black.svg"), "utf8");     // for white pages
const iconBars  = readFileSync(join(BRAND, "evzo-icon-bars.svg"), "utf8");         // the cover graphic

/* ---- the arithmetic ------------------------------------------------------ */

// food() and macros() now live in nutrition.mjs — see the note there.

const SERIES_RECIPES = [
  ...JSON.parse(readFileSync(join(HERE, "recipes-bowls-dinners.json"), "utf8")).recipes,
  ...JSON.parse(readFileSync(join(HERE, "recipes-weight.json"), "utf8")).recipes,
  ...JSON.parse(readFileSync(join(HERE, "recipes-oats-eggs.json"), "utf8")).recipes,
  ...JSON.parse(readFileSync(join(HERE, "recipes-budget.json"), "utf8")).recipes
];

/* The shop page at the back of every book is printed from the same catalogue
   the website's shop renders from, so a price cannot say one thing in a PDF
   and another on the page. */
const CONFIG = createRequire(import.meta.url)(join(HERE, "..", "site", "config.js"));
const SHOP = CONFIG.ebooks;
const ALL_RECIPES = [...RECIPES, ...SERIES_RECIPES];
/* Cost is attached only where every ingredient has a price. The budget book
   needs it; nothing else should fail to build because a price is missing for
   an ingredient that only appears in a recipe nobody is costing. */
function costOrNull(r) {
  try { return cost(r); } catch (e) { return null; }
}
const BY_ID = Object.fromEntries(ALL_RECIPES.map(r => [r.id, { ...r, per: macros(r), eur: costOrNull(r) }]));
const inBook = id => SERIES_RECIPES.filter(r => r.book === id).map(r => BY_ID[r.id]);

/* Figures the website reads back, written to site/shop-data.json at the end
   of the build. The shop cards and the homepage stats band render from this,
   so a count on the site can never disagree with the book it describes. */
const SHOP_STATS = {};

function dayTotals(day) {
  const slots = ["breakfast", "lunch", "dinner", "snack"];
  return slots.reduce((acc, s) => {
    const r = BY_ID[day[s]];
    if (!r) throw new Error("Unknown recipe in plan: " + day[s]);
    acc.kcal += r.per.kcal; acc.protein += r.per.protein;
    acc.carb += r.per.carb; acc.fat += r.per.fat;
    return acc;
  }, { kcal: 0, protein: 0, carb: 0, fat: 0 });
}

/** One week's shopping list: every ingredient actually used, one serving per
 *  meal, added up and sorted by weight so the big items lead. */
function shoppingList(week) {
  const totals = {};
  for (const day of week.days) {
    for (const slot of ["breakfast", "lunch", "dinner", "snack"]) {
      const r = BY_ID[day[slot]];
      for (const item of r.ingredients) {
        if (item.food === "herbs") continue;
        totals[item.food] = (totals[item.food] || 0) + item.g / r.servings;
      }
    }
  }
  return Object.entries(totals)
    .map(([key, g]) => ({ key, label: food(key).label, g: g >= 100 ? Math.round(g / 10) * 10 : Math.round(g / 5) * 5 }))
    .sort((a, b) => b.g - a.g);
}

/* ---- page furniture ------------------------------------------------------ */

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CSS = `
@page { size: A4; margin: 0; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: "Commissioner", system-ui, sans-serif;
  color: #0B1220;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.page {
  width: 210mm; height: 297mm; padding: 18mm 17mm 15mm;
  position: relative; overflow: hidden; break-after: page; background: #FFFFFF;
}
.page:last-child { break-after: auto; }
.page.dark { background: #0B1220; color: #FFFFFF; }

h1, h2, h3, .h { font-family: "Anton", "Arial Narrow", sans-serif; font-weight: 400; letter-spacing: .01em; margin: 0; text-transform: uppercase; }
h1 { font-size: 46pt; line-height: .96; }
h2 { font-size: 24pt; line-height: 1.02; }
h3 { font-size: 13pt; line-height: 1.1; }
p { margin: 0 0 3.4mm; font-size: 10.5pt; line-height: 1.55; }
.lede { font-size: 12pt; line-height: 1.5; color: #3B455A; }
.dark .lede { color: #C8CEDA; }
.label { font-family: "Roboto Mono", monospace; font-size: 7.6pt; letter-spacing: .22em; text-transform: uppercase; color: #7A849A; display: block; }
.yellow { color: #C9AE33; }
.dark .yellow { color: #FFE14D; }
.rule { height: 2px; background: #FFE14D; margin: 5mm 0; }
.mark { height: 7mm; display: block; }
.mark svg { height: 7mm; width: auto; display: block; }

/* cover
   =========================================================================
   A photograph, full bleed, with the type in the lower third.

   The previous version was a flat diagonal colour field with a large chapter
   number in the empty half. It was consistent and it was dead: a cover for a
   book about food with no food on it, and at thumbnail size on a shop page it
   read as a coloured rectangle.

   The structure here is the one every printed cookbook uses, for good
   reasons. The image does the wanting. The scrim under it is what keeps the
   type readable over any photograph, so a cover can never end up with white
   letters on a white plate. The accent colour survives as the rule and the
   Greek line, which is enough to keep the shelf recognisable without the
   colour having to carry the whole design.
   ====================================================================== */
.cover-wrap { position: absolute; inset: 0; overflow: hidden; }

.cover-photo {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
}

/* Two layers, doing different jobs. The tint pushes the photograph towards
   the book's own colour so the set still reads as a series. The scrim is a
   vertical gradient that is nearly transparent at the top and nearly solid
   at the bottom, which is what guarantees the title is legible. */
.cover-tint { position: absolute; inset: 0; mix-blend-mode: soft-light; opacity: .55; }
.cover-scrim {
  position: absolute; inset: 0;
  background: linear-gradient(180deg,
    rgba(11,18,32,.30) 0%,
    rgba(11,18,32,.42) 26%,
    rgba(11,18,32,.80) 48%,
    rgba(11,18,32,.95) 64%,
    #0B1220 78%);
}

/* Books with no photograph of their own fall back to this rather than to a
   stock image that means nothing. It is the same layout, with the colour
   doing the work the picture would have done. */
.cover-plain { position: absolute; inset: 0; }
.cover-plain::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(11,18,32,.10) 0%, rgba(11,18,32,.72) 52%, #0B1220 88%);
}

.cover-inner { position: absolute; inset: 0; padding: 16mm 17mm 30mm; display: flex; flex-direction: column; }
.cover-top { display: flex; justify-content: space-between; align-items: flex-start; }
.cover-top .mark svg { height: 13mm; width: auto; display: block; }
.cover-eyebrow {
  font-family: "Roboto Mono", monospace; font-size: 10pt; letter-spacing: .2em;
  text-transform: uppercase; text-align: right; padding-top: 2mm; max-width: 62mm; line-height: 1.5;
}

/* The figure moves to a small chip beside the eyebrow. It was 92pt in the
   middle of the cover, which is a poster device, not a book one. */
.cover-chip {
  position: absolute; left: 17mm; top: 38mm;
  display: inline-flex; align-items: baseline; gap: 2.2mm;
  padding: 3mm 5mm; border-radius: 0;
}
.cover-chip b { font-family: "Anton", sans-serif; font-weight: 400; font-size: 26pt; line-height: 1; }
.cover-chip span {
  font-family: "Roboto Mono", monospace; font-size: 9.5pt;
  letter-spacing: .16em; text-transform: uppercase;
}

/* mt:auto pushes the block to the bottom, so a two-line title and a
   four-line title both sit on the same baseline. The old fixed 128mm margin
   made long titles drift down the page. */
.cover-big { margin-top: auto; position: relative; max-width: 150mm; }
.cover-rule { height: 2mm; width: 46mm; background: #FFE14D; margin-bottom: 7mm; }
/* Sized for the THUMBNAIL, not the page. A cover is printed once at A4 and
   seen a thousand times at about 200px wide on the shop, and at that size
   42pt title text is four millimetres tall. Everything here is roughly
   half again as large as page design would suggest, and everything that
   could not survive the reduction has been removed rather than shrunk. */
.cover-big h1 { font-size: 52pt; line-height: .92; letter-spacing: -.005em; text-shadow: 0 .6mm 4mm rgba(0,0,0,.55); }
.cover-el { font-size: 15pt; color: #FFE14D; margin: 5mm 0 0; font-weight: 600; }
/* One line, large. The three-line paragraph that used to sit here was
   invisible at thumbnail size and nobody reads a blurb off a cover anyway —
   that is what the shop card's own text is for. */
.cover-big .sub { font-size: 13pt; color: #E3E7EE; margin-top: 6mm; max-width: 120mm; line-height: 1.38; font-weight: 400; }

/* The three-column stat band that used to sit here is gone. At thumbnail
   size it was a grey smudge, and the same figures are already on the shop
   card in text a browser can actually render. */

.cover-foot {
  position: absolute; left: 17mm; right: 17mm; bottom: 14mm; display: flex; justify-content: space-between; align-items: flex-end;
  font-family: "Roboto Mono", monospace; font-size: 9.5pt; letter-spacing: .16em;
  text-transform: uppercase; color: #9AA3B4; margin-top: 9mm;
}

/* recipe */
.recipe-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; }
.recipe-head .greek { font-size: 10pt; color: #7A849A; margin-top: 1.5mm; }
.time { font-family: "Roboto Mono", monospace; font-size: 8pt; letter-spacing: .14em; color: #7A849A; white-space: nowrap; text-transform: uppercase; }
.macros { display: grid; grid-template-columns: repeat(5, 1fr); border: 1px solid #DDE1E8; margin: 5mm 0 6mm; }
.macros div { padding: 3.2mm 3mm; border-right: 1px solid #DDE1E8; }
.macros div:last-child { border-right: 0; }
.macros b { font-family: "Anton", sans-serif; font-size: 16pt; display: block; margin-top: 1mm; font-weight: 400; }
.macros .k { font-family: "Roboto Mono", monospace; font-size: 6.8pt; letter-spacing: .16em; color: #7A849A; text-transform: uppercase; }
.macros .hi b { color: #0B1220; }
/* The cost strip, budget book only. Deliberately the same shape as the macro
   strip above it, because it is the same kind of fact: a number computed from
   the ingredient list rather than a claim about value. */
.cost { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #C9AE33; background: #FFFBEA; margin: -2mm 0 5mm; }
.cost div { padding: 3mm; border-right: 1px solid #E8DCA8; }
.cost div:last-child { border-right: 0; }
.cost b { font-family: "Anton", sans-serif; font-size: 15pt; display: block; margin-top: 1mm; font-weight: 400; color: #6E6224; }
.cost .label { font-size: 6.6pt; }
.cols { display: grid; grid-template-columns: 62mm 1fr; gap: 9mm; }
.ing { list-style: none; margin: 0; padding: 0; }
.ing li { display: flex; justify-content: space-between; gap: 4mm; font-size: 10pt; padding: 1.6mm 0; border-bottom: 1px solid #EDEFF3; }
.ing li span:last-child { font-family: "Roboto Mono", monospace; font-size: 9pt; color: #3B455A; white-space: nowrap; }
ol.method { margin: 0; padding-left: 5mm; }
ol.method li { font-size: 10.5pt; line-height: 1.5; margin-bottom: 2.6mm; }
.why { background: #F4F6F9; border-left: 2px solid #FFE14D; padding: 4mm 5mm; margin-top: 6mm; }
.why p { margin: 0; font-size: 10pt; }
.swaps { margin-top: 5mm; }
.swaps li { font-size: 9.6pt; line-height: 1.45; margin-bottom: 1.6mm; color: #3B455A; }
.pagenum { position: absolute; bottom: 9mm; right: 17mm; font-family: "Roboto Mono", monospace; font-size: 8pt; color: #9AA3B4; }
.brandfoot { position: absolute; bottom: 8mm; left: 17mm; }
.brandfoot svg { height: 4.4mm; width: auto; display: block; }

/* shop page */
.shoplist { border-top: 1px solid #2A3550; }
.shopitem { display: flex; justify-content: space-between; align-items: center; gap: 8mm; padding: 3.6mm 0; border-bottom: 1px solid #2A3550; }
.shopitem h3 { font-size: 14pt; }
.shopprice { font-family: "Roboto Mono", monospace; font-size: 10pt; color: #FFE14D; white-space: nowrap; }
.shopcta { display: flex; justify-content: space-between; align-items: center; gap: 8mm; background: #FFE14D; color: #0B1220; padding: 6mm 7mm; margin-top: 9mm; }
.shopcta .label { color: #6E6224; }
.shopcta .h { color: #0B1220; }
.btn { display: inline-block; background: #0B1220; color: #FFE14D; text-decoration: none; font-family: "Roboto Mono", monospace; font-size: 9pt; letter-spacing: .18em; text-transform: uppercase; padding: 4.5mm 7mm; white-space: nowrap; }

/* workbook */
.wb-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0B1220; padding-bottom: 2.5mm; }
.wb-head .wk { font-family: "Anton", sans-serif; font-size: 15pt; text-transform: uppercase; }
.wb-head .rng { font-family: "Roboto Mono", monospace; font-size: 8pt; color: #7A849A; }

table.wb { width: 100%; border-collapse: collapse; margin-top: 5mm; table-layout: fixed; }
table.wb th {
  font-family: "Roboto Mono", monospace; font-size: 6.4pt; letter-spacing: .1em;
  text-transform: uppercase; color: #7A849A; font-weight: 400;
  padding: 0 0 2mm; text-align: center; vertical-align: bottom; border: 0;
}
table.wb th.d { text-align: left; width: 17mm; }
table.wb th.note { text-align: left; }
table.wb td { border: 0; border-bottom: 1px solid #DDE1E8; padding: 0; height: 13mm; vertical-align: middle; }
table.wb td.day { font-family: "Anton", sans-serif; font-size: 11pt; text-transform: uppercase; }
table.wb td.day small { display: block; font-family: "Commissioner", sans-serif; font-size: 6.6pt; color: #7A849A; text-transform: none; font-weight: 400; margin-top: .6mm; }
table.wb td.tick { text-align: center; }
/* The box people actually tick. Deliberately large: a small box on paper is a
   box that gets a scribble instead of a tick. */
.box { display: inline-block; width: 5.2mm; height: 5.2mm; border: 1.2px solid #9AA3B4; border-radius: .8mm; }
table.wb td.write { border-bottom: 1px solid #DDE1E8; }

.prompt {
  background: #F4F6F9; border-left: 2px solid #FFE14D; padding: 2.2mm 3mm;
  font-size: 8.2pt; line-height: 1.38; color: #3B455A;
}
.prompt b { color: #0B1220; font-weight: 600; }

.wb-foot { margin-top: 5mm; display: flex; justify-content: space-between; align-items: center; }
.miss { font-size: 8.4pt; color: #3B455A; }
.miss b { font-family: "Anton", sans-serif; font-size: 10pt; color: #0B1220; }

.rev-q { border-bottom: 1px solid #DDE1E8; padding: 4mm 0 9mm; }
.rev-q .q { font-size: 10.5pt; font-weight: 600; color: #0B1220; }
.setup-row { border-bottom: 1px solid #DDE1E8; padding: 3.5mm 0; display: flex; gap: 6mm; align-items: baseline; }
.setup-row .num { font-family: "Anton", sans-serif; font-size: 13pt; color: #C9AE33; width: 8mm; flex: none; }
.habit-pick { border: 1px solid #DDE1E8; padding: 4mm 5mm; margin-bottom: 3mm; display: flex; gap: 5mm; align-items: flex-start; }
.habit-pick .box { margin-top: 1mm; flex: none; }
.habit-pick b { font-size: 11pt; display: block; margin-bottom: 1mm; }
.habit-pick p { margin: 0; font-size: 9.4pt; color: #3B455A; }
.blank { border-bottom: 1px solid #C8CEDA; height: 7mm; margin-top: 3mm; }

/* workouts */
.sess { border-top: 1px solid #DDE1E8; padding: 4mm 0 4.5mm; }
.sess:last-of-type { border-bottom: 1px solid #DDE1E8; }
.sess-head { display: flex; justify-content: space-between; align-items: baseline; gap: 6mm; }
.sess-head h3 { font-size: 13pt; }
.sess-meta { font-family: "Roboto Mono", monospace; font-size: 8pt; color: #7A849A; white-space: nowrap; }
.sess-burn { display: flex; gap: 6mm; margin: 2.5mm 0 3mm; }
.sess-burn span {
  font-family: "Roboto Mono", monospace; font-size: 8.4pt; color: #3B455A;
  background: #F4F6F9; padding: 1.4mm 3mm;
}
.sess-burn b { font-family: "Anton", sans-serif; font-weight: 400; font-size: 11pt; color: #0B1220; }
.blk { font-size: 9.6pt; line-height: 1.5; margin: 0 0 1.6mm; color: #3B455A; }
.blk b { color: #0B1220; font-weight: 600; }
.blk .mins { font-family: "Roboto Mono", monospace; font-size: 8.4pt; color: #7A849A; }
.weekband {
  display: flex; background: #0B1220; color: #FFFFFF; margin-top: 6mm;
}
.weekband div { flex: 1; padding: 4mm 4mm; border-right: 1px solid #2A3550; }
.weekband div:last-child { border-right: 0; }
.weekband .k {
  font-family: "Roboto Mono", monospace; font-size: 6.6pt; letter-spacing: .16em;
  text-transform: uppercase; color: #7A849A; display: block;
}
.weekband b { font-family: "Anton", sans-serif; font-weight: 400; font-size: 15pt; display: block; margin-top: 1mm; }

/* tables */
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; font-size: 9.4pt; padding: 2.6mm 2mm; border-bottom: 1px solid #EDEFF3; vertical-align: top; }
th { font-family: "Roboto Mono", monospace; font-size: 7pt; letter-spacing: .16em; text-transform: uppercase; color: #7A849A; border-bottom: 1px solid #C8CEDA; }
td.num, th.num { text-align: right; font-family: "Roboto Mono", monospace; white-space: nowrap; }
.day td { font-size: 9.6pt; }
.day .name { font-family: "Anton", sans-serif; font-size: 11pt; text-transform: uppercase; }
.two { column-count: 2; column-gap: 10mm; }
.two li { break-inside: avoid; }
.note { font-size: 8.6pt; color: #7A849A; line-height: 1.5; }
.dark .note { color: #9AA3B4; }
`;

function page(inner, { dark = false, num = null } = {}) {
  return `<section class="page${dark ? " dark" : ""}">${inner}
    ${num ? `<span class="pagenum">${num}</span><span class="brandfoot">${dark ? logoLight : logoDark}</span>` : ""}
  </section>`;
}

/* The front of every book.

   `band` is optional and carries the figures this book is about. They arrive
   already computed — nothing on a cover is ever typed by hand, for the same
   reason nothing inside one is. */
/* The front of every book.

   `accent` is the book's own colour, used at scale so the nine covers are
   telling apart as thumbnails rather than only as documents. `figure` is the
   one number worth reading from across a room — computed like every other
   figure here, never typed. */
/* Which photograph fronts which book.

   Chosen so the picture is the dish the book is actually about — a cover
   that shows food from a different chapter is the sort of thing readers
   notice and quietly distrust. Three books have no honest photograph
   available in photos/ (the workbook, the workout plans and the smoking
   guide), so they fall back to the colour-only treatment rather than being
   fronted by a plate of food that has nothing to do with them. */
const COVER_PHOTOS = {
  healthy:     "photos/spread.jpg",
  plan:        "photos/market.jpg",
  budget:      "photos/lentil-soup.jpg",
  bowls:       "photos/chickpeas.jpg",
  dinners:     "photos/souvlaki.jpg",
  fatloss:     "photos/salad-greek.jpg",
  gain:        "photos/chicken-grilled.jpg",
  oats:        "photos/sq/oats.jpg",
  eggs:        "photos/eggs.jpg",
  drinking:    "photos/taverna-tables.jpg",
  emotional:   "photos/bread.jpg",
  supplements: "photos/sq/almonds.jpg",
  produce:     "photos/market.jpg"
};

/* pathToFileURL rather than hand-rolling a file:// string: it escapes spaces
   and backslashes correctly, which a replace() on a Windows path does not. */
const photoUrl = rel => pathToFileURL(join(HERE, "..", rel)).href;

/* The front of every book.

   A photograph, full bleed, with the type in the lower third — the structure
   a printed cookbook uses, because the picture is what makes somebody want
   the food and no amount of typography substitutes for it.

   Everything on here is sized for the THUMBNAIL. The cover is printed once
   at A4 and seen a thousand times at about 200 pixels wide on the shop page,
   so the title is set enormous and anything that could not survive that
   reduction has been removed rather than made smaller. */
function cover({ eyebrow, title, titleEl, sub, price, accent, figure, figureLabel, photo }) {
  const c = accent || "#FFE14D";
  const bg = photo
    ? `<div class="cover-photo" style="background-image:url('${photoUrl(photo)}')"></div>
       <div class="cover-tint" style="background:${c}"></div>
       <div class="cover-scrim"></div>`
    : `<div class="cover-plain" style="background:${c}"></div>`;

  return page(`<div class="cover-wrap">${bg}</div>

  <div class="cover-inner">
    <div class="cover-top">
      <div class="mark">${logoLight}</div>
      <span class="cover-eyebrow" style="color:#FFFFFF">${esc(eyebrow)}</span>
    </div>

    ${figure ? `<div class="cover-chip" style="background:${c};color:#0B1220">
      <b>${esc(figure)}</b><span>${esc(figureLabel || "")}</span>
    </div>` : ""}

    <div class="cover-big">
      <div class="cover-rule" style="background:${c}"></div>
      <h1>${esc(title)}</h1>
      ${titleEl ? `<p class="cover-el" style="color:${c}">${esc(titleEl)}</p>` : ""}
      <p class="sub">${esc(sub)}</p>
    </div>

    <div class="cover-foot"><span>evzo · ευ ζω · to live well</span><span>${esc(price)}</span></div>
  </div>`, { dark: true });
}

function macroStrip(per) {
  return `<div class="macros">
    <div class="hi"><span class="k">Calories</span><b>${per.kcal}</b></div>
    <div><span class="k">Protein</span><b>${per.protein} g</b></div>
    <div><span class="k">Carbs</span><b>${per.carb} g</b></div>
    <div><span class="k">Fat</span><b>${per.fat} g</b></div>
    <div><span class="k">Protein score</span><b>${per.score}</b></div>
  </div>`;
}

function recipePage(r, num, opts = {}) {
  const ings = r.ingredients
    .filter(i => i.food !== "herbs")
    .map(i => `<li><span>${esc(food(i.food).label)}</span><span>${i.g} g</span></li>`).join("");
  /* The budget book prints what a serving costs and what its protein costs.
     Every other book leaves it off: a price is the one figure on the page
     that goes out of date, so it appears only where it is the point. */
  const money = opts.cost && r.eur ? `
    <div class="cost">
      <div><span class="label">Cost a serving</span><b>&euro;${r.eur.per.toFixed(2)}</b></div>
      <div><span class="label">Per gram of protein</span><b>${r.eur.perProtein}c</b></div>
      <div><span class="label">Whole pot</span><b>&euro;${r.eur.total.toFixed(2)}</b></div>
    </div>` : "";
  return page(`
    <span class="label">${esc(r.slot)} · serves ${r.servings}</span>
    <div class="recipe-head" style="margin-top:3mm">
      <div><h2>${esc(r.title)}</h2><div class="greek">${esc(r.greek)}</div></div>
      <div class="time">${esc(r.time)}</div>
    </div>
    ${macroStrip(r.per)}
    <p class="note" style="margin-top:-3mm">Per serving. ${r.servings > 1 ? "Divide the ingredients below by " + r.servings + " for one." : "Quantities are for one."}</p>
    ${money}
    <div class="cols" style="margin-top:5mm">
      <div>
        <span class="label">What goes in</span>
        <ul class="ing" style="margin-top:2.5mm">${ings}</ul>
        <p class="note" style="margin-top:3mm">Herbs, spices, salt and pepper as you like — too small to count.</p>
      </div>
      <div>
        <span class="label">How</span>
        <ol class="method" style="margin-top:2.5mm">${r.method.map(m => `<li>${esc(m)}</li>`).join("")}</ol>
      </div>
    </div>
    <div class="why"><span class="label">Why it is built this way</span><p style="margin-top:2mm">${esc(r.why)}</p></div>
    <div class="swaps"><span class="label">Swaps</span><ul style="margin:2.5mm 0 0;padding-left:5mm">${r.swaps.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
  `, { num });
}

/* ---- book one: the recipes ----------------------------------------------- */

function weekPages(week, startNum) {
  let n = startNum;
  const rows = week.days.map(d => {
    const t = dayTotals(d);
    return `<tr class="day">
      <td class="name">${esc(d.day.slice(0, 3))}</td>
      <td>${esc(BY_ID[d.breakfast].title)}</td>
      <td>${esc(BY_ID[d.lunch].title)}</td>
      <td>${esc(BY_ID[d.dinner].title)}</td>
      <td>${esc(BY_ID[d.snack].title)}</td>
      <td class="num">${t.kcal}</td>
      <td class="num">${t.protein} g</td>
    </tr>`;
  }).join("");

  const avg = week.days.reduce((a, d) => {
    const t = dayTotals(d); a.kcal += t.kcal; a.protein += t.protein; return a;
  }, { kcal: 0, protein: 0 });

  const grid = page(`
    <span class="label">Week ${week.n}</span>
    <h2 style="margin:3mm 0 4mm">${esc(week.theme)}</h2>
    <p class="lede">${esc(week.intro)}</p>
    <div class="rule"></div>
    <table style="margin-top:2mm">
      <thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Snack</th><th class="num">Kcal</th><th class="num">Protein</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="note" style="margin-top:5mm">Seven-day average: <b>${Math.round(avg.kcal / 7)} kcal</b> and <b>${Math.round(avg.protein / 7)} g of protein</b> a day, at one serving per meal. Scale the portions to the calorie range in your own guide — the structure does not change, only the amounts.</p>
  `, { num: n++ });

  const list = shoppingList(week);
  const half = Math.ceil(list.length / 2);
  const col = items => `<table><tbody>${items.map(i => `<tr><td>${esc(i.label)}</td><td class="num">${i.g >= 1000 ? (i.g / 1000).toFixed(1) + " kg" : i.g + " g"}</td></tr>`).join("")}</tbody></table>`;

  const shop = page(`
    <span class="label">Week ${week.n}</span>
    <h2 style="margin:3mm 0 4mm">The shopping list</h2>
    <p class="lede">Everything the week above actually uses, added up. Nothing on this list is bought for a single meal.</p>
    <div class="rule"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm">
      <div>${col(list.slice(0, half))}</div>
      <div>${col(list.slice(half))}</div>
    </div>
    <p class="note" style="margin-top:6mm">Quantities are for one person for seven days, rounded up to something you can actually buy. Cooking for two? Double it. Herbs, spices, salt, pepper and lemon zest are assumed to be in the cupboard.</p>
  `, { num: n++ });

  return { html: grid + "\n" + shop, next: n };
}

function bookPlan() {
  let n = 1;
  const intro = page(`
    <span class="label">How to use this</span>
    <h2 style="margin:3mm 0 6mm">Four weeks that do not repeat</h2>
    <p class="lede">Your guide gave you the numbers. This gives you twenty-eight days of structure to spend them on, so the plan does not die of boredom in week three.</p>
    <div class="rule"></div>
    <p>Each week has a grid and a shopping list. The grid names a breakfast, lunch, dinner and snack for every day; the list is what those meals actually need, added up, for one person.</p>
    <p>The calories shown are for one standard serving of each recipe. Your own target will be higher or lower — that is what the portion guidance in your guide is for. Move the amounts, keep the structure.</p>
    <div class="rule"></div>
    <h3>Swap anything inside its slot</h3>
    <p>Any dinner can replace any other dinner. The weeks are arranged so that nothing repeats twice inside seven days and no dinner carries over into the next week, which is the entire reason people abandon meal plans.</p>
    <h3>Two meals off a week is part of the design</h3>
    <p>Twenty-eight days has room for a Friday out. It does not have room for writing off the other twenty-six because of it.</p>
  `, { num: n++ });

  let body = "";
  for (const w of PLAN.weeks) {
    const out = weekPages(w, n);
    body += out.html + "\n";
    n = out.next;
  }

  const rules = page(`
    <span class="label">The whole thing in five lines</span>
    <h2 style="margin:3mm 0 6mm">If you lose this book</h2>
    ${PLAN.rules.map(r => `<h3 style="margin-top:5mm">${esc(r.t)}</h3><p>${esc(r.d)}</p>`).join("")}
    <div class="rule" style="margin-top:8mm"></div>
    <p class="note">18+. General information about food, not medical advice. Figures are calculated from standard published values and vary with brand, cut and cooking. Not suitable during pregnancy or breastfeeding, with a history of disordered eating, or alongside a medically prescribed diet.</p>
  `, { num: n++ });

  return [cover({
    eyebrow: "30-day meal variety bundle",
    title: "Four weeks that do not repeat",
    sub: "Twenty-eight days of structure, four shopping lists, and swaps for every slot — so the guide keeps working after the novelty wears off.",
    price: "EVZO"
  }), intro, body, rules].join("\n");
}

function bookWorkouts() {
  const W = FITNESS.WORKOUTS;
  const REF = FITNESS.REF_WEIGHTS;
  const plans = W.plans;
  let num = 1;

  const totals = Object.fromEntries(plans.map(pl => [pl.id, FITNESS.planTotals(pl)]));

  const contents = page(`
    <span class="label">Contents</span>
    <h2 style="margin:3mm 0 6mm">Five plans, and what a week of each costs</h2>
    <table>
      <thead><tr>
        <th>Plan</th><th>For</th><th class="num">Days</th><th class="num">Min/week</th>
        ${REF.map(kg => `<th class="num">${kg} kg</th>`).join("")}
        <th class="num">Page</th>
      </tr></thead>
      <tbody>${plans.map((pl, i) => {
        const t = totals[pl.id].week;
        return `<tr>
          <td>${esc(pl.name)}</td>
          <td>${esc(pl.level)}</td>
          <td class="num">${pl.daysPerWeek}</td>
          <td class="num">${t.minutes}</td>
          ${REF.map(kg => `<td class="num">${t.kcal[kg]}</td>`).join("")}
          <td class="num">${i + 3}</td>
        </tr>`;
      }).join("")}</tbody>
    </table>
    <div class="rule" style="margin-top:8mm"></div>
    <p class="note">Calories are an estimate of a whole week of sessions, computed for a person of that
    bodyweight. They are population averages and an individual can sit 20 to 30 per cent either side of
    them. Nothing here is a measurement of what you personally burned.</p>
  `, { num: num++ });

  const intro = page(`
    <span class="label">Before the plans</span>
    <h2 style="margin:3mm 0 6mm">Where these numbers come from</h2>
    <p class="lede">Every calorie figure in this book is calculated, not guessed — and it is still only
    an estimate. Both of those things are true and most fitness material tells you only the first.</p>
    <div class="rule"></div>

    <h3 style="margin-top:5mm">The equation</h3>
    <p>Each activity has a MET value: a multiple of what your body uses sitting still. Walking briskly is
    about 5, hard weight training about 6, skipping rope about 12. From that:</p>
    <p style="font-family:'Roboto Mono',monospace;font-size:10pt;background:#F4F6F9;padding:4mm 5mm">
      ${esc(W._method.formula)}
    </p>
    <p>The MET values come from the Compendium of Physical Activities, the standard published reference
    used in research. They are not invented here and they are not adjusted to make a session look better.</p>

    <h3 style="margin-top:5mm">Why it is still an estimate</h3>
    <p>${esc(W._method.accuracy)}</p>

    <h3 style="margin-top:5mm">What this means in practice</h3>
    <p><b>Do not eat the calories back.</b> If a session estimates 400 and you eat 400 to replace it, you
    have removed the session from the week. Treat training as something that builds and keeps muscle, and
    let food do the arithmetic of the deficit.</p>
    <p><b>Lifting burns less than people expect, and matters more.</b> An hour of hard weights costs
    roughly what a brisk hour of walking does. Its value is not the burn — it is that it keeps the muscle
    you would otherwise lose while eating less.</p>
    <p><b>Walking is the most underrated line in this book.</b> It does not make you hungry the way hard
    cardio does, it needs no recovery, and it can be done every day for years.</p>

    <div class="rule"></div>
    <p class="note">Speak to a doctor before starting a new training programme if you have a heart
    condition, high blood pressure, joint problems, are pregnant, or have been inactive for a long time.
    EVZO is not run by doctors, physiotherapists or qualified trainers.</p>
  `, { num: num++ });

  const planPages = plans.map(pl => {
    const t = totals[pl.id];
    const sessions = pl.sessions.map((sess, i) => {
      const st = t.sessions[i];
      return `<div class="sess">
        <div class="sess-head">
          <h3>${esc(sess.name)}</h3>
          <span class="sess-meta">${st.minutes} min · avg MET ${st.met}</span>
        </div>
        <div class="sess-burn">${REF.map(kg =>
          `<span>${kg} kg <b>${st.kcal[kg]}</b> kcal</span>`).join("")}</div>
        ${sess.blocks.map(b => {
          const a = FITNESS.activity(b.activity);
          return `<p class="blk"><b>${esc(a.label)}</b> <span class="mins">${b.minutes} min</span> — ${esc(b.note)}</p>`;
        }).join("")}
      </div>`;
    }).join("");

    return page(`
      <span class="label">${esc(pl.level)} · ${pl.daysPerWeek} days a week</span>
      <div class="recipe-head" style="margin-top:3mm">
        <div><h2>${esc(pl.name)}</h2><div class="greek">${esc(pl.greek)}</div></div>
      </div>
      <p class="lede" style="margin-top:4mm">${esc(pl.who)}</p>

      <div style="margin-top:6mm">${sessions}</div>

      <div class="weekband">
        <div><span class="k">A week</span><b>${t.week.minutes} min</b></div>
        ${REF.map(kg => `<div><span class="k">${kg} kg, a week</span><b>${t.week.kcal[kg]}</b></div>`).join("")}
      </div>

      <div class="why" style="margin-top:6mm">
        <span class="label">How to progress</span>
        <p style="margin-top:2mm">${esc(pl.progression)}</p>
      </div>
      <div class="swaps">
        <span class="label">Notes</span>
        <ul style="margin:2.5mm 0 0;padding-left:5mm">${pl.notes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
      <p class="note" style="margin-top:4mm">Calories estimated for that bodyweight, gross, from the MET
      values on page 2. Expect 20 to 30 per cent either way.</p>
    `, { num: num++ });
  });

  /* The reference table, so the book keeps working for the sport you actually
     play rather than only for the five plans written out here. */
  const acts = Object.values(W.activities).sort((a, b) => b.met - a.met);
  const reference = page(`
    <span class="label">Reference</span>
    <h2 style="margin:3mm 0 6mm">Thirty minutes of anything</h2>
    <p class="lede">Every activity in this book, and a few that are not, at half an hour each.</p>
    <table style="margin-top:6mm">
      <thead><tr><th>Activity</th><th class="num">MET</th>${REF.map(kg =>
        `<th class="num">${kg} kg</th>`).join("")}</tr></thead>
      <tbody>${acts.map(a => `<tr>
        <td>${esc(a.label)}</td>
        <td class="num">${a.met.toFixed(1)}</td>
        ${REF.map(kg => `<td class="num">${Math.round(FITNESS.burn(a.met, 30, kg))}</td>`).join("")}
      </tr>`).join("")}</tbody>
    </table>
    <div class="rule" style="margin-top:8mm"></div>
    <p class="note">Thirty minutes, gross calories, computed for each bodyweight. Gross means the total
    your body used, including what it would have used sitting on the sofa for those thirty minutes —
    which is roughly 1 MET, or about ${Math.round(FITNESS.burn(1, 30, 75))} kcal at 75 kg. Subtract that
    if you want the figure the session actually added.</p>
  `, { num: num++ });

  const end = page(`
    <span class="label">Last page</span>
    <h2 style="margin:3mm 0 6mm">Training decides what you keep</h2>
    <p class="lede">Food decides how much weight moves. Training decides how much of the weight you lose
    is fat rather than muscle, and how much of the weight you gain is muscle rather than fat.</p>
    <div class="rule"></div>
    <p>That is the honest division of labour, and it is why this book exists next to the recipe ones
    rather than instead of them. A perfect programme on top of a careless week of eating changes very
    little. A simple three-day plan on top of a week that hits its protein changes a great deal.</p>
    <p>Pick the plan that matches the days you will genuinely turn up, not the days you would like to.
    Three sessions done for a year beats five sessions done for a month, every time, and it is not close.</p>
    <div class="rule"></div>
    <p class="note">18+. General information about exercise, not medical advice. EVZO is not run by
    doctors, physiotherapists or qualified strength coaches. Stop and seek advice if anything hurts in a
    way that is not ordinary muscular fatigue. Not suitable during pregnancy, with a heart condition, or
    alongside a medically prescribed rehabilitation programme without clearance.</p>
  `, { num: num++ });

  const weekly = totals[plans[0].id].week;
  return [cover({
    eyebrow: "Training",
    title: "Five plans, no guesswork",
    titleEl: "Πέντε πλάνα, χωρίς μαντεψιές",
    sub: plans.length + " workout plans from three days a week to five, with the calories each session burns estimated from published MET values — and the margin of error printed next to them.",
    price: "@evzo_method",
    band: [
      ["Plans", String(plans.length)],
      ["Days a week", Math.min(...plans.map(x => x.daysPerWeek)) + "\\u2013" + Math.max(...plans.map(x => x.daysPerWeek))],
      ["Activities costed", String(Object.keys(W.activities).length)]
    ]
  }), contents, intro, ...planPages, reference, end, shopPage("workouts", num++)].join("\n");
}

function bookWorkbook() {
  const W = WORKBOOK;
  const H = W.habits;
  let num = 1;

  const intro = page(`
    <span class="label">Before day one</span>
    <h2 style="margin:3mm 0 6mm">Three habits, twenty-eight days</h2>
    <p class="lede">This is not a diet and it does not ask you to be perfect. It asks you to do
    three small things most days, write down what happened, and look at the pattern at the end of
    each week.</p>
    <div class="rule"></div>
    ${W.rules.map(r => `<h3 style="margin-top:5mm">${esc(r.t)}</h3><p>${esc(r.d)}</p>`).join("")}
    <div class="rule"></div>
    <p class="note">This book tracks what you did, not what you weigh. It makes no promise about
    how much weight you will lose or how fast, because it cannot know — that depends on your body,
    your food and your week, and anyone printing a number here would be guessing at your expense.</p>
  `, { num: num++ });

  const setup = page(`
    <span class="label">Set it up · five minutes, once</span>
    <h2 style="margin:3mm 0 6mm">Choose three. Only three.</h2>
    ${W.setup.map((x, i) => `<div class="setup-row">
      <span class="num">${i + 1}</span>
      <div><b style="font-size:11pt">${esc(x.t)}</b><p style="margin:1mm 0 0;font-size:9.6pt;color:#3B455A">${esc(x.d)}</p></div>
    </div>`).join("")}

    <span class="label" style="margin-top:8mm;display:block">Tick the three you are taking</span>
    <div style="margin-top:3mm">
      ${H.map(h => `<div class="habit-pick">
        <span class="box"></span>
        <div><b>${esc(h.label)}</b><p>${esc(h.why)}</p>
        <div class="blank"></div>
        <p class="note" style="margin:1.5mm 0 0;font-size:7.6pt">When, exactly \\u2014 write the moment it attaches to</p></div>
      </div>`).join("")}
    </div>
  `, { num: num++ });

  /* Four weeks. One tracking page each, one review page each. Seven rows to a
     page so a week is always visible at once — the point of a paper tracker is
     seeing the run of ticks without turning anything. */
  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const rows = [];
    for (let d = 0; d < 7; d++) {
      const dayNo = w * 7 + d + 1;
      rows.push(`<tr>
        <td class="day">Day ${dayNo}<small>${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][d]}</small></td>
        ${H.slice(0, 3).map(() => `<td class="tick"><span class="box"></span></td>`).join("")}
        <td class="write"></td>
      </tr>`);
    }

    weeks.push(page(`
      <div class="wb-head">
        <span class="wk">Week ${w + 1}</span>
        <span class="rng">Days ${w * 7 + 1}\\u2013${w * 7 + 7}</span>
      </div>

      <table class="wb">
        <thead><tr>
          <th class="d">Day</th>
          <th>Habit 1</th><th>Habit 2</th><th>Habit 3</th>
          <th class="note">What happened \\u2014 one line is enough</th>
        </tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>

      <div class="wb-foot">
        <span class="miss">Never miss twice. One day off is nothing; two in a row is how it ends.</span>
        <span class="miss">Weight (optional) <b>______</b></span>
      </div>

      <div style="margin-top:6mm">
        ${W.days.slice(w * 7, w * 7 + 7).map((d, i) =>
          `<p class="prompt" style="margin-bottom:1.6mm"><b>Day ${w * 7 + i + 1}.</b> ${esc(d)}</p>`).join("")}
      </div>
    `, { num: num++ }));

    weeks.push(page(`
      <span class="label">${esc(W.review.title)} ${w + 1}</span>
      <h2 style="margin:3mm 0 5mm">Look at what actually happened</h2>
      ${W.review.questions.map(q => `<div class="rev-q"><span class="q">${esc(q)}</span></div>`).join("")}
      <p class="note" style="margin-top:6mm">${esc(W.review.note)}</p>
    `, { num: num++ }));
  }

  const end = page(`
    <span class="label">Day 28</span>
    <h2 style="margin:3mm 0 6mm">What to do with four weeks of ticks</h2>
    <p class="lede">You now know something you did not know a month ago: which of these three
    habits actually fits your life. That is worth more than the month itself.</p>
    <div class="rule"></div>
    ${W.end.map(x => `<h3 style="margin-top:5mm">${esc(x.t)}</h3><p>${esc(x.d)}</p>`).join("")}
    <div class="rule"></div>
    <p class="note">18+. General information about food and habits, not medical advice. EVZO is not
    run by dietitians, nutritionists or doctors. Not suitable during pregnancy or breastfeeding, with
    a history of disordered eating, or alongside a medically prescribed diet.</p>
  `, { num: num++ });

  return [cover({
    eyebrow: "The 28-day workbook",
    title: "Three habits, twenty-eight days",
    titleEl: "\u03a4\u03c1\u03b5\u03b9\u03c2 \u03c3\u03c5\u03bd\u03ae\u03b8\u03b5\u03b9\u03b5\u03c2, \u03b5\u03b9\u03ba\u03bf\u03c3\u03b9\u03bf\u03ba\u03c4\u03ce \u03bc\u03ad\u03c1\u03b5\u03c2",
    sub: "A workbook to write in, not to read. Thirty seconds a day, four weekly reviews, and one honest look at which habits actually fit your life.",
    price: "@evzo_method",
    band: [
      ["Days", "28"],
      ["Habits", "3 of " + H.length],
      ["Weekly reviews", "4"]
    ]
  }), intro, setup, ...weeks, end, shopPage("workbook", num++)].join("\n");
}

function shopPage(self, num) {
  const others = SHOP.books.filter(b => b.id !== self);
  const price = SHOP.singlePriceDisplay;
  const link = CONFIG.shopUrl || CONFIG.links.instagram;

  return page(`
    <div class="mark">${logoLight}</div>
    <div style="margin-top:14mm">
      <span class="label yellow">The rest of the shelf</span>
      <h2 style="margin:3mm 0 5mm;font-size:30pt">Every other book,<br>${esc(price)} each</h2>
      <p class="lede" style="max-width:130mm">Same format as the one in your hands: every figure computed from the
      ingredient, nothing rounded up to look better, and a Greek name on every page.</p>
    </div>

    <div class="shoplist" style="margin-top:8mm">
      ${others.map(b => `<div class="shopitem">
        <div>
          <span class="label">${esc(b.eyebrow)}</span>
          <h3 style="margin:1.5mm 0 1.5mm">${esc(b.name)}</h3>
          <p class="note" style="margin:0;max-width:115mm">${esc(b.blurb)}</p>
        </div>
        <span class="shopprice">${esc(b.priceDisplay || price)}</span>
      </div>`).join("")}
    </div>

    <div class="shopcta">
      <div>
        <span class="label" style="color:#0B1220">${esc(SHOP.bundle.name)}</span>
        <div class="h" style="font-size:20pt;margin-top:1.5mm">${esc(SHOP.bundle.priceDisplay)} for all seven</div>
        <p class="note" style="color:#3B455A;margin:1.5mm 0 0">Instead of ${esc(price)} each, bought separately.</p>
      </div>
      <a class="btn" href="${esc(link)}">Shop all ebooks</a>
    </div>

    <p class="note" style="position:absolute;bottom:20mm;left:17mm;right:17mm">
      Tap the button, or find every book at ${esc(link)}. Delivered as a PDF by email.
    </p>
  `, { dark: true, num });
}

function seriesBook(def) {
  const list = def.sort ? [...inBook(def.book)].sort(def.sort) : inBook(def.book);
  if (!list.length) throw new Error("No recipes tagged for book: " + def.book);
  let n = 1;

  /* Any claim about the contents is written as a token and filled from the
     computed figures, so the copy cannot drift away from the arithmetic. */
  const scores = list.map(r => Number(r.per.score));
  const kcals = list.map(r => r.per.kcal);
  const proteins = list.map(r => r.per.protein);
  const costs = list.map(r => r.eur && r.eur.per).filter(v => typeof v === "number");
  const eur = v => "\u20ac" + v.toFixed(2);
  const stat = {
    count: list.length,
    minCost: costs.length ? eur(Math.min(...costs)) : "",
    maxCost: costs.length ? eur(Math.max(...costs)) : "",
    minScore: Math.floor(Math.min(...scores)),
    minKcal: Math.min(...kcals),
    maxKcal: Math.max(...kcals),
    minProtein: Math.min(...proteins),
    over10: scores.filter(x => x >= 10).length
  };
  // Handed to the website so the shop cards cannot drift from the books.
  SHOP_STATS[def.book] = {
    count: stat.count,
    minKcal: stat.minKcal, maxKcal: stat.maxKcal,
    minProtein: stat.minProtein,
    avgProtein: Math.round(proteins.reduce((a, b) => a + b, 0) / proteins.length)
  };

  const fill = t => String(t).replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in stat)) throw new Error("Unknown token {{" + k + "}} in " + def.book);
    return stat[k];
  });

  const contents = page(`
    <span class="label">Contents</span>
    <h2 style="margin:3mm 0 6mm">${esc(fill(def.contentsTitle))}</h2>
    <table>
      <thead><tr><th>${esc(def.col1)}</th><th class="num">Kcal</th><th class="num">Protein</th>${def.cost ? '<th class="num">Cost</th><th class="num">c/g&nbsp;pro</th>' : '<th class="num">Carbs</th><th class="num">Fat</th>'}<th class="num">Score</th><th class="num">Page</th></tr></thead>
      <tbody>${list.map((r, i) => `<tr>
        <td>${esc(r.title)}</td>
        <td class="num">${r.per.kcal}</td><td class="num">${r.per.protein} g</td>
        ${def.cost
          ? `<td class="num">&euro;${r.eur.per.toFixed(2)}</td><td class="num">${r.eur.perProtein}c</td>`
          : `<td class="num">${r.per.carb} g</td><td class="num">${r.per.fat} g</td>`}
        <td class="num">${r.per.score}</td><td class="num">${i + 3}</td>
      </tr>`).join("")}</tbody>
    </table>
    <div class="rule" style="margin-top:8mm"></div>
    <p class="note">Per serving, calculated from standard published values for every ingredient. Figures vary with brand, cut and cooking &mdash; treat them as close, not exact.</p>
  `, { num: n++ });

  const intro = page(`
    <span class="label">${esc(def.introLabel)}</span>
    <h2 style="margin:3mm 0 6mm">${esc(def.introTitle)}</h2>
    <p class="lede">${esc(fill(def.introLede))}</p>
    <div class="rule"></div>
    ${def.introBody.map(b => `<h3 style="margin-top:5mm">${esc(fill(b.t))}</h3><p>${esc(fill(b.d))}</p>`).join("")}
    <div class="rule"></div>
    <p class="note">The protein score printed on every recipe is grams of protein per 100 calories. Above about 15 a meal fills you for what it costs; below about 5 it does not.</p>
  `, { num: n++ });

  const pages = list.map(r => recipePage(r, n++, { cost: def.cost }));

  const end = page(`
    <span class="label">Last page</span>
    <h2 style="margin:3mm 0 6mm">${esc(def.endTitle)}</h2>
    <p class="lede">${esc(fill(def.endLede))}</p>
    <div class="rule"></div>
    ${def.endBody.map(t => `<p>${esc(fill(t))}</p>`).join("")}
    <div class="rule"></div>
    <p class="note">18+. General information about food, not medical advice. Not suitable during pregnancy or breastfeeding, with a history of disordered eating, or alongside a medically prescribed diet. Speak to a registered dietitian or your doctor if any of those apply to you.</p>
  `, { num: n++ });

  return [cover({
            eyebrow: def.eyebrow,
            title: def.coverTitle,
            titleEl: def.coverTitleEl,
            sub: fill(def.coverSub),
            price: "@evzo_method",
            accent: def.accent,
            figure: String(stat.count),
            figureLabel: "Recipes",
            photo: COVER_PHOTOS[def.book]
          }),
          contents, intro, ...pages, end, shopPage(def.book, n++)].join("\n");
}

function bookRecipes() {
  const bySlot = s => RECIPES.filter(r => r.slot === s).map(r => BY_ID[r.id]);
  const all = [...bySlot("breakfast"), ...bySlot("lunch"), ...bySlot("dinner"), ...bySlot("snack")];
  let n = 1;

  const contents = page(`
    <span class="label">Contents</span>
    <h2 style="margin:3mm 0 6mm">What is in here</h2>
    <table>
      <thead><tr><th>Recipe</th><th>When</th><th class="num">Kcal</th><th class="num">Protein</th><th class="num">Score</th><th class="num">Page</th></tr></thead>
      <tbody>${all.map((r, i) => `<tr>
        <td>${esc(r.title)}</td><td>${esc(r.slot)}</td>
        <td class="num">${r.per.kcal}</td><td class="num">${r.per.protein} g</td>
        <td class="num">${r.per.score}</td><td class="num">${i + 3}</td>
      </tr>`).join("")}</tbody>
    </table>
    <div class="rule" style="margin-top:8mm"></div>
    <p class="note">Figures are per serving, calculated from standard published values for each ingredient. They will vary with brand, cut and how long you cook something. Treat them as close, not exact.</p>
  `, { num: n++ });

  const howto = page(`
    <span class="label">Before you cook anything</span>
    <h2 style="margin:3mm 0 6mm">The three rules that make these work</h2>
    <p class="lede">Every recipe here is ordinary food. What makes them add up is not an ingredient — it is where the scale gets used and where it does not.</p>
    <div class="rule"></div>
    <h3>1. Weigh the oil. Always.</h3>
    <p>Olive oil is 884 calories per 100 g. A level tablespoon is 119 calories; a normal pour into a pan is about 357. That single habit is worth more than every substitution in this book put together, and it changes nothing about how the food tastes.</p>
    <h3>2. Weigh anything dry, once.</h3>
    <p>Rice, pasta, oats, bulgur. Weigh them for a fortnight and your hand learns what 60 g looks like. After that you can stop.</p>
    <h3>3. Never weigh vegetables.</h3>
    <p>If you are weighing the courgette you have missed the point, and you will quit by week three.</p>
    <div class="rule"></div>
    <h3>The protein score, and why it is on every page</h3>
    <p>Protein score is grams of protein divided by calories, times one hundred: how much protein a food gives you for what it costs. Above about 15 a meal fills you for its calories. Below about 5 it does not, whatever the label says.</p>
    <p>It is on every recipe in this book so you can see, at a glance, which meals are doing the work. Nothing here is banned and nothing is a "treat" — some meals simply hold you longer than others, and now you can tell which.</p>
  `, { num: n++ });

  const pages = all.map(r => recipePage(r, n++));

  const end = page(`
    <span class="label">One last page</span>
    <h2 style="margin:3mm 0 6mm">If you only remember one thing</h2>
    <p class="lede">Decide the protein first. Everything else on the plate is detail.</p>
    <div class="rule"></div>
    <p>These recipes are not a diet. They are ${RECIPES.length} ordinary Mediterranean meals with the portions decided in advance, so that dinner stops being a series of small negotiations you lose when you are tired.</p>
    <p>Cook the same four for a fortnight. You are not supposed to cook all ${RECIPES.length} in a week — variety is what you reach for when the basics are already automatic.</p>
    <div class="rule"></div>
    <p class="note">18+. General information about food, not medical advice. Not suitable during pregnancy or breastfeeding, with a history of disordered eating, or alongside a medically prescribed diet. Speak to a registered dietitian or your doctor if any of those apply to you.</p>
  `, { num: n++ });

  const rList = RECIPES.map(r => BY_ID[r.id]);
  const rProt = rList.map(r => r.per.protein);
  return [cover({
    eyebrow: "Recipe collection", photo: COVER_PHOTOS.healthy,
    accent: "#FFE14D", figure: String(rList.length), figureLabel: "Recipes",
    title: "Real food, weighed once",
    titleEl: "Αληθινό φαγητό, ζυγισμένο μία φορά",
    sub: RECIPES.length + " Mediterranean meals and snacks with the portions already decided — and the one number that tells you which ones will hold you.",
    price: "@evzo_method",
  }), contents, howto, ...pages, end, shopPage("healthy", n++)].join("\n");
}

const SERIES = [
  {
    book: "budget", accent: "#8FD14F", cost: true,
    name: "EVZO-Budget-Meals", file: "EVZO \u2014 Budget Meals",
    eyebrow: "Eating well on very little", coverTitle: "Cheap is a number, not a feeling",
    coverTitleEl: "\u03a4\u03bf \u03c6\u03b8\u03b7\u03bd\u03cc \u03b5\u03af\u03bd\u03b1\u03b9 \u03bd\u03bf\u03cd\u03bc\u03b5\u03c1\u03bf, \u03cc\u03c7\u03b9 \u03b1\u03af\u03c3\u03b8\u03b7\u03c3\u03b7",
    coverSub: "{{count}} Greek and Cypriot dinners, lunches and breakfasts with the cost of every serving printed on the page \u2014 from {{minCost}} to {{maxCost}} a plate.",
    contentsTitle: "Every plate, and what it costs", col1: "Meal",
    introLabel: "How to read this book", introTitle: "The number nobody prints",
    introLede: "Every recipe book tells you the calories. None of them tell you the price, which is the figure that actually decides what you cook on the 28th of the month.",
    introBody: [
      { t: "Cost a serving, and cost per gram of protein", d: "Both are on every page. The second one matters more: a plate of pasta is cheap and gives you almost nothing back, and a tin of sardines looks dearer until you divide by the protein." },
      { t: "Where the prices come from", d: "Own-brand, mid-range Cyprus and Greece supermarket prices as of September 2026, adjusted for what you actually eat \u2014 meat is priced cooked, tins drained, pulses dry. Everything is rounded to five cents, because pretending to be exact about a tomato would be a lie." },
      { t: "They will not match your receipt exactly", d: "Nor should they. Prices move with the season and the shop. Use them to compare recipes against each other, which is what they are actually for, and expect your own total to land within twenty per cent." },
      { t: "Cheap food is food you will cook twice", d: "Every recipe in here reheats, and most of them are better on the second day. A cheap meal you throw away on Thursday cost more than an expensive one you ate." }
    ],
    endTitle: "The five things that do the work",

    endLede: "You do not need {{count}} recipes to eat well on very little. You need five habits, and the recipes are only there to make them concrete.",
    endBody: [
      "Buy pulses dry, not tinned, whenever you can plan a day ahead — it is roughly half the price for the same food. Buy frozen vegetables without embarrassment: they are picked riper, cost a third, and do not rot in the drawer. Buy the cheap cut, because thigh and mince survive being reheated in a way breast does not.",
      "Cook once, eat twice. Every pot in this book is written for four servings or reheats cleanly, because the real cost of a meal includes the ones you did not eat.",
      "And put protein in breakfast. The single most expensive habit most people have is buying lunch at eleven because breakfast was a coffee — the forty-cent jar of oats on the last page is the cheapest thing in this book and it saves the most money."
    ]
  },
  {
    book: "bowls", accent: "#FFE14D", name: "EVZO-Protein-Bowls", file: "EVZO — High-Protein Bowls",
    eyebrow: "High-protein bowls", coverTitle: "One bowl, thirty grams", coverTitleEl: "Ένα bowl, τριάντα γραμμάρια",
    coverSub: "{{count}} Mediterranean bowls built around the protein first — assembled in minutes, most of them in one pan.",
    contentsTitle: "Every bowl, by the numbers", col1: "Bowl",
    introLabel: "The method", introTitle: "How a bowl is built",
    introLede: "A bowl is not a recipe, it is a formula. Once you know the formula you stop needing recipes at all.",
    introBody: [
      { t: "1. Protein first, and weigh it", d: "One hundred and fifty grams of chicken, fish or prawns, or a full tin of pulses. This is the part that is not negotiable, and it is the part people leave out." },
      { t: "2. One weighed carbohydrate", d: "Fifty to sixty grams dry of rice, quinoa or bulgur, or 180 g of potato. Weigh it for a fortnight, then trust your eye." },
      { t: "3. Vegetables, unweighed, as many as you like", d: "Raw, roasted or charred. This is what makes a bowl look like a bowl, and it is effectively free." },
      { t: "4. A sauce that is not oil", d: "Yoghurt with lemon and garlic does what mayonnaise does for a fifth of the calories. Where oil is used it is measured: a level tablespoon is 119 calories, a pour is about 350." }
    ],
    endTitle: "The formula, one line", endLede: "Protein weighed, carbohydrate weighed, vegetables free, sauce from yoghurt.",
    endBody: [
      "Every bowl in this book is that sentence with different ingredients. Cook four of them until you stop reading the page, and you will build a bowl out of whatever is in the fridge without looking anything up.",
      "That is the real goal. Not twelve recipes — one habit."
    ]
  },
  {
    book: "dinners", accent: "#FF8A4C", name: "EVZO-Protein-Dinners", file: "EVZO — High-Protein Dinners",
    eyebrow: "High-protein dinners", coverTitle: "Dinners that hold", coverTitleEl: "Βραδινά που σε κρατούν",
    coverSub: "{{count}} Greek and Cypriot dinners rebuilt so the protein is the point — including the ones you were told to give up.",
    contentsTitle: "Every dinner, by the numbers", col1: "Dinner",
    introLabel: "Before you cook", introTitle: "Nothing here is banned",
    introLede: "Moussaka, pastitsio, souvla, Sunday lamb. The dishes were never the problem — the oil, the portion and the second helping were.",
    introBody: [
      { t: "Roast what you would fry", d: "Fried aubergine absorbs roughly 200 g of oil per tray. Roasted with 30 g brushed on, it tastes the same and costs about 1,500 calories less across a moussaka." },
      { t: "Yoghurt instead of bechamel", d: "Strained yoghurt whisked with egg sets the same golden way over a bake, without the butter, flour and full-fat milk." },
      { t: "Lean cuts, same dish", d: "Pork tenderloin is 143 calories per 100 g; pork belly is 518. Chicken thigh with the skin off loses about 40 calories a piece and nothing else." },
      { t: "Serve in the kitchen", d: "Plate it away from the table and the second helping becomes a decision rather than a reflex." }
    ],
    endTitle: "If you cook three of these", endLede: "You do not need twelve dinners. You need three you can make without thinking.",
    endBody: [
      "Pick the three your household will actually eat, cook them until the weighing is automatic, and keep the rest for the weeks you get bored.",
      "Every number here is per serving. Eat two servings and you have eaten two servings — that is not the recipe failing, it is arithmetic."
    ]
  },
  {
    book: "fatloss", accent: "#4CC9A7", name: "EVZO-Fat-Loss-Dishes", file: "EVZO — Fat Loss Dishes",
    eyebrow: "Fat loss dishes", coverTitle: "Full plates, fewer calories", coverTitleEl: "Γεμάτα πιάτα, λιγότερες θερμίδες",
    coverSub: "{{count}} meals built for volume — from {{minKcal}} to {{maxKcal}} calories a serving, every one of them a full plate with the figures printed on the page.",
    contentsTitle: "Sorted by calories, lowest first", col1: "Dish",
    sort: (a, b) => a.per.kcal - b.per.kcal,
    introLabel: "Why these work", introTitle: "Hunger is what ends diets",
    introLede: "Not willpower, not metabolism, not carbohydrates. People stop because they are hungry, and they are hungry because the plate got smaller.",
    introBody: [
      { t: "Volume first", d: "Cabbage, courgette, cauliflower, watermelon, lettuce — between 15 and 40 calories per 100 g. You can put 400 g of them on a plate for the cost of one biscuit." },
      { t: "Protein second", d: "Every dish here carries at least {{minProtein}} g of protein, and {{over10}} of the {{count}} score 10 or better — that is 10 g of protein for every 100 calories. Protein is the one macronutrient that reliably reduces how much you eat later." },
      { t: "Fat is where the calories hide", d: "Fat is 9 calories a gram against 4 for protein and carbohydrate. That is why the oil is weighed in every recipe here and why the dressings are built on yoghurt." },
      { t: "Nothing is banned", d: "There is steak in this book, and pasta, and bread. A deficit is a weekly number, not a list of forbidden foods." }
    ],
    endTitle: "The number that actually matters", endLede: "One kilo of body fat is about 7,700 calories. A 500-a-day gap is half a kilo a week, and that is the honest rate.",
    endBody: [
      "Week one shows more than that, because most of it is water. Week three shows about 0.6 kg, and that is the real number. People quit in week three because they compare it to week one.",
      "Weigh yourself once a week, same day, same time, before eating. Daily weighing measures salt and sleep, not fat."
    ]
  },
  {
    book: "gain", accent: "#7FA8FF", name: "EVZO-Weight-Gain", file: "EVZO — Weight Gain",
    eyebrow: "Weight gain", coverTitle: "Eating more, on purpose", coverTitleEl: "Τρως περισσότερο, επίτηδες",
    coverSub: "{{count}} calorie-dense meals and shakes for people who genuinely struggle to gain — built on real food, not on eating badly.",
    contentsTitle: "Sorted by calories, highest first", col1: "Meal",
    sort: (a, b) => b.per.kcal - a.per.kcal,
    introLabel: "The honest version", introTitle: "There is no secret",
    introLede: "If you are not gaining, you are not eating enough. That is the whole of it — and it is not what anybody wants to hear, because eating more is genuinely hard when food fills you up.",
    introBody: [
      { t: "The problem is volume, not metabolism", d: "A fast metabolism is real but small. Appetite is the big one: most people who cannot gain simply stop when they are full, and full arrives early." },
      { t: "Drink some of it", d: "Liquid calories bypass the fullness solid food creates. One oat and peanut butter shake alongside a meal is a thousand calories you did not have to chew through." },
      { t: "Add, do not replace", d: "Oil on the rice, avocado in the box, thighs instead of breast, whole milk instead of semi. Each is 100 to 300 calories with no extra bulk." },
      { t: "Aim for 300 to 500 calories over maintenance", d: "That is roughly 0.25 to 0.5 kg a week. Push it harder and most of what you add is fat — muscle cannot be forced to grow faster by eating more." }
    ],
    endTitle: "Lift, or you are just eating", endLede: "A surplus decides how much weight you gain. Training decides how much of it is muscle.",
    endBody: [
      "Three sessions a week of heavy, simple lifts, with 1.6 to 2.2 g of protein per kilo of bodyweight, is the whole programme. Without it, a surplus is just a surplus.",
      "Weigh weekly, same conditions. If the scale has not moved in a fortnight, add 200 calories a day and check again in another two weeks."
    ]
  },
  {
    book: "oats", accent: "#F2C14E", name: "EVZO-Oat-Recipes", file: "EVZO \u2014 Oat Recipes",
    eyebrow: "Oats", coverTitle: "Oats, fourteen ways", coverTitleEl: "Βρώμη, δεκατέσσερις τρόποι",
    coverSub: "{{count}} things to do with a bag of oats that are not porridge \u2014 from {{minKcal}} to {{maxKcal}} calories, every figure on the page.",
    contentsTitle: "Every bowl, jar and bar", col1: "Recipe",
    introLabel: "Why oats", introTitle: "The cheapest breakfast that works",
    introLede: "A kilo of oats costs about a euro fifty and makes sixteen breakfasts. Nothing else in the shop does that, which is why this book exists.",
    introBody: [
      { t: "Weigh them once", d: "Sixty grams of dry oats is a normal portion and looks like almost nothing in the bag. Poured by eye most people land closer to a hundred, which is 379 calories a hundred grams before anything goes on top." },
      { t: "Oats alone are not enough protein", d: "Sixty grams carries under 8 g. That is why every recipe here pairs them with yoghurt, milk, eggs, powder or seeds \u2014 the oats are the base, not the meal." },
      { t: "The toppings are where it goes wrong", d: "Honey, peanut butter, granola and dried fruit are all worth having and all worth weighing. A poured spoon of peanut butter is routinely double a measured one." },
      { t: "Savoury is half this book", d: "Oats cooked in salted water behave like polenta and carry eggs, feta and halloumi. It is the version that keeps people eating them in July." }
    ],
    endTitle: "One bag, sixteen breakfasts", endLede: "The point of this book is not fourteen recipes. It is never having to decide what breakfast is again.",
    endBody: [
      "Pick three: one jar you make at night, one hot bowl, one savoury. Cook them until you stop reading the page. Everything else here is for the weeks you get bored of those three.",
      "Every figure is per serving and computed from the ingredient list beside it. Change a quantity and the number changes \u2014 that is the honest version of a recipe book."
    ]
  },
  {
    book: "eggs", accent: "#FFD166", name: "EVZO-Egg-Recipes", file: "EVZO \u2014 Egg Recipes",
    eyebrow: "Eggs", coverTitle: "The cheapest protein there is", coverTitleEl: "Η φθηνότερη πρωτεΐνη που υπάρχει",
    coverSub: "{{count}} egg dishes, from strapatsada to a lunch box that needs no reheating, and six eggs that feed four.",
    contentsTitle: "Every dish, by the numbers", col1: "Dish",
    introLabel: "Before you cook", introTitle: "Stop throwing away the yolk",
    introLede: "One medium egg is about 79 calories and 7 g of protein, and most of the vitamins are in the part people bin.",
    introBody: [
      { t: "Whole eggs, almost always", d: "The yolk carries the choline, the B12 and the fat that makes an egg taste like an egg. Whites have their place in a hard deficit \u2014 there is one page for that here \u2014 but they are the exception." },
      { t: "The cholesterol thing was wrong", d: "Dietary cholesterol has a small effect on blood cholesterol for most people. The reason a fry-up is heavy is the oil, the bread and the sausage, not the eggs." },
      { t: "Low heat, always", d: "Every ruined egg in history was cooked too hot. Scrambled, omelette, poached \u2014 lower than you think, and off the heat while they still look slightly underdone." },
      { t: "The pan is where the calories arrive", d: "Olive oil is 884 calories per 100 g. A level tablespoon is around 119; a pour is closer to 350. Every recipe here weighs it." }
    ],
    endTitle: "Six eggs is a dinner for four", endLede: "The frittata in this book feeds four people out of six eggs, a potato and whatever was in the drawer.",
    endBody: [
      "That is the argument for eggs in one sentence. Nothing else in the fridge turns leftovers into a meal that cheaply, that fast, with that much protein.",
      "Cook three of these until you do not need the page, and breakfast, lunch and the bad days are all covered."
    ]
  }
];

/* ---- the prose books -----------------------------------------------------
   Not every guide is a set of recipes. These are read front to back once and
   then used: a quit plan, a supplement audit, a shopping eye. They all share
   one shape — cover, contents, an honest "before you start" page, numbered
   chapters, a last page — so a JSON file is the whole of a new one.

   The safety page is NOT optional and NOT a disclaimer bolted on at the end.
   For the two books about stopping something the body has adapted to, it is
   the second page anyone reads, because with alcohol in particular the wrong
   advice is genuinely dangerous. */
/* The prose guides are shorter than the recipe collections and priced lower.
   The figure comes from the same catalogue the website renders from, so a
   cover and a shop card can never disagree. */
function guidePrice(id) {
  const b = SHOP.books.find(x => x.id === id);
  return (b && b.priceDisplay) || SHOP.singlePriceDisplay;
}

function bookGuide(def) {
  let n = 1;

  const contents = page(`
    <span class="label">Contents</span>
    <h2 style="margin:3mm 0 6mm">${esc(def.contentsTitle)}</h2>
    <table>
      <thead><tr><th>Chapter</th><th>What it covers</th><th class="num">Page</th></tr></thead>
      <tbody>${def.chapters.map((c, i) => `<tr>
        <td>${esc(c.title)}</td><td>${esc(c.summary)}</td>
        <td class="num">${i + 4}</td>
      </tr>`).join("")}</tbody>
    </table>
    <div class="rule" style="margin-top:8mm"></div>
    <p class="note">${esc(def.contentsNote)}</p>
  `, { num: n++ });

  /* Read this before anything else. */
  const safety = page(`
    <span class="label">${esc(def.safetyLabel)}</span>
    <h2 style="margin:3mm 0 6mm">${esc(def.safetyTitle)}</h2>
    <p class="lede">${esc(def.safetyLede)}</p>
    <div class="rule"></div>
    ${def.safety.map(b => `<h3 style="margin-top:5mm">${esc(b.t)}</h3><p>${esc(b.d)}</p>`).join("")}
    <div class="rule"></div>
    <p class="note">${esc(def.safetyNote)}</p>
  `, { num: n++ });

  const intro = page(`
    <span class="label">${esc(def.introLabel)}</span>
    <h2 style="margin:3mm 0 6mm">${esc(def.introTitle)}</h2>
    <p class="lede">${esc(def.introLede)}</p>
    <div class="rule"></div>
    ${def.introBody.map(t => `<p>${esc(t)}</p>`).join("")}
  `, { num: n++ });

  const chapters = def.chapters.map((c, i) => page(`
    <span class="label">Chapter ${String(i + 1).padStart(2, "0")}</span>
    <h2 style="margin:3mm 0 4mm">${esc(c.title)}</h2>
    <p class="lede">${esc(c.lede)}</p>
    <div class="rule"></div>
    ${(c.body || []).map(b =>
      `<h3 style="margin-top:5mm">${esc(b.t)}</h3><p>${esc(b.d)}</p>`).join("")}
    ${c.list ? `<div class="why"><span class="label">${esc(c.list.label)}</span>
      <ul style="margin:2.5mm 0 0;padding-left:5mm">${c.list.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${c.action ? `<div class="swaps"><span class="label">Do this today</span>
      <p style="margin-top:2mm">${esc(c.action)}</p></div>` : ""}
  `, { num: n++ }));

  const end = page(`
    <span class="label">Last page</span>
    <h2 style="margin:3mm 0 6mm">${esc(def.endTitle)}</h2>
    <p class="lede">${esc(def.endLede)}</p>
    <div class="rule"></div>
    ${def.endBody.map(t => `<p>${esc(t)}</p>`).join("")}
    <div class="rule"></div>
    <p class="note">${esc(def.endNote)}</p>
  `, { num: n++ });

  return [cover({
    eyebrow: def.eyebrow, title: def.coverTitle, titleEl: def.coverTitleEl,
    sub: def.coverSub, price: guidePrice(def.book), accent: def.accent,
    figure: String(def.chapters.length), figureLabel: "chapters",
    photo: COVER_PHOTOS[def.book]
  }), contents, safety, intro, ...chapters, end, shopPage(def.book, n++)].join("\n");
}

const GUIDES = JSON.parse(readFileSync(join(HERE, "guides.json"), "utf8")).guides;

function html(title, body) {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Commissioner:wght@400;500;600;800&family=Roboto+Mono:wght@400;500&display=swap">
<style>${CSS}</style>
${body}
</html>`;
}

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "ignore" });
    p.on("error", rej);
    p.on("exit", code => (code === 0 ? res() : rej(new Error(cmd + " exited " + code))));
  });
}

async function toPdf(name, title, body) {
  const tmpDir = join(HERE, ".tmp");
  mkdirSync(tmpDir, { recursive: true });
  const tmpFile = join(tmpDir, name + ".html");
  writeFileSync(tmpFile, html(title, body), "utf8");
  const out = join(HERE, name + ".pdf");
  await run(CHROME, [
    "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
    "--virtual-time-budget=15000",
    "--print-to-pdf=" + out,
    pathToFileURL(tmpFile).href
  ]);
  return out;
}

const books = [
  { name: "EVZO-Healthy-Recipes", title: "EVZO — Healthy Recipes", body: bookRecipes() },
  { name: "EVZO-30-Day-Meal-Variety", title: "EVZO — 30-Day Meal Variety Bundle", body: bookPlan() },
  { name: "EVZO-Workout-Plans", title: "EVZO — Workout Plans", body: bookWorkouts() },
  { name: "EVZO-Workbook", title: "EVZO — The 28-Day Workbook", body: bookWorkbook() },
  ...SERIES.map(def => ({ name: def.name, title: def.file, body: seriesBook(def) })),
  ...GUIDES.map(def => ({ name: def.name, title: def.file, body: bookGuide(def) }))
];

/* Where the finished PDFs are copied for the owner. Desktop/EVZO/Books, not
   the Desktop itself — ten loose files that reappear on every build is not a
   place anyone can find anything. */
const DESKTOP_OUT = join(
  process.env.USERPROFILE || process.env.HOME || ".", "Desktop", "EVZO", "Books"
);
mkdirSync(DESKTOP_OUT, { recursive: true });

for (const b of books) {
  const out = await toPdf(b.name, b.title, b.body);
  copyFileSync(out, join(DESKTOP_OUT, b.name + ".pdf"));
  console.log("wrote " + out);
}
// EVZO_KEEP_HTML=1 leaves the intermediate HTML in ebooks/.tmp, which is how
// you proof a page in a browser without opening a PDF viewer.
/* The starter collection is not a series book, so its figures are collected
   here rather than inside seriesBook(). */
{
  const list = RECIPES.map(r => BY_ID[r.id]);
  const proteins = list.map(r => r.per.protein);
  SHOP_STATS.healthy = {
    count: list.length,
    minKcal: Math.min(...list.map(r => r.per.kcal)),
    maxKcal: Math.max(...list.map(r => r.per.kcal)),
    minProtein: Math.min(...proteins),
    avgProtein: Math.round(proteins.reduce((a, b) => a + b, 0) / proteins.length)
  };
}

/* The training book counts plans, not recipes, so it carries its own shape.
   `kind` is what the shop reads to decide which stat line to print. */
{
  const W = FITNESS.WORKOUTS;
  const weeks = W.plans.map(pl => FITNESS.planTotals(pl).week);
  SHOP_STATS.workouts = {
    kind: "training",
    plans: W.plans.length,
    minDays: Math.min(...W.plans.map(pl => pl.daysPerWeek)),
    maxDays: Math.max(...W.plans.map(pl => pl.daysPerWeek)),
    activities: Object.keys(W.activities).length,
    minWeeklyMinutes: Math.min(...weeks.map(w => w.minutes)),
    maxWeeklyMinutes: Math.max(...weeks.map(w => w.minutes))
  };
}

/* The workbook counts days and habits, not recipes. */
SHOP_STATS.workbook = {
  kind: "workbook",
  days: 28,
  habits: WORKBOOK.habits.length,
  reviews: 4
};

/* The shop page reads this rather than carrying its own copy of the numbers. */
writeFileSync(
  join(HERE, "..", "site", "shop-data.json"),
  JSON.stringify({
    _note: "Generated by ebooks/build.mjs. Do not edit by hand — rerun the build.",
    generated: new Date().toISOString().slice(0, 10),
    books: SHOP_STATS,
    /* The home page's stats band. Every one of these is a count of something
       that exists in this repository, not a marketing figure. */
    totals: {
      books: Object.keys(SHOP_STATS).length,
      recipes: Object.values(SHOP_STATS).reduce((t, b) => t + (b.count || 0), 0),
      ingredients: Object.keys(FOODS).filter(k => !k.startsWith("_")).length,
      trainingPlans: SHOP_STATS.workouts ? SHOP_STATS.workouts.plans : 0,
      planDays: 28
    }
  }, null, 2) + "\n"
);
console.log("wrote site/shop-data.json");

if (!process.env.EVZO_KEEP_HTML) rmSync(join(HERE, ".tmp"), { recursive: true, force: true });

// A quick sanity line so a bad number in foods.json is visible immediately.
console.log("\nrecipes: " + ALL_RECIPES.length);
for (const r of ALL_RECIPES) {
  const p = BY_ID[r.id].per;
  console.log(String(p.kcal).padStart(5) + " kcal  " + String(p.protein).padStart(3) + " g P  score " + String(p.score).padStart(5) + "   " + r.title);
}
