/* EVZO — central configuration
 * ============================================================================
 * Every price, timing, policy and business detail the page displays lives HERE
 * and nowhere else. Change a value in this file and the whole page follows.
 *
 * >>> OWNER: every entry marked TODO_OWNER is a placeholder. The page renders a
 * >>> visible "not set" marker wherever one is still unfilled, so nothing
 * >>> invented ever reaches a customer. Fill them in before going live.
 * ========================================================================== */

(function (root) {
  "use strict";

  var TODO = null; // an unset value — the UI shows a marker instead of inventing one

  var CONFIG = {

    /* ---- product & price ------------------------------------------------ */
    // No checkout is connected yet, so this price is presentation-only. When
    // Stripe is wired up, this must match the Stripe Price object exactly, and
    // the server must re-read the amount from Stripe rather than trusting the
    // client. See INTEGRATION.md.
    product: {
      id: "evzo-nutrition-guide",
      name: "Personalised Nutrition & Meal-Planning Guide",

      // What the customer pays today.
      priceAmount: 39.99,
      priceCurrency: "EUR",
      priceDisplay: "€39.99",

      // The regular price, shown struck through beside the launch price.
      //
      // >>> TODO_OWNER — READ THIS BEFORE GOING LIVE.
      // Under the EU Omnibus Directive a "was" price must be the lowest price
      // actually charged in the 30 days before the offer. Nothing has ever sold
      // at 59.99, so showing it struck through on day one is a price claim you
      // cannot yet support. Two honest ways to run this:
      //   (a) set launch.endsAt to a real date, genuinely move to 59.99 when it
      //       passes, and keep the evidence; or
      //   (b) set launch.active = false and simply sell at 39.99 with no
      //       strike-through until a real 59.99 trading history exists.
      // Option (b) is the safe one for a first launch.
      regularPriceAmount: 59.99,
      regularPriceDisplay: "€59.99",

      launch: {
        // Off, 20 Sep 2026: the card shows one honest price. Nothing has ever
        // sold at 59.99, so a strike-through against it is a price claim with no
        // trading history behind it, and an offer with no end date is an
        // indefinite discount. To run a real launch instead, set active back to
        // true AND give endsAt a date you will genuinely honour, e.g.
        // "2026-10-31" — then actually move the price to 59.99 when it passes
        // and keep the evidence.
        active: false,
        endsAt: TODO,
        label: "Launch offer"
      },

      oneTime: true,
      // TODO_OWNER: Stripe Price ID, e.g. "price_1AbC..."
      stripePriceId: TODO,

      // What the customer actually receives. Rendered on the pricing card.
      includes: [
        "A goal-based nutrition guide",
        "Suggested daily calories and macronutrient targets",
        "A full 28-day meal plan, matched to your preferences",
        "Portion guidance",
        "Shopping list",
        "Practical tips for staying consistent",
        "Digital PDF delivery after you complete the questionnaire"
      ]
    },

    /* ---- the three packages --------------------------------------------
       One guide a month, for one, three or six months. The longer packages
       exist because the arithmetic genuinely changes as someone's weight does:
       a calorie target set at 95 kg is wrong by month three, and a rebuilt
       guide is a real deliverable rather than a discount dressed as one.

       `compareToMonths` is what the saving is measured against — the 28-day
       price multiplied out. It is a comparison with a price this page really
       charges, NOT a former price, and the copy must keep saying so.

       TODO_OWNER: fulfilment is manual. Selling six months commits you to
       building six guides for that person. Do not switch these on until you
       are willing to do that on the busiest month, not the quietest. */
    packages: [
      {
        id: "m1", months: 1,
        name: "28 days",
        priceAmount: 39.99, priceDisplay: "€39.99",
        summary: "One month, built from your answers.",
        includes: [
          "A personalised 28-day guide",
          "Calorie and protein targets from your own measurements",
          "Meals filtered by your allergies, dislikes and cooking time",
          "A weekly shopping list"
        ],
        stripePriceId: TODO
      },
      {
        id: "m3", months: 3,
        name: "3 months",
        priceAmount: 89, priceDisplay: "€89",
        recommended: true,
        summary: "Three guides, rebuilt each month as your numbers move.",
        includes: [
          "Everything in 28 days, three times over",
          "Rebuilt monthly — targets recalculated as your weight changes",
          "A check-in before each rebuild, so it follows what actually happened",
          "Different meals each month, so month three is not month one again"
        ],
        stripePriceId: TODO
      },
      {
        id: "m6", months: 6,
        name: "6 months",
        priceAmount: 149, priceDisplay: "€149",
        summary: "Six months, plus every ebook in the shop.",
        includes: [
          "Everything in 3 months, for six months",
          "The whole ebook library — every recipe and training book",
          "Six months is long enough for the result to be the habit, not the month"
        ],
        stripePriceId: TODO
      }
    ],

    // Checkout order bump. Shown as an optional, never-preselected extra.
    orderBump: {
      id: "evzo-healthy-recipes-ebook",
      name: "Healthy Recipes eBook",
      priceAmount: 9.99,
      priceCurrency: "EUR",
      priceDisplay: "€9.99",
      blurb: "A separate recipe collection in the same format. Optional — your guide is complete without it.",
      stripePriceId: TODO         // TODO_OWNER
    },

    // Post-purchase upsell. Offered AFTER payment, never as a gate.
    upsell: {
      id: "evzo-30day-variety",
      name: "30-Day Meal Variety Bundle",
      priceAmount: 29,
      priceCurrency: "EUR",
      priceDisplay: "€29",
      blurb: "Four more weeks of structures and swaps so the guide does not repeat.",
      stripePriceId: TODO         // TODO_OWNER
    },

    /* ---- the site itself, for search engines ---------------------------
       TODO_OWNER: baseUrl is the single thing standing between this site and
       working SEO. Set it to the live origin with no trailing slash, e.g.
       "https://evzo.gr", then run:  node tools/seo.mjs
       That writes canonical tags, sitemap.xml and robots.txt across the site.
       Until it is set, nothing invents a URL: canonicals are omitted rather
       than pointed somewhere wrong, which is worse than having none. */
    site: {
      baseUrl: "https://evzomethod.com",
      name: "EVZO",
      legalName: "EVZO METHOD",
      locale: "en",
      altLocale: "el",
      // Where the brand is actually read. Used for geo-targeting hints only.
      regions: ["CY", "GR"]
    },

    /* ---- the ebook shop -------------------------------------------------
       Every book EVZO sells, in the order the shop lists them. This is the
       single source of truth: the shop page renders from it, and build.mjs
       reads the same list when it prints the back page into each PDF, so a
       price can never say one thing on the site and another in the book.

       `file` is the PDF that ebooks/build.mjs produces. If you rename a book
       there, rename it here or the download will 404.

       TODO_OWNER: each `stripePriceId` is the Stripe Price object for that
       book. Until they are filled in, the shop's buttons fall back to an
       email order, which is honest while fulfilment is still manual. */
    ebooks: {
      // TODO_OWNER: the public shop URL once EVZO has a domain, e.g.
      // "https://evzo.gr/shop". Until then the books and buttons fall back to
      // links.instagram, which is somewhere a reader can actually arrive.
      shopUrl: TODO,
      currency: "EUR",
      singlePriceAmount: 9.99,
      singlePriceDisplay: "\u20AC9.99",

      books: [
        {
          id: "workbook", coverTitle: "Three habits, twenty-eight days", name: "The 28-Day Workbook", file: "EVZO-Workbook.pdf",
          eyebrow: "Build the habit",
          blurb: "A workbook to write in, not read. Three habits, thirty seconds a day, four weekly reviews — and an honest look at which habits actually fit your life.",
          stripePriceId: TODO
        },
        {
          id: "workouts", coverTitle: "Five plans, no guesswork", name: "Workout Plans", file: "EVZO-Workout-Plans.pdf",
          eyebrow: "Training",
          blurb: "Five plans from three days a week to five, with the calories each session burns estimated from published MET values — and the margin of error printed beside them.",
          stripePriceId: TODO
        },
        {
          id: "oats", coverTitle: "Oats, fourteen ways", name: "Oat Recipes", file: "EVZO-Oat-Recipes.pdf",
          eyebrow: "Breakfast",
          blurb: "Fourteen ways to eat oats that are not porridge \u2014 overnight jars, baked oats, savoury bowls, pancakes and bars.",
          stripePriceId: TODO
        },
        {
          id: "eggs", coverTitle: "The cheapest protein there is", name: "Egg Recipes", file: "EVZO-Egg-Recipes.pdf",
          eyebrow: "The cheapest protein there is",
          blurb: "Fourteen egg dishes, from strapatsada to a protein box that needs no reheating. Six eggs is a dinner for four.",
          stripePriceId: TODO
        },
        {
          id: "bowls", coverTitle: "One bowl, thirty grams", name: "High-Protein Bowls", file: "EVZO-Protein-Bowls.pdf",
          eyebrow: "Lunch",
          blurb: "Mediterranean bowls built around the protein first. Most of them one pan, all of them assembled in minutes.",
          stripePriceId: TODO
        },
        {
          id: "dinners", coverTitle: "Dinners that hold", name: "High-Protein Dinners", file: "EVZO-Protein-Dinners.pdf",
          eyebrow: "Dinner",
          blurb: "Greek and Cypriot dinners rebuilt so the protein is the point \u2014 including the ones you were told to give up.",
          stripePriceId: TODO
        },
        {
          id: "fatloss", coverTitle: "Full plates, fewer calories", name: "Fat Loss Dishes", file: "EVZO-Fat-Loss-Dishes.pdf",
          eyebrow: "Losing weight",
          blurb: "Meals built for volume, sorted by calories. Full plates, because hunger is what ends diets.",
          stripePriceId: TODO
        },
        {
          id: "gain", coverTitle: "Eating more, on purpose", name: "Weight Gain", file: "EVZO-Weight-Gain.pdf",
          eyebrow: "Gaining weight",
          blurb: "Calorie-dense meals and shakes for people who genuinely struggle to gain, built on real food.",
          stripePriceId: TODO
        },
        {
          id: "healthy", coverTitle: "Real food, weighed once", name: "Healthy Recipes", file: "EVZO-Healthy-Recipes.pdf",
          eyebrow: "The starter collection",
          blurb: "The collection offered at checkout. Breakfasts, lunches, dinners and snacks with every figure on the page.",
          stripePriceId: TODO
        }
      ],

      // All seven recipe books together. The saving is stated as a comparison
      // with buying them one at a time, which is what it is \u2014 it is NOT a
      // "was" price, because nothing has ever sold at that number. Under the
      // Omnibus Directive those are two different claims and only one of them
      // is true here.
      bundle: {
        id: "library", name: "The whole library",
        blurb: "Every book in the shop, in one download.",
        priceAmount: 24.99, priceDisplay: "\u20AC24.99",
        stripePriceId: TODO
      }
    },

    /* ---- fulfilment ----------------------------------------------------- */
    // Delivery is MANUAL until PDF generation is built. Do not change this to
    // "instant" until the pipeline in INTEGRATION.md actually exists.
    fulfilment: {
      mode: "manual",             // "manual" | "automatic"
      // Set by the owner, 20 Sep 2026. This is a promise on a sales page: it has
      // to hold on the busiest day, not the quietest one. Widen it here the
      // moment it stops being true and the whole page follows.
      turnaroundText: "within 24 hours",
      format: "PDF, by email",
      deliveryChannel: "email"
    },

    /* ---- integration switches ------------------------------------------- */
    // Every one of these is false because the backend does not exist yet.
    // The UI reads these and shows honest states instead of pretending.
    integrations: {
      checkoutEnabled: false,     // Stripe Checkout session endpoint live?
      upsellOneClickEnabled: false,
      analyticsEnabled: false,    // no vendor wired; events go to a local sink
      // Server endpoints the front end will call once they exist.
      endpoints: {
        createCheckoutSession: "/api/checkout/session",   // TODO_OWNER: deploy
        questionnaire:         "/api/questionnaire",      // TODO_OWNER: deploy
        orderStatus:           "/api/order/status"        // TODO_OWNER: deploy
      }
    },

    /* ---- business & legal ----------------------------------------------- */
    // TODO_OWNER: all of this must be real before trading. EU distance-selling
    // rules require an identifiable trader and a withdrawal notice.
    business: {
      // The trading name. NOTE: the LOGO stays "EVZO" alone — the mark is the
      // stacked wordmark and must never be redrawn to include "METHOD".
      // This value is the business name used in the legal footer and policies.
      legalName: "EVZO METHOD",
      // TODO_OWNER: still required for EU distance selling. A trading name on
      // its own does not identify a trader unless it is a registered entity.
      // If you sell as a sole trader, the registration record will carry your
      // own name even though it appears nowhere in the marketing copy.
      registrationNumber: TODO,
      address: TODO,
      // The public contact address for the brand. Used for the footer Contact
      // link, the privacy/refund "get in touch" lines, and as the reply-to on
      // anything sent to a customer.
      supportEmail: "evzo.method@outlook.com",
      contactFallbackUrl: "https://www.instagram.com/evzo_method/",
      contactFallbackLabel: "Message @evzo_method",
      // TODO_OWNER: the EU member state the business is established in.
      country: TODO
    },

    legal: {
      // These point at the on-page policy sections at the foot of the site.
      // If the page later moves to its own domain, swap them for real URLs.
      termsUrl: "legal.html#terms",
      privacyUrl: "legal.html#privacy",
      cookieUrl: "legal.html#cookies",
      refundUrl: "legal.html#refund",
      // TODO_OWNER: confirm with a qualified EU consumer-law adviser.
      //
      // A blanket "no refunds on digital products" is NOT valid in the EU on its
      // own. The 14-day withdrawal right exists by default. It is lost only when
      // the customer, BEFORE delivery, (a) expressly consents to immediate
      // performance and (b) acknowledges losing the right. Both are collected at
      // checkout by the consent boxes on this page — remove those and the waiver
      // fails, whatever the policy text says.
      //
      // Note also: the waiver rests on immediate delivery. While
      // fulfilment.mode is "manual", delivery is not immediate, which weakens
      // it further. This is the strongest honest wording available today.
      refundPolicyText:
        "Because this is a digital product, you are asked at checkout to " +
        "consent to receiving it immediately and to acknowledge that doing so " +
        "ends your 14-day right of withdrawal. Once you have given that consent " +
        "and the guide has been sent, the sale is final and no refund is due. " +
        "If the guide is never delivered, is delivered faulty, or is not what " +
        "was described, contact us and we will put it right or refund you in " +
        "full — that right cannot be waived.",
      reviewed: false             // set true only after professional review
    },

    /* ---- scope disclaimer ------------------------------------------------ */
    // Shown near the assessment and near checkout (short form), and in full in
    // the FAQ and footer. TODO_OWNER: hold for EU consumer-law review.
    disclaimerShort:
      "General wellness guidance — not medical or dietetic care. " +
      "Educational estimates only.",

    disclaimerFull:
      "EVZO provides general educational wellness information and personalised " +
      "meal-planning examples. We are not dietitians, clinical dietitians, doctors " +
      "or healthcare professionals. Our products do not constitute medical advice, " +
      "diagnosis, treatment or medical nutrition therapy. They are not suitable for " +
      "minors, pregnancy, eating disorders, medical conditions or medically " +
      "prescribed diets. Consult a qualified healthcare professional before " +
      "changing your diet if you have health concerns.",

    /* ---- social proof ---------------------------------------------------- */
    // EMPTY ON PURPOSE. The testimonial component renders nothing while this
    // array is empty. Never add an entry that is not a real, permissioned quote
    // from a real customer.
    testimonials: [],

    /* ---- calculation provenance ------------------------------------------ */
    // TODO_OWNER: the formulas in calc.js are standard published equations, but
    // they have NOT been reviewed by a qualified professional for this product.
    // Do not claim professional validation anywhere until this is true.
    calculationsReviewedByProfessional: false,

    // Orange "NOT SET" markers on the page are a build-time aid so no invented
    // value ever reaches a customer. Set this to false before going live and
    // they stop rendering; anything still unset is warned about in the console
    // instead. Turning them off does NOT fill the value in.
    showSetupMarkers: true,

    links: {
      instagram: "https://www.instagram.com/evzo_method/"
    }
  };

  /* Is a config value actually set? The UI uses this to show an honest
     "not set" marker rather than printing "null" or inventing a default. */
  CONFIG.isSet = function (v) {
    return v !== null && v !== undefined && v !== "" && v !== "#";
  };

  if (typeof module === "object" && module.exports) module.exports = CONFIG;
  else root.EVZO_CONFIG = CONFIG;

})(typeof globalThis !== "undefined" ? globalThis : this);
