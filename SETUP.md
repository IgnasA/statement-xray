# Statement X-Ray: going live

The whole tool is one file, `index.html`. Free visitors see their totals and the
"Where it went" breakdown. The monthly chart, costliest orders, notes and the
copy-to-bookkeeping button unlock with a Gumroad license key.

## 1. Create the product on Gumroad

1. Sign up at gumroad.com and create a new **Digital product**.
2. Name it "Statement X-Ray: full Etsy fee report" (or similar) and set the price. The page says $12.
3. In the product's settings, turn on **Generate a unique license key per sale**.
4. Copy the **product ID** shown next to that license key setting.
5. In the product content, write something like:
   "Open https://YOUR-SITE/ , add your statements, scroll to the full report and paste your license key."
   Gumroad shows each buyer their key on the receipt and in the receipt email.

## 2. Fill in the settings

Open `index.html` and find the `SALE` block near the top of the first `<script>`:

```js
const SALE = {
  productId: "",                                              // paste the product ID here
  buyUrl: "https://YOUR-NAME.gumroad.com/l/statement-xray",  // your product page link
  price: "$12",
  maxDevices: 5,
};
```

## 3. Host it (free)

`index.html` is written for the claude.ai preview, which adds the page's `<!doctype>`,
character set and viewport tags itself. Your host won't, so build the hostable copy first:

```bash
./build.sh
```

That writes `site/index.html`. Run it again whenever you change `index.html`.

Any static host works, because there is no server. Two easy options:

- **Netlify Drop:** go to app.netlify.com/drop and drag the `site` folder onto the page. You get a URL straight away and can rename it in site settings.
- **GitHub Pages:** push the `site` folder's contents to a public repo, then Settings → Pages → deploy from the main branch.

The unlock only works on your hosted copy. The claude.ai preview blocks requests to
Gumroad, so keys can't be checked there.

## 4. Test a purchase

1. On Gumroad, create a 100% discount code and buy your own product with it.
2. Open your hosted page, load a statement (or add `#paywall` to the URL to see the
   locked example) and paste the key from the receipt. The report should unlock.
3. Refund that test sale in Gumroad. Reload the page: it should lock again.

## How the lock behaves

- A key is checked with Gumroad once and saved in that browser, so it keeps working offline.
- Each page load quietly re-checks the saved key. A refunded or charged-back purchase locks again.
  If Gumroad can't be reached, the saved key keeps working.
- One key works on up to `maxDevices` browsers. To reset a buyer, open the sale in Gumroad
  and reset its license uses.
- The lock runs in the visitor's browser, so a technical person could get around it with
  developer tools. For a $12 tool aimed at shop owners that's an acceptable trade for having
  no server to run.

## Listing screenshots

Open `https://YOUR-SITE/#paywall` to see the example shop the way a buyer sees it before
paying. The plain URL shows the example with the full report unlocked.
