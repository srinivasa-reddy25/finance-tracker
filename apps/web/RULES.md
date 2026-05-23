# Web Rules

Read this before writing web code.

## Folder Layout

Use `src` with this structure:

- `app` for routes and layouts
- `assets` for fonts/logos/static assets
- `components` for reusable UI components
- `constants` for env/constants
- `hooks/api` for API hooks
- `hooks/custom` for reusable custom hooks
- `lib` for shared helpers
- `providers` for context/query/theme providers
- `services` for integrations (for example Firebase later)
- `types` for shared web types

## Styling

1. Use Tailwind utilities and token classes.
2. Do not use hardcoded hex colors.
3. Keep color/theme tokens in `src/app/globals.css`.
4. Keep Tailwind token mapping in `tailwind.config.mjs`.
5. Prefer classes like `bg-background`, `text-foreground`, `border-border`, `bg-primary`.
6. Put very common/shared UI primitives in `packages/ui` and import from `@tejadev/ui`.
7. Keep app-local components only for page/feature-specific compositions.
8. Keep shadcn config in `components.json` and keep `tailwind.cssVariables = true`.

## Data and API

1. Use TanStack Query for server state.
2. Keep API clients in `src/lib`.
3. Keep route hooks in `src/hooks/api` as one file per route (for example `health.ts`).
4. For each route hook file, keep this order:
   type
   api call
   hook
5. Do not create separate `services` files for normal route API calls.

## Naming Rules

1. Use camelCase for function names in web code.
2. Use camelCase for hook names (`useXxx`), for example `useHealth`.
3. Do not use snake_case for web functions/hooks.
4. Do not use TypeScript `enum`; use shared `as const` constants + extracted `type`.

## Process

1. Build feature in small steps.
2. Run lint/typecheck before each commit.
3. Commit per step after verification.
