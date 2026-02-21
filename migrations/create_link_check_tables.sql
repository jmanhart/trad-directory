-- Link Check Results: one row per entity, upserted each check cycle
CREATE TABLE IF NOT EXISTS link_check_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'shop')),
  entity_id BIGINT NOT NULL,
  entity_name TEXT,
  instagram_handle TEXT NOT NULL,
  status_code INT,
  error_message TEXT,
  is_broken BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);

-- Index for quickly finding broken links
CREATE INDEX IF NOT EXISTS idx_link_check_results_broken
  ON link_check_results (is_broken)
  WHERE is_broken = true;

-- Link Check Cursor: single row tracking batch position
CREATE TABLE IF NOT EXISTS link_check_cursor (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_offset INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the cursor row
INSERT INTO link_check_cursor (id, current_offset)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
