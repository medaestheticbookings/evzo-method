/* EVZO — energy expenditure, in one place
 * ===========================================================================
 * The same contract as nutrition.mjs: one implementation, imported by the
 * ebook builder and the blog generator, so a burn figure printed in a PDF and
 * the same figure published on the site cannot disagree.
 *
 * The equation is the standard one used with the Compendium of Physical
 * Activities:
 *
 *     kcal = MET x 3.5 x bodyweight_kg / 200 x minutes
 *
 * It is an ESTIMATE of gross expenditure for a population average. It is not a
 * measurement of what a specific person burned, and nothing built on this
 * module may present it as one. Every page that prints a figure from here also
 * prints the weight it was computed for and the margin of error.
 * ======================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

export const WORKOUTS = JSON.parse(readFileSync(join(HERE, "workouts.json"), "utf8"));
export const ACTIVITIES = WORKOUTS.activities;
export const REF_WEIGHTS = WORKOUTS._method.referenceWeightsKg;

export function activity(key) {
  const a = ACTIVITIES[key];
  if (!a || typeof a.met !== "number") throw new Error("Unknown or malformed activity: " + key);
  return a;
}

/** Calories for one block of work, at one bodyweight. */
export function burn(metValue, minutes, kg) {
  return (metValue * 3.5 * kg / 200) * minutes;
}

/** A session's total minutes and its burn at each reference weight. */
export function sessionTotals(session) {
  const minutes = session.blocks.reduce((t, b) => t + b.minutes, 0);
  const kcal = {};
  for (const kg of REF_WEIGHTS) {
    kcal[kg] = Math.round(
      session.blocks.reduce((t, b) => t + burn(activity(b.activity).met, b.minutes, kg), 0)
    );
  }
  // The session's average intensity, which is what a single MET figure on a
  // mixed session actually means. Printed so nobody reads "6.0" off a page
  // that was half walking.
  const weighted = session.blocks.reduce((t, b) => t + activity(b.activity).met * b.minutes, 0);
  return { minutes, kcal, met: (weighted / minutes).toFixed(1) };
}

/** A whole week of a plan: totals across every session, at each weight. */
export function planTotals(plan) {
  const sessions = plan.sessions.map(sessionTotals);

  /* A plan's week is daysPerWeek sessions, which is not always the same as the
     number of sessions written out: the walking plan lists three shapes of
     walk and is done six days a week. Repeating the written sessions in order
     until the week is full is how the printed weekly figure stays honest. */
  const perWeek = plan.daysPerWeek;
  const week = { minutes: 0, kcal: {} };
  for (const kg of REF_WEIGHTS) week.kcal[kg] = 0;
  for (let i = 0; i < perWeek; i++) {
    const s = sessions[i % sessions.length];
    week.minutes += s.minutes;
    for (const kg of REF_WEIGHTS) week.kcal[kg] += s.kcal[kg];
  }
  return { sessions, week };
}
