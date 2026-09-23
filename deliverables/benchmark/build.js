const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "IT Cost & PAS Benchmark Analysis";

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

const SRC = "Source: Client FY2025 actuals and FY2026E budget; Sun Life HK current; peer benchmarks (AIA, Prudential, Manulife) and market ranges from IT cost breakdown, RGT mix and technology category studies.";

// ---------- Slide 1: Executive summary ----------
{
  const s = pres.addSlide();
  header(s, "01 | Benchmark Analysis – Executive Summary",
    "Benchmarks support Option 3: modernise step by step, guided by four lenses",
    "IT cost is not the problem, since the client spends far less of its premium on IT than peers do. The problems are how the money is spent and a Policy Administration System (PAS) that costs a lot per transaction and is not automated. A big-bang replacement is hard to justify. Step-by-step modernisation aimed at specific outcomes is.");
  const rows = [
    ["IT cost: lean overall, but spent in the wrong places",
     "IT spend / GWP is 0.09% against 0.6–0.7% for peers. Only 26% of spend is run, against 64% for the market. External labour is 37% of IT spend (market 16%) and cloud is 1.8% (peers 16–17%).",
     "There is room to fund modernisation. Priorities are to reduce vendor concentration and to stop change spend turning into run cost."],
    ["PAS: small scale, high unit cost, automation not measured",
     "282k transactions (+1.5%) while IT FTE grows 29%. PAS cost per transaction is HKD 545 against HKD 27 at Sun Life. STP is not measured; peers report >10% to >70%.",
     "The PAS is where the cost and automation problem sits. Volumes are low, so replace it in modules rather than all at once."],
    ["Business outcome: growth comes from policy value, not policy count",
     "GWP +167% while policies grow +3.9%. Premium per policy rises from HKD 71k to 183k. Digital adoption is 20% against a market range of 30–70%, and IT cost per digital submission is 5× the cost per submission.",
     "Link IT spend to the segments that drive growth (HNW compared with mass market) and to digital adoption."],
  ];
  const y0 = 2.2, rh = 1.4, c1 = 3.1, c2 = 5.3, c3 = W - 2 * M - c1 - c2 - 0.3;
  s.addText("Benchmark area", { x: M, y: y0 - 0.32, w: c1, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: GREY, margin: 0, isTextBox: true });
  s.addText("What the data shows", { x: M + c1 + 0.15, y: y0 - 0.32, w: c2, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: GREY, margin: 0, isTextBox: true });
  s.addText("So what for Option 3+", { x: M + c1 + c2 + 0.3, y: y0 - 0.32, w: c3, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: GREY, margin: 0, isTextBox: true });
  rows.forEach((r, i) => {
    const y = y0 + i * (rh + 0.15);
    redBox(s, M, y, c1, rh, r[0], { bold: true, fontSize: 13 });
    s.addShape(pres.shapes.RECTANGLE, { x: M + c1 + 0.15, y, w: c2, h: rh, fill: { color: LGREY }, line: { color: LGREY } });
    s.addText(r[1], { x: M + c1 + 0.25, y, w: c2 - 0.2, h: rh, fontFace: F, fontSize: 11, color: DARK, valign: "middle", margin: 0.05, isTextBox: true });
    greyBox(s, M + c1 + c2 + 0.3, y, c3, rh, r[2], { fontSize: 11 });
  });
  footer(s, SRC, 1);
  s.addNotes("Storyline: (1) IT cost headline, (2) IT cost structure, (3) PAS productivity, (4) PAS unit cost and automation, (5) cost to business outcome, (6) mapping to the four Option 3+ lenses, (7) data gaps.");
}

// ---------- Slide 2: IT cost headline ----------
{
  const s = pres.addSlide();
  header(s, "02 | IT Cost – Headline",
    "A lean IT function: IT spend grows 71% while premiums grow 167%",
    "IT intensity falls from 0.15% to 0.09% of GWP, well below the peer level of about 0.7%. The client can afford more investment. What matters is where that investment goes.");
  s.addChart(pres.charts.BAR, [{
    name: "IT cost (HKD m)",
    labels: ["Client FY25", "Client FY26E", "Sun Life", "Manulife*", "Prudential*", "AIA*"],
    values: [77.2, 132.2, 214.3, 287.5, 460.5, 747.5],
  }], Object.assign(axis(), {
    x: M, y: 1.85, w: 6.6, h: 4.9, barDir: "col", chartColors: [RED, RED, MGREY, MGREY, MGREY, MGREY],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#,##0", valAxisHidden: true, valGridLine: { style: "none" },
    showTitle: true, title: "Total IT cost incl. D&A (HKD m)", showLegend: false, barGapWidthPct: 60,
  }));
  s.addText("*Mid-point of peer range (AIA 690–805, Pru 403–518, Manulife 230–345)", { x: M, y: 6.7, w: 6.6, h: 0.25, fontFace: F, fontSize: 8.5, color: GREY, italic: true, margin: 0, isTextBox: true });

  const px = 7.5, pw = W - M - px;
  panelHeader(s, px, 1.85, pw, "IT intensity: IT spend as % of GWP");
  const ints = [["Client FY25", "0.15%"], ["Client FY26E", "0.09%"], ["AIA / Manulife", "0.7%"], ["Prudential", "0.6%"]];
  ints.forEach((r, i) => {
    const x = px + (i % 2) * (pw / 2), y = 2.35 + Math.floor(i / 2) * 1.2;
    stat(s, x + 0.05, y, pw / 2 - 0.1, r[1], r[0], i < 2 ? RED : "595959");
  });
  greyBox(s, px, 4.85, pw, 1.85,
    "Growth is coming through premium size, not headcount or volume. IT FTE rises from 66 to 85 (+29%) and IT spend per FTE from HKD 1.17m to 1.56m. Peers run 100–300 IT FTE. Because the base is small and growing fast, the choices made now will set the future run cost.",
    { fontSize: 11 });
  footer(s, SRC + " Sun Life IT/GWP (16.8%) excluded as the premium base looks inconsistent. See data gaps.", 2);
}

// ---------- Slide 3: IT cost structure ----------
{
  const s = pres.addSlide();
  header(s, "03 | IT Cost – Structure",
    "How IT money is spent, not how much, is what supports the Option 3+ lenses",
    "74% of IT spend already goes on change, but mostly through external labour and on-premise infrastructure. Without resilience and acceleration guardrails, today's change spend will turn into tomorrow's run cost and vendor lock-in.");
  s.addChart(pres.charts.BAR, [
    { name: "Client FY26E", labels: ["Run spend", "External labour", "Internal labour", "Infrastructure", "Cloud"], values: [26.5, 37.2, 36.3, 16.8, 1.8] },
    { name: "Peer avg (AIA/Pru/Manulife)", labels: ["Run spend", "External labour", "Internal labour", "Infrastructure", "Cloud"], values: [75.0, 19.0, 56.0, 6.4, 16.7] },
  ], Object.assign(axis(), {
    x: M, y: 1.85, w: 7.4, h: 5.0, barDir: "bar", barGrouping: "clustered", chartColors: [RED, MGREY],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", valAxisHidden: true, valGridLine: { style: "none" },
    showTitle: true, title: "% of total IT spend", showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 10, catAxisOrientation: "maxMin", barGapWidthPct: 50,
  }));
  const px = 8.2, pw = W - M - px;
  const cards = [
    ["Change-heavy mix", "Run is 26% against 64% for the market. The client is building, and must make sure new builds are modular and cheap to run."],
    ["Vendor dependency", "External labour is 37% against a 16% market benchmark. This is the concentration and portability risk the geo-political resilience lens covers."],
    ["Legacy infrastructure", "Infrastructure is 17% against 4–10% for peers, and cloud is 1.8% against 16–17%. This is the room technology acceleration can use."],
  ];
  cards.forEach((c, i) => {
    const y = 1.85 + i * 1.7;
    redBox(s, px, y, pw, 0.38, c[0], { bold: true });
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: y + 0.38, w: pw, h: 1.15, fill: { color: LGREY }, line: { color: LGREY } });
    s.addText(c[1], { x: px + 0.1, y: y + 0.38, w: pw - 0.2, h: 1.15, fontFace: F, fontSize: 11, color: DARK, valign: "middle", margin: 0.05, isTextBox: true });
  });
  footer(s, SRC + " Peer average is the simple mean of AIA, Prudential and Manulife. Market: run 64%, external labour 16%, internal labour 40%.", 3);
}

// ---------- Slide 4: PAS productivity ----------
{
  const s = pres.addSlide();
  header(s, "04 | PAS Deep Dive – Scale & Productivity",
    "PAS volumes are flat while IT capacity grows, so productivity is falling",
    "PAS transactions grow 1.5% while IT FTE grows 29%, so transactions per FTE fall 21%. The client handles two-thirds of Sun Life's PAS volume. A full replacement sized for a larger book would be hard to justify.");
  const cw = (W - 2 * M - 0.4) / 3;
  const charts = [
    { t: "PAS transactions (000s)", v: [278.0, 282.1, 424.0], f: "#,##0.0" },
    { t: "PAS transactions per IT FTE", v: [4213, 3319, 4240], f: "#,##0" },
    { t: "In-force policies per IT FTE (000s)", v: [11.3, 9.1, 47.9], f: "0.0" },
  ];
  charts.forEach((c, i) => {
    s.addChart(pres.charts.BAR, [{ name: c.t, labels: ["Client FY25", "Client FY26E", "Sun Life"], values: c.v }], Object.assign(axis(), {
      x: M + i * (cw + 0.2), y: 1.85, w: cw, h: 3.2, barDir: "col", chartColors: [RED, RED, MGREY], showValue: true,
      dataLabelPosition: "outEnd", dataLabelFormatCode: c.f, valAxisHidden: true, valGridLine: { style: "none" }, showTitle: true, title: c.t, showLegend: false, barGapWidthPct: 70,
    }));
  });
  const y = 5.25, bw = (W - 2 * M - 0.4) / 3;
  const boxes = [
    ["Statements per IT FTE", "43 against 986 at Sun Life. Statement production looks manual or outsourced outside the PAS."],
    ["Cancellations per IT FTE", "505 against 64 at Sun Life, and cancellations rise as a share of activity. Is this a retention and product signal to test with the business?"],
    ["Implication for Option 3", "Productivity gains come from automating high-effort journeys (statements, servicing), not from replacing the platform all at once."],
  ];
  boxes.forEach((b, i) => {
    const x = M + i * (bw + 0.2);
    if (i < 2) {
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: bw, h: 1.55, fill: { color: LGREY }, line: { color: LGREY } });
      s.addText([{ text: b[0], options: { bold: true, breakLine: true, color: RED } }, { text: b[1] }], { x: x + 0.1, y, w: bw - 0.2, h: 1.55, fontFace: F, fontSize: 11, color: DARK, valign: "middle", margin: 0.05, isTextBox: true });
    } else {
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: bw, h: 1.55, fill: { color: RED }, line: { color: RED } });
      s.addText([{ text: b[0], options: { bold: true, breakLine: true } }, { text: b[1] }], { x: x + 0.1, y, w: bw - 0.2, h: 1.55, fontFace: F, fontSize: 11, color: WHITE, valign: "middle", margin: 0.05, isTextBox: true });
    }
  });
  footer(s, SRC + " No competitor PAS volumes available, so Sun Life HK is the only volume comparator.", 4);
}

// ---------- Slide 5: PAS unit cost & automation ----------
{
  const s = pres.addSlide();
  header(s, "05 | PAS Deep Dive – Unit Cost & Automation",
    "PAS unit costs are far above benchmark, and automation is not measured",
    "Even allowing for definition differences, the client pays a large multiple of Sun Life's PAS cost per case. Peers are driving STP towards 30–70%. The client needs an STP baseline before it can measure any modernisation value.");
  const px = M, pw = 6.0;
  panelHeader(s, px, 1.9, pw, "PAS cost per case, FY26E (HKD)");
  const unit = [["Per PAS transaction", "545", "27", "~20×"], ["Per statement", "42,073", "118", "~360×"], ["Per cancellation", "3,579", "1,823", "~2×"]];
  const hdrY = 2.35;
  [["Metric", 2.2], ["Client", 1.2], ["Sun Life", 1.2], ["Gap", 1.4]].reduce((x, [t, w]) => {
    s.addText(t, { x, y: hdrY, w, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: GREY, margin: 0.05, align: t === "Metric" ? "left" : "right", isTextBox: true });
    return x + w;
  }, px);
  unit.forEach((r, i) => {
    const y = 2.7 + i * 0.62;
    s.addShape(pres.shapes.RECTANGLE, { x: px, y, w: pw, h: 0.52, fill: { color: LGREY }, line: { color: LGREY } });
    let x = px;
    [[r[0], 2.2, DARK, false, "left"], [r[1], 1.2, DARK, false, "right"], [r[2], 1.2, DARK, false, "right"], [r[3], 1.4, RED, true, "right"]].forEach(([t, w, c, b, a]) => {
      s.addText(t, { x, y, w, h: 0.52, fontFace: F, fontSize: 12, color: c, bold: b, align: a, valign: "middle", margin: 0.08, isTextBox: true });
      x += w;
    });
  });
  greyBox(s, px, 4.65, pw, 2.1,
    "Caveat: FY26E PAS cost (HKD 153.7m) is higher than total IT spend (HKD 132.2m), so it probably includes business operations or policy servicing cost. By comparison, IT spend per PAS transaction is close to Sun Life (HKD 469 against 505). The gap is therefore mainly in operating cost around the PAS, which is what automation and STP address.",
    { fontSize: 11 });

  const cx = 6.9, cw = W - M - cx;
  s.addChart(pres.charts.BAR, [{
    name: "STP rate (%)", labels: ["Client", "Sun Life", "Manulife (>)", "Prudential (>)", "AIA (>)"], values: [0, 13.7, 10, 50, 70],
  }], Object.assign(axis(), {
    x: cx, y: 1.9, w: cw, h: 3.6, barDir: "bar", chartColors: [RED, MGREY, MGREY, MGREY, MGREY], catAxisOrientation: "maxMin",
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0\"%\"", valAxisHidden: true, valGridLine: { style: "none" },
    showTitle: true, title: "Straight-through processing (STP) rate", showLegend: false, barGapWidthPct: 50,
  }));
  s.addText("Client STP is not tracked (shown as 0). Peer values are lower bounds. Market range is 30–70%.", { x: cx, y: 5.5, w: cw, h: 0.3, fontFace: F, fontSize: 9, italic: true, color: GREY, margin: 0, isTextBox: true });
  redBox(s, cx, 5.9, cw, 0.85, "Implication: target automation on the highest-cost PAS journeys, one module at a time, and track STP as the lead KPI for Option 3.", { fontSize: 11.5, bold: true });
  footer(s, SRC + " Unit costs = PAS cost ÷ case volumes. Gap multiples are indicative until PAS cost scope is confirmed.", 5);
}

// ---------- Slide 6: Cost -> business outcome ----------
{
  const s = pres.addSlide();
  header(s, "06 | Linking Cost to Business Outcome",
    "Growth is value-led, so IT spend should follow HNW and digital segments",
    "Premium per policy has risen 2.6× while the policy count is almost flat, so the book is moving towards HNW. Digital adoption is well below the market, which makes each digital submission expensive. Both point to the business-value and segmentation lenses.");
  s.addChart(pres.charts.BAR, [
    { name: "Growth FY25→FY26E", labels: ["Premium (GWP)", "IT spend", "IT FTE", "Digital submissions", "New policies", "Policies", "Customers", "PAS transactions"], values: [166.6, 71.2, 28.8, 22.2, 19.5, 3.9, 3.0, 1.5] },
  ], Object.assign(axis(), {
    x: M, y: 1.95, w: 6.3, h: 4.85, barDir: "bar", chartColors: [RED, MGREY, MGREY, RED, RED, MGREY, MGREY, MGREY], catAxisOrientation: "maxMin",
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", valAxisHidden: true, valGridLine: { style: "none" },
    showTitle: true, title: "Growth FY25 → FY26E (%)", showLegend: false, barGapWidthPct: 45,
  }));
  const px = 7.2, pw = W - M - px, hw = (pw - 0.2) / 2;
  panelHeader(s, px, 1.95, pw, "Value per policy: HNW shift");
  stat(s, px + 0.05, 2.45, hw, "71k → 183k", "Premium per policy (HKD)");
  stat(s, px + hw + 0.25, 2.45, hw, "124k → 321k", "Premium per customer (HKD)");
  panelHeader(s, px, 3.75, pw, "Digital: adoption gap drives unit cost");
  stat(s, px + 0.05, 4.25, hw, "19.6%", "Digital submission rate against a 30–70% market range");
  stat(s, px + hw + 0.25, 4.25, hw, "5.1×", "IT cost per digital submission (HKD 6,010) against per submission (HKD 1,180)");
  greyBox(s, px, 5.6, pw, 1.2, "IT spend per policy rises from HKD 104 to 171 (Sun Life 298). The spend is affordable, but value depends on raising digital adoption and on matching platform capability to the HNW book.", { fontSize: 11 });
  footer(s, SRC + " Red bars show value drivers; grey bars show volume and capacity.", 6);
}

// ---------- Slide 7: Mapping to Option 3+ ----------
{
  const s = pres.addSlide();
  header(s, "07 | Benchmark Implications for Option 3+",
    "Each Option 3+ lens is backed by a benchmark signal and a KPI to track",
    "The benchmarks support continuous modernisation (Option 3). No single number justifies a big-bang PAS replacement. They also show where the four lenses should direct funding and what to measure.");
  const y0 = 1.95;
  const lx = M, lw = 2.9, ex = lx + lw + 0.15, ew = 4.7, kx = ex + ew + 0.15, kw = W - M - kx;
  [["Strategic lens", lx, lw], ["Benchmark evidence", ex, ew], ["What Option 3+ should do and track", kx, kw]].forEach(([t, x, w]) =>
    s.addText(t, { x, y: y0 - 0.32, w, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: GREY, margin: 0, isTextBox: true }));
  const rows = [
    ["1. Geo-political resilience", "External labour is 37% of IT spend against a 16% market benchmark. Cloud is only 1.8%, so the hosting and vendor model is still undecided.", "Vendor concentration limits, portability rules for new builds, and in-sourcing of core PAS skills. KPI: external labour share."],
    ["2. Business value", "IT is 0.09% of GWP, so it is affordable. Premium grows 167% on +3.9% policies. Peers put 41–46% of modernisation into data and analytics.", "Fund near-term, measurable use cases (servicing, statements, data). KPIs: IT cost per policy and digital adoption."],
    ["3. Technology acceleration", "PAS cost per transaction is about 20× Sun Life's. STP is not tracked, against 30–70% in the market. Infrastructure is 17% of spend against 4–10% for peers.", "Selective re-platforming, automation of high-effort PAS journeys, and an STP baseline. KPIs: STP % and PAS cost per case."],
    ["4. HNW vs mass-market", "Premium per policy rises from HKD 71k to 183k. Digital adoption is 20% against 30–70%, and a digital submission costs 5× a standard one.", "Separate platform treatment: tailored HNW capability, and a digital, high-STP mass-market path. KPI: cost to serve by segment."],
  ];
  const rh = 1.12;
  rows.forEach((r, i) => {
    const y = y0 + i * (rh + 0.1);
    redBox(s, lx, y, lw, rh, r[0], { bold: true, fontSize: 13 });
    s.addShape(pres.shapes.RECTANGLE, { x: ex, y, w: ew, h: rh, fill: { color: LGREY }, line: { color: LGREY } });
    s.addText(r[1], { x: ex + 0.1, y, w: ew - 0.2, h: rh, fontFace: F, fontSize: 10.5, color: DARK, valign: "middle", margin: 0.05, isTextBox: true });
    greyBox(s, kx, y, kw, rh, r[2], { fontSize: 10.5 });
  });
  footer(s, SRC, 7);
}

// ---------- Slide 8: Data gaps & next steps ----------
{
  const s = pres.addSlide();
  header(s, "08 | Data Quality & Next Steps",
    "Client data is directional: five gaps to close before the business case",
    "The direction holds (lean IT, costly PAS, value-led growth). The sizing of the PAS gap and the peer comparisons need validating with the client.");
  const lw = 7.3;
  panelHeader(s, M, 1.95, lw, "Data gaps identified");
  const gaps = [
    [{ text: "PAS cost scope: ", options: { bold: true } }, { text: "HKD 153.7m is higher than total IT spend of HKD 132.2m. Confirm whether it includes operations, vendor or business cost." }],
    [{ text: "No FY25 baseline: ", options: { bold: true } }, { text: "PAS cost, STP and digital sales are missing for FY25, and growth metrics show 0% by default." }],
    [{ text: "STP not tracked: ", options: { bold: true } }, { text: "this is the lead automation KPI for Option 3, and the client has no baseline." }],
    [{ text: "Peer inconsistencies: ", options: { bold: true } }, { text: "Sun Life IT/GWP of 16.8% (premium base of HKD 1.3bn looks understated). The peer 'IT cost efficiency' of 3–9% conflicts with the 0.6–0.7% implied by the ranges." }],
    [{ text: "Category definitions: ", options: { bold: true } }, { text: "application spend of 2% (client) against 52.5% (Sun Life), and different definitions of external IT between sources." }],
  ];
  s.addShape(pres.shapes.RECTANGLE, { x: M, y: 2.33, w: lw, h: 4.45, fill: { color: LGREY }, line: { color: LGREY } });
  bullets(s, gaps, M + 0.15, 2.55, lw - 0.3, 4.1, 13, 16);

  const px = M + lw + 0.3, pw = W - M - px;
  panelHeader(s, px, 1.95, pw, "Proposed next steps");
  const steps = [
    ["1", "Reconcile PAS cost against the IT cost base with Finance and IT (scope, allocation keys)"],
    ["2", "Set FY25 baselines for STP, PAS cost per case and digital adoption"],
    ["3", "Normalise peer data to one taxonomy (run/change, labour, technology)"],
    ["4", "Set Option 3+ KPI targets for each lens and link them to the modernisation roadmap"],
  ];
  steps.forEach((st, i) => {
    const y = 2.45 + i * 1.08;
    s.addShape(pres.shapes.OVAL, { x: px, y: y + 0.1, w: 0.6, h: 0.6, fill: { color: RED }, line: { color: RED } });
    s.addText(st[0], { x: px, y: y + 0.1, w: 0.6, h: 0.6, fontFace: F, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(st[1], { x: px + 0.75, y, w: pw - 0.75, h: 0.8, fontFace: F, fontSize: 11.5, color: DARK, valign: "middle", margin: 0, isTextBox: true });
  });
  footer(s, SRC, 8);
}

pres.writeFile({ fileName: "benchmark_analysis.pptx" }).then(f => console.log("wrote", f));
