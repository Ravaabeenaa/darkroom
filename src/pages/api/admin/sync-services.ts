export const prerender = false;

type Env = {
  darkroom_db: D1Database;
  ADMIN_SYNC_TOKEN: string;
  APPS_SCRIPT_URL: string;
  APPS_SCRIPT_TOKEN: string;
};

type ServiceRow = {
  id: string;
  service_group?: string;
  name: string;
  description?: string;
  price: number | string;
  active: boolean | string | number;
  requires_group?: boolean | string | number;
  requires_service_id?: string;
  tags?: string;
  notes?: string;
};

function toInt01(v: any): number {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return (s === "true" || s === "yes" || s === "1") ? 1 : 0;
  }
  return 0;
}

function priceToCents(p: any): number {
  const n = typeof p === "number" ? p : Number(String(p).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST({
  request,
  locals
}: {
  request: Request;
  locals: { runtime: { env: Env } };
}) {
  const env = locals.runtime.env;

  // Admin auth
  const token = request.headers.get("x-admin-token") ?? "";
  if (!env.ADMIN_SYNC_TOKEN || token !== env.ADMIN_SYNC_TOKEN) {
    return new Response(
      JSON.stringify({ ok: false, error: "unauthorized" }),
      { status: 401 }
    );
  }

  // Fetch services from Apps Script
  const url = new URL(env.APPS_SCRIPT_URL);
  url.searchParams.set("route", "services.list");
  url.searchParams.set("token", env.APPS_SCRIPT_TOKEN);

  const r = await fetch(url.toString(), { method: "GET" });
  if (!r.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: `apps_script_http_${r.status}` }),
      { status: 502 }
    );
  }

  const services: ServiceRow[] = await r.json();

  if (!Array.isArray(services)) {
    return new Response(
      JSON.stringify({ ok: false, error: "bad_apps_script_payload" }),
      { status: 502 }
    );
  }

  const db = env.darkroom_db;

  const statements = services.map((s) => {
    const slug = slugify(s.name);

    return db.prepare(`
      INSERT INTO services
        (id, slug, service_group, name, description, price_cents, active, requires_group, requires_service_id, tags, notes, updated_at)
      VALUES
        (?,  ?,   ?,            ?,    ?,           ?,          ?,      ?,              ?,                  ?,    ?,     datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        slug=excluded.slug,
        service_group=excluded.service_group,
        name=excluded.name,
        description=excluded.description,
        price_cents=excluded.price_cents,
        active=excluded.active,
        requires_group=excluded.requires_group,
        requires_service_id=excluded.requires_service_id,
        tags=excluded.tags,
        notes=excluded.notes,
        updated_at=datetime('now');
    `).bind(
      s.id,
      slug,
      s.service_group ?? null,
      s.name,
      s.description ?? null,
      priceToCents(s.price),
      toInt01(s.active),
      toInt01(s.requires_group),
      s.requires_service_id ?? null,
      s.tags ?? null,
      s.notes ?? null
    );
  });

  await db.batch(statements);

  return new Response(
    JSON.stringify({ ok: true, upserted: services.length }),
    { headers: { "content-type": "application/json" } }
  );
}
