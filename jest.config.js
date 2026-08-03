if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

module.exports = {
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testRunner: 'jest-jasmine2',
  prettierPath: '',
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^src/(.*)': '<rootDir>/src/$1',
    '^app/(.*)': '<rootDir>/src/app/$1',
    '^assets/(.*)': '<rootDir>/src/assets/$1',
    '^environments/(.*)': '<rootDir>/src/environments/$1',
    '^lodash-es$': 'lodash',
  },
  transformIgnorePatterns: [
    'node_modules/(?!@ngrx|@cpp/core|ngx-bootstrap|ng2-pdf-viewer|pdfjs-dist|.*\\.mjs)',
  ],
};
