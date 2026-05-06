// backend/jest.config.js
module.exports = {
  testEnvironment:     'node',
  setupFiles:          ['./jest.setup.js'],
  testMatch:           ['**/__tests__/**/*.test.js'],
  clearMocks:          true,
  testTimeout:         15000,
  coverageDirectory:   'coverage',
  coverageReporters:   ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/middleware/**/*.js',
    'src/routes/**/*.js',
    '!src/config/seed.js',
  ],
};
