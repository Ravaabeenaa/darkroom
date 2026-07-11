export const prerender = false;

type Env = { darkroom_db: D1Database };

type OrderRow = {
  id: string;
  order_ref: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  contact_method: string | null;
  total_price_cents: number;
  status: string;
  created_at: string | null;
  collection_option: string | null;
  delivery_address: string | null;
};

type ItemRow = {
  service_id: string | null;
  service_name: string;
  service_group: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  selected_options: string | null;
};

type DiscountRow = {
  id: string;
  label: string;
  scope: string;
  scope_ref: string | null;
  amount_type: string;
  amount: number;
  computed_cents: number;
};

export async function GET({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();

  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  }

  const order = await db
    .prepare(
      `SELECT id, order_ref, customer_name, customer_phone, customer_email,
              contact_method, total_price_cents, status, created_at,
              collection_option, delivery_address
       FROM orders WHERE id = ? LIMIT 1;`
    )
    .bind(id)
    .first<OrderRow>();

  if (!order) {
    return new Response(JSON.stringify({ ok: false, error: "Order not found" }), { status: 404 });
  }

  const [itemsRes, discountsRes] = await Promise.all([
    db.prepare(
      `SELECT service_id, service_name, service_group, quantity, unit_price_cents, line_total_cents, selected_options
       FROM order_items WHERE order_id = ?
       ORDER BY
         CASE WHEN line_total_cents < 0 THEN 2 WHEN service_id IS NULL THEN 1 ELSE 0 END ASC,
         service_group ASC, service_name ASC;`
    ).bind(id).all<ItemRow>(),
    db.prepare(
      `SELECT id, label, scope, scope_ref, amount_type, amount, computed_cents
       FROM order_discounts WHERE order_id = ? ORDER BY created_at ASC;`
    ).bind(id).all<DiscountRow>(),
  ]);

  const discountItems = (discountsRes.results ?? []).map((d) => ({
    service_id: null,
    service_name: d.label,
    service_group: null,
    quantity: null,
    unit_price_cents: 0,
    line_total_cents: -d.computed_cents,
  }));

  const items = itemsRes.results ?? [];

  // The collection line item is only stored in order_items when it carries a
  // charge (see orders/create.ts). Free/waived options (Pickup, waived bulk
  // delivery) have no row, so synthesize one here — the invoice should always
  // show what the customer chose. The delivery address always comes from
  // orders.delivery_address (falling back to whatever's on the row for older
  // orders created before that column existed).
  const collectionItem = items.find((it) => it.service_id === null && it.service_name.startsWith("Collection: "));
  if (collectionItem) {
    collectionItem.service_group = order.delivery_address || collectionItem.service_group || null;
  } else if (order.collection_option) {
    items.push({
      service_id: null,
      service_name: `Collection: ${order.collection_option}`,
      service_group: order.delivery_address || null,
      quantity: 1,
      unit_price_cents: 0,
      line_total_cents: 0,
      selected_options: null,
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    order,
    items: [...items, ...discountItems],
    discounts: discountsRes.results ?? [],
  }), {
    headers: { "content-type": "application/json" },
  });
}
