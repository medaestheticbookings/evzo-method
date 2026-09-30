/* EVZO, tidy the address bar
 * ===========================================================================
 * Instagram and Facebook staple a click id onto every outbound link, so a
 * visitor arriving from the bio sees a hundred characters of tracking rubbish:
 *
 *   evzomethod.com/?utm_source=ig&utm_medium=social&fbclid=PAZXh0bgNhZW0CMTEA...
 *
 * None of it is ours to prevent, fbclid is added in transit by Meta. But it can
 * be taken back out of the bar once the page has loaded, which is what this
 * does: read the campaign values first, stash them for anything that wants to
 * know where the visitor came from, then rewrite the URL to the clean one.
 *
 * replaceState, not pushState: it must not add a history entry, so Back still
 * returns the visitor to Instagram rather than to the same page minus a query
 * string. Nothing is re-requested and no reload happens.
 * ======================================================================== */
(function () {
  "use strict";

  if (!window.history || !history.replaceState) return;

  var url;
  try { url = new URL(window.location.href); } catch (e) { return; }

  // Click ids from the ad platforms. Pure noise to a reader.
  var NOISE = ["fbclid", "gclid", "igshid", "mc_cid", "mc_eid", "msclkid",
               "ttclid", "twclid", "_ga", "ref_src", "ref_url"];
  // Campaign tags. Worth reading before they go, so attribution still works.
  var CAMPAIGN = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  var found = {};
  CAMPAIGN.forEach(function (k) {
    var v = url.searchParams.get(k);
    if (v) found[k] = v;
  });

  // Keep the first touch only: a visitor who arrives from the bio and later
  // lands again from an ad should not have the original overwritten.
  if (Object.keys(found).length) {
    try {
      if (!sessionStorage.getItem("evzo_campaign")) {
        sessionStorage.setItem("evzo_campaign", JSON.stringify(found));
      }
    } catch (e) { /* private mode, attribution is not worth an exception */ }
    window.EVZO_CAMPAIGN = found;
  }

  var before = url.search + url.hash;
  NOISE.concat(CAMPAIGN).forEach(function (k) { url.searchParams.delete(k); });

  // The home page logo used to point at "#top", which matches no element here
  // and never did. Links carrying it are still in circulation, so the fragment
  // is dropped rather than left hanging in the bar. Named explicitly instead of
  // testing every hash against the DOM, because cards on /shop/ and /blog/ are
  // built by script that has not run yet when this does.
  if (url.hash === "#top") url.hash = "";

  if (url.search + url.hash === before) return;

  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
})();
