# COMPESN Frontend

`compesn-frontend` is the main Next.js application in the COMPESN workspace.

## Responsibilities

- App Router pages and layouts
- NextAuth authentication flows
- tRPC request/response APIs
- Drizzle + PostgreSQL access
- Redis-backed caches
- Realtime client connections to the backend Socket.IO service

Shared schemas, types, and pure draft utilities come from `@compesn/shared`.

## Workspace Commands

Install dependencies from the workspace root:

```bash
pnpm install
```

Run the frontend in development:

```bash
pnpm --filter ./compesn-frontend dev
```

Run the frontend with Turbopack (opt-in only):

```bash
pnpm --filter ./compesn-frontend dev:turbo
```

Build the frontend for production:

```bash
pnpm --filter ./compesn-frontend build
```

Run the package checks:

```bash
pnpm --filter ./compesn-frontend typecheck
pnpm --filter ./compesn-frontend lint
```

## Production Notes

- The frontend consumes `@compesn/shared` through the workspace, not a sibling `file:` dependency.
- `next.config.ts` is configured for a monorepo checkout and points file tracing at the workspace root.
- Development defaults to Webpack (`pnpm dev`) because Turbopack currently regresses first compile time in this monorepo.
- Use `pnpm dev:turbo` only when explicitly testing Turbopack behavior.
- The production build uses `next build --webpack` for stability in this workspace.
- Fonts are loaded from local files in `src/app/fonts` so builds do not depend on Google Fonts network access.

## Authentication Notes

Credentials, Discord, and Riot auth are configured in `src/lib/auth.ts`.

The credentials provider includes a deliberate development-only bypass for manual testing:

- `ENABLE_AUTH_BYPASS=true`
- `AUTH_BYPASS_IDENTIFIER=<username-or-email>`

The bypass is disabled in production even if the flag is present.

## Key Areas

- `src/app/`: routes and layouts
- `src/features/`: feature-level UI and server modules
- `src/trpc/routers/`: tRPC composition and endpoints
- `src/lib/database/`: Postgres and Redis access
- `src/lib/auth.ts`: NextAuth configuration
- `src/lib/sockets.ts`: realtime client connection

- Credentials auth validates submitted credentials by default.
- If `ENABLE_AUTH_BYPASS=true` in non-production, the submitted username/email (or `AUTH_BYPASS_IDENTIFIER`) can be used to log in as a test user.

Related API routes:

- `/api/auth/[...nextauth]`
- `/api/socials/discord`
- `/api/socials/riot`

## Realtime Model

Frontend websocket clients:

- `src/lib/sockets.ts`
    - default namespace: `NEXT_PUBLIC_SERVER_URL`
    - private chat namespace: `NEXT_PUBLIC_SERVER_URL/private-chat`
- `src/lib/private-socket.ts`

Backend websocket namespaces from `compesn-backend/src/app.ts`:

- default namespace for rooms, chat, drafts, and notifications
- `/private-chat` namespace for private/team messaging events

## Local Development

### Frontend

```bash
cd compesn-frontend
pnpm install
pnpm dev
```

Runs Next.js on [http://localhost:5000](http://localhost:5000).

Useful scripts:

```bash
pnpm dev
pnpm dev:turbo
pnpm build
pnpm start
pnpm lint
pnpm db:seed
pnpm db:clear
pnpm db:reseed
```

### Backend

```bash
cd compesn-backend
pnpm install
pnpm dev
```

Default runtime behavior:

- HTTP server on `APP_PORT`
- Socket.IO server on the same port
- private chat namespace at `/private-chat`

Useful scripts:

```bash
pnpm dev
pnpm build
pnpm start
```

## Environment Variables

There is no checked-in root `.env.example`, so the quickest way to reconstruct env needs is from the typed env files.

### Frontend env (`compesn-frontend/src/environment/index.ts`)

Server-side values:

- `NODE_ENV`
- `VERCEL_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_DISCORD_SECRET`
- `AUTH_RIOT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `ENABLE_CACHE`
- `RESEND_KEY`
- `RIOT_API_KEY`
- `ROOM_TTL`

Client-side values:

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SERVER_URL`
- `NEXT_PUBLIC_AUTH_DISCORD_ID`
- `NEXT_PUBLIC_AUTH_RIOT_ID`

### Backend env (`compesn-backend/src/environment/index.ts`)

- `APP_PORT`
- `APP_SECRET`
- `DB_URL`
- `DATABASE_URL`
- `REDIS_URL`
- `ENABLE_CACHE`
- `ROOM_TTL`
- `END_TURN_NUMBER`
- `ACCESS_TOKEN_EXPIRE_TIME`
- `REFRESH_TOKEN_EXPIRE_TIME`
- `NODEMAILER_EMAIL`
- `NODEMAILER_PW`
- `RIOT_API_KEY`
- `PROVIDER_ID`
- `GENERATE_TOURNAMENT_CODE`
- `RIOT_CLIENT_ID`
- `RIOT_CLIENT_SECRET`
- `RIOT_API_URL`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `RESEND_KEY`
- `CHAMPIONS_FILE_PATH`
- `CHAMPIONS_IMAGES_PATH`
- `LOGS_FILE_PATH`

Note: the backend still validates `DB_URL`, but the current source inspection did not show active MongoDB usage under `src/`. That likely reflects leftover config or an unfinished migration away from an earlier backend shape.

## Good Re-Entry Points

If you want to rebuild context quickly, this order gives a good mental map:

1. `compesn-frontend/src/trpc/routers/_app.ts`
2. `compesn-frontend/src/app/`
3. `compesn-frontend/src/common/schemas/`
4. `compesn-frontend/src/lib/auth.ts`
5. `compesn-frontend/src/lib/messaging.ts`
6. `compesn-frontend/src/trpc/routers/teams/index.ts`
7. `compesn-frontend/src/trpc/routers/scrims/index.ts`
8. `compesn-frontend/src/trpc/routers/drafts/index.ts`
9. `compesn-backend/src/app.ts`
10. `compesn-backend/src/websockets/event-handlers/`

## Known Codebase Notes

- The workspace appears to be mid-transition in a few areas, especially auth/testing and some backend configuration.
- The frontend is the center of gravity for business logic, data access, and route ownership.
- The backend is primarily valuable as the realtime event layer rather than as a full REST API today.
- Existing sub-READMEs are still useful, especially `compesn-backend/README.md` and the frontend seed docs, but they are narrower in scope than this root guide.
