# Rivet - Architecture

Architecture decisions for the Rivet codebase. Living document - update as implementation reveals new constraints.

For point-in-time decision history, see [`docs/adr/`](./adr/README.md) (use [`template.md`](./adr/template.md) to add a new record).

---

## Stack

- **API:** NestJS, Prisma, PostgreSQL (shared; RLS deferred — see [ADR-0002](./adr/0002-application-layer-tenant-isolation.md))
- **Web:** Vite, React, TanStack Query
- **Shared:** `@rivet/shared` - wire types, API envelope, Zod/constants (framework-agnostic)
- **Jobs:** BullMQ + Redis
- **Billing:** Stripe (test mode in development)
- **Observability:** structured logs, Prometheus/Grafana, OpenTelemetry traces, alerts

PostgreSQL was chosen for relational data and mature tooling. Prisma was chosen for transaction ergonomics, schema-first workflow, and Client extensions for tenant query scoping. **Postgres RLS** is a documented future backstop when compliance or multiple DB consumers require database-enforced isolation ([ADR-0002](./adr/0002-application-layer-tenant-isolation.md)).

---

## Monorepo layout

pnpm workspaces (not Nest's built-in monorepo mode):

```
rivet/
├── apps/
│   ├── api/              @rivet/api - NestJS
│   └── web/              @rivet/web - Vite + React
├── packages/
│   └── shared/           @rivet/shared
├── docker-compose.yml
└── pnpm-workspace.yaml
```

Build `@rivet/shared` before app dev. Deploy API and web separately; shared is a compile-time dependency only.

---

## Backend layering

```
Request
   │
   ▼
api/<feature>/        Controllers, DTOs, entities, orchestration (HTTP-aware)
   │
   ▼
use-cases/<name>/      Multi-domain flows used from 2+ entry points (HTTP-unaware)
   │
   ▼
modules/<name>/        Domain services + private repositories (one domain each)
   │
   ▼
PostgreSQL
```

`api/` is organized by **feature** (`auth`, `org`, `projects`, `issues`, `billing`, `webhooks`), not by actor type - org members differ by **role**, not by separate app surfaces.

### Module rules

- **`modules/**` never imports another module.** Cross-domain work goes in `api/` or `use-cases/`.
- **Repositories are private** to their module's service - not exported from the Nest module.
- **`org_id` on tenant models** is enforced by the Prisma tenant extension (from CLS) on allowlisted models — not repeated manually on every query. See [Tenant isolation](#tenant-isolation).

| Logic                         | Lives in                   |
| ----------------------------- | -------------------------- |
| Single-domain rule            | `modules/<name>/services/` |
| Multi-domain, one HTTP entry  | `api/<feature>/services/`  |
| Multi-domain, 2+ entry points | `use-cases/<name>/`        |

Promote logic into `use-cases/` only when a **second real call site** needs the same flow - never preemptively.

---

## Tenant isolation

Full rationale: [ADR-0002](./adr/0002-application-layer-tenant-isolation.md).

Three application layers (Postgres RLS deferred):

1. **HTTP guard:** `OrgMemberGuard` on tenant-scoped controllers (after JWT auth). Validates `x-org-id`, checks org membership, sets CLS (`orgId`, `userId`, `orgRole`).
2. **Request context:** `TenantContextService` reads CLS in `api/` services — avoids threading org through every method signature.
3. **Data scoping:** Prisma Client extension on allowlisted models (`Project`, …) merges `organizationId` from CLS into reads/writes. Throws if tenant context is missing.

```
HTTP / job / webhook entry
   │
   ├─ HTTP: OrgMemberGuard → CLS
   ├─ Job: cls.run(() => cls.set('orgId', …))
   └─ Webhook: resolve org from Stripe customer → cls.run(…)
   │
   ▼
api/<feature>/service     (reads TenantContextService where needed)
   │
   ▼
modules/<feature>/service → repository → extended Prisma client
```

**Bootstrap paths** (register + create org, auth) do not use `OrgMemberGuard` and do not touch tenant-scoped models until an org exists.

**Async entry points** (BullMQ, Stripe webhooks) must set CLS before module/DB work — same extension, no separate scoping logic.

**Verification:** `apps/api/test/tenant-isolation.e2e-spec.ts` — org B cannot read/update org A's project via HTTP; module queries without explicit `organizationId` still respect CLS org scope.

**Future:** Postgres RLS when a concrete trigger appears (compliance, BI on prod DB, second service sharing Postgres).

---

## Database transactions

Use transactions when multiple writes must succeed or fail together (register-with-org, invite accept, Stripe webhook idempotency + plan update). Do **not** wrap full HTTP handlers or hold transactions across Stripe, queue enqueue, or file I/O.

```
databaseService.client.$transaction(async (tx) => { /* DB work via { tx } */ })
// enqueue / external calls after commit
```

Tenant-scoped module calls rely on CLS (set by guard or async entry wrapper) plus the Prisma extension — no separate `TenantPrismaService` until/unless RLS is adopted.

---

## Authentication

Short-lived **access JWT** (Bearer, ~15 min) + long-lived **refresh token** (`httpOnly` cookie, ~7 days). Full rationale: [ADR-0001](./adr/0001-dual-token-auth-with-httponly-refresh-cookie.md).

| Token      | Storage               | Notes                                                                                                      |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Access JWT | Client (localStorage) | Claims: `sub` (user), `sid` (session). Sent as `Authorization: Bearer`.                                    |
| Refresh    | `httpOnly` cookie     | Opaque token; hash in `refresh_tokens`; rotated on refresh; revoked on logout. **Never returned in JSON.** |

**Deployment:** Web (Vercel) and API (Render) are cross-origin. Refresh cookie uses `SameSite=None; Secure` in production. CORS allows credentialed requests from allowlisted frontend origins.

**Org context:** Tenant-scoped routes require the **`x-org-id` header**. The API validates the authenticated user belongs to that org (membership check) before tenant logic runs. Org switch updates client state and subsequent headers — no new access token.

**Client contract (target):** Login/refresh/logout use `fetch` with `credentials: 'include'`. Access token in localStorage; refresh token never in JS.

**Not in v1:** OAuth, MFA, session admin UI, BFF for token storage.

---

## Errors

Single `DomainError` class with `kind` (`NOT_FOUND` | `RULE_VIOLATION` | `CONFLICT`) and machine-readable `code`. Domain layers throw; a global exception filter maps to HTTP status and the response envelope. Stripe webhooks catch `DomainError` explicitly and return `200` where retries would be harmful.

---

## API contract (shared package)

| Shape                          | Location                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------- |
| **Wire type** (`IssueWire`, …) | `@rivet/shared` - JSON inside `data`                                              |
| **Entity**                     | `api/<feature>/entities/` - `implements IssueWire` + `@ApiProperty()` for Swagger |
| **DTO**                        | `api/<feature>/dto/` - `class-validator` on input                                 |
| **Domain type**                | `modules/<name>/types/` - internal only                                           |

Web imports wire types from shared; UI-only view models stay in `apps/web`.

### Response envelope

Every response uses the same top-level shape:

```jsonc
{
  "data": {/* resource or array */},
  "pagination": {/* optional, list only */},
  "error": null,
  "state": "success",
  "requestId": "…",
  "timestamp": "…",
}
```

`error.code` aligns with `DomainError.code`. `requestId` matches structured logs and traces.

---

## Concurrency

Field-level updates by default. **Optimistic locking on `issues.status` only** via a `status_version` column - prevents silent status overwrites without blocking unrelated field edits. Conflicts return `409` / `ISSUE_STATUS_CONFLICT`.

---

## Cross-module reads

Compose in `api/` or `use-cases/` - batch-fetch related entities and map, rather than cross-schema Prisma `include` across modules. Comments live inside the **issues** module (never queried independently of an issue).

---

## Module repositories & services

Each domain module (`modules/<name>/`) has a **repository** (data access) and a **service** (domain API for `api/` and `use-cases/`). Repositories are private to the module — not exported from the Nest module.

### Responsibilities

| Layer          | Owns                                                             | Does not own                                        |
| -------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| **Repository** | Prisma pass-through, `DbOptions` / transaction client resolution | Business rules, HTTP context, domain input shaping  |
| **Service**    | Query composition, intent-named methods, domain errors           | Wire types, controllers, cross-module orchestration |

**Repository** methods accept full Prisma `*Args` types and forward them to the client. They are generic so return types flow from the args (including `select`, `include`, `take`, `skip`, `orderBy`):

```ts
async findUnique<T extends OrganizationFindUniqueArgs>(
  args: T,
  dbOptions?: DbOptions
) {
  const client = this.databaseService.resolveClient(dbOptions);
  return client.organization.findUnique(args);
}
```

Do **not** pin return types to the full model (e.g. `Promise<Organization | null>`) — that breaks when callers pass `select` or `include`.

**Service** methods are named for **intent** (`findByEmail`, `listForUser`, `create`) and compose Prisma args internally. Other layers call the service, not the repository:

```ts
async create(input: CreateOrgInput, options?: DbOptions): Promise<Organization> {
  return this.orgRepository.create({ data: { name: input.name } }, options);
}
```

Prisma args must not leak above the service layer. `api/` and `use-cases/` never import `*Args` types or call repositories directly.

### Types

| Kind                        | Where                             | Rule                                                                                           |
| --------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Input**                   | `modules/<name>/<name>.types.ts`  | Define when the service boundary is not 1:1 with Prisma (e.g. `CreateOrgInput`)                |
| **Output**                  | `@generated/prisma`               | Reuse Prisma model types when the shape is unchanged — no parallel `OrgEntity` / `OrgResponse` |
| **Partial / joined shapes** | Call site or `Prisma.*GetPayload` | Only when `select` / `include` produces a different shape                                      |

### Transactions

`DbOptions` (`{ tx?: TransactionClient }`) is always a **separate** parameter from query args — never mixed into a single `options` bag:

```ts
repository.create({ data: { … } }, { tx });
```

Services accept `DbOptions` and pass them through so callers inside `$transaction(…)` can share a transaction client.

### Data-access errors

Keep Prisma error mapping in the **repository** when it is purely a data-access concern (e.g. unique constraint → `null`, not found → `null`). Map to domain errors (`DomainError`, `ValidationError`) in the **service**:

| Concern                                    | Layer      |
| ------------------------------------------ | ---------- |
| `P2002` unique violation → `null`          | Repository |
| `null` → `ValidationError` / `DomainError` | Service    |
| Email already exists, forbidden, etc.      | Service    |

### Multi-model repositories

When one module owns more than one Prisma model (e.g. `auth`: `Session` + `RefreshToken`), use **prefixed** repository methods (`createSession`, `findUniqueRefreshToken`) but the same `*Args` + generic pattern. Services still expose intent-named methods (`findSessionById`, `createRefreshToken`).

### When to add repository logic beyond pass-through

Stay thin by default. Add non-trivial logic in the repository only when it encapsulates data-access behavior that should not be duplicated — error mapping, multi-step queries, or queries you deliberately do not want repeated across service methods. Everything else stays in the service.

### Pagination

Pagination strategy is **per endpoint** — offset and cursor coexist; do not pick one globally.

| Strategy   | Input (`@rivet/shared`)                                 | Module result                                                      | Wire `pagination` fields                    |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| **Offset** | `OffsetPaginationInput` / `OffsetPaginationQuerySchema` | `{ items, totalCount }` (domain)                                   | `page`, `limit`, `totalCount`, `totalPages` |
| **Cursor** | `CursorPaginationInput` / `CursorPaginationQuerySchema` | `{ items, next? }` — decoded keyset position, not an opaque string | `limit`, `nextCursor`                       |

Cursors on the wire are **opaque base64-encoded JSON**. `api/` decodes incoming `cursor` query params and encodes `next` before responding (`Helpers` in `common/helpers/index.ts`). Module services accept `limit` plus an optional decoded cursor position (e.g. `after?: { membershipId, orgName }`), compose keyset `where` clauses, and return the next decoded position — never base64 strings or `ApiPaginationWire`.

Flow:

```
Query DTO (api/<feature>/dto/)  →  decode wire cursor  →  module list input (limit, after?)  →  module returns items + next position  →  api encodes nextCursor + envelope
```

- One DTO per strategy — do not accept `page` and `cursor` on the same endpoint.
- Module services expose intent-named list methods with `limit` and an optional decoded cursor position — not wire cursor strings or `@rivet/shared/api` pagination result types.
- Map module results to the HTTP envelope in `api/` via `toOffsetPaginatedResult` / `toCursorPaginatedResult` (`common/helpers/pagination.ts`). Modules never return `ApiPaginationWire`.

---

## Deferred infrastructure

Matched to product scale, not maximized for show:

- Kubernetes, multi-region, microservices split
- Subdomain-per-org routing (shared domain + org switcher instead)
- Real-time WebSockets for live boards (v1.1+)
- OAuth / social login
