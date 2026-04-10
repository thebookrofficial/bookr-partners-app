module.exports = {
  root: true,
  extends: ["@react-native", "plugin:prettier/recommended"],
  rules: {
    // Treat Prettier formatting rules as hard ESLint errors
    "prettier/prettier": "error",

    // Strict Semicolons
    semi: ["error", "always"],

    // Throw error on unused variables and imports (ignore variables starting with an underscore)
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],

    // Prevent console.logs in commits, but allow warnings and errors
    "no-console": ["error", { allow: ["warn", "error"] }],

    // Modern React 17+ doesn't need React in scope
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
  },
};
