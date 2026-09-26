/* EVZO — Facebook Page cover photos
 * ===========================================================================
 *   node tools/fbcover.mjs
 *     -> brand/fb-<name>.png     1640 x 856
 *
 * THE BOTTOM HALF IS UNUSABLE. THAT IS THE WHOLE PROBLEM.
 *
 * Two things eat a Page cover, and the second one is what ruins most of them.
 *
 * 1. THE CROPS. The uploaded image is 1640 x 856. Desktop shows 820 x 312,
 *    which is wider than the canvas, so it keeps the full width and cuts
 *    about 116px off the top and bottom. Mobile shows 640 x 360, which is
 *    taller, so it keeps the full height and cuts about 59px off each side.
 *    Between them the surviving region is roughly x 60-1580, y 116-740.
 *
 * 2. THE PROFILE PICTURE, which sits ON TOP of the cover, not beside it.
 *    On desktop it overlaps the bottom LEFT. On mobile it is centred and
 *    overlaps the bottom MIDDLE. Either way it covers a circle of roughly
 *    a fifth of the canvas, and on a phone it lands exactly where a centred
 *    design puts its words.
 *
 * So everything readable lives in the UPPER MIDDLE: above y = 55%, inside
 * the horizontal safe range, and the entire bottom 45% is left as
 * photograph. That is not a composition choice, it is the only region that
 * is both visible and uncovered on every device.
 * ======================================================================== */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BRAND = join(ROOT, "brand");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(p => existsSync(p));
if (!CHROME) { console.error("No Chrome or Edge found."); process.exit(1); }

const logoWhite = readFileSync(join(BRAND, "evzo-wordmark-white.svg"), "utf8");
const logoBlack = readFileSync(join(BRAND, "evzo-wordmark-black.svg"), "utf8");

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const url = rel => pathToFileURL(join(ROOT, rel)).href;

const W = 1640, H = 856;

const BASE = `
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0B1220}
  .wrap{position:relative;width:${W}px;height:${H}px;overflow:hidden}
  .photo{position:absolute;inset:0;background-size:cover;background-position:center 45%}
  /* Upper middle only. The bottom 45% is where the profile picture lands
     and where the desktop crop is least reliable, so nothing readable goes
     there. */
  .safe{position:absolute;top:10%;bottom:45%;left:14%;right:14%;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        text-align:center}
  .safe svg{width:auto;display:block}
  h1{font-family:"Anton",system-ui,sans-serif;font-weight:400;text-transform:uppercase;
     line-height:1.0;letter-spacing:.004em}
  p{font-family:"Commissioner",system-ui,sans-serif;line-height:1.35}
  .mono{font-family:"Roboto Mono",ui-monospace,monospace;text-transform:uppercase;
        letter-spacing:.2em}
`;

function shell(inner, extra = "") {
  return `<!doctype html><html lang="en"><meta charset="utf-8">
<link rel="stylesheet" href="${url("site/fonts.css")}">
<style>${BASE}${extra}</style>
<div class="wrap">${inner}</div></html>`;
}

/* ---- 1. THE YELLOW BAND -------------------------------------------------
   A solid brand-yellow band straight across the middle with navy type in it.
   No scrim needed, because the type never touches the photograph. It is the
   most legible thing possible at thumbnail size and unmistakably one brand.  */
function band({ photo, headline, sub }) {
  return shell(`
    <div class="photo" style="background-image:url('${url(photo)}')"></div>
    <div class="dim"></div>
    <div class="band">
      <div class="band-in">
        ${logoBlack}
        <div class="vr"></div>
        <div class="txt">
          <h1>${esc(headline)}</h1>
          <p>${esc(sub)}</p>
        </div>
      </div>
    </div>
    <div class="dom mono">evzomethod.com</div>
  `, `
    .dim{position:absolute;inset:0;background:rgba(11,18,32,.26)}
    .band{position:absolute;left:0;right:0;top:31%;transform:translateY(-50%);
          background:#FFE14D;padding:38px 0;box-shadow:0 18px 60px rgba(0,0,0,.35)}
    .band-in{display:flex;align-items:center;justify-content:center;gap:40px;
             max-width:1000px;margin:0 auto}
    .band-in svg{height:76px;flex:none}
    .vr{width:4px;height:96px;background:#0B1220;opacity:.22;flex:none}
    .txt{text-align:left;max-width:600px}
    h1{font-size:40px;color:#0B1220}
    p{font-size:21px;color:#2A2E17;margin-top:9px}
    .dom{position:absolute;right:70px;top:44px;font-size:20px;color:#fff;
         text-shadow:0 2px 12px rgba(0,0,0,.8)}
  `);
}

/* ---- 2. BRIGHT ----------------------------------------------------------
   Almost no scrim. The photograph is the point; the type sits in a small
   frosted card so it stays readable without drowning the picture. The old
   set were all very dark, and dark reads as heavy in a feed.               */
function bright({ photo, headline, sub }) {
  return shell(`
    <div class="photo" style="background-image:url('${url(photo)}')"></div>
    <div class="veil"></div>
    <div class="safe">
      <div class="card">
        ${logoWhite}
        <h1>${esc(headline)}</h1>
        <p>${esc(sub)}</p>
      </div>
    </div>
    <div class="dom mono">evzomethod.com</div>
  `, `
    .veil{position:absolute;inset:0;
      background:radial-gradient(64% 76% at 50% 46%,rgba(11,18,32,.52) 0%,rgba(11,18,32,.16) 62%,rgba(11,18,32,0) 100%)}
    .card{background:rgba(11,18,32,.62);backdrop-filter:blur(3px);
          border-top:5px solid #FFE14D;padding:38px 52px 40px;
          display:flex;flex-direction:column;align-items:center;gap:20px}
    .card svg{height:66px}
    h1{font-size:42px;color:#fff}
    p{font-size:21px;color:#E7EBF2;max-width:640px}
    .dom{position:absolute;right:70px;top:44px;font-size:20px;color:#FFE14D;
         text-shadow:0 2px 12px rgba(0,0,0,.85)}
  `);
}

/* ---- 3. THREE DISHES ----------------------------------------------------
   A strip of three photographs rather than one, which says "a month of
   meals" in a way a single plate cannot. The outer two are expected to be
   cropped on a phone; the middle one carries it.                            */
function strip({ photos, headline, sub }) {
  return shell(`
    <div class="strip">
      ${photos.map(p => `<div class="cell" style="background-image:url('${url(p)}')"></div>`).join("")}
    </div>
    <div class="veil"></div>
    <div class="safe">
      ${logoWhite}
      <div class="rule"></div>
      <h1>${esc(headline)}</h1>
      <p>${esc(sub)}</p>
    </div>
    <div class="dom mono">evzomethod.com</div>
  `, `
    .strip{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
    .cell{background-size:cover;background-position:center}
    .veil{position:absolute;inset:0;
      background:linear-gradient(180deg,rgba(11,18,32,.42) 0%,rgba(11,18,32,.72) 45%,rgba(11,18,32,.88) 100%)}
    .safe{gap:22px}
    .safe svg{height:78px}
    .rule{width:120px;height:6px;background:#FFE14D}
    h1{font-size:46px;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.6)}
    p{font-size:22px;color:#E7EBF2;max-width:760px}
    .dom{position:absolute;right:70px;top:44px;font-size:20px;color:#FFE14D}
  `);
}

/* ---- 4. TYPE ONLY -------------------------------------------------------
   No photograph at all. Brand yellow, navy type, the diagonal field from the
   book covers. It will never be mistaken for a stock-photo page, and it is
   the one that survives being shrunk to any size.                            */
function typeOnly({ headline, sub }) {
  return shell(`
    <div class="field"></div>
    <div class="field2"></div>
    <div class="safe">
      ${logoBlack}
      <div class="rule"></div>
      <h1>${esc(headline)}</h1>
      <p>${esc(sub)}</p>
    </div>
    <div class="dom mono">evzomethod.com</div>
  `, `
    html,body,.wrap{background:#FFE14D}
    /* The diagonal lives in the BOTTOM of the frame, which the profile
       picture covers anyway. Across the top it ran straight through the
       wordmark and turned navy type navy-on-navy. */
    .field{position:absolute;inset:0;background:#0B1220;
           clip-path:polygon(0 100%,100% 100%,100% 58%,0 74%)}
    .field2{position:absolute;inset:0;background:#0B1220;opacity:.12;
            clip-path:polygon(0 74%,100% 58%,100% 51%,0 67%)}
    .safe{gap:22px}
    .safe svg{height:84px}
    .rule{width:130px;height:7px;background:#0B1220}
    h1{font-size:50px;color:#0B1220}
    p{font-size:23px;color:#2A2E17;max-width:800px}
    .dom{position:absolute;right:70px;top:44px;font-size:20px;color:#0B1220;opacity:.66}
  `);
}

const VARIANTS = [
  { file: "fb-band", html: band({
      photo: "photos/spread.jpg",
      headline: "Your goal. Your food.",
      sub: "A 28-day meal plan built from your own numbers." }) },

  { file: "fb-bright", html: bright({
      photo: "photos/fish-grilled.jpg",
      headline: "Not a diet. A structure that holds.",
      sub: "Mediterranean food, with every calorie already worked out." }) },

  { file: "fb-three", html: strip({
      photos: ["photos/salad-greek.jpg", "photos/chicken-grilled.jpg", "photos/yogurt-bowl.jpg"],
      headline: "A month of meals that fit your life",
      sub: "Eleven questions. Then food you already cook, portioned to you." }) },

  { file: "fb-type", html: typeOnly({
      headline: "Every number computed, not claimed",
      sub: "Personalised 28-day meal plans. Mediterranean food, real arithmetic." }) }
];

const tmp = join(ROOT, ".fb-tmp");
mkdirSync(tmp, { recursive: true });

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "ignore" });
    p.on("error", rej);
    p.on("exit", c => (c === 0 ? res() : rej(new Error(cmd + " exited " + c))));
  });
}

for (const v of VARIANTS) {
  const src = join(tmp, v.file + ".html");
  const out = join(BRAND, v.file + ".png");
  writeFileSync(src, v.html, "utf8");
  await run(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${W},${H}`,
    "--virtual-time-budget=6000",
    "--screenshot=" + out,
    pathToFileURL(src).href
  ]);
  console.log("wrote brand/" + v.file + ".png");
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${W}x${H}. Everything readable sits in the centre, which is the`);
console.log("only part that survives both the desktop and the mobile crop.");
