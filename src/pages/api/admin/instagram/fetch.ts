import type { APIRoute } from "astro";

function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const GET: APIRoute = async (Astro) => {
  const url = Astro.url.searchParams.get("url") ?? "";

  const shortcodeMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (!shortcodeMatch) {
    return jsonResponse({ ok: false, error: "Invalid Instagram URL. Expected: https://www.instagram.com/p/..." }, 400);
  }
  const shortcode = shortcodeMatch[1];

  try {
    const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "iframe",
        "Sec-Fetch-Mode": "navigate",
      },
    });

    if (!embedRes.ok) {
      return jsonResponse({ ok: false, error: `Instagram returned HTTP ${embedRes.status}. The post may be private.` }, 502);
    }

    const html = await embedRes.text();

    // Extract post images — filter specifically for post content (t51.2885-15 path segment)
    // These are the actual post images, not profile pics or icons
    const images: string[] = [];
    const seen = new Set<string>();

    const imgPattern = /src="(https:\/\/[^"]+\.(?:cdninstagram|fbcdn)\.net\/[^"]*t51\.2885-15[^"]*)"/gi;
    for (const match of html.matchAll(imgPattern)) {
      const imgUrl = match[1].replace(/&amp;/g, "&");
      // Deduplicate by base path (before query string)
      const base = imgUrl.split("?")[0];
      if (!seen.has(base)) {
        seen.add(base);
        images.push(imgUrl);
      }
    }

    // Fallback: any cdninstagram image that looks like a large content image
    if (images.length === 0) {
      const fallbackPattern = /src="(https:\/\/[^"]*\.cdninstagram\.com\/v\/[^"]+)"/gi;
      for (const match of html.matchAll(fallbackPattern)) {
        const imgUrl = match[1].replace(/&amp;/g, "&");
        const base = imgUrl.split("?")[0];
        if (!seen.has(base)) {
          seen.add(base);
          images.push(imgUrl);
        }
      }
    }

    // Extract caption — look for it in JSON-like structures in the embed HTML
    let caption = "";
    const captionPatterns = [
      /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /class="[^"]*Caption[^"]*"[^>]*>.*?<span[^>]*>(.*?)<\/span>/s,
    ];
    for (const pattern of captionPatterns) {
      const m = html.match(pattern);
      if (m?.[1]) {
        caption = m[1]
          .replace(/\\n/g, " ")
          .replace(/\\u[\dA-Fa-f]{4}/g, "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 300); // cap at 300 chars
        if (caption) break;
      }
    }

    if (images.length === 0) {
      return jsonResponse({
        ok: false,
        error: "Could not extract images from this post. It may be private, a video, or Instagram may have changed their embed format.",
      }, 422);
    }

    return jsonResponse({ ok: true, images, caption, shortcode });
  } catch (e: any) {
    return jsonResponse({ ok: false, error: e?.message ?? "Failed to fetch post" }, 500);
  }
};
