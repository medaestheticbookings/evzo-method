/* EVZO, email capture
 * ============================================================================
 * Most visitors leave without buying and, until this file, left without a
 * trace: the only email box on the site opened the visitor's own mail app with
 * a pre-written message, which almost nobody sends. A cold ad converts one or
 * two people in a hundred; the other ninety-eight were unreachable.
 *
 * WHEN IT APPEARS
 *   1. Right after the visitor sees their own numbers. That is the moment they
 *      care most, and the offer, a plan built on those numbers, follows from
 *      what is on the screen rather than interrupting it.
 *   2. Otherwise on exit intent on desktop, or after 45 seconds of reading on a
 *      phone, for people who leave before finishing the questions.
 *   Never more than once a session, never again after they have signed up or
 *   closed it twice, and never over the cookie bar.
 *
 * WHAT IS SENT
 *   The email address, the language, and, only if they finished the questions,
 *   the goal and the calorie and protein ranges, because those are what the
 *   plan is written from. Never the weight, the height, the age, or any of the
 *   safety answers. The ranges are derived figures, not the inputs, and the
 *   request is the visitor's own, made with an unticked box they tick.
 *
 * WHERE IT GOES
 *   Web3Forms, which relays the submission to the support inbox. A static site
 *   has nowhere of its own to keep an address. Until a key is set in config.js
 *   the form falls back to the old mailto, so nothing is lost meanwhile.
 * ========================================================================= */
(function (root) {
  "use strict";

  var CFG = root.EVZO_CONFIG || {};
  var T = function (s) { return (root.EVZO_T || function (x) { return x; })(s); };
  var KEY_SEEN = "evzo.capture.seen";       // sessionStorage: shown this visit
  var KEY_DONE = "evzo.capture.done";       // localStorage: signed up, never again
  var KEY_NOPE = "evzo.capture.dismissed";  // localStorage: closed, counts up
  var shown = false;

  function get(store, k) { try { return root[store].getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { root[store].setItem(k, v); } catch (e) {} }

  function allowed() {
    if (shown) return false;
    if (get("localStorage", KEY_DONE)) return false;
    if (Number(get("localStorage", KEY_NOPE) || 0) >= 2) return false;
    if (get("sessionStorage", KEY_SEEN)) return false;
    /* Not on top of the cookie bar: one decision at a time. Asked of the
       consent manager rather than read off the page, because consent.js slides
       the bar away first and sets [hidden] a beat later, and a DOM check in
       that gap concluded the bar was still up and blocked the popup for good. */
    if (root.EVZO_CONSENT && !root.EVZO_CONSENT.answered()) {
      // Try again once they have dealt with it, rather than losing the moment.
      if (root.EVZO_CONSENT.onChange && !allowed._waiting) {
        allowed._waiting = true;
        root.EVZO_CONSENT.onChange(function () { setTimeout(function () { open(allowed._reason || "timed"); }, 1200); });
      }
      return false;
    }
    return true;
  }

  /* What we know about this visitor's numbers, if they finished. Derived ranges
     only, read off the result panel as displayed, so nothing here can reach the
     raw inputs or the safety answers even by accident. */
  function snapshot() {
    var r = document.getElementById("result");
    if (!r || r.hidden) return null;
    var txt = function (id) { var e = document.getElementById(id); return e ? e.textContent.trim() : ""; };
    return { goal: txt("r-goal"), calories: txt("r-kcal"), protein: txt("r-pro") };
  }

  function build(withNumbers) {
    var el = document.createElement("div");
    el.className = "capture";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "cap-h");
    el.innerHTML =
      '<div class="capture-card">' +
        '<button type="button" class="capture-x" aria-label="' + T("Close") + '">&times;</button>' +
        '<span class="label">' + T("Free") + '</span>' +
        '<h2 id="cap-h">' + T(withNumbers ? "Want the first three days written out?" : "Before you go, a free three-day plan") + '</h2>' +
        '<p class="lede">' + T(withNumbers
          ? "Three days of meals built on the numbers you just saw, with the shopping list. Sent to your inbox within 24 hours."
          : "Three days of Mediterranean meals with the portions worked out, and the shopping list. Sent to your inbox within 24 hours.") + '</p>' +
        '<form class="capture-form" novalidate>' +
          '<label class="sr-only" for="cap-email">' + T("Email address") + '</label>' +
          '<input type="email" id="cap-email" autocomplete="email" required placeholder="you@example.com">' +
          '<button type="button" class="opt capture-tick" aria-pressed="false">' +
            '<span class="box" aria-hidden="true"></span>' +
            '<span><span class="t">' + T("Send me the plan, and occasional emails from EVZO. I can unsubscribe in one click.") + '</span></span>' +
          '</button>' +
          '<button type="submit" class="btn btn-lg">' + T("Send me the plan") + '</button>' +
          '<p class="capture-said" hidden></p>' +
        '</form>' +
        '<p class="note">' + T("No spam. Your health answers are never sent.") + '</p>' +
      '</div>';
    return el;
  }

  function open(reason) {
    allowed._reason = reason;
    if (!allowed()) return;
    shown = true;
    set("sessionStorage", KEY_SEEN, "1");

    var withNumbers = reason === "result";
    var numbers = withNumbers ? snapshot() : null;
    var el = build(withNumbers);
    document.body.appendChild(el);
    /* Fade in off a forced reflow, not requestAnimationFrame. rAF is paused in
       a background tab, so a popup that triggered there sat at opacity 0: an
       invisible full-screen layer swallowing every click on the page. */
    void el.offsetWidth;
    el.classList.add("on");

    var input = el.querySelector("#cap-email");
    var tick = el.querySelector(".capture-tick");
    var said = el.querySelector(".capture-said");
    var form = el.querySelector("form");
    var agreed = false;
    var lastFocus = document.activeElement;

    function close(dismissed) {
      el.classList.remove("on");
      setTimeout(function () { el.remove(); }, 220);
      if (dismissed) set("localStorage", KEY_NOPE, String(Number(get("localStorage", KEY_NOPE) || 0) + 1));
      document.removeEventListener("keydown", onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) { if (e.key === "Escape") close(true); }

    el.querySelector(".capture-x").addEventListener("click", function () { close(true); });
    el.addEventListener("click", function (e) { if (e.target === el) close(true); });
    document.addEventListener("keydown", onKey);
    tick.addEventListener("click", function () {
      agreed = !agreed;
      tick.setAttribute("aria-pressed", String(agreed));
    });
    setTimeout(function () { input.focus(); }, 60);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        said.textContent = T("That does not look like an email address.");
        said.hidden = false; input.focus(); return;
      }
      /* The box is never pre-ticked and the form will not send without it:
         silence is not consent (Planet49, C-673/17). */
      if (!agreed) {
        said.textContent = T("Tick the box so we are allowed to email you.");
        said.hidden = false; return;
      }

      var lang = document.documentElement.getAttribute("lang") || "el";
      var payload = {
        email: email,
        language: lang,
        source: withNumbers ? "after result" : "exit / timed",
        page: location.pathname
      };
      if (numbers) {
        payload.goal = numbers.goal;
        payload.calories = numbers.calories;
        payload.protein = numbers.protein;
      }

      var key = CFG.integrations && CFG.integrations.web3formsKey;
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;

      if (!key || /TODO/.test(key)) {
        // No relay yet: fall back to the mail app so the address is not lost.
        var to = CFG.business && CFG.business.supportEmail;
        if (to) {
          location.href = "mailto:" + to + "?subject=" + encodeURIComponent("EVZO, 3-day plan") +
            "&body=" + encodeURIComponent(Object.keys(payload).map(function (k) { return k + ": " + payload[k]; }).join("\n"));
        }
        done();
        return;
      }

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.assign({
          access_key: key,
          subject: "EVZO, 3-day plan request (" + lang + ")",
          from_name: "evzomethod.com",
          botcheck: ""
        }, payload))
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.success) done();
        else fail();
      }).catch(fail);

      function done() {
        set("localStorage", KEY_DONE, "1");
        form.innerHTML = '<p class="capture-ok">' + T("Done. Check your inbox within 24 hours, and the spam folder if it is not there.") + '</p>';
        if (root.EVZO_PIXEL) root.EVZO_PIXEL.track("Lead");
        setTimeout(function () { close(false); }, 3200);
      }
      function fail() {
        btn.disabled = false;
        said.textContent = T("That did not go through. Try again, or email evzo.method@outlook.com.");
        said.hidden = false;
      }
    });
  }

  /* ---------- triggers --------------------------------------------------- */
  root.EVZO_CAPTURE = { open: open };

  // 1. After the result. app.js reveals #result; watch for it.
  document.addEventListener("DOMContentLoaded", function () {
    var r = document.getElementById("result");
    if (r && root.MutationObserver) {
      new MutationObserver(function () {
        if (!r.hidden) setTimeout(function () { open("result"); }, 4500);
      }).observe(r, { attributes: true, attributeFilter: ["hidden"] });
    }

    // 2a. Exit intent, desktop: the pointer leaving through the top edge.
    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget && e.clientY <= 0) open("exit");
    });

    // 2b. Phones have no exit intent, so time on page stands in for it.
    if (root.matchMedia && root.matchMedia("(pointer: coarse)").matches) {
      setTimeout(function () { open("timed"); }, 45000);
    }
  });
})(window);
