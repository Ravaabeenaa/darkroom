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
  const env = locals.runtime.env as Env & {
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
  };
  const db = env.darkroom_db;

  const body = await request.json().catch(() => null);

  // cart.astro sends flat fields + a cart map { [service_id]: qty }
  const customer_name = String(body?.customer_name ?? "").trim();
  const customer_phone = String(body?.customer_phone ?? "").trim();
  const contact_method = String(body?.contact_method ?? "").trim();
  const customer_email = String(body?.customer_email ?? "").trim();
  const customer_notes = String(body?.customer_notes ?? "").trim();
  const cart = body?.cart && typeof body.cart === "object" ? body.cart : null;

  if (!customer_name)
    return new Response(JSON.stringify({ ok: false, error: "Name is required" }), { status: 400, headers: { "content-type": "application/json" } });

  if (!customer_phone || !onlyDigits(customer_phone))
    return new Response(JSON.stringify({ ok: false, error: "Phone must be digits only" }), { status: 400, headers: { "content-type": "application/json" } });

  if (!["Telegram", "Viber", "WhatsApp"].includes(contact_method))
    return new Response(JSON.stringify({ ok: false, error: "Invalid contact method" }), { status: 400, headers: { "content-type": "application/json" } });

  if (!cart)
    return new Response(JSON.stringify({ ok: false, error: "Cart is empty" }), { status: 400, headers: { "content-type": "application/json" } });

  // Normalise cart map → items array
  const norm = Object.entries(cart)
    .map(([id, qty]) => ({ id: String(id).trim(), qty: Math.max(0, Math.floor(Number(qty ?? 0))) }))
    .filter((it) => it.id && it.qty > 0);

  if (!norm.length)
    return new Response(JSON.stringify({ ok: false, error: "Cart is empty" }), { status: 400, headers: { "content-type": "application/json" } });

  // Fetch services server-side to compute totals
  const ids = norm.map((x) => x.id);
  const placeholders = ids.map(() => "?").join(",");

  const svcRes = await db
    .prepare(`SELECT id, name, price_cents, service_group FROM services WHERE active = 1 AND id IN (${placeholders});`)
    .bind(...ids)
    .all<{ id: string; name: string; price_cents: number; service_group: string | null }>();

  const svcs = new Map((svcRes.results ?? []).map((s) => [s.id, s]));
  const missing = norm.filter((x) => !svcs.has(x.id));
  if (missing.length)
    return new Response(JSON.stringify({ ok: false, error: "Some items are unavailable", missing: missing.map((m) => m.id) }), { status: 400, headers: { "content-type": "application/json" } });

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

  // Generate order ref
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const prefix = `DR-${yy}${mm}-`;

  const lastRow = await db
    .prepare(`SELECT order_ref FROM orders WHERE order_ref LIKE ? ORDER BY order_ref DESC LIMIT 1;`)
    .bind(prefix + "%")
    .first<{ order_ref: string }>();

  const order_ref = makeOrderRef(lastRow?.order_ref ?? null, yy, mm);
  const order_id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Insert order — set original_* snapshot columns at creation time
  await db
    .prepare(`
      INSERT INTO orders
        (id, order_ref, customer_name, customer_phone, services_summary,
         total_price_cents, status, customer_notes, internal_notes,
         created_at, updated_at, contact_method, customer_email,
         original_services_summary, original_total_price_cents)
      VALUES
        (?, ?, ?, ?, ?, ?, 'NEW', ?, '', ?, ?, ?, ?, ?, ?);
    `)
    .bind(
      order_id, order_ref,
      customer_name, customer_phone, services_summary,
      total,
      customer_notes || null,
      now, now,
      contact_method,
      customer_email || null,
      services_summary,  // original snapshot
      total              // original snapshot
    )
    .run();

  // Insert into both order_items (current/mutable) and order_items_original (immutable)
  for (const oi of orderItems) {
    await db
      .prepare(`
        INSERT INTO order_items
          (id, order_id, service_id, service_name, unit_price_cents, quantity, line_total_cents, service_group)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `)
      .bind(crypto.randomUUID(), order_id, oi.service_id, oi.service_name, oi.unit_price_cents, oi.quantity, oi.line_total_cents, oi.service_group)
      .run();

    await db
      .prepare(`
        INSERT INTO order_items_original
          (id, order_id, service_id, service_name, unit_price_cents, quantity, line_total_cents, service_group, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `)
      .bind(crypto.randomUUID(), order_id, oi.service_id, oi.service_name, oi.unit_price_cents, oi.quantity, oi.line_total_cents, oi.service_group, now)
      .run();
  }

  // ── Telegram notification ────────────────────────────────────
  // Runs in the background via waitUntil — never delays the customer response.
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId   = env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    const lines = [
      `🧾 *New order: ${order_ref}*`,
      `👤 ${customer_name}`,
      `📱 +960 ${customer_phone} · ${contact_method}`,
      `📦 ${services_summary}`,
      `💰 MVR ${(total / 100).toFixed(2)}`,
      customer_notes ? `📝 _${customer_notes}_` : null,
      `🔗 [View order](https://darkroom-558.pages.dev/admin/orders/${order_id})`,
    ].filter(Boolean).join("\n");

    const tgFetch = fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: "Markdown" }),
    }).catch(() => null); // if Telegram is down, order still succeeds silently

    locals.runtime.ctx.waitUntil(tgFetch);
  }

  return new Response(
    JSON.stringify({
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
    }),
    { headers: { "content-type": "application/json" } }
  );
}
