module.exports = {
  env: { es6: true },

  // use standard configuration and disable rules handled by prettier
  extends: ["standard", "prettier"],

  rules: {
    // prefer let/const over var
    "no-var": "error",

    // prefer const over let when possible
    //
    // should be included in standard: https://github.com/standard/eslint-config-standard/pull/133/
    "prefer-const": "error",

    // detect incorrect import/require
    "node/no-extraneous-import": "error",
    "node/no-extraneous-require": "error",
    "node/no-missing-require": "error",
    "node/no-missing-import": "error",
  },
};
