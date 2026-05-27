module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    // Mock native modules that don't work in Jest
    '@react-native-firebase/(.*)':
      '<rootDir>/__mocks__/@react-native-firebase/$1',
    '@react-native-google-signin/google-signin':
      '<rootDir>/__mocks__/@react-native-google-signin/google-signin.js',
    '@react-native-async-storage/async-storage':
      '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
    'react-native-vector-icons/(.*)':
      '<rootDir>/__mocks__/react-native-vector-icons.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|zustand)/)',
  ],
};
