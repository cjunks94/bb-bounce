/**
 * BB-Bounce — HUD render helpers (pure functions)
 *
 * Render strings for the score / lives / level / speed cards. Returns
 * HTML so the caller can drop them into innerHTML in one go. No DOM
 * access here — keeps the unit tests trivial.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BBHud = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_LIVES = 3;
  const LEVEL_DOTS = 10;
  const SPEED_BARS = 4;

  /**
   * Render the lives row as filled / empty heart spans. The heart glyph is
   * the same in both states; the empty class dims it via CSS rather than
   * swapping characters, which keeps the row width stable.
   *
   * @param {number} lives  current lives, clamped to [0, MAX_LIVES]
   * @returns {string} HTML
   */
  function renderLives(lives) {
    const clamped = Math.max(0, Math.min(MAX_LIVES, Math.floor(lives)));
    let html = '';
    for (let i = 0; i < MAX_LIVES; i++) {
      const cls = i < clamped ? 'hud-heart' : 'hud-heart hud-heart-empty';
      html += `<span class="${cls}">&#9829;</span>`;
    }
    return html;
  }

  /**
   * Render a 10-dot level progress strip. Levels above 10 cap visually so
   * the row never overflows the card.
   *
   * @param {number} level  1-indexed
   * @returns {string} HTML
   */
  function renderLevelDots(level) {
    const filled = Math.max(0, Math.min(LEVEL_DOTS, Math.floor(level)));
    let html = '';
    for (let i = 0; i < LEVEL_DOTS; i++) {
      const cls = i < filled ? 'hud-dot is-filled' : 'hud-dot';
      html += `<span class="${cls}"></span>`;
    }
    return html;
  }

  /**
   * Render the ascending bar gauge for the speed multiplier. With four
   * bars and a max in-game multiplier of 3x, the rightmost bar always
   * stays empty — that's intentional headroom in case higher speeds land
   * later.
   *
   * @param {number} multiplier  1, 2, or 3 (other values clamped)
   * @returns {string} HTML
   */
  function renderSpeedBars(multiplier) {
    const filled = Math.max(0, Math.min(SPEED_BARS, Math.floor(multiplier)));
    let html = '';
    for (let i = 0; i < SPEED_BARS; i++) {
      const cls = i < filled ? 'hud-bar is-filled' : 'hud-bar';
      html += `<span class="${cls}"></span>`;
    }
    return html;
  }

  /**
   * Format an integer level as a zero-padded 2-digit string ("01", "02",
   * ..., "99", "100"). Levels >= 100 keep their natural width.
   */
  function formatLevel(level) {
    return String(Math.max(0, Math.floor(level))).padStart(2, '0');
  }

  /**
   * Format a score with thousands separators ("1,240"). Uses en-US so the
   * separator stays a comma regardless of the player's locale — the game's
   * UI is English-only.
   */
  function formatScore(score) {
    return Math.floor(score).toLocaleString('en-US');
  }

  return {
    renderLives,
    renderLevelDots,
    renderSpeedBars,
    formatLevel,
    formatScore,
    MAX_LIVES,
    LEVEL_DOTS,
    SPEED_BARS
  };
});
