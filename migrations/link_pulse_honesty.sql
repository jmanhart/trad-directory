-- link-pulse honesty pass.
--
-- The first migration seeded `status` from the old, unreliable is_broken flag
-- and left stale `checked_at` timestamps — so ~all rows claimed a verdict
-- ("alive") and a check date the reliable probe never actually produced.
-- This adds an honest `unchecked` status, lets "never checked" be a real NULL,
-- and resets every row to a clean baseline. The wave checker (and the manual
-- "Check Link" button) fill in real verdicts over time; nothing claims a status
-- it didn't earn.

-- 1. Allow 'unchecked' in the status check.
ALTER TABLE link_check_results
  DROP CONSTRAINT IF EXISTS link_check_results_status_check;
ALTER TABLE link_check_results
  ADD CONSTRAINT link_check_results_status_check
  CHECK (status IN ('unchecked', 'alive', 'suspect', 'dead', 'unknown'));
ALTER TABLE link_check_results ALTER COLUMN status SET DEFAULT 'unchecked';

-- 2. "Never checked" must be representable as NULL.
ALTER TABLE link_check_results ALTER COLUMN checked_at DROP NOT NULL;
ALTER TABLE link_check_results ALTER COLUMN checked_at DROP DEFAULT;

-- 3. Clean-slate reset: no inherited verdicts, no fake check dates. Everything
--    becomes due now so the reliable checker re-verifies it over the next waves.
UPDATE link_check_results
  SET status = 'unchecked',
      fail_streak = 0,
      last_alive_at = NULL,
      checked_at = NULL,
      is_broken = false,
      next_check_at = now();
