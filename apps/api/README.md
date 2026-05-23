# @tejadev/api

Minimal Express API app wired to shared monorepo configs.

## Scripts

- `bun run dev` - Start API with Bun watch mode
- `bun run build` - Bundle server entry to `dist/`
- `bun run start` - Run server directly from `src/`
- `bun run typecheck` - Type-check only
- `bun run lint` - Lint source

## Endpoints

- `GET /`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/slug`

## Request ID

- API accepts `x-request-id` header.
- If missing, API generates one automatically.
- Response always includes `x-request-id`.
- Error responses also include `request_id` in JSON body.

## Environment Variables

| Key                    | Required            | Example                                                                           | Notes                                                       |
| ---------------------- | ------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `API_PORT`             | Yes                 | `8000`                                                                            | API server port                                             |
| `NODE_ENV`             | Yes                 | `dev`                                                                             | Use `dev` or `prod`                                         |
| `DB_URL`               | Yes                 | `mongodb+srv://user:pass@cluster.mongodb.net/tejadev?retryWrites=true&w=majority` | Set `NA` to skip DB connection                              |
| `AXIOM_TOKEN`          | No                  | `xaat-...`                                                                        | Required only if you want to send logs to Axiom             |
| `AXIOM_DATASET`        | No                  | `tejadev-api`                                                                     | Axiom dataset name used for ingest                          |
| `FIREBASE_CONFIG_PATH` | Yes for auth routes | `./firebase.service-account.json`                                                 | Absolute or workspace-relative path to service account JSON |

## Troubleshooting

- Startup is slow or exits before server starts:
  - Usually DB connection is failing.
  - Set `DB_URL=NA` to confirm server works without DB.
- Axiom logs are not visible:
  - Ensure both `AXIOM_TOKEN` and `AXIOM_DATASET` are set.
  - Without these, logs fall back to console output.
- Mongo Atlas connection fails:
  - Ensure DB user/password are correct.
  - Ensure your current IP is allowlisted in Atlas Network Access.
  - Ensure password special characters are URL-encoded.
  - Ensure URI includes a database name (for example `/tejadev`).
