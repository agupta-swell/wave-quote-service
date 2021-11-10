module.exports = {
  extends: ['airbnb', 'eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
      },
    },
  ],
  plugins: ['eslint-plugin-import', '@typescript-eslint', '@typescript-eslint/tslint'],
  rules: {
    'import/no-unresolved': 0,
    'import/extensions': 0,
    'class-methods-use-this': 0,
    camelcase: 0,
    'no-empty-constructor': 0,
    'no-useless-constructor': 0,
    'import/prefer-default-export': 0,
    'max-classes-per-file': 0,
    'no-underscore-dangle': 0,
    'no-shadow': 0,
    'new-cap': 0,
    '@typescript-eslint/no-explicit-any': 0,
    'array-callback-return': 0,
    'prefer-destructuring': 0,
    'no-param-reassign': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    'no-console': [2, { allow: ['warn', 'error'] }],
  },
};
