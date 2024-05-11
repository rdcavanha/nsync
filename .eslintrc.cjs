module.exports = {
  extends: ['@rdcavanha/eslint-config/typescript/node'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.eslint.json',
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 'off',
    'no-continue': 'off',
    'no-empty': 'off',
  },
};
