import type { APIRoute } from "astro";

export const POST: APIRoute = async (Astro) => {
  try {
    const env = Astro.locals.runtime.env as any;
    const db = env.darkroom_db as D1Database;

    const body = await Astro.request.json().catch(() => null);
    const service_id = String(body?.service_id ?? "").trim();
    const kind = String(body?.kind ?? "").trim();
    const ordered = Array.isArray(body?.ordered_image_ids) ? body.ordered_image_ids.map(String) : [];

    if (!service_id || (kind !== "gallery" && kind !== "sample") || ordered.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    for (let i = 0; i < ordered.length; i++) {
      await db.prepare(
        `UPDATE service_images SET sort_order = ? WHERE id = ? AND service_id = ? AND kind = ?`
      ).bind(i, ordered[i], service_id, kind).run();
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Reorder failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};