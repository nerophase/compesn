# COMPESN Backend

`compesn-backend` is the realtime service in the COMPESN workspace.

## Responsibilities

- Express HTTP server
- Socket.IO room, draft, notifications, and private chat events
- Redis-backed room/session orchestration
- PostgreSQL access through Drizzle
- Shared contract and draft logic via `@compesn/shared`

## Workspace Commands

Install dependencies from the workspace root:

```bash
pnpm install
```

Run the backend in development:

```bash
pnpm --filter ./compesn-backend dev
```

Build the backend:

```bash
pnpm --filter ./compesn-backend build
```

Run the package checks:

```bash
pnpm --filter ./compesn-backend typecheck
pnpm --filter ./compesn-backend lint
```

## Required Environment

The backend validates its environment in `src/environment/index.ts`.

```bash
APP_PORT=3000
APP_SECRET=replace-with-a-random-32+char-secret
DATABASE_URL=postgres://<user>:<pass>@<host>:<port>/<db>
REDIS_URL=redis://localhost:6379
ENABLE_CACHE=true
ROOM_TTL=3600
END_TURN_NUMBER=22
ACCESS_TOKEN_EXPIRE_TIME=30d
REFRESH_TOKEN_EXPIRE_TIME=30d
NODEMAILER_EMAIL=you@example.com
NODEMAILER_PW=app-password-or-token
RESEND_KEY=your-resend-api-key
RIOT_API_KEY=your-riot-api-key
RIOT_CLIENT_ID=your-riot-client-id
RIOT_CLIENT_SECRET=your-riot-client-secret
PROVIDER_ID=0
GENERATE_TOURNAMENT_CODE=true
RIOT_API_URL=https://americas.api.riotgames.com
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
CHAMPIONS_FILE_PATH=champions.json
CHAMPIONS_IMAGES_PATH=champions-imgs
LOGS_FILE_PATH=compesn.log
```

## Production Notes

- The backend depends on `@compesn/shared` through the workspace, so production installs must come from the workspace root.
- Redis configuration now uses validated environment values consistently.
- The backend no longer documents or expects MongoDB or Mongoose.

## Key Areas

- `src/app.ts`: Express + Socket.IO bootstrap
- `src/websockets/event-handlers/`: room, draft, notifications, chat handlers
- `src/services/`: backend business logic
- `src/environment/index.ts`: validated env loader
- `src/database/redis.ts`: Redis connection
