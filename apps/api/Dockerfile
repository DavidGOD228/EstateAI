# EstateAI API — multi-stage build (NestJS, tsc -> dist/)
# Build context is the repo root (pnpm workspace); see docker-compose.yml.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# --- deps: install only what @estateai/api needs, with a frozen lockfile ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
RUN pnpm install --frozen-lockfile --filter @estateai/api...

# --- build: bring in sources and compile ---
FROM deps AS build
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @estateai/api build
# --legacy: this workspace does not use injected dependencies (pnpm v10 default requires the flag)
RUN pnpm deploy --legacy --filter @estateai/api --prod /prod/api

# --- runtime: pruned prod node_modules + compiled dist only ---
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod/api ./
COPY --from=build /app/apps/api/dist ./dist
EXPOSE 3001
USER node
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/database/seed.js && node dist/main.js"]
