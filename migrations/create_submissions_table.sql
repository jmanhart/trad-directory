-- Unified submissions table for both reports and new artist submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Submission type: 'report' or 'new_artist'
  submission_type TEXT NOT NULL CHECK (submission_type IN ('report', 'new_artist')),
  
  -- For reports: entity being reported
  entity_type TEXT CHECK (entity_type IN ('artist', 'shop')),
  entity_id TEXT,
  
  -- For reports: what's wrong
  reason TEXT,
  
  -- For new_artist: artist details
  artist_name TEXT,
  artist_instagram_handle TEXT,
  artist_city TEXT,
  artist_state TEXT,
  artist_country TEXT,
  artist_shop_name TEXT,
  artist_shop_instagram_handle TEXT,
  
  -- Shared fields
  details TEXT,
  reporter_email TEXT,
  page_url TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_entity ON submissions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
