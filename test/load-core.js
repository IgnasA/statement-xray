// Pulls the <script id="core"> block out of index.html and runs it in a sandbox,
// so the tests exercise exactly the code the page ships.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function coreSource() {
  const m = html.match(/<script id="core">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('index.html has no <script id="core"> block');
  return m[1];
}

function loadCore() {
  const ctx = vm.createContext({ URLSearchParams, TextDecoder, Uint8Array, ArrayBuffer, fetch: undefined });
  vm.runInContext(coreSource() + "\n;globalThis.Core = Core; globalThis.SALE = SALE;", ctx, { filename: "index.html#core" });
  return { Core: ctx.Core, SALE: ctx.SALE };
}

module.exports = { html, coreSource, loadCore };
