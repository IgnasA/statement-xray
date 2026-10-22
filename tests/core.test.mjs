// Runs the page's Core module (the <script id="core"> block in index.html) under Node.
// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const src = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const ctx = vm.createContext({ URLSearchParams });
vm.runInContext(src + "\nthis.Core = Core; this.SALE = SALE;", ctx);
const { Core } = ctx;
// Values made inside the vm have their own Array/Object prototypes, so compare them as plain data.
const plain = v => JSON.parse(JSON.stringify(v));

const HEADER = "Date,Type,Title,Info,Currency,Amount,Fees & Taxes,Net,Tax Details";
const statement = (...lines) => [HEADER, ...lines].join("\n");
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.005, `${a} is not ${b}`);

test("parseCSV handles quotes, escaped quotes and CRLF", () => {
  assert.deepEqual(plain(Core.parseCSV('a,"b, c","say ""hi"""\r\n1,2,3\r\n\r\n')), [["a", "b, c", 'say "hi"'], ["1", "2", "3"]]);
});

test("money reads the formats Etsy uses", () => {
  assert.equal(Core.money("$1,234.56"), 1234.56);
  assert.equal(Core.money("-$2.00"), -2);
  assert.equal(Core.money("(1.20)"), -1.2);
  assert.equal(Core.money("--"), 0);
  assert.equal(Core.money("1.234,56 €"), 1234.56);
  assert.equal(Core.money("-€2,50"), -2.5);
});

test("monthKey reads Etsy date styles", () => {
  assert.equal(Core.monthKey("August 3, 2026"), "2026-08");
  assert.equal(Core.monthKey("3 Aug 2026"), "2026-08");
  assert.equal(Core.monthKey("2026-8-03"), "2026-08");
  assert.equal(Core.monthKey("08/03/2026"), "2026-08");
  assert.equal(Core.monthKey("25/08/26"), "2026-08");
  assert.equal(Core.monthKey("someday"), null);
});

test("the example shop reconciles with its own Net column", () => {
  const rep = Core.analyze([{ name: "example.csv", text: Core.sample() }]);
  assert.ok(rep.ok);
  assert.ok(rep.check);
  assert.equal(rep.months.length, 3);
});

test("analyze splits a small statement into categories", () => {
  const rep = Core.analyze([{ name: "aug.csv", text: statement(
    '"August 2, 2026",Sale,Payment for Order #1234567,Order #1234567,USD,$30.00,-$1.15,$28.85,--',
    '"August 2, 2026",Fee,"Transaction fee: Mug",Order #1234567,USD,--,-$1.95,-$1.95,--',
    '"August 3, 2026",Fee,Listing fee,Listing #99,USD,--,-$0.20,-$0.20,--',
    '"August 5, 2026",Fee,Offsite Ads fee,Order #1234567,USD,--,-$4.50,-$4.50,--',
    '"August 9, 2026",Deposit,$20.00 sent to your bank account,,USD,--,--,--,--',
  ) }]);
  const T = rep.totals;
  near(T.gross, 30);
  near(T.cats.processing, 1.15);
  near(T.cats.transaction, 1.95);
  near(T.cats.listing, 0.2);
  near(T.cats.offsite, 4.5);
  near(T.kept, 22.2);
  assert.ok(rep.check);
  assert.equal(rep.orders[0].item, "Mug");
  assert.equal(rep.counts.offsiteOrders, 1);
});

test("a file loaded twice is only counted once", () => {
  const text = statement('"August 2, 2026",Sale,Payment for Order #1234567,Order #1234567,USD,$30.00,-$1.15,$28.85,--');
  const rep = Core.analyze([{ name: "a.csv", text }, { name: "a copy.csv", text }]);
  near(rep.totals.gross, 30);
});

test("files that aren't statements are reported, not counted", () => {
  const rep = Core.analyze([{ name: "orders.csv", text: "Order ID,Buyer\n1,Ann" }]);
  assert.equal(rep.ok, false);
  assert.match(rep.problems[0], /orders\.csv doesn't look like/);
});

test("verifyLicense handles Gumroad's answers", async () => {
  const reply = (status, body) => async () => ({ status, json: async () => body });
  const opts = fetchFn => ({ productId: "p", maxDevices: 2, activate: true, fetchFn });
  assert.equal((await Core.verifyLicense("k", opts(reply(200, { success: true, uses: 1, purchase: {} })))).ok, true);
  const refunded = await Core.verifyLicense("k", opts(reply(200, { success: true, uses: 1, purchase: { refunded: true } })));
  assert.deepEqual([refunded.ok, refunded.final], [false, true]);
  const tooMany = await Core.verifyLicense("k", opts(reply(200, { success: true, uses: 3, purchase: {} })));
  assert.deepEqual([tooMany.ok, tooMany.final], [false, true]);
  const down = await Core.verifyLicense("k", opts(reply(503, { success: false })));
  assert.deepEqual([down.ok, down.final], [false, false]);
  const offline = await Core.verifyLicense("k", opts(async () => { throw new Error("offline"); }));
  assert.deepEqual([offline.ok, offline.final], [false, false]);
});

const readCSV = text => plain(Core.parseCSV(text));
const columnSums = rows => {
  const at = name => rows.find(r => r[0] === name).slice(1).map(Number);
  return { at, kept: at("Kept") };
};

test("monthlyCSV has a column per month and a total that matches the report", () => {
  const rep = Core.analyze([{ name: "example.csv", text: Core.sample() }]);
  const rows = readCSV(Core.monthlyCSV(rep));
  assert.deepEqual(rows[0], ["Category (USD)", "2026-08", "2026-09", "2026-10", "Total"]);
  const { at, kept } = columnSums(rows);
  near(kept[3], rep.totals.kept);
  near(at("Sales")[3], rep.totals.gross);
  near(at("Total deducted by Etsy")[3], -rep.totals.taken);
  // Months add up to the total on every line
  for (const r of rows.slice(1)) near(r.slice(1, 4).map(Number).reduce((a, b) => a + b, 0), +r[4]);
  // Each column adds up to what was kept
  for (let i = 0; i < 4; i++) {
    const parts = ["Sales", "Refunds", ...Core.CATS.map(c => c.name), "Other adjustments"].reduce((s, n) => s + at(n)[i], 0);
    near(parts, kept[i]);
  }
});

test("monthlyCSV keeps undated rows and adjustments in their own places", () => {
  const rep = Core.analyze([{ name: "s.csv", text: statement(
    '"August 2, 2026",Sale,Payment for Order #1234567,Order #1234567,USD,$30.00,-$1.15,$28.85,--',
    '"August 20, 2026",Adjustment,Case resolved,,USD,--,--,$5.00,--',
    'soon,Fee,Listing fee,Listing #99,USD,--,-$0.20,-$0.20,--',
  ) }]);
  const rows = readCSV(Core.monthlyCSV(rep));
  assert.deepEqual(rows[0], ["Category (USD)", "2026-08", "Undated", "Total"]);
  const { at, kept } = columnSums(rows);
  assert.deepEqual(at("Other adjustments"), [5, 0, 5]);
  assert.deepEqual(at("Listing fees"), [0, -0.2, -0.2]);
  assert.deepEqual(kept, [33.85, -0.2, 33.65]);
  assert.ok(!/-0\.00/.test(Core.monthlyCSV(rep)), "no negative zeros");
});

test("monthlyCSV uses the report's currency", () => {
  const rep = Core.analyze([{ name: "s.csv", text: statement('"3 Aug 2026",Sale,Payment for Order #1234567,Order #1234567,EUR,"€30,00","-€1,15","€28,85",--') }]);
  assert.equal(readCSV(Core.monthlyCSV(rep))[0][0], "Category (EUR)");
});

test("docs/index.html is the current build of index.html", () => {
  const built = readFileSync(new URL("../docs/index.html", import.meta.url), "utf8");
  assert.ok(built.includes(html), "run ./build.sh and commit docs/index.html");
});
