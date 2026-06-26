-- RECONSTRUCTED migration. These columns are live on the database and actively used in
-- src/ (src/lib/service-columns.ts, src/pages/admin/services/[id].astro, src/pages/admin/stock.astro,
-- src/pages/api/admin/stock/adjust.ts, src/pages/api/admin/services/save.ts) but the original .sql
-- that created them was never committed. Reconstructed for fresh-environment setup / disaster recovery.
-- If your D1 instance already has these, skip this file (ALTER will error on a second run).

ALTER TABLE services ADD COLUMN stock INTEGER NOT NULL DEFAULT -1;        -- -1 = unlimited
ALTER TABLE services ADD COLUMN total_stock INTEGER NOT NULL DEFAULT -1;  -- denominator shown on /admin/stock
ALTER TABLE services ADD COLUMN out_of_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN bulk_discount_min INTEGER NOT NULL DEFAULT 5;
