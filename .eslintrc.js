module.exports = {
  extends: [
    'airbnb-base',
  ],
  plugins: [
    'import',
  ],
  env: {
    node: true,
  },
  rules: {
    "comma-dangle": ["error", "never"],
    "no-console": 0
  }
};