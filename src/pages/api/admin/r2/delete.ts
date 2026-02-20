import type { APIRoute } from "astro";

export const POST: APIRoute = async (Astro) => {
  try {
    const env = Astro.locals.runtime.env as any;
    const db = env.darkroom_db as D1Database;
    const bucket = env.darkroom_media as R2Bucket;

    const body = await Astro.request.json().catch(() => null);
    const image_id = String(body?.image_id ?? "").trim();
    if (!image_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing image_id" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const row = await db
      .prepare(`SELECT id, service_id, image_key, kind FROM service_images WHERE id = ? LIMIT 1`)
      .bind(image_id)
      .first<{ id: string; service_id: string; image_key: string; kind: string }>();

    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: "Image not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Delete from D1
    await db.prepare(`DELETE FROM service_images WHERE id = ?`).bind(image_id).run();

    // If it was primary, clear services.primary_image_key (only if it matches)
    if (row.kind === "primary") {
      await db
        .prepare(`UPDATE services SET primary_image_key = NULL, updated_at = ? WHERE id = ? AND primary_image_key = ?`)
        .bind(new Date().toISOString(), row.service_id, row.image_key)
        .run();
    }

    // Delete from R2
    await bucket.delete(row.image_key);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Delete failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};