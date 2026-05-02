export const prerender = false;

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = locals.runtime.env.darkroom_db as D1Database;

  const form = await request.formData().catch(() => null);
  const raw = String(form?.get("url") ?? "").trim();

  if (!raw) {
    return Response.redirect(new URL("/admin/instagram?error=missing_url", request.url), 302);
  }

  // Accept instagram.com/p/ and instagram.com/reel/ URLs
  const match = raw.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
  if (!match) {
    return Response.redirect(new URL("/admin/instagram?error=invalid_url", request.url), 302);
  }

  const normalised = `https://www.instagram.com/${match[1]}/${match[2]}/`;

  // Prevent duplicate entries
  const exists = await db
    .prepare("SELECT id FROM instagram_posts WHERE url = ?")
    .bind(normalised)
    .first();
  if (exists) {
    return Response.redirect(new URL("/admin/instagram?error=duplicate", request.url), 302);
  }

  const nextOrder = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM instagram_posts")
    .first<{ n: number }>();

  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO instagram_posts (id, url, sort_order) VALUES (?, ?, ?)")
    .bind(id, normalised, nextOrder?.n ?? 1)
    .run();

  return Response.redirect(new URL("/admin/instagram?saved=1", request.url), 302);
}
