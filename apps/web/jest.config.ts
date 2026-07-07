import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.ts and .env files
  dir: './',
});

// Custom config passed to Jest
const config = {
  coverageProvider: 'v8' as const,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Ensure we collect coverage
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: './coverage',
};

export default createJestConfig(config);
