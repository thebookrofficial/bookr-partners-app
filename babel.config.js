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
    "@babel/plugin-transform-export-namespace-from",
    "react-native-reanimated/plugin", // This must always be the last plugin
  ],
  env: {
    production: {
      // plugins: ['transform-remove-console'], // Temporarily commented out until installed
    },
  },
};
