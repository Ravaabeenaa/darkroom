export const prerender = false;

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = (locals.runtime.env as any).darkroom_db as D1Database;

  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") ?? "").trim();

  if (!id) {
    return Response.redirect(new URL("/admin/services?error=missing_id", request.url), 302);
  }

  await db
    .prepare(`UPDATE services SET active = 0, updated_at = datetime('now') WHERE id = ?`)
    .bind(id)
    .run();

  return Response.redirect(new URL("/admin/services", request.url), 302);
}
