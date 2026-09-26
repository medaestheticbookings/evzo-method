# -*- coding: utf-8 -*-
"""Page titles and meta descriptions, English-first.

They were Greek-first, which was right while EVZO was a Greece-and-Cyprus
brand and wrong now that English matters equally. English leads the title
because that is what an English search shows; the Greek terms stay in the
description, which Google still indexes, so the Greek queries are not lost.

Run:  python tools/titles.py
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAGES = {
    "index.html": (
        u"Personalised 28-Day Meal Plan | EVZO",
        u"A 28-day meal plan built from your own numbers and the Mediterranean "
        u"food you already eat. Every calorie computed from the ingredient, never "
        u"guessed. Εξατομικευμένο διατροφικό πλάνο 28 ημερών με ελληνικό φαγητό.",
        u"Personalised 28-Day Meal Plan | EVZO",
        u"Built from your own numbers, using food you already cook. Every calorie "
        u"computed, never guessed.",
    ),
    "shop.html": (
        u"Recipe Books With the Calories Worked Out | EVZO Shop",
        u"Mediterranean recipe and training books where every calorie and macro is "
        u"computed from the ingredient rather than written by hand. From €4.99. "
        u"Συνταγές με υπολογισμένες θερμίδες και μακροθρεπτικά.",
        u"Recipe Books With the Calories Worked Out | EVZO Shop",
        u"Mediterranean recipe books where every number is computed, not claimed.",
    ),
    "blog.html": (
        u"Free Recipes With the Numbers Shown | EVZO Blog",
        u"Free Mediterranean recipes and plain nutrition explanations, with every "
        u"figure computed from the ingredient. Δωρεάν συνταγές με υπολογισμένες "
        u"θερμίδες για ελληνική και κυπριακή κουζίνα.",
        u"Free Recipes With the Numbers Shown | EVZO Blog",
        u"Mediterranean recipes and plain nutrition, with the arithmetic shown.",
    ),
    "legal.html": (
        u"Terms, Privacy & Cookie Policy | EVZO",
        u"EVZO's terms of sale, privacy policy, cookie policy and refund policy, "
        u"plus the questions people ask before buying. Όροι, απόρρητο και πολιτική "
        u"cookies.",
        u"Terms, Privacy & Cookie Policy | EVZO",
        u"Terms, privacy, cookies and refunds, written plainly.",
    ),
}

PATTERNS = (
    (u"title", re.compile(r"(<title>)(.*?)(</title>)", re.S)),
    (u"desc", re.compile(r'(<meta name="description" content=")(.*?)(">)', re.S)),
    (u"ogt", re.compile(r'(<meta property="og:title" content=")(.*?)(">)', re.S)),
    (u"ogd", re.compile(r'(<meta property="og:description" content=")(.*?)(">)', re.S)),
)

for fname, values in PAGES.items():
    path = os.path.join(ROOT, fname)
    if not os.path.exists(path):
        print("skipped (missing): " + fname)
        continue
    html = io.open(path, encoding="utf-8").read()
    for (key, pat), value in zip(PATTERNS, values):
        html, n = pat.subn(lambda m, v=value: m.group(1) + v + m.group(3), html, count=1)
        if not n:
            print("  WARNING: no %s tag in %s" % (key, fname))
    # twitter:title mirrors og:title where it exists
    html = re.sub(r'(<meta name="twitter:title" content=")(.*?)(">)',
                  lambda m: m.group(1) + values[2] + m.group(3), html, count=1)
    io.open(path, "w", encoding="utf-8").write(html)
    print("titles: " + fname)

print("\nRun `node tools/seo.mjs` next to refresh canonical tags and the sitemap.")
