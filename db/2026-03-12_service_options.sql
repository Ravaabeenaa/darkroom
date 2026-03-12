-- Service-level option definitions (JSON arrays stored as text, NULL = no options)
ALTER TABLE services ADD COLUMN turnaround_options TEXT DEFAULT NULL;
ALTER TABLE services ADD COLUMN pushpull_options TEXT DEFAULT NULL;

-- Order item option values
ALTER TABLE order_items ADD COLUMN turnaround_option TEXT DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN pushpull_option TEXT DEFAULT NULL;

ALTER TABLE order_items_original ADD COLUMN turnaround_option TEXT DEFAULT NULL;
ALTER TABLE order_items_original ADD COLUMN pushpull_option TEXT DEFAULT NULL;
