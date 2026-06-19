export const prerender = false;

import { SERVICE_COLUMNS, type ServiceColDef } from "../../../../lib/service-columns";
import { parseCSV, resolveCell } from "../../../../lib/csv";

type Env = { darkroom_db: D1Database };

const COL_BY_KEY = new Map(SERVICE_COLUMNS.map((c) => [c.key, c]));

type Resolved = { isNull: boolean; isBlank: boolean; value: string };
type BoundEntry = { isNull: boolean; isBlank: boolean; bound: string | number | null };

function coerceForBind(
  col: ServiceColDef,
  resolved: Resolved
): { ok: true; value: string | number | null } | { ok: false; error: string } {
  if (resolved.isNull) return { ok: true, value: null };
  if (col.type === "integer") {
    const t = resolved.value.trim();
    if (!/^-?\d+$/.test(t)) return { ok: false, error: `"${col.key}" is not a valid integer ("${resolved.value}")` };
    return { ok: true, value: parseInt(t, 10) };
  }
  return { ok: true, value: resolved.value };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = (locals.runtime.env as Env).darkroom_db;
  const body = await request.json().catch(() => null);
  const mode = String(body?.mode ?? "");
  const csvText = String(body?.csv ?? "");

  if (mode !== "overwrite" && mode !== "merge")
    return json({ ok: false, error: "Mode must be 'overwrite' or 'merge'" }, 400);
  if (!csvText.trim())
    return json({ ok: false, error: "CSV is empty" }, 400);

  const table = parseCSV(csvText);
  if (table.length < 1)
    return json({ ok: false, error: "No header row found" }, 400);

  const header = table[0].map((c) => c.value.trim());
  const dataRows = table.slice(1);

  if (!header.includes("id"))
    return json({ ok: false, error: "CSV must include an 'id' column" }, 400);

  const headerCols: (ServiceColDef | null)[] = header.map((h) => COL_BY_KEY.get(h) ?? null);
  const unknownCols = header.filter((h) => !COL_BY_KEY.has(h));

  const errors: { row: number; message: string }[] = [];
  let inserted = 0, updated = 0, deleted = 0, skipped = 0;

  type ParsedRow = { rowNum: number; id: string; values: Map<string, BoundEntry> };
  const parsedRows: ParsedRow[] = [];

  for (let r = 0; r < dataRows.length; r++) {
    const rowNum = r + 2; // 1-indexed, +1 for header row
    const cells = dataRows[r];
    if (cells.length === 1 && cells[0].value === "" && !cells[0].quoted) continue; // blank line

    const values = new Map<string, BoundEntry>();
    let rowError: string | null = null;

    for (let c = 0; c < header.length; c++) {
      const col = headerCols[c];
      if (!col) continue; // unknown column, ignored
      const cell = cells[c] ?? { value: "", quoted: false };
      const resolved = resolveCell(cell);
      const coerced = coerceForBind(col, resolved);
      if (!coerced.ok) { rowError = coerced.error; break; }
      values.set(col.key, { isNull: resolved.isNull, isBlank: resolved.isBlank, bound: coerced.value });
    }

    if (rowError) { errors.push({ row: rowNum, message: rowError }); skipped++; continue; }

    const idEntry = values.get("id");
    const idVal = idEntry && !idEntry.isNull && !idEntry.isBlank ? String(idEntry.bound).trim() : "";
    if (!idVal) { errors.push({ row: rowNum, message: "Missing 'id' value" }); skipped++; continue; }

    if (mode === "overwrite") {
      const nameEntry = values.get("name");
      const nameVal = nameEntry && !nameEntry.isNull && !nameEntry.isBlank ? String(nameEntry.bound).trim() : "";
      if (!nameVal) {
        errors.push({ row: rowNum, message: "Missing 'name' value (required column)" });
        skipped++;
        continue;
      }
    }

    parsedRows.push({ rowNum, id: idVal, values });
  }

  // Overwrite is destructive (deletes services absent from the file) — require
  // a fully clean file before touching the DB rather than partially applying.
  if (mode === "overwrite" && errors.length > 0) {
    return json({ ok: false, error: "Fix the errors below and re-upload. No changes were made.", errors, unknownCols }, 400);
  }

  if (parsedRows.length === 0) {
    return json({ ok: false, error: "No valid rows to import", errors, unknownCols }, 400);
  }

  if (mode === "overwrite") {
    const incomingIds = new Set(parsedRows.map((p) => p.id));
    const existing = await db.prepare(`SELECT id FROM services`).all<{ id: string }>();
    const toDelete = (existing.results ?? []).map((r) => r.id).filter((id) => !incomingIds.has(id));
    for (const id of toDelete) {
      await db.prepare(`DELETE FROM services WHERE id = ?`).bind(id).run();
      deleted++;
    }
  }

  const existingNow = await db.prepare(`SELECT id FROM services`).all<{ id: string }>();
  const existingIdSet = new Set((existingNow.results ?? []).map((r) => r.id));

  for (const { rowNum, id, values } of parsedRows) {
    const isExisting = existingIdSet.has(id);
    const setCols: string[] = [];
    const setVals: (string | number | null)[] = [];
    const insertCols: string[] = ["id"];
    const insertVals: (string | number | null)[] = [id];

    for (const col of SERVICE_COLUMNS) {
      if (col.key === "id") continue;
      const v = values.get(col.key);
      if (!v) continue; // column not present in this CSV at all

      if (mode === "merge" && v.isBlank) continue; // blank = keep existing / no opinion

      const bound = v.isBlank ? null : v.bound; // overwrite mode writes NULL for blank explicitly
      setCols.push(col.key);
      setVals.push(bound);
      insertCols.push(col.key);
      insertVals.push(bound);
    }

    try {
      if (isExisting) {
        if (setCols.length === 0) continue; // nothing to change
        const sql = `UPDATE services SET ${setCols.map((c) => `${c}=?`).join(", ")}, updated_at=datetime('now') WHERE id=?`;
        await db.prepare(sql).bind(...setVals, id).run();
        updated++;
      } else {
        const sql = `INSERT INTO services (${insertCols.join(", ")}, updated_at) VALUES (${insertCols.map(() => "?").join(", ")}, datetime('now'))`;
        await db.prepare(sql).bind(...insertVals).run();
        existingIdSet.add(id);
        inserted++;
      }
    } catch (e: any) {
      errors.push({ row: rowNum, message: `Database error for id "${id}": ${e?.message ?? String(e)}` });
      skipped++;
    }
  }

  return json({ ok: true, mode, inserted, updated, deleted, skipped, errors, unknownCols });
}
