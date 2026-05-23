import baseConfig from '@tejadev/eslint-config/base'
import { defineConfig } from 'eslint/config'

export default defineConfig(...baseConfig, {
  ignores: ['babel.config.js', 'metro.config.js', 'tailwind.config.js']
})
