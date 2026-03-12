CREATE TABLE IF NOT EXISTS order_discounts (
  id           TEXT    PRIMARY KEY,
  order_id     TEXT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  label        TEXT    NOT NULL,
  scope        TEXT    NOT NULL,   -- 'total' | 'group' | 'item'
  scope_ref    TEXT,               -- NULL for total, group name, or order_item id
  amount_type  TEXT    NOT NULL,   -- 'percent' | 'fixed'
  amount       INTEGER NOT NULL,   -- percent: 0-100; fixed: cents (e.g. 5000 = MVR 50)
  computed_cents INTEGER NOT NULL, -- positive; subtracted from order total
  created_at   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_discounts_order ON order_discounts(order_id);
