export const prerender = false;

export async function POST({ request, locals, redirect }: any) {
  const db = locals.runtime.env.darkroom_db as D1Database;
  const form = await request.formData();

  const id        = (form.get("id")        as string | null)?.trim() ?? "";
  const filename  = (form.get("filename")  as string | null)?.trim() ?? "";
  const film_name = (form.get("film_name") as string | null)?.trim() ?? "";
  const sort_order = parseInt(form.get("sort_order") as string, 10) || 0;

  if (!id || !filename || !film_name) {
    return redirect("/admin/carousel?error=missing_fields", 303);
  }

  await db
    .prepare("UPDATE carousel_slides SET filename = ?, film_name = ?, sort_order = ? WHERE id = ?")
    .bind(filename, film_name, sort_order, id)
    .run();

  return redirect("/admin/carousel?saved=1", 303);
}
