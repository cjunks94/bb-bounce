/**
 * Leaderboard API Routes
 * GET /api/scores - Fetch top scores
 * POST /api/submit - Submit new score (rate-limited, validated)
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { validateScoreSubmission, getClientIp, hashIp } = require('../middleware/validation');
const { submitScoreLimiter, fetchScoresLimiter } = require('../middleware/rateLimit');

/**
 * GET /api/scores
 * Fetch top 10 global high scores
 */
router.get('/scores', fetchScoresLimiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Validate limit to prevent abuse
    if (limit > 100 || limit < 1) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const result = await pool.query(`
      SELECT
        name,
        score,
        level_reached,
        created_at,
        ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) AS rank
      FROM high_scores
      ORDER BY score DESC, created_at ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      success: true,
      count: result.rows.length,
      scores: result.rows
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/submit
 * Submit new high score (with validation and rate limiting)
 */
router.post('/submit', submitScoreLimiter, validateScoreSubmission, async (req, res) => {
  try {
    const { name, score, level } = req.body;
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);

    // Database-level rate limiting (prevent duplicate submissions within 30s)
    const recentSubmission = await pool.query(`
      SELECT id
      FROM high_scores
      WHERE ip_hash = $1
        AND created_at > NOW() - INTERVAL '30 seconds'
      LIMIT 1
    `, [ipHash]);

    if (recentSubmission.rows.length > 0) {
      return res.status(429).json({
        error: 'You already submitted a score recently. Please wait.'
      });
    }

    // Insert new score
    const result = await pool.query(`
      INSERT INTO high_scores (name, score, level_reached, ip_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, score, level_reached, created_at
    `, [
      name?.trim() || 'Anonymous',
      score,
      level,
      ipHash
    ]);

    const newScore = result.rows[0];

    // Calculate rank
    const rankResult = await pool.query(`
      SELECT COUNT(*) + 1 AS rank
      FROM high_scores
      WHERE score > $1 OR (score = $1 AND created_at < $2)
    `, [newScore.score, newScore.created_at]);

    const rank = parseInt(rankResult.rows[0].rank);

    console.log(`✅ New score submitted: ${newScore.name} - ${newScore.score} pts (Rank #${rank})`);

    res.status(201).json({
      success: true,
      message: 'Score submitted successfully!',
      score: newScore,
      rank: rank
    });
  } catch (error) {
    console.error('Error submitting score:', error);

    // Handle specific database errors
    if (error.code === '23514') { // Check constraint violation
      return res.status(400).json({
        error: 'Invalid data: score or level out of bounds'
      });
    }

    res.status(500).json({
      error: 'Failed to submit score',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/stats
 * Global statistics (total scores, average, etc.)
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_scores,
        ROUND(AVG(score))::INTEGER AS average_score,
        MAX(score) AS highest_score,
        MAX(level_reached) AS highest_level
      FROM high_scores
    `);

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
