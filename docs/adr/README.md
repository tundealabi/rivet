# Architecture Decision Records (ADRs)

Individual records for significant technical decisions. [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) stays the living overview; ADRs capture **why** a specific choice was made at a point in time.

## When to write an ADR

Write one when a decision is:

- Hard to reverse or expensive to change later
- Not obvious from reading the code
- Likely to be questioned by future contributors

Examples: database/RLS approach, pagination strategy for an endpoint family, auth model, monorepo layout rules.

Skip ADRs for small refactors, naming tweaks, or decisions already documented clearly in `ARCHITECTURE.md`.

## How to add one

1. Copy [`template.md`](./template.md) to `NNNN-short-kebab-title.md` (four-digit sequence, e.g. `0001-keyset-pagination-for-lists.md`).
2. Fill in all sections. Replace `NNNN` in the title with the file number.
3. Set **Status** to `Proposed` while reviewing; change to `Accepted` when merged.
4. If a decision is replaced, mark the old ADR `Superseded by ADR-XXXX` — do not delete it.

## Index

| ADR                                                            | Title                                                            | Status   |
| -------------------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| [0001](./0001-dual-token-auth-with-httponly-refresh-cookie.md) | Dual-token auth with httpOnly refresh cookie                     | Accepted |
| [0002](./0002-application-layer-tenant-isolation.md)           | Application-layer tenant isolation with CLS and Prisma extension | Accepted |
