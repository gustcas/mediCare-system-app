import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { paths: {} } }] },
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'html'],
  testTimeout: 30000,
};

export default config;
