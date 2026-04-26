/**
 * BB-Bounce — Player name validation
 *
 * Whitelist + leetspeak-aware profanity filter for leaderboard names.
 * Returns { valid, error } shape that the UI uses directly.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BBValidation = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VALID_CHARS = /^[a-zA-Z0-9\s\-_]+$/;
  // Word-boundary patterns with `+` to absorb common letter-doubling and
  // [0149]-style leet substitutions inline. We additionally check a
  // leet-normalized copy of the name for things like "n1ce" → "nice".
  const PROFANITY = /\b(s+hit|fuc+k|dam+n|hel+|as+|b[i1]tc+h|c[o0]c+k|d[i1]c+k|p[i1]s+|cun+t|fag+|n[i1]g+|tw[a4]t|wh[o0]r[e3]|[a4]s+h[o0]l[e3])\b/i;

  function leetNormalize(s) {
    return s.toLowerCase()
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/\$/g, 's');
  }

  function validatePlayerName(name) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return { valid: false, error: 'Please enter a name' };
    }

    const trimmed = name.trim();

    if (!VALID_CHARS.test(trimmed)) {
      return { valid: false, error: 'Only letters, numbers, spaces, - and _ allowed' };
    }

    if (PROFANITY.test(trimmed) || PROFANITY.test(leetNormalize(trimmed))) {
      return { valid: false, error: 'Please choose a different name' };
    }

    return { valid: true, error: '' };
  }

  return { validatePlayerName, leetNormalize };
});
