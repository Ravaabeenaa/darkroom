import type { APIRoute } from "astro";

export const GET: APIRoute = async (Astro) => {
  const db = Astro.locals.runtime.env.darkroom_db as D1Database;
  const excludeId = Astro.url.searchParams.get("exclude") ?? "";

  const rows = await db
    .prepare(`SELECT id, name, service_options FROM services WHERE service_options IS NOT NULL AND service_options != ''`)
    .all<{ id: string; name: string; service_options: string }>();

  const groups: { name: string; options: string[]; prices: string[]; serviceName: string }[] = [];

  for (const r of rows.results ?? []) {
    if (r.id === excludeId) continue;
    let parsed: any;
    try { parsed = JSON.parse(r.service_options); } catch { continue; }
    if (!Array.isArray(parsed)) continue;

    for (const g of parsed) {
      if (g && typeof g.name === "string" && Array.isArray(g.options) && Array.isArray(g.prices)) {
        groups.push({ name: g.name, options: g.options, prices: g.prices, serviceName: r.name });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, groups }), {
    headers: { "content-type": "application/json" },
  });
};
