import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { defineConfig } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    testTimeout: 10000,
    hookTimeout: 60000,
    include: ['src/**/*.test.ts', 'src/tests/integration/**/*.ts'],
    exclude: ['node_modules', '.git', 'dist'],
    root: '.',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
