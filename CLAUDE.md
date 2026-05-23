# CLAUDE.md

## Why This Exists

Every time a new project starts, the first few days get eaten by the same setup work: wiring up auth, configuring the monorepo, copying login flows from old projects, setting up the DB connection, getting lint and formatting right. That context-switching kills the momentum to build the actual thing.

This template solves that. Clone it, fill in `.env`, and start building the feature — not the scaffolding.

**The goal:** never repeat boilerplate setup again. Auth, routing, DB, logging, UI primitives, and tooling are already done.

---

## Project Overview

TejaDev Template — a Turborepo monorepo with a Next.js web app and an Express API, sharing packages for DB, logging, UI, and shared utilities. Firebase handles authentication on both client and server.

**Package manager:** Bun
**Monorepo tool:** Turborepo
**Runtime:** Bun (API), Node 18+ (web build)

---

## Monorepo Structure

```
apps/
  api/        Express API (@tejadev/api) — port 8000
  web/        Next.js 16 app (@tejadev/web)
packages/
  db/         Mongoose client + model registry
  eslint-config/  Shared ESLint configs (base, next, node)
  logging/    Shared Axiom/console logger
  shared/     Shared constants and utility types
  typescript-config/  Shared tsconfig presets
  ui/         Shared React component library (shadcn/ui base)
```

---

## Development Commands

```bash
# Install dependencies (run from root)
bun install

# Run all apps in dev mode
bun run dev

# Run individual apps
bun run dev --filter=@tejadev/api
bun run dev --filter=@tejadev/web

# Build all
bun run build

# Build packages only (required before running apps)
bun run build:pkg

# Lint
bun run lint
bun run lint:fix

# Typecheck
bun run typecheck

# Format
bun run format
bun run format:check

# Full CI check
bun run ci:check
```

All apps load env from the root `.env` file via `dotenv-cli`. Copy `.env.example` to `.env` and fill in values.

---

## Environment Variables

Key variables (see `.env.example` for full list):

| Variable                        | Used by                                     |
| ------------------------------- | ------------------------------------------- |
| `API_PORT`                      | API server port (default 8000)              |
| `DB_URL`                        | MongoDB connection string                   |
| `NODE_ENV`                      | Environment (`dev` / `production`)          |
| `FIREBASE_CONFIG_PATH`          | Path to Firebase Admin service account JSON |
| `NEXT_PUBLIC_API_URL`           | API base URL for web client                 |
| `NEXT_PUBLIC_FIREBASE_*`        | Firebase client SDK config for web          |
| `AXIOM_TOKEN` / `AXIOM_DATASET` | Logging (optional)                          |

---

## API App (`apps/api`)

**Stack:** Express, Bun, Zod, Firebase Admin, Mongoose

### File Structure

```
src/
  index.ts          Server startup and lifecycle only
  app.ts            Middleware and route wiring only
  constants/env.ts  Centralized env access
  routes/           Route definitions
  controllers/      Request handlers
  middlewares/      Cross-cutting middleware (request-id, success, error-handler)
  services/         External integrations (firebase.ts)
  utils/            CustomError, throw_error, helpers
  types/            Shared API types
```

### Controller Conventions

**File naming** — include action + entity, be explicit:

- `get-all-notes.ts`, `get-note-by-id.ts`, `update-note-by-id.ts`, `delete-note-by-id.ts`, `create-note.ts`

**File structure order:**

1. `import type` block
2. `import` block (never mix type and regular imports in the same block)
3. Exported controller function
4. Zod schemas — defined after the function (params schema first, then body schema if both exist)

**Response rules:**

- `create` → `{ message, data: { <entity>_id } }` — only the ID, never the full document
- `delete` / `update` with no return data → `{ message }` only — no `data` key
- `get` → `{ message, data: <document(s)> }`

See `apps/api/RULES.md` → **Controllers** for the full pattern with code examples.

### Route Conventions

- Base path: `/api/v1`
- Auth routes: `/api/v1/auth` (login, signup, google)
- Health check: `GET /api/v1`

### Error Handling

- Use `CustomError` for expected errors: `new CustomError(message, statusCode)`
- Use `throw_error` helper for inline throws
- All errors flow through `error-handler` middleware — do not send raw responses in controllers
- Always propagate `request_id` in error payloads and logs

### DB Access

- Use `connect_db` / `disconnect_db` from the `db` package
- Access model registry via `mg` from `db`
- Never create app-local Mongoose clients

### Logging

- Import logger from the `logging` workspace package
- Include `request_id` in log context

### Testing

**Stack:** Vitest + Supertest + mongodb-memory-server

**Commands (run from `apps/api/`):**

```bash
bun run test            # run all tests once
bun run test:watch      # watch mode
bun run test:unit       # unit tests only (*.test.ts)
bun run test:int        # integration tests only (*.int.test.ts)
bun run test:coverage   # generate coverage report
```

**File structure:**

```
src/
  services/test-db.ts           DB helpers for tests (connect/disconnect/clear)
  tests/
    <feature>/
      test-setup.ts             scoped app factory + seed helpers per route
      <feature>.test.ts         integration tests
```

**Pattern for every new controller test:**

1. Create `src/tests/<feature>/test-setup.ts` — exports `create_app()`, `mock_auth_state`, `seed_data()`, `set_authenticated_user()`
2. `create_app()` mounts only the feature router + `error_handler` — never import the main `app.ts`
3. Mock `src/middlewares/authentication` with `vi.mock` at the top of each test file
4. Use `connect_test_db` / `disconnect_test_db` in `beforeAll` / `afterAll`
5. Use `clear_test_db` + `seed_data()` in `beforeEach`
6. Use `supertest` for all HTTP assertions

See `apps/api/RULES.md` → **Testing** section for the full pattern and code template.

---

## Web App (`apps/web`)

**Stack:** Next.js 16, React 19, TanStack Query, Tailwind CSS, shadcn/ui, Firebase client, Axios

### File Structure

```
src/
  app/            Next.js App Router — routes and layouts
    (auth)/       Login, signup pages (public)
    (private)/    Protected pages (requires auth)
  assets/         Static assets (fonts)
  components/     Reusable UI components
  constants/env.ts  Centralized env access
  hooks/api/      TanStack Query hooks (one file per route)
  hooks/custom/   Reusable custom hooks
  lib/            API client (axios), query client
  providers/      React context providers (auth, query, toaster)
  services/       Firebase client auth (email/password, Google)
  types/          Shared web types
```

### Styling

- Use Tailwind utilities only — no hardcoded hex colors or raw rgba
- Use token classes: `bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.
- Global tokens live in `src/app/globals.css`
- Tailwind theme mappings in `tailwind.config.mjs`
- Place shared/common UI primitives in `packages/ui` and import them from `@tejadev/ui` in apps
- Keep app-local `src/components` for feature-specific compositions only
- Keep `tailwind.cssVariables = true` in `components.json`

### Data Fetching

- Use TanStack Query for all server state
- API clients live in `src/lib/api.ts`
- One file per route in `src/hooks/api/` with this order: `type` → `api call` → `hook`
- Do not create separate service files for normal route calls

---

## Shared Packages

### `db`

Exposes `connect_db`, `disconnect_db`, `get_db_status`, model registry `mg`.

### `logging`

Shared Axiom-backed logger. Import and use in API; do not write to console directly.

### `shared`

Shared constants and `as const` type patterns. Use `(typeof X)[number]` for union types.

### `ui`

Shared React components built on shadcn/ui primitives.

---

## Coding Standards

### TypeScript

- Prefer `type` over `interface` in source files
- Never use `enum` — use `as const` + extracted type:
  ```ts
  export const ROLES = ['admin', 'user'] as const
  export type TRole = (typeof ROLES)[number]
  ```
- Use absolute alias imports (`@/...`) in web app code

### Naming

- **API:** snake_case for functions, variables, file names
- **Web:** camelCase for functions and hooks (`useXxx`); no snake_case
- Keep hook files in `hooks/api/` named after their route (e.g., `health.ts`, `auth.ts`)

### General

- Keep env access centralized in each app's `src/constants/env.ts`
- Implement features in small, verifiable steps
- After each step: lint + typecheck, then commit

---

## Commit Conventions

Enforced by commitlint + Husky. Follow conventional commits:

```
<type>(<scope>): <subject>
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`

- Type and scope must be lower-case
- Subject must not be empty or end with a period
- No sentence-case, start-case, pascal-case, or upper-case subjects

Examples:

```
feat(auth): add google login route
fix(api): handle missing request_id in error payload
chore: update dependencies
```

---

## Authentication Flow

- **Web:** Firebase client SDK handles login/signup (email+password and Google OAuth). Auth state managed via `providers/auth-provider.tsx`.
- **API:** Firebase Admin SDK (`src/services/firebase.ts`) verifies ID tokens. Service account loaded from `FIREBASE_CONFIG_PATH`.
- Protected web routes live under `(private)/` with an auth layout guard.
