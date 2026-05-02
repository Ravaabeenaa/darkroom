export const prerender = false;

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = locals.runtime.env.darkroom_db as D1Database;

  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") ?? "").trim();
  const direction = String(form?.get("direction") ?? "").trim(); // "up" | "down"

  if (!id || !["up", "down"].includes(direction)) {
    return Response.redirect(new URL("/admin/instagram?error=invalid", request.url), 302);
  }

  type Row = { id: string; sort_order: number };
  const all = await db
    .prepare("SELECT id, sort_order FROM instagram_posts WHERE active = 1 ORDER BY sort_order ASC")
    .all<Row>();
  const rows = all.results ?? [];
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) {
    return Response.redirect(new URL("/admin/instagram?error=not_found", request.url), 302);
  }

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) {
    return Response.redirect(new URL("/admin/instagram", request.url), 302);
  }

  const a = rows[idx];
  const b = rows[swapIdx];
  await db.batch([
    db.prepare("UPDATE instagram_posts SET sort_order = ? WHERE id = ?").bind(b.sort_order, a.id),
    db.prepare("UPDATE instagram_posts SET sort_order = ? WHERE id = ?").bind(a.sort_order, b.id),
  ]);

  return Response.redirect(new URL("/admin/instagram?saved=1", request.url), 302);
}
