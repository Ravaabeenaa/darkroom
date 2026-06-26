-- Generic JSON storage for selected service_options on order items
-- (replaces the fixed turnaround_option/pushpull_option columns, which
-- couldn't represent film_size or any future option group)
ALTER TABLE order_items ADD COLUMN selected_options TEXT DEFAULT NULL;
ALTER TABLE order_items_original ADD COLUMN selected_options TEXT DEFAULT NULL;
