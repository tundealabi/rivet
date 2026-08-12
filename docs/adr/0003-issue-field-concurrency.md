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

| Fields                                                      | Concurrency                                  |
| ----------------------------------------------------------- | -------------------------------------------- |
| `status`, `assigneeId`                                      | Expected-value compare-and-swap (CAS)        |
| `description`                                               | Expected content hash (computed, not stored) |
| All other updatable issue fields (e.g. `title`, `priority`) | Last-write-wins on partial PATCH             |

Updates remain **field-level / partial**: only fields present in the request are written. Low-risk fields do not participate in version/CAS checks, so they do not false-conflict with high-risk edits.

### Status & assignee - expected-value CAS

When the PATCH includes `status` or `assigneeId`, the client also sends the value it believes is current (e.g. `expectedStatus`, `expectedAssigneeId`, including `null` for unassigned).

The update succeeds only if the row’s current value matches. Mismatch → conflict (`409`), not a silent overwrite.

No `statusVersion` / `assigneeVersion` columns.

### Description - expected hash, derived on read/write

No `descriptionVersion` or stored hash column.

- **Read:** API hashes the current `description` (stable algorithm over exact stored UTF-8) and returns e.g. `descriptionHash` on the issue payload.
- **Write:** Client sends `expectedDescriptionHash` from its last read plus the new `description`.
- **Server:** Re-hash current DB `description`, compare to `expectedDescriptionHash`. Match → update. Mismatch → `409` with current description and a fresh hash.

### Status transition rules (orthogonal to concurrency)

Every status change is validated against an allowed transition graph from the current DB status to the proposed status, whether or not a concurrency token is present.

- Illegal transition → domain rule violation (not a conflict)
- Stale expected value → `409` conflict

Both checks apply on status updates. Transition rules alone do not prevent lost updates; CAS alone does not enforce workflow.

### Conflict handling (clients)

On high-risk field conflicts, the API returns enough current server state for the client to show what changed vs what the user intended. Description may use a merge UI; status/assignee may use keep-mine / take-theirs / cancel style resolution after refresh.

### Issue activity (not event sourcing)

Successful field-level writes also insert append-only `IssueActivity` row(s) in the same transaction. That provides an audit trail, an issue activity feed, and context for conflict UX (who changed the field, and when). This is not CQRS/event-sourced projections; the Issue row remains the source of truth for current values.

### Explicitly out of scope

- Pessimistic locking
- Row/document version on the whole issue
- CRDTs / OT for description
- Event sourcing or CQRS as the concurrency model

## Alternatives considered

| Option                                                    | Why not                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Last-write-wins on all fields                             | Silent loss on status, assignee, and description                                   |
| Pessimistic locking                                       | Blocks other editors; poor fit for multi-tab / multi-user web UX                   |
| Row/document optimistic version                           | False conflicts when users edit different fields                                   |
| Per-field version columns for status/assignee/description | Works, but adds schema we can avoid with expected value / derived hash             |
| Expected full-text CAS for description                    | Large payloads; normalization/encoding footguns                                    |
| CRDT/OT for description                                   | Operational complexity unjustified for this product                                |
| Event sourcing / CQRS                                     | Architecture shift; activity log gives audit/feed without changing the write model |
| Shared version across all high-risk fields                | Reintroduces false conflicts between status, assignee, and description             |

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
- [ ] Client: conflict banner / merge UI for description; simpler resolution for status and assignee

## References

- `[docs/ARCHITECTURE.md](../ARCHITECTURE.md)` — Concurrency section
- Issue statuses: `packages/shared/src/enums/issue.enum.ts` (`IssueStatus`)
