/* EVZO — blog generator
 * ===========================================================================
 *   node tools/blog.mjs
 *     -> blog.html            the index
 *     -> blog/<slug>/index.html   one folder per post, for clean URLs
 *
 * Static output on purpose: these pages have to be readable by a search engine
 * with no JavaScript, which is the entire reason the blog exists.
 *
 * THE RULE, same as the ebooks: no calorie or macro figure is written into
 * content/blog.json. A post names a recipe by id and this file computes the
 * figures from ebooks/foods.json through the shared nutrition module — so a
 * number published here is the same number printed in the PDF, always.
 * ======================================================================== */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { allRecipes, food } from "../ebooks/nutrition.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const CONFIG = createRequire(import.meta.url)(join(ROOT, "site", "config.js"));
const POSTS = JSON.parse(readFileSync(join(ROOT, "content", "blog.json"), "utf8")).posts;
const RECIPES = Object.fromEntries(allRecipes().map(r => [r.id, r]));
const BOOKS = Object.fromEntries(CONFIG.ebooks.books.map(b => [b.id, b]));

/* No domain yet means no canonical and no absolute URL anywhere — a canonical
   pointing at a guess is worse than none. Set config.site.baseUrl and rerun. */
const BASE = CONFIG.isSet(CONFIG.site.baseUrl)
  ? String(CONFIG.site.baseUrl).replace(/\/+$/, "")
  : null;
const abs = path => (BASE ? (path ? BASE + "/" + path.replace(/^\/+/, "") : BASE + "/") : null);

/** ISO 8601 duration from a recipe's free-text time, e.g. "12 minutes" -> PT12M.
    Returns null when the string carries no plain number of minutes, because a
    wrong duration in structured data is worse than an absent one. */
function isoDuration(text) {
  const m = /(\d+)\s*minute/i.exec(String(text));
  return m ? "PT" + m[1] + "M" : null;
}

const esc = s => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const DATE = iso => new Date(iso + "T00:00:00Z")
  .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/* ---- the shell ----------------------------------------------------------
   Page LINKS are root-relative ("/shop/"), which means the same thing from
   every depth. Only ASSETS use `up`, because those must resolve relative to
   the file for a local preview to work.

   `depth` is how far the file sits from the site root, because the posts live
   one directory down and every asset path has to climb back out. */
function shell({ title, description, body, depth = 0, canonicalPath, jsonld }) {
  const canonical = abs(canonicalPath || "");
  const up = depth ? "../".repeat(depth) : "";
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="${depth ? "article" : "website"}">
<meta property="og:site_name" content="EVZO">
<meta name="twitter:card" content="summary_large_image">
${canonical && depth ? `<meta property="og:image" content="${BASE}/brand/og-blog.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="${BASE}/brand/og-blog.png">` : ""}
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
${canonical ? `<link rel="canonical" href="${canonical}">
<meta property="og:url" content="${canonical}">
<link rel="alternate" hreflang="${CONFIG.site.locale}" href="${canonical}">
<link rel="alternate" hreflang="${CONFIG.site.altLocale}" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">` : ""}
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0B1220">
<link rel="icon" href="${up}brand/evzo-profile-navy-zowhite.png">
<link rel="apple-touch-icon" href="${up}brand/evzo-profile-navy-zowhite.png">
<link rel="stylesheet" href="${up}site/fonts.css">
<link rel="stylesheet" href="${up}site/evzo.css">
<link rel="stylesheet" href="${up}site/consent.css">
<link rel="stylesheet" href="${up}site/shop.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}

<a class="skip" href="#main">Skip to the article</a>

<header class="mast">
  <div class="mast-in">
    <a class="mark" href="/" aria-label="EVZO"><img src="${up}brand/evzo-wordmark-ev-yellow.svg" alt="EVZO" width="125" height="28"></a>
    <nav class="nav" aria-label="Sections">
      <a href="/">Home</a>
      <a href="/#pricing">Price</a>
      <a href="/shop/">Shop</a>
      <a href="/blog/"${canonicalPath === "blog/" ? ' aria-current="page"' : ""}>Blog</a>
    </nav>
    <span class="spacer"></span>
    <a class="btn" href="/#assessment">Build my guide</a>
  </div>
</header>

${body}

<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <img class="mark-img" src="${up}brand/evzo-wordmark-ev-yellow.svg" alt="EVZO" width="107" height="24">
        <p class="note" style="margin-top:8px">ευ ζω — to live well</p>
      </div>
      <div class="foot-links">
        <a href="/legal/#cookies" data-cookie-settings>Cookie settings</a>
        <a href="/">Home</a>
        <a href="/shop/">Shop</a>
        <a href="${up}blog.html">Blog</a>
        <a href="/legal/#faq">FAQ</a>
      </div>
    </div>
    <p class="legal">${esc(CONFIG.disclaimerFull || "")}</p>
  </div>
</footer>

<script src="${up}site/consent.js"></script>
</html>
`;
}

/* ---- a recipe, with its computed figures -------------------------------- */
function recipeBlock(id, intro, depth) {
  const r = RECIPES[id];
  if (!r) throw new Error("Blog post references an unknown recipe: " + id);
  const up = depth ? "../".repeat(depth) : "";
  const ings = r.ingredients
    .filter(i => i.food !== "herbs")
    .map(i => `<li><span>${esc(food(i.food).label)}</span><span>${i.g} g</span></li>`)
    .join("");

  return `<div class="post-recipe">
    <span class="label">${esc(r.slot)} · serves ${r.servings} · ${esc(r.time)}</span>
    <h3 style="margin:8px 0 2px">${esc(r.title)}</h3>
    <p class="note" style="margin:0">${esc(r.greek)}</p>
    ${intro ? `<p style="margin-top:14px">${esc(intro)}</p>` : ""}

    <div class="macros">
      <div><span class="k">Calories</span><b>${r.per.kcal}</b></div>
      <div><span class="k">Protein</span><b>${r.per.protein} g</b></div>
      <div><span class="k">Carbs</span><b>${r.per.carb} g</b></div>
      <div><span class="k">Fat</span><b>${r.per.fat} g</b></div>
      <div><span class="k">Score</span><b>${r.per.score}</b></div>
    </div>
    <p class="note" style="margin-top:-8px">Per serving, computed from the ingredients below. Figures vary with brand, cut and cooking — close, not exact.</p>

    <span class="label" style="margin-top:20px">What goes in</span>
    <ul class="ing" style="margin-top:8px">${ings}</ul>
    <p class="note" style="margin-top:10px">Herbs, spices, salt and pepper as you like — too small to count.</p>

    <span class="label" style="margin-top:20px">How</span>
    <ol>${r.method.map(m => `<li>${esc(m)}</li>`).join("")}</ol>

    <p style="margin-top:18px"><strong>Why it is built this way.</strong> ${esc(r.why)}</p>
  </div>`;
}

/* ---- body blocks -------------------------------------------------------- */
function blocks(list) {
  return (list || []).map(b => {
    if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
    if (b.h3) return `<h3>${esc(b.h3)}</h3>`;
    if (b.ul) return `<ul>${b.ul.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    if (b.p) return `<p>${esc(b.p)}</p>`;
    return "";
  }).join("\n      ");
}

/* ---- structured data for a post ------------------------------------------
   Article always; Recipe as well when the post carries one. The Recipe block
   is the valuable half — it is what produces a result with the calorie figure
   attached — and every number in it comes from the same computation that
   printed the figures on the page, so the markup and the visible text can
   never disagree. Google treats that mismatch as a manual-action risk. */

function postGraph(post) {
  const url = abs("blog/" + post.slug + "/");
  const graph = [
    {
      "@type": "Article",
      headline: post.title,
      alternativeHeadline: post.titleEl,
      datePublished: post.date,
      dateModified: post.date,
      articleSection: post.category,
      description: post.excerpt,
      inLanguage: CONFIG.site.locale,
      mainEntityOfPage: url || undefined,
      author: { "@type": "Organization", name: CONFIG.site.legalName },
      publisher: { "@type": "Organization", name: CONFIG.site.legalName }
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("") || undefined },
        { "@type": "ListItem", position: 2, name: "Blog", item: abs("blog.html") || undefined },
        { "@type": "ListItem", position: 3, name: post.title, item: url || undefined }
      ]
    }
  ];

  if (post.recipe) {
    const r = RECIPES[post.recipe];
    const time = isoDuration(r.time);
    graph.push({
      "@type": "Recipe",
      name: r.title,
      alternateName: r.greek,
      description: post.recipeIntro || post.excerpt,
      author: { "@type": "Organization", name: CONFIG.site.legalName },
      datePublished: post.date,
      recipeCategory: r.slot,
      recipeCuisine: "Mediterranean",
      recipeYield: r.servings + (r.servings === 1 ? " serving" : " servings"),
      ...(time ? { totalTime: time } : {}),
      inLanguage: CONFIG.site.locale,
      recipeIngredient: r.ingredients
        .filter(i => i.food !== "herbs")
        .map(i => i.g + " g " + food(i.food).label.toLowerCase()),
      recipeInstructions: r.method.map((m, i) => ({
        "@type": "HowToStep", position: i + 1, text: m
      })),
      /* Per serving, computed. The unit strings are the ones schema.org asks
         for; the values are the same ones printed on the page. */
      nutrition: {
        "@type": "NutritionInformation",
        servingSize: "1 serving",
        calories: r.per.kcal + " calories",
        proteinContent: r.per.protein + " g",
        carbohydrateContent: r.per.carb + " g",
        fatContent: r.per.fat + " g"
      }
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/* ---- one post ----------------------------------------------------------- */
function postPage(post) {
  const book = BOOKS[post.cta];
  const price = CONFIG.ebooks.singlePriceDisplay;
  const shopHref = "../shop.html";

  const body = `<main id="main">
  <section>
    <div class="wrap">
      <article class="article">
        <span class="label">${esc(post.category)} · ${esc(DATE(post.date))}</span>
        <h1 style="margin:10px 0 0">${esc(post.title)}</h1>
        <p class="note" style="margin:8px 0 0">${esc(post.titleEl)}</p>
        <p class="lede" style="margin-top:24px">${esc(post.lede)}</p>

        ${blocks(post.body)}
        ${post.recipe ? recipeBlock(post.recipe, post.recipeIntro, 1) : ""}
        ${blocks(post.afterRecipe)}

        ${book ? `<div class="post-cta">
          <div>
            <span class="label">${esc(book.eyebrow)}</span>
            <div class="h" style="font-family:var(--display);font-size:24px;text-transform:uppercase;margin-top:6px">${esc(book.name)}</div>
            <p>${esc(book.blurb)}</p>
          </div>
          <a class="btn" href="${shopHref}">${esc(price)} — see the book</a>
        </div>` : ""}

        <p class="note" style="margin-top:34px">18+. General information about food, not medical advice. EVZO is not run by
        dietitians, nutritionists or doctors. Not suitable during pregnancy or breastfeeding, with a history of disordered
        eating, or alongside a medically prescribed diet.</p>

        <p style="margin-top:26px"><a href="../blog.html">← All articles</a></p>
      </article>
    </div>
  </section>
</main>`;

  return shell({
    title: post.title + " — EVZO",
    description: post.excerpt,
    body, depth: 2,
    canonicalPath: "blog/" + post.slug + "/",
    jsonld: postGraph(post)
  });
}

/* ---- the index ---------------------------------------------------------- */
function indexPage() {
  const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  const [lead, ...rest] = sorted;

  const card = p => `<a class="post-card" href="/blog/${esc(p.slug)}/">
      <span class="label">${esc(p.category)}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.excerpt)}</p>
      <div class="post-meta">${esc(DATE(p.date))}${p.recipe ? " · with the recipe" : ""}</div>
    </a>`;

  const body = `<main id="main">
  <section class="hero">
    <div class="wrap">
      <span class="label">The blog</span>
      <h1>Food, written<br>with the numbers in</h1>
      <p class="sub">Free recipes and plain explanations, with every calorie and macro figure
      computed from the ingredient rather than claimed. The same arithmetic as the books,
      published in the open so you can check it.</p>
    </div>
  </section>

  <section style="padding-top:0">
    <div class="wrap">
      <span class="label">Latest</span>
      <a class="post-card" href="/blog/${esc(lead.slug)}/" style="margin-top:14px;border-top-color:var(--yellow)">
        <span class="label">${esc(lead.category)}</span>
        <h3 style="font-size:clamp(24px,4vw,34px);font-family:var(--display);text-transform:uppercase;line-height:1.05">${esc(lead.title)}</h3>
        <p style="font-size:17px;max-width:62ch">${esc(lead.excerpt)}</p>
        <div class="post-meta">${esc(DATE(lead.date))}${lead.recipe ? " · with the recipe" : ""}</div>
      </a>
    </div>
  </section>

  <section class="alt" style="padding-top:0">
    <div class="wrap" style="padding-top:clamp(42px,6vw,76px)">
      <span class="label">Everything else</span>
      <h2>All articles</h2>
      <div class="posts" style="margin-top:22px">
        ${rest.map(card).join("\n        ")}
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="post-cta">
        <div>
          <span class="label">The books</span>
          <div class="h" style="font-family:var(--display);font-size:26px;text-transform:uppercase;margin-top:6px">Every recipe, in one place</div>
          <p>Seven recipe books, same format as the free ones here, ${esc(CONFIG.ebooks.singlePriceDisplay)} each.</p>
        </div>
        <a class="btn" href="shop.html">Shop all ebooks</a>
      </div>
    </div>
  </section>
</main>`;

  return shell({
    title: "EVZO Blog — food, written with the numbers in",
    description: "Free recipes and plain nutrition explanations for Greek and Cypriot kitchens, with every figure computed from the ingredient.",
    body, depth: 1, canonicalPath: "blog/"
  });
}

/* ---- write -------------------------------------------------------------- */
mkdirSync(join(ROOT, "blog"), { recursive: true });

for (const post of POSTS) {
  const dir = join(ROOT, "blog", post.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), postPage(post));
  console.log("wrote blog/" + post.slug + "/index.html");
}
mkdirSync(join(ROOT, "blog"), { recursive: true });
writeFileSync(join(ROOT, "blog", "index.html"), indexPage());
console.log("wrote blog/index.html");

/* sitemap.xml and robots.txt are written by tools/seo.mjs, which owns every
   absolute URL on the site. Run it after this. */
console.log("\nnow run: node tools/seo.mjs");
