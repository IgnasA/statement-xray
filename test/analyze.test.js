const test = require("node:test");
const assert = require("node:assert/strict");
const { Core, plain, HEADER, csv, analyze } = require("./helpers");

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.005, `${msg || ""} expected ${b}, got ${a}`);

// A realistic month in Etsy's own CSV shape.
const AUGUST = csv(
  '"August 3, 2026",Sale,Payment for Order #3480112201,Order #3480112201,USD,$29.50,-$1.14,$28.36,--',
  '"August 3, 2026",Fee,"Transaction fee: Ceramic ring dish, blue",Order #3480112201,USD,--,-$1.56,-$1.56,--',
  '"August 3, 2026",Fee,Transaction fee: Shipping,Order #3480112201,USD,--,-$0.36,-$0.36,--',
  '"August 3, 2026",Fee,Listing fee,Listing #150000001,USD,--,-$0.20,-$0.20,--',
  '"August 3, 2026",Shipping,USPS shipping label,Label #3480112201,USD,--,-$4.85,-$4.85,--',
  '"August 5, 2026",Fee,Offsite Ads fee,Order #3480112201,USD,--,-$4.43,-$4.43,--',
  '"August 9, 2026",Sale,Payment for Order #3480112202,Order #3480112202,USD,"$1,050.00",-$31.75,"$1,018.25",--',
  '"August 9, 2026",Fee,Transaction fee: Wall hanging,Order #3480112202,USD,--,-$68.25,-$68.25,--',
  '"August 12, 2026",Refund,Refund to buyer for Order #3480112201,Order #3480112201,USD,-$24.00,$0.72,-$23.28,--',
  '"August 15, 2026",Deposit,$900.00 sent to your bank account,,USD,--,--,--,--',
  '"August 20, 2026",Tax,Sales tax paid by buyer,Order #3480112202,USD,$84.00,-$84.00,$0.00,--',
  '"August 28, 2026",Marketing,Etsy Ads,Etsy Ads,USD,--,-$14.00,-$14.00,--',
  '"August 28, 2026",VAT,VAT: Etsy Ads,Etsy Ads,USD,--,-$2.80,-$2.80,--',
);

test("analyze: a realistic month adds up and matches the Net column", () => {
  const r = analyze(AUGUST);
  assert.equal(r.ok, true);
  assert.deepStrictEqual(plain(r.problems), []);
  assert.equal(r.currency, "USD");
  close(r.totals.gross, 1079.5, "gross");
  close(r.totals.refunds, 24, "refunds");
  close(r.totals.cats.processing, 1.14 + 31.75 - 0.72, "processing");
  close(r.totals.cats.transaction, 1.56 + 0.36 + 68.25, "transaction");
  close(r.totals.cats.listing, 0.2, "listing");
  close(r.totals.cats.labels, 4.85, "labels");
  close(r.totals.cats.offsite, 4.43, "offsite");
  close(r.totals.cats.etsyAds, 14, "etsy ads");
  close(r.totals.cats.vat, 2.8, "vat");
  // Deposits and buyer sales tax are not the seller's money and stay out.
  close(r.totals.kept, 28.36 - 1.56 - 0.36 - 0.2 - 4.85 - 4.43 + 1018.25 - 68.25 - 23.28 - 14 - 2.8, "kept");
  assert.equal(r.check, true);
  assert.deepStrictEqual(plain(r.months.map(m => m.key)), ["2026-08"]);
  assert.equal(r.counts.sales, 2);
  assert.equal(r.counts.offsiteOrders, 1);
});

test("analyze: per-order figures, item names and ordering by share taken", () => {
  const r = analyze(AUGUST);
  assert.deepStrictEqual(plain(r.orders.map(o => o.id)), ["3480112201", "3480112202"]);
  const [small, big] = r.orders;
  assert.equal(small.item, "Ceramic ring dish, blue");
  assert.equal(big.item, "Wall hanging");
  close(small.sale, 29.5);
  close(small.refund, 24);
  close(small.offsite, 4.43);
  close(small.fees, 1.14 + 1.56 + 0.36 + 4.43 - 0.72);
  close(big.kept, 1050 - 31.75 - 68.25);
});

test("analyze: the built-in example statement reconciles", () => {
  const r = Core.analyze([{ name: "example.csv", text: Core.sample() }]);
  assert.equal(r.ok, true);
  assert.deepStrictEqual(plain(r.problems), []);
  assert.equal(r.check, true);
  assert.deepStrictEqual(plain(r.months.map(m => m.key)), ["2026-08", "2026-09", "2026-10"]);
  assert.equal(r.counts.sales, 9 + 12 + 15);
  // Every row in the example is a real row, including two identical listing fees on one day.
  assert.equal(r.totals.rows, Core.sample().split("\n").length - 1);
});

test("analyze: the same file loaded twice is counted once", () => {
  const once = analyze(AUGUST);
  const twice = analyze(AUGUST, { name: "copy.csv", text: AUGUST });
  close(twice.totals.kept, once.totals.kept);
  close(twice.totals.gross, once.totals.gross);
  assert.equal(twice.fileCount, 2);
});

test("analyze: identical rows inside one statement are all counted", () => {
  // Selling 3 of a listing renews it 3 times: Etsy writes three identical listing-fee rows.
  const text = csv(
    '"August 3, 2026",Sale,Payment for Order #3480112201,Order #3480112201,USD,$30.00,--,$30.00,--',
    '"August 3, 2026",Fee,Listing fee,Listing #150000001,USD,--,-$0.20,-$0.20,--',
    '"August 3, 2026",Fee,Listing fee,Listing #150000001,USD,--,-$0.20,-$0.20,--',
    '"August 3, 2026",Fee,Listing fee,Listing #150000001,USD,--,-$0.20,-$0.20,--',
  );
  const r = analyze(text);
  close(r.totals.cats.listing, 0.6);
  assert.equal(r.counts.listing, 3);
  assert.equal(r.check, true);
  // ...and loading that file again still doesn't double them.
  const again = analyze(text, text);
  close(again.totals.cats.listing, 0.6);
});

test("analyze: overlapping statements count shared rows once", () => {
  const a = csv('"August 3, 2026",Fee,Listing fee,Listing #1,USD,--,-$0.20,-$0.20,--', '"August 9, 2026",Fee,Listing fee,Listing #2,USD,--,-$0.20,-$0.20,--');
  const b = csv('"August 9, 2026",Fee,Listing fee,Listing #2,USD,--,-$0.20,-$0.20,--', '"September 1, 2026",Fee,Listing fee,Listing #3,USD,--,-$0.20,-$0.20,--');
  const r = analyze(a, b);
  close(r.totals.cats.listing, 0.6);
});

test("analyze: an empty file is reported, not silently ignored", () => {
  const r = analyze({ name: "empty.csv", text: "" });
  assert.equal(r.ok, false);
  assert.match(r.problems.join(" "), /empty\.csv is empty/);
});

test("analyze: a statement with a header but no rows says so", () => {
  const r = analyze({ name: "nothing.csv", text: HEADER + "\n" });
  assert.equal(r.ok, false);
  assert.ok(r.problems.length > 0, "a problem should explain why nothing is shown");
  assert.match(r.problems.join(" "), /nothing\.csv/);
});

test("analyze: a non-Etsy CSV is rejected with a reason", () => {
  const r = analyze({ name: "bank.csv", text: "Booking date,Payee,Value\n2026-08-01,Shop,12.00" });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /bank\.csv doesn't look like an Etsy monthly statement/);
});

test("analyze: one bad file doesn't stop the good ones", () => {
  const r = analyze(AUGUST, { name: "notes.csv", text: "hello,world\n1,2" });
  assert.equal(r.ok, true);
  assert.equal(r.fileCount, 1);
  assert.equal(r.problems.length, 1);
});

test("analyze: rows with the wrong number of columns are skipped and reported", () => {
  const text = csv(
    '"August 3, 2026",Sale,Payment for Order #3480112201,Order #3480112201,USD,$30.00,--,$30.00,--',
    // unquoted comma in the title shifts every later column
    '"August 3, 2026",Fee,Transaction fee: Mug, blue,Order #3480112201,USD,--,-$1.95,-$1.95,--',
    '"August 3, 2026",Fee',
  );
  const r = analyze(text);
  assert.equal(r.ok, true);
  close(r.totals.gross, 30);
  close(r.totals.cats.transaction, 0);
  assert.equal(r.check, true);
  assert.match(r.problems.join(" "), /2 rows in s1\.csv/);
});

test("analyze: trailing empty columns are tolerated", () => {
  const r = analyze(csv('"August 3, 2026",Fee,Listing fee,Listing #1,USD,--,-$0.20,-$0.20,--,,'));
  close(r.totals.cats.listing, 0.2);
  assert.deepStrictEqual(plain(r.problems), []);
});

test("analyze: rows whose date can't be read are counted but reported", () => {
  const r = analyze(csv(
    '"August 3, 2026",Fee,Listing fee,Listing #1,USD,--,-$0.20,-$0.20,--',
    'sometime,Fee,Listing fee,Listing #2,USD,--,-$0.20,-$0.20,--',
  ));
  close(r.totals.cats.listing, 0.4);
  assert.deepStrictEqual(plain(r.months.map(m => m.key)), ["2026-08"]);
  assert.match(r.problems.join(" "), /1 row .*date/);
});

test("analyze: mixed currencies keep the main one and say what was left out", () => {
  const r = analyze(csv(
    '"August 3, 2026",Fee,Listing fee,Listing #1,USD,--,-$0.20,-$0.20,--',
    '"August 3, 2026",Fee,Listing fee,Listing #2,USD,--,-$0.20,-$0.20,--',
    '"August 3, 2026",Fee,Listing fee,Listing #3,EUR,--,-€0.18,-€0.18,--',
  ));
  assert.equal(r.currency, "USD");
  close(r.totals.cats.listing, 0.4);
  assert.match(r.problems.join(" "), /EUR were left out/);
});

test("analyze: a statement in euros with European number formats", () => {
  const text = [
    "Date;Type;Title;Info;Currency;Amount;Fees & Taxes;Net",
    "03.08.2026;Sale;Payment for Order #3480112201;Order #3480112201;EUR;1.250,00 €;-37,75 €;1.212,25 €",
    "03.08.2026;Fee;Transaction fee: Linen;Order #3480112201;EUR;--;-81,25 €;-81,25 €",
    "03.08.2026;VAT;VAT: Transaction fee;Order #3480112201;EUR;--;-17,06 €;-17,06 €",
  ].join("\r\n");
  const r = analyze(text);
  assert.equal(r.ok, true);
  assert.equal(r.currency, "EUR");
  close(r.totals.gross, 1250);
  close(r.totals.cats.transaction, 81.25);
  close(r.totals.cats.vat, 17.06);
  assert.deepStrictEqual(plain(r.months.map(m => m.key)), ["2026-08"]);
  assert.equal(r.check, true);
});

test("analyze: a missing Net column falls back to Amount + Fees", () => {
  const r = analyze("Date,Type,Title,Info,Currency,Amount,Fees & Taxes\n" +
    '"August 3, 2026",Sale,Payment for Order #3480112201,Order #3480112201,USD,$30.00,-$1.15\n' +
    '"August 3, 2026",Fee,Listing fee,Listing #1,USD,--,-$0.20\n');
  // Fee rows have no Amount, so they need the fees column too.
  close(r.totals.kept, 30 - 1.15 - 0.2);
  close(r.totals.cats.listing, 0.2);
  assert.equal(r.check, true);
});

test("analyze: blank currency defaults to USD", () => {
  const r = analyze(csv('"August 3, 2026",Fee,Listing fee,Listing #1,,--,-$0.20,-$0.20,--'));
  assert.equal(r.currency, "USD");
});

test("analyze: fee credits reduce the fee category", () => {
  const r = analyze(csv(
    '"August 3, 2026",Fee,Transaction fee: Mug,Order #3480112201,USD,--,-$1.95,-$1.95,--',
    '"August 10, 2026",Fee,Credit for transaction fee: Mug,Order #3480112201,USD,--,$1.95,$1.95,--',
  ));
  close(r.totals.cats.transaction, 0);
});

test("analyze: header names are matched loosely (case, spacing, quotes)", () => {
  const r = analyze('"DATE","TYPE","TITLE","INFO","CURRENCY","AMOUNT","FEES AND TAXES","NET"\n' +
    '2026-08-03,Fee,Listing fee,Listing #1,USD,--,-0.20,-0.20');
  assert.equal(r.ok, true);
  close(r.totals.cats.listing, 0.2);
});

test("analyze: no files at all", () => {
  const r = Core.analyze([]);
  assert.equal(r.ok, false);
});
