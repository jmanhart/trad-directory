-- Allow status values 'added' and 'deleted'.
-- Run in Supabase SQL Editor. If the first block errors ("constraint does not exist"), run the second block only.

-- Option A: Standard name (try this first)
ALTER TABLE submissions
  DROP CONSTRAINT IF EXISTS submissions_status_check;

ALTER TABLE submissions
  ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('new', 'in_progress', 'resolved', 'closed', 'added', 'deleted'));

-- Option B: If Option A fails, your constraint may have another name. Run this to find and drop it:
-- SELECT conname FROM pg_constraint c
-- JOIN pg_class t ON c.conrelid = t.oid
-- WHERE t.relname = 'submissions' AND c.contype = 'c';
-- Then: ALTER TABLE submissions DROP CONSTRAINT <name_from_above>;
-- Then run the ADD CONSTRAINT from Option A (the two lines starting with ADD CONSTRAINT).
