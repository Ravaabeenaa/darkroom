export const prerender = false;

export async function POST({ request, locals, redirect }: any) {
  const db = locals.runtime.env.darkroom_db as D1Database;
  const form = await request.formData();
  const id        = (form.get("id")        as string | null)?.trim() ?? "";
  const direction = (form.get("direction") as string | null)?.trim() ?? "";

  if (!id || (direction !== "up" && direction !== "down")) {
    return redirect("/admin/carousel", 303);
  }

  const slides = await db
    .prepare("SELECT id, sort_order FROM carousel_slides ORDER BY sort_order ASC, created_at ASC")
    .all<{ id: string; sort_order: number }>();
  const list = slides.results ?? [];

  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return redirect("/admin/carousel", 303);

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return redirect("/admin/carousel", 303);

  const a = list[idx];
  const b = list[swapIdx];

  await db.batch([
    db.prepare("UPDATE carousel_slides SET sort_order = ? WHERE id = ?").bind(b.sort_order, a.id),
    db.prepare("UPDATE carousel_slides SET sort_order = ? WHERE id = ?").bind(a.sort_order, b.id),
  ]);

  return redirect("/admin/carousel", 303);
}
