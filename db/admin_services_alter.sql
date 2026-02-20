-- Ensure these columns exist (safe if you already created via admin_schema.sql earlier)
ALTER TABLE services ADD COLUMN primary_image_key TEXT;