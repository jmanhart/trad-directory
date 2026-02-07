-- Alternative: use this if add_submission_status_values.sql fails with "constraint does not exist".
-- This finds and drops any check constraint on submissions.status, then adds the new one.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
    WHERE t.relname = 'submissions' AND a.attname = 'status' AND c.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE submissions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE submissions
  ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('new', 'in_progress', 'resolved', 'closed', 'added', 'deleted'));
