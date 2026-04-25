-- Migration: Create bookmarks table
-- Description: User bookmarks for tracking competitions with cascade delete
-- Requirements: 10.1, 10.4, 10.6, 10.7

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_bookmark UNIQUE (user_id, competition_id)
);

-- Index for efficient user bookmark lookups
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);

-- Index for efficient competition bookmark lookups
CREATE INDEX idx_bookmarks_competition_id ON bookmarks(competition_id);

-- Composite index for bookmark existence checks
CREATE INDEX idx_bookmarks_user_competition ON bookmarks(user_id, competition_id);

COMMENT ON TABLE bookmarks IS 'User bookmarks linking users to competitions they want to track';
COMMENT ON COLUMN bookmarks.id IS 'Unique identifier (UUID v4)';
COMMENT ON COLUMN bookmarks.user_id IS 'Foreign key to users table (cascade delete)';
COMMENT ON COLUMN bookmarks.competition_id IS 'Foreign key to competitions table (cascade delete)';
COMMENT ON COLUMN bookmarks.created_at IS 'Bookmark creation timestamp';
COMMENT ON CONSTRAINT unique_bookmark ON bookmarks IS 'Prevents duplicate bookmarks for same user and competition';
