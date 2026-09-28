/* EVZO, automatic PDF delivery, run by GitHub Actions every 5 minutes
 * ============================================================================
 * No server. .github/workflows/deliver.yml runs this on a timer:
 *
 *   1. Ask Stripe for Checkout Sessions completed in the last LOOKBACK_DAYS.
 *   2. Skip every one already listed in delivered.txt.
 *   3. For each paid one, read which PDFs it unlocks from the product
 *      metadata `evzo_files` (written by setup-stripe.mjs from site/config.js),
 *      decrypt those PDFs from books/, and email them as attachments via Resend.
 *   4. Append the session to delivered.txt; the workflow commits it.
 *
 * The repo is PUBLIC (GitHub Pages), so two rules hold:
 *   - PDFs are only ever committed encrypted (encrypt-pdfs.mjs, AES-256-GCM).
 *     The key exists only in .dev.vars on Marco's PC and as a GitHub secret.
 *   - delivered.txt holds a salted hash of each session id, never an email
 *     address or the id itself.
 *
 * If the commit of delivered.txt ever fails after an email went out, the next
 * run would send again; Resend's Idempotency-Key (the session id) swallows that
 * repeat for 24 hours.
 *
 * Env: STRIPE_SECRET_KEY, RESEND_API_KEY, EVZO_PDF_KEY (all GitHub secrets)
 * Local dry run, sends nothing:  node deliver.mjs --dry-run
 */
import { createRequire } from "node:module";
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createDecipheriv, createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = createRequire(import.meta.url)(join(HERE, "..", "site", "config.js"));
const LOG = join(HERE, "delivered.txt");
const DRY = process.argv.includes("--dry-run");
const LOOKBACK_DAYS = 7;

const MAIL_FROM = "EVZO <books@evzomethod.com>";
const SUPPORT_EMAIL = CONFIG.business.supportEmail;
const SITE_URL = CONFIG.site.baseUrl;

loadDevVars();
const env = process.env;
for (const k of ["STRIPE_SECRET_KEY", "RESEND_API_KEY", "EVZO_PDF_KEY"])
  if (!env[k]) exit(`Missing ${k}.`);

const done = new Set(existsSync(LOG)
  ? readFileSync(LOG, "utf8").split("\n").map(s => s.trim()).filter(Boolean) : []);

let sent = 0, failed = 0;
for await (const session of completedSessions()) {
  const mark = hashId(session.id);
  if (done.has(mark)) continue;
  if (!isPaid(session)) continue;              // async payment, picked up once it clears

  const email = session.customer_details && session.customer_details.email;
  const name = session.customer_details && session.customer_details.name || "";
  const books = await purchasedFiles(session.id);
  if (!books.length) continue;                 // not an EVZO sale
  if (!email) { console.error("No email on", session.id); failed++; continue; }

  try {
    if (DRY) console.log("[dry run] would send", books.map(b => b.file).join(", "), "for", session.id);
    else {
      await sendEmail(session.id, email, name, books);
      appendFileSync(LOG, mark + "\n");
      done.add(mark);
      console.log("Delivered", books.length, "book(s) for", session.id);
    }
    sent++;
  } catch (err) {
    // Leave it out of the log so the next run tries again.
    console.error("FAILED", session.id, err.message);
    failed++;
  }
}
console.log(`Done: ${sent} delivered, ${failed} failed.`);
if (failed) process.exit(1);                   // a red run in Actions, and GitHub emails Marco

/* ---- Stripe -------------------------------------------------------------- */

async function stripe(path) {
  const res = await fetch("https://api.stripe.com/v1/" + path, {
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY }
  });
  if (!res.ok) throw new Error("Stripe " + path + " -> " + res.status + " " + await res.text());
  return res.json();
}

async function* completedSessions() {
  const since = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400;
  let after = "";
  for (;;) {
    const page = await stripe(`checkout/sessions?status=complete&limit=100&created[gte]=${since}` +
      (after ? "&starting_after=" + after : ""));
    for (const s of page.data) yield s;
    if (!page.has_more || !page.data.length) return;
    after = page.data[page.data.length - 1].id;
  }
}

/* What a paid session unlocks: [{ name, file }], de-duplicated, so buying a
   book and the library in one go does not attach the book twice. */
async function purchasedFiles(sessionId) {
  const items = await stripe(
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
  if (count === 1 && product.name) return product.name.replace(/^EVZO, /, "");
  return file.replace(/^EVZO-/, "").replace(/\.pdf$/i, "").replace(/-/g, " ");
}

// A 100%-off promotion code completes with "no_payment_required", still a sale.
function isPaid(session) {
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

/* ---- PDFs ---------------------------------------------------------------- */

// books/<file>.enc = 12-byte IV | 16-byte GCM tag | ciphertext
function decryptPdf(file) {
  const path = join(HERE, "books", file + ".enc");
  if (!existsSync(path)) throw new Error("Missing " + path + ", run node encrypt-pdfs.mjs");
  const buf = readFileSync(path);
  const d = createDecipheriv("aes-256-gcm", Buffer.from(env.EVZO_PDF_KEY, "base64"), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]);
}

/* ---- email --------------------------------------------------------------- */

async function sendEmail(sessionId, to, name, books) {
  const first = (name || "").split(" ")[0];
  const many = books.length > 1;
  const list = books.map(b =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #22304a;color:#fff;font:600 16px Arial,sans-serif">${esc(b.name)}</td>
     <td style="padding:10px 0;border-bottom:1px solid #22304a;text-align:right;color:#FFE14D;font:800 13px Arial,sans-serif">PDF attached</td></tr>`
  ).join("");
  const html =
    `<div style="background:#0B1220;padding:32px 20px"><div style="max-width:520px;margin:0 auto;color:#fff;font:16px/1.5 Arial,sans-serif">
      <div style="font:900 28px Arial,sans-serif;letter-spacing:.04em;color:#FFE14D">EVZO</div>
      <h1 style="font:800 24px Arial,sans-serif;margin:24px 0 8px">${first ? "Thank you, " + esc(first) + "." : "Thank you."}</h1>
      <p style="color:#c9d2e3;margin:0 0 20px">Your ${many ? "books are" : "book is"} attached to this email. Save ${many ? "them" : "it"} to your phone or computer, ${many ? "they are" : "it is"} yours to keep.</p>
      <table style="width:100%;border-collapse:collapse">${list}</table>
      <p style="color:#8b97ad;font-size:13px;margin-top:24px">Can't see the attachment, or anything else wrong? Just reply to this email.</p>
      <p style="color:#8b97ad;font-size:13px">EVZO METHOD · <a href="${esc(SITE_URL)}" style="color:#FFE14D">${esc(SITE_URL.replace(/^https?:\/\//, ""))}</a></p>
    </div></div>`;
  const text = `Thank you${first ? ", " + first : ""}. Your EVZO ${many ? "books are" : "book is"} attached:\n\n` +
    books.map(b => "- " + b.name).join("\n") +
    `\n\nSave ${many ? "them" : "it"}, ${many ? "they are" : "it is"} yours to keep. Any problem, reply to this email.\n\n${SITE_URL}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": "evzo-" + sessionId
    },
    body: JSON.stringify({
      from: MAIL_FROM, to: [to], reply_to: SUPPORT_EMAIL,
      subject: many ? "Your EVZO books are here" : "Your EVZO book: " + books[0].name,
      html, text,
      attachments: books.map(b => ({ filename: b.file, content: decryptPdf(b.file).toString("base64") }))
    })
  });
  if (!res.ok) throw new Error("Resend " + res.status + " " + await res.text());
}

/* ---- helpers ------------------------------------------------------------- */

// Salted with the PDF key so the public log cannot be matched to session ids.
function hashId(id) {
  return createHash("sha256").update(env.EVZO_PDF_KEY + "|" + id).digest("hex").slice(0, 32);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Local runs read secrets from .dev.vars; in Actions they come from the env.
function loadDevVars() {
  const p = join(HERE, ".dev.vars");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function exit(msg) {
  console.error(msg);
  process.exit(1);
}
