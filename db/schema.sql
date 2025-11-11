-- BB-Bounce Database Schema
-- PostgreSQL 14+
-- Author: Christopher Junker

-- Drop table if exists (for clean migrations)
DROP TABLE IF EXISTS high_scores CASCADE;

-- High Scores Table
CREATE TABLE high_scores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL DEFAULT 'Anonymous',
  score INTEGER NOT NULL,
  level_reached INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_hash TEXT NOT NULL,

  -- Constraints for data integrity
  CONSTRAINT score_bounds CHECK (score >= 0 AND score <= 999999),
  CONSTRAINT level_bounds CHECK (level_reached >= 1 AND level_reached <= 100),
  CONSTRAINT name_length CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 20)
);

-- Indexes for fast leaderboard queries
CREATE INDEX idx_score_desc ON high_scores(score DESC, created_at DESC);
CREATE INDEX idx_created_at ON high_scores(created_at DESC);
CREATE INDEX idx_ip_hash_recent ON high_scores(ip_hash, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE high_scores IS 'Global leaderboard for BB-Bounce game';
COMMENT ON COLUMN high_scores.ip_hash IS 'SHA-256 hash of submitter IP (privacy-friendly rate limiting)';
COMMENT ON COLUMN high_scores.score IS 'Final score (0-999,999)';
COMMENT ON COLUMN high_scores.level_reached IS 'Highest level completed (1-100)';

-- Optional: Auto-cleanup function to purge old scores (>30 days)
CREATE OR REPLACE FUNCTION cleanup_old_scores() RETURNS trigger AS $$
BEGIN
  DELETE FROM high_scores WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Trigger to run cleanup after each insert (keeps table size bounded)
-- Uncomment to enable:
-- CREATE TRIGGER trigger_cleanup_scores
--   AFTER INSERT ON high_scores
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION cleanup_old_scores();

-- View for top 100 all-time scores
CREATE OR REPLACE VIEW top_scores AS
SELECT
  id,
  name,
  score,
  level_reached,
  created_at,
  ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) AS rank
FROM high_scores
ORDER BY score DESC, created_at ASC
LIMIT 100;

COMMENT ON VIEW top_scores IS 'Materialized view of top 100 scores with rankings';
