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
