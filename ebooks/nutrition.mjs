/* EVZO — the arithmetic, in one place
 * ===========================================================================
 * Both the ebook builder and the blog generator import this. There is exactly
 * one implementation of "what are this recipe's macros" in the project, so a
 * figure printed in a PDF and the same figure published in a blog post cannot
 * disagree with each other.
 *
 * Nothing here estimates anything. Every number is per-100 g reference data
 * from foods.json multiplied by a weight in grams.
 * ======================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

export const FOODS = JSON.parse(readFileSync(join(HERE, "foods.json"), "utf8"));

/* Euro cost per kilogram, in the same state foods.json measures each food.
   Kept in its own file so a price can be updated from a receipt without
   anybody touching a nutrition figure — the two drift on completely
   different timescales. */
export const PRICES = JSON.parse(readFileSync(join(HERE, "prices.json"), "utf8"));

export function food(key) {
  const f = FOODS[key];
  if (!f || typeof f.kcal !== "number") throw new Error("Unknown or malformed food: " + key);
  return f;
}

/** Totals for a whole recipe, then divided by its servings. */
export function macros(recipe) {
  const t = { kcal: 0, protein: 0, carb: 0, fat: 0 };
  for (const item of recipe.ingredients) {
    const f = food(item.food);
    const k = item.g / 100;
    t.kcal += f.kcal * k;
    t.protein += f.protein_g * k;
    t.carb += f.carb_g * k;
    t.fat += f.fat_g * k;
  }
  const s = recipe.servings;
  const per = {
    kcal: Math.round(t.kcal / s),
    protein: Math.round(t.protein / s),
    carb: Math.round(t.carb / s),
    fat: Math.round(t.fat / s)
  };
  // EVZO's own metric: grams of protein per 100 kcal. Above ~15 a meal fills
  // you for its calories; below ~5 it does not.
  per.score = (per.protein / (per.kcal / 100)).toFixed(1);
  return per;
}

/** What a recipe costs to make, and what its protein costs.

    Returned per serving, in euro. `perProtein` is cents per gram of protein,
    which is the only number that actually compares a tin of lentils with a
    chicken breast — cheap food that gives you nothing back is not cheap.

    Throws on a missing price rather than silently treating it as free: a
    shopping total that quietly omits the meat is worse than no total. */
export function cost(recipe) {
  let total = 0;
  for (const item of recipe.ingredients) {
    const p = PRICES[item.food];
    if (!p || typeof p.eurPerKg !== "number") {
      throw new Error("No price for food: " + item.food + " (add it to prices.json)");
    }
    total += (p.eurPerKg / 1000) * item.g;
  }
  const per = total / recipe.servings;
  const m = macros(recipe);
  return {
    total: round5(total),
    per: round5(per),
    // cents per gram of protein
    perProtein: m.protein ? Math.round((per / m.protein) * 100) : null
  };
}

/* Rounded to five cents throughout. Printing 1.37 for a plate of food built
   from a loose tomato and a scoop of rice claims a precision the weekly shop
   does not have. */
function round5(v) { return Math.round(v * 20) / 20; }

/** Every recipe EVZO has written, keyed by id, with its macros attached. */
export function allRecipes() {
  const files = [
    "recipes.json",
    "recipes-bowls-dinners.json",
    "recipes-weight.json",
    "recipes-oats-eggs.json"
  ];
  const list = files.flatMap(f => JSON.parse(readFileSync(join(HERE, f), "utf8")).recipes);
  return list.map(r => ({ ...r, per: macros(r) }));
}
