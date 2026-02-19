ALTER TABLE services ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_id ON services(id);
