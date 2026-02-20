export const prerender = false;

type Env = {
  ADMIN_PASSWORD: string;
  ADMIN_COOKIE_SECRET: string;
};

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;

  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!env.ADMIN_PASSWORD || !env.ADMIN_COOKIE_SECRET) {
    return new Response("Missing admin env vars", { status: 500 });
  }

  if (!timingSafeEqual(password, env.ADMIN_PASSWORD)) {
    return Response.redirect(new URL("/admin/login?error=1", request.url), 302);
  }

  // MVP cookie == ADMIN_COOKIE_SECRET (middleware checks this)
  const cookie = [
    `dr_admin=${encodeURIComponent(env.ADMIN_COOKIE_SECRET)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    "Max-Age=2592000" // 30 days
  ].join("; ");

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": cookie,
      "Location": "/admin"
    }
  });
}
