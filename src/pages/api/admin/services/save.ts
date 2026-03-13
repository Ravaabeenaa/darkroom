export const prerender = false;

type Env = {
  darkroom_db: D1Database;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function priceToCents(p: string) {
  const n = Number(String(p ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function toInt01(v: any) {
  if (v === "on" || v === "1" || v === 1 || v === true) return 1;
  return 0;
}

function safeId(input: string) {
  return input.trim();
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const form = await request.formData();

  const mode = String(form.get("mode") ?? "").trim();
  const isEdit = mode === "edit";
  const isNew = mode === "new";

  const idRaw = String(form.get("id") ?? "").trim();
  const id = safeId(idRaw);

  if (isNew && !id) {
    return Response.redirect(
      new URL(`/admin/services/new?error=${encodeURIComponent("ID is required.")}`, request.url),
      302
    );
  }

  if (isEdit && !id) {
    return Response.redirect(
      new URL(`/admin/services?error=${encodeURIComponent("Missing service ID.")}`, request.url),
      302
    );
  }

  if (isNew) {
    const existing = await db
      .prepare(`SELECT id FROM services WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string }>();

    if (existing) {
      return Response.redirect(
        new URL(
          `/admin/services/new?error=${encodeURIComponent("That ID already exists. Choose a different ID.")}`,
          request.url
        ),
        302
      );
    }
  }

  const service_group = String(form.get("service_group") ?? "").trim() || null;
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const price_cents = priceToCents(String(form.get("price") ?? "0"));
  const active = toInt01(form.get("active"));
  const featured = toInt01(form.get("featured"));
  const bulk_discount_eligible = Math.min(2, Math.max(0, parseInt(String(form.get("bulk_discount_eligible") ?? "0"), 10) || 0));
  const bulk_discount_percent = Math.min(100, Math.max(1, parseInt(String(form.get("bulk_discount_percent") ?? "5"), 10) || 5));
  const tags = String(form.get("tags") ?? "").trim() || null;
  const notes = String(form.get("notes") ?? "").trim() || null;

  const primary_image_key = String(form.get("primary_image_key") ?? "").trim() || null;

  // JSON arrays for configurable options + prices; stored as-is (null if blank)
  const turnaround_options = String(form.get("turnaround_options") ?? "").trim() || null;
  const pushpull_options = String(form.get("pushpull_options") ?? "").trim() || null;
  const collection_options = String(form.get("collection_options") ?? "").trim() || null;
  const turnaround_prices = String(form.get("turnaround_prices") ?? "").trim() || null;
  const pushpull_prices = String(form.get("pushpull_prices") ?? "").trim() || null;
  const collection_prices = String(form.get("collection_prices") ?? "").trim() || null;

  if (!name) {
    return Response.redirect(
      new URL(`/admin/services/${encodeURIComponent(id)}?error=missing_name`, request.url),
      302
    );
  }

  const baseSlug = slugify(name);
  let slug = baseSlug || slugify(id) || id;

  const conflict = await db
    .prepare(`SELECT id FROM services WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ id: string }>();

  if (conflict && conflict.id !== id) {
    slug = `${slug}-${slugify(id)}`;
  }

  await db
    .prepare(
      `
      INSERT INTO services
        (id, slug, service_group, name, description, price_cents, active, featured, bulk_discount_eligible, bulk_discount_percent, tags, notes, primary_image_key, turnaround_options, turnaround_prices, pushpull_options, pushpull_prices, collection_options, collection_prices, updated_at)
      VALUES
        (?,  ?,   ?,            ?,    ?,           ?,          ?,      ?,        ?,                      ?,                    ?,    ?,     ?,               ?,                  ?,                 ?,               ?,              ?,                 ?,                datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        slug=excluded.slug,
        service_group=excluded.service_group,
        name=excluded.name,
        description=excluded.description,
        price_cents=excluded.price_cents,
        active=excluded.active,
        featured=excluded.featured,
        bulk_discount_eligible=excluded.bulk_discount_eligible,
        bulk_discount_percent=excluded.bulk_discount_percent,
        tags=excluded.tags,
        notes=excluded.notes,
        primary_image_key=excluded.primary_image_key,
        turnaround_options=excluded.turnaround_options,
        turnaround_prices=excluded.turnaround_prices,
        pushpull_options=excluded.pushpull_options,
        pushpull_prices=excluded.pushpull_prices,
        collection_options=excluded.collection_options,
        collection_prices=excluded.collection_prices,
        updated_at=datetime('now');
    `
    )
    .bind(id, slug, service_group, name, description, price_cents, active, featured, bulk_discount_eligible, bulk_discount_percent, tags, notes, primary_image_key, turnaround_options, turnaround_prices, pushpull_options, pushpull_prices, collection_options, collection_prices)
    .run();

  return Response.redirect(new URL(`/admin/services/${encodeURIComponent(id)}?saved=1`, request.url), 302);
}