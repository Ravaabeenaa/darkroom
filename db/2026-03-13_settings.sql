-- Global settings key/value store
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO settings (key, value) VALUES
  ('collection_options',   '[{"label":"Pickup","cents":0},{"label":"Delivery","cents":500}]'),
  ('shop_announcement',    ''),
  ('shop_closed',          '0'),
  ('shop_closed_message',  'We are currently closed. Please check back soon.');

-- Store chosen collection option on the order itself
ALTER TABLE orders ADD COLUMN collection_option       TEXT    DEFAULT NULL;
ALTER TABLE orders ADD COLUMN collection_option_cents INTEGER NOT NULL DEFAULT 0;
