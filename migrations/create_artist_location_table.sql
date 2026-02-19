-- Create artist_location junction table
-- Allows artists to have multiple locations (city + shop pairs)
-- This is ADDITIVE ONLY - does not modify existing tables or columns

-- 1. Create the new junction table
CREATE TABLE artist_location (
  id BIGSERIAL PRIMARY KEY,
  artist_id BIGINT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  city_id BIGINT REFERENCES cities(id) ON DELETE SET NULL,
  shop_id BIGINT REFERENCES tattoo_shops(id) ON DELETE SET NULL,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(artist_id, city_id, shop_id)
);

-- 2. Backfill from existing data
INSERT INTO artist_location (artist_id, city_id, shop_id, is_primary)
SELECT
  a.id AS artist_id,
  a.city_id,
  ash.shop_id,
  true AS is_primary
FROM artists a
LEFT JOIN artist_shop ash ON ash.artist_id = a.id;

-- 3. Verify row count matches
SELECT COUNT(*) AS artist_count FROM artists;
SELECT COUNT(*) AS location_count FROM artist_location;
