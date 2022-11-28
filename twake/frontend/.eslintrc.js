module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'eslint-plugin-jsx-a11y', '@typescript-eslint'],
  ignorePatterns: ['**/deprecated/*.js', '**/deprecated/*.jsx', '**/*.jsx'],
  rules: {
    'react/display-name': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    'react/react-in-jsx-scope': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/no-children-prop': 'off',
    'react/no-unescaped-entities': 'off',
    'no-async-promise-executor': 'off',
    'no-control-regex': 'warn',
    '@typescript-eslint/no-this-alias': 'warn',
    'react/prop-types': 'warn',
    'no-useless-escape': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
  },
};
