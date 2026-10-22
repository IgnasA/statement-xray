# Security review: Statement X-Ray

- **Date:** 2026-10-21
- **Scope:** the whole repository at `main` (`9109ff2`): `index.html`, `build.sh`, `docs/` and `SETUP.md`, plus the full git history. Also the live site's HTTP behaviour at https://xray.ausiejus.lt (read-only requests only).
- **Method:** manual code review of every DOM sink, network call and storage call; a secret scan of the full history; hostile-input tests of the `Core` module in Node; and a run of the built page in headless Chromium.

## Summary

Statement X-Ray is a single static page. Statement CSVs are read and analysed entirely in the
visitor's browser. **No statement content is sent anywhere, stored, or logged.** There is no
server, no database, no analytics, no LLM or AI API, and no package dependency. That limits the
attack surface a lot.

The main risks are in **how the page reaches the visitor** and **what third parties see**, not in
how data is processed:

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| H1 | **High** | Site is served over plain HTTP with no edge redirect or HSTS, so the page can be tampered with in transit | Open (Cloudflare setting) |
| M1 | Medium | No Content-Security-Policy, so nothing technically enforces "your data stays on your computer" | Open (tested policy below) |
| M2 | Medium | Google Fonts is loaded on every visit, which sends the visitor's IP address and browser details to Google | Open |
| M3 | Medium | The paid report is fully rendered into the page while "locked", so the paywall is cosmetic | Open (accepted risk in `SETUP.md`) |
| L1 | Low | A Gumroad HTTP 429 response wiped a paying buyer's saved key | **Fixed** `495e891` |
| L2 | Low | No file size limit on uploads | **Fixed** `9e4e56d` |
| L3 | Low | Quadratic regex on the Date column (self-DoS) | **Fixed** `0b69e2d` |
| L4 | Low | Identical rows inside one statement are silently dropped, which understates fees | Open (integrity) |
| L5 | Low | Cloudflare-to-GitHub origin leg may be unencrypted | Open (unverified) |
| L6 | Low | License key stored in plaintext `localStorage`; any key holder can burn its device uses | Open (accepted) |
| I1 | Info | `esc()` did not escape `'` | **Fixed** `5d0bcd5` |
| I2 | Info | No clickjacking protection | Open |
| I3 | Info | No secrets in the repo or its history | — |
| I4 | Info | `docs/` is the public web root | Mitigated (`docs/_config.yml`) |

---

## High

### H1. Plain-HTTP delivery with no HSTS: in-transit tampering can steal statements

- **Location:** Cloudflare zone settings for `ausiejus.lt` (outside the repo); `build.sh:6` (JavaScript-only redirect).
- **Evidence:** `curl -D - http://xray.ausiejus.lt/` returns `HTTP/1.1 200 OK` from Cloudflare with no `Location` header. Neither the HTTP nor the HTTPS response carries `Strict-Transport-Security`.
- **Impact:** Anyone who types `xray.ausiejus.lt`, or follows an `http://` link, first loads the page over plain HTTP. The HTTP-to-HTTPS redirect runs in JavaScript *inside that page*. An attacker on the network path (public Wi-Fi, a hostile hotspot or ISP) can strip the redirect and inject a script. The seller then loads their statements into the attacker's copy, and the script can exfiltrate every row: order numbers, revenue, fees and item names. The tool's privacy promise depends on the page being genuine, so this is the most important issue.
- **Fix:** In Cloudflare, go to **SSL/TLS → Edge Certificates**:
  1. Turn on **Always Use HTTPS**. Cloudflare then answers `http://` with a 301 before any HTML is sent.
  2. Turn on **HSTS**. Start with `max-age` of 1 day, check that nothing breaks, then raise it to 6–12 months. Enable `includeSubDomains` only if every `*.ausiejus.lt` host serves HTTPS. Use `preload` only once you are sure.
  3. Keep the JavaScript redirect in `build.sh` as a harmless fallback.
- **Confidence:** High (observed live on 2026-10-21).

## Medium

### M1. No Content-Security-Policy or other security headers

- **Location:** `build.sh:6` (generated `<head>`); response headers from Cloudflare and GitHub Pages.
- **Impact:** The promise that statements "stay on your computer" is true of the code today, but nothing in the browser enforces it. A future edit, a compromised third-party stylesheet, or an injection bug could send data anywhere. A CSP that allows network requests only to `api.gumroad.com` makes exfiltration fail closed. There are also no `X-Content-Type-Options`, `Referrer-Policy` or `frame-ancestors` headers.
- **Fix:** Add a `<meta http-equiv="Content-Security-Policy">` tag to the `<head>` that `build.sh` writes. The policy below was injected into the built page and tested in Chromium: the sample report, a CSV upload and the size-limit message all worked with zero CSP violations or console errors. The live Gumroad unlock was *not* exercised, so buy a test key before you rely on it.

  ```
  default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com; connect-src https://api.gumroad.com; img-src data:;
  base-uri 'none'; form-action 'none'
  ```

  Later, replace `'unsafe-inline'` in `script-src` with `sha256-…` hashes of the two inline scripts and the redirect script, computed in `build.sh`. If you self-host the font (M2), drop the two Google hosts. `frame-ancestors` cannot be set from a `<meta>` tag. Add it, together with `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`, as response headers using a Cloudflare **Transform Rule (Modify Response Header)**.
- **Confidence:** High that the protection is missing. Medium-high that the policy is complete, because the unlock flow is untested.

### M2. Google Fonts leaks visitor data to a third party

- **Location:** `index.html:4-6`.
- **Impact:** Every visit makes requests to `fonts.googleapis.com` and `fonts.gstatic.com`. Google receives the visitor's IP address, user agent and the referring page. No statement data is sent. However, the operator appears to be EU-based (`.lt`), and German courts have held that embedding Google Fonts this way, without consent, breaches the GDPR (LG München I, 3 O 17493/20, 2022). It also sits awkwardly next to the page's privacy pitch.
- **Fix:** Self-host the font. Download the Schibsted Grotesk woff2 files (weights 400, 500, 700 and 800; Latin subset) into `docs/fonts/`. Replace lines 4–6 with an inline `@font-face` block that points at them. The claude.ai preview build would then need the files next to it, or can keep falling back to Helvetica/Arial. This is not done here because it adds binary assets and changes how the preview renders.
- **Confidence:** High.

### M3. The paywall is client-side only, and the paid report is already in the DOM

- **Location:** `index.html:124-127` (blur CSS), `index.html:532-547` (`applyLock`), `index.html:627-633` (the paid sections render regardless of lock state), `index.html:527` (key in `localStorage`).
- **Impact:** Revenue only; there is no user-data impact. When locked, the full "Things to look at", chart and order table for the visitor's *real* data are rendered and then blurred. Ways to read them without paying include reader mode, printing, disabling CSS, or removing the `locked` class in DevTools. Another bypass is to set `localStorage["statement-xray-license"]` to any value and block `api.gumroad.com`: the re-check then fails as "unreachable", so the page stays unlocked. `SETUP.md` already accepts that a technical user can bypass the lock.
- **Fix (cheap, raises the bar):** While locked with real data, render the paid sections from `Core.sample()` (or leave them empty) and render the real ones only after `unlock()` succeeds. Also treat a saved key that has never been verified successfully as locked. **Proper fix:** move the paid analysis behind a small server or edge function that checks the key. That is a big change to the "no server" design and is a business decision.
- **Confidence:** High.

## Low

### L1. Rate-limited licence re-check deleted a paying buyer's key (**fixed**)

- **Location:** `index.html:495` (`verifyLicense`); called from `recheckSavedKey` at `index.html:564`.
- **Impact:** On every page load the saved key is re-checked. A 429 (rate-limit) response with `success:false` was treated as "key not recognised" (`final: true`), so the key was removed from storage and the buyer was locked out. Reproduced in Node with a mocked fetch.
- **Fix applied:** Treat 429 like 5xx, as a temporary failure that keeps the saved key.
- **Confidence:** High.

### L2. No upload size limit (**fixed**)

- **Location:** `index.html:678-685` (`loadFiles`).
- **Impact:** Each file was read into memory whole with `File.text()`, and the row dedupe then copied it again. A multi-GB file, whether loaded by mistake or sent to a seller as a "statement", would hang or crash the tab. This only affects the person who loads the file. Zip bombs and malicious PDFs don't apply: only `.csv`/`text/csv` files are accepted, and nothing is decompressed or rendered as a document.
- **Fix applied:** Refuse files larger than 50 MB with a clear message. Real monthly statements are a few hundred KB. Verified in Chromium.
- **Confidence:** High.

### L3. Quadratic regex on the Date column (**fixed**)

- **Location:** `index.html:291` (`monthKey`).
- **Impact:** The unanchored pattern `/([A-Za-z]{3})[A-Za-z]*\.?\s+…/` backtracks quadratically on long runs of letters. A 20 KB cell took about 0.9 s in Node, and 200 KB would take over a minute. Like L2, this only freezes the tab of the person who loads the file.
- **Fix applied:** Truncate the date string to 64 characters before matching.
- **Confidence:** High.

### L4. Identical rows inside one statement are dropped, so fees are understated (integrity)

- **Location:** `index.html:356-359`.
- **Impact:** To ignore a file added twice, the code drops any row that is byte-identical to one already seen, *including within the same file*. Two genuine identical rows, such as two `Listing fee` rows for the same listing on the same day, are counted once. The "Totals match your statements' Net column" check is computed over the same deduplicated rows, so it still reports a match. Reproduced: two identical $0.20 listing-fee rows give a $0.20 total and `check: true`. This is not an attack, but the report shows sellers wrong financial figures.
- **Fix:** Deduplicate whole files instead of rows: skip a file whose full text, or a hash of it, was already loaded. Alternatively, count duplicates per file and only drop the extra copies that appear in a second file. Not changed here because it changes the numbers the tool reports.
- **Confidence:** High.

### L5. The Cloudflare-to-GitHub Pages leg may be unencrypted

- **Location:** Cloudflare **SSL/TLS → Overview** encryption mode (not visible from the repo).
- **Impact:** `SETUP.md` says GitHub's "Enforce HTTPS" is unavailable, because Cloudflare proxies the domain. If the zone's encryption mode is **Flexible**, Cloudflare fetches the page from GitHub over plain HTTP. That leg runs between data centres, so the risk is low, but anyone on it could modify the page.
- **Fix:** Set the mode to **Full**. GitHub Pages serves a valid `*.github.io` certificate, so Full works even without a custom-domain certificate. If GitHub issues a certificate for `xray.ausiejus.lt`, use **Full (strict)**.
- **Confidence:** Low (configuration not visible).

### L6. Licence key handling

- **Location:** `index.html:524-530`, `index.html:488`, `index.html:500`.
- **Impact:** The key is stored in plaintext `localStorage`, so it is readable by anyone with access to that browser profile and by any script running on the origin. `increment_uses_count` is sent on every unlock attempt, including attempts that are then refused because `uses > maxDevices`. Anyone who has a key can therefore use up its device allowance. The `maxDevices` check itself also runs only in the browser. The impact is limited to one $9 key, and the seller can reset uses in Gumroad.
- **Fix:** Accept as-is for this price point. If it matters, check `data.uses` with `increment_uses_count=false` first, and only increment when the device is new.
- **Confidence:** High.

## Informational

### I1. `esc()` did not escape single quotes (**fixed**)
`index.html:513`. Every current caller uses the result in text or a double-quoted attribute, so this was not exploitable. Escaping `'` as `&#39;` now protects future templates. **Confidence:** High.

### I2. No clickjacking protection
GitHub Pages sends no `X-Frame-Options` header, and `frame-ancestors` can't be set from a meta tag. A framing site cannot read statements loaded into a cross-origin frame, so the impact is minimal. Fix it with the Cloudflare response header described in M1. **Confidence:** High.

### I3. Secrets
All 5 commits and 5 files in the history were scanned for keys, tokens, passwords, private keys and cloud credential patterns. **No secrets were found.** The values in `SALE` (`index.html:234-235`) are a Gumroad *product ID* and a public product URL. Gumroad documents the product ID as a public identifier used for licence verification, so it is safe in a public repo. There is no CI configuration or `.env` file. **Confidence:** High.

### I4. `docs/` is the public web root
GitHub Pages publishes everything in `docs/`, and its Jekyll build renders Markdown files even without front matter. This review and `ARCHITECTURE.md` would otherwise appear at `xray.ausiejus.lt/SECURITY_REVIEW.html`. `docs/_config.yml` now excludes them. The repository itself is public, so the files remain readable on GitHub. **Confidence:** Medium. The `exclude` behaviour is standard Jekyll but has not been verified on this site, so check after merging.

## Checked and not vulnerable

- **XSS:** every `innerHTML` sink in `render()`, `drawChart()` and the problem banner was traced. Strings from the CSV are either escaped with `esc()` (file names, currency codes, order numbers, item names) or never reach HTML (types, titles). Every number goes through `Intl.NumberFormat` or `toFixed`. Month labels come from digits only. A CSV item name of `<img src=x onerror=alert(1)>` rendered as text in Chromium and no dialog fired.
- **Prototype pollution:** the only object keyed by CSV data is `rowsByCur`, keyed by the upper-cased currency, so `__proto__` becomes `__PROTO__`, a plain own key. Order and month keys are digits.
- **CSV/formula injection:** "Copy totals for my bookkeeping" outputs only fixed category names and numbers, never strings from the CSV.
- **Data storage and logging:** statements live only in memory for the page's lifetime. The only thing persisted is the licence key. There are no `console` calls, no analytics, no error reporting and no cookies.
- **Third-party data sharing:** the only data request is `POST https://api.gumroad.com/v2/licenses/verify`, which carries `product_id`, `license_key` and `increment_uses_count`, and nothing from the statements. No LLM or other API is called. Passive third parties are Google Fonts (M2), Cloudflare and GitHub Pages, which see visit metadata only.
- **Dependencies:** there is no `package.json` or other manifest, so there is nothing for `npm audit` or similar tools to check, and no vendored libraries. The only runtime third-party resource is the Google Fonts stylesheet.
- **Auth/authz:** there are no accounts. The only gate is the licence check (M3, L6).
- **Tabnabbing:** the buy link uses `rel="noopener"`.

## Recommended order

1. Turn on Always Use HTTPS and HSTS in Cloudflare (H1); this takes minutes.
2. Add the CSP meta tag to `build.sh`, test a real unlock, then add the Cloudflare response headers (M1, I2).
3. Self-host the font (M2).
4. Fix the duplicate-row logic so reported fees are correct (L4).
5. Decide whether the paywall needs hardening (M3).
