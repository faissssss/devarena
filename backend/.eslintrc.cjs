module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['eslint:recommended', 'prettier'],
  ignorePatterns: ['node_modules', 'dist'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js', 'test-*.js', 'verify-*.js'],
      env: {
        jest: true,
        node: true,
      },
    },
  ],
};
