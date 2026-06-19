export const prerender = false;

type Env = { darkroom_db: D1Database };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = (locals.runtime.env as Env).darkroom_db;
  const body = await request.json().catch(() => null);

  const id = String(body?.id ?? "").trim();
  const field = String(body?.field ?? "");
  const value = Number(body?.value);

  if (!id) return json({ ok: false, error: "Missing id" }, 400);
  if (field !== "stock" && field !== "total_stock") return json({ ok: false, error: "Invalid field" }, 400);
  if (!Number.isFinite(value)) return json({ ok: false, error: "Invalid value" }, 400);

  if (field === "total_stock") {
    const v = Math.max(0, Math.round(value));
    await db
      .prepare(`UPDATE services SET total_stock = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(v, id)
      .run();
    return json({ ok: true, value: v });
  }

  // field === "stock" — -1 is the "not tracked" sentinel; otherwise floor at 0.
  let v = Math.round(value);
  if (v !== -1) v = Math.max(0, v);

  await db
    .prepare(`
      UPDATE services
      SET stock = ?,
          out_of_stock = CASE WHEN ? = 0 THEN 1 WHEN ? > 0 THEN 0 ELSE out_of_stock END,
          updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(v, v, v, id)
    .run();

  return json({ ok: true, value: v });
}
