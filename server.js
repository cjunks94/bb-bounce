/**
 * BB-Bounce Server
 * Express server with PostgreSQL leaderboard
 * Author: Christopher Junker
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { healthCheck } = require('./db/pool');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Needed for inline game code
        "https://umami-tracking.cjunker.dev", // Umami analytics (public tracking)
        "https://static.cloudflareinsights.com" // Cloudflare insights
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://umami-tracking.cjunker.dev" // Allow Umami tracking connections
      ]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Static files (serve game frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', leaderboardRoutes);

// Liveness probe — returns 200 as long as the process is alive and the HTTP
// server is accepting connections. No DB call: this endpoint gates Railway's
// deploy promotion (railway.json -> healthcheckPath), so it must NOT fail just
// because Postgres is briefly unreachable on a cold start.
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime()
  });
});

// Readiness probe — checks that the database is reachable. Useful for
// dashboards and external monitoring; not used by Railway for promotion.
app.get('/health/db', async (req, res) => {
  const dbHealth = await healthCheck();

  if (!dbHealth.healthy) {
    return res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: dbHealth.error
    });
  }

  res.json({
    status: 'healthy',
    database: 'connected',
    timestamp: dbHealth.timestamp,
    uptime: process.uptime()
  });
});

// Catch-all route (serve index.html for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║     🎮 BB-Bounce Server Started       ║
  ╠═══════════════════════════════════════╣
  ║  Port: ${PORT.toString().padEnd(30)} ║
  ║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)} ║
  ║  Health: http://localhost:${PORT}/health ║
  ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app; // Export for testing
