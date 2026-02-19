export const prerender = false;

type Env = { darkroom_db: D1Database };

export async function GET({ locals }: { locals: { runtime: { env: Env } } }) {
  const db = locals.runtime.env.darkroom_db;

  const q = `
    SELECT
      id,
      slug as slug, -- (if you don't have slug yet, we’ll generate it later)
      service_group,
      name,
      description,
      price_cents,
      active,
      requires_group,
      requires_service_id,
      tags,
      notes
    FROM services
    WHERE active = 1
    ORDER BY service_group ASC, name ASC;
  `;

  const res = await db.prepare(q).all();
  return new Response(JSON.stringify(res.results ?? []), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
