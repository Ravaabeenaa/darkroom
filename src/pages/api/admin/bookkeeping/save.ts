export const prerender = false;

type Env = { darkroom_db: D1Database };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = (locals.runtime.env as Env).darkroom_db;
  const body = await request.json().catch(() => null);

  const type = String(body?.type ?? "expense");
  if (type !== "income" && type !== "expense") return json({ ok: false, error: "Invalid type" }, 400);

  const name = String(body?.name ?? "").trim();
  if (!name) return json({ ok: false, error: "Name is required" }, 400);

  const service_id = String(body?.service_id ?? "").trim() || null;
  const amount_cents = Math.round(Number(body?.amount ?? 0) * 100);
  const quantity = Math.max(1, parseInt(String(body?.quantity ?? "1"), 10) || 1);
  const total_cents = amount_cents * quantity;
  const occurred_at = String(body?.occurred_at ?? "").trim() || new Date().toISOString().slice(0, 10);
  const notes = String(body?.notes ?? "").trim() || null;

  if (!Number.isFinite(amount_cents)) return json({ ok: false, error: "Invalid amount" }, 400);

  const id = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO bookkeeping (id, type, service_id, name, amount_cents, quantity, total_cents, order_id, notes, occurred_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, datetime('now'), datetime('now'))
    `)
    .bind(id, type, service_id, name, amount_cents, quantity, total_cents, notes, occurred_at)
    .run();

  // Expense tied to a stock-tracked service: restocking — bump stock + total_stock.
  let stockUpdated = false;
  if (type === "expense" && service_id) {
    const svc = await db.prepare(`SELECT stock FROM services WHERE id = ?`).bind(service_id).first<{ stock: number }>();
    if (svc && svc.stock !== -1) {
      await db
        .prepare(`
          UPDATE services
          SET stock = stock + ?,
              total_stock = total_stock + ?,
              out_of_stock = CASE WHEN (stock + ?) = 0 THEN 1 WHEN (stock + ?) > 0 THEN 0 ELSE out_of_stock END,
              updated_at = datetime('now')
          WHERE id = ?
        `)
        .bind(quantity, quantity, quantity, quantity, service_id)
        .run();
      stockUpdated = true;
    }
  }

  return json({ ok: true, id, stockUpdated });
}
