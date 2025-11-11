/**
 * Rate Limiting Middleware
 * Prevents spam and abuse of leaderboard submission endpoint
 */

const rateLimit = require('express-rate-limit');

// Strict rate limiter for score submissions (1 per 30 seconds per IP)
const submitScoreLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 30000, // 30 seconds
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1, // 1 request per window
  message: {
    error: 'Too many score submissions. Please wait 30 seconds.',
    retryAfter: 30
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use Cloudflare IP header if available, otherwise fallback to req.ip
    return req.headers[process.env.CLIENT_IP_HEADER?.toLowerCase()] ||
           req.ip ||
           req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many attempts. Please wait before submitting again.',
      retryAfter: 30
    });
  }
});

// Lenient rate limiter for leaderboard fetches (60 per minute)
const fetchScoresLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

module.exports = {
  submitScoreLimiter,
  fetchScoresLimiter
};
