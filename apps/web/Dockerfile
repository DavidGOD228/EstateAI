# EstateAI web — multi-stage build (Vite SPA served by nginx)
# Build context is the repo root (pnpm workspace); see docker-compose.yml.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# --- deps: install only what @estateai/web needs, with a frozen lockfile ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
RUN pnpm install --frozen-lockfile --filter @estateai/web...

# --- build: bring in sources (shared-types is types-only, consumed via
# tsconfig/vite path aliases, so it must be present at build time) ---
FROM deps AS build
COPY apps/web ./apps/web
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @estateai/web build

# --- runtime: static SPA served by nginx ---
FROM nginx:alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
