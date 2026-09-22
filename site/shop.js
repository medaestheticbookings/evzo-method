/* EVZO — the shop page
 * ===========================================================================
 * Renders from two sources and invents nothing:
 *
 *   config.js          prices, names, blurbs, the shop URL
 *   shop-data.json     recipe counts and calorie ranges, WRITTEN BY
 *                      ebooks/build.mjs from the actual recipe data
 *
 * A number shown on a card is therefore the same number printed in the PDF.
 * If a book gains a recipe, rerun the ebook build and this page follows. Do
 * not hard-code a count here to save a fetch — that is exactly how a shop ends
 * up advertising twelve recipes in a book that has nine.
 * ======================================================================== */
(function () {
  "use strict";

  var CFG = window.EVZO_CONFIG;
  var T = window.EVZO_T || function (s) { return s; };
  var SHOP = CFG.ebooks;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  /* Where a buy button goes. Stripe is not connected yet and fulfilment is
     manual, so rather than a dead button or a fake checkout the fallback is a
     pre-filled email — which is the process that actually exists today. */
  function buyHref(label) {
    if (CFG.isSet(SHOP.shopUrl)) return esc(SHOP.shopUrl);
    var to = CFG.business && CFG.business.supportEmail;
    if (!to) return esc(CFG.links.instagram);
    return "mailto:" + to +
      "?subject=" + encodeURIComponent("EVZO order — " + label) +
      "&body=" + encodeURIComponent(
        "Hello,\n\nI would like to order: " + label + "\n\n" +
        "Please send me the payment link.\n\nThank you.");
  }

  /* ---------------------------------------------------------------- data */
  var lastStats = null;

  function render(stats) {
    lastStats = stats;
    var books = SHOP.books;
    var price = SHOP.singlePriceDisplay;

    /* --- the trust line, counted rather than claimed --- */
    var totalRecipes = 0, totalPlans = 0, counted = 0;
    books.forEach(function (b) {
      var st = stats && stats[b.id];
      if (!st) return;
      counted++;
      if (st.kind === "training") totalPlans += st.plans;
      else totalRecipes += st.count;
    });
    $("t-books").textContent = books.length + " " + T("books");
    // Only claim a total when every book actually reported one.
    if (counted === books.length) {
      var parts = [];
      if (totalRecipes) parts.push(totalRecipes + " " + T("recipes"));
      if (totalPlans) parts.push(totalPlans + " " + T("training plans"));
      $("t-recipes").textContent = parts.join(" · ");
    } else {
      $("t-recipes").textContent = T("Every figure computed");
    }

    /* --- the bundle --- */
    var bundle = SHOP.bundle;
    $("bundle-price").textContent = bundle.priceDisplay + " " + T("for all") + " " + books.length;
    $("bundle-note").textContent = T(bundle.blurb);
    $("bundle-buy").textContent = T("Get the whole library");
    $("bundle-buy").href = buyHref(bundle.name);

    // Stated as a comparison with buying them separately, which is what it is.
    // It is deliberately NOT presented as a former price: nothing has ever
    // sold at that number, and under the Omnibus Directive those are two
    // different claims.
    var separately = (books.length * SHOP.singlePriceAmount);
    $("bundle-compare").textContent =
      T("Bought one at a time") + ": €" + separately.toFixed(2) + ".";

    /* --- the shelf --- */
    $("shelf").innerHTML = books.map(function (b) {
      var s = stats && stats[b.id];
      var stat = "";
      if (s && s.kind === "training") {
        stat = '<div class="book-stats">' +
          '<span><b>' + s.plans + '</b> ' + esc(T("plans")) + '</span>' +
          '<span><b>' + s.minDays + '–' + s.maxDays + '</b> ' + esc(T("days a week")) + '</span>' +
          '<span><b>' + s.activities + '</b> ' + esc(T("activities costed")) + '</span>' +
        '</div>';
      } else if (s) {
        stat = '<div class="book-stats">' +
          '<span><b>' + s.count + '</b> ' + esc(T("recipes")) + '</span>' +
          '<span><b>' + s.minKcal + '–' + s.maxKcal + '</b> ' + esc(T("kcal a serving")) + '</span>' +
          '<span><b>' + s.avgProtein + ' g</b> ' + esc(T("protein, average")) + '</span>' +
        '</div>';
      }

      return '<article class="book">' +
        '<div class="book-cover">' +
          '<span class="label">' + esc(T(b.eyebrow)) + '</span>' +
          '<div class="h">' + esc(T(b.coverTitle || b.name)) + '</div>' +
          '<div class="foot">evzo · ευ ζω</div>' +
        '</div>' +
        '<h3>' + esc(T(b.name)) + '</h3>' +
        '<p>' + esc(T(b.blurb)) + '</p>' +
        stat +
        '<div class="book-buy">' +
          '<span class="book-price">' + esc(price) + '</span>' +
          '<a class="btn" href="' + buyHref(b.name) + '">' + esc(T("Buy")) + '</a>' +
        '</div>' +
      '</article>';
    }).join("");

    /* --- the questions people actually ask --- */
    var ful = CFG.fulfilment || {};
    var faq = [
      [T("How do I get the book after I pay?"),
       T("As a PDF, by email") + (CFG.isSet(ful.turnaroundText) ? ", " + T(ful.turnaroundText) : "") + ". " +
       T("It is a file, not a subscription. Download it once and it is yours on every device you own.")],
      [T("Is this the same as the personalised guide?"),
       T("No. The books are fixed recipe collections at the same price for everyone. The guide is built from your own answers — your body, your goal, the food you actually eat — and it costs more because it is made for one person.")],
      [T("Can I get a refund?"),
       T("Digital files come with a 14-day right of withdrawal in the EU, which you waive at checkout if you ask for the download immediately. If a file is broken or does not arrive, tell us and we will fix it or refund it.")],
      [T("Are the recipes in Greek?"),
       T("Every recipe carries its Greek name. The method and the notes are in English for now.")],
      [T("Who worked out the numbers?"),
       T("A program did, from a table of standard published values for each ingredient. Nobody typed a calorie figure by hand and no language model estimated one. That is the whole point of the format.")],
      [T("Do I need to weigh everything forever?"),
       T("No. Weigh for two weeks and you will not need to again — the point of the scales is to calibrate your eye, not to live on your worktop.")]
    ];
    $("shop-faq").innerHTML = faq.map(function (q) {
      return "<details><summary>" + esc(q[0]) + "</summary><p>" + esc(q[1]) + "</p></details>";
    }).join("");

    /* --- the legal line, same source as every other page --- */
    if ($("legal-full")) $("legal-full").textContent = T(CFG.disclaimerFull || "");
  }

  /* shop-data.json is generated; if it is missing the page still renders,
     just without the counts. Better a card with no figure than a made-up one. */
  fetch("site/shop-data.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { render(d && d.books); })
    .catch(function () { render(null); });

  /* i18n.js binds the EN/EL buttons itself and walks the text nodes that were
     in the document when it loaded. These cards are rendered afterwards, so it
     cannot see them — the same hook the sales page uses lets it ask for a
     re-render in the new language instead. */
  window.EVZO_APP = { rerender: function () { render(lastStats); } };
})();
