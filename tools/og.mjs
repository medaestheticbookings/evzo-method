/* EVZO — social share images
 * ===========================================================================
 *   node tools/og.mjs
 *     -> brand/og-home.png    1200x630
 *     -> brand/og-shop.png
 *     -> brand/og-blog.png
 *
 * Without these, a link pasted into WhatsApp, Instagram or Facebook falls back
 * to whatever image it can find — usually the favicon, blown up and cropped
 * into nonsense. The first thing anyone sees of EVZO is that thumbnail, so it
 * is worth a designed card rather than an accident.
 *
 * 1200x630 is the size every platform crops from. Anything important stays
 * inside a safe margin, because Twitter and WhatsApp crop the edges
 * differently and neither tells you in advance.
 * ======================================================================== */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BRAND = join(ROOT, "brand");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(p => existsSync(p));
if (!CHROME) { console.error("No Chrome or Edge found."); process.exit(1); }

const logo = readFileSync(join(BRAND, "evzo-wordmark-ev-yellow.svg"), "utf8");
const bars = readFileSync(join(BRAND, "evzo-icon-bars.svg"), "utf8");

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function card({ eyebrow, title, titleEl, sub, stat, statLabel }) {
  return `<!doctype html><html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Commissioner:wght@400;500;600;800&family=Roboto+Mono:wght@400;500&display=swap">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{
    background:#0B1220;color:#fff;font-family:"Commissioner",system-ui,sans-serif;
    position:relative;-webkit-font-smoothing:antialiased;
  }

  /* The yellow field. A hard diagonal edge rather than a straight split —
     it is what stops the card reading as a slide template. */
  .field{
    position:absolute;inset:0 0 0 auto;width:470px;background:#FFE14D;
    clip-path:polygon(120px 0, 470px 0, 470px 630px, 0 630px);
  }
  /* A second, thinner wedge in the deep yellow, offset behind the first, so
     the edge has depth instead of being one flat cut. */
  .field-back{
    position:absolute;inset:0 0 0 auto;width:520px;background:#C9AE33;
    clip-path:polygon(120px 0, 180px 0, 60px 630px, 0 630px);opacity:.55;
  }

  .inner{position:absolute;inset:0;padding:62px 70px;display:flex;flex-direction:column;justify-content:space-between}

  .top{display:flex;align-items:flex-start;gap:24px}
  .mark svg{height:50px;width:auto;display:block}
  .eyebrow{
    font-family:"Roboto Mono",monospace;font-size:15px;letter-spacing:.24em;
    text-transform:uppercase;color:#7A849A;padding-top:16px;
    border-left:2px solid #FFE14D;padding-left:20px;margin-left:6px;
  }

  .mid{max-width:660px}
  h1{
    font-family:"Anton",sans-serif;font-weight:400;font-size:82px;line-height:.94;
    text-transform:uppercase;letter-spacing:.004em;
  }
  .el{font-size:25px;color:#FFE14D;margin-top:18px;font-weight:500;letter-spacing:.01em}
  .sub{font-size:23px;line-height:1.5;color:#C8CEDA;margin-top:20px;max-width:600px}

  .foot{display:flex;align-items:center;gap:16px}
  .foot .dot{width:7px;height:7px;background:#FFE14D;flex:none}
  .url{
    font-family:"Roboto Mono",monospace;font-size:17px;letter-spacing:.2em;
    text-transform:uppercase;color:#fff;
  }

  /* The figure, sitting on the yellow. One number, enormous, because at
     thumbnail size a row of small stats is a grey smear. */
  .stat{
    position:absolute;right:70px;top:0;height:630px;width:330px;
    display:flex;flex-direction:column;justify-content:center;align-items:flex-end;
    text-align:right;color:#0B1220;
  }
  .stat b{
    font-family:"Anton",sans-serif;font-weight:400;font-size:150px;line-height:.84;
    letter-spacing:-.015em;display:block;
  }
  .stat span{
    font-family:"Roboto Mono",monospace;font-size:15px;letter-spacing:.2em;
    text-transform:uppercase;margin-top:16px;color:#6E6224;max-width:250px;
  }
</style>
<div class="field-back"></div>
<div class="field"></div>
<div class="stat"><b>${esc(stat)}</b><span>${esc(statLabel)}</span></div>
<div class="inner">
  <div class="top">
    <div class="mark">${logo}</div>
    <div class="eyebrow">${esc(eyebrow)}</div>
  </div>
  <div class="mid">
    <h1>${esc(title).split("|").join("<br>")}</h1>
    ${titleEl ? `<div class="el">${esc(titleEl)}</div>` : ""}
    <div class="sub">${esc(sub)}</div>
  </div>
  <div class="foot"><span class="dot"></span><span class="url">evzomethod.com</span></div>
</div>
</html>`;
}

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "ignore" });
    p.on("error", rej);
    p.on("exit", c => (c === 0 ? res() : rej(new Error(cmd + " exited " + c))));
  });
}

const tmp = join(ROOT, ".og-tmp");
mkdirSync(tmp, { recursive: true });

async function shoot(name, html) {
  const src = join(tmp, name + ".html");
  const out = join(BRAND, "og-" + name + ".png");
  writeFileSync(src, html);
  await run(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    "--virtual-time-budget=5000",
    `--screenshot=${out}`,
    "file:///" + src.replace(/\\/g, "/")
  ]);
  console.log("wrote brand/og-" + name + ".png");
}

const stats = JSON.parse(readFileSync(join(ROOT, "site", "shop-data.json"), "utf8"));
const t = stats.totals;

await shoot("home", card({
  eyebrow: "Personalised meal guide",
  title: "Your goal.|Your food.",
  titleEl: "Ένα πλάνο φτιαγμένο για σένα",
  sub: "A monthly meal guide built around your body, your budget and the food you actually eat.",
  stat: t.planDays, statLabel: "Days, built for you"
}));

await shoot("shop", card({
  eyebrow: "Recipe and training books",
  title: "Every number|is real",
  titleEl: "Κάθε νούμερο είναι αληθινό",
  sub: "Calories computed from the ingredient, never estimated. Greek and Cypriot kitchens.",
  stat: t.recipes, statLabel: "Recipes, all costed"
}));

await shoot("blog", card({
  eyebrow: "Free recipes",
  title: "Food, with the|numbers in",
  titleEl: "Φαγητό, με τα νούμερα μέσα",
  sub: "Full recipes and plain explanations of what most nutrition advice gets wrong.",
  stat: t.ingredients, statLabel: "Ingredients costed"
}));

rmSync(tmp, { recursive: true, force: true });
console.log("\nnow run: node tools/seo.mjs");
