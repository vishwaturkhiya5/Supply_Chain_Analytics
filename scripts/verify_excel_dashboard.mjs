import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = process.argv[2];
const previewPath = process.argv[3];
if (!workbookPath || !previewPath) {
  throw new Error("Usage: verify_excel_dashboard.mjs WORKBOOK_XLSX PREVIEW_PNG");
}

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheets = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
console.log(sheets.ndjson);
const dashboard = await workbook.inspect({
  kind: "table",
  range: "Dashboard!A1:N10",
  include: "values,formulas",
  tableMaxRows: 10,
  tableMaxCols: 14,
  maxChars: 6000,
});
console.log(dashboard.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 300 },
  summary: "saved workbook formula error scan",
});
console.log(errors.ndjson);
const preview = await workbook.render({ sheetName: "Dashboard", range: "A1:N67", scale: 1, format: "png" });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
