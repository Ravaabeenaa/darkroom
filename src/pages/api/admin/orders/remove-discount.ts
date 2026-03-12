export const prerender = false;

type Env = { darkroom_db: D1Database };

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const body = await request.json().catch(() => null);
  const discount_id = String(body?.discount_id ?? "").trim();
  const order_id    = String(body?.order_id    ?? "").trim();

  if (!discount_id || !order_id)
    return new Response(JSON.stringify({ ok: false, error: "Missing discount_id or order_id" }), { status: 400, headers: { "content-type": "application/json" } });

  await db.prepare(`DELETE FROM order_discounts WHERE id = ? AND order_id = ?`).bind(discount_id, order_id).run();

  // Recalculate order total: item sum − remaining discounts
  const itemSum = await db.prepare(`SELECT COALESCE(SUM(line_total_cents), 0) AS t FROM order_items WHERE order_id = ?`).bind(order_id).first<{ t: number }>();
  const discSum = await db.prepare(`SELECT COALESCE(SUM(computed_cents), 0) AS t FROM order_discounts WHERE order_id = ?`).bind(order_id).first<{ t: number }>();
  const newTotal = (itemSum?.t ?? 0) - (discSum?.t ?? 0);

  await db.prepare(`UPDATE orders SET total_price_cents = ?, updated_at = datetime('now') WHERE id = ?`).bind(newTotal, order_id).run();

  return new Response(JSON.stringify({ ok: true, new_total: newTotal }), {
    headers: { "content-type": "application/json" },
  });
}
