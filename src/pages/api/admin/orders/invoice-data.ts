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
};

type ItemRow = {
  service_name: string;
  service_group: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
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
              contact_method, total_price_cents, status, created_at
       FROM orders WHERE id = ? LIMIT 1;`
    )
    .bind(id)
    .first<OrderRow>();

  if (!order) {
    return new Response(JSON.stringify({ ok: false, error: "Order not found" }), { status: 404 });
  }

  const { results } = await db
    .prepare(
      `SELECT service_name, service_group, quantity, unit_price_cents, line_total_cents
       FROM order_items WHERE order_id = ? ORDER BY service_group ASC, service_name ASC;`
    )
    .bind(id)
    .all<ItemRow>();

  return new Response(JSON.stringify({ ok: true, order, items: results ?? [] }), {
    headers: { "content-type": "application/json" },
  });
}
