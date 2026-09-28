/* EVZO — automatic PDF delivery
 * ============================================================================
 * A buyer pays on a Stripe Payment Link and gets the book in two ways:
 *
 *   1. Straight away, on screen. The Payment Link redirects to
 *      /thanks?session_id=..., which asks Stripe whether that session is really
 *      paid and, if it is, shows a download button per book.
 *   2. By email. Stripe calls /webhook with checkout.session.completed; the
 *      signature is verified, and the buyer is emailed the same links.
 *
 * Which PDFs a purchase unlocks is NOT stored here. setup-stripe.mjs writes the
 * file names into each Stripe product's metadata (`evzo_files`), so the only
 * catalogue is the one in site/config.js, and the Worker just reads it back.
 *
 * The PDFs live in a PRIVATE R2 bucket. The only way to fetch one is a link
 * signed with DOWNLOAD_SIGNING_SECRET that expires after LINK_HOURS.
 *
 * Secrets (wrangler secret put ...):
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY,
 *   DOWNLOAD_SIGNING_SECRET
 * Vars (wrangler.toml): MAIL_FROM, SUPPORT_EMAIL, SITE_URL, LINK_HOURS,
 *   WORKER_URL (optional — defaults to the address the Worker is served on)
 * Binding: PDFS (R2 bucket)
 */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    // Download links point back at whatever address this Worker is served on.
    env = { ...env, WORKER_URL: env.WORKER_URL || url.origin };
    try {
      if (url.pathname === "/webhook" && req.method === "POST") return await webhook(req, env);
      if (url.pathname === "/thanks") return await thanks(url, env);
      if (url.pathname === "/dl") return await download(url, env);
      if (url.pathname === "/") return Response.redirect(env.SITE_URL, 302);
      return new Response("Not found", { status: 404 });
    } catch (err) {
      console.error(err && err.stack || err);
      return new Response("Something went wrong. Email " + env.SUPPORT_EMAIL + " and we will send your book by hand.",
        { status: 500 });
    }
  }
};

/* ---- Stripe -------------------------------------------------------------- */

async function stripe(env, path) {
  const res = await fetch("https://api.stripe.com/v1/" + path, {
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY }
  });
  if (!res.ok) throw new Error("Stripe " + path + " -> " + res.status + " " + await res.text());
  return res.json();
}

/* What a paid session unlocks: [{ name, file }], de-duplicated, so buying a
   book and the library in one go does not list the book twice. */
async function purchasedFiles(env, sessionId) {
  const items = await stripe(env,
    "checkout/sessions/" + encodeURIComponent(sessionId) + "/line_items?limit=100&expand[]=data.price.product");
  const seen = new Map();
  for (const li of items.data) {
    const product = li.price && li.price.product;
    const files = (product && product.metadata && product.metadata.evzo_files || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    for (const file of files) {
      if (!seen.has(file)) seen.set(file, { file, name: titleFor(file, product, files.length) });
    }
  }
  return [...seen.values()];
}

// A single-book product is named after the book; a bundle's files are named
// from the file name ("EVZO-Budget-Meals.pdf" -> "Budget Meals").
function titleFor(file, product, count) {
  if (count === 1 && product.name) return product.name;
  return file.replace(/^EVZO-/, "").replace(/\.pdf$/i, "").replace(/-/g, " ");
}

// A 100%-off promotion code completes with "no_payment_required" — still a sale.
function isPaid(session) {
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

async function verifyStripeSignature(body, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=")));
  const t = parts.t;
  const sigs = header.split(",").filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  if (!t || !sigs.length) return false;
  // Reject replays older than five minutes, as Stripe's own libraries do.
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = await hmacHex(secret, t + "." + body);
  return sigs.some(s => timingSafeEqual(s, expected));
}

/* ---- /webhook ------------------------------------------------------------ */

async function webhook(req, env) {
  const body = await req.text();   // the RAW body: signature is over the bytes
  const ok = await verifyStripeSignature(body, req.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response("Bad signature", { status: 400 });

  const event = JSON.parse(body);
  const types = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (!types.includes(event.type)) return new Response("ignored");

  const session = event.data.object;
  if (!isPaid(session)) return new Response("not paid yet");

  // Stripe retries webhooks. One marker per session means one email per
  // payment, however many times the event arrives.
  const marker = "sent/" + session.id;
  if (await env.PDFS.head(marker)) return new Response("already delivered");

  const email = session.customer_details && session.customer_details.email;
  const name = session.customer_details && session.customer_details.name || "";
  const books = await purchasedFiles(env, session.id);
  if (!email || !books.length) {
    console.error("Nothing to deliver for", session.id, email, books.length);
    return new Response("nothing to deliver");   // 200: retrying will not help
  }

  const links = await Promise.all(books.map(async b => ({ ...b, url: await signedUrl(env, b.file) })));
  await sendEmail(env, email, name, links);
  await env.PDFS.put(marker, JSON.stringify({ email, files: books.map(b => b.file), at: new Date().toISOString() }));
  return new Response("delivered");
}

/* ---- /thanks ------------------------------------------------------------- */

async function thanks(url, env) {
  const id = url.searchParams.get("session_id") || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return page(env, "Link not recognised",
    "<p>This page opens after a payment. If you have paid, your books are on their way to your inbox.</p>");

  const session = await stripe(env, "checkout/sessions/" + encodeURIComponent(id));
  if (!isPaid(session)) return page(env, "Payment still processing",
    "<p>Your payment has not cleared yet. As soon as it does, the download links arrive by email.</p>");

  const books = await purchasedFiles(env, id);
  const email = session.customer_details && session.customer_details.email;
  const rows = await Promise.all(books.map(async b =>
    `<li><span>${esc(b.name)}</span><a class="btn" href="${esc(await signedUrl(env, b.file))}">Download PDF</a></li>`));

  return page(env, "Thank you — your books are ready",
    `<p>Download them now. A copy of these links is on its way to <strong>${esc(email || "your inbox")}</strong>.</p>
     <ul class="dl">${rows.join("")}</ul>
     <p class="small">Links stay valid for ${Number(env.LINK_HOURS)} hours. Save the PDFs to your phone or computer —
     they are yours to keep. Lost them? Email <a href="mailto:${esc(env.SUPPORT_EMAIL)}">${esc(env.SUPPORT_EMAIL)}</a>.</p>`);
}

/* ---- /dl ----------------------------------------------------------------- */

async function signedUrl(env, file) {
  const exp = Math.floor(Date.now() / 1000) + Number(env.LINK_HOURS) * 3600;
  const sig = await hmacHex(env.DOWNLOAD_SIGNING_SECRET, file + "|" + exp);
  const base = env.WORKER_URL.replace(/\/$/, "");
  return `${base}/dl?f=${encodeURIComponent(file)}&e=${exp}&s=${sig}`;
}

async function download(url, env) {
  const file = url.searchParams.get("f") || "";
  const exp = Number(url.searchParams.get("e") || 0);
  const sig = url.searchParams.get("s") || "";
  if (!/^[A-Za-z0-9._-]+\.pdf$/.test(file)) return new Response("Bad link", { status: 400 });
  if (!timingSafeEqual(sig, await hmacHex(env.DOWNLOAD_SIGNING_SECRET, file + "|" + exp)))
    return new Response("Bad link", { status: 403 });
  if (exp < Date.now() / 1000) return page(env, "This link has expired",
    `<p>Download links last ${Number(env.LINK_HOURS)} hours. Email <a href="mailto:${esc(env.SUPPORT_EMAIL)}">${esc(env.SUPPORT_EMAIL)}</a>
     with the address you paid with and we will send fresh ones.</p>`, 410);

  const obj = await env.PDFS.get("books/" + file);
  if (!obj) {
    console.error("Missing PDF in R2:", file);
    return new Response("File missing — email " + env.SUPPORT_EMAIL + " and we will send it by hand.", { status: 404 });
  }
  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, no-store"
    }
  });
}

/* ---- email --------------------------------------------------------------- */

async function sendEmail(env, to, name, links) {
  const first = (name || "").split(" ")[0];
  const list = links.map(l =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #22304a;color:#fff;font:600 16px Arial,sans-serif">${esc(l.name)}</td>
     <td style="padding:10px 0;border-bottom:1px solid #22304a;text-align:right">
       <a href="${esc(l.url)}" style="background:#FFE14D;color:#0B1220;padding:10px 16px;border-radius:999px;font:800 14px Arial,sans-serif;text-decoration:none">Download PDF</a></td></tr>`
  ).join("");
  const html =
    `<div style="background:#0B1220;padding:32px 20px"><div style="max-width:520px;margin:0 auto;color:#fff;font:16px/1.5 Arial,sans-serif">
      <div style="font:900 28px Arial,sans-serif;letter-spacing:.04em;color:#FFE14D">EVZO</div>
      <h1 style="font:800 24px Arial,sans-serif;margin:24px 0 8px">${first ? "Thank you, " + esc(first) + "." : "Thank you."}</h1>
      <p style="color:#c9d2e3;margin:0 0 20px">Your ${links.length > 1 ? "books are" : "book is"} ready. Tap to download:</p>
      <table style="width:100%;border-collapse:collapse">${list}</table>
      <p style="color:#8b97ad;font-size:13px;margin-top:24px">Links stay valid for ${Number(env.LINK_HOURS)} hours — save the PDF once and it is yours to keep.
      Any problem, just reply to this email.</p>
      <p style="color:#8b97ad;font-size:13px">EVZO METHOD · <a href="${esc(env.SITE_URL)}" style="color:#FFE14D">${esc(env.SITE_URL.replace(/^https?:\/\//, ""))}</a></p>
    </div></div>`;
  const text = `Thank you${first ? ", " + first : ""}. Your EVZO ${links.length > 1 ? "books are" : "book is"} ready:\n\n` +
    links.map(l => `${l.name}\n${l.url}`).join("\n\n") +
    `\n\nLinks stay valid for ${Number(env.LINK_HOURS)} hours. Any problem, reply to this email.`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM, to: [to], reply_to: env.SUPPORT_EMAIL,
      subject: links.length > 1 ? "Your EVZO books are ready" : "Your EVZO book: " + links[0].name,
      html, text
    })
  });
  // Throwing makes the webhook return 500, so Stripe retries later — the
  // marker is only written after a successful send.
  if (!res.ok) throw new Error("Resend " + res.status + " " + await res.text());
}

/* ---- helpers ------------------------------------------------------------- */

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function page(env, title, body, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)} · EVZO</title>
<style>
  body{margin:0;background:#0B1220;color:#fff;font:16px/1.55 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
  main{max-width:560px;margin:0 auto;padding:48px 16px}
  .logo{font:900 30px Arial,sans-serif;letter-spacing:.04em;color:#FFE14D;text-decoration:none}
  h1{font-size:28px;line-height:1.15;margin:28px 0 12px}
  p{color:#c9d2e3} a{color:#FFE14D} .small{font-size:14px;color:#8b97ad}
  .dl{list-style:none;padding:0;margin:24px 0}
  .dl li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #22304a;font-weight:600}
  .btn{background:#FFE14D;color:#0B1220;padding:10px 18px;border-radius:999px;font-weight:800;text-decoration:none;white-space:nowrap}
</style></head><body><main>
<a class="logo" href="${esc(env.SITE_URL)}">EVZO</a>
<h1>${esc(title)}</h1>${body}
</main></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
