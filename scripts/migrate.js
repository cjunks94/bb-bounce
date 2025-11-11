/**
 * Database Migration Script
 * Runs schema.sql to initialize/update database
 * Safe to run multiple times (uses DROP IF EXISTS)
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Running database migrations...');
    console.log(`📍 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Unknown'}`);

    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('✅ Migrations completed successfully!');

    // Verify table exists
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'high_scores'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table "high_scores" verified');

      // Show row count
      const count = await pool.query('SELECT COUNT(*) FROM high_scores');
      console.log(`📊 Current scores in database: ${count.rows[0].count}`);
    } else {
      console.error('❌ Table "high_scores" not found!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
