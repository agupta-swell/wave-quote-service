module.exports = {
  extends: ['airbnb', 'eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['eslint-plugin-import', '@typescript-eslint', '@typescript-eslint/tslint'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    'import/no-unresolved': 0,
    'import/extensions': 0,
    'class-methods-use-this': 0,
    // NOTE: disabling eslint camelcase because Typescript is enforcing cases below
    'camelcase': 0,
    'max-len': [
      'error',
      {
        code: 120,
        tabWidth: 2,
      },
    ],
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
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: ['default'],
        format: ['camelCase', 'snake_case', 'PascalCase'],
        leadingUnderscore: 'allowSingleOrDouble',
      },
    ],
    '@typescript-eslint/quotes': [
      'error',
      'single',
      {
        avoidEscape: true,
      },
    ],
    'id-blacklist': [
      'error',
      'any',
      'Number',
      'number',
      'String',
      'string',
      'Boolean',
      'boolean',
      'Undefined',
      'undefined',
    ],
    'id-match': 'error',
    'import/order': 'error'
  },
};
