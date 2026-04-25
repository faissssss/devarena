-- Migration: Create sync_logs table
-- Description: Synchronization tracking for external API data fetches
-- Requirements: 10.1, 10.5

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_sync_status CHECK (status IN ('success', 'error', 'partial')),
  CONSTRAINT valid_source CHECK (source IN ('kontests', 'clist', 'kaggle')),
  CONSTRAINT valid_record_count CHECK (record_count >= 0)
);

-- Index for efficient sync log queries sorted by time (most recent first)
CREATE INDEX idx_sync_logs_synced_at ON sync_logs(synced_at DESC);

-- Index for efficient source-specific log queries
CREATE INDEX idx_sync_logs_source ON sync_logs(source);

-- Index for efficient status filtering
CREATE INDEX idx_sync_logs_status ON sync_logs(status);

-- Composite index for source and time queries
CREATE INDEX idx_sync_logs_source_synced_at ON sync_logs(source, synced_at DESC);

COMMENT ON TABLE sync_logs IS 'Audit log of data synchronization operations from external APIs';
COMMENT ON COLUMN sync_logs.id IS 'Unique identifier (UUID v4)';
COMMENT ON COLUMN sync_logs.source IS 'API source name (kontests/clist/kaggle)';
COMMENT ON COLUMN sync_logs.status IS 'Sync result (success/error/partial)';
COMMENT ON COLUMN sync_logs.record_count IS 'Number of competitions processed';
COMMENT ON COLUMN sync_logs.error_message IS 'Error details if status is error (optional)';
COMMENT ON COLUMN sync_logs.synced_at IS 'Sync execution timestamp';
