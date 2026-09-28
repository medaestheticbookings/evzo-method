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
  /* Order of preference:
       1. the book's own Stripe Payment Link  (book.checkoutUrl)
       2. the shop-wide checkout              (ebooks.shopUrl)
       3. a pre-filled order email            — the process that exists today
     Pass the book object to get (1); a bare label still works for the bundle. */
  function buyHref(book) {
    var label = typeof book === "string" ? book : book.name;
    if (typeof book === "object" && CFG.isSet(book.checkoutUrl)) return esc(book.checkoutUrl);
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
      else if (st.kind === "workbook") { /* counted as a book, not a recipe */ }
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
    $("bundle-buy").href = buyHref(bundle);
    // The "or message us to order" fallback was removed 27 Sep 2026: the buy
    // button is the only route, so the card does not offer a second one.
    if ($("bundle-alt")) $("bundle-alt").remove();

    // Stated as a comparison with buying them separately, which is what it is.
    // It is deliberately NOT presented as a former price: nothing has ever
    // sold at that number, and under the Omnibus Directive those are two
    // different claims.
    // Books may carry their own price — the short prose guides are cheaper
    // than the recipe collections — so this sums the actual prices rather
    // than multiplying one of them by the shelf length.
    var separately = books.reduce(function (sum, b) {
      return sum + (typeof b.priceAmount === "number" ? b.priceAmount : SHOP.singlePriceAmount);
    }, 0);
    $("bundle-compare").textContent =
      T("Bought one at a time") + ": €" + separately.toFixed(2) + ".";

    /* --- category tabs ---------------------------------------------------
       Fifteen covers in one grid is a wall. The tabs are built from the
       categories actually present, so a category with no books never appears
       and adding one to config.js is the only step needed. */
    var CATS = [
      ["all",       "All"],
      ["nutrition", "Nutrition"],
      ["workouts",  "Workouts"],
      ["habits",    "Habits"]
    ];
    var tabsHost = $("shelf-tabs");
    if (tabsHost) {
      var present = CATS.filter(function (c) {
        return c[0] === "all" || books.some(function (b) { return b.category === c[0]; });
      });
      tabsHost.innerHTML = present.map(function (c, i) {
        return '<button type="button" class="shelf-tab" data-cat="' + c[0] + '"' +
               ' aria-pressed="' + (i === 0) + '">' + esc(T(c[1])) + '</button>';
      }).join("");

      if (!tabsHost.dataset.bound) {
        tabsHost.dataset.bound = "1";
        tabsHost.addEventListener("click", function (e) {
          var btn = e.target.closest(".shelf-tab");
          if (!btn) return;
          var cat = btn.dataset.cat;
          [].forEach.call(tabsHost.querySelectorAll(".shelf-tab"), function (b) {
            b.setAttribute("aria-pressed", String(b === btn));
          });
          [].forEach.call($("shelf").querySelectorAll(".book"), function (card) {
            card.hidden = !(cat === "all" || card.dataset.cat === cat);
          });
        });
      }
    }

    /* --- the shelf --- */
    $("shelf").innerHTML = books.map(function (b) {
      var s = stats && stats[b.id];
      var stat = "";
      if (s && s.kind === "workbook") {
        stat = '<div class="book-stats">' +
          '<span><b>' + s.days + '</b> ' + esc(T("days")) + '</span>' +
          '<span><b>' + s.habits + '</b> ' + esc(T("habits to choose from")) + '</span>' +
          '<span><b>' + s.reviews + '</b> ' + esc(T("weekly reviews")) + '</span>' +
        '</div>';
      } else if (s && s.kind === "training") {
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

      return '<article class="book" data-cat="' + esc(b.category || "") +
             '" data-buy="' + buyHref(b) + '">' +
        /* The real cover: a screenshot of page one of the PDF, rendered by
           tools/covers.mjs. A drawn imitation drifts from the book it is
           selling, and this one had. */
        '<img class="book-cover" src="/brand/covers/' + esc(b.file.replace(/\.pdf$/, "")) +
          '.png" alt="' + esc(T(b.name)) + '" width="800" height="1131" loading="lazy">' +
        '<h3>' + esc(T(b.name)) + '</h3>' +
        '<p>' + esc(T(b.blurb)) + '</p>' +
        stat +
        '<div class="book-buy">' +
          '<span class="book-price">' + esc(b.priceDisplay || price) + '</span>' +
          '<a class="btn" href="' + buyHref(b) + '">' + esc(T("Buy")) + '</a>' +
        '</div>' +
      '</article>';
    }).join("");

    /* The whole card is clickable, not just the button — people click covers.
       Delegated, so it survives re-render; ignores clicks that already landed
       on a link so the Buy button keeps its own behaviour. */
    var grid = $("shelf");
    if (grid && !grid.dataset.clickBound) {
      grid.dataset.clickBound = "1";
      grid.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        var card = e.target.closest(".book[data-buy]");
        if (card) window.location.href = card.dataset.buy;
      });
    }

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
  fetch("/site/shop-data.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { render(d && d.books); })
    .catch(function () { render(null); });

  /* i18n.js binds the EN/EL buttons itself and walks the text nodes that were
     in the document when it loaded. These cards are rendered afterwards, so it
     cannot see them — the same hook the sales page uses lets it ask for a
     re-render in the new language instead. */
  window.EVZO_APP = { rerender: function () { render(lastStats); } };
})();
