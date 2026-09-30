/* EVZO, questions page
 * ===========================================================================
 * Fills the two config-driven lines on /faq/ so the disclaimer wording lives in
 * one place (config.js) rather than being copied into a third page and drifting
 * out of step with the home page and the shop.
 * ======================================================================== */
(function () {
  "use strict";

  var CFG = window.EVZO_CONFIG;
  if (!CFG) return;
  var T = window.EVZO_T || function (s) { return s; };
  function $(id) { return document.getElementById(id); }

  if ($("faq-scope")) $("faq-scope").textContent = T(CFG.disclaimerFull || "");
  if ($("scope-faq")) $("scope-faq").textContent = T(CFG.disclaimerShort || "");
  if ($("legal-full")) $("legal-full").textContent = T(CFG.disclaimerFull || "");
})();
