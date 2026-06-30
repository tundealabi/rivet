# Rivet

Multi-tenant issue tracking for teams that ship.

A lightweight issue tracker with organizations, role-based access, Stripe billing, async exports, and production-minded engineering - tenant isolation, observability, and documented trade-offs.

**Live demo:** _(add URL when deployed)_

## Features

- **Organizations** - create an org (become owner), invite teammates with expiring single-use tokens
- **Multi-org membership** - one user, many orgs; switch active org per session
- **Projects & issues** - track work with status, priority, assignees, and comments
- **RBAC** - Owner, Admin, Member, Viewer
- **Billing** - Free / Pro / Team tiers via Stripe (test mode in dev)
- **Async CSV export** - background job with retries; no blocking downloads
- **Observability** - structured logs, metrics, traces, and alerts on the API

## v1 boundaries

**Included:** email/password auth with refresh tokens, RLS tenant isolation, Stripe checkout + webhooks, export jobs, rate limits by plan tier, CI with isolation + RBAC tests.

**Not yet:** real-time WebSocket updates, OAuth/social login, MFA, per-seat billing, subdomain-per-org routing, public developer API.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for layering, RLS, auth, and API contract decisions.

## Monorepo structure

```
rivet/
├── apps/
│   ├── api/             @rivet/api - NestJS
│   └── web/             @rivet/web - Vite + React
├── packages/
│   └── shared/          @rivet/shared - wire types, envelope, shared constants
├── docker-compose.yml   Postgres + Redis
└── docs/
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (Postgres + Redis)

## Getting started

```bash
pnpm install
pnpm docker:up

# After apps exist:
# cp .env.example apps/api/.env

pnpm dev          # build shared + run all apps
pnpm dev:api      # http://localhost:8090
pnpm dev:web      # http://localhost:5173
```

## Scripts

| Command            | Description                         |
| ------------------ | ----------------------------------- |
| `pnpm install`     | Install workspace dependencies      |
| `pnpm dev`         | Build shared + run apps in parallel |
| `pnpm dev:api`     | API only                            |
| `pnpm dev:web`     | Web only                            |
| `pnpm build`       | Build all packages                  |
| `pnpm typecheck`   | Typecheck all packages              |
| `pnpm lint`        | ESLint                              |
| `pnpm format`      | Prettier                            |
| `pnpm docker:up`   | Start Postgres + Redis              |
| `pnpm docker:down` | Stop containers                     |

## Stack

NestJS · Prisma · PostgreSQL (RLS) · BullMQ · Redis · Stripe · Vite · React · TanStack Query · OpenTelemetry · Prometheus/Grafana
