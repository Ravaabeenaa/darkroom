-- RECONSTRUCTED migration. These columns hold an immutable snapshot of the order at creation
-- time (set once in src/pages/api/orders/create.ts, read by src/pages/admin/orders/[id].astro
-- to detect "modified from original") but the original .sql that created them was never
-- committed. Reconstructed for fresh-environment setup / disaster recovery.
-- If your D1 instance already has these, skip this file (ALTER will error on a second run).

ALTER TABLE orders ADD COLUMN original_services_summary TEXT;
ALTER TABLE orders ADD COLUMN original_total_price_cents INTEGER NOT NULL DEFAULT 0;
