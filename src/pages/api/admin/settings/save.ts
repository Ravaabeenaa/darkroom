export const prerender = false;

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = (locals.runtime.env as any).darkroom_db as D1Database;
  const form = await request.formData().catch(() => null);
  if (!form) return new Response("Bad request", { status: 400 });

  const settings: Record<string, string> = {
    collection_options:  String(form.get("collection_options")  ?? "[]").trim() || "[]",
    shop_announcement:   String(form.get("shop_announcement")   ?? "").trim(),
    shop_closed:         form.get("shop_closed") === "1" ? "1" : "0",
    shop_closed_message: String(form.get("shop_closed_message") ?? "").trim(),
  };

  for (const [key, value] of Object.entries(settings)) {
    await db
      .prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
      .bind(key, value)
      .run();
  }

  return Response.redirect(new URL("/admin/settings?saved=1", request.url), 302);
}
