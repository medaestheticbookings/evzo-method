"""EVZO — web image set

    python tools/images.mjs.py

The photography in photos/ is 1080x1920 portrait at ~300 KB each, which is the
Instagram shape and far too heavy for a landing page. This makes the copies the
website actually serves: cropped to the aspect the layout wants, resized to the
largest size it is ever displayed at, and re-encoded.

Output goes to site/img/ — which, unlike photos/, is NOT gitignored, because
these are part of the website.

Each entry is (source, output name, target width, target height). The crop is
centred horizontally and biased towards the upper-middle vertically, because in
a portrait food photograph the dish sits above centre far more often than not.
"""

import io
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "photos")
OUT = os.path.join(ROOT, "site", "img")

os.makedirs(OUT, exist_ok=True)

# name, w, h, vertical_focus (0 = top, .5 = centre, 1 = bottom)
JOBS = [
    ("spread",          "hero",         1100,  900, 0.50),
    ("salad-greek",     "week-1",        660,  660, 0.50),
    ("chicken-grilled", "week-2",        660,  660, 0.50),
    ("yogurt-bowl",     "week-3",        660,  660, 0.50),
    ("fish-grilled",    "week-4",        660,  660, 0.45),
    ("chickpeas",       "week-5",        660,  660, 0.50),
    ("octopus-salad",   "week-6",        660,  660, 0.50),
    ("market",          "step-1",        760,  520, 0.50),
    ("olive-oil",       "step-2",        760,  520, 0.50),
    ("basket",          "step-3",        760,  520, 0.45),
    ("fish-grilled",    "cta",          1400,  620, 0.45),
]


def crop_resize(img, w, h, vfocus):
    """Centre-crop to the target ratio, then resize down to it."""
    tw, th = w, h
    sw, sh = img.size
    target = tw / th
    source = sw / sh

    if source > target:
        # source is wider: trim the sides
        nw = int(round(sh * target))
        left = (sw - nw) // 2
        box = (left, 0, left + nw, sh)
    else:
        # source is taller: trim top and bottom around the focus point
        nh = int(round(sw / target))
        top = int(round((sh - nh) * vfocus))
        top = max(0, min(sh - nh, top))
        box = (0, top, sw, top + nh)

    return img.crop(box).resize((tw, th), Image.LANCZOS)


def save_best(img, path_noext, quality=74):
    """Write JPEG and WebP; report both so the page can pick with <picture>."""
    jpg = path_noext + ".jpg"
    webp = path_noext + ".webp"
    img.convert("RGB").save(jpg, "JPEG", quality=quality, optimize=True, progressive=True)
    img.convert("RGB").save(webp, "WEBP", quality=quality, method=6)
    return os.path.getsize(jpg), os.path.getsize(webp)


total_j = total_w = 0
for src, name, w, h, vf in JOBS:
    p = os.path.join(SRC, src + ".jpg")
    if not os.path.exists(p):
        print("missing source:", p)
        continue
    with Image.open(p) as im:
        im.load()
        out = crop_resize(im, w, h, vf)
        sj, sw_ = save_best(out, os.path.join(OUT, name))
    total_j += sj
    total_w += sw_
    print(f"{name:10s} {w}x{h}  jpg {sj//1024:4d} KB   webp {sw_//1024:4d} KB")

print(f"\ntotal: jpg {total_j//1024} KB, webp {total_w//1024} KB")
print("written to site/img/")
