# ADR-0004: Async issue CSV export

## Status

Accepted

## Date

2026-08-14

## Context

Issue CSV export is gated by plan (`PLAN_LIMITS.exportsPerMonth`: Free 10, Pro 50, Team unlimited). `GET /issues` is cursor-paginated (max 100). Result size is unbounded.

Web (Vercel) and API (Render) are cross-origin. Jobs must set tenant CLS before module/DB work ([ADR-0002](./0002-application-layer-tenant-isolation.md)). Do not hold a DB transaction across queue enqueue or file I/O.

## Decision

Every issue CSV export is a BullMQ job.

### Lifecycle

1. `POST` with the current list filters (`projectId`, optional `status`, `priority`, `assigneeId`). Persist that snapshot on the job. Retries reuse it.
2. `OrgMemberGuard`. Check org plan quota, insert `ExportJob`, charge quota, enqueue BullMQ after commit. Return **202** + job id.
3. Dedupe with a required client `Idempotency-Key`. Unique on `(organizationId, requestedById, idempotencyKey)`. Replay returns the existing job and does not re-charge quota; filters are snapshotted on first create and are not part of the key. Terminal `FAILED` (after BullMQ attempts) is final for that job: no re-enqueue, no retry endpoint, no quota refund. A new export needs a new key and charges again.
4. Worker sets CLS from the job payload (`orgId`, `userId`), then cursor-streams rows from `modules/issue`. Encode CSV incrementally; upload via the S3 API. No Prisma transaction around the upload. Retryable errors leave the job `RUNNING` until the last BullMQ attempt (or an unrecoverable/cap error); only then is status set to `FAILED`.
5. Client polls `queued` | `running` | `succeeded` | `failed`. `failed` means terminal. Download is a short-lived signed GET. Object + job expire. Requester only.

Quota is org-wide (the subscription), not per user. Create is `MEMBER+` (VIEWER cannot). Any org member can poll a job they requested. Archived projects may be exported (historical snapshot); archive blocks mutating writes, not CSV.

Columns are a subset of issue fields. Do not select a wider Prisma shape than the issue DTO.

### Layering

Export is multi-domain. It does not live in `modules/issue`.

| Piece                          | Where                                       |
| ------------------------------ | ------------------------------------------- |
| HTTP, quota, enqueue, sign GET | `api/export`                                |
| Row source                     | `modules/issue` cursor iterator             |
| Upload                         | worker via storage adapter (`jobs/exports`) |

`modules/issue` does not import billing, BullMQ, or the S3 client.

### CSV (v1)

RFC 4180, UTF-8, no BOM. Prefix cells that start with `=`, `+`, `-`, or `@`.

| Column        | Source                   |
| ------------- | ------------------------ |
| `key`         | `{project.key}-{number}` |
| `title`       | issue title              |
| `description` | issue description        |
| `status`      | `IssueStatus`            |
| `priority`    | `IssuePriority`          |
| `assignee`    | display name or empty    |
| `project`     | project name             |
| `created_at`  | ISO-8601 UTC             |
| `updated_at`  | ISO-8601 UTC             |

Point-in-time snapshot of the filter, not a live board.

### Storage

S3 API (endpoint + credentials). Nest/BullMQ on Render talks to object storage over the S3 API (not provider-specific bindings).

| Env        | Bucket          |
| ---------- | --------------- |
| Production | Backblaze B2    |
| Local / CI | MinIO in docker |

Amazon S3 was not chosen for production: same S3 API, but egress-priced, no lasting free tier, and we are not on AWS.

Job stores the object key. Signed GET, short TTL, `Content-Disposition: attachment`. Bucket CORS allows the web origin.

### Out of scope (v1)

- Email as the delivery path
- Sheets / customer bucket / webhooks
- Column picker
- Export across all projects (`GET /issues` is project-scoped)
- Quota refund on failure

## Alternatives considered

| Option                                | Why not                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| Client-side CSV from list JSON        | Quota unenforceable; client can miss pages                       |
| Sync HTTP download (buffer or stream) | API worker lifetime = result size; no durable quota/retry record |
| Hybrid: sync under N rows             | Two paths; quota still needs a job row                           |

## Consequences

### Positive

- HTTP returns immediately
- Quota, retry, and expiry share one job row
- Bounded memory (cursor → stream → object storage)
- Worker uses the same CLS path as other jobs
- Provider swap is endpoint + credentials

### Negative

- Client must poll
- Job table, B2/MinIO; prod object TTL via B2 bucket lifecycle (ops), not an app sweeper
- Snapshot lags the board
- Failed jobs still consume quota in v1
- One member can exhaust the org monthly quota

### Follow-ups

- [x] `ExportJob` model
- [x] `runWithTenantContext` for the worker ([ADR-0002](./0002-application-layer-tenant-isolation.md))
- [x] B2 (prod) + MinIO (`docker-compose`) + S3 client / signed URL via env
- [x] Quota on enqueue; `429` when over `PLAN_LIMITS`
- [x] Idempotency key on create
- [x] Wire types in `@rivet/shared`
- [x] Exports section in `docs/ARCHITECTURE.md`
- [x] CSV injection tests; worker max-row / max-duration cap

## References

- `[docs/ARCHITECTURE.md](../ARCHITECTURE.md)` — jobs/CLS, transactions, pagination
- [ADR-0001](./0001-dual-token-auth-with-httponly-refresh-cookie.md)
- [ADR-0002](./0002-application-layer-tenant-isolation.md)
- `packages/shared/src/api/issue/list-issues.query.ts`
- `apps/web/src/components/billing/billing-plan-data.ts` (`exportsPerMonth`)
- [B2 pricing](https://www.backblaze.com/cloud-storage/pricing)
