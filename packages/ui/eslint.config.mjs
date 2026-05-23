import baseConfig from '@tejadev/eslint-config/base'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

const uiConfig = [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { react: pluginReact, 'react-hooks': pluginReactHooks },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser
      }
    },
    settings: {
      react: {
        version: '18.3'
      }
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      ...pluginReactHooks.configs['recommended-latest'].rules,
      'react/react-in-jsx-scope': 'off'
    }
  }
]

export default defineConfig(...uiConfig)
