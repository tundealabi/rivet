# Rivet

Multi-tenant issue tracking for teams that ship.

A lightweight issue tracker with organizations, role-based access, Stripe billing, async exports, and production-minded engineering - tenant isolation, observability, and documented trade-offs.

**Live demo:** _(add URL when deployed)_

## Features

- **Organizations** - create an org (become owner), invite teammates with expiring single-use tokens
- **Multi-org membership** - one user, many orgs; switch active org per session
- **Projects & issues** - track work with status, priority, assignees, and comments
- **RBAC** - Owner, Admin, Member, Viewer
- **Billing** - Free / Pro via Stripe Checkout (test mode in dev); Team is an unlimited fixture tier
- **Async CSV export** - background job with retries; no blocking downloads
- **Observability** - structured logs, metrics, traces, and alerts on the API

## v1 boundaries

**Included:** email/password auth with refresh tokens, application-layer tenant isolation, Stripe checkout + webhooks, export jobs, global HTTP rate limits, plan caps (`PLAN_LIMITS`), GitHub Actions CI (lint, typecheck, unit, build, e2e including isolation + RBAC).

**Not yet:** Postgres RLS, real-time WebSocket updates, OAuth/social login, MFA, per-seat billing, plan-tier request rate limits, subdomain-per-org routing, public developer API.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for layering, tenant isolation, auth, and API contract decisions.

## Monorepo structure

```
rivet/
├── apps/
│   ├── api/             @rivet/api - NestJS
│   └── web/             @rivet/web - Vite + React
├── packages/
│   └── shared/          @rivet/shared - wire types, envelope, shared constants
├── docker-compose.yml   Postgres, Redis, MinIO, Prometheus, Grafana, Tempo
├── docker/              Compose configs (Prometheus, Tempo, Grafana)
└── docs/
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (Postgres, Redis, MinIO, Prometheus, Grafana, Tempo)

## Getting started

```bash
pnpm install
pnpm docker:up    # Postgres, Redis, MinIO, Prometheus, Grafana, Tempo

# After apps exist:
# cp apps/api/src/config/envs/.env.sample apps/api/src/config/envs/.env.development
# For e2e: copy the same sample to .env.test and set NODE_ENV=test

pnpm dev          # build shared + run all apps
pnpm dev:api      # http://localhost:8090
pnpm dev:web      # http://localhost:5173

# Grafana (local): http://localhost:3001  (admin / admin)
# Production: Grafana Cloud (OTLP + Prometheus remote_write)
```

## Scripts

| Command            | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `pnpm install`     | Install workspace dependencies                           |
| `pnpm dev`         | Build shared + run apps in parallel                      |
| `pnpm dev:api`     | API only                                                 |
| `pnpm dev:web`     | Web only                                                 |
| `pnpm build`       | Build all packages                                       |
| `pnpm typecheck`   | Typecheck all packages                                   |
| `pnpm lint`        | ESLint                                                   |
| `pnpm format`      | Prettier                                                 |
| `pnpm docker:up`   | Start Postgres, Redis, MinIO, Prometheus, Grafana, Tempo |
| `pnpm docker:down` | Stop containers                                          |

CI runs on pull requests and pushes to `main` (`.github/workflows/ci.yml`): lint, typecheck, unit tests, build, and API e2e against Compose Postgres/Redis/MinIO.

## Stack

NestJS · Prisma · PostgreSQL · BullMQ · Redis · Stripe · Vite · React · TanStack Query · OpenTelemetry · Prometheus/Grafana
