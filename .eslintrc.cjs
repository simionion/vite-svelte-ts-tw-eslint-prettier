module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser', // add the TypeScript parser
  parserOptions: {
    // add these parser options
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    extraFileExtensions: ['.svelte'],
    ecmaVersion: 2020,
  },
  root: true,
  extends: [
    // then, enable whichever type-aware rules you want to use
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  plugins: [
    'svelte3',
    '@typescript-eslint', // add the TypeScript plugin
    'better-mutation',
  ],
  overrides: [
    // this stays the same
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  rules: {
    '@typescript-eslint/require-await': 0,
    // "@typescript-eslint/restrict-template-expressions": 0,
    'better-mutation/no-mutating-functions': 'error',
    'better-mutation/no-mutating-methods': 'error',
    // 'better-mutation/no-mutation': 'warn', //re-enable for unintended mutations
    'no-confusing-arrow': ['warn', { 'allowParens': true, 'onlyOneSimpleParam': false }],
    'no-mixed-operators': [
      'error',
      {
        'groups': [
          ['+', '-', '*', '/', '%', '**'],
          ['&', '|', '^', '~', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
          ['&&', '||'],
          ['in', 'instanceof'],
        ],
        'allowSamePrecedence': true,
      },
    ],
  },
  ignorePatterns: ['node_modules/', 'vite.config.js', 'test/vitest.setup.js', 'coverage/', 'dist/','tailwind.*','*html-proxy&index=0.js'],
  settings: {
    'svelte3/typescript': true, // load TypeScript as peer dependency
  },
};
