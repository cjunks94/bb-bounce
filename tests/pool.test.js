/**
 * db/pool.js — pure helper tests.
 *
 * Only `shouldUseSsl` is exercised here. The pool itself can't be tested
 * without a live Postgres, but the host-based SSL decision is the bit
 * that actually broke prod, so it gets coverage.
 */

const { shouldUseSsl } = require('../db/pool');

describe('shouldUseSsl', () => {
  describe('local connections (no SSL)', () => {
    it('returns false for localhost', () => {
      expect(shouldUseSsl('postgres://user:pass@localhost:5432/db')).toBe(false);
    });

    it('returns false for 127.0.0.1', () => {
      expect(shouldUseSsl('postgres://user:pass@127.0.0.1:5432/db')).toBe(false);
    });

    it('returns false for 0.0.0.0', () => {
      expect(shouldUseSsl('postgres://user:pass@0.0.0.0:5432/db')).toBe(false);
    });
  });

  describe('remote connections (SSL on)', () => {
    it('enables SSL for a Railway internal URL', () => {
      expect(shouldUseSsl('postgres://postgres:secret@postgres.railway.internal:5432/railway')).toBe(true);
    });

    it('enables SSL for a Railway public proxy URL', () => {
      expect(shouldUseSsl('postgres://postgres:secret@viaduct.proxy.rlwy.net:31234/railway')).toBe(true);
    });

    it('enables SSL for any other hosted Postgres URL', () => {
      expect(shouldUseSsl('postgres://u:p@db.supabase.co:5432/postgres')).toBe(true);
      expect(shouldUseSsl('postgresql://u:p@some-host.us-east-1.rds.amazonaws.com:5432/db')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns false when no URL is provided', () => {
      expect(shouldUseSsl(undefined)).toBe(false);
      expect(shouldUseSsl(null)).toBe(false);
      expect(shouldUseSsl('')).toBe(false);
    });

    it('falls back to NODE_ENV for malformed URLs', () => {
      const original = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        expect(shouldUseSsl('not-a-url')).toBe(true);
        process.env.NODE_ENV = 'development';
        expect(shouldUseSsl('not-a-url')).toBe(false);
      } finally {
        process.env.NODE_ENV = original;
      }
    });
  });
});
