import type { MiddlewareHandler } from "astro";

function timingSafeEqual(a: string, b: string) {
  // minimal safe compare
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const pathname = ctx.url.pathname;

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isAdminRoute) return next();

  const env = ctx.locals.runtime.env as any;
  const adminPass = String(env.ADMIN_PASSWORD ?? "");
  const secret = String(env.ADMIN_COOKIE_SECRET ?? "");

  // Allow login endpoint without cookie
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return next();
  }

  // Very simple cookie-based auth token: cookie value must equal secret+":"+adminPass hashed by us later.
  // For MVP: store a signed token in cookie. We'll implement signature next step.
  const cookie = ctx.request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)dr_admin=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : "";

  // MVP token is just secret (we’ll improve to signed token immediately after skeleton works)
  if (!secret || !adminPass || !timingSafeEqual(token, secret)) {
    // Redirect browser pages to login
    if (pathname.startsWith("/admin")) {
      return Response.redirect(new URL("/admin/login", ctx.url), 302);
    }
    // Block API
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  return next();
};
