import type { APIRoute } from "astro";

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

export const POST: APIRoute = async (Astro) => {
  try {
    const env = Astro.locals.runtime.env as any;
    const bucket = env.darkroom_media as R2Bucket;

    const form = await Astro.request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ ok: false, error: "Missing file" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const MAX_BYTES = 12 * 1024 * 1024;
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid file size" }), { status: 413, headers: { "content-type": "application/json" } });
    }

    const ab = await file.arrayBuffer();
    const head = new Uint8Array(ab.slice(0, 16));
    const detected = detectImageType(head);
    if (!detected) {
      return new Response(JSON.stringify({ ok: false, error: "Unsupported image type. Use JPG, PNG, or WEBP." }), { status: 415, headers: { "content-type": "application/json" } });
    }

    const uuid = crypto.randomUUID();
    const image_key = `instagram/${uuid}.${detected.ext}`;

    await bucket.put(image_key, ab, {
      httpMetadata: { contentType: detected.mime },
    });

    return new Response(JSON.stringify({ ok: true, image_key }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Upload failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
