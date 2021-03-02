module.exports = {
  extends: ['airbnb'],
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
  rules: {
    // NOTE: I'm too lazy to set up aliases
    'import/no-unresolved': 0,
    'import/extensions': 0,
    // NOTE: disabling eslint camelcase because Typescript is enforcing cases below
    'camelcase': 0,
    'no-empty-constructor': 0,
    'no-useless-constructor': 0,
    'import/prefer-default-export': 0,
    'max-classes-per-file': 0,
    'no-underscore-dangle': 0,
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: ['default'],
        format: ['camelCase', 'snake_case', 'PascalCase'],
        trailingUnderscore: 'allowSingleOrDouble'
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
    'import/order': 'error',
    '@typescript-eslint/tslint/config': [
      'error',
      {
        rules: {
          'import/no-unresolved': true,
          'max-len': [
            true,
            {
              limit: 120,
            },
          ],
        },
      },
    ],
  },
};
