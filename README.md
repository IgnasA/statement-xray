# Statement X-Ray

See exactly where your Etsy money went. Statement X-Ray reads the monthly statement CSVs that
Etsy sellers download from **Shop Manager → Finances → Monthly statements**. It shows what you
kept, what Etsy deducted, a breakdown by fee type (transaction, processing, listing, Offsite Ads,
Etsy Ads, shipping labels, VAT on fees and more), and a monthly chart. It also lists the orders
where fees took the biggest share.

Live at **https://xray.ausiejus.lt**.

**Privacy:** the statements are processed entirely in your browser. They are never uploaded,
stored or logged. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and
[docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md).

Free visitors see their totals and the "Where it went" breakdown. The notes, the monthly chart,
the order table and the copy-for-bookkeeping button unlock with a Gumroad license key.

## Project layout

| Path | What it is |
|---|---|
| `index.html` | The whole app: markup, CSS and inline JavaScript. **Edit this one.** |
| `build.sh` | Wraps `index.html` in a full HTML document and writes `docs/index.html`. |
| `docs/` | GitHub Pages web root (`index.html` is generated, `CNAME` sets the domain). |
| `SETUP.md` | Operator guide: Gumroad product, hosting, test purchase, how the lock behaves. |

## Setup

There is nothing to install. You need a browser, plus a POSIX shell to run `build.sh`.

```bash
git clone https://github.com/IgnasA/statement-xray.git
cd statement-xray
```

## Run locally

```bash
./build.sh                       # writes docs/index.html
python3 -m http.server -d docs 8000
# open http://localhost:8000
```

Opening `docs/index.html` straight from disk also works. Gumroad license checks need the page to
be served over HTTP(S), and they only succeed on the hosted copy (see `SETUP.md`).

Useful URLs:

- `/` shows the example shop with the full report.
- `/#paywall` shows the example shop the way a buyer sees it before paying.

## Test

There is no automated test suite yet. Before each deploy:

1. Run `./build.sh`, serve `docs/` and open the page. The example shop should render with no
   errors in the browser console.
2. Load one or more real Etsy statement CSVs. The status line should say
   *"Totals match your statements' Net column."*
3. Load the same file twice. The totals should not change.
4. Open `/#paywall`. The paid sections should be blurred, with the unlock form showing.
5. When you change anything in the licence code, follow "Test a purchase" in `SETUP.md`: buy with
   a 100% discount code, unlock, refund and reload.

The `Core` module (`<script id="core">`) has no DOM access, so you can extract it and test it in
Node:

```bash
awk '/<script id="core">/{f=1;next} /<\/script>/{if(f)exit} f' index.html > /tmp/core.js
echo 'module.exports = Core;' >> /tmp/core.js
node -e 'const C = require("/tmp/core.js"); console.log(C.analyze([{ name: "x.csv", text: C.sample() }]).totals)'
```

## Deploy

GitHub Pages serves the `docs/` folder of the `main` branch at https://xray.ausiejus.lt. Cloudflare
proxies the domain and provides HTTPS.

1. Edit `index.html`.
2. Run `./build.sh` and commit **both** `index.html` and `docs/index.html`.
3. Merge to `main`. Pages republishes within a minute or two, and **merging is deploying**.

For other hosts (Netlify Drop and others) and the DNS details, see `SETUP.md`.

## Configuration

There are no environment variables, secrets or config files. The only settings are the `SALE`
constants at the top of the first `<script>` in `index.html`:

| Setting | Meaning |
|---|---|
| `SALE.productId` | Gumroad product ID used for licence checks. Empty means no paywall. This is a public ID, not a secret. |
| `SALE.buyUrl` | Link to the Gumroad product page. |
| `SALE.price` | Price text shown on the buy button. |
| `SALE.maxDevices` | How many browsers one license key may unlock. |

Configuration outside the repo:

- GitHub Pages: source `main` / `docs`.
- Cloudflare DNS, TLS and HTTPS settings. See `docs/SECURITY_REVIEW.md` H1 for recommended changes.
- The Gumroad product, with "Generate a unique license key per sale" turned on.
