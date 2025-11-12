/**
 * Jest Test Setup
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || 3001;
process.env.SCORE_SECRET = process.env.SCORE_SECRET || 'test-secret-key-do-not-use-in-production';

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };

// Set longer timeout for integration tests
jest.setTimeout(10000);
