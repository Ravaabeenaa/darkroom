export const prerender = false;

type Env = { darkroom_db: D1Database };

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const body = await request.json().catch(() => null);
  const order_id   = String(body?.order_id   ?? "").trim();
  const label      = String(body?.label      ?? "").trim();
  const scope      = String(body?.scope      ?? "").trim();
  const scope_ref  = body?.scope_ref ? String(body.scope_ref).trim() : null;
  const amount_type = String(body?.amount_type ?? "").trim();
  const amount_raw  = Number(body?.amount ?? 0);

  if (!order_id || !label)
    return new Response(JSON.stringify({ ok: false, error: "label and order_id are required" }), { status: 400, headers: { "content-type": "application/json" } });

  if (!["total", "group", "item"].includes(scope))
    return new Response(JSON.stringify({ ok: false, error: "scope must be total | group | item" }), { status: 400, headers: { "content-type": "application/json" } });

  if (!["percent", "fixed"].includes(amount_type))
    return new Response(JSON.stringify({ ok: false, error: "amount_type must be percent | fixed" }), { status: 400, headers: { "content-type": "application/json" } });

  if (amount_raw <= 0)
    return new Response(JSON.stringify({ ok: false, error: "amount must be positive" }), { status: 400, headers: { "content-type": "application/json" } });

  if ((scope === "group" || scope === "item") && !scope_ref)
    return new Response(JSON.stringify({ ok: false, error: "scope_ref is required for group/item scope" }), { status: 400, headers: { "content-type": "application/json" } });

  // Store percent as integer, fixed as cents
  const amount = amount_type === "fixed"
    ? Math.round(amount_raw * 100)  // MVR input → cents
    : Math.round(amount_raw);        // already a percent integer

  const orderExists = await db.prepare(`SELECT id FROM orders WHERE id = ? LIMIT 1`).bind(order_id).first<{ id: string }>();
  if (!orderExists)
    return new Response(JSON.stringify({ ok: false, error: "Order not found" }), { status: 404, headers: { "content-type": "application/json" } });

  // Compute base for the discount scope (only sum positive line totals to avoid compounding)
  let base_cents = 0;
  if (scope === "total") {
    const r = await db.prepare(`SELECT COALESCE(SUM(CASE WHEN line_total_cents > 0 THEN line_total_cents ELSE 0 END), 0) AS t FROM order_items WHERE order_id = ?`).bind(order_id).first<{ t: number }>();
    base_cents = r?.t ?? 0;
  } else if (scope === "group") {
    const r = await db.prepare(`SELECT COALESCE(SUM(CASE WHEN line_total_cents > 0 THEN line_total_cents ELSE 0 END), 0) AS t FROM order_items WHERE order_id = ? AND service_group = ?`).bind(order_id, scope_ref).first<{ t: number }>();
    base_cents = r?.t ?? 0;
  } else {
    const r = await db.prepare(`SELECT line_total_cents FROM order_items WHERE id = ? AND order_id = ?`).bind(scope_ref, order_id).first<{ line_total_cents: number }>();
    base_cents = Math.max(0, r?.line_total_cents ?? 0);
  }

  if (base_cents <= 0)
    return new Response(JSON.stringify({ ok: false, error: "No eligible items found for that scope" }), { status: 400, headers: { "content-type": "application/json" } });

  const computed_cents = amount_type === "percent"
    ? Math.round(base_cents * amount / 100)
    : Math.min(amount, base_cents); // cap fixed discount at scope base

  if (computed_cents <= 0)
    return new Response(JSON.stringify({ ok: false, error: "Computed discount is zero" }), { status: 400, headers: { "content-type": "application/json" } });

  const discount_id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO order_discounts (id, order_id, label, scope, scope_ref, amount_type, amount, computed_cents, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `).bind(discount_id, order_id, label, scope, scope_ref, amount_type, amount, computed_cents, now).run();

  // Recalculate order total: item sum − all discounts
  const itemSum = await db.prepare(`SELECT COALESCE(SUM(line_total_cents), 0) AS t FROM order_items WHERE order_id = ?`).bind(order_id).first<{ t: number }>();
  const discSum = await db.prepare(`SELECT COALESCE(SUM(computed_cents), 0) AS t FROM order_discounts WHERE order_id = ?`).bind(order_id).first<{ t: number }>();
  const newTotal = (itemSum?.t ?? 0) - (discSum?.t ?? 0);

  await db.prepare(`UPDATE orders SET total_price_cents = ?, updated_at = datetime('now') WHERE id = ?`).bind(newTotal, order_id).run();

  return new Response(JSON.stringify({
    ok: true,
    discount: { id: discount_id, label, scope, scope_ref, amount_type, amount, computed_cents },
    new_total: newTotal,
  }), { headers: { "content-type": "application/json" } });
}
