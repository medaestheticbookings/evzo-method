/* EVZO — cover images for the shop
 * ===========================================================================
 *   node tools/covers.mjs
 *     -> brand/covers/EVZO-*.png
 *
 * The shop used to draw a CSS imitation of each cover, which meant the card on
 * the site and the actual front of the PDF could drift apart — and did. These
 * are screenshots of page one of the real book, so what a customer sees in the
 * shop is exactly what they get.
 *
 * Run `EVZO_KEEP_HTML=1 node ebooks/build.mjs` first: this reads the
 * intermediate HTML that build leaves in ebooks/.tmp.
 * ======================================================================== */

import { readdirSync, existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const TMP = join(ROOT, "ebooks", ".tmp");
const OUT = join(ROOT, "brand", "covers");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(p => existsSync(p));
if (!CHROME) { console.error("No Chrome or Edge found."); process.exit(1); }

if (!existsSync(TMP)) {
  console.error("ebooks/.tmp is missing. Run:  EVZO_KEEP_HTML=1 node ebooks/build.mjs");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const run = (cmd, args) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: "ignore" });
  p.on("error", rej);
  p.on("exit", c => (c === 0 ? res() : rej(new Error(cmd + " exited " + c))));
});

const files = readdirSync(TMP).filter(f => f.endsWith(".html"));

for (const f of files) {
  const name = f.replace(/\.html$/, "");
  // 800px wide is twice the size the card ever renders at, so it stays sharp
  // on a phone without shipping a 1MB image to one.
  await run(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=800,1131",
    "--virtual-time-budget=6000",
    `--screenshot=${join(OUT, name + ".png")}`,
    "file:///" + resolve(TMP, f).replace(/\\/g, "/")
  ]);
  console.log("cover: " + name);
}

console.log("\n" + files.length + " covers written to brand/covers/");
