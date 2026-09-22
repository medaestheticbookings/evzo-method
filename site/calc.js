/* EVZO — calculation core
 * ============================================================================
 * Pure functions. No DOM, no strings for display, no side effects. Everything
 * here is unit-testable and is tested in calc.test.js.
 *
 * PROVENANCE OF THE CONSTANTS
 *   Mifflin-St Jeor resting metabolic rate (1990) — the equation most widely
 *   used for healthy adults. Returns kcal/day at complete rest.
 *   Activity multipliers are the conventional Harris-Benedict style factors.
 *   7,700 kcal ≈ 1 kg of body fat is the standard planning figure.
 *   Protein 1.6–2.2 g/kg bodyweight is the commonly cited range for active
 *   adults; EVZO publishes 1.8 as its working midpoint, so the range shown
 *   here is centred on that and the published figure stays consistent.
 *   Fat floor 0.6 g/kg keeps intake above the point where the diet becomes
 *   unreasonably restrictive.
 *
 * >>> TODO_OWNER / NOT PROFESSIONALLY REVIEWED
 * >>> These are standard published equations, but this specific implementation
 * >>> and the ranges it produces have NOT been reviewed by a registered
 * >>> dietitian or physician. Do not claim professional validation anywhere
 * >>> until that review has happened. See config.calculationsReviewedByProfessional.
 *
 * Everything returned is an ESTIMATE for general wellness education. Nothing
 * here diagnoses, treats or prescribes.
 * ========================================================================== */

(function (root) {
  "use strict";

  /* ---- constants ------------------------------------------------------- */
  var KCAL_PER_KG_FAT = 7700;   // planning figure for 1 kg body fat
  var KCAL_PER_G_PROTEIN = 4;
  var KCAL_PER_G_CARB = 4;
  var KCAL_PER_G_FAT = 9;
  var LB_IN_KG = 0.45359237;
  var CM_IN_INCH = 2.54;

  // Protein target range in g per kg bodyweight. Midpoint 1.8 matches the
  // figure EVZO already publishes, so page and feed never disagree.
  var PROTEIN_G_PER_KG = { low: 1.6, mid: 1.8, high: 2.0 };
  var FAT_G_PER_KG = { target: 0.8, floor: 0.6 };

  /* How the customer wants the same calories arranged. Only protein and fat are
     chosen here; carbohydrate is always whatever remains, so the total never
     moves. Every floor below still applies afterwards, which is what lets a
     preference shape the plan without being able to push it somewhere unsafe:
     fat never below FAT_G_PER_KG.floor, carbohydrate never below CARB_G_FLOOR. */
  var SPLIT_PREFS = {
    balanced:       { proteinKey: "mid",  fatPerKg: 0.8 },
    higher_protein: { proteinKey: "high", fatPerKg: 0.8 },
    lower_carb:     { proteinKey: "high", fatPerKg: 1.1 },
    higher_carb:    { proteinKey: "mid",  fatPerKg: 0.6 }
  };
  var DEFAULT_SPLIT = "balanced";
  var CARB_G_FLOOR = 50;

  var ACTIVITY = {
    sedentary: 1.2,
    light:     1.375,
    moderate:  1.55,
    hard:      1.725,
    athlete:   1.9
  };

  /* Supported input boundaries. Outside these the result is not shown: the
     equation is not validated there and a number would be misleading. */
  var BOUNDS = {
    age:    { min: 18, max: 79 },   // 18+ is a product rule, not just a maths one
    kg:     { min: 35, max: 250 },
    cm:     { min: 130, max: 230 }
  };

  /* Deficit / surplus caps. A deficit is never allowed to exceed 25% of
     maintenance, and intake is never taken below resting metabolic rate. */
  var MAX_DEFICIT_FRACTION = 0.25;
  var ABSOLUTE_FLOOR = { female: 1200, male: 1500 };

  /* ---- unit helpers ---------------------------------------------------- */
  function lbToKg(lb) { return lb * LB_IN_KG; }
  function kgToLb(kg) { return kg / LB_IN_KG; }
  function stoneToKg(st, lb) { return (st * 14 + lb) * LB_IN_KG; }
  function ftInToCm(ft, inch) { return (ft * 12 + inch) * CM_IN_INCH; }
  function cmToFtIn(cm) {
    var total = cm / CM_IN_INCH;
    var ft = Math.floor(total / 12);
    var inch = Math.round(total - ft * 12);
    if (inch === 12) { ft += 1; inch = 0; }
    return { ft: ft, inch: inch };
  }

  /* ---- safety screening ------------------------------------------------ */
  /* The exclusions the product will not auto-calculate or sell for. Each key
     is a question the user answers; true means the exclusion applies.
     Returns the list of reasons — empty means no exclusion. */
  var EXCLUSIONS = [
    "under18",
    "pregnantOrBreastfeeding",
    "eatingDisorder",
    "diabetesOrMetabolic",
    "organCondition",
    "severeAllergy",
    "prescribedDiet",
    "medicationAffectingWeight"
  ];

  function screen(answers) {
    answers = answers || {};
    var reasons = EXCLUSIONS.filter(function (k) { return answers[k] === true; });
    return { excluded: reasons.length > 0, reasons: reasons };
  }

  /* ---- input validation ------------------------------------------------ */
  /* Returns {valid, errors:{field:code}}. Codes are for the UI to translate —
     this module never produces display strings. */
  function validate(input) {
    var errors = {};
    var n = function (v) { return typeof v === "number" && isFinite(v); };

    if (!n(input.age)) errors.age = "required";
    else if (input.age < BOUNDS.age.min) errors.age = "under_min";
    else if (input.age > BOUNDS.age.max) errors.age = "over_max";

    if (!n(input.kg)) errors.kg = "required";
    else if (input.kg < BOUNDS.kg.min) errors.kg = "under_min";
    else if (input.kg > BOUNDS.kg.max) errors.kg = "over_max";

    if (!n(input.cm)) errors.cm = "required";
    else if (input.cm < BOUNDS.cm.min) errors.cm = "under_min";
    else if (input.cm > BOUNDS.cm.max) errors.cm = "over_max";

    if (input.sex !== "male" && input.sex !== "female") errors.sex = "required";
    if (!ACTIVITY[input.activity]) errors.activity = "required";
    if (["lose", "maintain", "gain"].indexOf(input.goal) === -1) errors.goal = "required";

    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  /* ---- core equations -------------------------------------------------- */

  /* Mifflin-St Jeor resting metabolic rate, kcal/day. */
  function rmr(input) {
    var base = 10 * input.kg + 6.25 * input.cm - 5 * input.age;
    return base + (input.sex === "male" ? 5 : -161);
  }

  /* Maintenance: resting rate scaled by an activity factor. */
  function maintenance(input) {
    return rmr(input) * ACTIVITY[input.activity];
  }

  /* Body mass index. NOT a diagnosis and deliberately returns no label beyond
     a coarse band key; the UI is responsible for saying it is a population
     screening ratio, not an assessment of an individual's health. */
  function bmi(input) {
    var value = input.kg / Math.pow(input.cm / 100, 2);
    var band = value < 18.5 ? "below" : value < 25 ? "middle" : value < 30 ? "above" : "high";
    return { value: value, band: band };
  }

  /* Translate a requested weekly rate (kg/week) into a daily calorie change,
     then clamp it to something defensible.

     Two clamps, in order:
       1. never more than MAX_DEFICIT_FRACTION of maintenance
       2. never below resting metabolic rate, nor below the absolute floor
     `clamped` tells the UI to explain why the number differs from the ask. */
  function energy(input) {
    var maint = maintenance(input);
    var rest = rmr(input);
    var perWeek = input.ratePerWeekKg || 0;

    var requested = 0;
    if (input.goal === "lose") requested = -(perWeek * KCAL_PER_KG_FAT / 7);
    else if (input.goal === "gain") requested = perWeek * KCAL_PER_KG_FAT / 7;

    var delta = requested;
    var clamped = false;

    // 1. cap the deficit as a share of maintenance
    var maxDeficit = maint * MAX_DEFICIT_FRACTION;
    if (delta < 0 && Math.abs(delta) > maxDeficit) { delta = -maxDeficit; clamped = true; }

    // 2. never prescribe below resting rate or the absolute floor
    var floor = Math.max(rest, ABSOLUTE_FLOOR[input.sex] || ABSOLUTE_FLOOR.female);
    var target = maint + delta;
    if (target < floor) { target = floor; delta = target - maint; clamped = true; }

    var actualPerWeek = Math.abs(delta) * 7 / KCAL_PER_KG_FAT;

    return {
      maintenance: maint,
      restingRate: rest,
      target: target,
      delta: delta,
      clamped: clamped,
      requestedPerWeekKg: perWeek,
      actualPerWeekKg: actualPerWeek
    };
  }

  /* Macro ranges. Calories and protein are returned as RANGES, not single
     numbers, because a point estimate overstates the precision of any of this.
     Protein range comes from PROTEIN_G_PER_KG; the calorie range is ±5%. */
  function macros(input) {
    var e = energy(input);

    var calorieRange = {
      low: Math.round(e.target * 0.95 / 10) * 10,
      high: Math.round(e.target * 1.05 / 10) * 10,
      mid: Math.round(e.target / 10) * 10
    };

    var proteinRange = {
      low: Math.round(input.kg * PROTEIN_G_PER_KG.low / 5) * 5,
      mid: Math.round(input.kg * PROTEIN_G_PER_KG.mid / 5) * 5,
      high: Math.round(input.kg * PROTEIN_G_PER_KG.high / 5) * 5
    };

    /* The split, shaped by what the customer said they like to eat. Fat yields
       to carbohydrate before protein does, and never drops below the floor;
       carbohydrate is whatever remains and never goes negative. An unknown or
       missing preference falls back to balanced rather than failing. */
    var split = SPLIT_PREFS[input.split] ? input.split : DEFAULT_SPLIT;
    var pref = SPLIT_PREFS[split];
    var proteinG = proteinRange[pref.proteinKey];
    var fatG = Math.max(input.kg * pref.fatPerKg, 40);
    var carbG = (calorieRange.mid - proteinG * KCAL_PER_G_PROTEIN - fatG * KCAL_PER_G_FAT) / KCAL_PER_G_CARB;

    if (carbG < CARB_G_FLOOR) {
      fatG = Math.max(
        (calorieRange.mid - proteinG * KCAL_PER_G_PROTEIN - CARB_G_FLOOR * KCAL_PER_G_CARB) / KCAL_PER_G_FAT,
        input.kg * FAT_G_PER_KG.floor
      );
      carbG = (calorieRange.mid - proteinG * KCAL_PER_G_PROTEIN - fatG * KCAL_PER_G_FAT) / KCAL_PER_G_CARB;
    }
    if (carbG < 0) carbG = 0;
    if (fatG < 0) fatG = 0;

    var kP = proteinG * KCAL_PER_G_PROTEIN,
        kC = carbG * KCAL_PER_G_CARB,
        kF = fatG * KCAL_PER_G_FAT;
    var totalK = kP + kC + kF || 1;

    return {
      energy: e,
      calorieRange: calorieRange,
      proteinRange: proteinRange,
      split: split,
      illustrativeSplit: {
        proteinG: Math.round(proteinG),
        carbG: Math.round(carbG),
        fatG: Math.round(fatG),
        proteinPct: kP / totalK * 100,
        carbPct: kC / totalK * 100,
        fatPct: kF / totalK * 100
      },
      /* EVZO's own metric: grams of protein per 100 kcal. Above ~15 a food is
         filling for its calories; below ~5 it is not. */
      proteinScore: proteinG / (calorieRange.mid / 100),
      bmi: bmi(input)
    };
  }

  /* The one entry point the UI calls. Screens first, validates second,
     calculates only if both pass. An excluded user gets NO numbers at all. */
  function assess(input, safetyAnswers) {
    var s = screen(safetyAnswers);
    if (s.excluded) return { ok: false, reason: "excluded", exclusions: s.reasons };

    var v = validate(input);
    if (!v.valid) return { ok: false, reason: "invalid", errors: v.errors };

    return { ok: true, result: macros(input) };
  }

  var API = {
    KCAL_PER_KG_FAT: KCAL_PER_KG_FAT,
    PROTEIN_G_PER_KG: PROTEIN_G_PER_KG,
    SPLIT_PREFS: SPLIT_PREFS,
    DEFAULT_SPLIT: DEFAULT_SPLIT,
    CARB_G_FLOOR: CARB_G_FLOOR,
    ACTIVITY: ACTIVITY,
    BOUNDS: BOUNDS,
    EXCLUSIONS: EXCLUSIONS,
    MAX_DEFICIT_FRACTION: MAX_DEFICIT_FRACTION,
    ABSOLUTE_FLOOR: ABSOLUTE_FLOOR,
    lbToKg: lbToKg, kgToLb: kgToLb, stoneToKg: stoneToKg,
    ftInToCm: ftInToCm, cmToFtIn: cmToFtIn,
    screen: screen, validate: validate,
    rmr: rmr, maintenance: maintenance, bmi: bmi,
    energy: energy, macros: macros, assess: assess
  };

  if (typeof module === "object" && module.exports) module.exports = API;
  else root.EVZO_CALC = API;

})(typeof globalThis !== "undefined" ? globalThis : this);
