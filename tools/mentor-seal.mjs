/* Seal the mentor page.
   =========================================================================
   evzo-method is a PUBLIC repository and GitHub Pages serves every file in
   it, so a plaintext mentor page is a plaintext page on the open internet,
   noindex or not. This script encrypts it instead: the repository holds only
   ciphertext, and the passphrase never goes near it.

   The plaintext source lives OUTSIDE the repository, at
   C:\Users\marco\mentor-src\mentor.html by default. Edit it there, re-run
   this, commit the sealed file.

       MENTOR_PASS="..." node tools/mentor-seal.mjs
       MENTOR_PASS="..." node tools/mentor-seal.mjs <plaintext> <out>

   AES-256-GCM with a PBKDF2-SHA256 key, 1,000,000 iterations - the same
   parameters the loader in mentor/index.html uses through WebCrypto, so the
   two must be changed together. GCM authenticates as well as encrypts, so a
   wrong passphrase fails loudly rather than producing garbage.
   ====================================================================== */

import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/* Raised from 310k: the ciphertext is downloadable by anyone, so the only
   thing standing between a copy of it and the contents is how expensive one
   guess is. A million iterations costs about a second once per device and
   multiplies an attacker's bill by three. */
const ITER = 1000000;

const pass = process.env.MENTOR_PASS;
if (!pass) {
  console.error("MENTOR_PASS is not set. Nothing was written.");
  process.exit(1);
}

const src = process.argv[2] || "C:\\Users\\marco\\mentor-src\\mentor.html";
const out = process.argv[3] || join(dirname(new URL(import.meta.url).pathname.slice(1)), "..", "mentor", "app.enc");

const plain = readFileSync(src);

/* Keep the salt that is already published, and the iteration count with it.
   The browser remembers the derived key, not the passphrase, and it throws
   that key away the moment the salt changes - so a fresh salt on every build
   meant logging in again after every single update, which is what made the
   app feel like it forgets him. The salt's job is to stop one precomputed
   table from attacking many files; with one file and one user, keeping it
   costs nothing. The IV is still fresh every time, which is the part that
   must never repeat.

   MENTOR_NEWSALT=1 forces a new one - for a passphrase change, where the key
   must be invalidated everywhere anyway. */
let salt, iter = ITER;
try {
  if (!process.env.MENTOR_NEWSALT) {
    const prev = JSON.parse(readFileSync(out, "utf8"));
    if (prev.salt) { salt = Buffer.from(prev.salt, "base64"); iter = prev.iter || ITER; }
  }
} catch (e) {
  // no previous file, or an unreadable one: a new salt is correct
}
if (!salt) salt = randomBytes(16);

const iv = randomBytes(12);
const key = pbkdf2Sync(pass, salt, iter, 32, "sha256");

const c = createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([c.update(plain), c.final()]);
const tag = c.getAuthTag();

/* WebCrypto expects the GCM tag appended to the ciphertext, so store it that
   way rather than as its own field. */
const sealed = {
  v: 1,
  kdf: "PBKDF2-SHA256",
  iter: iter,
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  ct: Buffer.concat([body, tag]).toString("base64")
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(sealed));
console.log(
  "sealed " + plain.length + " bytes of " + src + "\n" +
  "     -> " + out + " (" + JSON.stringify(sealed).length + " bytes)"
);
