export const prerender = false;

import { BOOKKEEPING_COLUMNS, type BookkeepingColDef } from "../../../../lib/bookkeeping-columns";
import { parseCSV, resolveCell } from "../../../../lib/csv";

type Env = { darkroom_db: D1Database };

const COL_BY_KEY = new Map(BOOKKEEPING_COLUMNS.map((c) => [c.key, c]));

type Resolved = { isNull: boolean; isBlank: boolean; value: string };
type BoundEntry = { bound: string | number | null };

function coerceForBind(
  col: BookkeepingColDef,
  resolved: Resolved
): { ok: true; value: string | number | null } | { ok: false; error: string } {
  // This table is append-only on import (no row ever merges into an existing one),
  // so blank and NULL both simply mean "no value" — there's no existing value to preserve.
  if (resolved.isNull || resolved.isBlank) return { ok: true, value: null };
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

  if (!header.includes("type") || !header.includes("name"))
    return json({ ok: false, error: "CSV must include 'type' and 'name' columns" }, 400);

  const headerCols: (BookkeepingColDef | null)[] = header.map((h) => COL_BY_KEY.get(h) ?? null);
  const unknownCols = header.filter((h) => !COL_BY_KEY.has(h));

  const errors: { row: number; message: string }[] = [];
  const today = new Date().toISOString().slice(0, 10);

  type ParsedRow = { rowNum: number; values: Map<string, BoundEntry> };
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
      values.set(col.key, { bound: coerced.value });
    }

    if (rowError) { errors.push({ row: rowNum, message: rowError }); continue; }

    const typeVal = String(values.get("type")?.bound ?? "").trim();
    if (typeVal !== "income" && typeVal !== "expense") {
      errors.push({ row: rowNum, message: `"type" must be "income" or "expense" (got "${typeVal || "blank"}")` });
      continue;
    }

    const nameVal = String(values.get("name")?.bound ?? "").trim();
    if (!nameVal) {
      errors.push({ row: rowNum, message: "Missing 'name' value" });
      continue;
    }

    parsedRows.push({ rowNum, values });
  }

  // Overwrite is destructive (clears the whole table) — require a fully clean file first.
  if (mode === "overwrite" && errors.length > 0) {
    return json({ ok: false, error: "Fix the errors below and re-upload. No changes were made.", errors, unknownCols }, 400);
  }

  if (parsedRows.length === 0) {
    return json({ ok: false, error: "No valid rows to import", errors, unknownCols }, 400);
  }

  let deleted = 0;
  if (mode === "overwrite") {
    const countRow = await db.prepare(`SELECT COUNT(*) AS n FROM bookkeeping`).first<{ n: number }>();
    deleted = countRow?.n ?? 0;
    await db.prepare(`DELETE FROM bookkeeping`).run();
  }

  let inserted = 0, skipped = 0;

  for (const { rowNum, values } of parsedRows) {
    const get = (key: string, fallback: string | number | null) => values.get(key)?.bound ?? fallback;

    // Merge always appends brand-new rows — never reuse a CSV-provided id, to guarantee no
    // collision with existing data. Overwrite re-inserts into an empty table, so the
    // CSV's own id can be kept (nice for round-tripping an export back in).
    const id = mode === "merge" ? crypto.randomUUID() : (get("id", null) ?? crypto.randomUUID());

    try {
      await db
        .prepare(`
          INSERT INTO bookkeeping (id, type, service_id, name, amount_cents, quantity, total_cents, order_id, notes, occurred_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `)
        .bind(
          id,
          get("type", "expense"),
          get("service_id", null),
          get("name", ""),
          get("amount_cents", 0),
          get("quantity", 1),
          get("total_cents", 0),
          get("order_id", null),
          get("notes", null),
          get("occurred_at", today)
        )
        .run();
      inserted++;
    } catch (e: any) {
      errors.push({ row: rowNum, message: `Database error: ${e?.message ?? String(e)}` });
      skipped++;
    }
  }

  return json({ ok: true, mode, inserted, deleted, skipped, errors, unknownCols });
}
