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

   AES-256-GCM with a PBKDF2-SHA256 key, 310,000 iterations - the same
   parameters the loader in mentor/index.html uses through WebCrypto, so the
   two must be changed together. GCM authenticates as well as encrypts, so a
   wrong passphrase fails loudly rather than producing garbage.
   ====================================================================== */

import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ITER = 310000;

const pass = process.env.MENTOR_PASS;
if (!pass) {
  console.error("MENTOR_PASS is not set. Nothing was written.");
  process.exit(1);
}

const src = process.argv[2] || "C:\\Users\\marco\\mentor-src\\mentor.html";
const out = process.argv[3] || join(dirname(new URL(import.meta.url).pathname.slice(1)), "..", "mentor", "app.enc");

const plain = readFileSync(src);

const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(pass, salt, ITER, 32, "sha256");

const c = createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([c.update(plain), c.final()]);
const tag = c.getAuthTag();

/* WebCrypto expects the GCM tag appended to the ciphertext, so store it that
   way rather than as its own field. */
const sealed = {
  v: 1,
  kdf: "PBKDF2-SHA256",
  iter: ITER,
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
