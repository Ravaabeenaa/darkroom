CREATE TABLE IF NOT EXISTS carousel_slides (
  id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  filename    TEXT    NOT NULL,
  film_name   TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_carousel_slides_sort ON carousel_slides(sort_order ASC);
