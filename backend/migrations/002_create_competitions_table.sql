-- Migration: Create competitions table
-- Description: Competition data aggregated from multiple external APIs
-- Requirements: 10.1, 10.3, 10.8, 10.9, 10.10

CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  platform VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  location VARCHAR(100),
  prize VARCHAR(100),
  difficulty VARCHAR(20),
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_category CHECK (category IN (
    'Competitive Programming',
    'Hackathons',
    'AI/Data Science',
    'CTF/Security'
  )),
  CONSTRAINT valid_status CHECK (status IN ('upcoming', 'ongoing', 'ended')),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_source CHECK (source IN ('kontests', 'clist', 'kaggle')),
  CONSTRAINT unique_competition UNIQUE (title, platform, start_date)
);

-- Index for efficient category filtering (Requirement 10.8)
CREATE INDEX idx_competitions_category ON competitions(category);

-- Index for efficient status filtering (Requirement 10.9)
CREATE INDEX idx_competitions_status ON competitions(status);

-- Index for efficient sorting and deadline queries (Requirement 10.10)
CREATE INDEX idx_competitions_start_date ON competitions(start_date);

-- Index for efficient end date queries (deadline filtering)
CREATE INDEX idx_competitions_end_date ON competitions(end_date);

-- Index for efficient source filtering
CREATE INDEX idx_competitions_source ON competitions(source);

-- Composite index for common filter combinations
CREATE INDEX idx_competitions_category_status ON competitions(category, status);

-- Index for text search on title
CREATE INDEX idx_competitions_title ON competitions USING gin(to_tsvector('english', title));

COMMENT ON TABLE competitions IS 'Competition data aggregated from Kontests.net, CLIST.by, and Kaggle APIs';
COMMENT ON COLUMN competitions.id IS 'Unique identifier (UUID v4)';
COMMENT ON COLUMN competitions.title IS 'Competition name';
COMMENT ON COLUMN competitions.description IS 'Full description (optional)';
COMMENT ON COLUMN competitions.category IS 'One of four predefined categories';
COMMENT ON COLUMN competitions.platform IS 'Source platform (e.g., CodeForces, Kaggle)';
COMMENT ON COLUMN competitions.url IS 'Link to original competition page';
COMMENT ON COLUMN competitions.start_date IS 'Competition start time (ISO 8601)';
COMMENT ON COLUMN competitions.end_date IS 'Competition end time (ISO 8601)';
COMMENT ON COLUMN competitions.status IS 'Current state (upcoming/ongoing/ended)';
COMMENT ON COLUMN competitions.location IS 'Physical location or online (optional)';
COMMENT ON COLUMN competitions.prize IS 'Prize description (optional)';
COMMENT ON COLUMN competitions.difficulty IS 'Difficulty level (optional)';
COMMENT ON COLUMN competitions.source IS 'API source (kontests/clist/kaggle)';
COMMENT ON COLUMN competitions.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN competitions.updated_at IS 'Last modification timestamp';
