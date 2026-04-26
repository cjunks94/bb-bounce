/**
 * Brick rule tests — exercises the actual public/js/bricks.js module.
 * Previously these tests duplicated the formulas inline, so they passed
 * regardless of what the game shipped.
 */

const {
  calculateBrickRows,
  calculateBlockHitRequirement,
  getBrickColor,
  calculateBlockScore
} = require('../public/js/bricks');

describe('Progressive Difficulty System', () => {
  describe('Dynamic Row Scaling', () => {
    it('starts with 5 rows at level 1', () => {
      expect(calculateBrickRows(1)).toBe(5);
    });

    it('adds a row each level through level 6', () => {
      expect(calculateBrickRows(2)).toBe(6);
      expect(calculateBrickRows(3)).toBe(7);
      expect(calculateBrickRows(4)).toBe(8);
      expect(calculateBrickRows(5)).toBe(9);
      expect(calculateBrickRows(6)).toBe(10);
    });

    it('caps at 10 rows for higher levels', () => {
      expect(calculateBrickRows(7)).toBe(10);
      expect(calculateBrickRows(20)).toBe(10);
      expect(calculateBrickRows(100)).toBe(10);
    });
  });

  describe('Multi-Hit Block Requirements', () => {
    describe('Levels 1-6 (all 1-hit)', () => {
      it('returns 1 for every row at level 1', () => {
        for (let r = 0; r < 5; r++) {
          expect(calculateBlockHitRequirement(1, r)).toBe(1);
        }
      });

      it('returns 1 for every row at level 6', () => {
        for (let r = 0; r < 10; r++) {
          expect(calculateBlockHitRequirement(6, r)).toBe(1);
        }
      });
    });

    describe('Levels 7-9 (top half is 2-hit)', () => {
      it('marks the top 5 of 10 rows as 2-hit at level 7', () => {
        expect(calculateBlockHitRequirement(7, 0)).toBe(2);
        expect(calculateBlockHitRequirement(7, 4)).toBe(2);
        expect(calculateBlockHitRequirement(7, 5)).toBe(1);
        expect(calculateBlockHitRequirement(7, 9)).toBe(1);
      });

      it('keeps the same split at level 9', () => {
        expect(calculateBlockHitRequirement(9, 0)).toBe(2);
        expect(calculateBlockHitRequirement(9, 5)).toBe(1);
      });
    });

    describe('Levels 10-12 (introduce 3-hit at top 25%)', () => {
      it('splits 25/40/35 at level 10', () => {
        expect(calculateBlockHitRequirement(10, 0)).toBe(3);
        expect(calculateBlockHitRequirement(10, 1)).toBe(3);
        expect(calculateBlockHitRequirement(10, 2)).toBe(2);
        expect(calculateBlockHitRequirement(10, 5)).toBe(2);
        expect(calculateBlockHitRequirement(10, 6)).toBe(1);
        expect(calculateBlockHitRequirement(10, 9)).toBe(1);
      });
    });

    describe('Levels 13+ (top half 3-hit)', () => {
      it('splits 50/30/20 at level 13', () => {
        expect(calculateBlockHitRequirement(13, 0)).toBe(3);
        expect(calculateBlockHitRequirement(13, 4)).toBe(3);
        expect(calculateBlockHitRequirement(13, 5)).toBe(2);
        expect(calculateBlockHitRequirement(13, 7)).toBe(2);
        expect(calculateBlockHitRequirement(13, 8)).toBe(1);
        expect(calculateBlockHitRequirement(13, 9)).toBe(1);
      });

      it('still works at level 20', () => {
        expect(calculateBlockHitRequirement(20, 0)).toBe(3);
        expect(calculateBlockHitRequirement(20, 5)).toBe(2);
        expect(calculateBlockHitRequirement(20, 9)).toBe(1);
      });
    });
  });

  describe('Block Scoring', () => {
    it('awards 10 / 25 / 50 / 100 for 1- / 2- / 3- / 4-hit bricks', () => {
      expect(calculateBlockScore(1)).toBe(10);
      expect(calculateBlockScore(2)).toBe(25);
      expect(calculateBlockScore(3)).toBe(50);
      expect(calculateBlockScore(4)).toBe(100);
    });

    it('falls back to 10 for unknown hit counts', () => {
      expect(calculateBlockScore(0)).toBe(10);
      expect(calculateBlockScore(5)).toBe(10);
      expect(calculateBlockScore(-1)).toBe(10);
    });

    it('keeps multipliers (2.5x / 5x / 10x) over 1-hit baseline', () => {
      expect(calculateBlockScore(2) / calculateBlockScore(1)).toBe(2.5);
      expect(calculateBlockScore(3) / calculateBlockScore(1)).toBe(5);
      expect(calculateBlockScore(4) / calculateBlockScore(1)).toBe(10);
    });
  });

  describe('Block Color', () => {
    it('returns the row base color for 1-hit blocks', () => {
      expect(getBrickColor(1, 0, 0)).toBe('#ff0000');
      expect(getBrickColor(1, 0, 1)).toBe('#ff7700');
      expect(getBrickColor(1, 0, 4)).toBe('#0077ff');
    });

    it('darkens proportionally to remaining hits on multi-hit blocks', () => {
      const fresh = getBrickColor(3, 0, 0);
      const oneLeft = getBrickColor(3, 1, 0);
      const last = getBrickColor(3, 2, 0);
      // Each hit increases the darken factor → red value should rise
      const r = (hex) => parseInt(hex.substr(1, 2), 16);
      expect(r(fresh)).toBeLessThan(r(oneLeft));
      expect(r(oneLeft)).toBeLessThan(r(last));
    });

    it('produces valid 6-digit hex colors for every state in the matrix', () => {
      for (let maxHits = 1; maxHits <= 4; maxHits++) {
        for (let currentHits = 0; currentHits <= maxHits; currentHits++) {
          for (let row = 0; row < 5; row++) {
            expect(getBrickColor(maxHits, currentHits, row)).toMatch(/^#[0-9a-f]{6}$/i);
          }
        }
      }
    });
  });

  describe('Game Balance', () => {
    function difficultyScore(level) {
      const rows = calculateBrickRows(level);
      let total = 0;
      for (let r = 0; r < rows; r++) {
        total += calculateBlockHitRequirement(level, r);
      }
      return total;
    }

    it('never decreases difficulty between consecutive levels', () => {
      for (let level = 1; level < 20; level++) {
        expect(difficultyScore(level + 1)).toBeGreaterThanOrEqual(difficultyScore(level));
      }
    });
  });
});
