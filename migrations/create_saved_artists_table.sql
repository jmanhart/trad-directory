-- Create saved_artists table for user favorites
CREATE TABLE IF NOT EXISTS saved_artists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- Enable Row Level Security
ALTER TABLE saved_artists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved artists
CREATE POLICY "Users can view own saved artists"
  ON saved_artists
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own saved artists
CREATE POLICY "Users can insert own saved artists"
  ON saved_artists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own saved artists
CREATE POLICY "Users can delete own saved artists"
  ON saved_artists
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_artists_user_id ON saved_artists(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_artists_artist_id ON saved_artists(artist_id);

