const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "HSBC Life – IT Cost & PAS (L400) Benchmark";

const RED = "C8102E", DARK = "222222", GREY = "7F7F7F", LGREY = "EDEDED", MGREY = "BFBFBF", CGREY = "8C8C8C", WHITE = "FFFFFF";
const F = "Arial";
const W = 13.33, M = 0.5;

function header(s, tag, title, answer) {
  s.background = { color: WHITE };
  s.addText([{ text: tag.split("|")[0], options: { bold: true } }, { text: "|" + tag.split("|")[1] }],
    { x: M, y: 0.25, w: 8, h: 0.3, fontFace: F, fontSize: 13, color: RED, margin: 0, isTextBox: true });
  s.addText(title, { x: M, y: 0.55, w: W - 2 * M, h: 0.55, fontFace: F, fontSize: 22, color: DARK, margin: 0, valign: "top", isTextBox: true });
  if (answer) {
    s.addText([{ text: "Key takeaway: ", options: { bold: true } }, { text: answer }],
      { x: M, y: 1.12, w: W - 2 * M, h: 0.6, fontFace: F, fontSize: 12.5, color: DARK, margin: 0, valign: "top", isTextBox: true });
  }
}
function footer(s, txt, n) {
  s.addText(txt, { x: M, y: 7.02, w: W - 2 * M - 0.6, h: 0.35, fontFace: F, fontSize: 8.5, color: GREY, margin: 0, valign: "bottom", isTextBox: true });
  s.addText(String(n), { x: W - M - 0.5, y: 7.02, w: 0.5, h: 0.35, fontFace: F, fontSize: 9, color: GREY, align: "right", margin: 0, valign: "bottom", isTextBox: true });
}
function redBox(s, x, y, w, h, text, opts = {}) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: RED }, line: { color: RED } });
  s.addText(text, { x: x + 0.1, y, w: w - 0.2, h, fontFace: F, fontSize: opts.fontSize || 12, color: WHITE, bold: !!opts.bold, align: opts.align || "left", valign: opts.valign || "middle", margin: 0.05, isTextBox: true });
}
function greyBox(s, x, y, w, h, text, opts = {}) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: opts.fill || CGREY }, line: { color: opts.fill || CGREY } });
  s.addText(text, { x: x + 0.1, y, w: w - 0.2, h, fontFace: F, fontSize: opts.fontSize || 11, color: WHITE, valign: "middle", margin: 0.05, isTextBox: true });
}
function panelHeader(s, x, y, w, text) {
  redBox(s, x, y, w, 0.38, text, { bold: true, fontSize: 12 });
}
function stat(s, x, y, w, big, label, color = RED) {
  s.addText(big, { x, y, w, h: 0.6, fontFace: F, fontSize: 30, bold: true, color, margin: 0, isTextBox: true });
  s.addText(label, { x, y: y + 0.62, w, h: 0.55, fontFace: F, fontSize: 10.5, color: DARK, margin: 0, valign: "top", isTextBox: true });
}
function bullets(s, items, x, y, w, h, size = 11.5, gap = 6) {
  s.addText(items.map((t, i) => {
    const runs = Array.isArray(t) ? t : [{ text: t }];
    return runs.map((r, j) => ({ text: r.text, options: Object.assign({ bullet: j === 0 ? { indent: 12 } : undefined, breakLine: j === runs.length - 1 && i < items.length - 1, paraSpaceAfter: gap }, r.options || {}) }));
  }).flat(), { x, y, w, h, fontFace: F, fontSize: size, color: DARK, valign: "top", margin: 0.05, isTextBox: true });
}
const axis = () => ({
  catAxisLabelColor: "404040", valAxisLabelColor: "808080", catAxisLabelFontFace: F, valAxisLabelFontFace: F,
  catAxisLabelFontSize: 10, valAxisLabelFontSize: 9, valGridLine: { color: "E3E3E3", size: 0.5 }, catGridLine: { style: "none" },
  dataLabelFontFace: F, dataLabelFontSize: 10, dataLabelColor: "333333", titleFontFace: F, titleFontSize: 12, titleColor: DARK,
});


const SRC = "Source: HSBC Life PAS L400 benchmarking workbook ('HSBC vs Peers KPI – ICT basis'). HSBC FY2025 actual; LE2026 = Jan–Aug annualised. HK DWP 2024 (top 8). USD at HKD 7.8.";
const colHdr = (s, cols, y) => cols.forEach(([t, x, w]) => s.addText(t, { x, y, w, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: GREY, margin: 0, isTextBox: true }));
function card(s, x, y, w, h, head, body, dark) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: dark ? RED : LGREY }, line: { color: dark ? RED : LGREY } });
  s.addText([{ text: head, options: { bold: true, breakLine: true, color: dark ? WHITE : RED } }, { text: body }],
    { x: x + 0.1, y, w: w - 0.2, h, fontFace: F, fontSize: 11, color: dark ? WHITE : DARK, valign: "middle", margin: 0.05, isTextBox: true });
}
function lensTable(s, rows, heads, y0, rh, fs) {
  const lx = M, lw = 2.9, ex = lx + lw + 0.15, ew = 4.7, kx = ex + ew + 0.15, kw = W - M - kx;
  colHdr(s, [[heads[0], lx, lw], [heads[1], ex, ew], [heads[2], kx, kw]], y0 - 0.32);
  rows.forEach((r, i) => {
    const y = y0 + i * (rh + 0.1);
    redBox(s, lx, y, lw, rh, r[0], { bold: true, fontSize: 13 });
    s.addShape(pres.shapes.RECTANGLE, { x: ex, y, w: ew, h: rh, fill: { color: LGREY }, line: { color: LGREY } });
    s.addText(r[1], { x: ex + 0.1, y, w: ew - 0.2, h: rh, fontFace: F, fontSize: fs, color: DARK, valign: "middle", margin: 0.05, isTextBox: true });
    greyBox(s, kx, y, kw, rh, r[2], { fontSize: fs });
  });
}
const noAxis = { valAxisHidden: true, valGridLine: { style: "none" } };

// ---------- 1. Executive summary ----------
{
  const s = pres.addSlide();
  header(s, "01 | Executive Summary",
    "Benchmarks support Option 3: modernise L400 step by step, guided by four lenses",
    "HSBC is growing faster than its peers, and L400 carries the largest life book in Hong Kong. L400 servicing demand matches Sun Life, and most of its higher unit cost is change investment rather than inefficiency. Automation is not measured. That argues against a big-bang replacement and for continuous, targeted modernisation.");
  const rows = [
    ["Market: HSBC is the growth leader", "HSBC Life premium (DWP) grew 10.2% in 2024 against a peer average of 4.3%. L400 also runs Hang Seng Insurance: USD 12.2bn DWP, 24% of the top-8 market.", "L400 must keep pace with growth. Stability matters, so avoid a big-bang change."],
    ["IT cost: small platform, change-heavy", "L400 costs USD 9.9m (0.08% of DWP). 74% is change spend, external labour is 39% (peers 19%) and cloud is 0.1%.", "Money already goes into change. Steer it with the lenses and reduce vendor dependence."],
    ["PAS: same demand, gap is investment", "Servicing cases per policy match Sun Life (434 vs 443 per 1,000). 88% of the per-policy cost gap is change spend; on run cost alone L400 is 1.7×. Team cost per premium is in line with peers.", "The question isn't cost level but return on change spend. Set an STP baseline and track run cost per policy."],
    ["Outcome: premium scales, headcount too", "Premium is outgrowing L400 cost (+7.6pp) but not L400 headcount (−6.9pp). Premium per policy is high (USD 16.4k DWP).", "Scale through automation and segment-specific platforms, not more FTE."],
  ];
  const y0 = 2.2, rh = 1.02, c1 = 3.1, c2 = 5.3, c3 = W - 2 * M - c1 - c2 - 0.3;
  colHdr(s, [["Benchmark area", M, c1], ["What the data shows", M + c1 + 0.15, c2], ["So what for Option 3+", M + c1 + c2 + 0.3, c3]], y0 - 0.32);
  rows.forEach((r, i) => {
    const y = y0 + i * (rh + 0.12);
    redBox(s, M, y, c1, rh, r[0], { bold: true, fontSize: 12.5 });
    s.addShape(pres.shapes.RECTANGLE, { x: M + c1 + 0.15, y, w: c2, h: rh, fill: { color: LGREY }, line: { color: LGREY } });
    s.addText(r[1], { x: M + c1 + 0.25, y, w: c2 - 0.2, h: rh, fontFace: F, fontSize: 10.5, color: DARK, valign: "middle", margin: 0.05, isTextBox: true });
    greyBox(s, M + c1 + c2 + 0.3, y, c3, rh, r[2], { fontSize: 10.5 });
  });
  footer(s, SRC, 1);
  s.addNotes("Storyline: market context, then IT cost (headline and L400 structure), then PAS deep dive (productivity, unit cost, automation), then cost to business outcome, then the four Option 3+ lenses. Data gaps are in the appendix.");
}

// ---------- 2. Market context ----------
{
  const s = pres.addSlide();
  header(s, "02 | Market Context",
    "HSBC is outgrowing the Hong Kong market, and L400 carries the largest book",
    "HSBC Life grew 10.2% in 2024 and 8.3% a year since 2020, while AIA and Prudential shrank. With Hang Seng Insurance, L400 supports USD 12.2bn of premium, 24% of the top-8 market. The PAS has to support growth without disruption.");
  const labels = ["HSBC Life", "HSBC Group on L400", "AIA", "Prudential", "Manulife", "Top-8 market"];
  s.addChart(pres.charts.BAR, [
    { name: "DWP growth 2024 (YoY)", labels, values: [10.2, 21.9, 1.3, 5.2, 6.5, 10.3] },
    { name: "DWP CAGR 2020–24", labels, values: [8.3, 12.1, -4.8, -5.5, 3.6, -0.3] },
  ], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 7.0, h: 4.85, barDir: "col", barGrouping: "clustered", chartColors: [RED, MGREY],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", showTitle: true, title: "Direct written premium (DWP) growth, %",
    showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 10, barGapWidthPct: 60,
  }));
  const px = 7.9, pw = W - M - px, hw = (pw - 0.2) / 2;
  panelHeader(s, px, 1.95, pw, "DWP 2024 (USD bn) and share of top 8");
  stat(s, px + 0.05, 2.45, hw, "12.2", "HSBC Group on L400 (24% share, #1)");
  stat(s, px + hw + 0.25, 2.45, hw, "7.8", "HSBC Life alone (15% share, #3)");
  stat(s, px + 0.05, 3.7, hw, "11.3", "AIA (22% share)", "595959");
  stat(s, px + hw + 0.25, 3.7, hw, "8.8 / 6.8", "Prudential / Manulife (17% / 13%)", "595959");
  greyBox(s, px, 5.05, pw, 1.75, "Growth is steady rather than a rebound: HSBC's 2024 rate is close to its 4-year trend. Hang Seng Insurance grew 50% in 2024, which adds load to the same L400 platform.", { fontSize: 11 });
  footer(s, SRC + " Group on L400 = HSBC Life (International) + Hang Seng Insurance.", 2);
}

// ---------- 3. IT cost headline ----------
{
  const s = pres.addSlide();
  header(s, "03 | IT Cost – Headline",
    "Enterprise ICT cannot separate HSBC from peers; the L400 platform view can",
    "Projected ICT puts HSBC next to AIA, and every insurer grows ICT about 5% a year. But HSBC's figure is bank-level, so the HSBC Life share is unknown. The reliable view is the L400 platform: USD 9.9m, or 0.08% of the premium it supports.");
  s.addChart(pres.charts.BAR, [{ name: "ICT FY2025E (USD m)", labels: ["HSBC (bank-level)*", "AIA", "Prudential", "Manulife"], values: [2283, 1964, 1113, 161] }],
    Object.assign(axis(), noAxis, {
      x: M, y: 1.95, w: 6.4, h: 4.6, barDir: "col", chartColors: [RED, MGREY, MGREY, MGREY], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "#,##0", showTitle: true, title: "Total ICT spend, FY2025 projected (USD m)", showLegend: false, barGapWidthPct: 60,
    }));
  s.addText("*The Hongkong and Shanghai Banking Corp. ICT (bank entity), not HSBC Life. Projected from 2022 at 2021–22 growth (~5% p.a.).", { x: M, y: 6.55, w: 6.4, h: 0.4, fontFace: F, fontSize: 8.5, italic: true, color: GREY, margin: 0, isTextBox: true });
  const px = 7.3, pw = W - M - px, hw = (pw - 0.2) / 2;
  panelHeader(s, px, 1.95, pw, "Enterprise view – low comparability");
  stat(s, px + 0.05, 2.45, hw, "18.7%", "HSBC ICT ÷ DWP (bank ICT over life premium)", "595959");
  stat(s, px + hw + 0.25, 2.45, hw, "10.8%", "Peer average ICT ÷ DWP (market 4.1%)", "595959");
  panelHeader(s, px, 3.8, pw, "L400 platform view – usable");
  stat(s, px + 0.05, 4.3, hw, "9.9 → 11.3", "L400 cost, USD m, FY25 → LE26 (+14%)");
  stat(s, px + hw + 0.25, 4.3, hw, "0.08%", "L400 cost ÷ DWP (Sun Life PAS 0.91%)");
  greyBox(s, px, 5.55, pw, 1.2, "Use L400 cost and unit costs for the story. Enterprise ICT only confirms that HSBC is not under-investing.", { fontSize: 11 });
  footer(s, SRC + " Sun Life PAS cost is an operations cost, so the 0.91% is indicative.", 3);
}

// ---------- 4. L400 cost structure ----------
{
  const s = pres.addSlide();
  header(s, "04 | IT Cost – L400 Structure",
    "L400 spend is change-heavy and labour-led, with cloud only starting",
    "74% of L400 cost is change work, delivered by labour, and more than half of that labour is external. Infrastructure is a large share and cloud is almost zero. Continuous modernisation is already under way; the lenses decide where it goes.");
  const L = ["FY2025", "LE2026"];
  s.addChart(pres.charts.BAR, [
    { name: "Internal labour (change)", labels: L, values: [3.5, 4.1] },
    { name: "External labour (change)", labels: L, values: [3.8, 4.2] },
    { name: "Infrastructure (run)", labels: L, values: [1.6, 1.88] },
    { name: "Application & cloud (run)", labels: L, values: [0.96, 1.09] },
  ], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 5.0, h: 4.85, barDir: "col", barGrouping: "stacked", chartColors: ["7A0A1C", RED, "8C8C8C", "595959"],
    showValue: true, dataLabelPosition: "ctr", dataLabelFormatCode: "0.0", dataLabelColor: WHITE, showTitle: true, title: "L400 cost by component (USD m)",
    showLegend: true, legendPos: "r", legendFontFace: F, legendFontSize: 9.5, barGapWidthPct: 55,
  }));
  const tx = 5.8, tw = 3.4;
  panelHeader(s, tx, 1.95, tw, "L400 vs peer average");
  const rows = [["Metric", "L400", "Peers"], ["Run share", "26%", "73%"], ["External labour", "39%", "19%"], ["Infrastructure", "16%", "9%"], ["Cloud", "0.1%→1.6%", "17%*"]];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 1, color: i === 0 ? GREY : (j === 1 ? RED : DARK), align: j ? "right" : "left", fill: { color: i === 0 ? WHITE : LGREY } } }))),
    { x: tx, y: 2.45, w: tw, colW: [1.35, 1.2, 0.85], rowH: 0.42, fontFace: F, fontSize: 11, border: { type: "solid", pt: 2, color: WHITE }, valign: "middle" });
  s.addText("*Peer cloud = share of modernisation investment. Peer mix is enterprise-wide, L400 mix is platform-only: directional.", { x: tx, y: 4.65, w: tw, h: 0.6, fontFace: F, fontSize: 8.5, italic: true, color: GREY, margin: 0, isTextBox: true });
  const cx = 9.5, cw = W - M - cx;
  card(s, cx, 1.95, cw, 1.5, "Change-heavy", "Run is 26% against 73% for peers. New builds must be modular so they do not become future run cost.");
  card(s, cx, 3.6, cw, 1.5, "Vendor reliance", "External labour is USD 3.8m → 4.2m, incl. a DXC SOW of USD 3.2m. This is the resilience lens.");
  card(s, cx, 5.25, cw, 1.55, "Cloud from a near-zero base", "Cloud grows from USD 10k to 178k. Infrastructure (USD 1.9m) is where acceleration can free cost.", true);
  footer(s, SRC + " L400 cost = labour view (internal + external labour + RTB).", 4);
}

// ---------- 5. PAS like-for-like unit cost ----------
{
  const s = pres.addSlide();
  header(s, "05 | PAS Deep Dive – Like-for-like Cost to Serve",
    "Servicing demand matches Sun Life; the cost gap is mostly change investment",
    "HSBC and Sun Life get almost the same number of servicing cases per policy (434 vs 443 per 1,000). So demand doesn't explain the gap. 88% of the per-policy gap is change spend. On run cost alone, L400 costs 1.7× Sun Life: about USD 1.0m a year.");
  s.addChart(pres.charts.BAR, [
    { name: "Run (RTB)", labels: ["HSBC L400 FY25", "Sun Life HK"], values: [3.43, 2.07] },
    { name: "Change (CTB)", labels: ["HSBC L400 FY25", "Sun Life HK"], values: [9.81, 0] },
  ], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 4.6, h: 4.85, barDir: "col", barGrouping: "stacked", chartColors: [RED, "BFBFBF"],
    showValue: true, dataLabelPosition: "ctr", dataLabelFormatCode: "0.0;;;", dataLabelColor: DARK, showTitle: true, title: "PAS cost per in-force policy (USD / year)",
    showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 10, barGapWidthPct: 60,
  }));
  const tx = 5.35, tw = W - M - tx;
  panelHeader(s, tx, 1.95, tw, "Like-for-like comparison, FY2025");
  const rows = [
    ["Metric", "HSBC", "Sun Life", "Read-across", "Basis"],
    ["Servicing cases per 1,000 policies", "434", "443", "In line", "High"],
    ["Cost per cancellation (USD)", "233", "234", "In line", "High"],
    ["Run cost per in-force policy (USD)", "3.4", "2.1", "1.7×", "Medium"],
    ["Run cost per servicing case (USD)", "7.9", "4.7", "1.7×", "Medium"],
    ["Total cost per in-force policy (USD)", "13.2", "2.1", "6.4×", "Low"],
    ["Share of per-policy gap from change", "88%", "–", "Investment", "Derived"],
  ];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 3, color: i === 0 ? GREY : (j === 3 ? RED : DARK), align: j ? "right" : "left", fill: { color: i === 0 ? WHITE : LGREY } } }))),
    { x: tx, y: 2.45, w: tw, colW: [3.0, 0.85, 0.95, 1.15, tw - 5.95], rowH: 0.42, fontFace: F, fontSize: 10.5, border: { type: "solid", pt: 2, color: WHITE }, valign: "middle" });
  card(s, tx, 5.55, (tw - 0.2) / 2, 1.25, "Why this matters", "The headline \"6.5× costlier\" is mostly money going into change, not waste in running the platform.");
  card(s, tx + (tw - 0.2) / 2 + 0.2, 5.55, (tw - 0.2) / 2, 1.25, "So what for Option 3", "The question isn't cost level but whether USD 7.3m of change a year delivers outcomes. Tie it to KPIs.", true);
  footer(s, SRC + " Run = L400 RTB (application, infrastructure, cloud). Sun Life = PAS operations cost; its in-force is an estimate. Sun Life change spend not reported.", 5);
}

// ---------- 6. PAS team economics & outside-in peer cost ----------
{
  const s = pres.addSlide();
  header(s, "06 | PAS Deep Dive – Team Economics vs Peers",
    "Per premium dollar, the L400 team is as lean as AIA, Prudential and Manulife",
    "No peer publishes PAS cost, so we built an outside-in estimate: peer PAS FTE × HSBC's loaded cost per FTE. On that basis, PAS labour costs about 0.06–0.07% of premium at every insurer. HSBC's edge is scale. The risk is that LE26 hiring (+29%) erodes it.");
  s.addChart(pres.charts.BAR, [{ name: "Implied PAS labour cost (USD m)", labels: ["HSBC L400 (actual)", "AIA (est.)", "Prudential (est.)", "Manulife (est.)"], values: [7.3, 7.19, 6.08, 4.42] }],
    Object.assign(axis(), noAxis, {
      x: M, y: 1.95, w: 4.3, h: 3.3, barDir: "col", chartColors: [RED, MGREY, MGREY, MGREY], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "0.0", showTitle: true, title: "PAS labour cost, USD m", showLegend: false, barGapWidthPct: 55,
    }));
  s.addChart(pres.charts.BAR, [{ name: "DWP per PAS FTE (USD m)", labels: ["HSBC FY25", "HSBC LE26", "AIA", "Manulife", "Prudential"], values: [185, 144, 174, 170, 160] }],
    Object.assign(axis(), noAxis, {
      x: 4.95, y: 1.95, w: 4.3, h: 3.3, barDir: "col", chartColors: [RED, "7A0A1C", MGREY, MGREY, MGREY], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "0", showTitle: true, title: "Premium (DWP) per PAS FTE, USD m", showLegend: false, barGapWidthPct: 55,
    }));
  const rows = [
    ["", "HSBC", "AIA", "Pru", "Manulife"],
    ["PAS FTE", "66", "55–75", "50–60", "35–45"],
    ["DWP 2024, USD bn", "12.2", "11.3", "8.8", "6.8"],
    ["PAS labour ÷ DWP", "0.060%", "0.064%", "0.069%", "0.065%"],
    ["Est. range, USD m", "7.3", "6.1–8.3", "5.5–6.6", "3.9–5.0"],
  ];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 1, color: i === 0 ? GREY : (j === 1 ? RED : DARK), align: j ? "right" : "left", fill: { color: i === 0 ? WHITE : LGREY } } }))),
    { x: M, y: 5.35, w: 8.75, colW: [2.35, 1.6, 1.6, 1.6, 1.6], rowH: 0.29, fontFace: F, fontSize: 10, border: { type: "solid", pt: 1.5, color: WHITE }, valign: "middle" });
  const px = 9.55, pw = W - M - px;
  card(s, px, 1.95, pw, 1.55, "Method (say it upfront)", "Peer cost = PAS FTE range × HSBC loaded labour cost (USD 111k per FTE). Directional, not reported.");
  card(s, px, 3.65, pw, 1.5, "Scale advantage", "L400 serves USD 12.2bn of premium, more than any single peer, with a similar-sized team.");
  card(s, px, 5.3, pw, 1.5, "Watch-out", "FTE 66 → 85 drops premium per FTE from 185 to 144, below every peer. Growth should come from automation.", true);
  footer(s, SRC + " HSBC FTE = L400 IT FTE; peer PAS FTE = competitor PAS metric range midpoints. Estimates assume peer cost per FTE ≈ HSBC.", 6);
}

// ---------- 7. PAS cost drivers & trend ----------
{
  const s = pres.addSlide();
  header(s, "07 | PAS Deep Dive – Cost Drivers & Trend",
    "Run cost per policy is rising, because cloud is added on top of infrastructure",
    "In LE26, run cost per policy rises 12% while the book grows 4%. Cloud goes from USD 10k to 178k, but infrastructure still grows 18%, so the old estate isn't being retired yet. Change spend is moving from the DXC SOW to development done internally and by contractors.");
  s.addChart(pres.charts.BAR, [{
    name: "Change LE26 vs FY25", labels: ["Cloud", "In-house / contractor dev", "Infrastructure", "Internal labour", "Run cost per policy", "Change cost per product", "External labour", "In-force policies", "Application run", "DXC SOW"],
    values: [1680, 38.1, 17.6, 17.1, 11.7, 18.5, 10.5, 3.9, -4.2, -18.1],
  }], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 6.2, h: 4.85, barDir: "bar", catAxisOrientation: "maxMin", chartColors: ["404040", RED, "404040", RED, "7A0A1C", "7A0A1C", RED, MGREY, "404040", RED],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0\"%\"", showTitle: true, title: "Change LE2026 vs FY2025 (%)", showLegend: false, barGapWidthPct: 40,
    valAxisMaxVal: 60, valAxisMinVal: -25, catAxisLabelPos: "low",
  }));
  s.addText("Cloud +1,680% is off a USD 10k base and runs past the axis.", { x: M, y: 6.8, w: 6.2, h: 0.2, fontFace: F, fontSize: 8.5, italic: true, color: GREY, margin: 0, isTextBox: true });
  const px = 7.1, pw = W - M - px, hw = (pw - 0.2) / 2;
  panelHeader(s, px, 1.95, pw, "Unit-cost trend, FY25 → LE26");
  stat(s, px + 0.05, 2.45, hw, "3.4 → 3.8", "Run cost per in-force policy (USD)");
  stat(s, px + hw + 0.25, 2.45, hw, "306k → 363k", "Change spend per product (USD); 24 → 23 products");
  const cw = (pw - 0.2) / 2;
  card(s, px, 3.8, cw, 1.45, "Dual running", "Cloud is added while infrastructure still grows. The saving only comes when on-premise capacity is retired.");
  card(s, px + cw + 0.2, 3.8, cw, 1.45, "Sourcing shift", "The DXC SOW falls 18%, but contractors keep total external labour rising 11%.");
  redBox(s, px, 5.4, pw, 1.4, "Implication: set a decommissioning target for each cloud step, and an in-sourcing target, so modernisation lowers run cost per policy instead of adding to it.", { fontSize: 11.5, bold: true });
  footer(s, SRC + " Method 1 cost table for DXC SOW and in-house development; labour view for internal/external labour.", 7);
}

// ---------- 8. Automation & digital ----------
{
  const s = pres.addSlide();
  header(s, "08 | PAS Deep Dive – Automation Headroom",
    "L400 already automates batch processing; the manual work sits in 323k cases",
    "99.5% of L400's 68.6m transactions are system-generated. The work people touch is the 323k servicing cases a year, and HSBC doesn't measure how many of those go straight through. Moving from Sun Life's 14% STP to the 30–70% market range takes 53k–182k cases out of manual handling.");
  const L = ["Sun Life level (13.7%)", "Market low (30%)", "Market mid (50%)", "AIA-like (70%)"];
  s.addChart(pres.charts.BAR, [
    { name: "Straight-through", labels: L, values: [44, 97, 162, 226] },
    { name: "Manual", labels: L, values: [279, 226, 162, 97] },
  ], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 5.6, h: 4.3, barDir: "bar", barGrouping: "stacked", catAxisOrientation: "maxMin", chartColors: [RED, "BFBFBF"],
    showValue: true, dataLabelPosition: "ctr", dataLabelFormatCode: "0\"k\"", dataLabelColor: DARK, showTitle: true, title: "HSBC servicing cases by STP scenario ('000, FY25 volume)",
    showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 10, barGapWidthPct: 45,
  }));
  greyBox(s, M, 6.3, 5.6, 0.5, "Digital submissions +22% vs all submissions +3.7% in LE26.", { fontSize: 10.5 });
  const tx = 6.4, tw = W - M - tx;
  const na = "Not measured";
  const rows = [
    ["Indicator", "HSBC", "AIA", "Pru", "Manulife", "Market"],
    ["STP rate", na, ">70%", ">50%", ">10%", "30–70%"],
    ["Digital submission rate", "19.6%", "–", "–", "–", "30–70%"],
    ["Digital services enabled", na, ">80%", ">80%", ">50%", "30–70%"],
    ["Cloud share (modernisation)", "1.6%*", "17%", "17%", "16%", "–"],
    ["PAS maturity", "Est. L1–2", "Level 3", "Level 2", "Level 2", "–"],
  ];
  panelHeader(s, tx, 1.95, tw, "PAS maturity indicators");
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 1, color: i === 0 ? GREY : (j === 1 ? RED : DARK), align: j ? "center" : "left", fill: { color: i === 0 ? WHITE : LGREY } } }))),
    { x: tx, y: 2.45, w: tw, colW: [2.05, 1.15, 0.75, 0.75, 0.9, tw - 5.6], rowH: 0.42, fontFace: F, fontSize: 10, border: { type: "solid", pt: 2, color: WHITE }, valign: "middle" });
  s.addText("*HSBC = cloud share of L400 cost, LE26. HSBC maturity is an indicative team view, to be validated.", { x: tx, y: 5.0, w: tw, h: 0.35, fontFace: F, fontSize: 8.5, italic: true, color: GREY, margin: 0, isTextBox: true });
  redBox(s, tx, 5.5, tw, 1.3, "Implication: tag each of the 323k cases as automatic or manual, by case type and segment. That gives the STP baseline and shows which journeys to automate first.", { fontSize: 11.5, bold: true });
  footer(s, SRC + " STP scenarios apply rates to FY25 servicing cases (323,274). Peer figures are lower bounds from competitor PAS reference.", 8);
}

// ---------- 9. PAS KPI scorecard ----------
{
  const s = pres.addSlide();
  header(s, "09 | PAS Benchmark KPI Set",
    "Nine PAS KPIs to benchmark now and track through Option 3+",
    "Every KPI has an HSBC value today, a comparator we can defend, and a direction under Option 3+. Blanks show where HSBC needs to start measuring. These become the scorecard for each modernisation step.");
  const rows = [
    ["KPI", "Definition", "HSBC FY25", "Best comparator", "Option 3+ direction", "Lens"],
    ["Run cost per in-force policy", "L400 RTB ÷ in-force policies", "USD 3.4", "Sun Life USD 2.1", "Down to ~2.5", "Technology"],
    ["Run cost per servicing case", "L400 RTB ÷ servicing cases", "USD 7.9", "Sun Life USD 4.7", "Down", "Technology"],
    ["Servicing intensity", "Cases per 1,000 policies", "434", "Sun Life 443", "Track by segment", "HNW vs mass"],
    ["STP rate", "Auto cases ÷ servicing cases", "Not measured", "Market 30–70%", "Baseline, then up", "Technology"],
    ["Digital submission rate", "Digital ÷ total submissions", "16.7%", "Market 30–70%", "Up", "Business value"],
    ["Premium per PAS FTE", "DWP ÷ PAS FTE", "USD 185m", "Peers USD 160–174m", "Hold ≥ peers", "Business value"],
    ["PAS labour ÷ premium", "PAS labour ÷ DWP", "0.060%", "Peers ~0.064–0.069% (est.)", "Hold", "Business value"],
    ["External labour share", "External labour ÷ L400 cost", "39%", "Peers 15–26%", "Down", "Resilience"],
    ["Cloud share / infra retired", "Cloud ÷ L400; infra decommissioned", "0.1%", "Peers 16–17%", "Up, with infra down", "Resilience"],
  ];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 0, color: i === 0 ? WHITE : (j === 2 ? RED : DARK), fill: { color: i === 0 ? RED : (i % 2 ? LGREY : "F7F7F7") }, align: "left" } }))),
    { x: M, y: 1.95, w: W - 2 * M, colW: [2.45, 2.75, 1.35, 2.3, 1.8, W - 2 * M - 10.65], rowH: 0.47, fontFace: F, fontSize: 10.5, border: { type: "solid", pt: 1.5, color: WHITE }, valign: "middle" });
  footer(s, SRC + " Peer labour ÷ premium is an outside-in estimate (slide 6). Sun Life cost basis is PAS operations cost.", 9);
}

// ---------- 7. Cost -> business outcome ----------
{
  const s = pres.addSlide();
  header(s, "10 | Linking Cost to Business Outcome",
    "Premium is outgrowing L400 cost but not L400 headcount",
    "Business growth is value-led: new business premium +33% while policies grow 3.9%. L400 cost grows slower than premium, which is healthy. Headcount grows faster, which is not. Growth has to scale through automation rather than people.");
  s.addChart(pres.charts.BAR, [{
    name: "Growth LE26 vs FY25", labels: ["New business premium", "L400 IT FTE", "Digital submissions", "Digital sales", "New policies", "L400 cost", "In-force policies", "Total submissions", "Active customers"],
    values: [33.3, 28.8, 22.2, 21.8, 19.5, 14.3, 3.9, 3.7, 3.0],
  }], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 6.6, h: 4.85, barDir: "bar", catAxisOrientation: "maxMin", chartColors: [RED, "404040", RED, RED, RED, "404040", RED, RED, RED],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", showTitle: true, title: "Growth, LE2026 vs FY2025 (%)", showLegend: false, barGapWidthPct: 40,
  }));
  const px = 7.5, pw = W - M - px, hw = (pw - 0.2) / 2;
  panelHeader(s, px, 1.95, pw, "Jaws: premium growth minus cost growth");
  stat(s, px + 0.05, 2.45, hw, "+7.6pp", "Premium vs L400 cost: platform cost scales well");
  stat(s, px + hw + 0.25, 2.45, hw, "−6.9pp", "Premium vs L400 FTE: headcount outpaces premium", "404040");
  panelHeader(s, px, 3.8, pw, "Where cost should follow value");
  bullets(s, [
    "HNW: premium per policy is high, so invest in capability and service quality.",
    "Mass market: volume is flat, so invest in digital and STP to cut cost to serve.",
    "Servicing: 323k cases a year; automate the highest-volume changes first.",
  ], px, 4.3, pw, 1.45, 11.5, 10);
  greyBox(s, px, 6.05, pw, 0.75, "Red bars: business volume and value. Dark bars: L400 cost and capacity.", { fontSize: 10.5 });
  footer(s, SRC + " Jaws use 2024 DWP growth against LE26 vs FY25 cost/FTE growth (cross-year, directional).", 10);
}

// ---------- 8. Option 3+ lenses ----------
{
  const s = pres.addSlide();
  header(s, "11 | Benchmark Implications for Option 3+",
    "Each Option 3+ lens is backed by a benchmark signal and a KPI to track",
    "No benchmark justifies a big-bang L400 replacement. Each benchmark points to where the four lenses should direct continuous modernisation, and gives a KPI to track it.");
  lensTable(s, [
    ["1. Geo-political resilience", "External labour is 39% of L400 spend against 19% for peers, incl. a USD 3.2m DXC SOW. Cloud is growing from almost zero.", "Vendor concentration limits, portable cloud choices, and in-house L400 skills. KPI: external labour share."],
    ["2. Business value", "L400 is 0.08% of DWP and grows slower than premium (+7.6pp). HSBC grows 10.2% against 4.3% for peers.", "Fund changes that protect growth: servicing, digital submission, data. KPIs: L400 cost ÷ DWP; jaws."],
    ["3. Technology acceleration", "Run cost per policy is 1.7× Sun Life and rising 12% as cloud is added on top of infrastructure. STP is not measured, against 30–70% in the market.", "Retire infrastructure with each cloud step, automate the 323k servicing cases, and set an STP baseline. KPIs: STP %, run cost per policy."],
    ["4. HNW vs mass-market", "Premium per policy is USD 16.4k. New business premium +33% while policies +3.9%. Digital submission is 20% against 30–70%.", "Tailored HNW capability, and a digital, high-STP path for mass market. KPI: cost to serve by segment."],
  ], ["Strategic lens", "Benchmark evidence", "What Option 3+ should do and track"], 1.95, 1.12, 10.5);
  footer(s, SRC, 11);
}

// ---------- 9. Appendix: data gaps ----------
{
  const s = pres.addSlide();
  header(s, "Appendix | Data Quality & Next Steps",
    "Six data gaps to close before the business case is final",
    "The direction holds: strong growth, a lean but labour-heavy L400, and no automation baseline. Ratios built on enterprise ICT, FTE and PAS cost need like-for-like data before they go to the client.");
  const lw = 7.3;
  panelHeader(s, M, 1.95, lw, "Data gaps identified");
  const gaps = [
    [{ text: "IT spend perimeter: ", options: { bold: true } }, { text: "HSBC ICT (USD 2.3bn) is bank-level. The HSBC Life share is unknown." }],
    [{ text: "Premium basis: ", options: { bold: true } }, { text: "reported premium is new business only (0.56× DWP). Use DWP for ratios." }],
    [{ text: "FTE definition: ", options: { bold: true } }, { text: "HSBC 66/85 are L400 IT FTE; peers report PAS operations FTE." }],
    [{ text: "PAS cost perimeter: ", options: { bold: true } }, { text: "HSBC = L400 IT platform cost; Sun Life = PAS operations cost." }],
    [{ text: "Automation: ", options: { bold: true } }, { text: "no STP, no automatic/manual split of 68.6m transactions, no operations cost." }],
    [{ text: "Cost mix: ", options: { bold: true } }, { text: "labour, run/change and technology shares are L400-only; peers are enterprise-wide." }],
  ];
  s.addShape(pres.shapes.RECTANGLE, { x: M, y: 2.33, w: lw, h: 4.45, fill: { color: LGREY }, line: { color: LGREY } });
  bullets(s, gaps, M + 0.15, 2.55, lw - 0.3, 4.15, 13, 17);
  const px = M + lw + 0.3, pw = W - M - px;
  panelHeader(s, px, 1.95, pw, "Proposed next steps");
  [["1", "Obtain HSBC Life's share of ICT and its operations cost"], ["2", "Split L400 transactions into automatic and manual to set an STP baseline"], ["3", "Align FTE definitions (IT vs PAS operations) with peers"], ["4", "Set Option 3+ KPI targets for each lens and link them to the roadmap"]].forEach((st, i) => {
    const y = 2.45 + i * 1.08;
    s.addShape(pres.shapes.OVAL, { x: px, y: y + 0.1, w: 0.6, h: 0.6, fill: { color: RED }, line: { color: RED } });
    s.addText(st[0], { x: px, y: y + 0.1, w: 0.6, h: 0.6, fontFace: F, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(st[1], { x: px + 0.75, y, w: pw - 0.75, h: 0.8, fontFace: F, fontSize: 11.5, color: DARK, valign: "middle", margin: 0, isTextBox: true });
  });
  footer(s, SRC, 12);
}

pres.writeFile({ fileName: "hsbc_life_benchmark.pptx" }).then(f => console.log("wrote", f));
