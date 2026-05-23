# API Rules

Read this before writing API code.

## Structure

1. `src/index.ts` for startup and lifecycle only.
2. `src/app.ts` for middleware and route wiring only.
3. `src/routes/*` defines endpoints and middleware chain.
4. `src/controllers/*` contains request handlers.
5. `src/middlewares/*` contains cross-cutting behavior (request-id, success, error).

## Controllers

### File naming

Name controller files descriptively — include the action and entity:

- `get-all-notes.ts` not `get-notes.ts`
- `get-note-by-id.ts` not `get-note.ts`
- `update-note-by-id.ts` not `update-note.ts`
- `delete-note-by-id.ts` not `delete-note.ts`
- `create-note.ts` (no ID needed, stays as is)

### File structure

Every controller file follows this exact order:

```
1. type imports        (import type { ... })
2. regular imports     (import { ... })
3. controller function (exported)
4. zod schemas         (defined after the function)
```

Type imports and regular imports must be in **separate blocks** — never mix `import type` and `import` in the same block.

```ts
// ✅ Correct
// ❌ Wrong — type and regular mixed
import { mg, mg } from 'db'
import type { Request, Request, Response, Response } from 'express'
import { z } from 'zod'
import { throw_error, throw_error } from '../utils/throw-error.ts'
```

### Zod validation

- If a controller validates **only body** or **only params** → one schema
- If a controller validates **both params and body** → two separate schemas, params schema first

```ts
// params only
const get_note_params_schema = z.object({ note_id: z.string() })

// params + body → separate schemas
const update_note_params_schema = z.object({ note_id: z.string() })
const update_note_body_schema = z.object({ note: z.string().min(1) })
```

### Response shape rules

1. **Create** — only return the `_id`, never the full document:

   ```ts
   res.status(201).json({ message: '...', data: { note_id: new_note._id } })
   ```

2. **No data to return** (delete, update) — send only `message`, no `data` key:

   ```ts
   res.json({ message: 'Note deleted successfully' })
   ```

3. **Has data** (get by id, get all) — include `data` key:
   ```ts
   res.json({ message: '...', data: note })
   ```

---

## Error and Logging

1. Use `CustomError` / `throw_error` for expected API errors.
2. Keep response formatting centralized in `error-handler`.
3. Include `request_id` in error payload and logs.
4. Use shared logger package `logging`.

## DB

1. Use `connect_db` / `disconnect_db` from workspace package `db`.
2. Do not create app-local mongoose client duplicates.
3. Access model registry via `mg` from `db`.

---

## Testing

**Stack:** Vitest + Supertest + mongodb-memory-server

### File placement

- Unit tests: co-locate with the file — `src/controllers/auth/sync.test.ts`
- Integration tests: `src/tests/integration/<route-name>.test.ts`
- Test setup helpers per route: `src/tests/<route-name>/test-setup.ts`

### Every controller test file follows this structure

```
1. imports
2. vi.mock('@/middlewares/authentication', ...) — mock auth inline
3. const app = create_app()    — scoped express app with only this router
4. let seed_data: TSeedData
5. beforeAll  → connect_test_db()
6. afterAll   → disconnect_test_db()
7. beforeEach → clear_test_db() + seed + set_authenticated_user()
8. describe blocks per endpoint
```

### Rules

1. Never import `app.ts` in tests — create a scoped express app using `create_app()` in the test-setup file that mounts only the router under test + `error_handler`.
2. Mock `src/middlewares/authentication` with `vi.mock` in every test file that needs auth — do not rely on the real Firebase token verification.
3. Use `set_authenticated_user()` to change auth state between test cases — never mutate `mock_auth_state` directly.
4. Use `clear_test_db()` in `beforeEach`, not `afterEach` — ensures a clean slate before each test regardless of prior failures.
5. Use `supertest` for all HTTP assertions — do not call controller functions directly.
6. Name test files `<feature>.test.ts` for unit, `<feature>.int.test.ts` for integration.
7. Run scripts from `apps/api/`:
   - `bun run test` — run all tests once
   - `bun run test:watch` — watch mode
   - `bun run test:coverage` — generate coverage report

### Creating a test-setup file for a new controller

```ts
// src/tests/<feature>/test-setup.ts
import express from 'express'
import fileUpload from 'express-fileupload'
import { vi } from 'vitest'
import { throw_error } from '@/utils/throw-error'
import error_handler from '@/middlewares/error-handler'
import { <feature>_router } from '@/routes/<feature>'

export const AUTH_TOKEN = 'test-auth-token'
export const mock_auth_state = { token: AUTH_TOKEN, user: null }

export const setup_auth_mock = () => {
  vi.mock('@/middlewares/authentication', () => ({
    is_authenticated: (req, _res, next) => {
      const token = req.headers.authorization?.split(' ')[1]
      if (token !== mock_auth_state.token) throw_error('Invalid token provided', 401)
      if (!mock_auth_state.user) throw_error('Access denied.', 401)
      req.user = mock_auth_state.user
      next()
    }
  }))
}

export const create_app = () => {
  const app = express()
  app.use(express.json())
  app.use(fileUpload({ createParentPath: true }))
  app.use('/api/v1/<feature>', <feature>_router)
  app.use(error_handler)
  return app
}

// seed_data() and set_authenticated_user() go here
```

### DB helpers (from `src/services/test-db.ts`)

```ts
import {
  clear_test_db,
  connect_test_db,
  disconnect_test_db
} from '@/services/test-db'
```

- `connect_test_db()` — spins up an in-memory MongoDB instance
- `disconnect_test_db()` — tears it down
- `clear_test_db()` — wipes all collections (call in `beforeEach`)

> **First run:** `mongodb-memory-server` downloads the MongoDB binary (~66MB). It is cached after that.
