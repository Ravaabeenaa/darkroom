export const prerender = false;

type Env = { darkroom_db: D1Database };

const ALLOWED = new Set(["NEW", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"]);

type OrderItemRow = {
  id: string;
  service_id: string | null;
  service_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const body = await request.json().catch(() => null);
  const order_id = String(body?.order_id ?? "").trim();
  const status = String(body?.status ?? "").trim();
  const internal_notes = body?.internal_notes !== undefined ? String(body.internal_notes) : undefined;
  const sync_stock = body?.sync_stock === true;

  if (!order_id) return json({ ok: false, error: "Missing order_id" }, 400);
  if (!ALLOWED.has(status)) return json({ ok: false, error: "Invalid status" }, 400);

  const orderRow = await db
    .prepare(`SELECT stock_applied FROM orders WHERE id = ?`)
    .bind(order_id)
    .first<{ stock_applied: number }>();
  if (!orderRow) return json({ ok: false, error: "Order not found" }, 404);

  const shouldApplyStock = sync_stock && status === "COMPLETED" && orderRow.stock_applied === 0;

  if (shouldApplyStock) {
    const itemsRes = await db
      .prepare(`SELECT id, service_id, service_name, unit_price_cents, quantity, line_total_cents FROM order_items WHERE order_id = ?`)
      .bind(order_id)
      .all<OrderItemRow>();
    const items = itemsRes.results ?? [];
    const serviceItems = items.filter((it) => it.service_id && it.quantity > 0);

    const serviceIds = [...new Set(serviceItems.map((it) => it.service_id as string))];
    const stockMap = new Map<string, number>();
    if (serviceIds.length > 0) {
      const placeholders = serviceIds.map(() => "?").join(",");
      const stockRes = await db
        .prepare(`SELECT id, stock FROM services WHERE id IN (${placeholders})`)
        .bind(...serviceIds)
        .all<{ id: string; stock: number }>();
      for (const row of stockRes.results ?? []) stockMap.set(row.id, row.stock);
    }

    const shortages = serviceItems
      .filter((it) => {
        const stock = stockMap.get(it.service_id as string);
        return stock !== undefined && stock !== -1 && it.quantity > stock;
      })
      .map((it) => ({
        service_id: it.service_id,
        name: it.service_name,
        requested: it.quantity,
        available: stockMap.get(it.service_id as string) ?? 0,
      }));

    if (shortages.length > 0) {
      return json({ ok: false, error: "insufficient_stock", shortages }, 409);
    }

    // Decrement stock for tracked items
    for (const it of serviceItems) {
      const stock = stockMap.get(it.service_id as string);
      if (stock === undefined || stock === -1) continue;
      await db
        .prepare(`
          UPDATE services
          SET stock = stock - ?,
              out_of_stock = CASE WHEN (stock - ?) = 0 THEN 1 WHEN (stock - ?) > 0 THEN 0 ELSE out_of_stock END,
              updated_at = datetime('now')
          WHERE id = ?
        `)
        .bind(it.quantity, it.quantity, it.quantity, it.service_id)
        .run();
    }

    // One income row per order line item (services, discounts, collection fees) — including
    // zero-value lines, so the order is always traceable in the ledger even if it was free.
    const today = new Date().toISOString().slice(0, 10);
    for (const it of items) {
      await db
        .prepare(`
          INSERT INTO bookkeeping (id, type, service_id, name, amount_cents, quantity, total_cents, order_id, notes, occurred_at, created_at, updated_at)
          VALUES (?, 'income', ?, ?, ?, ?, ?, ?, NULL, ?, datetime('now'), datetime('now'))
        `)
        .bind(crypto.randomUUID(), it.service_id, it.service_name, it.unit_price_cents, it.quantity, it.line_total_cents, order_id, today)
        .run();
    }
  }

  const stockAppliedSet = shouldApplyStock ? `, stock_applied = 1` : "";

  if (internal_notes !== undefined) {
    await db
      .prepare(`UPDATE orders SET status = ?, internal_notes = ?${stockAppliedSet}, updated_at = datetime('now') WHERE id = ?`)
      .bind(status, internal_notes, order_id)
      .run();
  } else {
    await db
      .prepare(`UPDATE orders SET status = ?${stockAppliedSet}, updated_at = datetime('now') WHERE id = ?`)
      .bind(status, order_id)
      .run();
  }

  return json({ ok: true, stockApplied: shouldApplyStock });
}
