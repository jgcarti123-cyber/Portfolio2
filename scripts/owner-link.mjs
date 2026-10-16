// Prints a link that marks the browser you open it in as John's, so the site can show you as
// "online" while a tab is open. It lasts 15 minutes; the browser then stays marked for 60 days.
//
//   node scripts/owner-link.mjs https://portfolio2-one-iota-55.vercel.app

import crypto from "node:crypto";
import fs from "node:fs";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()]),
);
if (!env.C4_OWNER_SECRET) {
  console.error("C4_OWNER_SECRET is missing from .env.local");
  process.exit(1);
}
const exp = Date.now() + 15 * 60 * 1000;
const sig = crypto.createHmac("sha256", env.C4_OWNER_SECRET).update(`owner-link:${exp}`).digest("base64url");
console.log(`${base}/api/c4/owner?e=${exp}&s=${sig}`);
