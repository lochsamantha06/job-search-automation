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
    "HSBC is growing faster than its peers, and L400 carries the largest life book in Hong Kong. L400 is cheap relative to premium but expensive per servicing case, and automation is not measured. That argues against a big-bang replacement and for continuous, targeted modernisation.");
  const rows = [
    ["Market: HSBC is the growth leader", "HSBC Life premium (DWP) grew 10.2% in 2024 against a peer average of 4.3%. L400 also runs Hang Seng Insurance: USD 12.2bn DWP, 24% of the top-8 market.", "L400 must keep pace with growth. Stability matters, so avoid a big-bang change."],
    ["IT cost: small platform, change-heavy", "L400 costs USD 9.9m (0.08% of DWP). 74% is change spend, external labour is 39% (peers 19%) and cloud is 0.1%.", "Money already goes into change. Steer it with the lenses and reduce vendor dependence."],
    ["PAS: lean per premium, costly per case", "DWP per PAS FTE is USD 185m against a peer average of 168m. PAS cost per servicing case is 6.5× Sun Life. STP is not measured; peers report >10% to >70%.", "Automation is the main lever. Set an STP baseline first."],
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

// ---------- 5. PAS productivity & unit cost ----------
{
  const s = pres.addSlide();
  header(s, "05 | PAS Deep Dive – Productivity & Unit Cost",
    "L400 looks lean per premium but costly per servicing case",
    "Per unit of premium, the L400 team is as productive as peers, and platform cost is a fraction of Sun Life's. Per servicing case it costs 6.5× more. The reason is the book: fewer, high-value policies. Cost targets should be set per segment, not with one ratio.");
  s.addChart(pres.charts.BAR, [{ name: "DWP per PAS FTE (USD m)", labels: ["HSBC FY25", "HSBC LE26", "AIA", "Manulife", "Prudential"], values: [185, 144, 174, 170, 160] }],
    Object.assign(axis(), noAxis, {
      x: M, y: 1.95, w: 5.2, h: 3.5, barDir: "col", chartColors: [RED, RED, MGREY, MGREY, MGREY], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "0", showTitle: true, title: "DWP per PAS FTE (USD m)", showLegend: false, barGapWidthPct: 55,
    }));
  greyBox(s, M, 5.6, 5.2, 1.2, "L400 IT FTE rises from 66 to 85 (+29%) in LE26, so premium per FTE drops below all peers. Peers run 40–65 PAS FTE.", { fontSize: 11 });
  const tx = 6.0, tw = W - M - tx;
  panelHeader(s, tx, 1.95, tw, "PAS unit cost: HSBC FY2025 vs Sun Life");
  const rows = [
    ["Metric", "HSBC", "Sun Life", "Gap", "Comparability"],
    ["Servicing cases (#)", "323k", "318k", "In line", "High"],
    ["PAS cost ÷ DWP", "0.08%", "0.91%", "−91%", "Medium"],
    ["PAS cost per servicing case (USD)", "30.5", "4.7", "6.5×", "Low"],
    ["PAS cost per in-force policy (USD)", "13.2", "2.1", "6.4×", "Low"],
    ["PAS cost per cancellation (USD)", "233", "234", "In line", "High"],
    ["DWP per in-force policy (USD)", "16.4k", "0.2k", "72×", "Low"],
  ];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 3, color: i === 0 ? GREY : (j === 3 ? RED : DARK), align: j ? "right" : "left", fill: { color: i === 0 ? WHITE : LGREY } } }))),
    { x: tx, y: 2.45, w: tw, colW: [2.75, 0.9, 0.95, 0.9, tw - 5.5], rowH: 0.45, fontFace: F, fontSize: 11, border: { type: "solid", pt: 2, color: WHITE }, valign: "middle" });
  redBox(s, tx, 5.85, tw, 0.95, "Implication: judge L400 by cost to serve per segment. A mass-market policy and an HNW policy should not share one unit-cost target.", { fontSize: 11.5, bold: true });
  footer(s, SRC + " HSBC PAS cost = L400 IT platform; Sun Life = PAS operations cost. HSBC FTE = L400 IT FTE; peers = PAS FTE range midpoints.", 5);
}

// ---------- 6. Automation & digital ----------
{
  const s = pres.addSlide();
  header(s, "06 | PAS Deep Dive – Automation & Digital",
    "Automation is the biggest gap, and HSBC cannot yet measure it",
    "Peers report STP of more than 10% to more than 70%, and 50–80% of services digitally enabled. HSBC has no STP, self-service or PAS maturity measure, and cannot split its 68.6m L400 transactions into automatic and manual. Digital submissions are growing fast, but from a low base.");
  s.addChart(pres.charts.BAR, [{ name: "STP rate", labels: ["HSBC (not measured)", "Sun Life", "Manulife (>)", "Prudential (>)", "AIA (>)"], values: [0, 13.7, 10, 50, 70] }],
    Object.assign(axis(), noAxis, {
      x: M, y: 1.95, w: 4.9, h: 3.6, barDir: "bar", catAxisOrientation: "maxMin", chartColors: [RED, MGREY, MGREY, MGREY, MGREY], showValue: true,
      dataLabelPosition: "outEnd", dataLabelFormatCode: "0\"%\"", showTitle: true, title: "Straight-through processing (STP) rate", showLegend: false, barGapWidthPct: 45,
    }));
  s.addText("Peer values are lower bounds. Market range is 30–70%.", { x: M, y: 5.55, w: 4.9, h: 0.3, fontFace: F, fontSize: 9, italic: true, color: GREY, margin: 0, isTextBox: true });
  greyBox(s, M, 5.95, 4.9, 0.85, "Digital submissions +22% vs all submissions +3.7% (LE26).", { fontSize: 11 });
  const tx = 5.7, tw = W - M - tx;
  const na = "Not measured";
  const rows = [
    ["Metric", "HSBC", "Sun Life", "AIA", "Pru", "Manulife", "Market"],
    ["STP rate", na, "13.7%", ">70%", ">50%", ">10%", "30–70%"],
    ["Digital submission rate", "16.7% → 19.6%", "15%", "–", "–", "–", "30–70%"],
    ["Digital services enabled", na, "16%", ">80%", ">80%", ">50%", "30–70%"],
    ["Digital self-servicing", na, "–", ">80%", ">60%", "–", "–"],
    ["PAS maturity", na, "–", "Level 3", "Level 2", "Level 2", "–"],
  ];
  panelHeader(s, tx, 1.95, tw, "Automation and digital scorecard");
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 1, color: i === 0 ? GREY : (j === 1 ? RED : DARK), align: j ? "center" : "left", fill: { color: i === 0 ? WHITE : LGREY } } }))),
    { x: tx, y: 2.45, w: tw, colW: [1.75, 1.3, 0.75, 0.7, 0.7, 0.8, tw - 6.0], rowH: 0.42, fontFace: F, fontSize: 10, border: { type: "solid", pt: 2, color: WHITE }, valign: "middle" });
  redBox(s, tx, 5.75, tw, 1.05, "Implication: make an STP baseline the first Option 3 deliverable. Without it, the value of any modernisation step cannot be shown.", { fontSize: 11.5, bold: true });
  footer(s, SRC + " Peer PAS metrics from competitor PAS reference.", 6);
}

// ---------- 7. Cost -> business outcome ----------
{
  const s = pres.addSlide();
  header(s, "07 | Linking Cost to Business Outcome",
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
  footer(s, SRC + " Jaws use 2024 DWP growth against LE26 vs FY25 cost/FTE growth (cross-year, directional).", 7);
}

// ---------- 8. Option 3+ lenses ----------
{
  const s = pres.addSlide();
  header(s, "08 | Benchmark Implications for Option 3+",
    "Each Option 3+ lens is backed by a benchmark signal and a KPI to track",
    "No benchmark justifies a big-bang L400 replacement. Each benchmark points to where the four lenses should direct continuous modernisation, and gives a KPI to track it.");
  lensTable(s, [
    ["1. Geo-political resilience", "External labour is 39% of L400 spend against 19% for peers, incl. a USD 3.2m DXC SOW. Cloud is growing from almost zero.", "Vendor concentration limits, portable cloud choices, and in-house L400 skills. KPI: external labour share."],
    ["2. Business value", "L400 is 0.08% of DWP and grows slower than premium (+7.6pp). HSBC grows 10.2% against 4.3% for peers.", "Fund changes that protect growth: servicing, digital submission, data. KPIs: L400 cost ÷ DWP; jaws."],
    ["3. Technology acceleration", "STP not measured against 30–70% in the market. 74% of L400 spend is change, mostly labour. Infrastructure is 16% against 9% for peers.", "Modular re-platforming, automation of high-volume servicing, STP baseline. KPIs: STP %, cost per servicing case."],
    ["4. HNW vs mass-market", "Premium per policy is USD 16.4k. New business premium +33% while policies +3.9%. Digital submission is 20% against 30–70%.", "Tailored HNW capability, and a digital, high-STP path for mass market. KPI: cost to serve by segment."],
  ], ["Strategic lens", "Benchmark evidence", "What Option 3+ should do and track"], 1.95, 1.12, 10.5);
  footer(s, SRC, 8);
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
  footer(s, SRC, 9);
}

pres.writeFile({ fileName: "hsbc_life_benchmark.pptx" }).then(f => console.log("wrote", f));
