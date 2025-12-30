/**
 * Jest Configuration for AiCourse Server
 * 
 * This configuration supports ES modules and integration testing
 */

export default {
  // Use node environment for server-side testing
  testEnvironment: 'node',

  // Support ES modules
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.test.js'],

  // Timeout for async tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Transform ignore patterns (allow ES modules in node_modules)
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|express)/)',
  ],
};
