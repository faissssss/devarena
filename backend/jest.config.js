export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/**/*.spec.js'],
  coverageThreshold: {
    global: {
      branches: 18,
      functions: 30,
      lines: 35,
      statements: 35,
    },
    './src/utils/config.js': {
      branches: 90,
      functions: 100,
      lines: 90,
      statements: 90,
    },
    './src/utils/db.js': {
      branches: 80,
      functions: 80,
      lines: 90,
      statements: 90,
    },
    './src/services/authService.js': {
      branches: 50,
      functions: 100,
      lines: 90,
      statements: 90,
    },
    './src/services/dataSyncService.js': {
      branches: 45,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './src/services/filterEngine.js': {
      branches: 65,
      functions: 100,
      lines: 85,
      statements: 85,
    },
    './src/parsers/apiResponseParser.js': {
      branches: 70,
      functions: 90,
      lines: 80,
      statements: 80,
    },
  },
};
