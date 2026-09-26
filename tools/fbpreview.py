# -*- coding: utf-8 -*-
"""Preview a Facebook cover the way Facebook actually shows it.

    python tools/fbpreview.py

Renders each cover twice — once cropped as desktop shows it, once as mobile
does — with the profile picture drawn on top in its real position. Guessing
at this is how you end up with a headline sitting behind a circular avatar.

Geometry, measured from a 1640 x 856 upload:

  desktop   shows 820 x 312   -> keeps full width, cuts ~116px top and bottom
                                 profile picture bottom LEFT
  mobile    shows 640 x 360   -> keeps full height, cuts ~59px each side
                                 profile picture bottom CENTRE

Output goes to brand/_preview/ which is gitignored - it is a checking tool,
not an asset.
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, "brand")
OUT = os.path.join(BRAND, "_preview")
os.makedirs(OUT, exist_ok=True)

COVERS = ["fb-band", "fb-bright", "fb-three", "fb-type"]


def crop_to(img, aspect):
    """Centre-crop to an aspect ratio, exactly as Facebook does."""
    w, h = img.size
    if w / h > aspect:          # too wide: cut the sides
        nw = int(round(h * aspect))
        left = (w - nw) // 2
        return img.crop((left, 0, left + nw, h))
    nh = int(round(w / aspect))  # too tall: cut top and bottom
    top = (h - nh) // 2
    return img.crop((0, top, w, top + nh))


def avatar(img, where):
    """Draw the profile picture over the cover, where Facebook puts it."""
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    r = int(h * 0.56)                      # diameter, about 56% of cover height
    if where == "left":
        cx = int(w * 0.12)
    else:
        cx = w // 2
    cy = int(h * 0.92)                     # hangs off the bottom edge
    box = (cx - r // 2, cy - r // 2, cx + r // 2, cy + r // 2)
    d.ellipse(box, fill=(255, 30, 30, 150), outline=(255, 255, 255, 230), width=6)
    d.text((box[0] + 14, cy - 10), "PROFILE PIC", fill=(255, 255, 255, 255))
    return img


for name in COVERS:
    src = os.path.join(BRAND, name + ".png")
    if not os.path.exists(src):
        print("missing: " + name)
        continue
    with Image.open(src) as im:
        im = im.convert("RGB")

        desktop = crop_to(im.copy(), 820 / 312).resize((820, 312), Image.LANCZOS)
        desktop = avatar(desktop, "left")
        desktop.save(os.path.join(OUT, name + "-desktop.png"))

        mobile = crop_to(im.copy(), 640 / 360).resize((640, 360), Image.LANCZOS)
        mobile = avatar(mobile, "centre")
        mobile.save(os.path.join(OUT, name + "-mobile.png"))

        print("previewed " + name)

print("\nbrand/_preview/ — the red circle is where the profile picture sits.")
print("Anything under it is not visible on a real Page.")
