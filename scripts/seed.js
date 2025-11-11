/**
 * Database Seeder
 * Adds sample high scores for testing
 */

require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');

const SAMPLE_SCORES = [
  { name: 'SpeedRunner', score: 8500, level: 15 },
  { name: 'BrickMaster', score: 7200, level: 12 },
  { name: 'ArcadeKing', score: 6800, level: 11 },
  { name: 'PixelPro', score: 5500, level: 9 },
  { name: 'RetroGamer', score: 4900, level: 8 },
  { name: 'PaddleWizard', score: 4200, level: 7 },
  { name: 'BallBouncer', score: 3700, level: 6 },
  { name: 'ComboQueen', score: 3100, level: 5 },
  { name: 'NeonNinja', score: 2600, level: 4 },
  { name: 'Anonymous', score: 2100, level: 3 }
];

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🌱 Seeding database with sample scores...');

    // Clear existing scores (optional - comment out to preserve real scores)
    // await pool.query('DELETE FROM high_scores');
    // console.log('🗑️  Cleared existing scores');

    for (const score of SAMPLE_SCORES) {
      const ipHash = crypto.createHash('sha256').update(`seed-${score.name}`).digest('hex');

      await pool.query(`
        INSERT INTO high_scores (name, score, level_reached, ip_hash)
        VALUES ($1, $2, $3, $4)
      `, [score.name, score.score, score.level, ipHash]);

      console.log(`✅ Added: ${score.name} - ${score.score} pts (Level ${score.level})`);
    }

    console.log('✅ Seeding completed!');

    // Show final count
    const result = await pool.query('SELECT COUNT(*) FROM high_scores');
    console.log(`📊 Total scores in database: ${result.rows[0].count}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
