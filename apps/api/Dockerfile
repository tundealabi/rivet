FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @rivet/shared build \
  && pnpm --filter @rivet/api prisma:generate \
  && pnpm --filter @rivet/api build
RUN pnpm deploy --filter @rivet/api --prod --legacy /prod/api

FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /prod/api ./
EXPOSE 10000
CMD ["node", "dist/main"]
