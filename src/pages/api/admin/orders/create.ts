export const prerender = false;

type Env = { darkroom_db: D1Database };

function onlyDigits(s: string) {
  return /^[0-9]+$/.test(s);
}

function makeOrderRef(last: string | null, yy: string, mm: string) {
  let next = 1;
  if (last) {
    const m = last.match(/DR-(\d{2})(\d{2})-(\d{3})/);
    if (m && m[1] === yy && m[2] === mm) next = Number(m[3]) + 1;
  }
  return `DR-${yy}${mm}-${String(next).padStart(3, "0")}`;
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const body = await request.json().catch(() => null);

  const customer_name = String(body?.customer?.name ?? "").trim();
  const customer_phone = String(body?.customer?.phone ?? "").trim();
  const contact_method = String(body?.customer?.contact_method ?? "").trim(); // Telegram/Viber/WhatsApp
  const customer_email = String(body?.customer?.email ?? "").trim();
  const customer_notes = String(body?.customer?.notes ?? "").trim();

  const items = Array.isArray(body?.items) ? body.items : [];

  if (!customer_name) return new Response(JSON.stringify({ ok: false, error: "Name is required" }), { status: 400 });
  if (!customer_phone || !onlyDigits(customer_phone)) return new Response(JSON.stringify({ ok: false, error: "Phone must be digits only" }), { status: 400 });
  if (!["Telegram", "Viber", "WhatsApp"].includes(contact_method)) return new Response(JSON.stringify({ ok: false, error: "Invalid contact method" }), { status: 400 });

  if (!items.length) return new Response(JSON.stringify({ ok: false, error: "Cart is empty" }), { status: 400 });

  // Normalize items
  const norm = items
    .map((it: any) => ({ id: String(it.id ?? "").trim(), qty: Math.max(0, Math.floor(Number(it.qty ?? 0))) }))
    .filter((it: any) => it.id && it.qty > 0);

  if (!norm.length) return new Response(JSON.stringify({ ok: false, error: "Cart is empty" }), { status: 400 });

  // Fetch services to compute totals (secure)
  const ids = norm.map((x: any) => x.id);
  const placeholders = ids.map(() => "?").join(",");

  const svcRes = await db.prepare(`
    SELECT id, name, price_cents, service_group
    FROM services
    WHERE active = 1 AND id IN (${placeholders});
  `).bind(...ids).all<{ id: string; name: string; price_cents: number; service_group: string | null }>();

  const svcs = new Map((svcRes.results ?? []).map((s) => [s.id, s]));
  const missing = norm.filter((x: any) => !svcs.has(x.id));
  if (missing.length) {
    return new Response(JSON.stringify({ ok: false, error: "Some items are unavailable", missing: missing.map((m: any) => m.id) }), { status: 400 });
  }

  let total = 0;
  const orderItems: any[] = [];
  for (const it of norm) {
    const s = svcs.get(it.id)!;
    const line = s.price_cents * it.qty;
    total += line;
    orderItems.push({
      service_id: s.id,
      service_name: s.name,
      unit_price_cents: s.price_cents,
      quantity: it.qty,
      line_total_cents: line,
      service_group: s.service_group ?? null,
    });
  }

  const services_summary = orderItems.map((x) => `${x.service_name} x${x.quantity}`).join(", ");

  // Order ref
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const prefix = `DR-${yy}${mm}-`;

  const lastRow = await db.prepare(`
    SELECT order_ref
    FROM orders
    WHERE order_ref LIKE ?
    ORDER BY order_ref DESC
    LIMIT 1;
  `).bind(prefix + "%").first<{ order_ref: string }>();

  const order_ref = makeOrderRef(lastRow?.order_ref ?? null, yy, mm);

  const order_id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Insert order
  await db.prepare(`
    INSERT INTO orders
      (id, order_ref, customer_name, customer_phone, services_summary, total_price_cents, status,
       customer_notes, internal_notes, created_at, updated_at, contact_method, customer_email)
    VALUES
      (?, ?, ?, ?, ?, ?, 'NEW', ?, '', ?, ?, ?, ?);
  `).bind(
    order_id,
    order_ref,
    customer_name,
    customer_phone,
    services_summary,
    total,
    customer_notes || null,
    now,
    now,
    contact_method,
    customer_email || null
  ).run();

  // Insert order items
  for (const oi of orderItems) {
    await db.prepare(`
      INSERT INTO order_items
        (id, order_id, service_id, service_name, unit_price_cents, quantity, line_total_cents, service_group)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?);
    `).bind(
      crypto.randomUUID(),
      order_id,
      oi.service_id,
      oi.service_name,
      oi.unit_price_cents,
      oi.quantity,
      oi.line_total_cents,
      oi.service_group
    ).run();
  }

  return new Response(JSON.stringify({
    ok: true,
    order: {
      id: order_id,
      order_ref,
      created_at: now,
      customer_name,
      customer_phone,
      contact_method,
      customer_email: customer_email || null,
      customer_notes: customer_notes || null,
      total_price_cents: total,
      status: "NEW",
    },
    items: orderItems,
  }), { headers: { "content-type": "application/json" }});
}