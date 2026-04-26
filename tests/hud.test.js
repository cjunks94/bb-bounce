/**
 * HUD render helper tests — exercises public/js/hud.js.
 */

const {
  renderLives,
  renderLevelDots,
  renderSpeedBars,
  formatLevel,
  formatScore,
  MAX_LIVES,
  LEVEL_DOTS,
  SPEED_BARS
} = require('../public/js/hud');

describe('renderLives', () => {
  it('renders MAX_LIVES filled hearts at full health', () => {
    const html = renderLives(MAX_LIVES);
    const filled = (html.match(/class="hud-heart"/g) || []).length;
    const empty = (html.match(/hud-heart-empty/g) || []).length;
    expect(filled).toBe(MAX_LIVES);
    expect(empty).toBe(0);
  });

  it('renders one filled and two empty when one life remains', () => {
    const html = renderLives(1);
    const filled = (html.match(/class="hud-heart"/g) || []).length;
    const empty = (html.match(/hud-heart-empty/g) || []).length;
    expect(filled).toBe(1);
    expect(empty).toBe(2);
  });

  it('renders all empty hearts at zero lives', () => {
    const html = renderLives(0);
    expect((html.match(/hud-heart-empty/g) || []).length).toBe(MAX_LIVES);
  });

  it('clamps negative input to zero', () => {
    expect(renderLives(-5)).toBe(renderLives(0));
  });

  it('clamps input above MAX_LIVES', () => {
    expect(renderLives(MAX_LIVES + 99)).toBe(renderLives(MAX_LIVES));
  });

  it('uses the same heart glyph in both states (so widths stay equal)', () => {
    const html = renderLives(2);
    const matches = html.match(/&#9829;/g) || [];
    expect(matches.length).toBe(MAX_LIVES);
  });
});

describe('renderLevelDots', () => {
  it('renders LEVEL_DOTS dots regardless of level', () => {
    [1, 5, 10, 99].forEach(level => {
      const html = renderLevelDots(level);
      const total = (html.match(/class="hud-dot[^"]*"/g) || []).length;
      expect(total).toBe(LEVEL_DOTS);
    });
  });

  it('fills exactly N dots at level N (within range)', () => {
    for (let level = 0; level <= LEVEL_DOTS; level++) {
      const html = renderLevelDots(level);
      const filled = (html.match(/is-filled/g) || []).length;
      expect(filled).toBe(level);
    }
  });

  it('caps at LEVEL_DOTS for high levels', () => {
    expect(renderLevelDots(11)).toBe(renderLevelDots(10));
    expect(renderLevelDots(100)).toBe(renderLevelDots(10));
  });
});

describe('renderSpeedBars', () => {
  it('renders SPEED_BARS bars regardless of multiplier', () => {
    [1, 2, 3, 99].forEach(m => {
      const html = renderSpeedBars(m);
      const total = (html.match(/class="hud-bar[^"]*"/g) || []).length;
      expect(total).toBe(SPEED_BARS);
    });
  });

  it('fills 1 bar at 1X, 2 at 2X, 3 at 3X', () => {
    expect((renderSpeedBars(1).match(/is-filled/g) || []).length).toBe(1);
    expect((renderSpeedBars(2).match(/is-filled/g) || []).length).toBe(2);
    expect((renderSpeedBars(3).match(/is-filled/g) || []).length).toBe(3);
  });

  it('leaves at least one bar unfilled at the in-game max (3X)', () => {
    const html = renderSpeedBars(3);
    const empty = SPEED_BARS - (html.match(/is-filled/g) || []).length;
    expect(empty).toBeGreaterThanOrEqual(1);
  });
});

describe('formatLevel', () => {
  it('zero-pads single digit levels', () => {
    expect(formatLevel(1)).toBe('01');
    expect(formatLevel(9)).toBe('09');
  });

  it('keeps natural width for two and three digit levels', () => {
    expect(formatLevel(10)).toBe('10');
    expect(formatLevel(42)).toBe('42');
    expect(formatLevel(100)).toBe('100');
  });
});

describe('formatScore', () => {
  it('inserts thousands separators', () => {
    expect(formatScore(1240)).toBe('1,240');
    expect(formatScore(1000000)).toBe('1,000,000');
  });

  it('returns the raw integer when below 1000', () => {
    expect(formatScore(0)).toBe('0');
    expect(formatScore(999)).toBe('999');
  });

  it('floors fractional inputs', () => {
    expect(formatScore(1234.99)).toBe('1,234');
  });
});
