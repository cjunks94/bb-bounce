/**
 * PostgreSQL Connection Pool
 * Handles database connections with automatic reconnection and error handling
 */

const { Pool } = require('pg');

// Create connection pool with Railway-compatible settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  // 5s lost the race against Railway's internal DNS/Postgres warmup on cold
  // deploys, which made the readiness probe fail and roll back deploys.
  connectionTimeoutMillis: 10000,
});

// Log connection events
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  // Log and continue. A single dropped idle client should not kill the
  // container — real query failures surface at the call site, and the
  // process-wide /health probe will catch sustained outages.
  console.error('Unexpected database error (idle client):', err);
});

// Health check function
async function healthCheck() {
  try {
    const result = await pool.query('SELECT NOW()');
    return { healthy: true, timestamp: result.rows[0].now };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error: error.message };
  }
}

module.exports = { pool, healthCheck };
