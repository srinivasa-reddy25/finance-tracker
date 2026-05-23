# @tejadev/eslint-config

Shared ESLint flat config presets for this monorepo.

## Presets

- `@tejadev/eslint-config/base`
- `@tejadev/eslint-config/node`
- `@tejadev/eslint-config/next`

## Usage

In a workspace `eslint.config.mjs`:

```js
import nodeConfig from '@tejadev/eslint-config/node'
import { defineConfig } from 'eslint/config'

export default defineConfig(...nodeConfig)
```
