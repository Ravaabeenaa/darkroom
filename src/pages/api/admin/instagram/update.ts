export const prerender = false;

function detectImageType(bytes: Uint8Array): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as any;
  const db = env.darkroom_db as D1Database;
  const bucket = env.darkroom_media as R2Bucket;

  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") ?? "").trim();
  if (!id) {
    return Response.redirect(new URL("/admin/instagram?error=missing_id", request.url), 302);
  }

  const post = await db.prepare("SELECT id, photo_key FROM instagram_posts WHERE id = ?").bind(id).first<{ id: string; photo_key: string | null }>();
  if (!post) {
    return Response.redirect(new URL("/admin/instagram?error=missing_id", request.url), 302);
  }

  const account_handle = String(form?.get("account_handle") ?? "").trim().replace(/^@/, "") || null;
  const caption = String(form?.get("caption") ?? "").trim() || null;
  const removePhoto = form?.get("remove_photo") === "1";
  const file = form?.get("photo");

  let photo_key = post.photo_key;

  if (file instanceof File && file.size > 0) {
    const MAX_BYTES = 12 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return Response.redirect(new URL("/admin/instagram?error=photo_too_large", request.url), 302);
    }
    const ab = await file.arrayBuffer();
    const head = new Uint8Array(ab.slice(0, 16));
    const detected = detectImageType(head);
    if (!detected) {
      return Response.redirect(new URL("/admin/instagram?error=invalid_photo", request.url), 302);
    }

    const newKey = `instagram/${id}/${crypto.randomUUID()}.${detected.ext}`;
    await bucket.put(newKey, ab, { httpMetadata: { contentType: detected.mime } });

    if (post.photo_key) {
      await bucket.delete(post.photo_key).catch(() => null);
    }
    photo_key = newKey;
  } else if (removePhoto) {
    if (post.photo_key) {
      await bucket.delete(post.photo_key).catch(() => null);
    }
    photo_key = null;
  }

  await db
    .prepare("UPDATE instagram_posts SET account_handle = ?, caption = ?, photo_key = ? WHERE id = ?")
    .bind(account_handle, caption, photo_key, id)
    .run();

  return Response.redirect(new URL("/admin/instagram?saved=1", request.url), 302);
}
