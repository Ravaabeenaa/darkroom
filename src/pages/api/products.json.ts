export const prerender = false;

type Env = { darkroom_db: D1Database };

export async function GET({ locals }: { locals: { runtime: { env: Env } } }) {
  const db = locals.runtime.env.darkroom_db;

  const q = `
    SELECT
      p.slug,
      p.title,
      p.short,
      p.description,
      p.price_cents,
      p.compare_at_cents,
      p.currency,
      p.badge,
      (
        SELECT url
        FROM product_images i
        WHERE i.product_id = p.id
        ORDER BY i.sort_order ASC
        LIMIT 1
      ) AS image
    FROM products p
    WHERE p.is_active = 1
    ORDER BY p.created_at DESC;
  `;

  const res = await db.prepare(q).all();

  return new Response(JSON.stringify(res.results ?? []), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}
