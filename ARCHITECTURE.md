# Architecture — Ocean Blue Workforce Platform

> Target architecture for refactoring the codebase to clean, modular, scalable
> structure **without changing product behavior**. This is a migration target,
> applied incrementally (one feature at a time), not a big-bang rewrite.

## Principles

1. **The Dependency Rule** — dependencies point inward only:
   `app (routing)` → `features` → `shared kernel` → `domain (pure)`.
   The domain layer imports *nothing* framework-specific. It is plain TypeScript.
2. **Separation of concerns** — each layer has one job:
   - **domain** — entities + pure business rules (stats, expiry, validation). Unit-testable, no React, no fetch, no AWS.
   - **server** — data access (repositories) + orchestration (services). Server-only.
   - **api (client)** — typed browser ↔ server transport. One fetch wrapper, one envelope.
   - **state** — React context/hooks holding *server state only*. Thin.
   - **ui** — presentation. No data fetching, no business math.
3. **Feature modularity** — code is grouped by business capability, not by technical type, so a feature can be reasoned about (and removed) in isolation.
4. **Server-only isolation** — anything touching AWS credentials imports `server-only` and lives under `*/server` or `shared/server`. Never reachable from a client bundle.
5. **DRY infrastructure** — exactly one place for: the HTTP envelope, the fetch client, DynamoDB key building, and the base repository.

## Target folder structure (feature-modular clean architecture)

```
src/
  app/                          # Next.js routing ONLY — thin
    (marketing)/                # landing, login, signup, forgot-password
    dashboard/<feature>/        # pages compose feature UI; no business logic
    api/<feature>/route.ts      # thin controllers → call a feature service
  features/                     # each business capability, self-contained
    <feature>/
      domain/                   # entities + pure rules (framework-free, testable)
        <feature>.types.ts
        <feature>.rules.ts
      server/                   # server-only: repository + service
        <feature>.repository.ts
        <feature>.service.ts
      api/<feature>.client.ts   # browser client (typed fetch)
      state/<feature>.context.tsx
      ui/                       # feature components (forms, tables, panels)
      index.ts                  # the module's public surface
  shared/                       # shared kernel — imported by features, imports nothing from them
    ui/                         # design-system primitives (button, toast, dialog…)
    lib/http/                   # api client wrapper + envelope type
    lib/                        # utils, names, export helpers
    server/db/                  # dynamodb client + key builders + base repository
    server/http/                # response helpers: ok() / fail() / notFound()
    server/auth/                # cognito, session
    config/                     # brand, env
    types/                      # truly cross-feature types
```

### Why feature-modular over pure horizontal layers
With 15 business entities and growing, root-level `domain/ application/ infrastructure/`
folders become 15-file dumping grounds. Grouping by feature keeps each capability
cohesive and lets the platform scale by *adding a folder*, not editing four.

## The two reusable abstractions that remove most duplication

**1. Server response helpers** (`shared/server/http/responses.ts`)
Replaces the `NextResponse.json({ success, data/error }, { status })` boilerplate
repeated in all 42 route files.

**2. Base repository** (`shared/server/db/base-repository.ts`)
A generic single-table repository (get/list/put/delete + key + GSI building).
Each feature repository becomes ~15 lines of config instead of ~120 of commands.

**3. HTTP client** (`shared/lib/http/client.ts`)
One `apiClient.get/post/put/del` that owns the `{success,data,error}` envelope.
Contexts shrink to thin server-state holders.

## Migration plan (incremental, behavior-preserving)

| Phase | Scope | Verify |
|---|---|---|
| 0 | Shared kernel: http client, response helpers, db keys, base repository | build green |
| 1 | **Reference slice: Subcontractors** end-to-end | build + manual smoke |
| 2 | Employees, Clients, Vendors, End Clients | build per feature |
| 3 | Billing (timesheets, invoices, margins), Compliance (i9, i983, coi) | build per feature |
| 4 | Leave, Attendance, Handbook, Benefits, Docs, Users | build per feature |
| 5 | Split god-files (reports 1651 / leaves 904 / onboard 897 LOC); delete orphaned components | build green |

Each phase is one reviewable change set, leaves the app fully working, and changes
**no product behavior** — only the internal shape of the code.
