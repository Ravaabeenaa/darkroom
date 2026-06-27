export const prerender = false;

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as any;
  const db = env.darkroom_db as D1Database;
  const bucket = env.darkroom_media as R2Bucket;

  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") ?? "").trim();

  if (!id) {
    return Response.redirect(new URL("/admin/instagram?error=missing_id", request.url), 302);
  }

  const post = await db.prepare("SELECT photo_key FROM instagram_posts WHERE id = ?").bind(id).first<{ photo_key: string | null }>();
  if (post?.photo_key) {
    await bucket.delete(post.photo_key).catch(() => null);
  }

  await db.prepare("DELETE FROM instagram_posts WHERE id = ?").bind(id).run();

  return Response.redirect(new URL("/admin/instagram?saved=1", request.url), 302);
}
