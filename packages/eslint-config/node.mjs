import baseConfig from './base.mjs'

const nodeConfig = [
  ...baseConfig,
  {
    files: ['**/*.{ts,js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'module'
    }
  }
]

export default nodeConfig
