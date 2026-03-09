export const prerender = false;

type Env = { darkroom_db: D1Database };

const ALLOWED = new Set(["NEW", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"]);

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const env = locals.runtime.env as Env;
  const db = env.darkroom_db;

  const body = await request.json().catch(() => null);
  const order_id = String(body?.order_id ?? "").trim();
  const status = String(body?.status ?? "").trim();
  const internal_notes = body?.internal_notes !== undefined ? String(body.internal_notes) : undefined;

  if (!order_id) return new Response(JSON.stringify({ ok: false, error: "Missing order_id" }), { status: 400 });
  if (!ALLOWED.has(status)) return new Response(JSON.stringify({ ok: false, error: "Invalid status" }), { status: 400 });

  if (internal_notes !== undefined) {
    await db.prepare(`
      UPDATE orders
      SET status = ?, internal_notes = ?, updated_at = datetime('now')
      WHERE id = ?;
    `).bind(status, internal_notes, order_id).run();
  } else {
    await db.prepare(`
      UPDATE orders
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?;
    `).bind(status, order_id).run();
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}