export const prerender = false;

export async function POST({ request, locals, redirect }: any) {
  const db = locals.runtime.env.darkroom_db as D1Database;
  const form = await request.formData();
  const id = (form.get("id") as string | null)?.trim() ?? "";

  if (!id) return redirect("/admin/carousel?error=missing_id", 303);

  await db.prepare("DELETE FROM carousel_slides WHERE id = ?").bind(id).run();

  return redirect("/admin/carousel?saved=1", 303);
}
