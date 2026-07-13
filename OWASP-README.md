# EstateAI — OWASP README

Short security companion for reviewers. Full row-by-row detail lives in [`docs/OWASP_SELF_ASSESSMENT.md`](docs/OWASP_SELF_ASSESSMENT.md).

**Scope:** MVP take-home, not production. **Threat model:** real user accounts, public listing data, and a real Anthropic API key that must never reach the browser or leak through logs/error responses.

---

## How to run

**Docker (recommended)**

```bash
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, AI_MODEL, JWT_SECRET, COOKIE_SECRET, POSTGRES_PASSWORD
docker compose up --build
```

Open **http://localhost:3000**. Migrations and property seed run automatically on API startup.

**Local dev**

```bash
pnpm install
docker compose up postgres -d
pnpm --filter @estateai/api migration:run
pnpm --filter @estateai/api seed
pnpm dev
```

Web on **http://localhost:3000**, API on **http://localhost:3001** (Vite proxies `/api` so auth cookies stay same-origin).

**Verify security-related behavior**

```bash
pnpm test          # API (Jest) + web (Vitest); AI provider is mocked in API e2e
pnpm typecheck
pnpm lint
```

Register a user in the UI, then exercise protected routes (Create, Property Q&A, AI search bar on Home). Anonymous calls to protected endpoints should return `401`.

---

## Real AI vs mocked

### Real in production (requires `ANTHROPIC_API_KEY`)

All three features call **Anthropic Claude server-side only** via LangChain (`apps/api/src/ai/anthropic.provider.ts`). The browser never sees the key and never calls Anthropic directly — only same-origin `/api/*`.

| Feature | UI | API | Notes |
|---|---|---|---|
| **Property Q&A** | Property details page | `POST /api/properties/:id/ask` | Client sends only `{ question }`; property context loaded from Postgres by id |
| **Smart Listing Generator** | `/create` | `POST /api/ai/generate-listing` | Structured form in → marketing copy out; publish via `POST /api/properties` |
| **AI contextual search** | Home page search bar | `POST /api/ai/search-properties` | Free-text query; backend loads candidate listings, model ranks matches; hallucinated ids dropped |

There is **no fake AI fallback**. Provider failure, timeout, or invalid structured output → generic `503` to the client.

Output is **plain text only** (no HTML/markdown rendering). Q&A and search results live in React state for the session; listings persist only when the user publishes.

### Not mocked (real backend)

- **Authentication** — Postgres users, Argon2id password hashing, JWT in HttpOnly `eai_session` cookie (`path=/api`, `SameSite=Lax`, `Secure` in production).
- **Property data** — PostgreSQL with idempotent seed; user-created listings via authenticated `POST /api/properties`.

### Mocked (tests only)

- **AI provider** — API e2e/unit tests inject a mock `AI_PROVIDER`; no network, no Anthropic key required (`apps/api/test/e2e/ai.e2e.spec.ts`).
- **HTTP client** — Frontend Vitest suites mock `shared/api/endpoints` and `fetch`; no live API.

---

## OWASP Top 10:2025 self-assessment (summary)

| # | Category | Status | What we implemented | Known gaps |
|---|---|---|---|---|
| **A01** | Broken Access Control | **Met** | `JwtAuthGuard` on protected routes; deny-by-default. `PATCH`/`DELETE /api/properties/:id` require owner (`403` if not owner, `404` if missing); owner-only Edit/Delete UI on property details (`isOwn`). Property context for Q&A loaded server-side. `ownerId` never exposed — only `isOwn`. Public read of listings is intentional. | Single role; no RBAC. Q&A open to any authenticated user on any listing (by design); bounded by per-user AI rate limit. |
| **A02** | Security Misconfiguration | **Met** | Helmet on API; Swagger off when `NODE_ENV=production`; Joi env validation at boot; global `ValidationPipe` whitelist; 100kb body cap; same-origin proxy (no CORS surface); `x-powered-by` disabled; nginx CSP + security headers on the SPA; Postgres bound to `127.0.0.1:5432` in compose; API `trust proxy` for reverse-proxy deployments. | Compose serves HTTP (no HSTS/TLS in stack — enable at the TLS-terminating proxy in production). |
| **A03** | Supply Chain | **Met** | Committed `pnpm-lock.yaml`; Docker `--frozen-lockfile`; no CDN scripts; small dependency set. | No CI dependency audit (Dependabot/`pnpm audit`). |
| **A04** | Cryptographic Failures | **Met** | Argon2id passwords; secrets in env only (`.env` gitignored); Anthropic key server-only; HttpOnly session cookie; JWT pinned to HS256; logout clears cookie with matching flags. | No HTTPS in provided deployment; no JWT rotation/revocation. |
| **A05** | Injection | **Met** | Parameterized TypeORM queries; DTO validation on every mutating endpoint; React text rendering (no `dangerouslySetInnerHTML`); AI output Zod-validated; prompts label user input as untrusted; post-login redirect limited to safe internal paths; client-side input length caps. | Prompt injection mitigated by instructions + schema, not input stripping. |
| **A06** | Insecure Design | **Met** | Auth throttle (10/min on login/register); AI throttle (default 10/min, env-configurable); **per-user** AI quota on all three endpoints (`UserThrottlerGuard`); prompt length caps in DTOs; 20s AI timeout; no AI output persisted or executed. | In-memory throttler (resets on restart; not multi-instance). |
| **A07** | Authentication Failures | **Met** | Real DB auth (not mocked); generic login/register errors (no enumeration); cookie session; login/register throttled; password 8–128 chars. | No MFA, lockout, password reset, or server-side JWT revocation (2h expiry bounds stolen-token window). |
| **A08** | Integrity Failures | **Met** | Lockfile-enforced installs; migrations only (`synchronize: false`); AI output validated then treated as data — never `eval`'d; search results filtered to DB candidate ids. | No image signing / SBOM. |
| **A09** | Logging & Alerting | **Partially met** | Request-scoped logs with `requestId`; no secrets/prompts in logs; audit events for auth success/failure, property create/update/delete, and all three AI endpoints on success; AI failures log category only. | No alerting pipeline (stdout only). No dedicated audit log sink. |
| **A10** | Exceptional Conditions | **Met** | Global exception filter → `{ statusCode, message, requestId }` (no stacks to client); AI errors → generic `503`; unhandled rejection/exception handlers; graceful shutdown hooks; frontend `ErrorBoundary` with generic fallback (no error details in UI). | — |

### Minimum bar (assignment checklist)

| Requirement | How |
|---|---|
| Secrets out of code | Env vars + `.gitignore`; `.env.example` has placeholders only |
| AI key not in browser | Proxied through NestJS `/api/ai/*` and `/api/properties/:id/ask` |
| Input validated, no raw HTML | class-validator DTOs + React text nodes |
| Fail safe on errors | `AllExceptionsFilter`; generic AI `503`; no stack traces to clients |

---

## Quick manual checks

```bash
# Anonymous → 401 on protected route
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/ai/generate-listing \
  -H "Content-Type: application/json" -d '{}'

# Swagger disabled in production container (NODE_ENV=production in docker-compose api service)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/docs

# Health (public)
curl -s http://localhost:3000/api/health
```

For the full verification narrative (code paths, live curl results, production improvements), see [`docs/OWASP_SELF_ASSESSMENT.md`](docs/OWASP_SELF_ASSESSMENT.md).
