# @tejadev/typescript-config

Shared TypeScript configuration presets for this monorepo.

## Presets

- `@tejadev/typescript-config/base`
- `@tejadev/typescript-config/node`
- `@tejadev/typescript-config/next`
- `@tejadev/typescript-config/react-library`

## Usage

In a workspace `tsconfig.json`:

```json
{
  "extends": "@tejadev/typescript-config/node"
}
```

Then add project-specific `include`, `exclude`, and any overrides needed.
