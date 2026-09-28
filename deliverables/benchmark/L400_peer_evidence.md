# Life/400 (L400) PAS: public benchmark evidence register

Research date: 28 Sep 2026. **How it was checked:** this environment's network policy blocked direct page access to most sources (celent.com, mckinsey.com, finextra.com, scribd.com, appsruntheworld.com, freehire.me, techmonitor.ai, careers.zurich.com). Every item below was found through web search, and the text is the search engine's excerpt of the linked page. **Open each link and screenshot the passage before quoting it to the client.**

## Headline finding

No public source gives **Life/400-specific platform cost** (run cost, cost per policy, cost per transaction) for AIA, Prudential, Manulife or any other insurer. Insurers don't disclose PAS-level cost, and vendor/analyst benchmarks (Celent, Gartner, OpsDog, McKinsey) sit behind paywalls. What *is* public:
1. **Who runs Life/400 / LifeAsia**, which proves it is a peer-group legacy platform.
2. **The vendor's own position**: Life/400 is "Heritage" and DXC's route is incremental ("Protect, Extend, Transform").
3. **Legacy vs modern cost multipliers** (McKinsey), usable as a proxy benchmark.
4. **Peer modernisation approaches** (Manulife "engine two", AIA cloud), which support Option 3.

## A. Life/400 footprint: proof it is a peer-group platform

| # | Data point | Source (link) | Date | Type | Confidence |
|---|---|---|---|---|---|
| A1 | Life/400 "implemented by 75 companies in Europe, the Middle East, Africa and Asia Pacific" | [Finextra – CSC upgrades Life/400 for IBM iSeries](https://www.finextra.com/newsarticle/9940/csc-upgrades-life400-for-ibm-iseries) | 2003 | Vendor press | Medium (old) |
| A2 | CSC LIFE/Asia family: "at least 65 million policies/groups in more than 34 countries for a client base of nearly 125 companies" | [PropertyCasualty360 – CSC Introduces Global Software Suite for Insurers](https://www.propertycasualty360.com/2010/06/21/csc-introduces-global-software-suite-for-insurers/) | Jun 2010 | Trade press | Medium (old) |
| A3 | Named Life/400 users incl. **Sun Life Malaysia**, Zurich Ireland, Länsförsäkringar, Heidelberger Leben | [Apps Run The World – IBM Life/400 customers](https://www.appsruntheworld.com/customers-database/products/view/ibm-life-400) | n.d. | Database | Medium |
| A4 | **Great Eastern** (Singapore) hiring engineers for "LIS and LifeAsia" PAS; roles require experience in "Life Asia/Life400" | [freehire – Great Eastern Senior Software Engineer](https://freehire.me/jobs/senior-software-engineer-the-great-eastern-life-assurance-company-limited-xbrp4ezk) | 2025–26 | Job post | High (current use) |
| A5 | **Zurich Malaysia** (Kuala Lumpur) System Analyst role on LifeAsia/AS400 | [Zurich careers – KL System Analyst](https://www.careers.zurich.com/job/Kuala-Lumpur-System-Analyst/817859802/) | 2025–26 | Job post | Medium (verify text) |
| A6 | Life/400 classed in DXC's **"Heritage"** group (with Vantage, LifeComm, Integral Classic); DXC wants clients to move to DXC Assure | [Celent – DXC Connect Insurance Executive Forum 2023, Singapore](https://www.celent.com/en/insights/760097938) | 2023 | Analyst | High |
| A7 | Integral Life has **184 implementations in APAC**, incl. Hong Kong | Same Celent note as A6 | 2023 | Analyst | High |

**So what:** L400 isn't unusual. Great Eastern, Sun Life Malaysia and Zurich still run it, so HSBC's position is common in Asia. The vendor itself treats it as heritage, which supports planned, continuous modernisation over a forced replacement.

## B. Cost benchmarks: legacy vs modern (proxy for L400)

| # | Data point | Source (link) | Date | Type | Confidence |
|---|---|---|---|---|---|
| B1 | Life insurers with a complex legacy landscape have **IT cost per GWP more than 2× peers** with modern IT, and **operating costs 75% higher** | [McKinsey – Insurance cost benchmarking 2016 (PDF)](https://www.mckinsey.com/~/media/McKinsey/Industries/Financial%20Services/Our%20Insights/From%20transparency%20to%20insights%20McKinseys%20insurance%20cost%20benchmarking%202016/From%20transparency%20to%20insights%20McKinseys%20insurance%20cost%20benchmarking%202016.pdf) | 2016 | Analyst | High (dated) |
| B2 | IT share of operating cost for the average life carrier rose **26% → 29%**, driven by digitisation and legacy replacement | Same McKinsey benchmark (B1) / [What drives insurance operating costs?](https://www.mckinsey.com/industries/financial-services/our-insights/what-drives-insurance-operating-costs) | 2016 | Analyst | Medium (verify page) |
| B3 | Modernising legacy systems can cut **IT cost per policy by ~41%** | Cited by [Astera](https://www.astera.com/type/blog/insurance-legacy-system-transformation/) / [Synatic](https://www.synatic.com/blog/unlocking-insurance-legacy-systems) blogs, which attribute it to McKinsey | n.d. | Secondary | Low: trace to McKinsey original |
| B4 | Outsourcing legacy books can cut **total IT + ops cost per policy by up to 50%**; per-policy cost rises as legacy books shrink | [McKinsey – The value in outsourcing legacy insurance products](https://www.mckinsey.com/capabilities/operations/our-insights/the-value-in-outsourcing-legacy-insurance-products) | n.d. | Analyst | High |
| B5 | Top-quartile life carriers run operations at **2.2% of GWP** vs **5.4%** bottom quartile | Search excerpt citing McKinsey benchmarking ([Bestow blog](https://www.bestow.com/post/how-to-reduce-cost-per-policy-in-life-insurance-where-spend-leaks-and-how-to-stop-it)) | n.d. | Secondary | Low: trace original |
| B6 | ~**70% of insurer IT budget** goes on maintaining legacy systems | Multiple secondary blogs (e.g. [Decerto](https://www.decerto.com/us/post/cost-savings-with-modern-policy-administration-systems)) | n.d. | Secondary | Low (widely repeated) |
| B7 | Legacy manual processing **USD 4–7 per transaction**; error correction USD 25–30 each | Search excerpt (vendor blogs on PAS cost) | n.d. | Vendor claim | Low |
| B8 | North American life insurers: external IT spend = **56% of budget** (up from 42%) | [Celent – NA Life IT Priorities](https://www.celent.com/en/insights/195881499) | 2025 | Analyst | Medium |
| B9 | Paid sources with PAS unit-cost KPIs (not public): OpsDog *Operating expense per in-force policy (Individual Life)*; Gartner *IT Key Metrics – Insurance* | [OpsDog report](https://opsdog.com/products/life-insurance-policy-administration-benchmarking-report) · [Gartner ITKMD 2025](https://www.gartner.com/en/documents/5972871) | 2025 | Paid | Buy if needed |

**So what:** B1 is the strongest cite. It sizes the gap between a legacy-heavy estate and a modern one without needing L400-specific numbers. Use B4/B8 for the vendor-dependence point. Use B3, B5, B6 and B7 only after tracing them to the original source.

## C. Peer modernisation approaches (supports Option 3)

| # | Data point | Source (link) | Date | Type | Confidence |
|---|---|---|---|---|---|
| C1 | **Manulife** kept its ~25-year-old core as the "system of customer record" and put new transactions on a new stack ("engine two"), linked by a data lake and microservices. It never intends to retire the original stack | [DigFin – Manulife begins digital journey](https://www.digfingroup.com/insurtech-insurance-2/) | 2019 | Trade press | High |
| C2 | **AIA**: >86% of IT infrastructure on public cloud; **1.3bn policy transactions/month**; ~195% tech capacity growth; **18.5% cost-efficiency gain** vs legacy infrastructure; 63% of claims settled same day | [Computer Weekly – Inside AIA's cloud adoption journey](https://www.computerweekly.com/news/365532648/Inside-AIAs-cloud-adoption-journey) | 2023 | Trade press | High |
| C3 | **DXC** (L400 vendor) recommends "Protect, Extend, Transform": keep heritage cores and add capability around them | [DXC – Protect, Extend, Transform](https://dxc.com/insights/knowledge-base/how-dxc-protect-extend-transform-framework-empowers-digital-transformation) | 2025 | Vendor | High (vendor view) |
| C4 | **ivari** migrated 732k policies to DXC Assure: **22% lower operating cost**, 4 new products. **Allianz PNB Life**: issuance down to 5 minutes, product launch down from 2+ months to 2 weeks | Same DXC page as C3; [Barchart – ivari cloud transformation](https://www.barchart.com/story/news/36431962/dxc-powers-ivari-s-cloud-transformation-of-core-life-insurance-platform) | 2025 | Vendor case | Medium (vendor claim) |

**So what:** Manulife (C1) is a direct peer running what is effectively Option 3. AIA (C2) gives public evidence for the technology-acceleration lens.

## D. What is not publicly available (tell the client)

- L400 or PAS cost for AIA, Prudential, Manulife or any HK peer: not disclosed in annual reports.
- PAS-level STP rates for named peers: the workbook's ">70% / >50% / >10%" figures have no public source I could find.
- Cost per policy or per transaction on Life/400 specifically: no public data.

**Options for real peer numbers:** (1) buy OpsDog / Gartner ITKMD / Celent benchmarks; (2) ask DXC for anonymised Life/400 client run-cost ranges (they hold APAC data, see A6/A7); (3) run a peer survey through the consulting firm's benchmarking panel.
