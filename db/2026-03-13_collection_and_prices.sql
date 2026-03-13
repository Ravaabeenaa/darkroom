ALTER TABLE services ADD COLUMN collection_options TEXT DEFAULT NULL;
ALTER TABLE services ADD COLUMN turnaround_prices TEXT DEFAULT NULL;
ALTER TABLE services ADD COLUMN pushpull_prices TEXT DEFAULT NULL;
ALTER TABLE services ADD COLUMN collection_prices TEXT DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN collection_option TEXT DEFAULT NULL;
ALTER TABLE order_items_original ADD COLUMN collection_option TEXT DEFAULT NULL;
