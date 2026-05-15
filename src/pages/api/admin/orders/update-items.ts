export const prerender = false;

type Env = { darkroom_db: D1Database };

type ItemPatch = {
  id: string;
  qty: number;
  unit_price_cents: number;
};

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const body = await request.json().catch(() => null);
  const order_id = String(body?.order_id ?? "").trim();
  const items: ItemPatch[] = body?.items;

  if (!order_id || !Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "Missing data" }), { status: 400 });
  }

  for (const item of items) {
    if (!item.id || typeof item.qty !== "number" || typeof item.unit_price_cents !== "number") {
      return new Response(JSON.stringify({ ok: false, error: "Invalid item data" }), { status: 400 });
    }
    if (item.qty < 0) {
      return new Response(JSON.stringify({ ok: false, error: "Negative quantity not allowed" }), { status: 400 });
    }
  }

  // Update each item row
  const stmts = items.map((item) =>
    db
      .prepare(
        `UPDATE order_items SET quantity = ?, unit_price_cents = ?, line_total_cents = ? WHERE id = ? AND order_id = ?`
      )
      .bind(item.qty, item.unit_price_cents, item.qty * item.unit_price_cents, item.id, order_id)
  );

  await db.batch(stmts);

  // Recalculate order total and summary from updated items
  const { results } = await db
    .prepare(
      `SELECT service_name, quantity, unit_price_cents, line_total_cents FROM order_items WHERE order_id = ?`
    )
    .bind(order_id)
    .all<{ service_name: string; quantity: number; unit_price_cents: number; line_total_cents: number }>();

  const itemTotal = (results ?? []).reduce((s, r) => s + r.line_total_cents, 0);
  const discountRes = await db.prepare(`SELECT COALESCE(SUM(computed_cents), 0) AS t FROM order_discounts WHERE order_id = ?`).bind(order_id).first<{ t: number }>();
  const newTotal = itemTotal - (discountRes?.t ?? 0);
  const summary = (results ?? [])
    .map((r) => `${r.service_name} x${r.quantity}`)
    .join(", ");

  await db
    .prepare(
      `UPDATE orders SET total_price_cents = ?, services_summary = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .bind(newTotal, summary, order_id)
    .run();

  return new Response(JSON.stringify({ ok: true, total_price_cents: newTotal }), {
    headers: { "content-type": "application/json" },
  });
}
