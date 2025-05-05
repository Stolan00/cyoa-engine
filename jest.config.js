// jest.config.js
module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  testMatch: ['**/test/unit/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};