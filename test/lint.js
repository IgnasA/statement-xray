// Lightweight checks with no dependencies:
// 1. every inline <script> in index.html parses;
// 2. docs/index.html is exactly what build.sh would produce from index.html.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
let failed = 0;

const scripts = [...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach((src, i) => {
  try { new vm.Script(src, { filename: `index.html <script> #${i + 1}` }); }
  catch (e) { failed++; console.error(`Syntax error in script #${i + 1}: ${e.message}`); }
});
console.log(`${scripts.length} inline scripts parsed`);

const built = path.join(root, "docs", "index.html");
const before = fs.readFileSync(built, "utf8");
execFileSync(path.join(root, "build.sh"), { stdio: "ignore" });
const after = fs.readFileSync(built, "utf8");
if (before !== after) {
  failed++;
  console.error("docs/index.html was out of date with index.html (build.sh has now rebuilt it; commit the result).");
} else console.log("docs/index.html matches build.sh output");

process.exit(failed ? 1 : 0);
