CREATE INDEX IF NOT EXISTS idx_service_images_service_id
ON service_images(service_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_service_primary_image
ON service_images(service_id)
WHERE kind = 'primary';

CREATE INDEX IF NOT EXISTS idx_service_images_sort
ON service_images(service_id, kind, sort_order);