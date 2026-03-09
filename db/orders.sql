CREATE TABLE IF NOT EXISTS order_items_original (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  service_id TEXT,
  service_name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  service_group TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items_current (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  service_id TEXT,
  service_name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  service_group TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oio_order_id ON order_items_original(order_id);
CREATE INDEX IF NOT EXISTS idx_oic_order_id ON order_items_current(order_id);