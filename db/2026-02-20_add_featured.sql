-- Add a featured flag (0/1) to services
ALTER TABLE services ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;

-- Helpful index for homepage queries
CREATE INDEX IF NOT EXISTS idx_services_featured_active
ON services(featured, active);