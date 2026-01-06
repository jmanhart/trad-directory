-- Add created_at column to artists table
-- Column is nullable - existing rows will be NULL, only new rows get timestamps
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

-- Set default for future inserts only (doesn't affect existing rows)
ALTER TABLE artists
ALTER COLUMN created_at SET DEFAULT NOW();

-- Ensure all existing rows are explicitly NULL (in case default was applied)
UPDATE artists
SET created_at = NULL
WHERE created_at IS NOT NULL;

-- Add created_at column to tattoo_shops table
-- Column is nullable - existing rows will be NULL, only new rows get timestamps
ALTER TABLE tattoo_shops
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

-- Set default for future inserts only (doesn't affect existing rows)
ALTER TABLE tattoo_shops
ALTER COLUMN created_at SET DEFAULT NOW();

-- Ensure all existing rows are explicitly NULL (in case default was applied)
UPDATE tattoo_shops
SET created_at = NULL
WHERE created_at IS NOT NULL;

-- Note: Existing rows will have NULL for created_at, which is fine.
-- Only new rows added after this migration will have timestamps.
-- The application code already handles NULL values gracefully.

-- Optional: Add an index for better query performance when ordering by created_at
-- This helps with queries that filter/sort by created_at
CREATE INDEX IF NOT EXISTS idx_artists_created_at ON artists(created_at DESC) WHERE created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tattoo_shops_created_at ON tattoo_shops(created_at DESC) WHERE created_at IS NOT NULL;

