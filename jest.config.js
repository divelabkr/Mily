/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@firebase|firebase|zustand|i18next|react-i18next|@anthropic-ai|@amplitude|react-native-purchases)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@engines/(.*)$': '<rootDir>/src/engines/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    // React Native native module mocks
    'react-native-purchases': '<rootDir>/tests/__mocks__/react-native-purchases.js',
    'expo-notifications': '<rootDir>/tests/__mocks__/expo-notifications.js',
    '@amplitude/analytics-react-native': '<rootDir>/tests/__mocks__/amplitude.js',
  },
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

module.exports = config;
