/* EVZO, Meta Pixel
 * ============================================================================
 * Dataset "EVZO", id 1407433111589504, in the evzo business portfolio.
 *
 * THE PIXEL DOES NOT LOAD UNTIL MARKETING CONSENT IS GIVEN. Not "loads and
 * waits", not "loads with limited data use": the script tag is never inserted
 * until EVZO_CONSENT reports marketing === true. consent.js was written for
 * exactly this, so there is no reason to retrofit the usual arrangement where
 * the pixel has already fired by the time the banner is read.
 *
 * WHAT IS NEVER SENT
 * ------------------
 * Nothing from the assessment. Not the goal, not the weight, not the age, and
 * above all not the safety answers: pregnancy, a current or previous eating
 * disorder, diabetes, organ conditions, prescribed diets. Those are health
 * data, which is special category under GDPR Article 9 and is prohibited data
 * under Meta's own Business Tools Terms. Sending it is both unlawful and the
 * kind of thing that ends an ad account, and it would break the promise the
 * legal pages make in as many words.
 *
 * So the Lead event fires when somebody finishes the assessment, and carries
 * no parameters at all. "Somebody got to the end" is a business fact. What
 * they answered is not ours to pass on.
 *
 * Purchases are not tracked here either: checkout happens on Stripe, off this
 * origin, so there is no thank-you page on evzomethod.com for a Purchase event
 * to fire on. InitiateCheckout, the moment they leave for Stripe, is the last
 * thing this site can honestly observe.
 * ========================================================================= */
(function (root) {
  "use strict";

  var PIXEL_ID = "1407433111589504";
  var loaded = false;

  /* Meta's standard snippet, with the init and the first PageView held back
     until after the loader has been installed, so a queued call cannot fire
     against a pixel that has not been given its id yet. */
  function install() {
    if (loaded || root.fbq) return;
    loaded = true;

    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(root, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */

    root.fbq("init", PIXEL_ID);
    root.fbq("track", "PageView");

    /* Anything asked for before consent arrived, replayed now. Queued rather
       than dropped so a click that happened while the banner was still up is
       not lost, and queued rather than sent so it is not sent without consent
       either. */
    pending.forEach(function (a) { root.fbq("track", a[0], a[1]); });
    pending.length = 0;
  }

  var pending = [];

  /* The only way anything in this file sends an event. Parameters are passed
     through untouched, so every caller is responsible for what it puts in
     them, and every caller in this project puts in nothing personal. */
  function track(event, params) {
    if (!root.EVZO_CONSENT || !root.EVZO_CONSENT.allows("marketing")) {
      pending.push([event, params]);
      return;
    }
    if (!loaded) install();
    if (root.fbq) root.fbq("track", event, params);
  }

  root.EVZO_PIXEL = { track: track, id: PIXEL_ID };

  if (!root.EVZO_CONSENT) return;
  if (root.EVZO_CONSENT.allows("marketing")) install();
  else root.EVZO_CONSENT.whenAllowed("marketing", install);
})(window);
