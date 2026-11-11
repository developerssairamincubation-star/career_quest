import ExcelJS from "exceljs";
import Papa from "papaparse";

export const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const LAST_ROW = 1001; // matches the 1000-student import limit

/** The student template: a Teacher dropdown fed by the given teacher names. */
export async function buildTemplate(teachers: string[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Students");
  ws.columns = [
    { header: "email", key: "email", width: 28 },
    { header: "full_name", key: "full_name", width: 22 },
    { header: "roll_no", key: "roll_no", width: 10 },
    { header: "grade", key: "grade", width: 8 },
    { header: "section", key: "section", width: 9 },
    { header: "teacher", key: "teacher", width: 24 },
    { header: "house", key: "house", width: 12 },
    { header: "password", key: "password", width: 14 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.addRow(["asha.k@school.example", "Asha Kumar", "9A01", 9, "A", teachers[0] ?? "", "veera", ""]);
  ws.addRow(["rahul.m@school.example", "Rahul Menon", "9A02", 9, "A", teachers[0] ?? "", "", ""]);

  // The dropdown reads from a hidden sheet, so names with commas work and the list has no length limit.
  const list = wb.addWorksheet("Teachers", { state: "hidden" });
  list.getCell("A1").value = "teachers";
  teachers.forEach((name, i) => (list.getCell(`A${i + 2}`).value = name));
  const source = `Teachers!$A$2:$A$${Math.max(teachers.length + 1, 2)}`;
  // One rule for the whole column. exceljs supports a range here but its typings omit it.
  const rules = ws as unknown as { dataValidations: { add(range: string, rule: ExcelJS.DataValidation): void } };
  rules.dataValidations.add(`F2:F${LAST_ROW}`, {
    type: "list",
    allowBlank: true,
    formulae: [source],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Teacher",
    error: "Pick a teacher from the list. Add new teachers under Classes and staff first.",
  });
  return wb.xlsx.writeBuffer();
}

type Table = { fields: string[]; rows: Record<string, string>[] };

const headerKey = (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_");

/** Reads the first sheet of an .xlsx (the template) or a CSV into header-keyed rows. */
export async function readTable(file: File): Promise<Table> {
  if (!/\.xlsx$/i.test(file.name)) {
    const parsed = Papa.parse<Record<string, string>>(await file.text(), {
      header: true,
      skipEmptyLines: true,
      transformHeader: headerKey,
    });
    return { fields: parsed.meta.fields ?? [], rows: parsed.data };
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.getWorksheet("Students") ?? wb.worksheets[0];
  const fields: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: false }, (c, col) => (fields[col - 1] = headerKey(c.text)));
  const rows: Record<string, string>[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const rec: Record<string, string> = {};
    fields.forEach((f, i) => f && (rec[f] = row.getCell(i + 1).text.trim()));
    if (Object.values(rec).some(Boolean)) rows.push(rec);
  });
  return { fields, rows };
}

