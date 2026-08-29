# ADR-0003: Issue field concurrency via expected-value CAS and description hash

## Status

Accepted

## Date

2026-08-12

## Context

Multiple users can update the same issue at once; sometimes different fields, sometimes the same field. Blind last-write-wins on every field causes silent loss on workflow and prose. Row-level optimistic locking causes false conflicts when users edit unrelated fields.

We need a policy that:

- Lets unrelated field edits succeed without colliding
- Detects lost updates on high-risk fields
- Avoids pessimistic locks (blocking is a poor fit for a web issue tracker)
- Avoids CRDTs / collaborative-editing infra (overkill for this product)
- Avoids event sourcing / CQRS just to get concurrency or an activity feed
- Minimizes new Issue columns for concurrency tokens

High-risk vs low-risk is a product judgment: cost of a silent overwrite, reversibility, and workflow side effects not the Prisma type.

## Decision

### Field policy

| Fields                 | Concurrency                                  |
| ---------------------- | -------------------------------------------- |
| `status`, `assigneeId` | Expected-value compare-and-swap (CAS)        |
| `description`          | Expected content hash (computed, not stored) |
| `title`, `priority`    | Last-write-wins on partial PATCH             |

Updates remain **field-level / partial**: only fields present in the request are written. Low-risk fields do not participate in version/CAS checks, so they do not false-conflict with high-risk edits.

### Status & assignee - expected-value CAS

When the PATCH includes `status` or `assigneeId`, the client must send the value it believes is current (`expectedStatus`, `expectedAssigneeId`, including `null` for unassigned). Missing `expected*` → request validation error (`400`). Same for `description` / `expectedDescriptionHash`.

The update succeeds only if the row’s current value matches. Mismatch → conflict (`409`), not a silent overwrite.

No `statusVersion` / `assigneeVersion` columns.

### Description - expected hash, derived on read/write

No `descriptionVersion` or stored hash column.

Algorithm: unkeyed SHA-256 hex over the exact UTF-8 bytes of the stored `description` (64-char lowercase hex). Implementation: `HashService.fingerprint` in `apps/api`; wire shape: `IssueDescriptionHashSchema` in `@rivet/shared`.

- **Read:** API fingerprints the current `description` and returns `descriptionHash` on the issue payload.
- **Write:** Client sends `expectedDescriptionHash` from its last read plus the new `description`.
- **Server:** Re-fingerprint current DB `description`, compare to `expectedDescriptionHash`. Match → update. Mismatch → `409` with current description and a fresh hash.

### Domain rules after CAS

High-risk PATCH always includes matching `expected*` (see above). Precedence: expected-value / hash mismatch → `409` / `ISSUE_CONFLICT` first (and instead of evaluating domain rules against the proposed write). Only after expected values match does the server run:

- Status transition graph (`current → proposed`) → illegal → `422` / `ISSUE_STATUS_TRANSITION`. The graph includes identity edges (`TODO → TODO`, etc.) so a matching retry that sets the same status is allowed, not `422`.
- Assignee must be an org member → not a member → `422` / `ASSIGNEE_NOT_ORG_MEMBER`

So a stale expected plus an illegal transition or a non-member assignee still returns `409`, not `422`. Domain rules alone do not prevent lost updates; CAS alone does not enforce workflow or membership. Living summary: [ARCHITECTURE — Concurrency](../ARCHITECTURE.md#concurrency).

### Conflict handling (clients)

On high-risk field conflicts, `409` / `ISSUE_CONFLICT` returns `error.details.conflicts` for **stale high-risk fields in this PATCH only** (wire: `IssueConflictDetailsSchema` in `@rivet/shared`):

- `status` → `{ current }`
- `assigneeId` → `{ current }`
- `description` → `{ current, descriptionHash }` (fresh fingerprint)

No actor, timestamp, or full issue DTO on the conflict payload. Clients can show merge / keep-mine / take-theirs / cancel from those field values; who/when comes from `GET /issues/:id/activity`.

### Issue activity (not event sourcing)

Successful **field-level updates** (PATCH) insert append-only `IssueActivity` row(s) in the same transaction (`IssueActivityField`: assignee / description / priority / status / title). That is a change log (who changed a field and when), not a full issue timeline and not CQRS/event-sourced projections. The Issue row remains the source of truth for current values. Conflict resolution values stay on the `409` payload above.

**Create does not write `IssueActivity`.** There is no `CREATED` activity field. Birth time is `Issue.createdAt` on the issue payload. A brand-new issue may have an empty activity list until the first field change.

### Explicitly out of scope

- Pessimistic locking
- Row/document version on the whole issue
- CRDTs / OT for description
- Event sourcing or CQRS as the concurrency model
- Create-time `IssueActivity` / a `CREATED` activity field (see Issue activity above)

## Alternatives considered

| Option                                                    | Why not                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Last-write-wins on all fields                             | Silent loss on status, assignee, and description                       |
| Pessimistic locking                                       | Blocks other editors; poor fit for multi-tab / multi-user web UX       |
| Row/document optimistic version                           | False conflicts when users edit unrelated fields                       |
| Per-field version columns for status/assignee/description | Works, but adds schema we can avoid with expected value / derived hash |
| Expected full-text CAS for description                    | Large payloads; normalization/encoding footguns                        |
| Shared version across all high-risk fields                | Reintroduces false conflicts between status, assignee, and description |

## Consequences

### Positive

- Unrelated field edits do not block each other
- High-risk lost updates are detectable without new concurrency columns on `Issue`
- Status workflow invariants are enforced independently of races
- Activity log supports feed, audit, and conflict context in one mechanism
- Client conflict UX has a clear server contract (`409` + current state)

### Negative

- PATCH for high-risk fields is more verbose (`expected*` / `expectedDescriptionHash` required)
- Clients must treat high-risk and low-risk fields differently
- Hash algorithm and byte-exact hashing must stay stable across API versions
- Transition graph is a product surface that must be documented and tested
- `IssueActivity` is additional schema and write amplification (acceptable trade for feed/audit)

### Follow-ups

- [x] Define the status transition graph for `BACKLOG` / `TODO` / `IN_PROGRESS` / `IN_REVIEW` / `DONE` / `CANCELLED`
- [x] Specify request/response fields (`expectedStatus`, `expectedAssigneeId`, `descriptionHash`, `expectedDescriptionHash`) in shared API types
- [x] Define conflict error codes/payloads vs transition rule-violation errors
- [x] Add `IssueActivity` model and same-transaction writes on successful field updates
- [x] Update `docs/ARCHITECTURE.md` concurrency section to point at this ADR
- [x] Client conflict UX: API contract shipped (`409` / `IssueConflictDetailsSchema` + e2e). Web conflict banner / merge UI deferred — not wired to the real PATCH path yet.

## References

- `[docs/ARCHITECTURE.md](../ARCHITECTURE.md)` — Concurrency section
- Issue statuses: `packages/shared/src/enums/issue.enum.ts` (`IssueStatus`)
