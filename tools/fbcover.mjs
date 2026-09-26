/* EVZO — Facebook Page cover photos
 * ===========================================================================
 *   node tools/fbcover.mjs
 *     -> brand/fb-cover-market.png
 *     -> brand/fb-cover-spread.png
 *     -> brand/fb-cover-bowl.png
 *     -> brand/fb-cover-plain.png
 *
 * WHY THE SAFE AREA MATTERS MORE THAN THE SIZE.
 *
 * A Facebook Page cover is not one image, it is three crops of one image:
 *
 *   uploaded        1640 x 856   what you give Facebook
 *   desktop         820 x 312    a wide letterbox out of the middle
 *   mobile          640 x 360    a TALLER, NARROWER crop
 *
 * The desktop and mobile crops do not agree. Mobile keeps more height and
 * loses width; desktop keeps width and loses height. So anything that has to
 * be read — the wordmark, the line, the domain — sits inside the central
 * band where BOTH crops overlap, which is roughly the middle 820 x 312 of the
 * 1640 x 856 canvas, scaled up. Everything outside that is photograph only,
 * and it is expected to be cut.
 *
 * On a phone the profile picture also sits centred over the bottom of the
 * cover, so the lower-centre is left clear rather than filled with type.
 *
 * The overlay is drawn at 2x and the file is exported at 1640 x 856, which is
 * what Facebook asks for and what stops it re-compressing a smaller image
 * into mush.
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

const logo = readFileSync(join(BRAND, "evzo-wordmark-white.svg"), "utf8");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const url = rel => pathToFileURL(join(ROOT, rel)).href;

const W = 1640, H = 856;

/* The overlap of the desktop and mobile crops, as a fraction of the canvas.
   Type lives inside this and nowhere else. */
const SAFE = { top: 0.20, bottom: 0.72, left: 0.20, right: 0.80 };

function cover({ photo, headline, sub }) {
  const bg = photo
    ? `<div class="photo" style="background-image:url('${url(photo)}')"></div>
       <div class="tint"></div>`
    : `<div class="photo plain"></div>`;

  return `<!doctype html><html lang="en"><meta charset="utf-8">
<link rel="stylesheet" href="${url("site/fonts.css")}">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0B1220}
  .wrap{position:relative;width:${W}px;height:${H}px;overflow:hidden}

  .photo{position:absolute;inset:0;background-size:cover;background-position:center 42%}
  .photo.plain{background:#0B1220}

  /* Warm the photograph towards the brand yellow without tinting it orange. */
  .tint{position:absolute;inset:0;background:#FFE14D;mix-blend-mode:soft-light;opacity:.34}

  /* Two scrims. A vertical one so the type has ground under it, and a radial
     one centred on the safe area so the middle is darkest where the words
     are and the photograph stays visible at the edges that get cropped. */
  .scrim-v{position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(11,18,32,.52) 0%,rgba(11,18,32,.30) 38%,rgba(11,18,32,.80) 100%)}
  .scrim-c{position:absolute;inset:0;
    background:radial-gradient(58% 72% at 50% 44%,rgba(11,18,32,.82) 0%,rgba(11,18,32,.52) 55%,rgba(11,18,32,0) 100%)}

  /* Everything readable lives in here. */
  .safe{position:absolute;
    top:${SAFE.top * 100}%;bottom:${(1 - SAFE.bottom) * 100}%;
    left:${SAFE.left * 100}%;right:${(1 - SAFE.right) * 100}%;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    text-align:center;gap:26px}

  .safe svg{height:96px;width:auto;display:block}
  .rule{width:132px;height:6px;background:#FFE14D}
  h1{font-family:"Anton",system-ui,sans-serif;font-weight:400;
     font-size:54px;line-height:1.02;color:#fff;text-transform:uppercase;
     letter-spacing:.005em;max-width:1000px;text-shadow:0 2px 14px rgba(0,0,0,.55)}
  p{font-family:"Commissioner",system-ui,sans-serif;font-size:26px;line-height:1.35;
    color:#E7EBF2;max-width:900px;text-shadow:0 1px 10px rgba(0,0,0,.6)}

  /* Bottom-right, out of the way of the profile picture, which sits
     bottom-centre on a phone and bottom-left on desktop. */
  .domain{position:absolute;right:76px;bottom:46px;
    font-family:"Roboto Mono",ui-monospace,monospace;font-size:22px;
    letter-spacing:.18em;text-transform:uppercase;color:#FFE14D;
    text-shadow:0 1px 8px rgba(0,0,0,.7)}
</style>
<div class="wrap">
  ${bg}
  <div class="scrim-v"></div>
  <div class="scrim-c"></div>
  <div class="safe">
    ${logo}
    <div class="rule"></div>
    <h1>${esc(headline)}</h1>
    <p>${esc(sub)}</p>
  </div>
  <div class="domain">evzomethod.com</div>
</div>
</html>`;
}

const VARIANTS = [
  { name: "market", photo: "photos/market.jpg",
    headline: "Your goal. Your food.",
    sub: "A 28-day meal plan built from your own numbers." },
  { name: "spread", photo: "photos/spread.jpg",
    headline: "Real food, portioned properly",
    sub: "Mediterranean cooking with every calorie worked out." },
  { name: "bowl", photo: "photos/chickpeas.jpg",
    headline: "Not a diet. A structure that holds.",
    sub: "Eleven questions, then a month of meals that fit your life." },
  { name: "plain", photo: null,
    headline: "Your goal. Your food.",
    sub: "A 28-day meal plan built from your own numbers." }
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
  const src = join(tmp, v.name + ".html");
  const out = join(BRAND, "fb-cover-" + v.name + ".png");
  writeFileSync(src, cover(v), "utf8");
  await run(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${W},${H}`,
    "--virtual-time-budget=6000",
    "--screenshot=" + out,
    pathToFileURL(src).href
  ]);
  console.log("wrote brand/fb-cover-" + v.name + ".png");
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${W}x${H}. Upload as-is — Facebook crops to 820x312 on desktop and`);
console.log("640x360 on mobile, and everything readable sits inside the overlap.");
