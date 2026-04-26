/**
 * Player name validation tests — exercises public/js/validation.js.
 */

const { validatePlayerName, leetNormalize } = require('../public/js/validation');

describe('validatePlayerName', () => {
  describe('happy path', () => {
    it('accepts a normal alphanumeric name', () => {
      expect(validatePlayerName('cjunker')).toEqual({ valid: true, error: '' });
    });

    it('accepts names with spaces, hyphens, and underscores', () => {
      expect(validatePlayerName('Player One').valid).toBe(true);
      expect(validatePlayerName('player-one').valid).toBe(true);
      expect(validatePlayerName('player_1').valid).toBe(true);
    });

    it('trims surrounding whitespace before validating', () => {
      expect(validatePlayerName('   cjunker   ').valid).toBe(true);
    });

    it('accepts mixed case', () => {
      expect(validatePlayerName('ChrisJ_2026').valid).toBe(true);
    });
  });

  describe('rejection cases', () => {
    it('rejects empty / whitespace-only names', () => {
      expect(validatePlayerName('').valid).toBe(false);
      expect(validatePlayerName('   ').valid).toBe(false);
    });

    it('rejects non-string input', () => {
      expect(validatePlayerName(null).valid).toBe(false);
      expect(validatePlayerName(undefined).valid).toBe(false);
      expect(validatePlayerName(42).valid).toBe(false);
    });

    it('rejects disallowed punctuation', () => {
      expect(validatePlayerName('player!').valid).toBe(false);
      expect(validatePlayerName('a@b.com').valid).toBe(false);
      expect(validatePlayerName('rm -rf /').valid).toBe(false);
    });

    it('rejects raw profanity', () => {
      expect(validatePlayerName('shit').valid).toBe(false);
    });

    it('rejects leetspeak profanity via normalization', () => {
      // sh1t → normalized to "shit"
      expect(validatePlayerName('sh1t').valid).toBe(false);
      // b1tch → "bitch"
      expect(validatePlayerName('b1tch').valid).toBe(false);
    });
  });

  describe('error messages', () => {
    it('returns a non-empty error string for invalid names', () => {
      const r = validatePlayerName('');
      expect(typeof r.error).toBe('string');
      expect(r.error.length).toBeGreaterThan(0);
    });
  });
});

describe('leetNormalize', () => {
  it('lowercases the input', () => {
    expect(leetNormalize('ABC')).toBe('abc');
  });

  it('substitutes the standard leet glyphs', () => {
    expect(leetNormalize('h3ll0')).toBe('hello');
    expect(leetNormalize('5h17')).toBe('shit');
    expect(leetNormalize('$ick')).toBe('sick');
  });
});
