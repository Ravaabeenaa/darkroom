import type { APIRoute } from "astro";

export const DELETE: APIRoute = async (Astro) => {
  try {
    const env = Astro.locals.runtime.env as any;
    const db = env.darkroom_db as D1Database;
    const bucket = env.darkroom_media as R2Bucket;

    const body = await Astro.request.json() as any;
    const id = String(body.id ?? "").trim();

    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const row = await db.prepare("SELECT image_key FROM instagram_posts WHERE id = ? LIMIT 1").bind(id).first<{ image_key: string }>();
    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: "Post not found" }), { status: 404, headers: { "content-type": "application/json" } });
    }

    await bucket.delete(row.image_key);
    await db.prepare("DELETE FROM instagram_posts WHERE id = ?").bind(id).run();

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
