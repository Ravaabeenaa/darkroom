-- Delivery address was previously only stored (unreliably) inside an order_items
-- row's service_group column, and only when the delivery charge was non-zero.
-- Give it a proper home on the order itself so it's always persisted.
ALTER TABLE orders ADD COLUMN delivery_address TEXT DEFAULT NULL;
