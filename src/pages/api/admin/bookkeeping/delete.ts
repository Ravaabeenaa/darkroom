export const prerender = false;

type Env = { darkroom_db: D1Database };

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const db = (locals.runtime.env as Env).darkroom_db;
  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "").trim();

  if (!id)
    return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400, headers: { "content-type": "application/json" } });

  await db.prepare(`DELETE FROM bookkeeping WHERE id = ?`).bind(id).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}
