# COMPESN Code Quality, Readability, and Repetition Cleanup

## Summary

- Keep the auth bypass, but formalize it as a deliberate development-only testing mechanism instead of removing it.
- Prioritize the highest-leverage problems first: copied shared code between frontend/backend, duplicated helpers/components, oversized feature files, and blurred ownership between frontend tRPC logic and backend websocket logic.
- Preserve current product behavior and route/socket contracts during the first pass. This is a structural cleanup, not a feature rewrite.

## Key Changes

### 1. Guardrails and low-risk cleanup

- Keep the test auth bypass in [src/lib/auth.ts](/Users/nerophase/Repos/compesn/compesn-frontend/src/lib/auth.ts), but change the plan so it becomes an explicit dev-only bypass mode.
- Implement the bypass as:
    - Enabled only in non-production.
    - Controlled by a dedicated env flag such as `ENABLE_AUTH_BYPASS`.
    - Able to target a chosen user by username or email, so it still supports fast switching for manual testing.
    - Clearly separated from normal credential logic with one helper function and one clear comment block.
- Fix backend config drift without changing behavior: remove stale Mongo/Typegoose assumptions from docs and dependencies if they are truly unused, and make env parsing/Redis setup consistent with validated env values.
- Add missing repo hygiene:
    - Backend ESLint setup.
    - `lint`, `typecheck`, and `test` scripts in both apps.
    - A small shared error/logging convention so routers and services stop swallowing failures with `console.error` and implicit `undefined`.

### 2. Remove repetition at the package boundary

- Create a new sibling package at `/Users/nerophase/Repos/compesn/compesn-shared` and import it from both apps as `@compesn/shared`.
- Move all duplicated contract-level code there:
    - `common/schemas`
    - `common/types`
    - draft turn constants and pure draft helpers
    - pure champion/auth utility code that is currently copied across apps
- Treat the current frontend copies as canonical where frontend/backend copies already diverged, then migrate backend to those shared exports.
- After migration, delete the local duplicated `src/common` copies from frontend/backend so drift cannot reappear.

### 3. Remove repetition inside the frontend

- Consolidate duplicate UI/form modules into one implementation each:
    - `form-combobox`
    - `password-input`
    - overlapping helper modules under `lib/`, `utils/`, and `services/`
- Define folder ownership clearly:
    - `features/` for domain-specific UI + hooks + server adapters
    - `components/ui/` for reusable design-system pieces
    - `lib/` for infrastructure adapters and external integrations
    - `utils/` only for tiny pure helpers
- Replace parallel implementations with shared feature primitives, especially in the draft area:
    - one set of reusable draft UI/state helpers
    - route containers for legacy room drafts and scrim drafts that compose the same building blocks

### 4. Break up oversized hotspot files

- Refactor the largest files first because they are the main readability bottlenecks:
    - [teams/[id]/page.tsx](</Users/nerophase/Repos/compesn/compesn-frontend/src/app/(main-layout)/teams/[id]/page.tsx>)
    - [history/page.tsx](</Users/nerophase/Repos/compesn/compesn-frontend/src/app/(main-layout)/history/page.tsx>)
    - [scrims/index.ts](/Users/nerophase/Repos/compesn/compesn-frontend/src/trpc/routers/scrims/index.ts)
- Split them into:
    - route/container component
    - feature hooks for state and mutations
    - pure presentational sections
    - extracted domain services for server-side business logic
- Keep tRPC routers thin: auth, input validation, orchestration, response shaping. Move business rules into feature service modules.

### 5. Tighten architecture without changing deployment shape

- Keep frontend and backend as separate apps and separate repos.
- Make ownership explicit:
    - `frontend`: pages, auth UX, tRPC API, app orchestration
    - `backend`: realtime websocket/session orchestration
    - `@compesn/shared`: contracts, shared schemas/types, pure domain logic
- Remove dead or half-migrated backend code such as unused services and stale architectural remnants.
- Refactor websocket handlers to use shared guard helpers for repeated checks like room lookup, team membership, and active-turn validation.

## Public Interfaces and Structural Changes

- Add a new local package: `@compesn/shared`.
- Add a dev-only auth bypass interface via env configuration:
    - `ENABLE_AUTH_BYPASS`
    - one target-user selector env value such as username/email
- Keep existing route paths, tRPC procedure names, database schema behavior, and socket event names unchanged in the first pass.
- Replace local imports from duplicated `common` modules with imports from `@compesn/shared`.

## Test Plan

- Add unit tests for:
    - draft turn progression
    - repeat/no-ban behavior
    - room cache serialization/deserialization
    - scrim overlap rules
    - auth bypass behavior in dev vs production
- Add one frontend integration test around a complex feature slice such as scrims or teams.
- Add one backend websocket integration test around room join plus draft action flow.
- Add a contract test that fails if frontend/backend reintroduce local duplicated shared schema/type trees instead of importing from `@compesn/shared`.
- Require both apps to pass `lint`, `typecheck`, and tests before calling the cleanup complete.

## Assumptions and Defaults

- The auth bypass stays, but only as an explicit development/testing feature, not as hidden default behavior.
- This pass does not redesign product flows or merge the two repos.
- Refactoring should be incremental with compatibility shims where needed, not a big-bang rewrite.
- Success criteria for the first pass:
    - no duplicated shared contract trees across frontend/backend
    - one implementation per duplicated helper/component
    - targeted hotspot files split into smaller feature modules
    - stronger automated checks in both apps
