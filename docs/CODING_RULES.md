# TejaDev Coding Rules

Read this before writing or changing code in this monorepo.

## Global Standards

1. Use Bun workspace flow (`bun install`, `bun run ...`).
2. Follow shared configs from `packages/typescript-config` and `packages/eslint-config`.
3. Keep env access centralized in each app via `src/constants/env.ts`.
4. Prefer `type` over `interface` in regular source files.
5. Use absolute alias imports where configured (`@/...`) for app source.
6. Do not use TypeScript `enum`. Use `as const` arrays/objects and extract types.
7. Preferred shared constant/type pattern:
   - `export const X = ['a', 'b'] as const`
   - `export type TX = (typeof X)[number]`

## Styling Rules (Web)

1. Do not use hardcoded hex colors (`#xxxxxx`) in app styling.
2. Do not use raw rgba values for theme colors.
3. Use design tokens and utility classes:
   - `bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.
4. Put global tokens in `apps/web/src/app/globals.css`.
5. Keep Tailwind theme mappings in `apps/web/tailwind.config.mjs`.
6. Put very common/shared UI primitives in `packages/ui` and import via `@tejadev/ui` from apps.
7. Keep app-local components for feature-specific composition only.

## Naming Rules (Web)

1. Use camelCase for web function names.
2. Use camelCase for web hooks with `useXxx` naming.
3. Avoid snake_case for functions/hooks in web code.

## API Rules

1. Keep app bootstrap in `src/index.ts` and app wiring in `src/app.ts`.
2. Keep routes in `src/routes`, controllers in `src/controllers`.
3. Keep errors centralized through middleware (`error-handler`).
4. Use request id middleware and propagate `request_id` in logs/errors.
5. Access DB through workspace package `db` (do not duplicate db clients).

## Process

1. Implement in small steps.
2. After each step: lint + typecheck + manual run.
3. Commit after each confirmed step.
