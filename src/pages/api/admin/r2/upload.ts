import type { APIRoute } from "astro";

type Kind = "primary" | "gallery" | "sample";

function isKind(x: string): x is Kind {
  return x === "primary" || x === "gallery" || x === "sample";
}

function nowIso() {
  return new Date().toISOString();
}

function detectImageType(bytes: Uint8Array): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

export const POST: APIRoute = async (Astro) => {
  try {
    const env = Astro.locals.runtime.env as any;

    const db = env.darkroom_db as D1Database;
    const bucket = env.darkroom_media as R2Bucket;

    const form = await Astro.request.formData();

    const file = form.get("file");
    const service_id = String(form.get("service_id") ?? "").trim();
    const kindRaw = String(form.get("kind") ?? "").trim();
    const alt = String(form.get("alt") ?? "").trim();

    if (!service_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing service_id" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    if (!isKind(kindRaw)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid kind" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ ok: false, error: "Missing file" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const MAX_BYTES = 12 * 1024 * 1024; // 12MB
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid file size" }), { status: 413, headers: { "content-type": "application/json" } });
    }

    // Ensure service exists
    const svc = await db.prepare("SELECT id FROM services WHERE id = ? LIMIT 1").bind(service_id).first();
    if (!svc) {
      return new Response(JSON.stringify({ ok: false, error: "Service not found" }), { status: 404, headers: { "content-type": "application/json" } });
    }

    // Validate by signature
    const ab = await file.arrayBuffer();
    const head = new Uint8Array(ab.slice(0, 16));
    const detected = detectImageType(head);
    if (!detected) {
      return new Response(JSON.stringify({ ok: false, error: "Unsupported image type. Use JPG, PNG, or WEBP." }), { status: 415, headers: { "content-type": "application/json" } });
    }

    const uuid = crypto.randomUUID();
    const image_key = `services/${service_id}/${kindRaw}/${uuid}.${detected.ext}`;

    await bucket.put(image_key, ab, {
      httpMetadata: { contentType: detected.mime },
    });

    const created_at = nowIso();
    const image_id = crypto.randomUUID();

    let sort_order = 0;
    if (kindRaw !== "primary") {
      const row = await db
        .prepare("SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM service_images WHERE service_id = ? AND kind = ?")
        .bind(service_id, kindRaw)
        .first<{ max_sort: number }>();
      sort_order = (row?.max_sort ?? -1) + 1;
    }

    if (kindRaw === "primary") {
      // Replace primary record
      await db.prepare("DELETE FROM service_images WHERE service_id = ? AND kind = 'primary'").bind(service_id).run();

      await db.prepare(
        `INSERT INTO service_images (id, service_id, image_key, kind, sort_order, alt, created_at)
         VALUES (?, ?, ?, 'primary', 0, ?, ?)`
      ).bind(image_id, service_id, image_key, alt, created_at).run();

      await db.prepare(
        `UPDATE services SET primary_image_key = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(image_key, service_id).run();
    } else {
      await db.prepare(
        `INSERT INTO service_images (id, service_id, image_key, kind, sort_order, alt, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(image_id, service_id, image_key, kindRaw, sort_order, alt, created_at).run();
    }

    return new Response(JSON.stringify({ ok: true, image: { id: image_id, image_key, kind: kindRaw, sort_order } }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Upload failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};