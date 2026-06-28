# Rivet — Architecture

Architecture decisions for the Rivet codebase. Living document — update as implementation reveals new constraints.

---

## Stack

- **API:** NestJS, Prisma, PostgreSQL with Row-Level Security (RLS)
- **Web:** Vite, React, TanStack Query
- **Shared:** `@rivet/shared` — wire types, API envelope, Zod/constants (framework-agnostic)
- **Jobs:** BullMQ + Redis
- **Billing:** Stripe (test mode in development)
- **Observability:** structured logs, Prometheus/Grafana, OpenTelemetry traces, alerts

PostgreSQL was chosen over document stores because **RLS** enforces tenant isolation at the database layer, not only in application code. Prisma was chosen for transaction ergonomics, schema-first workflow, and readable SQL when debugging RLS.

---

## Monorepo layout

pnpm workspaces (not Nest's built-in monorepo mode):

```
rivet/
├── apps/
│   ├── api/              @rivet/api — NestJS
│   └── web/              @rivet/web — Vite + React
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
PostgreSQL (RLS)
```

`api/` is organized by **feature** (`auth`, `org`, `projects`, `issues`, `billing`, `webhooks`), not by actor type — org members differ by **role**, not by separate app surfaces.

### Module rules

- **`modules/**` never imports another module.** Cross-domain work goes in `api/` or `use-cases/`.
- **Repositories are private** to their module's service — not exported from the Nest module.
- **`org_id` is mandatory** on every tenant-scoped service/repository method — defense in depth alongside RLS.

| Logic                         | Lives in                   |
| ----------------------------- | -------------------------- |
| Single-domain rule            | `modules/<name>/services/` |
| Multi-domain, one HTTP entry  | `api/<feature>/services/`  |
| Multi-domain, 2+ entry points | `use-cases/<name>/`        |

Promote logic into `use-cases/` only when a **second real call site** needs the same flow — never preemptively.

---

## Tenant isolation (RLS)

Two layers:

1. **Application:** JWT carries `activeOrgId`; guard validates membership; every query helper requires `org_id`.
2. **Database:** RLS on tenant tables — `org_id = current_setting('app.current_org')`.

Every tenant-scoped DB operation runs through **`TenantPrismaService.run(orgId, fn)`**:

1. Open a short `$transaction` (not the full HTTP request).
2. `set_config('app.current_org', orgId, true)` (transaction-local).
3. Run callback with transaction client `tx`.
4. Commit.

HTTP handlers, Stripe webhooks, and BullMQ workers use the same runner. **Bootstrap paths** (org creation before tenant context exists) use a separate explicit method — narrow and rare.

An automated **cross-tenant isolation test** verifies org A's session cannot read org B's data, even when a query deliberately omits `org_id`.

---

## Database transactions

Use transactions when multiple writes must succeed or fail together (register-with-org, invite accept, Stripe webhook idempotency + plan update). Do **not** wrap full HTTP handlers or hold transactions across Stripe, queue enqueue, or file I/O.

```
tenantPrisma.run(orgId, async (tx) => { /* DB work */ })
// enqueue / external calls after commit
```

---

## Authentication

Short-lived **access JWT** (Bearer, ~15–30 min) + long-lived **refresh token** (httpOnly cookie, ~7–30 days).

| Token      | Storage         | Claims / notes                                                               |
| ---------- | --------------- | ---------------------------------------------------------------------------- |
| Access JWT | Client memory   | `sub`, `activeOrgId`, `role`                                                 |
| Refresh    | httpOnly cookie | Hash stored in `refresh_tokens` table; rotated on refresh; revoked on logout |

**Org switcher:** `POST /auth/switch-org` issues a new access JWT with updated `activeOrgId` and `role`; refresh session unchanged.

**Not in v1:** OAuth, MFA, session admin UI.

---

## Errors

Single `DomainError` class with `kind` (`NOT_FOUND` | `RULE_VIOLATION` | `CONFLICT`) and machine-readable `code`. Domain layers throw; a global exception filter maps to HTTP status and the response envelope. Stripe webhooks catch `DomainError` explicitly and return `200` where retries would be harmful.

---

## API contract (shared package)

| Shape                          | Location                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------- |
| **Wire type** (`IssueWire`, …) | `@rivet/shared` — JSON inside `data`                                              |
| **Entity**                     | `api/<feature>/entities/` — `implements IssueWire` + `@ApiProperty()` for Swagger |
| **DTO**                        | `api/<feature>/dto/` — `class-validator` on input                                 |
| **Domain type**                | `modules/<name>/types/` — internal only                                           |

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

Field-level updates by default. **Optimistic locking on `issues.status` only** via a `status_version` column — prevents silent status overwrites without blocking unrelated field edits. Conflicts return `409` / `ISSUE_STATUS_CONFLICT`.

---

## Cross-module reads

Compose in `api/` or `use-cases/` — batch-fetch related entities and map, rather than cross-schema Prisma `include` across modules. Comments live inside the **issues** module (never queried independently of an issue).

---

## Repository abstraction

Interface + Prisma implementation only for modules with branching logic worth unit testing (`issues`, `billing`). Thin CRUD modules use Prisma directly until complexity warrants promotion.

---

## Deferred infrastructure

Matched to product scale, not maximized for show:

- Kubernetes, multi-region, microservices split
- Subdomain-per-org routing (shared domain + org switcher instead)
- Real-time WebSockets for live boards (v1.1+)
- OAuth / social login
