module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "quotes": ["error", "double"],
    "max-len": ["error", {"code": 120}],
    // Añade aquí otras reglas personalizadas
  },
};
