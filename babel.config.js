module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        root: ["./src"],
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          "@": "./src",
        },
      },
    ],
    [
      "module:react-native-dotenv",
      {
        moduleName: "@env",
        path: ".env",
      },
    ],
    // 'react-native-worklets/plugin', // Temporarily commented out until installed
    "react-native-reanimated/plugin",
  ],
  env: {
    production: {
      // plugins: ['transform-remove-console'], // Temporarily commented out until installed
    },
  },
};
