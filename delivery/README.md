# EVZO, automatic PDF delivery

Customer taps **Buy** → pays on Stripe → lands on `evzomethod.com/shop/thanks.html`
→ within about 5–15 minutes gets an email from `books@evzomethod.com` with the
PDF(s) **attached**. No server and nothing to pay for except Stripe's card fee.

```
shop Buy button ──► Stripe Payment Link ──► paid ──► redirect to shop/thanks.html
GitHub Actions, every 5 min ──► deliver.mjs ──► asks Stripe for new paid sessions
                                             └─► emails the PDFs via Resend
```

| File | Job |
|---|---|
| `deliver.mjs` | the whole delivery; run by `.github/workflows/deliver.yml` |
| `encrypt-pdfs.mjs` | encrypts the PDFs into `books/*.enc` (the repo is public) |
| `set-secrets.mjs` | copies the keys from `.dev.vars` into GitHub secrets, unprinted |
| `setup-stripe.mjs` | creates every Stripe product, price and Payment Link from `site/config.js` |
| `delivered.txt` | hashed list of orders already sent, committed by the workflow |
| `.dev.vars` | the secret keys on this PC. Git-ignored, never commit it |

Which PDFs each purchase unlocks lives in Stripe product metadata (`evzo_files`),
written by `setup-stripe.mjs`, so `site/config.js` stays the only catalogue.

## Status (28 Sep 2026)

- Resend: done. `evzomethod.com` verified, key in `.dev.vars` and GitHub.
- PDFs: encrypted into `books/`, key in `.dev.vars` and GitHub.
- **Stripe: not connected.** Until `STRIPE_SECRET_KEY` is a GitHub secret the
  workflow runs and does nothing.

## Connecting Stripe

1. Put the key in `.dev.vars` as `STRIPE_SECRET_KEY=sk_test_...` (test first).
2. `node set-secrets.mjs`
3. `node setup-stripe.mjs`, open a printed link, pay with `4242 4242 4242 4242`,
   any future date, any CVC, your own email.
4. GitHub → Actions → **Deliver ebooks** → **Run workflow** (or wait 5 minutes).
   The email should arrive with the PDF attached.
5. Go live: repeat 1–3 with `sk_live_...`. In live mode `setup-stripe.mjs` also
   writes every link into `site/config.js` as `checkoutUrl`; commit and push.

## Day to day

| Change | Run |
|---|---|
| Rebuilt the PDFs | `node ebooks/build.mjs`, `node delivery/encrypt-pdfs.mjs`, commit, push |
| Changed a price or added a book in `config.js` | `node delivery/setup-stripe.mjs` (live key), encrypt, push |
| Customer never got it | Actions tab → latest **Deliver ebooks** run log; resend by hand from Resend → Emails |
| Send right now instead of waiting | Actions → Deliver ebooks → Run workflow |

A failed delivery turns the Actions run red, and GitHub emails the account owner.

GitHub pauses scheduled workflows in a repo with no commits for 60 days. The
site gets pushed far more often than that, but if sales ever stop arriving,
check Actions → Deliver ebooks is still enabled.

## Not covered

The **personalised 28-day meal guide (€39.99)** is built per person from their
answers, so there is no ready-made PDF to send. It stays manual until plan
generation exists (see `site/INTEGRATION.md` §3–4).
