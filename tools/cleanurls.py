# -*- coding: utf-8 -*-
"""Clean URLs: /shop/ instead of /shop.html

    python tools/cleanurls.py

WHY. A ".html" in a URL is the file system leaking into the address bar. It
also welds the URL to the implementation: move to a framework later and every
link breaks. Directory-style URLs are what every serious site uses and what
people expect to be able to type.

HOW IT WORKS ON GITHUB PAGES. There is no rewrite rule and no .htaccess.
GitHub Pages serves `shop/index.html` when asked for `/shop/`, so the fix is
purely a matter of where the file sits.

WHAT MOVES.
    shop.html   ->  shop/index.html
    blog.html   ->  blog/index.html
    legal.html  ->  legal/index.html
    index.html      stays at the root, which is already served at /

The blog posts are generated, so tools/blog.mjs is changed to emit
blog/<slug>/index.html rather than blog/<slug>.html, at depth 2.

THE OLD URLS KEEP WORKING. Each moved page leaves a stub behind at its old
address that redirects. Nothing is indexed yet so almost nothing points at
the old URLs, but a link in a DM or an old Instagram bio should not break,
and a redirect costs one small file.

RELATIVE PATHS. A page moving from the root into a folder is one level
deeper, so every relative reference in it gains a "../". That is the part
that silently breaks a site if it is missed, so the rewrite is explicit
about which prefixes it fixes rather than doing a blind replace.
"""
import io
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MOVES = ["shop", "blog", "legal"]

# Relative prefixes that must gain a ../ when a page moves one level down.
DEEPEN = ["site/", "brand/", "content/", "starter-plan.html", "sitemap.xml", "robots.txt"]


def deepen(html):
    """Add one level to every relative reference in a page that moved down."""
    def fix(m):
        attr, quote, path = m.group(1), m.group(2), m.group(3)
        if path.startswith(("http://", "https://", "//", "#", "mailto:", "data:", "/", "../")):
            return m.group(0)
        if any(path.startswith(p) for p in DEEPEN):
            return '%s=%s../%s%s' % (attr, quote, path, quote)
        return m.group(0)

    # href, src and the srcset inside <source> all carry paths
    html = re.sub(r'\b(href|src|srcset|content)=(["\'])([^"\']+)\2', fix, html)
    return html


def relink(html, depth):
    """Point every link at the new directory URLs, from `depth` levels down."""
    up = "../" * depth
    for name in MOVES:
        # absolute, on the real domain
        html = html.replace("https://evzomethod.com/%s.html" % name,
                            "https://evzomethod.com/%s/" % name)
        # relative, from the root
        html = re.sub(r'(?<![./\w])%s\.html' % name, "%s/" % name, html)
        # relative, from one level down (already-written ../ links)
        html = html.replace("../%s.html" % name, "../%s/" % name)
    # a page inside its own folder links to itself as "./"
    return html


STUB = u"""<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Moved</title>
<link rel="canonical" href="%(base)s/%(name)s/">
<meta http-equiv="refresh" content="0; url=/%(name)s/">
<meta name="robots" content="noindex">
<p>This page has moved to <a href="/%(name)s/">/%(name)s/</a>.</p>
</html>
"""

BASE = "https://evzomethod.com"


def main():
    for name in MOVES:
        src = os.path.join(ROOT, name + ".html")
        if not os.path.exists(src):
            print("already moved or missing: " + name + ".html")
            continue
        folder = os.path.join(ROOT, name)
        os.makedirs(folder, exist_ok=True)
        html = io.open(src, encoding="utf-8").read()
        html = deepen(html)
        html = relink(html, depth=1)
        io.open(os.path.join(folder, "index.html"), "w", encoding="utf-8").write(html)
        # leave a redirect behind at the old address
        io.open(src, "w", encoding="utf-8").write(STUB % {"base": BASE, "name": name})
        print("moved %s.html -> %s/index.html  (stub left behind)" % (name, name))

    # the root page and the preview only need their links repointed
    for name in ("index.html", "_preview-reviews.html", "starter-plan.html"):
        p = os.path.join(ROOT, name)
        if not os.path.exists(p):
            continue
        html = io.open(p, encoding="utf-8").read()
        io.open(p, "w", encoding="utf-8").write(relink(html, depth=0))
        print("relinked " + name)

    print("\nNow run:  node tools/blog.mjs && node tools/seo.mjs")


if __name__ == "__main__":
    main()
