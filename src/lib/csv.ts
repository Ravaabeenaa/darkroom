// Minimal RFC4180-ish CSV parser/writer with one deliberate extension:
// an unquoted bare "NULL" token round-trips as SQL NULL, distinct from an
// empty ("") field which round-trips as "blank" (meaning differs by import mode
// — see src/pages/api/admin/services/import.ts).

export type CsvCell = { value: string; quoted: boolean };

export function parseCSV(text: string): CsvCell[][] {
  const rows: CsvCell[][] = [];
  let row: CsvCell[] = [];
  let field = "";
  let quoted = false;
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  function pushField() {
    row.push({ value: field, quoted });
    field = "";
    quoted = false;
  }
  function pushRow() {
    pushField();
    rows.push(row);
    row = [];
  }

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"' && field === "") { inQuotes = true; quoted = true; i++; continue; }
    if (c === ",") { pushField(); i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { pushRow(); i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) pushRow();

  // Drop a single trailing wholly-empty row caused by a final newline
  if (rows.length && rows[rows.length - 1].length === 1) {
    const last = rows[rows.length - 1][0];
    if (last.value === "" && !last.quoted) rows.pop();
  }
  return rows;
}

export function resolveCell(cell: CsvCell): { isNull: boolean; isBlank: boolean; value: string } {
  if (!cell.quoted && cell.value === "NULL") return { isNull: true, isBlank: false, value: "" };
  if (cell.value === "") return { isNull: false, isBlank: true, value: "" };
  return { isNull: false, isBlank: false, value: cell.value };
}

function escapeCell(value: string | number | null): string {
  if (value === null) return "NULL";
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function buildCSV(headers: string[], rows: (string | number | null)[][]): string {
  const lines: string[] = [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",")];
  for (const r of rows) lines.push(r.map(escapeCell).join(","));
  return lines.join("\r\n");
}
