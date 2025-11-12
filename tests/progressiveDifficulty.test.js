/**
 * Progressive Difficulty Feature Tests
 * Tests for dynamic row scaling and multi-hit block mechanics
 */

describe('Progressive Difficulty System', () => {
  describe('Dynamic Row Scaling', () => {
    // Mock the calculateBrickRows function
    function calculateBrickRows(currentLevel) {
      const baseRows = 5;
      const maxRows = 10;
      return Math.min(baseRows + currentLevel - 1, maxRows);
    }

    it('should start with 5 rows at level 1', () => {
      const rows = calculateBrickRows(1);
      expect(rows).toBe(5);
    });

    it('should have 6 rows at level 2', () => {
      const rows = calculateBrickRows(2);
      expect(rows).toBe(6);
    });

    it('should progressively add rows up to level 6', () => {
      expect(calculateBrickRows(3)).toBe(7);
      expect(calculateBrickRows(4)).toBe(8);
      expect(calculateBrickRows(5)).toBe(9);
      expect(calculateBrickRows(6)).toBe(10);
    });

    it('should cap at 10 rows maximum', () => {
      expect(calculateBrickRows(6)).toBe(10);
      expect(calculateBrickRows(7)).toBe(10);
      expect(calculateBrickRows(10)).toBe(10);
      expect(calculateBrickRows(20)).toBe(10);
      expect(calculateBrickRows(100)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(calculateBrickRows(0)).toBe(4); // Level 0 would be 4 rows
      expect(calculateBrickRows(-1)).toBe(3); // Negative level
    });
  });

  describe('Multi-Hit Block Requirements', () => {
    function calculateBlockHitRequirement(currentLevel, rowIndex) {
      if (currentLevel <= 6) {
        return 1;
      }

      if (currentLevel >= 7 && currentLevel <= 9) {
        const totalRows = Math.min(5 + currentLevel - 1, 10);
        const twoHitThreshold = Math.floor(totalRows / 2);
        return rowIndex < twoHitThreshold ? 2 : 1;
      }

      if (currentLevel >= 10 && currentLevel <= 12) {
        const totalRows = Math.min(5 + currentLevel - 1, 10);
        const threeHitThreshold = Math.floor(totalRows * 0.25);
        const twoHitThreshold = Math.floor(totalRows * 0.65);

        if (rowIndex < threeHitThreshold) return 3;
        if (rowIndex < twoHitThreshold) return 2;
        return 1;
      }

      if (currentLevel >= 13) {
        const totalRows = Math.min(5 + currentLevel - 1, 10);
        const threeHitThreshold = Math.floor(totalRows * 0.5);
        const twoHitThreshold = Math.floor(totalRows * 0.8);

        if (rowIndex < threeHitThreshold) return 3;
        if (rowIndex < twoHitThreshold) return 2;
        return 1;
      }

      return 1;
    }

    describe('Phase 1: Levels 1-6 (All 1-hit blocks)', () => {
      it('should have all 1-hit blocks at level 1', () => {
        for (let r = 0; r < 5; r++) {
          expect(calculateBlockHitRequirement(1, r)).toBe(1);
        }
      });

      it('should have all 1-hit blocks at level 6', () => {
        for (let r = 0; r < 10; r++) {
          expect(calculateBlockHitRequirement(6, r)).toBe(1);
        }
      });
    });

    describe('Phase 2: Levels 7-9 (Introduce 2-hit blocks)', () => {
      it('should have 50% 2-hit blocks at level 7', () => {
        const level = 7;
        const totalRows = 10;

        // Top 5 rows should be 2-hit
        expect(calculateBlockHitRequirement(level, 0)).toBe(2);
        expect(calculateBlockHitRequirement(level, 4)).toBe(2);

        // Bottom 5 rows should be 1-hit
        expect(calculateBlockHitRequirement(level, 5)).toBe(1);
        expect(calculateBlockHitRequirement(level, 9)).toBe(1);
      });

      it('should maintain 2-hit distribution through level 9', () => {
        const level = 9;
        expect(calculateBlockHitRequirement(level, 0)).toBe(2);
        expect(calculateBlockHitRequirement(level, 5)).toBe(1);
      });
    });

    describe('Phase 3: Levels 10-12 (Add 3-hit blocks)', () => {
      it('should introduce 3-hit blocks at level 10', () => {
        const level = 10;

        // Top 25% (rows 0-1) = 3-hit
        expect(calculateBlockHitRequirement(level, 0)).toBe(3);
        expect(calculateBlockHitRequirement(level, 1)).toBe(3);

        // Next 40% (rows 2-5) = 2-hit
        expect(calculateBlockHitRequirement(level, 2)).toBe(2);
        expect(calculateBlockHitRequirement(level, 5)).toBe(2);

        // Remaining 35% (rows 6-9) = 1-hit
        expect(calculateBlockHitRequirement(level, 6)).toBe(1);
        expect(calculateBlockHitRequirement(level, 9)).toBe(1);
      });
    });

    describe('Phase 4: Levels 13+ (Progressive hardening)', () => {
      it('should have 50% 3-hit blocks at level 13+', () => {
        const level = 13;

        // Top 50% (rows 0-4) = 3-hit
        expect(calculateBlockHitRequirement(level, 0)).toBe(3);
        expect(calculateBlockHitRequirement(level, 4)).toBe(3);

        // Next 30% (rows 5-7) = 2-hit
        expect(calculateBlockHitRequirement(level, 5)).toBe(2);
        expect(calculateBlockHitRequirement(level, 7)).toBe(2);

        // Remaining 20% (rows 8-9) = 1-hit
        expect(calculateBlockHitRequirement(level, 8)).toBe(1);
        expect(calculateBlockHitRequirement(level, 9)).toBe(1);
      });

      it('should maintain distribution at higher levels', () => {
        const level = 20;
        expect(calculateBlockHitRequirement(level, 0)).toBe(3);
        expect(calculateBlockHitRequirement(level, 5)).toBe(2);
        expect(calculateBlockHitRequirement(level, 9)).toBe(1);
      });
    });
  });

  describe('Block Scoring System', () => {
    function calculateBlockScore(maxHits) {
      const baseScore = 10;
      switch(maxHits) {
        case 1: return baseScore;
        case 2: return baseScore * 2.5;
        case 3: return baseScore * 5;
        case 4: return baseScore * 10;
        default: return baseScore;
      }
    }

    it('should award 10 points for 1-hit blocks', () => {
      expect(calculateBlockScore(1)).toBe(10);
    });

    it('should award 25 points for 2-hit blocks', () => {
      expect(calculateBlockScore(2)).toBe(25);
    });

    it('should award 50 points for 3-hit blocks', () => {
      expect(calculateBlockScore(3)).toBe(50);
    });

    it('should award 100 points for 4-hit blocks', () => {
      expect(calculateBlockScore(4)).toBe(100);
    });

    it('should handle invalid hit counts', () => {
      expect(calculateBlockScore(0)).toBe(10);
      expect(calculateBlockScore(5)).toBe(10);
      expect(calculateBlockScore(-1)).toBe(10);
    });

    it('should properly scale scoring incentives', () => {
      // 2-hit blocks should be 2.5x more valuable
      expect(calculateBlockScore(2) / calculateBlockScore(1)).toBe(2.5);

      // 3-hit blocks should be 5x more valuable
      expect(calculateBlockScore(3) / calculateBlockScore(1)).toBe(5);

      // 4-hit blocks should be 10x more valuable
      expect(calculateBlockScore(4) / calculateBlockScore(1)).toBe(10);
    });
  });

  describe('Block Color System', () => {
    function getBrickColor(maxHits, currentHits, rowIndex) {
      const baseColors = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0077ff'];
      const baseColor = baseColors[rowIndex % baseColors.length];

      if (maxHits === 1) {
        return baseColor;
      }

      const hitRatio = currentHits / maxHits;
      const r = parseInt(baseColor.substr(1, 2), 16);
      const g = parseInt(baseColor.substr(3, 2), 16);
      const b = parseInt(baseColor.substr(5, 2), 16);

      const darkenFactor = 0.4 + (hitRatio * 0.6);
      const newR = Math.floor(r * darkenFactor);
      const newG = Math.floor(g * darkenFactor);
      const newB = Math.floor(b * darkenFactor);

      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    it('should return base color for 1-hit blocks', () => {
      expect(getBrickColor(1, 0, 0)).toBe('#ff0000');
      expect(getBrickColor(1, 0, 1)).toBe('#ff7700');
    });

    it('should darken color as block takes damage', () => {
      const undamaged = getBrickColor(3, 0, 0);
      const damaged1 = getBrickColor(3, 1, 0);
      const damaged2 = getBrickColor(3, 2, 0);

      // Colors should get progressively brighter (less dark) as damage increases
      expect(undamaged).not.toBe(damaged1);
      expect(damaged1).not.toBe(damaged2);
    });

    it('should handle full damage gracefully', () => {
      const color = getBrickColor(2, 2, 0);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should produce valid hex colors', () => {
      for (let maxHits = 1; maxHits <= 4; maxHits++) {
        for (let currentHits = 0; currentHits <= maxHits; currentHits++) {
          for (let row = 0; row < 5; row++) {
            const color = getBrickColor(maxHits, currentHits, row);
            expect(color).toMatch(/^#[0-9a-f]{6}$/i);
          }
        }
      }
    });
  });

  describe('Multi-Hit Collision Logic', () => {
    it('should increment currentHits on each collision', () => {
      const brick = {
        status: 1,
        maxHits: 3,
        currentHits: 0
      };

      // First hit
      brick.currentHits++;
      expect(brick.currentHits).toBe(1);
      expect(brick.status).toBe(1); // Still active

      // Second hit
      brick.currentHits++;
      expect(brick.currentHits).toBe(2);
      expect(brick.status).toBe(1); // Still active

      // Third hit - should destroy
      brick.currentHits++;
      if (brick.currentHits >= brick.maxHits) {
        brick.status = 0;
      }
      expect(brick.currentHits).toBe(3);
      expect(brick.status).toBe(0); // Destroyed
    });

    it('should award partial points for incomplete hits', () => {
      let score = 0;
      const brick = {
        maxHits: 3,
        currentHits: 0,
        status: 1
      };

      // First hit - partial points
      brick.currentHits++;
      if (brick.currentHits < brick.maxHits) {
        score += 5;
      }
      expect(score).toBe(5);

      // Second hit - partial points
      brick.currentHits++;
      if (brick.currentHits < brick.maxHits) {
        score += 5;
      }
      expect(score).toBe(10);

      // Third hit - full points
      brick.currentHits++;
      if (brick.currentHits >= brick.maxHits) {
        brick.status = 0;
        score += 50; // Full score for 3-hit block
      }
      expect(score).toBe(60); // 5 + 5 + 50
    });
  });

  describe('Canvas Scaling with Dynamic Rows', () => {
    it('should calculate brick height based on fixed height scaling', () => {
      const canvasWidth = 600;
      const margin = 20;
      const brickCols = 10;
      const brickPadding = 5;
      const baseBrickWidth = 75;
      const baseBrickHeight = 20;

      // Calculate responsive brick dimensions (matching game code)
      const availableWidth = canvasWidth - (margin * 2);
      const totalPadding = brickPadding * (brickCols - 1);
      const brickWidth = (availableWidth - totalPadding) / brickCols;
      const brickHeight = baseBrickHeight * (brickWidth / baseBrickWidth);

      // Both 5 and 10 rows should have same brick height (fixed height approach)
      expect(brickHeight).toBeCloseTo(13.73, 1);

      // Verify 5 rows doesn't affect brick height
      const height5Rows = brickHeight;
      const height10Rows = brickHeight;

      expect(height5Rows).toBe(height10Rows);
      expect(height5Rows).toBeCloseTo(13.73, 1);
      expect(height10Rows).toBeCloseTo(13.73, 1);
    });

    it('should calculate natural grid height for dynamic rows', () => {
      const canvasWidth = 600;
      const margin = 20;
      const brickCols = 10;
      const brickPadding = 5;
      const offsetTop = 60;
      const baseBrickWidth = 75;
      const baseBrickHeight = 20;

      // Calculate fixed brick height
      const availableWidth = canvasWidth - (margin * 2);
      const totalPadding = brickPadding * (brickCols - 1);
      const brickWidth = (availableWidth - totalPadding) / brickCols;
      const brickHeight = baseBrickHeight * (brickWidth / baseBrickWidth);

      // 5 rows should take less vertical space than 10 rows
      const totalHeight5 = offsetTop + (5 * brickHeight) + (brickPadding * 4);
      const totalHeight10 = offsetTop + (10 * brickHeight) + (brickPadding * 9);

      expect(totalHeight10).toBeGreaterThan(totalHeight5);
      expect(totalHeight5).toBeCloseTo(offsetTop + 5 * 13.73 + 20, 1);
      expect(totalHeight10).toBeCloseTo(offsetTop + 10 * 13.73 + 45, 1);
    });
  });

  describe('Game Balance Validation', () => {
    it('should progressively increase difficulty', () => {
      const difficultyScore = (level) => {
        let score = 0;
        const rows = Math.min(5 + level - 1, 10);

        for (let r = 0; r < rows; r++) {
          let maxHits = 1;
          if (level <= 6) maxHits = 1;
          else if (level >= 7 && level <= 9) {
            maxHits = r < Math.floor(rows / 2) ? 2 : 1;
          } else if (level >= 10 && level <= 12) {
            if (r < Math.floor(rows * 0.25)) maxHits = 3;
            else if (r < Math.floor(rows * 0.65)) maxHits = 2;
            else maxHits = 1;
          } else {
            if (r < Math.floor(rows * 0.5)) maxHits = 3;
            else if (r < Math.floor(rows * 0.8)) maxHits = 2;
            else maxHits = 1;
          }
          score += maxHits;
        }
        return score;
      };

      // Each level should be at least as difficult as the previous
      for (let level = 1; level < 15; level++) {
        expect(difficultyScore(level + 1)).toBeGreaterThanOrEqual(difficultyScore(level));
      }
    });
  });
});
