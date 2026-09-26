# -*- coding: utf-8 -*-
"""Normalise every internal link to a root-relative URL.

    python tools/normalise-links.py

Chasing "../" counts across four directory depths is how a site ends up with
a link that works on one page and 404s on another — and it already had, after
the move to directory URLs.

The site is served at the root of evzomethod.com, so a root-relative path
("/shop/") means exactly one thing from every page at every depth. That kills
the whole class of bug. Assets keep their relative paths, because those are
generated with the right depth by the tools that emit them; only the internal
page links are rewritten.

Safe to run repeatedly.
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Directories the generated HTML lives in, plus the root itself.
SKIP_DIRS = {".git", "node_modules", "ebooks", "photos", "posts", "build", "content", "site", "brand", "tools"}

# old form -> canonical root-relative form
RULES = [
    (r'(?:\.\./)*index\.html(#[\w-]+)?', lambda m: "/" + (m.group(1) or "")),
    (r'(?:\.\./)*shop\.html(#[\w-]+)?',  lambda m: "/shop/" + (m.group(1) or "")),
    (r'(?:\.\./)*blog\.html(#[\w-]+)?',  lambda m: "/blog/" + (m.group(1) or "")),
    (r'(?:\.\./)*legal\.html(#[\w-]+)?', lambda m: "/legal/" + (m.group(1) or "")),
    # posts moved into their own folders
    (r'(?:\.\./)*blog/([a-z0-9-]+)\.html', lambda m: "/blog/%s/" % m.group(1)),
    # directory links, relative or bare, made absolute. A bare "shop/" inside
    # /shop/index.html resolved to /shop/shop/, which is the exact bug
    # root-relative links exist to prevent.
    (r'(?:\.\./)*(shop|blog|legal)/', lambda m: "/%s/" % m.group(1)),
]


def fix(html):
    # Only inside href="..." so nothing in body copy or JSON-LD is mangled.
    def one(m):
        quote, path = m.group(1), m.group(2)
        if path.startswith(("http://", "https://", "//", "mailto:", "tel:", "data:", "#")):
            return m.group(0)
        for pat, rep in RULES:
            new, n = re.subn("^" + pat + "$", rep, path)
            if n:
                return 'href=%s%s%s' % (quote, new, quote)
        return m.group(0)

    return re.sub(r'href=(["\'])([^"\']*)\1', one, html)


def main():
    changed = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for f in filenames:
            if not f.endswith(".html"):
                continue
            p = os.path.join(dirpath, f)
            before = io.open(p, encoding="utf-8").read()
            after = fix(before)
            if after != before:
                io.open(p, "w", encoding="utf-8").write(after)
                changed += 1
                print("  " + os.path.relpath(p, ROOT).replace("\\", "/"))
    print("\nnormalised %d file(s)" % changed)


if __name__ == "__main__":
    main()
