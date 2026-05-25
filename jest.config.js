module.exports = {
  preset: "react-native",
  setupFiles: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    // Tell Jest to ignore node_modules EXCEPT for these specific React Native libraries
    "node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-safe-area-context|lucide-react-native|react-native-svg)/",
  ],
};
