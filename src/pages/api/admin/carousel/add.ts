export const prerender = false;

export async function POST({ request, locals, redirect }: any) {
  const db = locals.runtime.env.darkroom_db as D1Database;
  const form = await request.formData();

  const filename  = (form.get("filename")  as string | null)?.trim() ?? "";
  const film_name = (form.get("film_name") as string | null)?.trim() ?? "";
  const sort_order = parseInt(form.get("sort_order") as string, 10) || 0;

  if (!filename || !film_name) {
    return redirect("/admin/carousel?error=missing_fields", 303);
  }

  const existing = await db
    .prepare("SELECT id FROM carousel_slides WHERE filename = ? LIMIT 1")
    .bind(filename)
    .first();
  if (existing) return redirect("/admin/carousel?error=duplicate", 303);

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await db
    .prepare("INSERT INTO carousel_slides (id, filename, film_name, sort_order) VALUES (?, ?, ?, ?)")
    .bind(id, filename, film_name, sort_order)
    .run();

  return redirect("/admin/carousel?saved=1", 303);
}
