# COMPESN Workspace

This repository is now a pnpm workspace made of three packages:

```text
compesn/
  compesn-frontend/  Next.js app, auth, tRPC, UI, DB access
  compesn-backend/   Express + Socket.IO realtime service
  compesn-shared/    Shared schemas, types, draft helpers, cache/logging utilities
```

`@compesn/shared` is resolved with `workspace:*`, so production installs must happen from this workspace root.

Canonical repository URL: `https://github.com/nerophase/compesn.git`

## Install

```bash
pnpm install
```

Installing from the root also triggers `compesn-shared` to build its package output, so clean checkouts have the shared artifacts available before workspace typechecks, tests, and app builds run.

## Quality Gates

Run all package checks from the workspace root:

```bash
pnpm -r typecheck
pnpm -r test
pnpm -r build
pnpm -r lint
```

## Local Development

Run the frontend:

```bash
pnpm dev:frontend
```

Run the backend:

```bash
pnpm dev:backend
```

## Production Build Contract

- Clone the full workspace, not a single child package by itself.
- Run `pnpm install` at the workspace root.
- Build packages with workspace-aware commands:

```bash
pnpm build:shared
pnpm build:frontend
pnpm build:backend
```

- The frontend service can still use `compesn-frontend` as its app directory.
- The backend service can still use `compesn-backend` as its app directory.
- Shared code is not published to npm and is not expected to exist outside this checkout.
- Production start commands from the root are:

```bash
pnpm start:frontend
pnpm start:backend
```

## Deployment Notes

- The frontend production build uses webpack and repo-local fonts so it does not depend on Turbopack workspace inference or live Google Fonts fetches.
- `compesn-frontend/next.config.ts` points file tracing and Turbopack workspace resolution at this root.
- GitHub Actions validation lives in `.github/workflows/ci.yml` and runs install, typecheck, test, build, and lint from the workspace root.

## Repository Migration Note

This workspace is intended to replace the old standalone repos:

- `compesn-frontend`
- `compesn-backend`

Those repos should be archived after the new root repo is pushed and verified. They remain useful as historical references, but they are no longer the intended deployment source.
