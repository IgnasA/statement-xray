// Browser smoke test: opens docs/index.html in headless Chromium, loads statements through the
// file picker and checks what the page shows. Needs Playwright (not a dependency of this repo):
//   NODE_PATH=$(npm root -g) npm run test:e2e
// Requests to other hosts (fonts, Gumroad) are blocked, so it runs offline.
const path = require("node:path");
const assert = require("node:assert/strict");
let chromium;
try { ({ chromium } = require("playwright")); } catch { console.log("SKIP: playwright isn't installed"); process.exit(0); }

const page_url = "file://" + path.join(__dirname, "..", "docs", "index.html");
const HEADER = "Date,Type,Title,Info,Currency,Amount,Fees & Taxes,Net,Tax Details";
const file = (name, text, mimeType = "text/csv") => ({ name, mimeType, buffer: Buffer.from(text) });
const STATEMENT = [HEADER,
  '"August 3, 2026",Sale,Payment for Order #3480112201,Order #3480112201,USD,$30.00,-$1.15,$28.85,--',
  '"August 3, 2026",Fee,Listing fee,Listing #1,USD,--,-$0.20,-$0.20,--',
  '"August 3, 2026",Fee,Listing fee,Listing #1,USD,--,-$0.20,-$0.20,--'].join("\n");

(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(/^https?:/, r => r.abort());
  const steps = [];
  const step = async (name, fn) => { await fn(); steps.push(name); console.log("ok -", name); };

  await page.goto(page_url);
  await step("example shop renders and reconciles", async () => {
    assert.match(await page.textContent("#answer h1"), /^Of \$[\d,.]+ in sales, you kept \$[\d,.]+\.$/);
    assert.equal(await page.isVisible("#msg"), false);
  });

  await step("loading a statement shows its numbers", async () => {
    await page.setInputFiles("#file", [file("aug.csv", STATEMENT)]);
    await page.waitForFunction(() => /1 statement/.test(document.getElementById("status").textContent));
    assert.match(await page.textContent("#answer h1"), /Of \$30\.00 in sales, you kept \$28\.45\./);
    assert.match(await page.textContent("#status"), /Totals match/);
    assert.match(await page.textContent("#breakdown"), /Listing fees/);
  });

  await step("the same file can be picked again after going back to the example", async () => {
    await page.click("#sampleBtn");
    await page.setInputFiles("#file", [file("aug.csv", STATEMENT)]);
    await page.waitForFunction(() => /1 statement/.test(document.getElementById("status").textContent));
  });

  await step("a UTF-16 semicolon file from Excel loads", async () => {
    const text = "﻿" + ["Date;Type;Title;Info;Currency;Amount;Fees & Taxes;Net",
      "03.08.2026;Sale;Payment for Order #3480112201;Order #3480112201;EUR;100,00 €;-3,25 €;96,75 €"].join("\r\n");
    await page.setInputFiles("#file", [{ name: "excel.csv", mimeType: "text/csv", buffer: Buffer.from(text, "utf16le") }]);
    await page.waitForFunction(() => /96,75|96\.75/.test(document.getElementById("answer").textContent));
  });

  await step("a header-only file explains itself instead of showing nothing", async () => {
    await page.setInputFiles("#file", [file("blank.csv", HEADER + "\n")]);
    await page.waitForFunction(() => !document.getElementById("msg").hidden);
    assert.match(await page.textContent("#msg"), /blank\.csv has no transactions/);
  });

  await step("non-CSV files alongside a statement are reported", async () => {
    await page.setInputFiles("#file", [file("aug.csv", STATEMENT), file("photo.png", "x", "image/png")]);
    await page.waitForFunction(() => /photo\.png/.test(document.getElementById("msg").textContent));
    assert.match(await page.textContent("#status"), /1 statement/);
  });

  await step("an unknown currency code doesn't reuse the last report's symbol", async () => {
    await page.setInputFiles("#file", [file("odd.csv", STATEMENT.replace(/USD/g, "XYZ1"))]);
    await page.waitForFunction(() => /XYZ1/.test(document.getElementById("answer").textContent));
    assert.doesNotMatch(await page.textContent("#answer h1"), /\$|€/);
  });

  await browser.close();
  assert.deepEqual(errors, [], "page errors");
  console.log(`${steps.length} browser checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
