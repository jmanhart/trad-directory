-- Fix: Set all existing rows to NULL (remove timestamps from existing items)
-- This ensures only NEW items going forward will have created_at timestamps

-- Clear created_at for all existing artists
UPDATE artists
SET created_at = NULL;

-- Clear created_at for all existing tattoo_shops
UPDATE tattoo_shops
SET created_at = NULL;

-- Verify: Check that all existing rows are now NULL
-- SELECT COUNT(*) FROM artists WHERE created_at IS NULL;
-- SELECT COUNT(*) FROM tattoo_shops WHERE created_at IS NULL;

-- Note: The DEFAULT NOW() will still apply to new rows inserted after this script runs

