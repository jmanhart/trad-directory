-- Migration 014: Enable RLS on tables that were missing it
-- Tables: artist_location, submissions, link_check_results, link_check_cursor

-- ============================================
-- artist_location
-- Read: public (frontend fetches for map/location pages)
-- Write: service role only (API endpoints)
-- ============================================
ALTER TABLE artist_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artist_location_select_public"
  ON artist_location FOR SELECT
  USING (true);

-- ============================================
-- submissions
-- Read: service role only (admin API)
-- Write: anon can INSERT (submit reports), service role can UPDATE
-- ============================================
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_insert_public"
  ON submissions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- link_check_results
-- Read/Write: service role only (cron job + admin API)
-- No public access needed
-- ============================================
ALTER TABLE link_check_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- link_check_cursor
-- Read/Write: service role only (cron job)
-- No public access needed
-- ============================================
ALTER TABLE link_check_cursor ENABLE ROW LEVEL SECURITY;
