# EVZO — automatic PDF delivery

Customer taps **Buy** → pays on Stripe → lands on a page with a **Download PDF**
button, and gets the same links by email within seconds. There are no manual
steps, and this works for every book in the shop and for the whole-library bundle.

```
shop Buy button ──► Stripe Payment Link ──► paid
                                             ├─► redirect  → Worker /thanks  → Download buttons (instant)
                                             └─► webhook   → Worker /webhook → email with links (Resend)
Download links → Worker /dl → PDF from a private R2 bucket (signed link, valid 72 h)
```

Files: `worker.js` (the whole backend), `setup-stripe.mjs` (creates every product,
price and Payment Link from `site/config.js`), `upload-pdfs.mjs` (puts the PDFs
in the private bucket).

## One-time setup (about 20 minutes)

You need three free accounts: **Stripe**, **Cloudflare** and **Resend**.

### 1. Cloudflare — deploy the Worker

```
cd C:\Users\marco\evzo\delivery
npm install
npx wrangler login
npx wrangler r2 bucket create evzo-pdfs
npm run upload
npx wrangler deploy
```

`deploy` prints the Worker address, e.g. `https://evzo-delivery.<you>.workers.dev`.
You need it in steps 3 and 4.

### 2. Resend — the email sender

1. resend.com → **Domains → Add domain** → `evzomethod.com`.
2. It shows 3–4 DNS records. Add them in **Namecheap → evzomethod.com → Advanced DNS**.
   Wait until Resend shows **Verified**.
3. **API Keys → Create** → copy it.

### 3. Secrets

```
npx wrangler secret put STRIPE_SECRET_KEY        # sk_test_... for now
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put DOWNLOAD_SIGNING_SECRET  # any long random text; never change it once live
```

Stripe → **Developers → Webhooks → Add endpoint**:
- URL: `https://evzo-delivery.<you>.workers.dev/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`

Copy its **signing secret** (`whsec_...`) and add it:

```
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4. Create the payment links (test mode first)

PowerShell:

```
$env:STRIPE_SECRET_KEY="sk_test_..."; $env:WORKER_URL="https://evzo-delivery.<you>.workers.dev"; npm run stripe
```

Open any link it prints, pay with card `4242 4242 4242 4242` (any future
date, any CVC), and use your own email. You should see the download page and
get the email. `npm run logs` shows what the Worker is doing live.

### 5. Go live

Test mode and live mode are separate in Stripe, so repeat with live keys:

1. `npx wrangler secret put STRIPE_SECRET_KEY` → `sk_live_...`
2. Add the same webhook endpoint in **live** mode, then
   `npx wrangler secret put STRIPE_WEBHOOK_SECRET` → the live `whsec_...`
3. `$env:STRIPE_SECRET_KEY="sk_live_..."; npm run stripe`. In live mode this
   also **writes every link into `site/config.js`** as `checkoutUrl`, and the
   shop's Buy buttons pick them up.
4. Commit and push the site as usual.

Then set `fulfilment.mode` to `"automatic"` in `site/config.js`, because
delivery really is instant now.

## Day to day

| Change | Run |
|---|---|
| Rebuilt the PDFs | `node ebooks/build.mjs` then `npm run upload` |
| Changed a price or added a book in `config.js` | `npm run stripe` (live key), then push the site |
| Customer says the link expired | Stripe → Payments → the payment → copy the session ID → send them `https://evzo-delivery.<you>.workers.dev/thanks?session_id=cs_live_...`, which gives them fresh buttons |

## Not covered

The **personalised 28-day meal guide (€39.99)** is not a ready-made PDF. It is
built for each person from their answers, so there is nothing on file to send
the moment they pay. It stays manual until plan generation exists (see
`site/INTEGRATION.md` §3–4).
