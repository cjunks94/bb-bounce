/**
 * PostgreSQL Connection Pool
 * Handles database connections with automatic reconnection and error handling
 */

const { Pool } = require('pg');

/**
 * Decide whether to enable SSL based on the connection URL itself, not on
 * NODE_ENV. The previous gate (NODE_ENV === 'production') silently broke
 * production whenever NODE_ENV was unset — the pool would attempt a
 * non-SSL connection, the hosted Postgres would close the socket, and
 * the only symptom was "Connection terminated unexpectedly".
 *
 * Heuristic: SSL on for any remote host. Local development (localhost,
 * 127.0.0.1, 0.0.0.0, or Unix sockets) stays unencrypted.
 */
function shouldUseSsl(connectionString) {
  if (!connectionString) return false;
  try {
    const { hostname } = new URL(connectionString);
    if (!hostname) return false;
    if (hostname.startsWith('/')) return false; // Unix socket path
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false;
    return true;
  } catch {
    // Malformed URL — fall back to the conservative NODE_ENV gate so a
    // bad value doesn't accidentally break local dev.
    return process.env.NODE_ENV === 'production';
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,
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

module.exports = { pool, healthCheck, shouldUseSsl };
