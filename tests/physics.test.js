/**
 * Physics module tests — pure-function behavior of public/js/physics.js.
 * Happy paths plus the edge cases that motivated the rewrite (axis-aware
 * brick collision, push-out, no double-bounce on corner contact).
 */

const {
  computeBallSpeed,
  paddleBounceVelocity,
  resolveBrickHit
} = require('../public/js/physics');

describe('computeBallSpeed', () => {
  it('returns canvasHeight * initialRatio at level 1', () => {
    expect(computeBallSpeed(800, 1, 0.3, 0.0375)).toBeCloseTo(240);
    expect(computeBallSpeed(600, 1, 0.3, 0.0375)).toBeCloseTo(180);
  });

  it('adds perLevelRatio for each level past 1', () => {
    // Level 5 = base + 4 increments
    expect(computeBallSpeed(800, 5, 0.3, 0.05)).toBeCloseTo(800 * (0.3 + 4 * 0.05));
  });

  it('scales linearly with canvas height for the same level', () => {
    const small = computeBallSpeed(400, 3, 0.3, 0.05);
    const big = computeBallSpeed(800, 3, 0.3, 0.05);
    expect(big / small).toBeCloseTo(2);
  });
});

describe('paddleBounceVelocity', () => {
  const speed = 300;
  const paddleX = 100;
  const paddleW = 100;

  it('launches straight up when hit dead center', () => {
    const v = paddleBounceVelocity(paddleX + paddleW / 2, paddleX, paddleW, speed);
    expect(v.vx).toBeCloseTo(0);
    expect(v.vy).toBeCloseTo(-speed);
  });

  it('launches up-left at the left edge of the paddle', () => {
    const v = paddleBounceVelocity(paddleX, paddleX, paddleW, speed);
    // hitPos=0 → angle=-45° → vx = sin(-45°)*speed
    expect(v.vx).toBeCloseTo(speed * Math.sin(-Math.PI / 4));
    expect(v.vy).toBeLessThan(0);
  });

  it('launches up-right at the right edge of the paddle', () => {
    const v = paddleBounceVelocity(paddleX + paddleW, paddleX, paddleW, speed);
    expect(v.vx).toBeCloseTo(speed * Math.sin(Math.PI / 4));
    expect(v.vy).toBeLessThan(0);
  });

  it('always returns vy < 0 (ball goes up after bouncing)', () => {
    for (let hit = 0; hit <= 1; hit += 0.1) {
      const v = paddleBounceVelocity(paddleX + paddleW * hit, paddleX, paddleW, speed);
      expect(v.vy).toBeLessThan(0);
    }
  });

  it('preserves overall speed magnitude', () => {
    for (let hit = 0; hit <= 1; hit += 0.25) {
      const v = paddleBounceVelocity(paddleX + paddleW * hit, paddleX, paddleW, speed);
      const mag = Math.sqrt(v.vx ** 2 + v.vy ** 2);
      expect(mag).toBeCloseTo(speed);
    }
  });

  it('clamps off-paddle ballX into the paddle range', () => {
    // ballX way to the left → clamped to left edge → -45°
    const v = paddleBounceVelocity(paddleX - 999, paddleX, paddleW, speed);
    expect(v.vx).toBeCloseTo(speed * Math.sin(-Math.PI / 4));
  });
});

describe('resolveBrickHit', () => {
  const brick = { x: 100, y: 100, width: 50, height: 20 };
  const radius = 10;

  it('returns null when ball is far from the brick', () => {
    expect(resolveBrickHit(0, 0, 100, 100, brick, radius)).toBeNull();
    expect(resolveBrickHit(300, 300, -100, -100, brick, radius)).toBeNull();
  });

  it('reflects vy for a head-on top hit', () => {
    // Ball directly above brick, moving down
    const hit = resolveBrickHit(125, 95, 0, 100, brick, radius);
    expect(hit).not.toBeNull();
    expect(hit.vx).toBeCloseTo(0);
    expect(hit.vy).toBeCloseTo(-100);
  });

  it('reflects vx (NOT vy) for a side hit — the bug from the original code', () => {
    // Ball at the left side of the brick, moving right
    const hit = resolveBrickHit(95, 110, 100, 0, brick, radius);
    expect(hit).not.toBeNull();
    expect(hit.vx).toBeCloseTo(-100);
    expect(hit.vy).toBeCloseTo(0);
  });

  it('pushes the ball out so it no longer overlaps after resolution', () => {
    // Ball center 8 above top edge → 2 units of overlap (radius=10)
    const hit = resolveBrickHit(125, 92, 0, 100, brick, radius);
    expect(hit).not.toBeNull();
    // After resolution, ball center should sit exactly `radius` above brick top
    expect(hit.ballY).toBeCloseTo(brick.y - radius);
  });

  it('does NOT double-bounce when the ball is already moving away (v·n > 0)', () => {
    // Ball just above brick top, moving UP (already escaping)
    const vyBefore = -50;
    const hit = resolveBrickHit(125, 95, 0, vyBefore, brick, radius);
    expect(hit).not.toBeNull();
    // Velocity should be untouched because v·n was positive (not into brick)
    expect(hit.vy).toBeCloseTo(vyBefore);
  });

  it('produces a unit normal pointing from brick toward ball', () => {
    const hit = resolveBrickHit(125, 95, 0, 100, brick, radius);
    expect(hit.nx).toBeCloseTo(0);
    expect(hit.ny).toBeCloseTo(-1);
  });

  it('handles corner contact cleanly without NaN', () => {
    // Ball at the top-left corner of the brick, diagonal velocity
    const hit = resolveBrickHit(95, 95, 100, 100, brick, radius);
    expect(hit).not.toBeNull();
    expect(Number.isFinite(hit.vx)).toBe(true);
    expect(Number.isFinite(hit.vy)).toBe(true);
    // Both components reflected in the diagonal corner case
    expect(hit.vx).toBeLessThan(0);
    expect(hit.vy).toBeLessThan(0);
  });

  it('handles the degenerate case where the ball center is inside the brick', () => {
    // Ball center literally at brick center, moving right
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    const hit = resolveBrickHit(cx, cy, 100, 0, brick, radius);
    expect(hit).not.toBeNull();
    // Dominant axis is X → reflects vx
    expect(hit.vx).toBeCloseTo(-100);
  });
});
