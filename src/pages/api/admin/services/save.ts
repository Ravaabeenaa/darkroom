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
  // allow ids like dev001, flm001, cam001, etc.
  return input.trim();
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const form = await request.formData();

  const idRaw = String(form.get("id") ?? "").trim();
  const isEdit = String(form.get("mode") ?? "") === "edit";

  const id = safeId(idRaw || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`));
  const service_group = String(form.get("service_group") ?? "").trim() || null;
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const price_cents = priceToCents(String(form.get("price") ?? "0"));
  const active = toInt01(form.get("active"));
  const tags = String(form.get("tags") ?? "").trim() || null;
  const notes = String(form.get("notes") ?? "").trim() || null;
  const primary_image_key = String(form.get("primary_image_key") ?? "").trim() || null;

  if (!name) {
    return Response.redirect(new URL(`/admin/services/${encodeURIComponent(id)}?error=missing_name`, request.url), 302);
  }

  // Slug rules:
  // - base slug from name
  // - if conflict, fall back to slug-name-id (stable)
  const baseSlug = slugify(name);
  let slug = baseSlug || slugify(id) || id;

  // If editing, keep existing slug unless name changed and slug field not locked? For now, always recompute.
  // Check conflict: slug belongs to another service id
  const conflict = await db
    .prepare(`SELECT id FROM services WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ id: string }>();

  if (conflict && conflict.id !== id) {
    slug = `${slug}-${slugify(id)}`;
  }

  // Upsert
  await db
    .prepare(
      `
      INSERT INTO services
        (id, slug, service_group, name, description, price_cents, active, tags, notes, primary_image_key, updated_at)
      VALUES
        (?,  ?,   ?,            ?,    ?,           ?,          ?,      ?,    ?,     ?,               datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        slug=excluded.slug,
        service_group=excluded.service_group,
        name=excluded.name,
        description=excluded.description,
        price_cents=excluded.price_cents,
        active=excluded.active,
        tags=excluded.tags,
        notes=excluded.notes,
        primary_image_key=excluded.primary_image_key,
        updated_at=datetime('now');
    `
    )
    .bind(
      id,
      slug,
      service_group,
      name,
      description,
      price_cents,
      active,
      tags,
      notes,
      primary_image_key
    )
    .run();

  // Redirect to edit page (canonical slug URL is frontend; admin uses id)
  return Response.redirect(new URL(`/admin/services/${encodeURIComponent(id)}?saved=1`, request.url), 302);
}