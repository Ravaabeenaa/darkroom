-- Controls display order in the shop: higher priority sorts first, default 0.
ALTER TABLE services ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_services_priority ON services(priority);
