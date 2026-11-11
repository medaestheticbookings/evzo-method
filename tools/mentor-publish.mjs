/* Seal the mentor page and put it live, in one command.
   =========================================================================
   The plaintext never enters this repository, and the passphrase never
   enters this script - it comes from the environment and is used once.

       MENTOR_PASS="..." node tools/mentor-publish.mjs

   What it does, in order: seal mentor-src/mentor.html into mentor/app.enc,
   commit that one file, push. If the seal fails, nothing is committed.
   ====================================================================== */

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: process.env });

if (!process.env.MENTOR_PASS) {
  console.error("MENTOR_PASS is not set. Nothing was sealed and nothing was pushed.");
  process.exit(1);
}

const src = "C:\\Users\\marco\\mentor-src\\mentor.html";
if (!existsSync(src)) {
  console.error("No plaintext at " + src);
  process.exit(1);
}

console.log("Sealing " + src + " (" + Math.round(statSync(src).size / 1024) + " KB)…");
run("node", ["tools/mentor-seal.mjs"]);

console.log("Committing the sealed file…");
try {
  run("git", ["add", "mentor/app.enc"]);
  run("git", ["commit", "-m", "Mentor: new sealed build"]);
} catch {
  console.log("Nothing changed — the sealed file is already current.");
  process.exit(0);
}
run("git", ["push", "origin", "HEAD"]);
console.log("\nLive in a minute at https://evzomethod.com/mentor/");
