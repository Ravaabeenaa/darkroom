import type { APIRoute } from "astro";

export const GET: APIRoute = async (Astro) => {
  const db = Astro.locals.runtime.env.darkroom_db as D1Database;

  const rows = await db.prepare(`
    SELECT LOWER(SUBSTR(id, 1, 3)) AS prefix, service_group
    FROM services
    WHERE id IS NOT NULL
      AND LENGTH(id) >= 3
      AND service_group IS NOT NULL
      AND service_group != '';
  `).all<{ prefix: string; service_group: string }>();

  const counts = new Map<string, Map<string, number>>();
  for (const r of rows.results ?? []) {
    if (!counts.has(r.prefix)) counts.set(r.prefix, new Map());
    const m = counts.get(r.prefix)!;
    m.set(r.service_group, (m.get(r.service_group) ?? 0) + 1);
  }

  // Your seed list
  const prefixToGroup: Record<string, string> = {
    cam: "camera",
    dev: "developing",
    flm: "film_roll",
    pro: "processing",
    tim: "time",
  };

  // For any prefix seen in DB, pick the most common group
  for (const [prefix, m] of counts) {
    let best = "";
    let bestN = -1;
    for (const [g, n] of m) {
      if (n > bestN) {
        bestN = n;
        best = g;
      }
    }
    if (best) prefixToGroup[prefix] = best;
  }

  return new Response(JSON.stringify({ ok: true, prefixToGroup }), {
    headers: { "content-type": "application/json" },
  });
};