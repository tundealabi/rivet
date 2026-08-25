# ADR-0002: Application-layer tenant isolation with CLS and Prisma extension

## Status

Accepted

## Date

2026-08-06

## Context

Every org-owned row on the tenant allowlist (see `apps/api/src/database/tenant-scoped.models.ts`) must be scoped by `organizationId`. The access JWT only identifies the user; org context comes from the `x-org-id` header on tenant routes.

The first project endpoints did the right things manually: read the header, check membership, pass `organizationId` into module queries. That already broke down - `update` scoped by `id` only while `findById` included org. Copy-pasting membership checks into every `api/` service would get worse as tenant models and async entry points grew.

We looked at Postgres RLS, scoped-repository-only approaches, and Prisma extensions. RLS is in `ARCHITECTURE.md` as a long-term option, but this is a solo backend on one Nest service, all access goes through Prisma, and there is no raw SQL or second consumer on the database yet. RLS adds real ops work (`set_config`, pooling, policies) without solving a problem we have today.

## Decision

Three pieces, each doing one job:

| Layer             | What                                                               | Where                                                          |
| ----------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Membership**    | Validate `x-org-id`, confirm user belongs to org, reject otherwise | `OrgMemberGuard` on tenant controllers (after JWT auth)        |
| **Context**       | Hold `orgId`, `userId`, `orgRole` for the request                  | `nestjs-cls` via `TenantContextService`                        |
| **Query scoping** | Merge `organizationId` into Prisma reads/writes on tenant models   | `$extends` in `DatabaseService` (`tenant-prisma.extension.ts`) |

`OrgMemberGuard` is **opt-in** on routes that need an active org via `x-org-id`. Controllers/handlers without that decorator are the skip set (auth, org list/create, invitations, webhooks, probes, etc.). Do not maintain a separate skip list in docs — `@UseGuards(OrgMemberGuard)` in `apps/api/src/api/**/*.controller.ts` is the source of truth.

### OrgMemberGuard

Runs on tenant controllers that declare it (e.g. `ProjectController`). Parses `x-org-id` (missing/non-UUID → `ValidationError` → **400**), calls `OrgMemberService.findByOrgAndUser`, throws **403** if not a member, then sets CLS. Membership logic lives here once; `api/` services do not repeat it.

### CLS

`TenantContextService` wraps `ClsService` so `api/` can read `orgId` without threading it through every method. Modules stay HTTP-unaware - they receive explicit inputs from `api/` or rely on the Prisma extension reading CLS at query time.

Async entry points (BullMQ, Stripe webhooks) call `TenantContextService.runWithTenantContext(context, fn)` before module/DB work — same Prisma extension, isolated CLS store (does not inherit the HTTP request). `orgId` is required for scoping; `userId` / `orgRole` are optional and only set when that entry point has them (HTTP `OrgMemberGuard` always sets all three). See `apps/api/src/common/services/tenant-context.service.ts`.

### Prisma extension

`createTenantScopedClient()` wraps the base client. Models on the allowlist (see `apps/api/src/database/tenant-scoped.models.ts`) get `organizationId` merged from CLS into `where` / write `data` (including updates — blocks re-homing a row to another org). Missing CLS on a tenant operation throws - that is a bug, not a silent cross-tenant read.

Non-tenant models (`User`, `Session`, `OrganizationMember`, etc.) are not touched. Register/create-org bootstrap never hits tenant models before an org exists.

Repositories still use thin generic adapters. The extended client is cast to `PlainPrismaClient` for TypeScript only; at runtime repos get the scoped client.

### Postgres RLS

**Not adopted.** Revisit when there is a real reason: compliance review, a second service or BI tool on prod Postgres, or repeated app-layer misses in production. Until then, app-layer enforcement plus tests is enough.

### Tests

`test/tenant-isolation.e2e-spec.ts` - org B cannot GET or PATCH org A's project (404). Same file checks module `findById` / `update` with org B in CLS but no `organizationId` in the query args; extension returns null. Also covers cross-org scoping inside `TenantContextService.runWithTenantContext` (async entry helper used by BullMQ and Stripe).

## Alternatives considered

| Option                                 | Why not                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| Keep passing `organizationId` manually | Already inconsistent; does not scale with more models                                        |
| Postgres RLS now                       | Ops overhead; single service, no untrusted DB access path                                    |
| Guard only, no extension               | Every query must remember org; extension catches omissions (e.g. update by bare `id`)        |
| Extension only, no guard               | Scopes data but does not check membership                                                    |
| Org/role in access JWT                 | Couples auth to tenant context; org switch is a header change, not a re-login - see ADR-0001 |
| DB-per-tenant                          | Wrong shape for many small orgs                                                              |

## Consequences

### Positive

- Membership check in one place
- Less boilerplate in `api/` as tenant routes grow
- Prisma extension catches forgotten org filters on allowlisted models
- Same module code for HTTP, jobs, and webhooks once CLS is set upstream

### Negative

- Org context is implicit after the guard - you need to know it comes from CLS
- `$queryRaw` bypasses the extension

### Follow-ups

- [x] Add models to `TENANT_SCOPED_MODELS` as issues land
- [x] `TenantContextService.runWithTenantContext(context, fn)` for BullMQ and Stripe webhooks
- [x] `@RequireOrgRole` — min-role guard on tenant routes that need a floor above any-member (org-level only)

## References

- `[docs/ARCHITECTURE.md](../ARCHITECTURE.md)` - Tenant isolation and authorization
- `[apps/api/src/common/guards/org-member.guard.ts](../../apps/api/src/common/guards/org-member.guard.ts)`
- `[apps/api/src/common/guards/org-role.guard.ts](../../apps/api/src/common/guards/org-role.guard.ts)`
- `[apps/api/src/common/services/tenant-context.service.ts](../../apps/api/src/common/services/tenant-context.service.ts)`
- `[apps/api/src/database/tenant-prisma.extension.ts](../../apps/api/src/database/tenant-prisma.extension.ts)`
- `[apps/api/src/database/tenant-scoped.models.ts](../../apps/api/src/database/tenant-scoped.models.ts)`
- `[apps/api/test/tenant-isolation.e2e-spec.ts](../../apps/api/test/tenant-isolation.e2e-spec.ts)`
- `[apps/api/test/rbac.e2e-spec.ts](../../apps/api/test/rbac.e2e-spec.ts)`
- [ADR-0001](./0001-dual-token-auth-with-httponly-refresh-cookie.md)
