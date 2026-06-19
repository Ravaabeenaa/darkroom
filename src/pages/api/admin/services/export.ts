export const prerender = false;

import { SERVICE_COLUMNS } from "../../../../lib/service-columns";
import { buildCSV } from "../../../../lib/csv";

type Env = { darkroom_db: D1Database };

export async function GET({ locals }: { locals: any }) {
  const db = (locals.runtime.env as Env).darkroom_db;
  const cols = SERVICE_COLUMNS.map((c) => c.key);

  const res = await db
    .prepare(`SELECT ${cols.join(", ")} FROM services ORDER BY id ASC`)
    .all<Record<string, string | number | null>>();

  const rows = (res.results ?? []).map((r) => cols.map((c) => (r[c] === undefined ? null : r[c])));
  const csv = buildCSV(cols, rows);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="services-${date}.csv"`,
    },
  });
}
