import type { APIRoute } from "astro";

export const POST: APIRoute = async (Astro) => {
  try {
    const db = Astro.locals.runtime.env.darkroom_db as D1Database;
    const body = await Astro.request.json() as any;

    const id = String(body.id ?? "").trim();

    // If id provided with no image_key, treat as sort_order update only
    if (id && !body.image_key) {
      const sort_order = Number(body.sort_order ?? 0);
      await db.prepare("UPDATE instagram_posts SET sort_order = ? WHERE id = ?").bind(sort_order, id).run();
      return new Response(JSON.stringify({ ok: true, id }), { headers: { "content-type": "application/json" } });
    }

    // Insert new post
    const image_key = String(body.image_key ?? "").trim();
    const instagram_url = String(body.instagram_url ?? "").trim();
    const caption = String(body.caption ?? "").trim() || null;
    const sort_order = Number(body.sort_order ?? 0);

    if (!image_key || !instagram_url) {
      return new Response(JSON.stringify({ ok: false, error: "Missing image_key or instagram_url" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const newId = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO instagram_posts (id, image_key, instagram_url, caption, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(newId, image_key, instagram_url, caption, sort_order).run();

    return new Response(JSON.stringify({ ok: true, id: newId }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Save failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
