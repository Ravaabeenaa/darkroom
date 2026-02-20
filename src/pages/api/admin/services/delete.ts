export const prerender = false;

type Env = {
  darkroom_db: D1Database;
};

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const form = await request.formData();
  const id = String(form.get("id") ?? "").trim();

  if (!id) {
    return Response.redirect(new URL(`/admin/services?error=missing_id`, request.url), 302);
  }

  // Soft delete preferred? For now: set active=0.
  await db
    .prepare(`UPDATE services SET active=0, updated_at=datetime('now') WHERE id=?`)
    .bind(id)
    .run();

  return Response.redirect(new URL(`/admin/services?deleted=1`, request.url), 302);
}