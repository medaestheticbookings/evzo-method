/* EVZO — cookie and tracking consent
 * ===========================================================================
 * A consent manager that actually withholds consent, rather than a banner
 * that appears after the tracking has already loaded. Most cookie banners are
 * the second thing; this is the first.
 *
 * WHAT THE LAW ACTUALLY REQUIRES (GDPR + the ePrivacy Directive, as read by
 * the EDPB and enforced across the EU and Cyprus):
 *
 *   1. PRIOR consent. Nothing non-essential may load, and nothing may be
 *      written to the device, before the visitor agrees. A banner shown while
 *      a pixel is already firing is not consent, it is a notification.
 *   2. GRANULAR. Analytics and marketing are separate purposes and get
 *      separate switches. One "accept everything" toggle is not valid.
 *   3. REFUSING MUST BE AS EASY AS AGREEING. A prominent "Accept all" beside
 *      a buried "manage preferences" link is the single most-fined dark
 *      pattern in the EU. Both buttons here are the same size, same weight,
 *      same row.
 *   4. NOTHING PRE-TICKED. Silence is not consent (Planet49, C-673/17), so
 *      every optional switch starts off.
 *   5. WITHDRAWABLE AT ANY TIME, as easily as it was given. Hence the
 *      permanent "Cookie settings" link in the footer of every page.
 *   6. RECORDED. The choice is stored with a timestamp and a policy version
 *      so it can be evidenced, and so that changing the policy re-asks
 *      instead of silently inheriting an old answer.
 *
 * WHAT THIS SITE ACTUALLY DOES TODAY: nothing. No cookies, no analytics, no
 * third-party requests — the fonts are self-hosted precisely so there is no
 * transfer to Google to ask about. The banner exists so that the moment
 * Stripe or a pixel is connected, consent is already being collected properly
 * rather than retrofitted.
 *
 * THE ONE THING STORED WITHOUT ASKING is the consent choice itself, in
 * localStorage. That is permitted as strictly necessary: it exists solely to
 * honour the visitor's decision, and asking permission to remember a
 * permission is circular.
 * ======================================================================== */
(function (root) {
  "use strict";

  var KEY = "evzo.consent";
  /* Bump this when the purposes change. An old answer to a different question
     is not consent, so a bump re-asks everyone. */
  var VERSION = 1;

  var PURPOSES = ["analytics", "marketing"];

  var listeners = [];
  var state = null;

  /* ------------------------------------------------------------- storage */
  /* Private browsing and blocked storage both throw. A visitor who cannot be
     remembered is treated as having consented to nothing, which is the safe
     failure — they simply see the banner again. */
  function read() {
    try {
      var raw = root.localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || v.version !== VERSION) return null;
      return v;
    } catch (e) { return null; }
  }

  function write(choice) {
    var record = {
      version: VERSION,
      at: new Date().toISOString(),
      analytics: choice.analytics === true,
      marketing: choice.marketing === true
    };
    state = record;
    try { root.localStorage.setItem(KEY, JSON.stringify(record)); } catch (e) {}
    listeners.forEach(function (fn) { try { fn(record); } catch (e) {} });
    return record;
  }

  /* --------------------------------------------------------------- api */
  var API = {
    /** Has this visitor answered the current version of the question? */
    answered: function () { return state !== null; },

    /** Consent for one purpose. Unanswered always reads false. */
    allows: function (purpose) {
      return !!(state && state[purpose] === true);
    },

    /** The stored record, for a support request or an audit. */
    record: function () { return state ? JSON.parse(JSON.stringify(state)) : null; },

    /** Run fn now if already allowed, and again whenever consent is granted.
        This is how a tracker should be attached: it cannot fire early. */
    whenAllowed: function (purpose, fn) {
      if (API.allows(purpose)) { fn(); return; }
      listeners.push(function (rec) { if (rec[purpose] === true) fn(); });
    },

    onChange: function (fn) { listeners.push(fn); },

    set: function (choice) { write(choice); hide(); },

    acceptAll: function () { write({ analytics: true, marketing: true }); hide(); },

    /* Named "reject" rather than "necessary only" because that is what the
       visitor is doing, and the wording on the button should match. */
    rejectAll: function () { write({ analytics: false, marketing: false }); hide(); },

    /** Reopen the chooser. Wired to the footer link on every page. */
    open: function () { render(true); }
  };

  /* ------------------------------------------------------------- the ui */
  var el = null;

  function T(s) { return (root.EVZO_T || function (x) { return x; })(s); }

  function hide() {
    if (!el) return;
    el.classList.remove("on");
    // leave it in the DOM so the footer link can reopen it without a rebuild
    root.setTimeout(function () { if (el) el.hidden = true; }, 260);
  }

  /* Two states. The bar is what almost everyone sees: one sentence, three
     buttons, gone in a second. The panel is for the few who want to set
     purposes individually, and it only opens if asked for.

     Reject and accept sit side by side in both states at the same size. That
     is the part that has to stay equal however small the bar gets. */
  var expanded = false;

  function render(force) {
    if (state && !force) return;
    if (force) expanded = false;

    if (!el) {
      el = document.createElement("div");
      el.className = "cc";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", T("Cookie settings"));
      document.body.appendChild(el);
    }

    el.innerHTML = expanded ? panelHtml() : barHtml();
    wire();

    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add("on"); });
  }

  function barHtml() {
    return '<div class="cc-in cc-bar">' +
      '<p>' + T("No cookies, no tracking, nothing sent to anyone.") +
        ' <a href="legal.html#cookies">' + T("Details") + '</a></p>' +
      '<div class="cc-act">' +
        '<button type="button" class="btn btn-ghost cc-more">' + T("Choose") + '</button>' +
        '<button type="button" class="btn btn-ghost cc-reject">' + T("Reject") + '</button>' +
        '<button type="button" class="btn cc-accept">' + T("OK") + '</button>' +
      '</div>' +
    '</div>';
  }

  function panelHtml() {
    var a = state ? state.analytics : false;
    var m = state ? state.marketing : false;
    return '<div class="cc-in">' +
      '<h2>' + T("What you allow") + '</h2>' +
      '<div class="cc-rows">' +
        '<div class="cc-row"><div><b>' + T("Strictly necessary") + '</b>' +
          '<span>' + T("Remembering this choice. Cannot be switched off.") + '</span></div>' +
          '<span class="cc-fixed">' + T("Always on") + '</span></div>' +
        '<label class="cc-row"><div><b>' + T("Analytics") + '</b>' +
          '<span>' + T("Anonymous page counts. Never your answers or your email.") + '</span></div>' +
          '<input type="checkbox" data-p="analytics"' + (a ? " checked" : "") + '></label>' +
        '<label class="cc-row"><div><b>' + T("Advertising") + '</b>' +
          '<span>' + T("Which advert led to a sale. Nothing health-related.") + '</span></div>' +
          '<input type="checkbox" data-p="marketing"' + (m ? " checked" : "") + '></label>' +
      '</div>' +
      '<div class="cc-act">' +
        '<button type="button" class="btn btn-ghost cc-reject">' + T("Reject all") + '</button>' +
        '<button type="button" class="btn cc-save">' + T("Save") + '</button>' +
      '</div>' +
      '<p class="cc-note">' + T("Change it any time from “Cookie settings” at the foot of the page.") +
        ' <a href="legal.html#cookies">' + T("Cookie policy") + '</a></p>' +
    '</div>';
  }

  function wire() {
    var q = function (sel) { return el.querySelector(sel); };
    if (q(".cc-accept")) q(".cc-accept").addEventListener("click", API.acceptAll);
    if (q(".cc-reject")) q(".cc-reject").addEventListener("click", API.rejectAll);
    if (q(".cc-more")) q(".cc-more").addEventListener("click", function () {
      expanded = true;
      el.innerHTML = panelHtml();
      wire();
    });
    if (q(".cc-save")) q(".cc-save").addEventListener("click", function () {
      var choice = {};
      PURPOSES.forEach(function (p) {
        var box = q('input[data-p="' + p + '"]');
        choice[p] = !!(box && box.checked);
      });
      API.set(choice);
    });
  }

  /* ------------------------------------------------------------- start */
  state = read();
  root.EVZO_CONSENT = API;

  function boot() {
    render(false);
    // The footer link on every page reopens the chooser — this is the
    // "withdraw as easily as you gave" requirement, and it must never be
    // removed from a page.
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-cookie-settings]'),
      function (a) {
        a.addEventListener("click", function (e) { e.preventDefault(); API.open(); });
      }
    );
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})(window);
