-- Manual metadata for the custom Instagram gallery widget (Instagram's oEmbed API now
-- requires a registered Meta app + access token, so we can't auto-fetch photo/caption/handle —
-- the admin enters them when editing a post in /admin/instagram).
ALTER TABLE instagram_posts ADD COLUMN account_handle TEXT;
ALTER TABLE instagram_posts ADD COLUMN caption TEXT;
ALTER TABLE instagram_posts ADD COLUMN photo_key TEXT;
