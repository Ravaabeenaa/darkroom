export const prerender = false;

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = locals.runtime.env.darkroom_db as D1Database;

  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") ?? "").trim();

  if (!id) {
    return Response.redirect(new URL("/admin/instagram?error=missing_id", request.url), 302);
  }

  await db.prepare("DELETE FROM instagram_posts WHERE id = ?").bind(id).run();

  return Response.redirect(new URL("/admin/instagram?saved=1", request.url), 302);
}
