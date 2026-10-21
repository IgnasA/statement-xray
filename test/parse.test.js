const test = require("node:test");
const assert = require("node:assert/strict");
const { Core, plain } = require("./helpers");

test("parseCSV: plain rows, CRLF and LF line endings", () => {
  assert.deepStrictEqual(plain(Core.parseCSV("a,b\r\n1,2\n3,4\r\n")), [["a", "b"], ["1", "2"], ["3", "4"]]);
});

test("parseCSV: old Mac CR-only line endings", () => {
  assert.deepStrictEqual(plain(Core.parseCSV("a,b\r1,2\r")), [["a", "b"], ["1", "2"]]);
});

test("parseCSV: quoted commas, escaped quotes and newlines inside quotes", () => {
  const rows = Core.parseCSV('Date,Title\n"August 3, 2026","Mug, ""blue""\nlarge"');
  assert.deepStrictEqual(plain(rows), [["Date", "Title"], ["August 3, 2026", 'Mug, "blue"\nlarge']]);
});

test("parseCSV: strips a UTF-8 byte order mark", () => {
  const rows = Core.parseCSV("﻿Date,Type\n1,2");
  assert.equal(rows[0][0], "Date");
});

test("parseCSV: blank and whitespace-only lines are dropped", () => {
  assert.deepStrictEqual(plain(Core.parseCSV("a,b\n\n , \n1,2\n\n")), [["a", "b"], ["1", "2"]]);
});

test("parseCSV: empty input gives no rows", () => {
  assert.deepStrictEqual(plain(Core.parseCSV("")), []);
  assert.deepStrictEqual(plain(Core.parseCSV("﻿")), []);
  assert.deepStrictEqual(plain(Core.parseCSV("\n\r\n")), []);
});

test("parseCSV: semicolon-separated files (Excel in many European locales)", () => {
  const rows = Core.parseCSV('Date;Type;Title;Net\n2026-08-03;Fee;"Listing fee; renewal";-0,20');
  assert.deepStrictEqual(plain(rows), [["Date", "Type", "Title", "Net"], ["2026-08-03", "Fee", "Listing fee; renewal", "-0,20"]]);
});

test("parseCSV: tab-separated files", () => {
  const rows = Core.parseCSV("Date\tType\tNet\n2026-08-03\tFee\t-0.20");
  assert.deepStrictEqual(plain(rows), [["Date", "Type", "Net"], ["2026-08-03", "Fee", "-0.20"]]);
});

test("parseCSV: commas inside the header still win over a stray semicolon", () => {
  const rows = Core.parseCSV("Date,Type,Title,Net\n2026-08-03,Fee,a;b,-0.20");
  assert.deepStrictEqual(plain(rows[1]), ["2026-08-03", "Fee", "a;b", "-0.20"]);
});

test("money: US formats", () => {
  assert.equal(Core.money("$1,234.56"), 1234.56);
  assert.equal(Core.money("-$0.20"), -0.2);
  assert.equal(Core.money("$-0.20"), -0.2);
  assert.equal(Core.money("1234"), 1234);
  assert.equal(Core.money("1,234"), 1234);
  assert.equal(Core.money("  $12.00 "), 12);
  assert.equal(Core.money("USD 12.50"), 12.5);
});

test("money: accounting negatives and trailing minus", () => {
  assert.equal(Core.money("(1.20)"), -1.2);
  assert.equal(Core.money("($1,000.00)"), -1000);
  assert.equal(Core.money("1.20-"), -1.2);
});

test("money: unicode minus sign", () => {
  assert.equal(Core.money("−$3.10"), -3.1);
  assert.equal(Core.money("–3.10"), -3.1); // en dash, as some spreadsheets export
});

test("money: European formats", () => {
  assert.equal(Core.money("1.234,56 €"), 1234.56);
  assert.equal(Core.money("-€2,00"), -2);
  assert.equal(Core.money("1 234,56"), 1234.56);
  assert.equal(Core.money("1 234,5"), 1234.5);
  assert.equal(Core.money("12.345.678"), 12345678);
  assert.equal(Core.money("1.234.567,89"), 1234567.89);
});

test("money: other currency symbols", () => {
  assert.equal(Core.money("£4.99"), 4.99);
  assert.equal(Core.money("CA$10.00"), 10);
  assert.equal(Core.money("-A$7.25"), -7.25);
  assert.equal(Core.money("¥1,200"), 1200);
});

test("money: empty and placeholder values are zero", () => {
  for (const v of [undefined, null, "", "  ", "--", "-", "---", "$", "abc"]) assert.equal(Core.money(v), 0, String(v));
});

test("monthKey: ISO dates", () => {
  assert.equal(Core.monthKey("2026-08-15"), "2026-08");
  assert.equal(Core.monthKey("2026-8-1"), "2026-08");
  assert.equal(Core.monthKey("2026-08-15T10:00:00Z"), "2026-08");
});

test("monthKey: Etsy's month-name dates", () => {
  assert.equal(Core.monthKey("August 3, 2026"), "2026-08");
  assert.equal(Core.monthKey("Sept. 30, 2026"), "2026-09");
  assert.equal(Core.monthKey("Dec 1 2026"), "2026-12");
  assert.equal(Core.monthKey("3 August 2026"), "2026-08");
  assert.equal(Core.monthKey("3 Aug, 2026"), "2026-08");
  assert.equal(Core.monthKey("Tue, Aug 3, 2026"), "2026-08");
});

test("monthKey: slash dates (US order unless impossible)", () => {
  assert.equal(Core.monthKey("08/15/2026"), "2026-08");
  assert.equal(Core.monthKey("15/08/2026"), "2026-08");
  assert.equal(Core.monthKey("8/3/26"), "2026-08");
  assert.equal(Core.monthKey("08/15/2026 14:03"), "2026-08");
});

test("monthKey: dotted dates are day-first", () => {
  assert.equal(Core.monthKey("03.08.2026"), "2026-08");
  assert.equal(Core.monthKey("15.08.2026"), "2026-08");
});

test("monthKey: unreadable or impossible dates give null", () => {
  for (const v of [undefined, null, "", "soon", "2026-13-01", "2026-00-10", "13/13/2026", "Foo 3, 2026", "0/5/2026"]) {
    assert.equal(Core.monthKey(v), null, String(v));
  }
});

test("classify: common Etsy row types", () => {
  const cases = [
    ["Sale", "Payment for Order #1234567", "sale"],
    ["Refund", "Refund to buyer for Order #1234567", "refund"],
    ["Deposit", "$180.00 sent to your bank account", "deposit"],
    ["Tax", "Sales tax paid by buyer", "tax"],
    ["VAT", "VAT: Transaction fee", "vat"],
    ["Fee", "Transaction fee: Mug", "transaction"],
    ["Fee", "Transaction fee: Shipping", "transaction"],
    ["Fee", "Processing fee", "processing"],
    ["Fee", "Listing fee", "listing"],
    ["Fee", "Auto-renew sold", "listing"],
    ["Fee", "Offsite Ads fee", "offsite"],
    ["Marketing", "Etsy Ads", "etsyAds"],
    ["Shipping", "USPS shipping label", "labels"],
    ["Fee", "Regulatory operating fee", "other"],
    ["Fee", "Currency conversion fee", "other"],
    ["Fee", "Etsy Plus subscription", "other"],
    ["Payment", "Reserve released", "adjust"],
  ];
  for (const [type, title, kind] of cases) assert.equal(Core.classify(type, title), kind, `${type} / ${title}`);
});

test("decode: UTF-8, with and without BOM", () => {
  const bytes = s => new TextEncoder().encode(s);
  assert.equal(Core.decode(bytes("Net\n€2,00")), "Net\n€2,00");
  assert.equal(Core.decode(new Uint8Array([0xef, 0xbb, 0xbf, ...bytes("Date")])), "Date");
});

test("decode: UTF-16 with BOM (Excel's 'Unicode text')", () => {
  const s = "Date\tNet\n2026-08-03\t-€2.00";
  const le = new Uint8Array(2 + s.length * 2); le[0] = 0xff; le[1] = 0xfe;
  const be = new Uint8Array(2 + s.length * 2); be[0] = 0xfe; be[1] = 0xff;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    le[2 + i * 2] = c & 255; le[3 + i * 2] = c >> 8;
    be[2 + i * 2] = c >> 8; be[3 + i * 2] = c & 255;
  }
  assert.equal(Core.decode(le), s);
  assert.equal(Core.decode(be), s);
});

test("decode: falls back to Windows-1252 for files re-saved by Excel", () => {
  // "Caf\xe9,\xa32" is not valid UTF-8. (Bytes 0x80-0x9f, such as the euro sign, are left out:
  // browsers map them per the WHATWG table, but Node 22 decodes windows-1252 as Latin-1.)
  assert.equal(Core.decode(new Uint8Array([0x43, 0x61, 0x66, 0xe9, 0x2c, 0xa3, 0x32])), "Café,£2");
});

test("decode: accepts an ArrayBuffer", () => {
  assert.equal(Core.decode(new TextEncoder().encode("ok").buffer), "ok");
});
