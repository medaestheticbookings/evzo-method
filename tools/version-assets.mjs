/* Stamp every local CSS and JS reference with a hash of the file's contents.
 * ============================================================================
 *   node tools/version-assets.mjs        (run before every push)
 *
 * GitHub Pages serves everything with max-age=600, and the pages referenced
 * site/evzo.css with no version, so after a change a visitor's browser kept
 * using the old stylesheet for up to ten minutes against new HTML. That is how
 * a fix that was live on the server still showed a broken header on Marco's
 * screen. With ?v=<hash> the URL changes whenever the file does, so the
 * browser has to fetch it, and an unchanged file keeps its URL and its cache.
 *
 * Node, never the shell: these pages hold Greek and Russian.
 * ========================================================================= */
import { readFileSync, writeFileSync, existsSync, globSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const hashes = new Map();
function hashOf(abs) {
  if (!hashes.has(abs)) hashes.set(abs, createHash("sha1").update(readFileSync(abs)).digest("hex").slice(0, 10));
  return hashes.get(abs);
}

const pages = globSync("**/*.html", { cwd: ROOT })
  .filter((p) => !p.startsWith("build") && !p.includes("node_modules") && !p.startsWith("_"));

let changed = 0;
for (const rel of pages) {
  const file = path.join(ROOT, rel);
  let html = readFileSync(file, "utf8");
  const before = html;
  html = html.replace(/(<(?:link[^>]+href|script[^>]+src)=")([^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]+)?(")/g,
    (m, pre, url, post) => {
      if (/^(https?:)?\/\//.test(url)) return m;            // third-party, leave alone
      const abs = url.startsWith("/") ? path.join(ROOT, url) : path.join(path.dirname(file), url);
      if (!existsSync(abs)) return m;
      return `${pre}${url}?v=${hashOf(abs)}${post}`;
    });
  if (html !== before) { writeFileSync(file, html, "utf8"); changed++; }
}
console.log(`${changed} page(s) restamped, ${hashes.size} asset(s) hashed`);
