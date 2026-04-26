/**
 * ESLint flat config (ESLint v9+).
 *
 * Three contexts:
 *   - Server-side Node code (server.js, routes/, middleware/, db/, scripts/)
 *   - Browser UMD modules (public/js/) — sourceType=script, window/self globals
 *   - Jest test files (tests/) — Jest globals on top of Node
 *
 * Inline JS in public/index.html is not linted (would need an HTML plugin
 * and the file is being progressively extracted into public/js/ anyway).
 */
'use strict';

const nodeGlobals = {
  process: 'readonly',
  require: 'readonly',
  module: 'readonly',
  exports: 'writable',
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  global: 'readonly',
  globalThis: 'readonly'
};

const browserGlobals = {
  window: 'readonly',
  self: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  Math: 'readonly',
  Number: 'readonly',
  parseInt: 'readonly',
  parseFloat: 'readonly'
};

const jestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  jest: 'readonly',
  // Some tests inject a localStorage mock onto globalThis to exercise
  // browser-shaped code paths in Node.
  localStorage: 'readonly'
};

const sharedRules = {
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-undef': 'error',
  'no-var': 'warn',
  'prefer-const': 'warn',
  eqeqeq: ['warn', 'smart'],
  'no-empty': ['warn', { allowEmptyCatch: true }],
  'no-constant-condition': ['warn', { checkLoops: false }]
};

module.exports = [
  {
    ignores: [
      'node_modules/',
      'coverage/',
      'public/index.html',
      'public/manifest.json',
      'public/service-worker.js',
      '_game_check.js',
      '.husky/'
    ]
  },
  // Default: Node CommonJS for everything not otherwise overridden
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: nodeGlobals
    },
    rules: sharedRules
  },
  // Browser UMD modules — runs as a plain <script>, sees window + module
  {
    files: ['public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...browserGlobals, module: 'readonly' }
    },
    rules: sharedRules
  },
  // Jest test files
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...nodeGlobals, ...jestGlobals }
    },
    rules: sharedRules
  }
];
