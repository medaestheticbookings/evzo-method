/* EVZO — application layer
 * ============================================================================
 * Presentation and wiring only. Every number comes from calc.js; every price,
 * policy and business detail comes from config.js. This file computes nothing
 * nutritional of its own.
 * ========================================================================== */

(function () {
  "use strict";

  var CFG = window.EVZO_CONFIG;
  var CALC = window.EVZO_CALC;
  var T = window.EVZO_T || function (s) { return s; };

  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var fmt = function (n) {
    return Math.round(n).toLocaleString(document.documentElement.lang === "el" ? "el-GR" : "en-US");
  };

  /* ---------------------------------------------------------------- state */
  /* Answers persist across back/forward for the life of the page. Nothing is
     written to storage: these are health-adjacent answers and they stay in
     memory only. */
  var S = {
    goal: null, adult: false, age: null, unit: "metric",
    cm: null, kg: null, sex: null, activity: null, split: null, diet: "omnivore",
    foods: {},
    // Allergies are a hard exclusion, kept separate from the food picker: a
    // disliked food is a preference, an allergen is not.
    allergies: {}, noAllergies: false,
    meals: 3, snacks: 1,
    exclusions: {}, noneTicked: false,
    step: 0, bumpOn: false, lastResult: null, startedTracked: false,
    pack: null,
    consent: { terms: false, immediate: false }
  };

  function trackStartOnce() {
    if (S.startedTracked) return;
    S.startedTracked = true;
    track("assessment_started", { goal: S.goal });
  }

  var STEPS = ["goal", "age", "units", "height", "weight", "sex", "activity", "split", "style", "allergies", "foods", "meals"];

  /* Tags hidden by each dietary style. A vegan is never asked whether they
     like lamb, and a food hidden here is also cleared from the answers, so a
     choice made before the diet was set can never survive into the plan. */
  var DIET_HIDES = {
    omnivore:    [],
    pescatarian: ["meat", "pork"],
    vegetarian:  ["meat", "pork", "fish"],
    vegan:       ["meat", "pork", "fish", "eggs", "dairy"],
    nopork:      ["pork"],
    halal:       ["pork"]
  };

  /* Which food chips an allergen removes. The picker's tags are coarse
     (meat, fish, dairy…), so anything finer is listed by key. */
  var ALLERGY_HIDES = {
    dairy:     { tags: ["dairy"], keys: ["trahana"] },
    egg:       { tags: ["eggs"], keys: [] },
    fish:      { tags: ["fish"], keys: [] },
    shellfish: { tags: [], keys: ["seafood"] },
    nuts:      { tags: [], keys: ["almonds", "walnuts", "pistachios", "hazelnuts", "cashews", "pinenuts", "almondbutter", "almondmilk"] },
    peanut:    { tags: [], keys: ["peanutbutter"] },
    soy:       { tags: [], keys: ["tofu", "soymilk"] },
    sesame:    { tags: [], keys: ["tahini", "sesame"] },
    gluten:    { tags: [], keys: ["bread", "pita", "sourdough", "rusk", "pasta", "orzo", "oats", "granola", "bulgur", "freekeh", "trahana", "barley", "tortilla", "oatmilk"] },
  };

  function applyDietFilter() {
    var hide = (DIET_HIDES[S.diet] || []).slice();
    var hideKeys = [];
    Object.keys(S.allergies).forEach(function (a) {
      if (!S.allergies[a] || !ALLERGY_HIDES[a]) return;
      hide = hide.concat(ALLERGY_HIDES[a].tags);
      hideKeys = hideKeys.concat(ALLERGY_HIDES[a].keys);
    });
    all(".foods .opt").forEach(function (b) {
      var key = b.getAttribute("data-food");
      var off = hide.indexOf(b.getAttribute("data-tag")) !== -1 || hideKeys.indexOf(key) !== -1;
      b.hidden = off;
      if (off && S.foods[b.getAttribute("data-food")]) {
        delete S.foods[b.getAttribute("data-food")];
        b.setAttribute("aria-pressed", "false");
      }
    });
    // A group whose every food is hidden loses its heading too.
    all(".food-group").forEach(function (h) {
      var g = h.getAttribute("data-group");
      var live = all('.foods .opt[data-group="' + g + '"]').some(function (b) { return !b.hidden; });
      h.hidden = !live;
      var row = document.querySelector('.foods[data-group="' + g + '"]');
      if (row) row.hidden = !live;
    });
  }

  function foodsIn(group) {
    return Object.keys(S.foods).filter(function (f) {
      var b = document.querySelector('.opt[data-food="' + f + '"]');
      return S.foods[f] && b && !b.hidden && b.getAttribute("data-group") === group;
    }).length;
  }

  /* ------------------------------------------------------------ analytics */
  /* Privacy-conscious by construction: this function accepts an event name and
     a tiny allow-listed payload. Height, weight, age, sex, health answers,
     emails and names can never be passed on, because anything not on the
     allow-list is dropped before it leaves. No vendor is connected; events go
     to a local sink until one is. */
  var ALLOWED_KEYS = ["goal", "step", "value", "currency", "item"];
  function track(name, payload) {
    var safe = {};
    Object.keys(payload || {}).forEach(function (k) {
      if (ALLOWED_KEYS.indexOf(k) !== -1) safe[k] = payload[k];
    });
    // INTEGRATION POINT: forward `name` + `safe` to your analytics vendor here.
    // Do not widen ALLOWED_KEYS to add health or identity fields.
    if (!CFG.integrations.analyticsEnabled) {
      (window.__evzoEvents = window.__evzoEvents || []).push({ e: name, p: safe });
      return;
    }
  }

  /* ------------------------------------------------------------ unit I/O */
  var num = function (id) { var v = parseFloat($(id).value); return isFinite(v) ? v : null; };

  function readKg() {
    if (S.unit === "lb") { var l = num("lb"); return l === null ? null : CALC.lbToKg(l); }
    if (S.unit === "st") {
      var st = num("st"), sl = num("stlb");
      if (st === null && sl === null) return null;
      return CALC.stoneToKg(st || 0, sl || 0);
    }
    return num("kg");
  }
  function readCm() {
    if (S.unit === "metric") return num("cm");
    var f = num("ft"), i = num("inch");
    if (f === null && i === null) return null;
    return CALC.ftInToCm(f || 0, i || 0);
  }
  function writeKg(kg) {
    if (kg === null) return;
    $("kg").value = Math.round(kg * 2) / 2;
    var lb = CALC.kgToLb(kg);
    $("lb").value = Math.round(lb);
    var st = Math.floor(lb / 14), rem = Math.round(lb - st * 14);
    if (rem === 14) { st += 1; rem = 0; }
    $("st").value = st; $("stlb").value = rem;
  }
  function writeCm(cm) {
    if (cm === null) return;
    $("cm").value = Math.round(cm);
    var r = CALC.cmToFtIn(cm);
    $("ft").value = r.ft; $("inch").value = r.inch;
  }
  function showUnit() {
    all("[data-w]").forEach(function (el) { el.hidden = el.getAttribute("data-w") !== S.unit; });
    all("[data-h]").forEach(function (el) {
      el.hidden = el.getAttribute("data-h") !== (S.unit === "metric" ? "metric" : "imp");
    });
  }

  /* --------------------------------------------------------------- stepper */
  // The first paint must not scroll: the visitor has not asked for anything yet.
  var firstStepRender = true;

  function showStep(i) {
    S.step = Math.max(0, Math.min(STEPS.length - 1, i));
    all(".step").forEach(function (el, n) { el.classList.toggle("on", n === S.step); });
    var pct = Math.round((S.step + 1) / STEPS.length * 100);
    $("bar").style.width = pct + "%";
    $("bar").parentNode.setAttribute("aria-valuenow", String(pct));
    $("step-count").textContent = T("Question") + " " + (S.step + 1) + " " + T("of") + " " + STEPS.length;
    $("back").hidden = S.step === 0;
    $("restart").hidden = S.step === 0;
    $("next").textContent = S.step === STEPS.length - 1 ? T("See my snapshot") : T("Continue");
    $("err-step").hidden = true;
    // The food list depends on the dietary style answered a step earlier, so it
    // is rebuilt on the way in rather than once at load.
    if (STEPS[S.step] === "foods") applyDietFilter();
    var live = document.querySelector(".step.on");

    /* Bring the new question to the top of the screen.
       Continue sits at the bottom of a long question and the next one renders
       above it, so without this the visitor taps Continue and appears to land
       on nothing — they are looking at the disclaimer of the screen they just
       left. The focus call keeps preventScroll so it cannot fight this. */
    if (!firstStepRender) {
      var anchor = document.getElementById("step-anchor") || $("assessment");
      if (anchor && anchor.scrollIntoView) {
        var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        anchor.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    }
    firstStepRender = false;

    var focusable = live && live.querySelector("input,select,button");
    if (focusable) focusable.focus({ preventScroll: true });
  }

  /* Per-step validation. Returns null when the step is complete, otherwise a
     message the user can act on. */
  function stepProblem() {
    var k = STEPS[S.step];
    if (k === "goal" && !S.goal) return T("Pick a goal to carry on.");
    if (k === "age") {
      var a = num("age");
      if (a === null) return T("Enter your age.");
      if (a < CALC.BOUNDS.age.min) return T("This guide is for adults aged 18 and over.");
      if (a > CALC.BOUNDS.age.max) return T("Above 79 the estimate is not reliable enough to publish. Please speak to a professional instead.");
      if (!S.adult) return T("Please confirm you are 18 or over.");
      S.age = a;
    }
    if (k === "height") {
      var c = readCm();
      if (c === null) return T("Enter your height.");
      if (c < CALC.BOUNDS.cm.min || c > CALC.BOUNDS.cm.max) return T("That height is outside the range this estimate supports.");
      S.cm = c;
    }
    if (k === "weight") {
      var w = readKg();
      if (w === null) return T("Enter your weight.");
      if (w < CALC.BOUNDS.kg.min || w > CALC.BOUNDS.kg.max) return T("That weight is outside the range this estimate supports. Please speak to a professional.");
      S.kg = w;
    }
    if (k === "sex" && !S.sex) return T("Pick one so we use the right equation.");
    if (k === "activity" && !S.activity) return T("Pick the closest description of your week.");
    if (k === "split" && !S.split) return T("Pick how you like your food to be made up.");
    if (k === "allergies") {
      var anyAllergy = Object.keys(S.allergies).some(function (a) { return S.allergies[a]; });
      if (!anyAllergy && !S.noAllergies) return T("Tick any allergies, or tick “None of these”.");
    }
    if (k === "meals") {
      if (!S.meals) return T("Pick how many meals a day you eat.");
      if (S.snacks === null || S.snacks === undefined) return T("Pick how many snacks, even if the answer is none.");
    }
    if (k === "foods") {
      if (foodsIn("protein") < 2 || foodsIn("carb") < 2) {
        return T("Pick at least two proteins and two carbohydrate foods so there is something to build the week from.");
      }
    }
    if (k === "style") {
      var any = Object.keys(S.exclusions).some(function (x) { return S.exclusions[x]; });
      if (!any && !S.noneTicked) return T("Tick anything that applies, or tick “None of these”.");
    }
    return null;
  }

  /* ---------------------------------------------------------------- result */
  function finish() {
    var input = {
      goal: S.goal === "maintain" ? "maintain" : S.goal,
      sex: S.sex, age: S.age, kg: S.kg, cm: S.cm, activity: S.activity,
      // How they said they like to eat. calc.js applies its floors afterwards,
      // so this can shape the split but never take it somewhere unsafe.
      split: S.split,
      // The food list changes nothing in the arithmetic; it is carried so the
      // guide is built from food this person actually eats. It stays in memory
      // and goes no further until the questionnaire endpoint exists.
      foods: Object.keys(S.foods).filter(function (f) { return S.foods[f]; }),
      // Allergens are exclusions the plan must honour, and the meal pattern
      // decides how the day is divided up.
      allergies: Object.keys(S.allergies).filter(function (a) { return S.allergies[a]; }),
      mealsPerDay: S.meals,
      snacksPerDay: S.snacks,
      // A single conservative default rate. The user is never asked to choose
      // an aggressive one, and calc.js clamps it regardless.
      ratePerWeekKg: S.goal === "lose" ? 0.5 : S.goal === "gain" ? 0.25 : 0
    };

    var out = CALC.assess(input, S.exclusions);

    if (!out.ok && out.reason === "excluded") {
      renderExcluded(out.exclusions);
      track("assessment_completed", { goal: S.goal, step: "excluded" });
      return;
    }
    if (!out.ok) { $("err-step").textContent = T("Something in the answers is out of range. Go back and check."); $("err-step").hidden = false; return; }

    S.lastResult = out.result;
    renderResult(out.result);
    track("assessment_completed", { goal: S.goal });
    track("result_viewed", { goal: S.goal });
  }

  function renderExcluded(reasons) {
    // Wipe any previously rendered figures. An excluded visitor must not have
    // numbers sitting in the document, even inside a hidden section.
    S.lastResult = null;
    ["r-kcal", "r-pro", "r-maint", "r-goal", "r-bmi", "r-split", "r-foods", "g-pro", "g-car", "g-fat"]
      .forEach(function (id) { $(id).textContent = "—"; });
    ["bar-pro", "bar-car", "bar-fat"].forEach(function (id) { $(id).style.width = "0%"; });
    $("r-note").textContent = "";
    $("r-warn").hidden = true;
    $("result").hidden = true;
    var host = $("excl-list");
    host.innerHTML = "";
    reasons.forEach(function (r) {
      var li = document.createElement("li");
      li.textContent = T("excl_" + r);
      host.appendChild(li);
    });
    $("excluded").hidden = false;
    $("excluded").scrollIntoView({ behavior: "smooth", block: "start" });
    // The purchase path is closed for this visitor.
    $("buy").disabled = true;
    $("buy").dataset.blocked = "1";
    $("buy-state").textContent = T("Checkout is closed because of your safety answers. Please speak to a registered dietitian or your doctor.");
    $("buy-state").hidden = false;
  }

  function renderResult(r) {
    $("excluded").hidden = true;
    $("result").hidden = false;

    var metric = S.unit === "metric";
    $("r-kcal").textContent = fmt(r.calorieRange.low) + "–" + fmt(r.calorieRange.high);
    $("r-pro").textContent = r.proteinRange.low + "–" + r.proteinRange.high + " g";
    $("r-maint").textContent = fmt(r.energy.maintenance) + " kcal";
    $("r-goal").textContent = T("goal_" + S.goal);
    $("r-bmi").textContent = r.bmi.value.toFixed(1);
    // Name the preference the figures were drawn for, so the split on screen is
    // never mistaken for the only arrangement of these calories.
    $("r-split").textContent = T("split_" + r.split);
    $("r-foods").textContent = Object.keys(S.foods).filter(function (f) { return S.foods[f]; }).length;

    var s = r.illustrativeSplit;
    $("g-pro").textContent = s.proteinG + " g";
    $("g-car").textContent = s.carbG + " g";
    $("g-fat").textContent = s.fatG + " g";
    $("bar-pro").style.width = s.proteinPct + "%";
    $("bar-car").style.width = s.carbPct + "%";
    $("bar-fat").style.width = s.fatPct + "%";

    $("result-lede").textContent = T("result_lede");
    $("r-note").textContent = T("result_note");

    if (r.energy.clamped) {
      $("r-warn").textContent = T("clamped_note");
      $("r-warn").hidden = false;
    } else $("r-warn").hidden = true;

    delete $("buy").dataset.blocked;
    syncConsent();
    $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* -------------------------------------------------------------- checkout */
  function buy() {
    track("checkout_started", {
      goal: S.goal,
      value: CFG.product.priceAmount,
      currency: CFG.product.priceCurrency,
      item: CFG.product.id
    });
    if (S.bumpOn) track("order_bump_accepted", { item: CFG.orderBump.id });

    // INTEGRATION POINT — Stripe Checkout.
    // When the server endpoint exists, POST the line items here and redirect to
    // the session URL. The server must re-read prices from Stripe, never trust
    // an amount sent from this page, and must verify payment via webhook before
    // any fulfilment. See INTEGRATION.md.
    if (!CFG.integrations.checkoutEnabled) {
      $("buy-state").textContent = T("checkout_unavailable");
      $("buy-state").hidden = false;
      return;
    }
  }

  /* ------------------------------------------------------ config rendering */
  /* Anything unset in config.js renders a visible marker. Nothing is invented. */
  function unsetMark(el, label) {
    el.innerHTML = "";
    // Setup markers are a build-time aid. Turn config.showSetupMarkers off and
    // they stop rendering — the underlying value is still unset either way.
    if (CFG.showSetupMarkers === false) {
      if (window.console && console.warn) console.warn("EVZO setup: still unset -> " + label);
      return;
    }
    var b = document.createElement("span");
    b.className = "unset";
    b.textContent = "NOT SET: " + label;
    el.appendChild(b);
  }

  /* ------------------------------------------------------------ packages */

  /* Three lengths of the same product. The saving printed on a card is the
     difference against buying 28 days at a time — a real price on this page,
     not a "was" price. Under the Omnibus Directive those are different claims
     and only the first one is true here, so the copy says "instead of ... at
     28 days at a time" and never "was".

     The middle card is marked Recommended, never "Most popular": popularity is
     a claim about other customers, and there are none yet. */
  function packages() { return CFG.packages || []; }

  function esc(v) {
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function selectedPackage() {
    var list = packages();
    if (!list.length) return null;
    var found = null;
    list.forEach(function (p) { if (p.id === S.pack) found = p; });
    if (found) return found;
    list.forEach(function (p) { if (!found && p.recommended) found = p; });
    return found || list[0];
  }

  function renderPackages() {
    var host = $("packages");
    if (!host) return;
    var list = packages();
    if (!list.length) { host.hidden = true; return; }

    var single = list[0];
    var chosen = selectedPackage();
    S.pack = chosen.id;

    host.innerHTML = "";
    list.forEach(function (p) {
      var perMonth = p.priceAmount / p.months;
      var fullPrice = single.priceAmount * p.months;
      var saving = fullPrice - p.priceAmount;

      var card = document.createElement("button");
      card.type = "button";
      card.className = "pack" + (p.recommended ? " pack-rec" : "");
      card.setAttribute("aria-pressed", String(p.id === chosen.id));
      card.setAttribute("data-pack", p.id);

      var html = "";
      if (p.recommended) html += '<span class="pack-flag">' + esc(T("Recommended")) + "</span>";
      html += '<span class="pack-name">' + esc(T(p.name)) + "</span>";
      html += '<span class="pack-price">' + esc(p.priceDisplay) + "</span>";
      if (p.months > 1) {
        html += '<span class="pack-per">' + fmtMoney(perMonth) + " " + esc(T("a month")) + "</span>";
        html += '<span class="pack-save">' + esc(T("Saves")) + " " + fmtMoney(saving) +
                " " + esc(T("against 28 days at a time")) + "</span>";
      } else {
        html += '<span class="pack-per">' + esc(T("One month")) + "</span>";
        html += '<span class="pack-save">&nbsp;</span>';
      }
      html += '<span class="pack-sum">' + esc(T(p.summary)) + "</span>";
      card.innerHTML = html;

      card.addEventListener("click", function () {
        S.pack = p.id;
        renderPackages();
        applyPackage();
        track("package_selected", {});
      });
      host.appendChild(card);
    });
  }

  function fmtMoney(v) {
    // Whole euros print without the decimals; anything else keeps them.
    return "\u20AC" + (Math.round(v * 100) % 100 === 0 ? String(Math.round(v)) : v.toFixed(2));
  }

  /* The checkout card mirrors whichever package is selected. */
  function applyPackage() {
    var p = selectedPackage();
    if (!p) return;
    $("p-name").textContent = T(CFG.product.name) + " \u2014 " + T(p.name);
    $("p-price").textContent = p.priceDisplay;
    if ($("p-sub")) {
      $("p-sub").textContent = p.months === 1
        ? T("One-time payment \u00b7 No subscription")
        : T("One-time payment \u00b7 " + p.months + " guides \u00b7 No subscription");
    }
    var host = $("p-includes");
    host.innerHTML = "";
    (p.includes || []).forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = T(line);
      host.appendChild(li);
    });
  }

  function renderConfig() {
    // Config holds the English; the dictionary holds the Greek. Anything the
    // config prints on the page goes through T() or it stays English in EL.
    renderPackages();
    $("p-name").textContent = T(CFG.product.name);
    $("p-price").textContent = CFG.product.priceDisplay;

    /* Launch pricing. The struck-through regular price only appears while the
       launch is actually running — switch launch.active off and the card shows
       one honest price with no comparison claim. */
    var L = CFG.product.launch || {};
    if (L.active) {
      $("p-was").textContent = CFG.product.regularPriceDisplay;
      $("p-was").hidden = false;
      $("p-badge").textContent = T(L.label || "Launch offer");
      $("p-badge").hidden = false;
      if (CFG.isSet(L.endsAt)) {
        $("p-ends").textContent = T("Regular price") + " "
          + CFG.product.regularPriceDisplay + " " + T("from") + " " + L.endsAt + ".";
        $("p-ends").hidden = false;
      } else {
        // An offer with no end condition is an open-ended discount. Say so
        // rather than quietly implying a deadline that does not exist.
        unsetMark($("p-ends"), "product.launch.endsAt");
        $("p-ends").hidden = false;
      }
    } else {
      $("p-was").hidden = true;
      $("p-badge").hidden = true;
      $("p-ends").hidden = true;
    }

    /* What is included. With packages configured this is the selected
       package's list; without them it falls back to the single product, so
       removing config.packages returns the page to one price. */
    if (packages().length) {
      applyPackage();
    } else {
      var incHost = $("p-includes");
      incHost.innerHTML = "";
      (CFG.product.includes || []).forEach(function (line) {
        var li = document.createElement("li");
        li.textContent = T(line);
        incHost.appendChild(li);
      });
    }

    $("b-name").textContent = T(CFG.orderBump.name);
    $("b-price").textContent = CFG.orderBump.priceDisplay;
    $("b-blurb").textContent = T(CFG.orderBump.blurb);

    // Delivery timing — never promise a turnaround the owner has not confirmed.
    // Translated like any other copy: the config holds the English, the
    // dictionary holds the Greek, so the promise reads properly in both.
    var turnaround = T(CFG.fulfilment.turnaroundText);
    if (CFG.isSet(CFG.fulfilment.turnaroundText)) {
      $("how-delivery").textContent = T("Delivered as a PDF") + " " + turnaround + ".";
      $("p-delivery").textContent = T("Delivered as a PDF") + " " + turnaround + ".";
      $("faq-when").textContent = T("faq_when_prefix") + " " + turnaround + ". " + T("faq_when_manual");
    } else {
      unsetMark($("how-delivery"), "fulfilment.turnaroundText");
      unsetMark($("p-delivery"), "fulfilment.turnaroundText");
      unsetMark($("faq-when"), "fulfilment.turnaroundText");
    }

    if (CFG.isSet(CFG.legal.refundPolicyText)) $("faq-refund").textContent = T(CFG.legal.refundPolicyText);
    else unsetMark($("faq-refund"), "legal.refundPolicyText");

    $("faq-scope").textContent = T(CFG.disclaimerFull);
    $("legal-full").innerHTML = "";
    var strongLead = document.createElement("strong");
    strongLead.textContent = T("Scope: ");
    $("legal-full").appendChild(strongLead);
    $("legal-full").appendChild(document.createTextNode(T(CFG.disclaimerFull)));

    $("scope-quiz").textContent = T(CFG.disclaimerShort);
    $("scope-checkout").textContent = T(CFG.disclaimerShort);

    /* Every "contact us" slot in the policies, filled from one config value.
       A mailto is rendered only when an address actually exists. */
    var mail = CFG.business.supportEmail;
    all("[data-contact]").forEach(function (a) {
      if (CFG.isSet(mail)) {
        a.href = "mailto:" + mail;
        a.textContent = mail;
        a.removeAttribute("aria-disabled");
      } else {
        a.removeAttribute("href");
        a.textContent = T("contact address not set");
        a.setAttribute("aria-disabled", "true");
      }
    });

    /* Business identity. The email is shown as soon as it exists; the trader
       identity is flagged separately, because EU distance selling needs a
       named trader and an address, not just a mailbox. */
    var biz = $("legal-business");
    biz.innerHTML = "";
    if (CFG.isSet(CFG.business.legalName)) {
      var nm = document.createElement("strong");
      nm.textContent = CFG.business.legalName;
      biz.appendChild(nm);
      biz.appendChild(document.createTextNode(" · "));
    }
    if (CFG.isSet(mail)) {
      var lead = document.createElement("span");
      lead.textContent = T("Contact: ");
      var a = document.createElement("a");
      a.className = "mail";
      a.href = "mailto:" + mail;
      a.textContent = mail;
      biz.appendChild(lead);
      biz.appendChild(a);
    }
    /* Registration number and address are still required for EU distance
       selling, but they are footer metadata rather than missing customer copy,
       so an orange marker in front of visitors is the wrong place to chase
       them. Warn in the console instead; config.js still carries the TODO. */
    var missingBiz = ["legalName", "registrationNumber", "address"]
      .filter(function (k) { return !CFG.isSet(CFG.business[k]); });
    if (missingBiz.length && window.console && console.warn) {
      console.warn("EVZO setup: still unset -> " +
        missingBiz.map(function (k) { return "business." + k; }).join(", "));
    }

    // Legal links — a "#" placeholder renders as an unset marker, not a link.
    var links = [
      ["Terms and Conditions", CFG.legal.termsUrl],
      ["Privacy Policy", CFG.legal.privacyUrl],
      ["Cookie Policy", CFG.legal.cookieUrl],
      ["Refund and Digital Delivery", CFG.legal.refundUrl],
      ["Contact", CFG.isSet(CFG.business.supportEmail)
        ? "mailto:" + CFG.business.supportEmail
        : CFG.business.contactFallbackUrl]
    ];
    var host = $("foot-links");
    host.innerHTML = "";
    links.forEach(function (pair) {
      if (CFG.isSet(pair[1])) {
        var a = document.createElement("a");
        a.href = pair[1]; a.textContent = T(pair[0]);
        host.appendChild(a);
      } else {
        var s = document.createElement("span");
        s.className = "unset";
        s.textContent = T(pair[0]) + " — NOT SET";
        host.appendChild(s);
      }
    });

    // Social proof renders only with real, owner-supplied entries.
    /* Reviews render only from config.testimonials, which holds real,
       permissioned entries or nothing at all. Each entry may carry:
         { quote, name, context, photo, rating, verified }
       `name` is a first name and a surname initial — "Eleni P." — and `context`
       is how long they used it. No town: it narrows a person more than it adds.
       `verified` is true only for a confirmed purchaser, and the badge says
       exactly that — it is a claim, not decoration. */
    /* Reviews render only from config.testimonials, which holds real,
       permissioned entries or nothing at all. Each entry may carry:
         { quote, name, context, photo, rating, verified }

       `verified` is true only for a confirmed purchaser and the badge says
       exactly that — it is a claim about a person, not decoration. The
       aggregate rating is averaged from the entries present; it is never
       written down, so it cannot drift away from the reviews under it. */
    if (CFG.testimonials && CFG.testimonials.length) {
      var list = $("proof-list");
      list.innerHTML = "";

      var ratings = [];
      CFG.testimonials.forEach(function (t) {
        var card = document.createElement("div");
        card.className = "review";

        if (t.verified) {
          var badge = document.createElement("span");
          badge.className = "verified";
          badge.textContent = T("Verified purchase");
          card.appendChild(badge);
        }

        var rating = Math.max(1, Math.min(5, t.rating || 5));
        ratings.push(rating);
        var stars = document.createElement("span");
        stars.className = "stars";
        stars.setAttribute("aria-label", rating + " " + T("out of 5"));
        stars.textContent = "\u2605\u2605\u2605\u2605\u2605".slice(0, rating);
        card.appendChild(stars);

        var q = document.createElement("blockquote");
        q.textContent = t.quote;
        card.appendChild(q);

        var who = document.createElement("div");
        who.className = "who";
        if (t.photo) {
          var img = document.createElement("img");
          img.src = t.photo;
          img.alt = "";
          img.loading = "lazy";
          who.appendChild(img);
        }
        var names = document.createElement("div");
        var b = document.createElement("b"); b.textContent = t.name || "";
        names.appendChild(b);
        if (t.context) {
          var c = document.createElement("span"); c.textContent = t.context;
          names.appendChild(c);
        }
        who.appendChild(names);
        card.appendChild(who);

        list.appendChild(card);
      });

      /* The summary only appears once there are enough reviews for an average
         to mean anything. One five-star review is not a 5.0 rating. */
      if (ratings.length >= 3) {
        var avg = ratings.reduce(function (a, b) { return a + b; }, 0) / ratings.length;
        $("rating-avg").textContent = avg.toFixed(1);
        $("rating-stars").textContent = "\u2605\u2605\u2605\u2605\u2605".slice(0, Math.round(avg));
        $("rating-count").textContent = ratings.length + " " +
          T(ratings.length === 1 ? "review" : "reviews");
        $("rating-summary").hidden = false;
      }

      $("proof").hidden = false;
    }

    if (!CFG.integrations.checkoutEnabled) {
      $("buy-state").textContent = T("checkout_unavailable");
      $("buy-state").hidden = false;
    }
  }

  /* ----------------------------------------------------------------- wiring */
  function setGoal(v) {
    S.goal = v;
    all(".goal").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-goal") === v)); });
    all('[data-q="goal"]').forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === v)); });
    track("goal_selected", { goal: v });
  }

  all(".goal").forEach(function (b) {
    b.addEventListener("click", function () {
      setGoal(b.getAttribute("data-goal"));
      $("assessment").scrollIntoView({ behavior: "smooth", block: "start" });
      trackStartOnce();
    });
  });

  // single-choice option groups
  all(".opt[data-q]").forEach(function (b) {
    b.addEventListener("click", function () {
      var q = b.getAttribute("data-q"), v = b.getAttribute("data-v");
      if (q === "goal") { setGoal(v); return; }
      if (q === "adult") { S.adult = !S.adult; b.setAttribute("aria-pressed", String(S.adult)); return; }
      S[q] = (q === "meals" || q === "snacks") ? Number(v) : v;
      all('.opt[data-q="' + q + '"]').forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === b));
      });
    });
  });

  // dietary style drives which foods are offered a step later
  var dietSel = $("diet");
  if (dietSel) {
    dietSel.addEventListener("change", function () {
      S.diet = dietSel.value;
      applyDietFilter();
    });
  }

  // allergies: multi-select, with a mutually exclusive "none of these"
  all(".opt[data-allergy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-allergy");
      var on = b.getAttribute("aria-pressed") !== "true";
      if (a === "none") {
        S.noAllergies = on;
        S.allergies = {};
        all(".opt[data-allergy]").forEach(function (o) {
          o.setAttribute("aria-pressed", String(o === b && on));
        });
      } else {
        if (on) S.allergies[a] = true; else delete S.allergies[a];
        S.noAllergies = false;
        b.setAttribute("aria-pressed", String(on));
        var none = document.querySelector('.opt[data-allergy="none"]');
        if (none) none.setAttribute("aria-pressed", "false");
      }
      // An allergen removes foods, so the picker is rebuilt now rather than
      // leaving a chip on screen that can never appear in the plan.
      applyDietFilter();
    });
  });

  // food chips: plain multi-select, remembered across back and forward
  all(".opt[data-food]").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-food");
      var on = b.getAttribute("aria-pressed") !== "true";
      if (on) S.foods[f] = true; else delete S.foods[f];
      b.setAttribute("aria-pressed", String(on));
      $("err-foods").hidden = true;
    });
  });

  // exclusion checkboxes, with a mutually exclusive "none of these"
  all(".opt[data-x]").forEach(function (b) {
    b.addEventListener("click", function () {
      var x = b.getAttribute("data-x");
      var on = b.getAttribute("aria-pressed") !== "true";
      if (x === "none") {
        S.noneTicked = on;
        b.setAttribute("aria-pressed", String(on));
        if (on) {
          S.exclusions = {};
          all('.opt[data-x]').forEach(function (o) {
            if (o.getAttribute("data-x") !== "none") o.setAttribute("aria-pressed", "false");
          });
        }
        return;
      }
      S.exclusions[x] = on;
      b.setAttribute("aria-pressed", String(on));
      if (on) {
        S.noneTicked = false;
        var none = document.querySelector('.opt[data-x="none"]');
        if (none) none.setAttribute("aria-pressed", "false");
      }
    });
  });

  all("[data-unit]").forEach(function (b) {
    b.addEventListener("click", function () {
      var want = b.getAttribute("data-unit");
      if (S.unit === want) return;
      var kg = readKg(), cm = readCm();   // read in the old unit
      S.unit = want;
      writeKg(kg); writeCm(cm);           // rewrite every box in the new one
      all("[data-unit]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      showUnit();
    });
  });

  $("next").addEventListener("click", function () {
    var problem = stepProblem();
    if (problem) { $("err-step").textContent = problem; $("err-step").hidden = false; return; }
    if (S.step === STEPS.length - 1) finish();
    else { showStep(S.step + 1); trackStartOnce(); }
  });
  $("back").addEventListener("click", function () { showStep(S.step - 1); });
  $("restart").addEventListener("click", function () { showStep(0); });
  $("excl-back").addEventListener("click", function () {
    $("excluded").hidden = true;
    showStep(STEPS.length - 1);
    $("assessment").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("bump").addEventListener("click", function () {
    S.bumpOn = !S.bumpOn;
    $("bump").setAttribute("aria-pressed", String(S.bumpOn));
  });

  /* Consent gate. Both boxes must be ticked before checkout can start —
     the withdrawal waiver in the refund policy depends on collecting them,
     so this is not cosmetic. Neither is ever pre-checked. */
  function consentOk() { return S.consent.terms && S.consent.immediate; }

  function syncConsent() {
    var ready = consentOk();
    // Only gate on consent; an excluded visitor stays blocked regardless.
    if (!$("buy").dataset.blocked) $("buy").disabled = !ready;
    if (!ready && !$("buy").dataset.blocked) {
      $("buy-state").textContent = T("consent_required");
      $("buy-state").hidden = false;
    } else if (ready && !$("buy").dataset.blocked && !CFG.integrations.checkoutEnabled) {
      $("buy-state").textContent = T("checkout_unavailable");
      $("buy-state").hidden = false;
    }
  }

  all("[data-consent]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-consent");
      S.consent[k] = !S.consent[k];
      b.setAttribute("aria-pressed", String(S.consent[k]));
      syncConsent();
    });
  });

  $("buy").addEventListener("click", function () {
    if (!consentOk()) { syncConsent(); return; }
    buy();
  });

  all("[data-ev]").forEach(function (a) {
    a.addEventListener("click", function () { track(a.getAttribute("data-ev"), { goal: S.goal }); });
  });

  // Enter advances the stepper rather than submitting anything.
  $("quiz").addEventListener("submit", function (e) { e.preventDefault(); $("next").click(); });

  /* ------------------------------------------------------- home sections */

  /* The stats band. Numbers come from site/shop-data.json, which is written by
     ebooks/build.mjs by counting the actual content. If the file is missing the
     band removes itself rather than showing an em dash — a broken statistic is
     worse than no statistic. */
  var statTotals = null;

  function renderStats() {
    var band = $("stats");
    if (!band || !statTotals) return;
    var t = statTotals;
    var cells = [
          [t.planDays, T("Day plan")],
          [t.recipes, T("Recipes")],
          [t.ingredients, T("Ingredients costed")],
      [t.trainingPlans, T("Training plans")]
    ];
    band.innerHTML = "";
    cells.forEach(function (c) {
      var d1 = document.createElement("div");
      var b = document.createElement("b"); b.textContent = c[0];
      var sp = document.createElement("span"); sp.textContent = c[1];
      d1.appendChild(b); d1.appendChild(sp); band.appendChild(d1);
    });
  }

  (function () {
    if (!$("stats")) return;
    fetch("site/shop-data.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.totals) throw new Error("no totals");
        statTotals = d.totals;
        renderStats();
      })
      .catch(function () {
        var sec = document.getElementById("numbers");
        if (sec) sec.hidden = true;
      });
  })();

  /* The email capture. There is no list to post to yet, so rather than a form
     that silently throws an address away, it opens the visitor's mail client
     addressed to the support inbox — which is a place a human actually reads. */
  (function () {
    var form = $("signup-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("signup-email");
      var said = $("signup-said");
      var value = (input.value || "").trim();
      if (!value || value.indexOf("@") < 1 || value.indexOf(".") < 0) {
        said.textContent = T("That does not look like an email address.");
        said.hidden = false;
        input.focus();
        return;
      }
      var to = CFG.business && CFG.business.supportEmail;
      if (to) {
        window.location.href = "mailto:" + to +
          "?subject=" + encodeURIComponent("EVZO — add me to the list") +
          "&body=" + encodeURIComponent("Please add " + value + " to the EVZO email list.");
      }
      said.textContent = T("Thank you. Your mail app should open — send it and you are on the list.");
      said.hidden = false;
      track("newsletter_submit", {});
    });
  })();

  /* ------------------------------------------------------------------ boot */
  renderConfig();
  showUnit();
  showStep(0);
  syncConsent();

  window.EVZO_APP = { rerender: function () { renderConfig(); renderStats(); showStep(S.step); if (S.lastResult) renderResult(S.lastResult); } };
})();
