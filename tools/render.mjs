/* EVZO slide renderer
 *
 *   node tools/render.mjs content/<file>.json
 *
 * Reads a post file, builds one HTML page per slide from the shared
 * tools/slide.css, and screenshots each at exactly 1080x1440 — or
 * 1080x1920 when the post sets `"format": "story"` — through
 * headless Chrome. No install step — it drives the Chrome already on
 * the machine.
 *
 * Every colour, face and spacing value lives in slide.css. Slides pick a
 * `type` and supply content; they never carry their own styling, so the
 * whole library stays visually identical post to post.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => existsSync(p));

if (!CHROME) {
  console.error("No Chrome or Edge found. Install one, or edit the CHROME list.");
  process.exit(1);
}

const CSS = readFileSync(path.join(ROOT, "tools", "slide.css"), "utf8");

/* ---------- helpers ---------- */

const esc = (s) =>
  String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Inline emphasis: *bold* and the two accent colours.
const rich = (s) =>
  esc(s)
    .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
    .replace(/\{o:([^}]+)\}/g, '<span class="olive">$1</span>')
    .replace(/\{r:([^}]+)\}/g, '<span class="rust">$1</span>')
    .replace(/==([^=]+)==/g, "<mark>$1</mark>");

const pct = (v, max) => Math.max(0.6, Math.min(100, (v / max) * 100)).toFixed(1);

/* ---------- slide types ---------- */

const TYPES = {
  // Opening slide: eyebrow, big headline, standfirst.
  cover: (s) => `
    <span class="eyebrow">${esc(s.eyebrow || "")}</span>
    <h1${s.small ? ' class="sm"' : ""}>${rich(s.headline)}</h1>
    ${s.body ? `<p class="wide">${rich(s.body)}</p>` : ""}`,

  // A single assertion, set large. Used to break rhythm mid-carousel.
  statement: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <p class="stmt">${rich(s.headline)}</p>
    ${s.body ? `<p class="wide">${rich(s.body)}</p>` : ""}`,

  // Ranked data. Values drive the bar widths off one shared scale.
  bars: (s) => {
    const max = s.max || Math.max(...s.rows.map((r) => r.value));
    return `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <h2>${rich(s.headline)}</h2>
    ${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ""}
    <div class="bars${s.rows.length > 6 ? " tight" : ""}">
      ${s.rows
        .map(
          (r) => `<div class="bar-row ${r.tone || ""}">
            <span class="top">
              <span class="nm">${esc(r.name)}</span>
              <span class="meta">${esc(r.meta || "")}</span>
            </span>
            <span class="val">${esc(r.value)}</span>
            <span class="trk"><span class="fil" style="width:${pct(
              parseFloat(r.value),
              max
            )}%"></span></span>
          </div>`
        )
        .join("")}
    </div>
    ${s.foot ? `<p class="wide sm">${rich(s.foot)}</p>` : ""}`;
  },

  // Numbered list. Only use where the order means something.
  list: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <h2>${rich(s.headline)}</h2>
    <div class="items">
      ${s.items
        .map(
          (it, i) => `<div class="item">
            <span class="n">${String(i + 1).padStart(2, "0")}</span>
            <span class="t">${rich(it.title)}</span>
            ${it.detail ? `<span class="d">${rich(it.detail)}</span>` : ""}
          </div>`
        )
        .join("")}
    </div>`,

  // Side-by-side. The point is always the gap between the two numbers.
  compare: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <h2>${rich(s.headline)}</h2>
    <div class="vs">
      ${s.cols
        .map(
          (c) => `<div class="col ${c.tone || ""}">
            <span class="lab">${esc(c.label)}</span>
            <span class="hero">${esc(c.value)}</span>
            <span class="cap">${rich(c.caption || "")}</span>
          </div>`
        )
        .join("")}
    </div>
    ${s.foot ? `<p class="wide sm">${rich(s.foot)}</p>` : ""}`,

  // Three headline figures.
  stats: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <h2>${rich(s.headline)}</h2>
    <div class="strip">
      ${s.cells
        .map(
          (c) => `<div class="c">
            <span class="k">${esc(c.key)}</span>
            <span class="v">${esc(c.value)}<span class="u">${esc(c.unit || "")}</span></span>
          </div>`
        )
        .join("")}
    </div>
    ${s.foot ? `<p class="wide sm">${rich(s.foot)}</p>` : ""}`,

  // Recipe: what goes in, then what you do.
  recipe: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <h2>${rich(s.headline)}</h2>
    ${
      s.ingredients
        ? `<div class="ing">${s.ingredients
            .map(
              (i) =>
                `<div class="r"><span class="n">${esc(i.name)}</span><span class="q">${esc(
                  i.qty
                )}</span></div>`
            )
            .join("")}</div>`
        : ""
    }
    ${
      s.steps
        ? `<div class="steps">${s.steps
            .map(
              (x, i) =>
                `<div class="step"><span class="n">${String(i + 1).padStart(
                  2,
                  "0"
                )}</span><span class="x">${rich(x)}</span></div>`
            )
            .join("")}</div>`
        : ""
    }`,

  // One number, set as large as the frame allows.
  hero: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <span class="bignum${s.tone === "rust" ? " rust" : ""}">${esc(s.value)}</span>
    <p class="bignum-cap">${esc(s.caption || "")}</p>
    ${s.body ? `<p class="wide">${rich(s.body)}</p>` : ""}`,

  // Photograph behind the type. The image carries the appetite; the words
  // stay in the bottom third where the scrim is darkest.
  photo: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <h2${s.small ? ' class="sm"' : ""}>${rich(s.headline)}</h2>
    ${s.body ? `<p class="wide">${rich(s.body)}</p>` : ""}`,

  // Full-bleed photograph, headline set into the bottom of the frame. The
  // accent phrase is marked with {y:...} so the yellow lands on one idea.
  photohero: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <h1 class="punch">${rich(s.headline)}</h1>
    ${s.body ? `<p class="wide">${rich(s.body)}</p>` : ""}`,

  // One food, one portion, one line. The carousel is built from these.
  portion: (s) => `
    <span class="food">${esc(s.food)}</span>
    <span class="dose">${esc(s.dose)}</span>
    ${s.note ? `<p class="reason">${rich(s.note)}</p>` : ""}`,
  // Nine foods in a 3x3 grid, each in a circular crop. A reference card
  // people save and come back to, so the figure carries the weight and the
  // line under it is practical, never a health claim.
  grid: (s) => `
    <h2 class="gridttl">${rich(s.headline)}</h2>
    <span class="rule"></span>
    <div class="g9">
      ${s.cells
        .map(
          (c) => `<div class="cell">
            <span class="pic" style="background-image:url('file:///${path
              .join(ROOT, c.photo)
              .replace(/\\/g, "/")}')"></span>
            <span class="nm">${esc(c.name)}</span>
            <span class="stat">${esc(c.stat)}</span>
            <span class="ln">${esc(c.line)}</span>
          </div>`
        )
        .join("")}
    </div>`,
  // Highlight cover. One word, centred, safe inside the circle crop.
  // Styles are inline on purpose: the cascade in slide.css was not reaching
  // these spans and a highlight cover has exactly three elements, so pinning
  // them here is simpler than fighting specificity.
  hlcover: (s) => `
    <span style="display:block;font-family:var(--display);font-size:46px;letter-spacing:.08em;color:#7A849A;line-height:1">EVZO</span>
    <span style="display:block;width:160px;height:6px;background:#FFE14D;margin:30px auto"></span>
    <span style="display:block;font-family:${s.lang === "el" ? "var(--greek);font-weight:800" : "var(--display)"};font-size:${s.lang === "el" ? 130 : 170}px;line-height:.9;color:#FFE14D;text-transform:uppercase;text-align:center;max-width:820px;letter-spacing:.01em">${esc(s.word).split(String.fromCharCode(10)).join("<br>")}</span>`,

  // Closing slide. Asks for exactly one thing.
  cta: (s) => `
    ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
    <h1 class="sm">${rich(s.headline)}</h1>
    ${s.body ? `<p class="wide">${rich(s.body)}</p>` : ""}
    ${s.note ? `<div class="pull"><p>${rich(s.note)}</p></div>` : ""}`,
};

/* ---------- page assembly ---------- */

function page(slide, post, index, total, format) {
  const build = TYPES[slide.type];
  if (!build) throw new Error(`Unknown slide type "${slide.type}" in ${post.id}`);

  const last = index === total - 1;
  const story = format === "story";
  const cue = slide.cue || (story ? "" : last ? "SAVE" : "SWIPE →");

  // A photo slide paints the image full-bleed behind everything, so the path
  // has to be absolute: the page itself is written to build/_tmp.
  const photo = slide.photo
    ? `<div class="photo-bg" style="background-image:url('file:///${path
        .join(ROOT, slide.photo)
        .replace(/\\/g, "/")}')"></div>`
    : "";

  return `<!doctype html>
<html lang="${slide.lang === "el" ? "el" : "en"}">
<head><meta charset="utf-8"><style>${CSS}</style></head>
<body${story ? ' class="story"' : ""}>
<div class="slide${story ? " story" : ""}${slide.lang === "el" ? " gr" : ""}${slide.type === "hero" ? " poster" : ""}${slide.type === "hlcover" ? " cover" : ""}${photo ? " photoslide" : ""}${slide.type === "portion" || slide.type === "photohero" ? " card" : ""}">
  ${photo}
  <div class="hd">
    <span class="mark">EVZO</span>
    <span class="ttl">${esc(post.title)}</span>
    <span class="spacer"></span>
    <span class="ctr">${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
  </div>
  <div class="bd${slide.align === "top" || slide.type === "grid" ? " top" : ""}">
    ${build(slide)}
  </div>
  <div class="ft">
    <span>@EVZO_METHOD</span>
    <span class="cue">${esc(cue)}</span>
  </div>
</div>
</body></html>`;
}

/* ---------- render ---------- */

async function shoot(html, outFile, tmpFile, height = 1440) {
  writeFileSync(tmpFile, html, "utf8");
  await run(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=1080,${height}`,
    "--virtual-time-budget=10000",
    `--screenshot=${outFile}`,
    `file:///${tmpFile.replace(/\\/g, "/")}`,
  ]);
}

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.error("usage: node tools/render.mjs content/<file>.json");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(path.resolve(src), "utf8"));
  const outRoot = path.join(ROOT, data.out || "build");
  const tmp = path.join(ROOT, "build", "_tmp");
  mkdirSync(tmp, { recursive: true });

  let n = 0;
  for (const post of data.posts) {
    const dir = path.join(outRoot, post.id);
    mkdirSync(dir, { recursive: true });

    const total = post.slides.length;
    const format = post.format || data.format || "post";
    // Small concurrency — each shot spawns its own Chrome.
    const jobs = post.slides.map((slide, i) => async () => {
      const file = path.join(dir, `${post.id}_${String(i + 1).padStart(2, "0")}.png`);
      await shoot(
        page(slide, post, i, total, format),
        file,
        path.join(tmp, `${post.id}-${i}.html`),
        format === "story" ? 1920 : 1440
      );
      n++;
      process.stdout.write(`  ${path.relative(ROOT, file)}\n`);
    });

    for (let i = 0; i < jobs.length; i += 4) {
      await Promise.all(jobs.slice(i, i + 4).map((j) => j()));
    }
    console.log(`${post.id} — ${total} ${format === "story" ? "stories" : "slides"}`);
  }

  if (!process.env.KEEP_TMP) rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${n} slides rendered to ${path.relative(ROOT, outRoot)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
