/**
 * Input Validation Middleware
 * Server-side validation to prevent cheating and SQL injection
 */

const crypto = require('crypto');

/**
 * Validate score submission data
 * Ensures scores are within valid bounds and secret token matches
 */
function validateScoreSubmission(req, res, next) {
  const { name, score, level, secret } = req.body;

  // Required fields check
  if (score === undefined || level === undefined || !secret) {
    return res.status(400).json({
      error: 'Missing required fields: score, level, secret'
    });
  }

  // Name validation (optional, defaults to "Anonymous")
  if (name !== undefined) {
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    if (name.length > 20) {
      return res.status(400).json({ error: 'Name too long (max 20 characters)' });
    }
    if (name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    // Sanitize name (remove special characters that could break display)
    req.body.name = name.trim().replace(/[<>'"]/g, '');
  }

  // Score validation
  if (!Number.isInteger(score) || score < 0 || score > 999999) {
    return res.status(400).json({
      error: 'Invalid score. Must be integer between 0 and 999,999'
    });
  }

  // Level validation
  if (!Number.isInteger(level) || level < 1 || level > 100) {
    return res.status(400).json({
      error: 'Invalid level. Must be integer between 1 and 100'
    });
  }

  // Secret token validation (prevents client-side cheating)
  if (secret !== process.env.SCORE_SECRET) {
    console.warn('⚠️  Invalid secret token attempt from IP:', getClientIp(req));
    return res.status(401).json({
      error: 'Invalid authentication token'
    });
  }

  // Additional anti-cheat logic (score plausibility check)
  const maxPossibleScore = level * 500 + 10000; // Rough estimate
  if (score > maxPossibleScore) {
    console.warn('⚠️  Suspiciously high score:', { score, level, ip: getClientIp(req) });
    return res.status(400).json({
      error: 'Score exceeds plausible maximum for level reached'
    });
  }

  next();
}

/**
 * Get client IP address (Cloudflare-aware)
 */
function getClientIp(req) {
  const cloudflareIp = req.headers[process.env.CLIENT_IP_HEADER?.toLowerCase()];
  return cloudflareIp || req.ip || req.connection.remoteAddress;
}

/**
 * Hash IP address for privacy-friendly storage
 */
function hashIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

module.exports = {
  validateScoreSubmission,
  getClientIp,
  hashIp
};
