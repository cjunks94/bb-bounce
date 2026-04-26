/**
 * BB-Bounce — Brick rules (pure functions)
 *
 * Owns the row/hit/color/score progression. No DOM, no canvas — safe to
 * unit-test in Node and to load in the browser via a plain <script> tag.
 *
 * UMD-lite: exposes window.BBBricks in browsers and module.exports in Node,
 * so we don't need a bundler or ESM/CJS interop config.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BBBricks = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BASE_ROWS = 5;
  const MAX_ROWS = 10;
  const BASE_COLORS = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0077ff'];

  /**
   * Rows of bricks for a given level. Levels 1..6 add a row each; capped at 10.
   */
  function calculateBrickRows(currentLevel) {
    return Math.min(BASE_ROWS + currentLevel - 1, MAX_ROWS);
  }

  /**
   * Hits required to destroy a brick at (level, rowIndex). Difficulty ramps
   * in four phases — see the `if` chains for the exact thresholds.
   */
  function calculateBlockHitRequirement(currentLevel, rowIndex) {
    if (currentLevel <= 6) return 1;

    const totalRows = calculateBrickRows(currentLevel);

    if (currentLevel <= 9) {
      // Top half becomes 2-hit
      return rowIndex < Math.floor(totalRows / 2) ? 2 : 1;
    }

    if (currentLevel <= 12) {
      // Top 25% → 3-hit, next 40% → 2-hit, rest → 1-hit
      const threeHitThreshold = Math.floor(totalRows * 0.25);
      const twoHitThreshold = Math.floor(totalRows * 0.65);
      if (rowIndex < threeHitThreshold) return 3;
      if (rowIndex < twoHitThreshold) return 2;
      return 1;
    }

    // Level 13+: top 50% → 3-hit, next 30% → 2-hit
    const threeHitThreshold = Math.floor(totalRows * 0.5);
    const twoHitThreshold = Math.floor(totalRows * 0.8);
    if (rowIndex < threeHitThreshold) return 3;
    if (rowIndex < twoHitThreshold) return 2;
    return 1;
  }

  /**
   * Brick fill color. 1-hit bricks use a flat row color; multi-hit bricks
   * darken proportionally to (maxHits - currentHits) so the player can
   * read how much damage is left.
   */
  function getBrickColor(maxHits, currentHits, rowIndex) {
    const baseColor = BASE_COLORS[rowIndex % BASE_COLORS.length];
    if (maxHits === 1) return baseColor;

    const hitRatio = currentHits / maxHits;
    const r = parseInt(baseColor.substr(1, 2), 16);
    const g = parseInt(baseColor.substr(3, 2), 16);
    const b = parseInt(baseColor.substr(5, 2), 16);

    // 40% brightness when fresh → 100% when about to break, so destroying
    // looks like a flash rather than a fade-to-black.
    const darkenFactor = 0.4 + hitRatio * 0.6;
    const newR = Math.floor(r * darkenFactor);
    const newG = Math.floor(g * darkenFactor);
    const newB = Math.floor(b * darkenFactor);

    return '#' +
      newR.toString(16).padStart(2, '0') +
      newG.toString(16).padStart(2, '0') +
      newB.toString(16).padStart(2, '0');
  }

  /**
   * Points awarded when a brick is destroyed. Tougher bricks pay more so
   * progression feels rewarding even as bricks-per-clear decreases.
   */
  function calculateBlockScore(maxHits) {
    const baseScore = 10;
    switch (maxHits) {
      case 1: return baseScore;
      case 2: return baseScore * 2.5;
      case 3: return baseScore * 5;
      case 4: return baseScore * 10;
      default: return baseScore;
    }
  }

  return {
    calculateBrickRows,
    calculateBlockHitRequirement,
    getBrickColor,
    calculateBlockScore,
    BASE_COLORS,
    BASE_ROWS,
    MAX_ROWS
  };
});
