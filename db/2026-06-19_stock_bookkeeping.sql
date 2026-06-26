-- RECONSTRUCTED migration (see src/lib/bookkeeping-columns.ts comment referencing this filename).
-- This file was applied directly against the live D1 database; the original .sql was never
-- committed. Reconstructed from src/lib/bookkeeping-columns.ts and the INSERT/SELECT statements
-- in src/pages/api/admin/bookkeeping/*.ts and src/pages/api/admin/orders/update-status.ts.
-- If your D1 instance already has these, skip this file (ALTER/CREATE will error on a second run).

CREATE TABLE IF NOT EXISTS bookkeeping (
  id            TEXT    PRIMARY KEY,
  type          TEXT    NOT NULL, -- 'income' | 'expense'
  service_id    TEXT,
  name          TEXT    NOT NULL,
  amount_cents  INTEGER NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  total_cents   INTEGER NOT NULL,
  order_id      TEXT,
  notes         TEXT,
  occurred_at   TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookkeeping_occurred_at ON bookkeeping(occurred_at);
CREATE INDEX IF NOT EXISTS idx_bookkeeping_order_id ON bookkeeping(order_id);

-- Tracks whether COMPLETED-order stock/bookkeeping sync has already run for this order,
-- so toggling status doesn't double-apply stock deduction or double-log income.
ALTER TABLE orders ADD COLUMN stock_applied INTEGER NOT NULL DEFAULT 0;
