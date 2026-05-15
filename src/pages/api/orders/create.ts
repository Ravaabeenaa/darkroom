export const prerender = false;

type Env = { darkroom_db: D1Database };
type CollectionOption = { label: string; price: number };

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
  const collection_option_label = String(body?.collection_option ?? "").trim() || null;
  const delivery_address = String(body?.delivery_address ?? "").trim() || null;
  const cart = body?.cart && typeof body.cart === "object" ? body.cart : null;

  if (!customer_name)
    return new Response(JSON.stringify({ ok: false, error: "Name is required" }), { status: 400, headers: { "content-type": "application/json" } });

  if (!customer_phone || !onlyDigits(customer_phone))
    return new Response(JSON.stringify({ ok: false, error: "Phone must be digits only" }), { status: 400, headers: { "content-type": "application/json" } });

  if (!["Telegram", "Viber", "WhatsApp"].includes(contact_method))
    return new Response(JSON.stringify({ ok: false, error: "Invalid contact method" }), { status: 400, headers: { "content-type": "application/json" } });

  if (!cart)
    return new Response(JSON.stringify({ ok: false, error: "Cart is empty" }), { status: 400, headers: { "content-type": "application/json" } });

  // Normalise cart array → items
  const norm = (Array.isArray(cart) ? cart : [])
    .map((item: any) => ({
      id: String(item.service_id ?? "").trim(),
      qty: Math.max(0, Math.floor(Number(item.qty ?? 0))),
      turnaround_option: String(item.turnaround_option ?? "").trim() || null,
      pushpull_option: String(item.pushpull_option ?? "").trim() || null,
    }))
    .filter((it) => it.id && it.qty > 0);

  function getOptionCents(optsJson: string | null, pricesJson: string | null, selected: string | null): number {
    if (!selected || !optsJson || !pricesJson) return 0;
    try {
      const opts = JSON.parse(optsJson) as string[];
      const prices = JSON.parse(pricesJson) as string[];
      const idx = opts.indexOf(selected);
      if (idx === -1 || !prices[idx]) return 0;
      return Math.round((parseFloat(String(prices[idx]).replace(/^\+/, "")) || 0) * 100);
    } catch { return 0; }
  }

  if (!norm.length)
    return new Response(JSON.stringify({ ok: false, error: "Cart is empty" }), { status: 400, headers: { "content-type": "application/json" } });

  // Fetch services server-side to compute totals
  const ids = norm.map((x) => x.id);
  const placeholders = ids.map(() => "?").join(",");

  const svcRes = await db
    .prepare(`SELECT id, name, price_cents, service_group, bulk_discount_eligible, bulk_discount_percent, turnaround_options, turnaround_prices, pushpull_options, pushpull_prices FROM services WHERE active = 1 AND id IN (${placeholders});`)
    .bind(...ids)
    .all<{ id: string; name: string; price_cents: number; service_group: string | null; bulk_discount_eligible: number; bulk_discount_percent: number; turnaround_options: string | null; turnaround_prices: string | null; pushpull_options: string | null; pushpull_prices: string | null }>();

  const svcs = new Map((svcRes.results ?? []).map((s) => [s.id, s]));
  const missing = norm.filter((x) => !svcs.has(x.id));
  if (missing.length)
    return new Response(JSON.stringify({ ok: false, error: "Some items are unavailable", missing: missing.map((m) => m.id) }), { status: 400, headers: { "content-type": "application/json" } });

  let total = 0;
  const orderItems: any[] = [];
  for (const it of norm) {
    const s = svcs.get(it.id)!;
    const unitPrice = s.price_cents
      + getOptionCents(s.turnaround_options, s.turnaround_prices, it.turnaround_option)
      + getOptionCents(s.pushpull_options, s.pushpull_prices, it.pushpull_option);
    const line = unitPrice * it.qty;
    total += line;
    orderItems.push({
      service_id: s.id,
      service_name: s.name,
      unit_price_cents: unitPrice,
      quantity: it.qty,
      line_total_cents: line,
      service_group: s.service_group ?? null,
      turnaround_option: it.turnaround_option,
      pushpull_option: it.pushpull_option,
    });
  }

  // ── Bulk discount logic ───────────────────────────────────────────────────
  const discountItems: { service_id: null; service_name: string; unit_price_cents: number; quantity: number; line_total_cents: number; service_group: null }[] = [];

  // Mode 1: group-level — eligible=1, aggregate by service_group, qty ≥ 5
  const groupMap = new Map<string, { totalQty: number; totalCents: number; minPct: number }>();
  for (const oi of orderItems) {
    const svc = svcs.get(oi.service_id);
    if (!svc || svc.bulk_discount_eligible !== 1 || !svc.service_group) continue;
    const g   = svc.service_group;
    const pct = svc.bulk_discount_percent ?? 5;
    const prev = groupMap.get(g) ?? { totalQty: 0, totalCents: 0, minPct: pct };
    groupMap.set(g, { totalQty: prev.totalQty + oi.quantity, totalCents: prev.totalCents + oi.line_total_cents, minPct: Math.min(prev.minPct, pct) });
  }
  for (const [group, { totalQty, totalCents, minPct }] of groupMap) {
    if (totalQty >= 5) {
      const unitCents = -Math.round(totalCents * 0.01); // -1% of group total
      discountItems.push({ service_id: null, service_name: `Bulk discount (${group})`, unit_price_cents: unitCents, quantity: minPct, line_total_cents: unitCents * minPct, service_group: null });
    }
  }

  // Mode 2: item-level — eligible=2, same service + same options, qty ≥ 5
  for (const oi of orderItems) {
    const svc = svcs.get(oi.service_id);
    if (!svc || svc.bulk_discount_eligible !== 2) continue;
    if (oi.quantity >= 5) {
      const pct = svc.bulk_discount_percent ?? 5;
      const unitCents = -Math.round(oi.line_total_cents * 0.01); // -1% of item line total
      discountItems.push({ service_id: null, service_name: `Bulk discount (${svc.name})`, unit_price_cents: unitCents, quantity: pct, line_total_cents: unitCents * pct, service_group: null });
    }
  }

  for (const d of discountItems) total += d.line_total_cents;

  // ── Collection option ─────────────────────────────────────────────────────
  let collection_option_cents = 0;
  const collectionLineItem: any[] = [];
  if (collection_option_label) {
    try {
      const collRow = await db
        .prepare(`SELECT value FROM settings WHERE key = 'collection_options' LIMIT 1`)
        .first<{ value: string }>();
      const collOpts: CollectionOption[] = JSON.parse(collRow?.value ?? "[]");
      const match = collOpts.find(o => o.label === collection_option_label);
      if (match) {
        collection_option_cents = Math.round((match.price ?? 0) * 100);
        if (collection_option_cents > 0) {
          collectionLineItem.push({
            service_id: null,
            service_name: `Collection: ${match.label}`,
            unit_price_cents: collection_option_cents,
            quantity: 1,
            line_total_cents: collection_option_cents,
            service_group: delivery_address,
            turnaround_option: null,
            pushpull_option: null,
          });
          total += collection_option_cents;
        }
      }
    } catch { /* settings may not exist */ }
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
         original_services_summary, original_total_price_cents,
         collection_option, collection_option_cents)
      VALUES
        (?, ?, ?, ?, ?, ?, 'NEW', ?, '', ?, ?, ?, ?, ?, ?, ?, ?);
    `)
    .bind(
      order_id, order_ref,
      customer_name, customer_phone, services_summary,
      total,
      customer_notes || null,
      now, now,
      contact_method,
      customer_email || null,
      services_summary,
      total,
      collection_option_label,
      collection_option_cents
    )
    .run();

  // Insert into both order_items (current/mutable) and order_items_original (immutable)
  for (const oi of [...orderItems, ...discountItems, ...collectionLineItem]) {
    await db
      .prepare(`
        INSERT INTO order_items
          (id, order_id, service_id, service_name, unit_price_cents, quantity, line_total_cents, service_group, turnaround_option, pushpull_option)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `)
      .bind(crypto.randomUUID(), order_id, oi.service_id, oi.service_name, oi.unit_price_cents, oi.quantity, oi.line_total_cents, oi.service_group, oi.turnaround_option ?? null, oi.pushpull_option ?? null)
      .run();

    await db
      .prepare(`
        INSERT INTO order_items_original
          (id, order_id, service_id, service_name, unit_price_cents, quantity, line_total_cents, service_group, turnaround_option, pushpull_option, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `)
      .bind(crypto.randomUUID(), order_id, oi.service_id, oi.service_name, oi.unit_price_cents, oi.quantity, oi.line_total_cents, oi.service_group, oi.turnaround_option ?? null, oi.pushpull_option ?? null, now)
      .run();
  }

  // ── Telegram notification ────────────────────────────────────
  // Runs in the background via waitUntil — never delays the customer response.
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId   = env.TELEGRAM_CHAT_ID;

if (botToken && chatId) {
  const phoneNumber = customer_phone.replace(/\D/g, ""); // ensures tel: link works
  const lines = [
    `🧾 <b>New order: ${order_ref}</b>`,
    `👤 ${customer_name}`,
    `📱 <a href="tel:+960${phoneNumber}">+960 ${customer_phone}</a> · ${contact_method}`,
    `📦 ${services_summary}`,
    collection_option_label ? `🚚 ${collection_option_label}` : null,
    `💰 MVR ${(total / 100).toFixed(2)}`,
    customer_notes ? `📝 <i>${customer_notes}</i>` : null,
    `🔗 <a href="https://darkroombysmolbo1.shop/admin/orders/${order_id}">View order</a>`,
  ].filter(Boolean).join("\n");

  const tgFetch = fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines,
      parse_mode: "HTML", // HTML is required for tel: links
    }),
  }).catch(() => null);

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
      items: [...orderItems, ...collectionLineItem, ...discountItems],
    }),
    { headers: { "content-type": "application/json" } }
  );
}
