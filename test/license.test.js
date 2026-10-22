const test = require("node:test");
const assert = require("node:assert/strict");
const { Core } = require("./helpers");

const reply = (status, body) => async () => ({ status, json: async () => body });
const opts = (fetchFn, extra = {}) => ({ productId: "prod", maxDevices: 5, activate: true, fetchFn, ...extra });

test("verifyLicense: a good key unlocks", async () => {
  const r = await Core.verifyLicense(" KEY ", opts(reply(200, { success: true, uses: 1, purchase: {} })));
  assert.equal(r.ok, true);
  assert.equal(r.final, true);
});

test("verifyLicense: sends the trimmed key, product and activation flag", async () => {
  let sent;
  const fetchFn = async (url, init) => { sent = { url, init }; return { status: 200, json: async () => ({ success: true, uses: 1, purchase: {} }) }; };
  await Core.verifyLicense("  KEY-1 ", opts(fetchFn, { activate: false }));
  assert.equal(sent.url, "https://api.gumroad.com/v2/licenses/verify");
  assert.equal(sent.init.method, "POST");
  const body = new URLSearchParams(sent.init.body);
  assert.equal(body.get("license_key"), "KEY-1");
  assert.equal(body.get("product_id"), "prod");
  assert.equal(body.get("increment_uses_count"), "false");
});

test("verifyLicense: empty key and missing product id", async () => {
  const empty = await Core.verifyLicense("  ", opts(reply(200, {})));
  assert.deepEqual([empty.ok, empty.final], [false, true]);
  const noProduct = await Core.verifyLicense("KEY", opts(reply(200, {}), { productId: "" }));
  assert.deepEqual([noProduct.ok, noProduct.final], [false, false]);
});

test("verifyLicense: unknown key is a final no", async () => {
  const r = await Core.verifyLicense("KEY", opts(reply(404, { success: false, message: "That license does not exist" })));
  assert.deepEqual([r.ok, r.final], [false, true]);
});

test("verifyLicense: refunded, charged back or disputed purchases are a final no", async () => {
  for (const flag of ["refunded", "chargebacked", "disputed"]) {
    const r = await Core.verifyLicense("KEY", opts(reply(200, { success: true, uses: 1, purchase: { [flag]: true } })));
    assert.deepEqual([r.ok, r.final], [false, true], flag);
  }
});

test("verifyLicense: too many devices", async () => {
  const r = await Core.verifyLicense("KEY", opts(reply(200, { success: true, uses: 6, purchase: {} })));
  assert.deepEqual([r.ok, r.final], [false, true]);
  assert.match(r.message, /5 devices/);
  // The quiet re-check doesn't add a use, so it doesn't apply the device limit.
  const recheck = await Core.verifyLicense("KEY", opts(reply(200, { success: true, uses: 6, purchase: {} }), { activate: false }));
  assert.equal(recheck.ok, true);
});

test("verifyLicense: network failures and outages keep a saved key", async () => {
  const offline = await Core.verifyLicense("KEY", opts(async () => { throw new TypeError("Failed to fetch"); }));
  assert.deepEqual([offline.ok, offline.final], [false, false]);
  const down = await Core.verifyLicense("KEY", opts(reply(503, { success: false })));
  assert.deepEqual([down.ok, down.final], [false, false]);
  const html = await Core.verifyLicense("KEY", opts(async () => ({ status: 502, json: async () => { throw new SyntaxError("Unexpected token <"); } })));
  assert.deepEqual([html.ok, html.final], [false, false]);
});

test("verifyLicense: rate limiting is not a verdict on the key", async () => {
  const r = await Core.verifyLicense("KEY", opts(reply(429, { success: false })));
  assert.deepEqual([r.ok, r.final], [false, false]);
});
