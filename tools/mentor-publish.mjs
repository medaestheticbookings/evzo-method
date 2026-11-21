/* Build My Entrepreneur OS, seal it and put it live, in one command.
   =========================================================================
   The plaintext never enters this repository, and the passphrase never
   enters this script - it comes from the environment and is used once.

       MENTOR_PASS="<username>:<passphrase>" node tools/mentor-publish.mjs

   What it does, in order: rebuild C:\Users\marco\eos-src\eos.html from the
   two module sources (mentor-src\mentor.html and evzo\renew\index.html),
   seal that build into mentor/app.enc, commit that one file, push. If the
   build or the seal fails, nothing is committed.

   The page behind the lock is the OS now, not the mentor page alone - so
   the thing that gets sealed is the build, and the two module sources stay
   the only places either app is edited.
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

const OS_DIR = "C:\\Users\\marco\\eos-src";
const src = join(OS_DIR, "eos.html");

for (const need of [join(OS_DIR, "build.mjs"),
                    "C:\\Users\\marco\\mentor-src\\mentor.html",
                    join(ROOT, "renew", "index.html")]) {
  if (!existsSync(need)) {
    console.error("Missing a source the OS is built from: " + need);
    process.exit(1);
  }
}

console.log("Building the OS from its two module sources…");
execFileSync("node", ["build.mjs"], { cwd: OS_DIR, stdio: "inherit", env: process.env });

console.log("Sealing " + src + " (" + Math.round(statSync(src).size / 1024) + " KB)…");
run("node", ["tools/mentor-seal.mjs", src]);

console.log("Committing the sealed file…");
try {
  run("git", ["add", "mentor/app.enc"]);
  run("git", ["commit", "-m", "OS: new sealed build"]);
} catch {
  console.log("Nothing changed — the sealed file is already current.");
  process.exit(0);
}
run("git", ["push", "origin", "HEAD"]);
console.log("\nLive in a minute at https://evzomethod.com/mentor/");
