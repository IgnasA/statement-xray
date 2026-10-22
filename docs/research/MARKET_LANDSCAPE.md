# Statement X-Ray: market landscape

October 2026

> Scope note: the original brief called Statement X-Ray a generic "bank statement analyzer". The code (`index.html`) shows it is an **Etsy monthly-statement fee analyzer**. This report treats it that way, and counts bank-statement analyzers, personal finance apps and AI categorizers as indirect competitors.

## Executive summary

Statement X-Ray sits in a thin, under-served niche. Free Etsy fee calculators are everywhere, but they estimate fees on a future sale. They do not look back at what Etsy actually charged [19][18]. The only tools that analyze a seller's real statement are paste-in spreadsheets [6][8][9] and API-connected subscriptions: Seller Profit Lens at $7.99/mo [7], and bookkeeping sync tools from about $12 to $29/mo and up [11][13]. The research found no other tool that parses the Etsy CSV in the browser without uploading it. Every bank-statement converter that was checked processes files on its own servers [20].

Demand is real. Etsy has about 5.7M active sellers, and 89% of them are businesses of one [1][2]. Its take rate has risen to 25.9% [3]. Sellers regularly say the statement is hard to read and that Offsite Ads charges catch them by surprise [31][32][34].

The best openings are with EU and UK sellers, who see VAT on fees, Regulatory Operating Fee increases from June 2026 and low DAC7/HMRC reporting thresholds [5][37][38], and with low-ticket digital and print-on-demand sellers (speculation). Keeping the tool browser-only also keeps the operator's GDPR duties small. Switching to the Etsy API or open banking would add an OAuth backend, approval delays and controller duties, and it would undo the privacy pitch [41][42][47].

Revenue at $9 one-time will probably stay small, in the hundreds of dollars a month at most (speculation). The cheapest levers are:

- making the privacy claim verifiable;
- adding VAT and Offsite Ads breakdowns;
- writing long-tail SEO pages that answer specific statement questions;
- adding a yearly "tax season" pass.

## Product and positioning

Statement X-Ray (https://xray.ausiejus.lt) is a single-file web page built by a solo developer in Lithuania. The seller drops in an Etsy monthly statement CSV. The page parses it in the browser and shows how much Etsy took in each category: transaction, processing, listing/auto-renew, Offsite Ads, Etsy Ads, shipping labels, VAT on fees and other. The free view shows totals. A $9 one-time Gumroad license unlocks the full report: a monthly chart, the orders where fees took the biggest share, insights, and a button that copies totals for bookkeeping. The page checks the license against Gumroad's `/v2/licenses/verify` endpoint and loads Google Fonts. Both calls are in the source.

**Positioning.** X-Ray answers "what did Etsy take from me?", not "what will this sale cost?". It sits between free DIY spreadsheets and monthly SaaS. Its selling points are no login, no OAuth, nothing uploaded, no spreadsheet skills needed, and a one-time price [7][8].

**Why the problem exists.** Etsy's fees come off in pieces:

- a $0.20 listing fee, charged again on every auto-renewal;
- a 6.5% transaction fee;
- payment processing (US 3% + $0.25; UK 4% + £0.20);
- 2.5% currency conversion;
- Offsite Ads at 15%, or 12% for shops over $10K [4];
- country-specific Regulatory Operating Fees [5].

Etsy's dashboard "Fees & Taxes" figure leaves out shipping-related and tax-related fees, which appear only in the CSV [6].

## Competitor comparison

| Tool | Category | Data access method | Pricing (Oct 2026) | Local / privacy stance | Relevance to X-Ray |
|---|---|---|---|---|---|
| **Statement X-Ray** | Etsy statement fee analyzer | CSV dropped into the browser | Free totals; $9 one-time | Parsed locally, nothing uploaded | Reference |
| Seller Profit Lens [7] | Etsy profit-per-product SaaS | Etsy API, read-only OAuth | Free in beta, then $7.99/mo | Cloud; syncs shop data | **Closest functional rival**; does not mention Offsite Ads |
| Ardent Workshop Etsy Financial Tool [8] | Excel/Sheets template | Paste statement CSV | Not captured | Local (spreadsheet) | Direct substitute; monthly totals only, no per-listing view |
| Paperless Books Etsy Fee Calculator [6] | Free spreadsheet | Paste CSV into a "Drop" tab | Free | Local (spreadsheet) | Direct free substitute |
| Etsy listing 677594455 fee-summary template [9] | Spreadsheet sold on Etsy | Statement CSV | Not captured; ~122 reviews (snippet) | Local | Direct substitute; US accounts only |
| Other Etsy/Gumroad templates [61][66] | Spreadsheets | Manual entry or CSV paste | ~$5–38 | Local | Sets the price anchor for $9 |
| Stocksmith (formerly Craftybase) [10] | Inventory, COGS, accounting | Sales-channel integration | $20–349/mo | Cloud | Overlaps for serious makers |
| A2X for Etsy [11] | Payout-to-ledger sync | Etsy connection → QBO/Xero/NetSuite | $29–1,499/mo; non-Mini prices rise 14 Nov 2026 | Cloud | Downstream; serves sellers with accountants |
| Taxomate [13] | Payout-to-ledger sync | Etsy → QBO/Xero/Wave | From $12–14/mo | Cloud | Cheapest sync alternative |
| Link My Books [12] | Payout-to-ledger sync | Etsy (new), connection not stated | Volume-based | Cloud | UK/VAT-leaning sync |
| Alura [14] | SEO/research suite | Etsy OAuth | Free; $7.99–29.99/mo | Cloud | Profit calculator on all plans; could add statement analysis (speculation) |
| EverBee / eRank / Marmalead [15][16][17] | SEO/research suites | Extension or Etsy connection | Free–$69/mo; Marmalead $300 lifetime | Cloud | Compete for attention, not for the job |
| Free fee calculators (etsyfeecalc, ZIK, Vendoo, etc.) [19][18] | Per-sale estimators | Manual single-sale entry | Free (lead magnets) | n/a | Compete for "etsy fee calculator" search traffic; ZIK leaves out Offsite Ads |
| DocuClipper [20] | Bank-statement converter | Upload PDFs to cloud | $20.30–279.30/mo (annual) | Cloud; TLS, SOC 2, "not used for AI training" | Indirect; does not understand Etsy fee types |
| ChatGPT / general AI [22][23] | General-purpose AI | Paste or upload CSV; 2026 bank linking | Free–subscription | Cloud; privacy guides say strip data first | **Biggest free substitute** |
| Actual Budget [24] | Personal finance (open source) | Local file; optional bank sync | Free | Local-first | Shows the privacy-first audience exists, and that it expects free tools |
| Sąskaita123 / Invoice123 [25] | LT invoicing and bookkeeping | Bank statement import | From ~€3.30/mo (2024) | Cloud | Where Lithuanian sellers' numbers end up, not a rival |

## Indirect competitors: many converters, none that explain Etsy fees

**Bank-statement analyzers and converters** sell subscriptions priced by page or by month to accountants and lenders. DocuClipper charges $20.30/mo for 60 pages, up to $279.30/mo for 1,800+ pages, on annual billing [20]. Smaller converters advertise plans from about $60/yr [21]. Their privacy pitch is encryption, deletion and SOC 2, never "the file stays on your device" [20][72]. They turn PDFs into rows of data but know nothing about Etsy's fee types, so they solve a different problem.

**General AI is the real substitute.** A seller can paste the CSV into ChatGPT for free. Privacy guides tell users never to upload raw statements, and found that some exports include cardholder names [22]. OpenAI's 2026 bank-linking finance feature was logged by the OECD AI incident monitor over privacy concerns [23]. "Stated" already markets uploading statements instead of logging into a bank as a privacy feature [69]. X-Ray can beat AI tools on three things: math that gives the same answer every time, correct handling of Etsy's fee categories, and no data leaving the browser. Accuracy is a real argument here: AI bookkeeping categorization is estimated at roughly 75–85% accurate [27], while Etsy's fee categories are a fixed, known list.

**Personal finance apps** (YNAB about $109/yr, Monarch about $99.99/yr, Rocket Money with a free tier and a subscription-cancelling pitch) are built around bank sync and do not break down marketplace fees [67]. Wallet (BudgetBakers) offers a $49.99 lifetime option [68]. These apps do make $9 one-time look cheap (speculation). **Subscription finders** such as Rocket Money solve a different problem. Recurring Etsy charges, such as Etsy Plus at $10/mo and listing auto-renewals, are the closest overlap [4][67].

**AI expense categorizers** (Booke, Dext, Hubdoc, Vic.ai) cost about $20–130/mo and work inside Xero or QuickBooks for accountants and small businesses [27]. They are far above X-Ray's price and complexity.

**Other marketplaces.** Amazon has mature SaaS such as Sellerboard, which tracks 100+ fee types from about $15/mo [28]. Shopify has payout-fee apps such as PayHelm, at $50/mo for Pro [29]. In resale, PennyTurn already advertises that it "runs locally in the browser" [30]. So privacy-first is uncommon in this space, but X-Ray is not the only tool using it.

**Lithuania and the Baltics.** The tools closest to X-Ray locally are bookkeeping products for *individuali veikla* (individual activity), such as Sąskaita123/Invoice123 with bank-statement import [25], and human bookkeepers from about €50/mo [26]. The research found no Baltic tool that analyzes Etsy or marketplace fees. These tools are where X-Ray's exported totals would go, not rivals.

## Target segments: solo sellers paying a growing take rate

Etsy had **5.6M active sellers at end-2025 and 5,706K at 30 June 2026**, up 5.9% year on year [1][2]. Etsy marketplace GMS was $10.46B in FY2025 [1]. The consolidated take rate was 25.9% in Q2 2026, with guidance of about 26% for the year, and Etsy says the increase was "driven mainly by Etsy Ads" [3]. In the 2024 Seller Census, **89% of sellers were businesses of one, 97% worked from home and about half sold only on Etsy** [1]. Average GMS per seller is roughly $1.8K a year, so most sellers are hobby-scale (inference from [1][2]).

**Pain points, from Etsy Community threads:**

- The monthly statement lists fees but not income [31].
- PDF tax statements and VAT invoices do not match the CSV, because refunded fees are missing and transactions near month-end land in the wrong month [32].
- Offsite Ads fees can be billed on a later statement than the sale [33].
- Offsite Ads fees feel larger than expected. In one example, 15% of a $22.23 order total (including shipping and tax) came to about 31% of a $10 item price [34].

Fixed fees hurt cheap items most: fees are about 21% of a $15 item [62]. The 2022 fee-increase strike drew around 50K petition signatures [35], which shows how strongly sellers feel about fees.

| Segment | Fit for $9 one-time | Reasoning |
|---|---|---|
| EU/UK sellers (incl. Lithuania) | High (speculation) | They see VAT on fees [39][40], Regulatory Operating Fee rises from 22 June 2026 (FR 0.47%→1.14%, UK 0.32%→0.48%) [5], and low DAC7/HMRC reporting thresholds (30 sales / €2,000) [37][38]. DE and FR seller bases are growing and selling across borders more [63] |
| Digital-download and POD sellers | High (speculation) | Fixed fees take a large share of low prices [62]; margins are thin |
| Hobby sellers (<$10K/yr) | Medium-high (speculation) | Price-sensitive. Can opt out of Offsite Ads [4] but may not know it |
| Full-time sellers (>$10K/yr) | Medium (speculation) | Offsite Ads is mandatory at 12% [4]. Many already have Craftybase or an accountant [10] |
| Bookkeepers serving makers | Untested (speculation) | Nothing is uploaded, which fits handling client data |

In the US, the 1099-K threshold went back to more than $20,000 and more than 200 transactions under the OBBB [36]. Fewer US hobby sellers get the form, so for US sellers X-Ray's value is tracking deductible fees, not reacting to a 1099-K (speculation).

## Regulation and privacy: browser-only is the low-burden design

**GDPR.** The operator never receives the CSV, so it most likely does not process statement data and is not a controller for it. EDPB guidance does say a party can be a controller without seeing the data if it decides the purposes and the essential means [45]. No regulator has ruled on browser-only tools, so this is inference, and the design should be documented. The operator still processes some personal data: visitor IP addresses through hosting, the Google Fonts request and the Gumroad license check. That calls for a short Art. 13 privacy notice.

The Google Fonts embed is a known risk. LG München I awarded €100 in damages because a site's Google Fonts embed sent visitor IPs to Google without consent, and the ruling set off a wave of German warning letters [46]. Self-hosting the fonts removes that risk. Storing the license key in localStorage is arguably strictly necessary for a service the user asked for, so the ePrivacy consent exception likely applies and no cookie banner is needed (inference).

**Etsy API as an alternative to CSV upload.** Etsy's Open API v3 has payment-account ledger endpoints (`getShopPaymentAccountLedgerEntries`, scope `transactions_r`). They return per-entry fees, and a `parent_entry_id` links each `vat_seller_services` line to the fee it applies to [41]. Serving many shops requires commercial access. Developers say it "seems to be hard to get" [42], and one integrator puts approval at about 30 days [43]. The API Terms bar any trademark use that suggests endorsement [44]. Using the API would mean holding OAuth tokens on a server, which makes the operator a data controller and removes the "nothing uploaded" pitch (inference). The current name, which leaves out "Etsy", is the safer choice. Pair it with a "not affiliated with Etsy, Inc." disclaimer [44].

**PSD2 / open banking.** This route offers nothing here. A bank feed shows only net Etsy deposits, not the fee lines. Offering account information yourself in Lithuania needs a Bank of Lithuania licence [47]. GoCardless Bank Account Data, formerly the free Nordigen, has closed new signups [48]. PSD3/PSR reached political agreement in November 2025, and FIDA was still in negotiation in 2026 [49]. Neither would force Etsy to share its ledger (speculation).

**Tax reporting.** Etsy reports EU sellers under DAC7, sending name, address, TIN, VAT number and bank account to tax authorities [37]. The UK digital platform rules have applied since 1 January 2024 [38]. Etsy Ireland charges VAT on fees unless the seller gives Etsy a VAT number, in which case the seller accounts for it under reverse charge. Irish sellers always pay 23% [39][40]. Lithuania's 2026 reform changes how individual-activity income is taxed [50]. All of these make clean fee totals more useful. Any reconciliation feature needs a "not tax advice" disclaimer.

**Selling the license.** Gumroad has been merchant of record since 1 January 2025, so it handles VAT and sales tax [52][51]. The European Accessibility Act exempts microenterprises that provide services [54].

## Distribution channels: search intent beats community promotion

Community channels restrict promotion heavily:

- **Reddit.** r/EtsySellers allows links only in a weekly self-promotion thread and bans "promoting services for Etsy sellers" in its monthly sales thread. These rules come from a mirror, not the live sidebar [55].
- **Etsy Community forums.** Etsy staff have asked members not to self-promote (older threads) [56].
- **Facebook groups.** Large Etsy seller groups are reported to exist, but their member counts could not be verified.
- **Affiliates and YouTube.** Incumbents pay creators 30% recurring for 12 months (eRank) or 20% for the first 12 payments (Craftybase) [57][58]. A cut of a $9 one-time sale cannot match that.
- **Head-term SEO.** "Etsy fee calculator" is crowded with vendor lead magnets [19][14][15]. A free Etsy toolkit launched on Indie Hackers in April 2026 reported no revenue [59].

Channels that fit better (speculation, grounded in the evidence above):

- **Long-tail SEO pages** that answer specific statement questions: Offsite Ads fee, VAT on fees, the June 2026 Regulatory Operating Fee changes, and why the PDF does not match the CSV. These are exactly where third-party sources disagree [71][65][5].
- **Helpful posts with no link** in seller communities, with the link saved for the promo threads [55].
- **An Etsy listing.** Sellers already buy CSV-import templates there at $5–38 [66][61]. Whether Etsy allows a license-key listing is unverified.
- **Lithuanian bookkeeping partners.** Export presets for Sąskaita123 and Rivile [25].

## Monetization: a one-time price sized like a template

Buyers will compare $9 one-time with **$5–38 Etsy templates** [66], not with SaaS. Subscription peers start at $7.99/mo (Alura, Seller Profit Lens) and $20/mo (Stocksmith) [14][7][10].

**Fees on a $9 sale:**

| Platform | Fees | Net |
|---|---|---|
| Gumroad | 10% + $0.50 [51], possibly plus card processing | ~$7.04–7.60 |
| Stripe Managed Payments (MoR, supports Lithuania) | ~5% + $0.50 (secondary source; Stripe's docs do not state the fee) [53][70] | ~$8.05 |

Paddle quotes custom pricing for products under $10 [64].

**Volume.** Freemium free-to-paid conversion usually runs 2–5%, and a quarter of products convert below 2.5% [60]. At that rate, 1,000 free analyses would produce about 20–50 sales, or roughly $150–380 net (speculation).

**Pricing options (speculation):**

- A $19–29 annual "tax season pass" that covers a full year of statements.
- A price of $15–19 one-time, which reduces how much the fixed $0.50 fee takes.
- A bookkeeper license for analyzing many client statements.
- Referring heavier users to Craftybase/Stocksmith as an affiliate. That program pays 20% for 12 payments [58], which could earn more per user than the license itself.

## Gaps and opportunities for Statement X-Ray

1. **The only CSV analyzer that runs entirely in the browser.** The research found no other tool that does Etsy statement analysis locally. The rest are spreadsheets or OAuth/cloud tools [7][20]. This is from a limited search, so treat it as inference. To defend the claim, X-Ray should make it checkable.
2. **Non-US accuracy.** The best-known CSV template works for US accounts only [9]. ZIK's calculator leaves out Offsite Ads and the regulatory fee [18]. Seller Profit Lens does not mention Offsite Ads [7]. Getting VAT on fees, Regulatory Operating Fees and currency conversion right for EU/UK sellers is an open gap.
3. **Offsite Ads clarity.** Sellers are confused about the fee base, late billing and the opt-out [33][34][4]. A per-order Offsite Ads view answers their most-asked question.
4. **Reconciliation help.** Sellers struggle with PDF/CSV/VAT-invoice mismatches and month-boundary problems [32]. Explaining these, and showing totals that line up with what Etsy reports under DAC7/HMRC [37][38], is an under-served feature (speculation).
5. **Lithuanian/Baltic bookkeeping exports.** Copy formats for Sąskaita123/Rivile [25] would make X-Ray the only Etsy tool aimed at *individuali veikla* sellers (speculation).
6. **Threat.** Seller Profit Lens or Alura could add statement-level fee breakdowns cheaply [7][14] (speculation). Free AI chat is a substitute that is always available [22].

## Top 5 recommended product moves

Ranked by impact relative to effort. Impact and effort ratings are the author's judgment (speculation). Rationale and evidence are cited.

| Rank | Move | Impact | Effort | Rationale | Evidence |
|---|---|---|---|---|---|
| 1 | **Make "nothing uploaded" verifiable:** self-host fonts, add a strict CSP (`connect-src` limited to the Gumroad API), publish a short privacy notice and a "not affiliated with Etsy" disclaimer | Medium-high | Low | Turns the one feature no competitor has into something users can check. Removes the Google Fonts IP-transfer risk. Fulfils the Art. 13 notice duty and lowers trademark risk | [46][45][44][20] |
| 2 | **EU/UK breakout:** separate lines for VAT on fees (with a reverse-charge note), Regulatory Operating Fee and currency conversion; correct handling of non-USD statements | High | Low-medium | Targets the segment most likely to pay. Competitors are US-only or silent on this. The June 2026 ROF rises give a reason to act now | [5][39][40][9][37] |
| 3 | **Offsite Ads audit:** per-order Offsite Ads share, flags for fees billed on a later statement, and a "you're under $10K and can opt out" hint | High | Low-medium | Sellers' most visible complaint. Calculators and Seller Profit Lens leave it out | [34][33][4][18][7] |
| 4 | **Long-tail SEO pages** that answer one statement question each (Offsite Ads fee, VAT on fees, 2026 ROF, PDF vs CSV mismatch), each linking to the free tool | High | Medium | Head-term "fee calculator" search is crowded. Community channels ban promotion. The specific questions are where sources disagree | [19][55][56][71][32] |
| 5 | **Add a yearly tier:** load several months or a full year at once, with a $19–29 "tax season pass" next to the $9 license; consider Stripe Managed Payments to cut fees | Medium | Medium | Matches how sellers work at year-end (DAC7, HMRC, Self Assessment). Raises revenue per buyer while staying below every subscription. The fixed $0.50 fee weighs heavily on $9 | [37][38][51][53][60] |

## Limitations and open questions

- **Missing first-hand evidence.** No Reddit threads were retrieved. Pain points come from Etsy Community threads and vendor pages. There is no survey data on willingness to pay or on which tools sellers use.
- **Unverified pricing.** Several prices come from search snippets or third-party roundups that disagree with each other: personal finance apps, Etsy templates, and Stripe Managed Payments' fee and availability. Etsy.com listing pages and its legal fees page returned HTTP 403.
- **Unconfirmed fee rates.** Etsy's own fee page could not be fetched. Processing rates for DE, FR, AU and LT, and ROF rates for CA, AU and DE, are unconfirmed. The full English text of the Etsy API Terms was not read; wording comes from search excerpts.
- **Market sizing.** There are no country-level Etsy seller counts, including for Lithuania and the Baltics. No search volumes were found for long-tail statement queries.
- **Uniqueness claim.** "No other local-only Etsy CSV analyzer" comes from a limited search. The Chrome extension "Real Profit" could not be inspected.
- **Unsettled law.** No regulator has ruled on whether a browser-only tool's operator is a GDPR controller. The PSD3/FIDA timelines conflict across sources.
- **Open questions.**
  - Does Etsy allow selling a web-app license key as a digital download?
  - Does Gumroad's 10% + $0.50 include card processing?
  - What share of sellers sell digital or POD products?

## Sources

1. Etsy FY2025 Form 10-K — https://www.sec.gov/Archives/edgar/data/1370637/000137063726000019/etsy-20251231.htm
2. Etsy Q2 2026 Form 10-Q — https://www.sec.gov/Archives/edgar/data/0001370637/000137063726000080/etsy-20260630.htm
3. Etsy Q2 2026 shareholder letter — https://www.sec.gov/Archives/edgar/data/0001370637/000137063726000079/q226shareholderletter.htm
4. Marmalead, Etsy fees explained (Feb 2026) — https://blog.marmalead.com/etsy-fees-explained-2025/
5. Beancount, Etsy Regulatory Operating Fee increase June 2026 — https://beancount.io/blog/2026/08/22/etsy-regulatory-operating-fee-increase-june-2026-seller-payout-bookkeeping-guide
6. Paperless Books, Etsy Fee Calculator 2023 — https://paperlessbooks.ca/products/etsy-fee-calculator-2023
7. Seller Profit Lens — https://sellerprofitlens.com/
8. Ardent Workshop, Etsy Financial Tool — https://www.ardentworkshop.com/products/etsy-financial-tool-excel/
9. Etsy listing 677594455, Payment Account Fee Summary template — https://www.etsy.com/listing/677594455/etsy-payment-account-fee-summary-excel
10. Stocksmith (formerly Craftybase) pricing — https://stocksmith.io/pricing/
11. A2X for Etsy pricing — https://www.a2xaccounting.com/etsy/pricing
12. Link My Books pricing — https://linkmybooks.com/pricing
13. Taxomate pricing — https://taxomate.com/pricing
14. Alura pricing — https://www.alura.io/pricing
15. EverBee pricing — https://everbee.io/pricing
16. eRank pricing — https://erank.com/pricing
17. Marmalead pricing — https://marmalead.com/pricing
18. ZIK Analytics Etsy fee calculator — https://www.zikanalytics.com/free-tools/etsy-fee-calculator
19. etsyfeecalc.org — https://etsyfeecalc.org/
20. DocuClipper pricing and privacy — https://www.docuclipper.com/pricing/
21. TrustMRR, Bank Statement Converter — https://trustmrr.com/startup/bank-statement-converter?metric=mrr
22. WalletHacks, using AI on your money with privacy concerns — https://wallethacks.com/how-to-use-ai-on-your-money-when-youre-concerned-about-privacy/
23. OECD.AI incident 2026-05-13 (ChatGPT finance feature) — https://oecd.ai/en/incidents/2026-05-13-093d
24. Actual Budget, vision — https://actualbudget.org/docs/vision/
25. Rivile apps, Sąskaita123 — https://www.rivile.lt/en/apps/saskaita123
26. Paslaugos.lt, individual activity bookkeeping — https://paslaugos.lt/individualios-veiklos-apskaitos-tvarkymas/vilniaus-rajone
27. Beancount forum, AI bookkeeping tools compared — https://beancount.io/forum/t/booke-ai-vic-ai-docyt-which-ai-bookkeeping-tool-actually-works/136
28. Sellerboard — https://sellerboard.com/
29. PayHelm on Shopify App Store — https://apps.shopify.com/free-reports-analytics
30. PennyTurn on Product Hunt — https://www.producthunt.com/products/pennyturn
31. Etsy Community, "Printable monthly statements" — https://community.etsy.com/t5/Etsy-Success/Printable-monthly-statements/td-p/70769565
32. Etsy Community, "Tax statement wrong" — https://community.etsy.com/t5/Technical-Issues/Tax-statement-wrong/m-p/147401049/highlight/true
33. ConnectBooks, Etsy seller accounting — https://www.connectbooks.com/blog-posts/etsy-seller-accounting-and-bookkeeping-what-s-different
34. Etsy Community, "Offsite ad fees percentages are wrong" — https://community.etsy.com/t5/Technical-Issues/Offsite-ad-fees-percentages-are-wrong/m-p/147111619
35. CNN, Etsy sellers strike (11 Apr 2022) — https://edition.cnn.com/2022/04/11/tech/etsy-sellers-strike
36. IRS, Form 1099-K threshold under OBBB — https://irs.gov/newsroom/irs-issues-faqs-on-form-1099-k-threshold-under-the-one-big-beautiful-bill-dollar-limit-reverts-to-20000
37. Etsy Help, information Etsy reports for EU/UK/Canada sellers — https://help.etsy.com/hc/articles/17795509361431
38. Sage, HMRC digital platform reporting rules — https://www.sage.com/en-gb/blog/hmrc-digital-platform-reporting-rules-online-sellers/
39. Link My Books, does Etsy charge VAT on fees — https://linkmybooks.com/blog/do-etsy-charge-vat-on-their-fees
40. A2X, Etsy VAT on seller fees — https://www.a2xaccounting.com/ecommerce-accounting-hub/etsy-vat-seller-fees
41. Etsy Open API v3 spec (JSON) — https://www.etsy.com/openapi/generated/oas/3.0.0.json
42. GitHub etsy/open-api discussion #1663 — https://github.com/etsy/open-api/discussions/1663
43. Apideck, Etsy connection guide — https://developers.apideck.com/apis/ecommerce/etsy/connection
44. Etsy API Terms of Use (via search excerpt) — https://www.etsy.com/mx/legal/api
45. Hunton, EDPB guidelines on controller and processor — https://huntonak.com/privacy-and-information-security-law/edpb-publishes-guidelines-on-the-concepts-of-controller-and-processor-in-the-gdpr
46. LG München I, 3 O 17493/20 (Google Fonts) — https://www.gesetze-bayern.de/Content/Document/Y-300-Z-GRURRS-B-2022-N-612
47. Bank of Lithuania, payment initiation and account information services — https://www.lb.lt/lt/mokejimo-inicijavimo-ir-saskaitos-informacijos-paslaugos
48. GoCardless Bank Account Data, new signups disabled — https://bankaccountdata.gocardless.com/new-signups-disabled
49. Crassula, PSD3/PSR guide — https://crassula.io/guides/licenses/psd3-psr/
50. KPMG Lithuania, personal income tax changes 2026 — https://kpmg.com/lt/en/insights/2025/10/changes-in-taxation-of-personal-income-as-of-2026.html
51. Gumroad pricing — https://gumroad.com/pricing
52. Gumroad Help, sales tax on Gumroad — https://gumroad.com/help/article/121-sales-tax-on-gumroad
53. Stripe Managed Payments docs — https://docs.stripe.com/payments/managed-payments
54. Irish CCPC, EAA guidelines for microenterprises — https://www.ccpc.ie/business/enforcement/accessibility/european-accessibility-act-guidelines-for-microenterprises/
55. r/EtsySellers (mirror) — https://reddit.sudovanilla.org/r/EtsySellers
56. Etsy Community, "No promoting treasuries, Facebook fan pages" — https://community.etsy.com/t5/Etsy-Success/No-Promoting-Treasuries-Facebook-Fan-Pages-etc-pretty-please/m-p/22615413
57. eRank Help, affiliate program — https://help.erank.com/faq/does-erank-have-an-affiliate-program/
58. Craftybase affiliates — https://craftybase.com/affiliates
59. Indie Hackers, free Etsy seller toolkit (Apr 2026) — https://www.indiehackers.com/post/free-etsy-seller-toolkit-profit-calculator-ai-tag-title-generator-shop-description-writer-no-login-2945053265
60. ChartMogul, SaaS Conversion Report — https://chartmogul.com/reports/saas-conversion-report/
61. Gumroad, "Etsy Sellers Hub" template — https://serenatasstore.gumroad.com/l/etsysellershub
62. Bootstrapping Ecommerce, how much commission Etsy takes — https://bootstrappingecommerce.com/how-much-commission-does-etsy-take/
63. Patreon analysis of Etsy 2024 Seller Census — https://www.patreon.com/posts/125639678
64. Paddle vs Gumroad — https://paddle.com/compare/gumroad
65. Craftybase, Etsy charging VAT on seller fees — https://craftybase.com/blog/etsy-charging-vat-for-seller-fees-from-midyear
66. Etsy listing 993076115, bookkeeping template — https://www.etsy.com/listing/993076115
67. Dupple, ChatGPT for budgeting (app pricing roundup) — https://dupple.com/learn/chatgpt-for-budgeting
68. PocketClear, cheapest budgeting apps 2026 — https://pocketclear.app/blog/cheapest-budgeting-apps-2026.html
69. FeedBagel, "Stated" privacy-first AI finance tracker — https://feedbagel.com/post/stated-privacy-first-ai-finance-tracker-uses-bank-statement-uploads-instead-of-b
70. Fungies, Lemon Squeezy / Stripe Managed Payments 2026 — https://fungies.io/lemon-squeezy-stripe-acquisition-saas-founders-2026/
71. Checkoutpage, Etsy fees 2026 — https://checkoutpage.com/blog/etsy-fees
72. Capterra NZ, Convert Bank Statements — https://www.capterra.co.nz/software/1107379/Convert-Bank-Statements
