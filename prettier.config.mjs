/**
 * Prettier configuration
 * @type {import('prettier').Config}
 */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
  arrowParens: 'always',
  tabWidth: 2,
  endOfLine: 'lf',
  bracketSpacing: true,
  plugins: [
    'prettier-plugin-tailwindcss',
    '@ianvs/prettier-plugin-sort-imports'
  ],

  overrides: [
    {
      files: '*.{js,jsx,ts,tsx}',
      options: {
        importOrder: [
          '<BUILTIN_MODULES>',
          '^react$',
          '^next(.*)$',
          '^express(.*)$',
          '',
          '<THIRD_PARTY_MODULES>',
          '',
          '^@tejadev/(.*)$',
          '^@/(.*)$',
          '',
          '^../(.*)$',
          '^./(.*)$'
        ]
      }
    }
  ]
}

export default config
