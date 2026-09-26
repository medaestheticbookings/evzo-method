# -*- coding: utf-8 -*-
"""Facebook versions of the Instagram captions.

    python tools/fbcaptions.py

Auto-sharing an Instagram post to a Facebook Page copies the caption
verbatim, and an Instagram caption is wrong on Facebook in three specific
ways:

  "link in bio"   Facebook allows real, clickable links. Telling someone to
                  go and look at a bio is throwing away the one thing
                  Facebook does better.
  the hashtag wall
                  On Instagram a dozen hashtags in the first comment is
                  normal and it works. On Facebook it reads as spam and
                  does close to nothing for reach. Two or three, at most.
  "SWIPE"         A carousel becomes an album on Facebook. There is nothing
                  to swipe.

So each bundle gets a CAPTION-FB.txt beside its CAPTION.txt. Same writing,
adjusted for where it is going.

Nothing is rewritten by hand: the transform is mechanical, so a change to
the Instagram caption carries straight through on the next run.
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "build")

URL = "https://evzomethod.com"

# Hashtags worth keeping on Facebook. Everything else is dropped.
KEEP_TAGS = {"#evzo", "#greekfood", "#cyprusfood", "#mealprep", "#healthyeating"}


def convert(text):
    body, _, tail = text.partition("---FIRST COMMENT---")
    body = body.rstrip()

    # 1. real links instead of a bio pointer
    body = re.sub(r"evzomethod\.com\s*[-—–]\s*link in bio\.?", URL, body, flags=re.I)
    body = re.sub(r"\blink in bio\b\.?", URL, body, flags=re.I)
    # any bare domain becomes a clickable one
    body = re.sub(r"(?<!//)\bevzomethod\.com\b(?!/)", URL, body)

    # 2. swipe language makes no sense in an album
    body = re.sub(r"\bswipe\b", "scroll", body, flags=re.I)

    # 3. a short, human tag line rather than a wall
    tags = [t for t in re.findall(r"#\w+", tail) if t.lower() in KEEP_TAGS]
    seen, ordered = set(), []
    for t in tags:
        if t.lower() not in seen:
            seen.add(t.lower())
            ordered.append(t)

    out = body
    if ordered:
        out += "\n\n" + " ".join(ordered[:3])
    return out + "\n"


def main():
    if not os.path.isdir(BUILD):
        print("no build/ directory")
        return
    n = 0
    for name in sorted(os.listdir(BUILD)):
        if not name.startswith("TO-POST"):
            continue
        folder = os.path.join(BUILD, name)
        src = os.path.join(folder, "CAPTION.txt")
        if not os.path.exists(src):
            continue
        text = io.open(src, encoding="utf-8").read()
        io.open(os.path.join(folder, "CAPTION-FB.txt"), "w",
                encoding="utf-8").write(convert(text))
        print("  %s/CAPTION-FB.txt" % name)
        n += 1
    print("\nwrote %d Facebook caption(s)" % n)
    print("Post the same images; paste CAPTION-FB.txt instead of CAPTION.txt.")


if __name__ == "__main__":
    main()
