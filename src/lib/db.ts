export type ProductRow = {
  slug: string;
  title: string;
  short: string | null;
  description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  currency: string;
  badge: string | null;
  image: string | null;
};

export function money(cents: number, currency = "USD") {
  const amount = (cents / 100).toFixed(2);
  return currency === "USD" ? `$${amount}` : `${amount} ${currency}`;
}

export async function listProducts(db: D1Database): Promise<ProductRow[]> {
  const q = `
    SELECT
      p.slug, p.title, p.short, p.description,
      p.price_cents, p.compare_at_cents, p.currency, p.badge,
      (
        SELECT url
        FROM product_images i
        WHERE i.product_id = p.id
        ORDER BY i.sort_order ASC
        LIMIT 1
      ) AS image
    FROM products p
    WHERE p.is_active = 1
    ORDER BY p.created_at DESC;
  `;
  const res = await db.prepare(q).all<ProductRow>();
  return (res.results ?? []) as ProductRow[];
}

export async function getProductBySlug(db: D1Database, slug: string): Promise<ProductRow | null> {
  const q = `
    SELECT
      p.slug, p.title, p.short, p.description,
      p.price_cents, p.compare_at_cents, p.currency, p.badge,
      (
        SELECT url
        FROM product_images i
        WHERE i.product_id = p.id
        ORDER BY i.sort_order ASC
        LIMIT 1
      ) AS image
    FROM products p
    WHERE p.is_active = 1 AND p.slug = ?
    LIMIT 1;
  `;
  const res = await db.prepare(q).bind(slug).first<ProductRow>();
  return (res ?? null) as ProductRow | null;
}
