CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  service_group TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  requires_group INTEGER NOT NULL DEFAULT 0,
  requires_service_id TEXT,
  tags TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_group ON services(service_group);
