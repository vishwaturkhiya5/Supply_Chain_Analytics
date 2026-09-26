import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const projectRoot = path.resolve(process.argv[2] || ".");
const outputPath = path.resolve(process.argv[3] || path.join(projectRoot, "dashboard", "Supply_Chain_Analytics_Dashboard.xlsx"));
const previewDir = path.resolve(process.argv[4] || path.join(projectRoot, "dashboard", "previews"));
const outputs = path.join(projectRoot, "outputs");

const COLORS = {
  navy: "#17324D",
  blue: "#2F6BFF",
  blueLight: "#EAF0FF",
  gold: "#F4B942",
  goldLight: "#FFF5D6",
  ink: "#202B33",
  muted: "#65727E",
  line: "#D9E1E8",
  pale: "#F5F7F9",
  white: "#FFFFFF",
  warning: "#A85D00",
  warningFill: "#FFF0DB",
};
const FONT = "Arial";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v !== ""));
}

async function readCSV(name) {
  const text = await fs.readFile(path.join(outputs, name), "utf8");
  const rows = parseCSV(text);
  const headers = rows[0];
  const data = rows.slice(1).map((row) => Object.fromEntries(headers.map((h, i) => {
    const raw = row[i] ?? "";
    const numeric = raw !== "" && /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw);
    return [h, numeric ? Number(raw) : raw];
  })));
  return { headers, data };
}

function matrix(data, columns) {
  return [columns, ...data.map((r) => columns.map((c) => r[c] ?? ""))];
}

function letters(n) {
  let x = n;
  let s = "";
  while (x > 0) {
    x -= 1;
    s = String.fromCharCode(65 + (x % 26)) + s;
    x = Math.floor(x / 26);
  }
  return s;
}

function writeBlock(sheet, startRow, startCol, rows, tableName = null) {
  const rowCount = rows.length;
  const colCount = rows[0].length;
  const endRow = startRow + rowCount - 1;
  const endCol = startCol + colCount - 1;
  const range = sheet.getRange(`${letters(startCol)}${startRow}:${letters(endCol)}${endRow}`);
  range.values = rows;
  range.format.font = { name: FONT, size: 10, color: COLORS.ink };
  range.format.verticalAlignment = "center";
  const header = sheet.getRange(`${letters(startCol)}${startRow}:${letters(endCol)}${startRow}`);
  header.format = {
    fill: COLORS.navy,
    font: { name: FONT, size: 10, bold: true, color: COLORS.white },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "inside", style: "thin", color: COLORS.white },
  };
  if (rowCount > 1) {
    sheet.getRange(`${letters(startCol)}${startRow + 1}:${letters(endCol)}${endRow}`).format.borders = {
      insideHorizontal: { style: "thin", color: COLORS.line },
      bottom: { style: "thin", color: COLORS.line },
    };
  }
  if (tableName) {
    const table = sheet.tables.add(`${letters(startCol)}${startRow}:${letters(endCol)}${endRow}`, true, tableName);
    table.style = "TableStyleMedium2";
  }
  return { range, endRow, endCol };
}

function title(sheet, text, subtitle = "") {
  sheet.showGridLines = false;
  sheet.getRange("A2:N2").format.borders = { bottom: { style: "medium", color: COLORS.blue } };
  sheet.getRange("A2").values = [[text]];
  sheet.getRange("A2").format.font = { name: FONT, size: 16, bold: true, color: COLORS.navy };
  if (subtitle) {
    sheet.getRange("A3").values = [[subtitle]];
    sheet.getRange("A3").format.font = { name: FONT, size: 10, italic: true, color: COLORS.muted };
  }
}

function formatMoney(sheet, range) {
  sheet.getRange(range).format.numberFormat = "$#,##0.00";
}
function formatPct(sheet, range) {
  sheet.getRange(range).format.numberFormat = "0.00%";
}
function sectionLabel(sheet, cell, label) {
  const topLeft = cell.split(":")[0];
  sheet.getRange(topLeft).values = [[label]];
  sheet.getRange(cell).format = {
    fill: COLORS.blueLight,
    font: { name: FONT, size: 11, bold: true, color: COLORS.navy },
    borders: { bottom: { style: "thin", color: COLORS.blue } },
  };
}

const metrics = JSON.parse(await fs.readFile(path.join(outputs, "metrics_summary.json"), "utf8"));
const insights = JSON.parse(await fs.readFile(path.join(outputs, "insights_summary.json"), "utf8"));
const monthly = await readCSV("monthly_performance.csv");
const yearly = await readCSV("yearly_performance.csv");
const segment = await readCSV("segment_performance.csv");
const market = await readCSV("market_performance.csv");
const region = await readCSV("region_performance.csv");
const shipping = await readCSV("shipping_mode_performance.csv");
const delivery = await readCSV("delivery_status_order_performance.csv");
const categories = await readCSV("category_performance.csv");
const products = await readCSV("product_performance.csv");
const validation = await readCSV("metrics_validation.csv");
const quality = await readCSV("data_quality_summary.csv");
const kpiCube = await readCSV("dashboard_kpi_cube.csv");
const monthlyCube = await readCSV("dashboard_monthly_cube.csv");
const dictionaryRows = parseCSV(await fs.readFile(path.join(projectRoot, "data_dictionary", "DescriptionDataCoSupplyChain.csv"), "utf8"));
const shippingSorted = [...shipping.data].sort((a, b) => b.late_delivery_rate_order - a.late_delivery_rate_order);

const workbook = Workbook.create();
const dashboard = workbook.worksheets.add("Dashboard");
const trends = workbook.worksheets.add("Monthly Trends");
const business = workbook.worksheets.add("Customer & Region");
const shippingSheet = workbook.worksheets.add("Shipping");
const productsSheet = workbook.worksheets.add("Products");
const validationSheet = workbook.worksheets.add("Metrics Validation");
const qualitySheet = workbook.worksheets.add("Data Quality");
const dataSheet = workbook.worksheets.add("Dashboard Data");
const dictionarySheet = workbook.worksheets.add("Data Dictionary");
const readmeSheet = workbook.worksheets.add("ReadMe");

// Dashboard Data: compact, auditable source for formulas and charts.
dataSheet.showGridLines = false;
dataSheet.getRange("A1").values = [["KPI filter cube"]];
dataSheet.getRange("A1").format.font = { name: FONT, size: 14, bold: true, color: COLORS.navy };
writeBlock(dataSheet, 3, 1, matrix(kpiCube.data, kpiCube.headers), "KpiFilterCube");
const monthlyStart = 31;
dataSheet.getRange(`A${monthlyStart - 2}`).values = [["Monthly filter cube"]];
dataSheet.getRange(`A${monthlyStart - 2}`).format.font = { name: FONT, size: 14, bold: true, color: COLORS.navy };
writeBlock(dataSheet, monthlyStart, 1, matrix(monthlyCube.data, monthlyCube.headers), "MonthlyFilterCube");

// Dynamic chart helper tied to Dashboard filters.
const months = monthly.data.map((r) => r.order_year_month);
dataSheet.getRange("Q1:V1").values = [["Month", "Gross Sales ($M)", "Net Sales", "Profit", "Orders", "Late Delivery %"]];
dataSheet.getRange(`Q2:Q${months.length + 1}`).values = months.map((m) => [m]);
const mcEnd = monthlyStart + monthlyCube.data.length;
for (let i = 0; i < months.length; i += 1) {
  const row = i + 2;
  dataSheet.getRange(`R${row}`).formulas = [[`=SUMIFS($G$${monthlyStart + 1}:$G$${mcEnd},$A$${monthlyStart + 1}:$A$${mcEnd},Dashboard!$B$4,$B$${monthlyStart + 1}:$B$${mcEnd},Dashboard!$E$4,$C$${monthlyStart + 1}:$C$${mcEnd},Q${row})/1000000`]];
  dataSheet.getRange(`S${row}`).formulas = [[`=SUMIFS($H$${monthlyStart + 1}:$H$${mcEnd},$A$${monthlyStart + 1}:$A$${mcEnd},Dashboard!$B$4,$B$${monthlyStart + 1}:$B$${mcEnd},Dashboard!$E$4,$C$${monthlyStart + 1}:$C$${mcEnd},Q${row})`]];
  dataSheet.getRange(`T${row}`).formulas = [[`=SUMIFS($J$${monthlyStart + 1}:$J$${mcEnd},$A$${monthlyStart + 1}:$A$${mcEnd},Dashboard!$B$4,$B$${monthlyStart + 1}:$B$${mcEnd},Dashboard!$E$4,$C$${monthlyStart + 1}:$C$${mcEnd},Q${row})`]];
  dataSheet.getRange(`U${row}`).formulas = [[`=SUMIFS($E$${monthlyStart + 1}:$E$${mcEnd},$A$${monthlyStart + 1}:$A$${mcEnd},Dashboard!$B$4,$B$${monthlyStart + 1}:$B$${mcEnd},Dashboard!$E$4,$C$${monthlyStart + 1}:$C$${mcEnd},Q${row})`]];
  dataSheet.getRange(`V${row}`).formulas = [[`=IFERROR(SUMIFS($K$${monthlyStart + 1}:$K$${mcEnd},$A$${monthlyStart + 1}:$A$${mcEnd},Dashboard!$B$4,$B$${monthlyStart + 1}:$B$${mcEnd},Dashboard!$E$4,$C$${monthlyStart + 1}:$C$${mcEnd},Q${row})/SUMIFS($D$${monthlyStart + 1}:$D$${mcEnd},$A$${monthlyStart + 1}:$A$${mcEnd},Dashboard!$B$4,$B$${monthlyStart + 1}:$B$${mcEnd},Dashboard!$E$4,$C$${monthlyStart + 1}:$C$${mcEnd},Q${row}),0)`]];
}
dataSheet.getRange(`R2:R${months.length + 1}`).format.numberFormat = "0.00";
formatMoney(dataSheet, `S2:T${months.length + 1}`);
formatPct(dataSheet, `V2:V${months.length + 1}`);

// Static chart helpers.
dataSheet.getRange("X1:Y1").values = [["Market", "Gross Sales ($M)"]];
dataSheet.getRange(`X2:Y${market.data.length + 1}`).values = market.data.map((r) => [r.market, r.gross_sales / 1000000]);
dataSheet.getRange("AA1:AB1").values = [["Segment", "Gross Sales ($M)"]];
dataSheet.getRange(`AA2:AB${segment.data.length + 1}`).values = segment.data.map((r) => [r.customer_segment, r.gross_sales / 1000000]);
dataSheet.getRange("AD1:AE1").values = [["Shipping Mode", "Late Delivery %"]];
dataSheet.getRange(`AD2:AE${shippingSorted.length + 1}`).values = shippingSorted.map((r) => [r.shipping_mode, r.late_delivery_rate_order]);
const topCategories = [...categories.data].sort((a, b) => b.gross_sales - a.gross_sales).slice(0, 8);
dataSheet.getRange("AG1:AH1").values = [["Category", "Gross Sales ($M)"]];
dataSheet.getRange(`AG2:AH${topCategories.length + 1}`).values = topCategories.map((r) => [r.category_name, r.gross_sales / 1000000]);
dataSheet.getRange("AJ1:AK1").values = [["Delivery Status", "Orders"]];
dataSheet.getRange(`AJ2:AK${delivery.data.length + 1}`).values = delivery.data.map((r) => [r.delivery_status, r.orders]);
dataSheet.getRange(`Y2:Y${market.data.length + 1}`).format.numberFormat = "0.00";
dataSheet.getRange(`AB2:AB${segment.data.length + 1}`).format.numberFormat = "0.00";
formatPct(dataSheet, `AE2:AE${shippingSorted.length + 1}`);
dataSheet.getRange(`AH2:AH${topCategories.length + 1}`).format.numberFormat = "0.00";
dataSheet.freezePanes.freezeRows(3);
dataSheet.getRange("A:AK").format.columnWidth = 16;

// Main dashboard.
title(dashboard, "Supply Chain Analytics Dashboard", "DataCo orders from Jan 2015 to Jan 2018; 2018 is a partial year");
dashboard.getRange("A4").values = [["Market"]];
dashboard.getRange("B4").values = [["All"]];
dashboard.getRange("D4").values = [["Customer segment"]];
dashboard.getRange("E4").values = [["All"]];
dashboard.getRange("G4").values = [["Filters apply to KPI cards and monthly trend"]];
dashboard.getRange("A4:E4").format.font = { name: FONT, size: 10, bold: true, color: COLORS.navy };
dashboard.getRange("B4").dataValidation = { rule: { type: "list", values: ["All", ...market.data.map((r) => r.market).sort()] } };
dashboard.getRange("E4").dataValidation = { rule: { type: "list", values: ["All", ...segment.data.map((r) => r.customer_segment).sort()] } };
dashboard.getRange("B4:E4").format.fill = COLORS.goldLight;
dashboard.getRange("G4").format.font = { name: FONT, size: 9, italic: true, color: COLORS.muted };

const cubeStart = 4;
const cubeEnd = 3 + kpiCube.data.length;
const metricFormula = (col) => `=SUMIFS('Dashboard Data'!$${col}$${cubeStart}:'Dashboard Data'!$${col}$${cubeEnd},'Dashboard Data'!$A$${cubeStart}:'Dashboard Data'!$A$${cubeEnd},$B$4,'Dashboard Data'!$B$${cubeStart}:'Dashboard Data'!$B$${cubeEnd},$E$4)`;
const cards = [
  { range: "A6:B9", label: "Total Records", formula: metricFormula("C"), fmt: "#,##0" },
  { range: "C6:D9", label: "Total Orders", formula: metricFormula("D"), fmt: "#,##0" },
  { range: "E6:F9", label: "Gross Sales", formula: metricFormula("F"), fmt: "$0.00,,\"M\"" },
  { range: "G6:H9", label: "Total Profit", formula: metricFormula("I"), fmt: "$#,##0.00,,\"M\"" },
  { range: "I6:J9", label: "Gross AOV", formula: `=IFERROR(${metricFormula("F").slice(1)}/${metricFormula("D").slice(1)},0)`, fmt: "$#,##0.00" },
  { range: "K6:L9", label: "Late Delivery %", formula: `=IFERROR(${metricFormula("J").slice(1)}/${metricFormula("C").slice(1)},0)`, fmt: "0.00%" },
];
for (const card of cards) {
  const topLeft = card.range.split(":")[0];
  const col = topLeft.match(/[A-Z]+/)[0];
  const startRow = Number(topLeft.match(/\d+/)[0]);
  dashboard.getRange(card.range).format = {
    fill: COLORS.pale,
    font: { name: FONT, color: COLORS.ink },
    borders: { preset: "outside", style: "thin", color: COLORS.line },
  };
  dashboard.getRange(`${col}${startRow}`).values = [[card.label]];
  dashboard.getRange(`${col}${startRow}`).format.font = { name: FONT, size: 10, bold: true, color: COLORS.muted };
  dashboard.getRange(`${col}${startRow + 1}`).formulas = [[card.formula]];
  dashboard.getRange(`${col}${startRow + 1}`).format.font = { name: FONT, size: 14, bold: true, color: COLORS.navy };
  dashboard.getRange(`${col}${startRow + 1}`).format.numberFormat = card.fmt;
}

const trendChart = dashboard.charts.add("line", dataSheet.getRange(`Q1:R${months.length + 1}`));
trendChart.title = "Monthly Gross Sales ($M, Selected Filters)";
trendChart.hasLegend = false;
trendChart.xAxis = { axisType: "textAxis", textStyle: { typeface: FONT, fontSize: 9 } };
trendChart.yAxis = { numberFormatCode: "0.0", numberFormatSourceLinked: false, textStyle: { typeface: FONT, fontSize: 9 } };
trendChart.setPosition("A11", "N27");

const marketChart = dashboard.charts.add("bar", dataSheet.getRange(`X1:Y${market.data.length + 1}`));
marketChart.title = "Gross Sales by Market ($M, Overall)";
marketChart.hasLegend = false;
marketChart.xAxis = { numberFormatCode: "0.0", numberFormatSourceLinked: false, textStyle: { typeface: FONT, fontSize: 9 } };
marketChart.yAxis = { textStyle: { typeface: FONT, fontSize: 9 } };
marketChart.setPosition("A29", "G44");

const shipChart = dashboard.charts.add("column", dataSheet.getRange(`AD1:AE${shippingSorted.length + 1}`));
shipChart.title = "Late Delivery Rate by Shipping Mode (Orders)";
shipChart.hasLegend = false;
shipChart.yAxis = { numberFormatCode: "0%", numberFormatSourceLinked: false, textStyle: { typeface: FONT, fontSize: 9 } };
shipChart.xAxis = { axisType: "textAxis", textStyle: { typeface: FONT, fontSize: 9 } };
shipChart.setPosition("H29", "N44");

const segmentChart = dashboard.charts.add("column", dataSheet.getRange(`AA1:AB${segment.data.length + 1}`));
segmentChart.title = "Gross Sales by Customer Segment ($M, Overall)";
segmentChart.hasLegend = false;
segmentChart.yAxis = { numberFormatCode: "0.0", numberFormatSourceLinked: false, textStyle: { typeface: FONT, fontSize: 9 } };
segmentChart.xAxis = { axisType: "textAxis", textStyle: { typeface: FONT, fontSize: 9 } };
segmentChart.setPosition("A46", "G61");

const categoryChart = dashboard.charts.add("bar", dataSheet.getRange(`AG1:AH${topCategories.length + 1}`));
categoryChart.title = "Top Categories by Gross Sales ($M, Overall)";
categoryChart.hasLegend = false;
categoryChart.xAxis = { numberFormatCode: "0.0", numberFormatSourceLinked: false, textStyle: { typeface: FONT, fontSize: 9 } };
categoryChart.yAxis = { textStyle: { typeface: FONT, fontSize: 8 } };
categoryChart.setPosition("H46", "N61");

sectionLabel(dashboard, "A63:N63", "Key findings and recommended actions");
const dashboardInsights = [
  `First Class is late on ${(insights.shipping_efficiency.modes[0].late_delivery_rate_order * 100).toFixed(2)}% of orders; reset the 1-day promise or improve carrier execution.`,
  `The top 10 products generate ${(insights.sales_concentration.top_10_product_sales_share * 100).toFixed(2)}% of gross sales; protect availability and supplier continuity for these SKUs.`,
  `${(insights.profitability_risk.negative_profit_order_rate * 100).toFixed(2)}% of orders are loss-making; review discount and product-level margin rules.`,
  `Customer segment late rates vary by only ${insights.customer_segments.late_rate_range_percentage_points.toFixed(2)} percentage points; prioritize shipping mode and carrier fixes over segment-specific policies.`,
];
dashboard.getRange("A64:A67").values = dashboardInsights.map((v) => [v]);
dashboard.getRange("A64:N67").format.font = { name: FONT, size: 10, color: COLORS.ink };
dashboard.getRange("A64:N67").format.wrapText = false;
dashboard.getRange("A:N").format.columnWidth = 12;
dashboard.getRange("A:A").format.columnWidth = 18;
dashboard.getRange("B:B").format.columnWidth = 14;
dashboard.getRange("D:D").format.columnWidth = 18;
dashboard.getRange("E:E").format.columnWidth = 14;

// Monthly trends.
title(trends, "Monthly and Yearly Performance", "Gross sales are before discounts; profit is based on net sales");
const monthlyCols = ["order_year_month", "records", "orders", "units", "gross_sales", "net_sales", "profit", "gross_aov", "profit_margin_net", "late_delivery_rate_row", "gross_sales_yoy", "profit_yoy"];
writeBlock(trends, 5, 1, matrix(monthly.data, monthlyCols), "MonthlyPerformance");
formatMoney(trends, `E6:H${monthly.data.length + 5}`);
formatPct(trends, `I6:L${monthly.data.length + 5}`);
sectionLabel(trends, "N5:V5", "Yearly summary");
const yearlyCols = ["order_year", "orders", "gross_sales", "net_sales", "profit", "gross_aov", "gross_sales_yoy", "profit_yoy", "period_note"];
writeBlock(trends, 6, 14, matrix(yearly.data, yearlyCols), "YearlyPerformance");
formatMoney(trends, `P7:S${yearly.data.length + 6}`);
formatPct(trends, `T7:U${yearly.data.length + 6}`);
trends.freezePanes.freezeRows(5);
trends.getRange("A:V").format.columnWidth = 15;
trends.getRange("A:A").format.columnWidth = 14;

// Customer and region pivot-style summaries.
title(business, "Customer and Regional Performance", "Refreshable summary tables generated from the processed line-item dataset");
sectionLabel(business, "A5:M5", "Customer segments");
const commonCols = ["customer_segment", "records", "orders", "units", "gross_sales", "net_sales", "discount", "profit", "gross_aov", "net_aov", "profit_margin_net", "late_delivery_rate_row"];
writeBlock(business, 6, 1, matrix(segment.data, commonCols), "SegmentSummary");
formatMoney(business, `E7:J${segment.data.length + 6}`);
formatPct(business, `K7:L${segment.data.length + 6}`);
sectionLabel(business, "A12:M12", "Markets");
const marketCols = ["market", "records", "orders", "units", "gross_sales", "net_sales", "discount", "profit", "gross_aov", "net_aov", "profit_margin_net", "late_delivery_rate_row"];
writeBlock(business, 13, 1, matrix(market.data, marketCols), "MarketSummary");
formatMoney(business, `E14:J${market.data.length + 13}`);
formatPct(business, `K14:L${market.data.length + 13}`);
sectionLabel(business, "A22:M22", "Order regions");
const regionRows = [...region.data].sort((a, b) => b.gross_sales - a.gross_sales);
const regionCols = ["order_region", "records", "orders", "gross_sales", "net_sales", "profit", "gross_aov", "profit_margin_net", "late_delivery_rate_row"];
writeBlock(business, 23, 1, matrix(regionRows, regionCols), "RegionSummary");
formatMoney(business, `D24:G${regionRows.length + 23}`);
formatPct(business, `H24:I${regionRows.length + 23}`);
business.freezePanes.freezeRows(5);
business.getRange("A:M").format.columnWidth = 15;
business.getRange("A:A").format.columnWidth = 20;

// Shipping and delivery operations.
title(shippingSheet, "Shipping and Delivery Performance", "Order-grain shipping metrics avoid line-count weighting");
sectionLabel(shippingSheet, "A5:N5", "Shipping modes");
const shipCols = ["shipping_mode", "orders", "gross_sales", "net_sales", "profit", "late_orders", "avg_actual_shipping_days", "avg_scheduled_shipping_days", "avg_shipping_variance_days", "late_delivery_rate_order", "gross_aov", "net_aov", "profit_margin_net"];
writeBlock(shippingSheet, 6, 1, matrix(shippingSorted, shipCols), "ShippingModeSummary");
formatMoney(shippingSheet, `C7:E${shipping.data.length + 6}`);
formatMoney(shippingSheet, `K7:L${shipping.data.length + 6}`);
shippingSheet.getRange(`G7:I${shipping.data.length + 6}`).format.numberFormat = "0.00";
formatPct(shippingSheet, `J7:J${shipping.data.length + 6}`);
formatPct(shippingSheet, `M7:M${shipping.data.length + 6}`);
sectionLabel(shippingSheet, "A14:N14", "Delivery status");
const deliveryCols = ["delivery_status", "orders", "gross_sales", "net_sales", "profit", "late_orders", "avg_actual_shipping_days", "avg_scheduled_shipping_days", "avg_shipping_variance_days", "late_delivery_rate_order", "gross_aov", "net_aov", "profit_margin_net"];
writeBlock(shippingSheet, 15, 1, matrix(delivery.data, deliveryCols), "DeliveryStatusSummary");
formatMoney(shippingSheet, `C16:E${delivery.data.length + 15}`);
formatMoney(shippingSheet, `K16:L${delivery.data.length + 15}`);
shippingSheet.getRange(`G16:I${delivery.data.length + 15}`).format.numberFormat = "0.00";
formatPct(shippingSheet, `J16:J${delivery.data.length + 15}`);
formatPct(shippingSheet, `M16:M${delivery.data.length + 15}`);
shippingSheet.getRange(`I7:I${shipping.data.length + 6}`).conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 0, format: { fill: COLORS.warningFill, font: { color: COLORS.warning, bold: true } } });
shippingSheet.freezePanes.freezeRows(5);
shippingSheet.getRange("A:N").format.columnWidth = 15;
shippingSheet.getRange("A:A").format.columnWidth = 20;

// Products and categories.
title(productsSheet, "Product and Category Performance", "Rankings use gross sales; profitability uses net sales as the denominator");
const sortedProducts = [...products.data].sort((a, b) => b.gross_sales - a.gross_sales);
const bottomProducts = [...products.data].sort((a, b) => a.profit - b.profit).slice(0, 10);
sectionLabel(productsSheet, "A5:K5", "Top 15 products by gross sales");
const prodCols = ["product_id", "product_name", "category_name", "records", "orders", "units", "gross_sales", "net_sales", "profit", "profit_margin_net", "late_delivery_rate_row"];
writeBlock(productsSheet, 6, 1, matrix(sortedProducts.slice(0, 15), prodCols), "TopProducts");
formatMoney(productsSheet, "G7:I21");
formatPct(productsSheet, "J7:K21");
sectionLabel(productsSheet, "M5:W5", "Bottom 10 products by profit");
writeBlock(productsSheet, 6, 13, matrix(bottomProducts, prodCols), "BottomProducts");
formatMoney(productsSheet, "S7:U16");
formatPct(productsSheet, "V7:W16");
sectionLabel(productsSheet, "A25:K25", "Top 15 categories by gross sales");
const catCols = ["category_name", "records", "orders", "units", "gross_sales", "net_sales", "discount", "profit", "gross_aov", "profit_margin_net", "late_delivery_rate_row"];
writeBlock(productsSheet, 26, 1, matrix(topCategories.concat([...categories.data].sort((a, b) => b.gross_sales - a.gross_sales).slice(8, 15)), catCols), "TopCategories");
formatMoney(productsSheet, "E27:I41");
formatPct(productsSheet, "J27:K41");
productsSheet.freezePanes.freezeRows(5);
productsSheet.getRange("A:W").format.columnWidth = 14;
productsSheet.getRange("B:B").format.columnWidth = 38;
productsSheet.getRange("M:M").format.columnWidth = 14;
productsSheet.getRange("N:N").format.columnWidth = 38;

// Metrics validation.
title(validationSheet, "Metrics Validation", "Every headline claim is recalculated from the processed source");
writeBlock(validationSheet, 5, 1, matrix(validation.data, validation.headers), "MetricsValidation");
validationSheet.getRange("A5:E11").format.wrapText = true;
validationSheet.getRange("A:E").format.columnWidth = 24;
validationSheet.getRange("D:D").format.columnWidth = 44;
validationSheet.getRange("E:E").format.columnWidth = 58;
validationSheet.getRange("C6:C7").format.numberFormat = "#,##0";
validationSheet.getRange("C8:C9").format.numberFormat = "$#,##0.00";
validationSheet.getRange("C10").format.numberFormat = "0.00%";
validationSheet.getRange("C11").format.numberFormat = "$#,##0.00";
validationSheet.freezePanes.freezeRows(5);

// Data quality.
title(qualitySheet, "Data Quality Assessment", "Checks cover grain, completeness, monetary consistency, and operational fields");
writeBlock(qualitySheet, 5, 1, matrix(quality.data, quality.headers), "DataQualityChecks");
qualitySheet.getRange("A5:E20").format.wrapText = true;
qualitySheet.getRange("A:E").format.columnWidth = 24;
qualitySheet.getRange("E:E").format.columnWidth = 58;
qualitySheet.getRange("D6:D20").conditionalFormats.add("containsText", { text: "Documented", format: { fill: COLORS.warningFill, font: { color: COLORS.warning, bold: true } } });
qualitySheet.freezePanes.freezeRows(5);

// Data dictionary.
title(dictionarySheet, "Data Dictionary", "Original DataCo field definitions");
writeBlock(dictionarySheet, 5, 1, dictionaryRows, "SourceDataDictionary");
dictionarySheet.getRange(`A5:B${dictionaryRows.length + 4}`).format.wrapText = true;
dictionarySheet.getRange("A:A").format.columnWidth = 34;
dictionarySheet.getRange("B:B").format.columnWidth = 90;
dictionarySheet.freezePanes.freezeRows(5);

// Workbook guidance.
title(readmeSheet, "Workbook Guide", "Definitions, scope, and refresh notes");
const guide = [
  ["Purpose", "Interactive portfolio dashboard for DataCo supply-chain performance."],
  ["Source grain", "One row per order item. Order Item Id is unique; Order Id repeats across line items."],
  ["Gross sales", "Sum of source Sales after cent rounding. This reproduces the $36.78M resume claim."],
  ["Net sales", "Sum of Order Item Total after discounts: $33.05M."],
  ["Profit", "Sum of Order Profit Per Order, which behaves as line-item profit in this file."],
  ["Gross AOV", "Gross sales divided by distinct Order Id. Correct rounded value: $559.45."],
  ["Late Delivery %", "Dashboard headline uses row-level risk to reproduce 54.83%; Shipping tab also shows order-level 54.82%."],
  ["Filters", "Market and Customer Segment dropdowns update KPI cards and the monthly gross-sales chart."],
  ["Summary tables", "Pivot-style summary tables are precomputed by the reproducible Python pipeline. Native PivotTable/slicer export is not reliable in the authoring engine, so dropdown filters and formula-linked charts are used."],
  ["Period caveat", "2018 contains January only. Annual trend comparisons should use complete 2015-2017 years."],
  ["Privacy", "Names, email, password, street, coordinates, and product-image URLs are excluded from processed/dashboard data."],
  ["Refresh", "Run scripts/build_data_assets.py, scripts/run_sql_analysis.py, scripts/derive_insights.py, then scripts/build_excel_dashboard.mjs."],
];
writeBlock(readmeSheet, 5, 1, [["Topic", "Definition"], ...guide], "WorkbookGuide");
readmeSheet.getRange("A5:B17").format.wrapText = true;
readmeSheet.getRange("A:A").format.columnWidth = 24;
readmeSheet.getRange("B:B").format.columnWidth = 105;

workbook.recalculate();
const inspection = await workbook.inspect({
  kind: "table",
  range: "Dashboard!A1:N20",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 14,
  maxChars: 9000,
});
console.log(inspection.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await fs.mkdir(previewDir, { recursive: true });
for (const sheetName of ["Dashboard", "Monthly Trends", "Customer & Region", "Shipping", "Products", "Metrics Validation", "Data Quality", "Dashboard Data", "Data Dictionary", "ReadMe"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const safeName = sheetName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  await fs.writeFile(path.join(previewDir, `${safeName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, previewDir }));
