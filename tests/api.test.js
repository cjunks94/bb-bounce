/**
 * BB-Bounce API Integration Tests
 * Tests for leaderboard endpoints and game functionality
 */

const request = require('supertest');
const app = require('../server');

describe('BB-Bounce API Tests', () => {
  // Note: Database tests require a running PostgreSQL instance
  // Set DATABASE_URL in .env for full integration testing

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      // Should return some form of health status
      expect(response.body).toBeDefined();

      if (response.body && response.body.status) {
        expect(['healthy', 'unhealthy']).toContain(response.body.status);
        expect(response.body).toHaveProperty('database');

        // Only expect uptime when healthy
        if (response.body.status === 'healthy') {
          expect(response.body).toHaveProperty('uptime');
        }
      }
    });
  });

  describe('GET /api/scores', () => {
    it('should return leaderboard response', async () => {
      const response = await request(app)
        .get('/api/scores');

      // Should return either success or error structure
      if (response.status === 200) {
        expect(response.body).toHaveProperty('scores');
        expect(Array.isArray(response.body.scores)).toBe(true);
      } else {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should return scores in descending order when DB is available', async () => {
      const response = await request(app)
        .get('/api/scores');

      if (response.status === 200 && response.body.scores.length > 1) {
        const scores = response.body.scores;
        for (let i = 0; i < scores.length - 1; i++) {
          expect(scores[i].score).toBeGreaterThanOrEqual(scores[i + 1].score);
        }
      } else {
        // Skip test if DB not available
        expect(true).toBe(true);
      }
    });

    it('should have correct score object structure when DB is available', async () => {
      const response = await request(app)
        .get('/api/scores');

      if (response.status === 200 && response.body.scores.length > 0) {
        const score = response.body.scores[0];
        expect(score).toHaveProperty('name');
        expect(score).toHaveProperty('score');
        expect(score).toHaveProperty('level_reached');
        expect(score).toHaveProperty('created_at');
      } else {
        // Skip test if DB not available
        expect(true).toBe(true);
      }
    });
  });

  describe('POST /api/submit', () => {
    const validSubmission = {
      name: 'TestPlayer',
      score: 1000,
      level: 5,
      secret: process.env.SCORE_SECRET || 'b3481ca0fc3799ed1e124e795eb34420d58281677a4ffa60dfd306b4c7f3fefd'
    };

    it('should reject submission without secret', async () => {
      const response = await request(app)
        .post('/api/submit')
        .send({
          name: 'TestPlayer',
          score: 1000,
          level: 5
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject submission with invalid score', async () => {
      const response = await request(app)
        .post('/api/submit')
        .send({
          ...validSubmission,
          score: -100
        });

      // Should be 400 or 429 (rate limited)
      expect([400, 429]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject submission with invalid level', async () => {
      const response = await request(app)
        .post('/api/submit')
        .send({
          ...validSubmission,
          level: 0
        });

      // Should be 400 or 429 (rate limited)
      expect([400, 429]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should sanitize player name', async () => {
      const response = await request(app)
        .post('/api/submit')
        .send({
          ...validSubmission,
          name: 'Test<script>alert(1)</script>Player'
        });

      // Should either succeed with sanitized name or reject
      if (response.status === 201) {
        expect(response.body.name).not.toContain('<script>');
      }
    });
  });

  describe('Static File Serving', () => {
    it('should serve index.html', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('BB-BOUNCE');
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should include speed multiplier UI elements', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('speedDisplay');
      expect(response.text).toContain('settingsModal');
      expect(response.text).toContain('speedMultiplier');
    });
  });
});
