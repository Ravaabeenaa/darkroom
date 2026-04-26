import type { APIRoute } from "astro";

const ALLOWED_HOSTS = ["cdninstagram.com", "fbcdn.net"];

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

    const body = await Astro.request.json() as any;
    const src_url = String(body.src_url ?? "").trim();

    if (!src_url) {
      return new Response(JSON.stringify({ ok: false, error: "Missing src_url" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    // Validate the URL is from Instagram/Facebook CDN only
    let parsed: URL;
    try { parsed = new URL(src_url); } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid URL" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    const isAllowed = ALLOWED_HOSTS.some(h => parsed.hostname.endsWith(h));
    if (!isAllowed) {
      return new Response(JSON.stringify({ ok: false, error: "URL must be from Instagram CDN" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    // Download the image from Instagram CDN
    const imgRes = await fetch(src_url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/",
      },
    });

    if (!imgRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: `Failed to download image (HTTP ${imgRes.status}). The URL may have expired — try fetching the post again.` }), { status: 502, headers: { "content-type": "application/json" } });
    }

    const ab = await imgRes.arrayBuffer();
    const head = new Uint8Array(ab.slice(0, 16));
    const detected = detectImageType(head);
    if (!detected) {
      return new Response(JSON.stringify({ ok: false, error: "Downloaded file is not a recognised image type." }), { status: 415, headers: { "content-type": "application/json" } });
    }

    const uuid = crypto.randomUUID();
    const image_key = `instagram/${uuid}.${detected.ext}`;

    await bucket.put(image_key, ab, { httpMetadata: { contentType: detected.mime } });

    return new Response(JSON.stringify({ ok: true, image_key }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Download failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
