import nodeConfig from '@tejadev/eslint-config/node'
import { defineConfig } from 'eslint/config'

export default defineConfig(...nodeConfig, {
  files: ['**/*.d.ts'],
  rules: {
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/no-namespace': 'off'
  }
})
