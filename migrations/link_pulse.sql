-- link-pulse: confidence-based health state for Instagram link checks.
--
-- Extends link_check_results (keeps existing rows) with a status state machine
-- and priority-wave scheduling fields. The legacy boolean `is_broken` is kept
-- and mirrored (is_broken = status = 'dead') during the cutover so existing
-- readers (listBrokenLinks / listBrokenHandles) keep working; it can be dropped
-- once all consumers move to `status`.
--
-- status: alive | suspect | dead | unknown
--   alive   - web_profile_info returned data.user
--   suspect - one-or-more consecutive dead signals, not yet confirmed
--   dead     - fail_streak reached the confirm threshold (surface for culling)
--   unknown  - could not determine (rate limited / login wall / error); never
--              counts against a link
ALTER TABLE link_check_results
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (status IN ('alive', 'suspect', 'dead', 'unknown')),
  ADD COLUMN IF NOT EXISTS fail_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_alive_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ignored BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Seed status from the legacy boolean for pre-existing rows. next_check_at
-- defaults to now(), so every existing row is immediately due for a re-check
-- with the new (reliable) probe — the old HTML-based data is untrustworthy.
UPDATE link_check_results
  SET status = CASE WHEN is_broken THEN 'dead' ELSE 'alive' END
  WHERE status = 'unknown';

-- The scheduler pulls the most-overdue rows first.
CREATE INDEX IF NOT EXISTS idx_link_check_next_check
  ON link_check_results (next_check_at);
CREATE INDEX IF NOT EXISTS idx_link_check_status
  ON link_check_results (status);

-- link_check_cursor is no longer used by the wave scheduler (which orders by
-- next_check_at). Left in place for now; drop in a later cleanup migration.
