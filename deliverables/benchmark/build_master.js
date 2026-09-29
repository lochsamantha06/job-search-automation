const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "HSBC Life – IT Cost & PAS Benchmark";

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

const SRC = "Source: HSBC Life PAS L400 benchmarking workbook, 'Master Benchmark' tab. HSBC FY2025 actual / LE2026. Sun Life HK 2023e actuals; Manulife HK = estimate from Sun Life cost drivers. USD.";
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
const tbl = (rows, hiCol, opts) => rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === hiCol, color: i === 0 ? GREY : (j === hiCol ? RED : DARK), align: j ? "right" : "left", fill: { color: i === 0 ? WHITE : LGREY } } })));
const tblOpts = (x, y, w, colW, rowH, fs) => ({ x, y, w, colW, rowH, fontFace: F, fontSize: fs, border: { type: "solid", pt: 2, color: WHITE }, valign: "middle" });

// ---------- 1. Executive summary ----------
{
  const s = pres.addSlide();
  header(s, "01 | Executive Summary",
    "Benchmarks support Option 3: modernise L400 continuously, sharpened by four lenses",
    "L400 runs HK's largest, fastest-growing life book. Its unit cost is 5–10× peers per policy, but only 1.3× per premium dollar, and the gap is low volume per head, not expensive people. That argues for continuous, automation-led modernisation, not a big bang.");
  const rows = [
    ["Market: largest book, fastest growth", "L400 (HSBC Life + Hang Seng Insurance) holds 24% of top-8 DWP. HSBC Life DWP +10.2% in 2024 vs peers +4.3%. Premium per policy USD 9.2k vs USD 2.5–3.1k at peers.", "L400 must absorb growth without cost growing in line. Stability rules out big-bang change."],
    ["IT cost: L400 is in build mode", "L400 costs USD 9.9m → 11.3m. 74% is change spend vs 27% at peers. External labour 39% vs 19%. Cloud 0.1% vs ~17%.", "Money is already going into change. The lenses decide where it goes and when it tapers."],
    ["PAS: costly per unit, not per person", "USD 13.25 per policy vs USD 2.75 (Sun Life) and 2.56 (Manulife est.). Cost per FTE is close (149k vs 114–123k), but each FTE serves 11k policies vs 42–48k.", "The lever is automation and scale per head, not cutting people or replacing the platform."],
    ["Outcome: a ~USD 3m a year prize", "Sun Life targets a 26% PA cost saving by 2026 while its book grows. HSBC's L400 cost per policy is rising 10%. At Sun Life's rate, L400 saves USD 2.6–2.9m a year.", "Continuous modernisation pays for itself. Track it with per-policy and per-premium KPIs."],
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
  s.addNotes("Storyline: market (why L400 matters) → IT cost (where the money goes) → PAS unit cost and productivity (the gap and its cause) → automation (how peers close it) → cost to business outcome (the prize) → Option 3+ with the four lenses.");
}

// ---------- 2. Market & book ----------
{
  const s = pres.addSlide();
  header(s, "02 | Market Context",
    "L400 runs the largest, fastest-growing and highest-value book in the market",
    "With Hang Seng Insurance, L400 carries 24% of top-8 DWP, more than AIA. HSBC Life grew 10.2% in 2024 while AIA and Prudential shrank over 2020–24. Each HSBC policy carries 3–4× the premium of a Sun Life or Manulife policy. The platform must grow with the business without disruption.");
  const labels = ["HSBC Life", "AIA", "Prudential", "Manulife"];
  s.addChart(pres.charts.BAR, [
    { name: "DWP growth 2024", labels, values: [10.2, 1.3, 5.2, 6.5] },
    { name: "DWP CAGR 2020–24", labels, values: [8.3, -4.8, -5.5, 3.6] },
  ], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 5.2, h: 4.85, barDir: "col", barGrouping: "clustered", chartColors: [RED, MGREY],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", showTitle: true, title: "Direct written premium (DWP) growth, %",
    showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 10, barGapWidthPct: 60,
  }));
  s.addChart(pres.charts.BAR, [{ name: "Premium per in-force policy", labels: ["HSBC Life", "Manulife HK", "Sun Life HK"], values: [9159, 3095, 2549] }],
    Object.assign(axis(), noAxis, {
      x: 5.9, y: 1.95, w: 3.6, h: 3.3, barDir: "col", chartColors: [RED, MGREY, MGREY], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "#,##0", showTitle: true, title: "Premium per in-force policy (USD)", showLegend: false, barGapWidthPct: 55,
    }));
  s.addText("HSBC premium = new business premium only, so its figure is understated.", { x: 5.9, y: 5.25, w: 3.6, h: 0.35, fontFace: F, fontSize: 8.5, italic: true, color: GREY, margin: 0, isTextBox: true });
  greyBox(s, 5.9, 5.7, 3.6, 1.1, "New business is 11% of the in-force book a year vs 5.5% (Sun Life) and 2.9% (Manulife).", { fontSize: 10.5 });
  const px = 9.8, pw = W - M - px;
  panelHeader(s, px, 1.95, pw, "Share of top-8 DWP, 2024");
  stat(s, px + 0.05, 2.45, pw - 0.1, "24.1%", "HSBC Group on L400 (#1)");
  stat(s, px + 0.05, 3.6, pw - 0.1, "22.3%", "AIA", "595959");
  stat(s, px + 0.05, 4.75, pw - 0.1, "17.4% / 13.4%", "Prudential / Manulife", "595959");
  s.addText("HSBC Life alone: 15.5%", { x: px + 0.05, y: 5.95, w: pw - 0.1, h: 0.4, fontFace: F, fontSize: 11, color: DARK, margin: 0, isTextBox: true });
  footer(s, SRC + " DWP = HK direct written premium 2024. Group on L400 = HSBC Life + Hang Seng Insurance.", 2);
}

// ---------- 3. IT cost ----------
{
  const s = pres.addSlide();
  header(s, "03 | IT Cost",
    "Enterprise ICT can't be compared yet; the L400 platform is clearly in build mode",
    "HSBC's ICT (USD 2.3bn) is bank-level, so 18.7% of DWP vs peers' 10.8% is mostly perimeter. On L400, 74% of spend is change vs 27% at peers, largely external labour, with almost no cloud. Modernisation is under way; the question is direction and payback.");
  const L = ["Run", "Change (grow + transform)", "Internal labour", "External labour", "Cloud"];
  s.addChart(pres.charts.BAR, [
    { name: "HSBC L400 FY25", labels: L, values: [25.9, 74.1, 35.5, 38.6, 0.1] },
    { name: "Peer average", labels: L, values: [73.0, 26.8, 51.9, 19.2, 16.7] },
  ], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 7.0, h: 4.85, barDir: "bar", barGrouping: "clustered", catAxisOrientation: "maxMin", chartColors: [RED, MGREY],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", showTitle: true, title: "Share of IT spend (%)",
    showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 10, barGapWidthPct: 45,
  }));
  const px = 7.8, pw = W - M - px, hw = (pw - 0.2) / 2;
  panelHeader(s, px, 1.95, pw, "Enterprise ICT – perimeter to confirm");
  stat(s, px + 0.05, 2.45, hw, "18.7%", "HSBC ICT ÷ DWP (bank-level ICT)", "595959");
  stat(s, px + hw + 0.25, 2.45, hw, "10.8%", "Peer average ICT ÷ DWP", "595959");
  panelHeader(s, px, 3.8, pw, "L400 platform – reliable view");
  stat(s, px + 0.05, 4.3, hw, "9.9 → 11.3", "L400 cost, USD m, FY25 → LE26 (+14%)");
  stat(s, px + hw + 0.25, 4.3, hw, "~5%", "ICT growth p.a., HSBC and all peers");
  greyBox(s, px, 5.55, pw, 1.25, "Ask HSBC: when does change spend taper into a lower run rate? And what share of bank ICT belongs to HSBC Life?", { fontSize: 11 });
  footer(s, SRC + " HSBC mix = L400 split; peer mix = enterprise-wide. Peer cloud = share of modernisation spend.", 3);
}

// ---------- 4. PAS unit cost ----------
{
  const s = pres.addSlide();
  header(s, "04 | PAS Deep Dive – Unit Cost",
    "L400 costs 5× peers per policy and 10× per case, but only 1.3× per premium dollar",
    "HSBC's L400 platform costs more per policy than peers' entire servicing operation. But HSBC policies carry 3–4× more premium, so per premium dollar the gap narrows to 1.3× Sun Life, and per unit of DWP HSBC is lower. Judge PAS cost on both bases.");
  s.addChart(pres.charts.BAR, [{ name: "PAS cost per in-force policy", labels: ["HSBC FY25", "HSBC LE26", "Sun Life HK", "Manulife HK (est.)"], values: [13.25, 14.57, 2.75, 2.56] }],
    Object.assign(axis(), noAxis, {
      x: M, y: 1.95, w: 5.0, h: 4.85, barDir: "col", chartColors: [RED, "7A0A1C", MGREY, MGREY], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "0.00", showTitle: true, title: "PAS cost per in-force policy (USD / year)", showLegend: false, barGapWidthPct: 55,
    }));
  const tx = 5.8, tw = W - M - tx;
  panelHeader(s, tx, 1.95, tw, "PAS unit cost, HSBC FY25 vs peers");
  const rows = [
    ["Metric", "HSBC", "Sun Life", "Manulife", "HSBC ÷ SL", "Basis"],
    ["PAS cost (USD m)", "9.9", "1.4", "4.9 (est.)", "7.2×", "Low"],
    ["Per in-force policy (USD)", "13.25", "2.75", "2.56", "4.8×", "Low"],
    ["Per core servicing case (USD)", "30.77", "3.09", "n/a", "10.0×", "Low"],
    ["PAS cost ÷ premium", "0.14%", "0.11%", "0.08%", "1.3×", "Low"],
    ["PAS cost ÷ DWP", "0.08%", "0.12%", "n/a", "0.7×", "Medium"],
    ["Premium per policy (USD)", "9,159", "2,549", "3,095", "3.6×", "Medium"],
  ];
  s.addTable(tbl(rows, 4), tblOpts(tx, 2.45, tw, [2.35, 0.8, 0.85, 1.0, 1.0, tw - 6.0], 0.4, 10.5));
  card(s, tx, 5.4, (tw - 0.2) / 2, 1.4, "Caveat: cost layers", "HSBC = L400 platform IT cost. Peers = policy-admin operations cost. The per-unit gap is directional.");
  card(s, tx + (tw - 0.2) / 2 + 0.2, 5.4, (tw - 0.2) / 2, 1.4, "So what", "Per-policy cost is the modernisation target; per-premium cost shows the business can afford it.", true);
  footer(s, SRC + " Core case = policy change + cancellation (+ reinstatement for Sun Life). HSBC premium = NBP only.", 4);
}

// ---------- 5. PAS productivity & workload ----------
{
  const s = pres.addSlide();
  header(s, "05 | PAS Deep Dive – Productivity & Workload",
    "The gap is volume per head, not cost per head, and LE26 hiring widens it",
    "HSBC's cost per PAS FTE (USD 149k) is only 1.2–1.3× peers. But each FTE supports 11k policies vs 42–48k at peers, and 5k cases vs 37k at Sun Life. With FTE up 29% in LE26 and the book up 4%, policies per head fall to 9k. HSBC's workload is also different: fewer changes, more exits.");
  s.addChart(pres.charts.BAR, [{ name: "In-force policies per PAS FTE", labels: ["HSBC FY25", "HSBC LE26", "Sun Life HK", "Manulife HK"], values: [11273, 9094, 41523, 47915] }],
    Object.assign(axis(), noAxis, {
      x: M, y: 1.95, w: 4.2, h: 3.3, barDir: "col", chartColors: [RED, "7A0A1C", MGREY, MGREY], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "#,##0", showTitle: true, title: "In-force policies per PAS FTE", showLegend: false, barGapWidthPct: 55,
    }));
  s.addChart(pres.charts.BAR, [{ name: "PAS cost per PAS FTE", labels: ["HSBC FY25", "HSBC LE26", "Sun Life HK", "Manulife HK"], values: [149, 133, 114, 123] }],
    Object.assign(axis(), noAxis, {
      x: 4.85, y: 1.95, w: 4.2, h: 3.3, barDir: "col", chartColors: [RED, "7A0A1C", MGREY, MGREY], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "0", showTitle: true, title: "PAS cost per PAS FTE (USD k)", showLegend: false, barGapWidthPct: 55,
    }));
  const rows = [
    ["Workload (share of in-force per year)", "HSBC", "Sun Life", "Read-across"],
    ["Servicing intensity (core cases)", "43%", "89%", "Serviced less"],
    ["Policy changes", "37%", "85%", "Fewer changes"],
    ["Cancellation rate (incl. lapses)", "5.7%", "3.1%", "1.8× more exits"],
  ];
  s.addTable(tbl(rows, 3), tblOpts(M, 5.4, 8.55, [3.4, 1.4, 1.4, 2.35], 0.35, 10.5));
  const px = 9.4, pw = W - M - px;
  card(s, px, 1.95, pw, 1.55, "Not expensive people", "Cost per FTE is within 1.3× peers. Cutting heads isn't the answer.");
  card(s, px, 3.65, pw, 1.55, "Low volume per head", "Peers run 4× the policies per head: the scale L400 should aim for through automation.");
  card(s, px, 5.35, pw, 1.45, "Retention signal", "5.7% exits vs 3.1%. Exit processing is a load, and a business-value question.", true);
  footer(s, SRC + " HSBC FTE = L400 IT FTE; Sun Life / Manulife = policy-admin operations heads (partly definitional).", 5);
}

// ---------- 6. Automation & digital ----------
{
  const s = pres.addSlide();
  header(s, "06 | PAS Deep Dive – Automation & Digital",
    "Peers cut unit cost through digital servicing; HSBC can't yet measure its own",
    "Sun Life cut its cost per core case 37% in one year by moving paper to digital: print and postage fell from 37% to 27% of cost. AIA and Prudential report STP above 70% and 50%. HSBC has no STP, digital-service or maturity measure, so the automation lever can't yet be sized.");
  s.addChart(pres.charts.BAR, [
    { name: "Staff", labels: ["Sun Life 2022", "Sun Life 2023e"], values: [55.4, 66.5] },
    { name: "Print + postage", labels: ["Sun Life 2022", "Sun Life 2023e"], values: [36.5, 26.5] },
    { name: "Other", labels: ["Sun Life 2022", "Sun Life 2023e"], values: [8.1, 6.9] },
  ], Object.assign(axis(), noAxis, {
    x: M, y: 1.95, w: 3.9, h: 4.85, barDir: "col", barGrouping: "percentStacked", chartColors: ["7A0A1C", RED, MGREY],
    showValue: true, dataLabelPosition: "ctr", dataLabelFormatCode: "0\"%\"", dataLabelColor: WHITE, showTitle: true, title: "Sun Life PA cost mix",
    showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 10, barGapWidthPct: 50,
  }));
  const mx = 4.6, mw = 2.2;
  panelHeader(s, mx, 1.95, mw, "Sun Life, 2022 → 23e");
  stat(s, mx + 0.05, 2.45, mw - 0.1, "−37%", "Cost per core case (USD 4.88 → 3.09)");
  stat(s, mx + 0.05, 3.65, mw - 0.1, "−51%", "Cost per report / bill item");
  stat(s, mx + 0.05, 4.85, mw - 0.1, "USD 0.73", "Print + postage per policy still left");
  const tx = 7.1, tw = W - M - tx;
  const na = "Not measured";
  const rows = [
    ["Indicator", "HSBC", "Sun Life", "AIA", "Pru", "Manulife"],
    ["STP rate", na, "13.7%", ">70%", ">50%", ">10%"],
    ["Digital submission", "19.6%", "15%", "–", "–", "–"],
    ["Digital services enabled", na, "16%", ">80%", ">80%", ">50%"],
    ["PAS maturity", na, "–", "L3", "L2", "L2"],
    ["Statements volume", "3k*", "768k", "–", "–", "–"],
  ];
  panelHeader(s, tx, 1.95, tw, "Automation & digital scorecard");
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 1, color: i === 0 ? GREY : (j === 1 ? RED : DARK), align: j ? "center" : "left", fill: { color: i === 0 ? WHITE : LGREY } } }))),
    tblOpts(tx, 2.45, tw, [1.6, 1.1, 0.75, 0.65, 0.65, tw - 4.75], 0.42, 10));
  s.addText("*HSBC counts cheque payments and reprints only (regular statements not reported).", { x: tx, y: 5.0, w: tw, h: 0.35, fontFace: F, fontSize: 8.5, italic: true, color: GREY, margin: 0, isTextBox: true });
  redBox(s, tx, 5.5, tw, 1.3, "Priority data request: STP rate, full statement volumes and ops cost. Without them the automation case can't be sized.", { fontSize: 11.5, bold: true });
  footer(s, SRC + " Peer STP, digital and maturity from competitor PAS reference (lower bounds).", 6);
}

// ---------- 7. Cost -> business outcome ----------
{
  const s = pres.addSlide();
  header(s, "07 | Linking Cost to Business Outcome",
    "Continuous modernisation is worth ~USD 3m a year on L400 as the book grows",
    "Sun Life's plan cuts PA cost 26% vs do-nothing by 2026 while its book grows ~32% a year. HSBC is moving the other way: L400 cost per policy rises 10% and FTE grows faster than the book. Applying Sun Life's saving rate, LE26 L400 cost would be USD 8.3m instead of 11.3m.");
  const yrs = ["2023", "2024e", "2025e", "2026e"];
  s.addChart(pres.charts.LINE, [
    { name: "Do nothing", labels: yrs, values: [1.67, 1.75, 1.82, 1.89] },
    { name: "Do everything", labels: yrs, values: [1.67, 1.52, 1.35, 1.40] },
  ], Object.assign(axis(), {
    x: M, y: 1.95, w: 4.3, h: 3.5, chartColors: [MGREY, RED], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 7,
    showValue: true, dataLabelPosition: "t", dataLabelFormatCode: "0.00", showTitle: true, title: "Sun Life PA cost, USD m (−26% by 2026)",
    showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 10, valAxisMinVal: 1.0, valAxisMaxVal: 2.2, valAxisHidden: true, valGridLine: { style: "none" },
  }));
  s.addChart(pres.charts.BAR, [{ name: "Growth LE26 vs FY25", labels: ["New business premium", "L400 FTE", "L400 cost", "L400 cost per policy", "In-force policies"], values: [33.3, 28.8, 14.3, 10.0, 3.9] }],
    Object.assign(axis(), noAxis, {
      x: 5.0, y: 1.95, w: 4.3, h: 3.5, barDir: "bar", catAxisOrientation: "maxMin", chartColors: [RED, "404040", "404040", "404040", RED],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", showTitle: true, title: "HSBC growth, LE26 vs FY25 (%)", showLegend: false, barGapWidthPct: 40,
    }));
  greyBox(s, M, 5.6, 8.8, 1.2, "Red = business growth; dark = L400 cost and capacity. Premium outgrows L400 cost (good), but FTE and cost per policy outgrow the book (not sustainable).", { fontSize: 11 });
  const px = 9.6, pw = W - M - px;
  panelHeader(s, px, 1.95, pw, "The prize for HSBC");
  stat(s, px + 0.05, 2.45, pw - 0.1, "USD 2.6–2.9m", "L400 saving p.a. at Sun Life's 26% rate (FY25–LE26)");
  stat(s, px + 0.05, 3.65, pw - 0.1, "11.3 → 8.3", "LE26 L400 cost, USD m");
  redBox(s, px, 4.95, pw, 1.85, "Tie each modernisation step to cost per policy, cost per premium and STP, so savings are visible to the business.", { fontSize: 11, bold: true });
  footer(s, SRC + " Saving = HSBC L400 cost × Sun Life 2026 saving rate (indicative).", 7);
}

// ---------- 8. Option 3+ ----------
{
  const s = pres.addSlide();
  header(s, "08 | Emerging Hypothesis",
    "Option 3 is the right path; the benchmarks show where the four lenses add value",
    "Every benchmark gap is a volume-per-head and automation gap, not a platform-replacement case. Continuous modernisation, directed by the four lenses and tracked with PAS KPIs, is the lowest-risk way to capture the ~USD 3m a year prize.");
  const lx = M, lw = 2.0, y0 = 1.95, H = 4.85;
  redBox(s, lx, y0, lw, 0.4, "Current Option 3", { bold: true, fontSize: 11.5 });
  redBox(s, lx, y0 + 0.5, lw, H - 0.5, "Continuous, controlled modernisation of L400 towards the target architecture.", { fontSize: 11, valign: "middle" });
  s.addText("+", { x: lx + lw + 0.02, y: y0 + H / 2 - 0.3, w: 0.3, h: 0.6, fontFace: F, fontSize: 28, bold: true, color: RED, align: "center", margin: 0, isTextBox: true });
  const cx = lx + lw + 0.35, cw = 8.05, ew = 4.0;
  redBox(s, cx, y0, cw, 0.4, "Four strategic lenses, with benchmark evidence and KPI", { bold: true, fontSize: 11.5 });
  const lens = [
    ["1. Geo-political resilience", "External labour 39% vs 19%; cloud 0.1% vs ~17%.", "KPI: external labour share"],
    ["2. Business value", "Premium per policy 3.6× Sun Life; ~USD 3m p.a. prize.", "KPI: PAS cost ÷ premium"],
    ["3. Technology acceleration", "Cost per case 10× Sun Life; STP not measured vs >50–70%.", "KPI: STP %, cost per case"],
    ["4. HNW vs mass-market", "High-ticket book; 5.7% exits vs 3.1%; 43% serviced a year.", "KPI: cost to serve by segment"],
  ];
  const rh = (H - 0.5 - 0.3) / 4;
  lens.forEach((r, i) => {
    const y = y0 + 0.5 + i * (rh + 0.1);
    s.addShape(pres.shapes.RECTANGLE, { x: cx, y, w: cw - ew - 0.1, h: rh, fill: { color: LGREY }, line: { color: LGREY } });
    s.addText([{ text: r[0], options: { bold: true, breakLine: true } }, { text: r[1] }], { x: cx + 0.1, y, w: cw - ew - 0.3, h: rh, fontFace: F, fontSize: 10.5, color: DARK, valign: "middle", margin: 0.05, isTextBox: true });
    greyBox(s, cx + cw - ew, y, ew, rh, r[2], { fontSize: 11 });
  });
  s.addText("=", { x: cx + cw + 0.02, y: y0 + H / 2 - 0.3, w: 0.3, h: 0.6, fontFace: F, fontSize: 28, bold: true, color: RED, align: "center", margin: 0, isTextBox: true });
  const ox = cx + cw + 0.35, ow = W - M - ox;
  redBox(s, ox, y0, ow, 0.4, "Option 3+", { bold: true, fontSize: 11.5 });
  redBox(s, ox, y0 + 0.5, ow, H - 0.5, "Automation-led modernisation that lifts volume per head, lowers cost per policy and scales with growth.", { fontSize: 11, valign: "middle" });
  footer(s, SRC, 8);
}

// ---------- Appendix ----------
{
  const s = pres.addSlide();
  header(s, "Appendix | Data Quality & Next Steps",
    "Five data gaps to close before the business case is final",
    "The direction is robust. The size of the gaps depends on cost layers and FTE definitions, which differ between HSBC and peers.");
  const lw = 7.3;
  panelHeader(s, M, 1.95, lw, "Data gaps identified");
  const gaps = [
    [{ text: "Cost layers: ", options: { bold: true } }, { text: "HSBC PAS = L400 platform IT cost; peers = policy-admin operations cost." }],
    [{ text: "FTE definition: ", options: { bold: true } }, { text: "HSBC = L400 IT FTE; peers = policy-admin operations heads." }],
    [{ text: "ICT perimeter: ", options: { bold: true } }, { text: "HSBC ICT is bank-level; HSBC Life's share is unknown." }],
    [{ text: "Automation: ", options: { bold: true } }, { text: "no STP rate, digital-service measure or ops cost for HSBC." }],
    [{ text: "Volumes: ", options: { bold: true } }, { text: "HSBC statements exclude regular statements; premium is new business only. Manulife cost is an estimate." }],
  ];
  s.addShape(pres.shapes.RECTANGLE, { x: M, y: 2.33, w: lw, h: 4.45, fill: { color: LGREY }, line: { color: LGREY } });
  bullets(s, gaps, M + 0.15, 2.55, lw - 0.3, 4.15, 13, 17);
  const px = M + lw + 0.3, pw = W - M - px;
  panelHeader(s, px, 1.95, pw, "Proposed next steps");
  [["1", "Request STP rate, full statement volumes and PAS ops cost"], ["2", "Confirm whether LE26 FTE growth (+29%) is project staff that will roll off"], ["3", "Obtain HSBC Life's share of ICT"], ["4", "Build the business case on per-policy and per-case gaps, sized with the 26% saving rate"]].forEach((st, i) => {
    const y = 2.45 + i * 1.08;
    s.addShape(pres.shapes.OVAL, { x: px, y: y + 0.1, w: 0.6, h: 0.6, fill: { color: RED }, line: { color: RED } });
    s.addText(st[0], { x: px, y: y + 0.1, w: 0.6, h: 0.6, fontFace: F, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(st[1], { x: px + 0.75, y, w: pw - 0.75, h: 0.8, fontFace: F, fontSize: 11.5, color: DARK, valign: "middle", margin: 0, isTextBox: true });
  });
  footer(s, SRC, 9);
}

pres.writeFile({ fileName: "hsbc_master_benchmark.pptx" }).then(f => console.log("wrote", f));
