/**
 * BB-Bounce — Physics helpers (pure functions)
 *
 * Pure functions returning new positions / velocities. No DOM, no canvas,
 * no globals — safe for unit tests and the hot game loop alike.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BBPhysics = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Absolute ball speed (px/sec) at a given level. Scales with canvas height
   * so portrait (mobile) and landscape (desktop) playfields feel the same.
   *
   * @param {number} canvasHeight  current playfield height in pixels
   * @param {number} level         1-indexed level number
   * @param {number} initialRatio  fraction of canvas height per second at L1
   * @param {number} perLevelRatio additional fraction per level past L1
   * @returns {number} ball speed in px/sec
   */
  function computeBallSpeed(canvasHeight, level, initialRatio, perLevelRatio) {
    return canvasHeight * (initialRatio + (level - 1) * perLevelRatio);
  }

  /**
   * Velocity after a paddle hit. The horizontal hit position on the paddle
   * (0 = left edge, 1 = right edge) maps to a ±45° launch angle, so the
   * player can aim by where they intercept the ball.
   *
   * Returned vy is always negative (upward).
   */
  function paddleBounceVelocity(ballX, paddleX, paddleWidth, speed) {
    const clampedX = Math.max(paddleX, Math.min(paddleX + paddleWidth, ballX));
    const hitPos = (clampedX - paddleX) / paddleWidth;     // 0..1
    const angle = (hitPos - 0.5) * Math.PI / 2;            // -45°..+45°
    return {
      vx: speed * Math.sin(angle),
      vy: -Math.abs(speed * Math.cos(angle))
    };
  }

  /**
   * Test whether a ball overlaps an axis-aligned brick and, if so, compute
   * the corrected position and reflected velocity.
   *
   * Returns null when there is no overlap. On overlap returns
   *   { ballX, ballY, vx, vy, nx, ny }
   * where (nx, ny) is the unit contact normal pointing from the brick toward
   * the ball, and (ballX, ballY) is the ball's center pushed back out of
   * the brick along that normal.
   *
   * The reflection uses v' = v - 2 (v·n) n, but only when v·n < 0 — i.e.
   * only when the ball was actually moving INTO the brick. This avoids
   * double-bouncing off corners.
   */
  function resolveBrickHit(ballX, ballY, vx, vy, brick, radius) {
    // Closest point on the brick AABB to the ball center
    const cx = Math.max(brick.x, Math.min(ballX, brick.x + brick.width));
    const cy = Math.max(brick.y, Math.min(ballY, brick.y + brick.height));
    const dx = ballX - cx;
    const dy = ballY - cy;
    const dist2 = dx * dx + dy * dy;

    if (dist2 > radius * radius) return null;

    let nx, ny;
    let newX = ballX;
    let newY = ballY;

    if (dist2 < 1e-6) {
      // Ball center is inside the brick. Pick the axis opposite the
      // dominant velocity component so we always bounce sensibly.
      if (Math.abs(vx) > Math.abs(vy)) {
        nx = vx > 0 ? -1 : 1;
        ny = 0;
      } else {
        nx = 0;
        ny = vy > 0 ? -1 : 1;
      }
    } else {
      const dist = Math.sqrt(dist2);
      nx = dx / dist;
      ny = dy / dist;
      // Push ball center to exactly `radius` away from the brick surface
      const overlap = radius - dist;
      newX += nx * overlap;
      newY += ny * overlap;
    }

    let newVx = vx;
    let newVy = vy;
    const vn = vx * nx + vy * ny;
    if (vn < 0) {
      newVx = vx - 2 * vn * nx;
      newVy = vy - 2 * vn * ny;
    }

    return { ballX: newX, ballY: newY, vx: newVx, vy: newVy, nx, ny };
  }

  return {
    computeBallSpeed,
    paddleBounceVelocity,
    resolveBrickHit
  };
});
