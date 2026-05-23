# TejaDev Template

A production-ready full-stack TypeScript monorepo. Auth, database, UI, logging, and tooling — all wired and working before you write a single line.

Clone it. Fill `.env`. Build the feature.

---

## What's Inside

```
apps/
  api/        Express API — port 8000
  web/        Next.js 16 app
packages/
  db/         MongoDB + Mongoose client and model registry
  ui/         Shared React component library (shadcn/ui)
  logging/    Axiom-backed structured logger
  shared/     Shared constants, types, and utilities
  eslint-config/      Shared ESLint configs (base, next, node)
  typescript-config/  Shared tsconfig presets
```

---

## Tech Stack

| Layer    | Tech                                                          |
| -------- | ------------------------------------------------------------- |
| Monorepo | Turborepo + Bun workspaces                                    |
| Runtime  | Bun (API), Node 18+ (web build)                               |
| Web      | Next.js 16, React 19, TanStack Query, Tailwind CSS, shadcn/ui |
| API      | Express, Zod, Bun                                             |
| Auth     | Firebase (client + Admin SDK)                                 |
| Database | MongoDB + Mongoose                                            |
| Logging  | Axiom via `@tejadev/logging`                                  |
| Tooling  | ESLint, Prettier, Commitlint, Husky, lint-staged              |
| CI       | GitHub Actions                                                |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-username/tejadev-template.git
cd tejadev-template

# 2. Install
bun install

# 3. Set up env
cp .env.example .env
# Fill in all values in .env

# 4. Run
bun run dev
```

Web runs on `http://localhost:3000`, API on `http://localhost:8000`.

---

## Environment Variables

All apps load from a single root `.env`. Copy `.env.example` and fill in:

```bash
# Server
API_PORT=8000
NODE_ENV=dev
DB_URL=                          # MongoDB connection string

# Firebase Admin (API)
FIREBASE_CONFIG_PATH=            # Path to service account JSON

# Firebase Client (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=    # For Google One Tap

# App
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_API_URL=http://localhost:8000

# Logging (optional)
AXIOM_TOKEN=
AXIOM_DATASET=
```

Never add app-level `.env` files. All env access goes through `src/constants/env.ts` in each app.

---

## Commands

```bash
bun run dev           # Run all apps in parallel (web + api)
bun run build         # Build everything
bun run build:pkg     # Build packages only (required before running apps)
bun run lint          # Lint all workspaces
bun run lint:fix      # Lint and auto-fix
bun run typecheck     # TypeScript check all workspaces
bun run format        # Format with Prettier
bun run format:check  # Check formatting without writing
bun run ci:check      # Full local CI (format + lint + typecheck + build)
```

Run a single app:

```bash
bun run dev --filter=@tejadev/api
bun run dev --filter=@tejadev/web
```

---

## Authentication

Firebase handles auth end-to-end.

**Web (client)**

- Email + password login and signup
- Google OAuth popup
- Google One Tap
- Email verification enforced on login
- Auth state managed via `providers/auth-provider.tsx`
- Protected routes under `(private)/` with layout guard

**API (server)**

- Firebase Admin SDK verifies ID tokens on every protected request
- Service account loaded from `FIREBASE_CONFIG_PATH`
- `authenticate` middleware in `src/middlewares/authenticate.ts`

---

## API Structure

```
src/
  index.ts          Server startup only
  app.ts            Middleware and route wiring
  constants/env.ts  Centralized env access
  routes/           Route definitions
  controllers/      Request handlers (+ Vitest tests)
  middlewares/      request-id, success-handler, error-handler, authenticate
  services/         Firebase Admin init
  utils/            CustomError, throw_error, helpers
  types/            Shared API types
  scripts/seed.ts   DB seed script
```

**Base path:** `/api/v1`

**Error handling:** Use `CustomError` for expected errors. All errors flow through the `error-handler` middleware. Never send raw responses from controllers.

**Security:** `helmet` and `express-rate-limit` applied globally.

---

## Web Structure

```
src/
  app/
    (auth)/         Login, signup, forgot-password (public)
    (private)/      Protected pages (auth required)
  components/       App-specific UI components
  constants/env.ts  Centralized env access
  hooks/api/        TanStack Query hooks (one file per route)
  hooks/custom/     Reusable custom hooks
  lib/              Axios client, query client config
  providers/        Auth, query, toaster, One Tap providers
  services/auth/    Firebase client auth methods
  types/            Shared web types
```

---

## Shared Packages

### `@tejadev/db`

MongoDB connection and model registry.

```ts
import { connect_db, disconnect_db, mg } from '@tejadev/db'

await connect_db()
const user = await mg.User.findById(id)
```

### `@tejadev/ui`

Shared React components (Button, Card, Input, Label, DropdownMenu, Sonner toast) and hooks (useDebounce, useOpenClose, useCookie, useQueryParams, useIntersectionObserver).

```ts
import { Button, Card, toast } from '@tejadev/ui'
```

### `@tejadev/logging`

Axiom-backed structured logger. Falls back to console when `AXIOM_TOKEN` is not set.

```ts
import { logger } from '@tejadev/logging'

logger.info('request received', { request_id })
```

### `@tejadev/shared`

Shared constants, utility types, and functions (slugify, auth roles, etc).

```ts
import { ROLES, slugify } from '@tejadev/shared'
```

---

## Coding Conventions

### TypeScript

- Use `type` over `interface`
- Never use `enum` — use `as const` with extracted union type:

```ts
export const ROLES = ['admin', 'user'] as const
export type TRole = (typeof ROLES)[number]
```

### Naming

- **API:** `snake_case` for functions, variables, file names
- **Web:** `camelCase` for functions and hooks (`useXxx`)
- Hook files in `hooks/api/` named after their route (e.g. `auth.ts`, `note.ts`)

### Adding a new API route

1. Add route file in `src/routes/`
2. Add controller(s) in `src/controllers/`
3. Wire route in `src/app.ts`
4. Add TanStack Query hook in `apps/web/src/hooks/api/`

---

## Commit Conventions

Enforced by Commitlint + Husky:

```
<type>(<scope>): <subject>
```

Allowed types: `feat` `fix` `chore` `docs` `style` `refactor` `perf` `test` `build` `ci` `revert`

```bash
feat(auth): add google login route
fix(api): handle missing request_id in error payload
chore: update dependencies
```

---

## Seeding the Database

```bash
bun run --filter=@tejadev/api seed
```

---

## Deploying

| App        | Platform                         |
| ---------- | -------------------------------- |
| `apps/web` | Vercel (recommended)             |
| `apps/api` | Railway / Render / any Node host |

After deploying, add your production URL to:

- Firebase Console → Authentication → Authorized domains
- Google Cloud Console → OAuth 2.0 credentials → Authorized JavaScript origins

---

## License

MIT — use it, fork it, ship it.
