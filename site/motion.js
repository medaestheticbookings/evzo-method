/* EVZO — motion
 * ===========================================================================
 * Scroll reveals and the counting stat band.
 *
 * The page renders fully without this file. The `js-reveal` class is added
 * here, at the top of the script, and only that class hides anything — so if
 * the file fails to load, or IntersectionObserver is missing, every element
 * stays visible instead of a visitor meeting a blank page. That failure mode
 * is the main reason animated sites break, and it is avoidable.
 * ======================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Nothing is hidden unless we know we can bring it back.
  if (reduced || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("js-reveal");

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  onReady(function () {
    /* ---- reveal on scroll ---------------------------------------------- */
    var targets = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
    if (targets.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);          // once, never again
        });
      }, {
        // Fire a little before the element arrives, so it has finished moving
        // by the time it is properly in view.
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.08
      });
      Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
    }

    /* ---- the stat band counts up ---------------------------------------
       Only the digits animate. If a value is not a plain number it is left
       exactly as written — a count-up that mangles "28 days" into "3 days"
       on the way is worse than no animation. */
    var band = document.getElementById("stats");
    if (!band) return;

    var counted = false;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || counted) return;
        counted = true;
        cio.disconnect();

        Array.prototype.forEach.call(band.querySelectorAll("b"), function (el) {
          var target = parseInt(String(el.textContent).replace(/\D/g, ""), 10);
          if (!isFinite(target) || target <= 0) return;
          var suffix = String(el.textContent).replace(/^[\d,\s]*/, "");
          var started = null;
          var dur = 900;

          function tick(now) {
            if (started === null) started = now;
            var p = Math.min(1, (now - started) / dur);
            // ease-out: fast at first, settles on the number
            var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
            el.textContent = v + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target + suffix;
          }
          el.textContent = "0" + suffix;
          requestAnimationFrame(tick);
        });
      });
    }, { threshold: 0.4 });
    cio.observe(band);
  });
})();
