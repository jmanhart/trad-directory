-- Add created_at column to countries table
-- Column is nullable - existing rows will be NULL, only new rows get timestamps
ALTER TABLE countries
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

-- Set default for future inserts only (doesn't affect existing rows)
ALTER TABLE countries
ALTER COLUMN created_at SET DEFAULT NOW();

-- Ensure all existing rows are explicitly NULL (in case default was applied)
UPDATE countries
SET created_at = NULL
WHERE created_at IS NOT NULL;

-- Add created_at column to cities table
-- Column is nullable - existing rows will be NULL, only new rows get timestamps
ALTER TABLE cities
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

-- Set default for future inserts only (doesn't affect existing rows)
ALTER TABLE cities
ALTER COLUMN created_at SET DEFAULT NOW();

-- Ensure all existing rows are explicitly NULL (in case default was applied)
UPDATE cities
SET created_at = NULL
WHERE created_at IS NOT NULL;

-- Optional: Add indexes for better query performance when ordering by created_at
CREATE INDEX IF NOT EXISTS idx_countries_created_at ON countries(created_at DESC) WHERE created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cities_created_at ON cities(created_at DESC) WHERE created_at IS NOT NULL;
