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

`api/` is organized by **feature** (`auth`, `org`, `projects`, `issues`, `exports`, `billing`, `webhooks`), not by actor type - org members differ by **role**, not by separate app surfaces.

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
3. **Data scoping:** Prisma Client extension on allowlisted models (see `apps/api/src/database/tenant-scoped.models.ts`) merges `organizationId` from CLS into reads/writes. Throws if tenant context is missing.

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

## Authorization (org roles)

Roles are a total order (`VIEWER < MEMBER < ADMIN < OWNER`). `OrgMemberGuard` stores `orgRole` in CLS; `@RequireOrgRole(min)` + `OrgRoleGuard` reject below that rank with 403. Routes without the decorator stay any-member (reads). Role is not in the access JWT. No project-level roles.

Shipped mutating floors:

| Min role | Routes                                                                    |
| -------- | ------------------------------------------------------------------------- |
| MEMBER+  | Create project, create/update/delete issue, create export, create comment |
| ADMIN+   | Update / archive / unarchive / delete project; org-side invites           |
| OWNER    | `GET /billing`, `POST /billing/checkout`                                  |

Owner is distinct from admin on billing only (delete-org still deferred). Members may edit any issue. Comment edit/delete are `MEMBER+` at the route, then **author or ADMIN+** in the service.

**Verification:** `apps/api/test/rbac.e2e-spec.ts`

---

## Database transactions

Use transactions when multiple writes must succeed or fail together (register-with-org, invite accept, Stripe webhook idempotency + plan update). Do **not** wrap full HTTP handlers or hold transactions across Stripe, queue enqueue, or file I/O.

```
databaseService.client.$transaction(async (tx) => { /* DB work via { tx } */ })
// enqueue / external calls after commit
```

Tenant-scoped module calls rely on CLS (set by guard or async entry wrapper) plus the Prisma extension — no separate `TenantPrismaService` until/unless RLS is adopted.

---

## Invites

Org invites are copy-link only — **no mailer**. The raw token is returned on create and resend; list endpoints never include it. The API stores `HashService.digest(token)` (same as refresh tokens) and looks up by hash.

`OrganizationInvite` is **not** on `TENANT_SCOPED_MODELS` (same as `OrganizationMember`). Org-side queries pass `organizationId` from CLS explicitly.

Two controllers in `api/organization/` so guards do not fight:

- `OrganizationController` — list orgs, create org after signup, org-scoped invites (`x-org-id` + `ADMIN+`)
- `InvitationsController` — invitee routes (`GET /invitations`, accept, decline, optional preview). **JWT only**; no `x-org-id`, no org-role guard

Accept is one service method and two HTTP entries (`POST /invitations/:id/accept` and `POST /invitations/accept` `{ token }`). Both require auth and email match. Membership + consume run in one transaction; seat check (`PLAN_LIMITS.members`, active members + active invites) is inside that transaction. Preview by token may be unauthenticated; invalid/expired tokens return the same generic not-found.

Create org after signup is `POST /organizations` `{ name }` — JWT, no org guard — `OrgService.create` + `OWNER` membership in one transaction. Register still creates the first org.

**Verification:** `apps/api/test/org-invites.e2e-spec.ts`, `invitations.e2e-spec.ts`, `create-organization.e2e-spec.ts`

---

## Authentication

Short-lived **access JWT** (Bearer, ~15 min) + long-lived **refresh token** (`httpOnly` cookie, ~7 days). Full rationale: [ADR-0001](./adr/0001-dual-token-auth-with-httponly-refresh-cookie.md).

| Token      | Storage               | Notes                                                                                                                           |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Access JWT | Client (localStorage) | Claims: `sub` (user), `sid` (session). Sent as `Authorization: Bearer`. Wire schemas document `accessToken` only.               |
| Refresh    | `httpOnly` cookie     | Opaque token; hash in `refresh_tokens`; rotated on refresh; revoked on logout. `POST /auth/refresh` and logout read the cookie. |

**Deployment:** Web (Vercel) and API (Render) are cross-origin. Refresh cookie uses `SameSite=None; Secure` in production. CORS allows credentialed requests from allowlisted frontend origins.

**Org context:** Tenant-scoped routes require the **`x-org-id` header**. The API validates the authenticated user belongs to that org (membership check) before tenant logic runs. Org switch updates client state and subsequent headers — no new access token.

**Guards:** `AuthUserJwtGuard` is a global `APP_GUARD`. Opt out with `@ApiPublic()` (auth routes, invitation preview, health/ready, metrics, Stripe webhooks). Forgetting `@ApiPublic()` leaves a route authenticated by default. Org membership/role guards stay opt-in on tenant controllers. Access JWT validation is signature/claims only — logout does not kill in-flight access tokens until TTL; instant revoke would need a `sid` denylist (e.g. Redis), not a session row read on every request.

**Client contract (target):** Login/refresh/logout use `fetch` with `credentials: 'include'`. Access token in localStorage; refresh token cookie-only (never in JS). Today login/refresh service results may still include `refreshToken`, and the web app stores it in localStorage — migrate to the cookie path.

**Not in v1:** OAuth, MFA, session admin UI, BFF for token storage.

---

## Errors

Single `DomainError` class with `kind` (`NOT_FOUND` | `RULE_VIOLATION` | `CONFLICT` | `FORBIDDEN` | `INVALID_CREDENTIALS` | `TOO_MANY_REQUESTS`) and machine-readable `code`. Domain layers throw; a global exception filter maps to HTTP status and the response envelope. Stripe webhooks catch `DomainError` explicitly and return `200` where retries would be harmful.

---

## API contract (shared package)

| Shape                          | Location                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Wire type** (`IssueWire`, …) | `@rivet/shared` — Zod schemas / inferred types for JSON inside `data`                               |
| **DTO**                        | `api/<feature>/dto/` — `nestjs-zod` `createZodDto` wrapping the shared schemas (request + response) |
| **Domain type**                | `modules/<name>/types/` — internal only                                                             |

Web imports wire types from shared; UI-only view models stay in `apps/web`. Swagger is driven from the Nest DTOs / decorators, not a separate `entities/` layer per feature.

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

Field-level (partial) updates by default. High-risk issue fields use conditional writes without extra version columns on `Issue`:

- **`status` / `assigneeId`** — expected-value CAS (`expectedStatus`, `expectedAssigneeId`)
- **`description`** — expected content hash (`descriptionHash` on read, `expectedDescriptionHash` on write; hash is derived, not stored)
- **Other fields** (e.g. `title`, `priority`) — last-write-wins

Status changes also run an allowed **transition graph** check (rule violation, not conflict) - `ISSUE_STATUS_TRANSITIONS` / `isIssueStatusTransitionAllowed` in `@rivet/shared/enums`. Stale high-risk writes return `409` / `ISSUE_CONFLICT` with current server state for client resolution. Illegal transitions return `422` / `ISSUE_STATUS_TRANSITION`. Successful field writes append `IssueActivity` in the same transaction (feed / audit / conflict context).

Full rationale: [ADR-0003](./adr/0003-issue-field-concurrency.md).

---

## Issue comments

Comments live in the **issues** module and are never queried independently of an issue. Nested routes only (`/issues/:id/comments`); `GET /issues/:id` does not embed comments.

Create is `MEMBER+`. List is any org member (including viewer). Edit/delete: `MEMBER+` at the route, then author or `ADMIN+` in the service. Create is burst-limited per author (`COMMENT_RATE_LIMIT_MAX` in `api/issue`, 10s window). Archived projects reject comment writes (`409` / `PROJECT_ARCHIVED`).

**Verification:** `apps/api/test/issue-comments.e2e-spec.ts`, comment cases in `rbac.e2e-spec.ts` and `tenant-isolation.e2e-spec.ts`.

`GET /issues/:id/activity` lists append-only field-change rows (cursor, newest first). Any org member can read. Delete issue is `MEMBER+` and is refused on archived projects (`409` / `PROJECT_ARCHIVED`). Delete project is `ADMIN+` and cascades issues, comments, activity, and export jobs.

**Verification:** `apps/api/test/issue-activity.e2e-spec.ts`; delete cases in `rbac.e2e-spec.ts` and `tenant-isolation.e2e-spec.ts`.

---

## Issue CSV export

Full rationale: [ADR-0004](./adr/0004-async-issue-csv-export.md).

Always-async: `POST /exports` returns **202** immediately; the client polls `GET /exports/:id`. The API never streams the CSV. When the job has succeeded and the object is unexpired, `downloadUrl` is a short-lived signed GET (S3 API: MinIO locally, Backblaze B2 in production).

Export is multi-domain. `modules/issue` is a row source only.

| Piece                          | Where                                       |
| ------------------------------ | ------------------------------------------- |
| HTTP, quota, enqueue, sign GET | `api/export`                                |
| Row source                     | `modules/issue` cursor iterator             |
| Upload                         | worker via storage adapter (`jobs/exports`) |

Quota is **org-wide**, charged **on insert** (`PLAN_LIMITS.exportsPerMonth`, UTC calendar month). `Idempotency-Key` is required; unique per org + requester + key. Replay does not insert or re-charge; filters are not part of the key (first snapshot wins). Terminal `FAILED` is final for that job (no retry endpoint, no refund); a new export needs a new key and consumes another slot. The worker only writes `FAILED` on the last BullMQ attempt or an unrecoverable/cap error — mid-retry failures stay `RUNNING`. Download is requester-only. BullMQ workers set CLS before module/DB work — same path as other async entry points.

GET omits `downloadUrl` after `expiresAt` (24h). Production object cleanup is B2 bucket lifecycle (ops); no in-app sweeper. `ExportJob` rows are retained. Archived projects may be exported (historical snapshot); archive only blocks mutating issue/project writes.

Do not hold a DB transaction across enqueue or file I/O.

Web poll + download UI lives in `apps/web` (separate from this API surface); no export routes are wired there yet.

**Verification:** `apps/api/test/export.e2e-spec.ts` — cross-org and non-requester GET 404; missing key 400; idempotent POST; quota 429; viewer cannot create; worker CSV quoting and formula prefix.

---

## Billing

Subscribe-once Stripe Checkout for **PRO monthly**. The signed webhook is the only writer of `planTier` — the Checkout success URL is not trusted. TEAM is a fixture/unlimited tier, not a Checkout SKU. Portal, cancel, upgrade, and billing-period quota are deferred.

`GET /billing` and `POST /billing/checkout` are **OWNER-only** (`@RequireOrgRole(OWNER)`). Checkout is refused unless `planTier === FREE` (`409` / `BILLING_ALREADY_SUBSCRIBED`). `GET /billing` returns `{ planTier }` only — no Stripe ids on the wire.

Stripe SDK lives in `src/stripe/` (infrastructure, like `storage/`). `api/billing` creates/reuses the Stripe customer and Checkout session **outside** any DB transaction. `api/webhooks` verifies `Stripe-Signature` on the raw body (no JWT, no `x-org-id`).

Webhook path:

```
verify signature on raw body
resolve org by stripeCustomerId   // Organization / StripeEvent off TENANT_SCOPED_MODELS
runWithTenantContext({ orgId }, () =>
  $transaction: insert StripeEvent (id = event.id) + update planTier / subscription id
)
```

Unknown customer, unhandled `type`, or non-PRO price → **200** (do not retry). Bad signature → **400**. Duplicate `event.id` → **200**, no second plan update. `customer.subscription.deleted` sets `FREE` and clears `stripeSubscriptionId` (keeps `stripeCustomerId`). Export quota stays **UTC calendar month**.

**Verification:** `apps/api/test/billing.e2e-spec.ts`, `webhooks.e2e-spec.ts`

---

## Plan limits

`PLAN_LIMITS` gates CSV exports/month, members (active members + active invites), and projects (including archived). Exceed → `429` with a dedicated code. Global HTTP `ThrottlerGuard` (3/s, 20/10s, 100/min) is not plan-tiered; Stripe webhooks skip it.

---

## Observability

API process only (HTTP + the BullMQ worker in the same Nest app). No browser RUM. Logs, metrics, and traces are complementary — same request, different questions:

| Signal      | Question                               | Rivet example                                 |
| ----------- | -------------------------------------- | --------------------------------------------- |
| **Logs**    | What happened in this event?           | `export_failed` `{ exportJobId, orgId, err }` |
| **Metrics** | How often / how bad is it _right now_? | `export_jobs_total{status="failed"}`          |
| **Traces**  | Where did _this_ request spend time?   | `POST /exports` → worker → MinIO              |

`requestId` is the same id on the API envelope, structured JSON logs, and span attributes. Pino (`nestjs-pino`) is the app logger; pretty-print when `NODE_ENV !== production`. Tokens, cookies, passwords, and raw Stripe bodies are not logged.

Probes are unversioned, **no** `/api` prefix, **no** JWT, **no** envelope, skip throttle (same idea as Stripe webhooks). The Nest hello route is gone.

| Method | Path       | Meaning                                                                              |
| ------ | ---------- | ------------------------------------------------------------------------------------ |
| `GET`  | `/health`  | Liveness: process is up. No dependency checks.                                       |
| `GET`  | `/ready`   | Readiness: Postgres **and** Redis respond. MinIO is **not** on ready (only exports). |
| `GET`  | `/metrics` | Prometheus text (`prom-client`). Pull scrape is the source of truth.                 |

HTTP middleware records `http_requests_total` / `http_request_duration_seconds` with **route templates** (probes skipped, including the `http_request` log so scrapes do not flood stdout). Business counters sit at existing call sites: `export_jobs_total`, `stripe_webhooks_total{outcome}`, `quota_rejections_total{kind}`.

OpenTelemetry SDK starts **before** Nest (`src/observability/`). Service name is `rivet-api`. Auto-instrument HTTP, `pg`/Prisma, Redis, AWS SDK (MinIO). Manual `export.process` span; W3C `traceparent` on the BullMQ payload so the worker links to `POST /exports`. OTLP HTTP to `OTEL_EXPORTER_OTLP_ENDPOINT` (local Tempo `localhost:4318`; Grafana Cloud in production via `OTEL_EXPORTER_OTLP_HEADERS`). Soft-fail if the backend is down. Sampling is always-on locally; production sets `OTEL_TRACES_SAMPLER`. Jest sets `OTEL_SDK_DISABLED`. Unit/e2e do **not** require Grafana/Prometheus/Tempo.

Local Compose adds Prometheus (scrapes `host.docker.internal:8090/metrics`), Tempo (OTLP `4318`), and Grafana (`http://localhost:3001`). Production **remote_writes** the same `prom-client` registry to Grafana Cloud when `OTEL_METRICS_REMOTE_WRITE_URL` is set (`GET /metrics` can require `OTEL_METRICS_BEARER_TOKEN`). JSON logs stay on **stdout** (Render). **No Loki.** One provisioned dashboard (HTTP + exports + webhooks + quota). Alert rules live in Grafana, not Nest (no Slack/PagerDuty):

- export failures — `increase(export_jobs_total{status="failed"}[5m]) > 0`
- webhook errors — `increase(stripe_webhooks_total{outcome="error"}[5m]) > 0` (`bad_signature` is noise, not this alert)
- quota exhaustion — `increase(quota_rejections_total[5m]) > 0` (product signal; severity low)

**Verification:** `apps/api/test/app.e2e-spec.ts` (probes + `/metrics`).

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
