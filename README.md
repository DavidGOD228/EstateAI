# EstateAI

EstateAI is a real estate property browsing MVP for the Tallinn / Estonia market (prices in EUR), built as a
take-home assignment. It includes two genuinely working AI features backed by a real Anthropic Claude model call:

- **Property Q&A** — ask a free-text question about a specific listing and get a grounded, structured answer.
- **Smart Listing Generator** — turn a structured property form into polished, copyable marketing copy.

Stack: React + Vite + TypeScript (frontend), NestJS + TypeORM + PostgreSQL (backend), LangChain JS +
`@langchain/anthropic` for the model calls, in a pnpm workspace monorepo.

For the full architecture and design rationale, see [`docs/TECHNICAL_PLAN.md`](docs/TECHNICAL_PLAN.md). For the
security self-assessment, see [`docs/OWASP_SELF_ASSESSMENT.md`](docs/OWASP_SELF_ASSESSMENT.md). For how this
project was built with AI assistance, see [`docs/AI_WORKFLOW.md`](docs/AI_WORKFLOW.md).

---

## Quick start (Docker)

Requirements: Docker and Docker Compose.

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum:

- `ANTHROPIC_API_KEY` — your Anthropic API key.
- `AI_MODEL` — a current Anthropic Claude Opus-class model id (e.g. an `claude-opus-*` model name). This is never
  hardcoded anywhere in the codebase; the app reads it from the environment and fails to start without it.
- `JWT_SECRET` and `COOKIE_SECRET` — long random strings.
- `POSTGRES_PASSWORD` — a password for the local Postgres container.

Then, from the repository root:

```bash
docker compose up --build
```

Open **http://localhost:3000**.

Database migrations and the property seed run automatically as part of the API container's startup command,
before the server starts listening. The seed is idempotent — it upserts a fixed set of listings keyed by a stable
`externalRef` using `ON CONFLICT ... DO NOTHING`, so re-running `docker compose up` never duplicates rows.

---

## Local development (without Docker)

Requirements: Node.js 20+, pnpm 10, Docker (for Postgres only).

```bash
pnpm install
docker compose up postgres -d          # Postgres only, published on localhost:5432
pnpm --filter @estateai/api migration:run
pnpm --filter @estateai/api seed
pnpm dev                                # runs web + api together
```

`pnpm dev` starts the Vite dev server (web) on **http://localhost:3000** and the NestJS API on
**http://localhost:3001**. The Vite dev server proxies `/api/*` requests to the API, so in local dev — just like
in Docker — the browser only ever talks to one origin and auth cookies stay first-party.

You still need a filled-in `.env` at the repo root (see [Environment variables](#environment-variables)) — the API
reads it via `ConfigModule` regardless of how it's started.

---

## Scripts

Run from the repository root; these fan out across the pnpm workspace:

| Script | What it does |
|---|---|
| `pnpm dev` | Runs the web dev server and the API in watch mode, in parallel |
| `pnpm lint` | Lints every workspace package |
| `pnpm typecheck` | Runs `tsc` (no emit) across web, api, and shared-types |
| `pnpm build` | Production builds for every workspace package |
| `pnpm test` | Runs each package's test suite (Jest for the API, Vitest for the web app) |

API-specific scripts (run with `pnpm --filter @estateai/api <script>`):

| Script | What it does |
|---|---|
| `migration:run` | Applies pending TypeORM migrations |
| `seed` | Runs the idempotent property seed |

---

## Environment variables

All variables are validated at process startup (Joi schema); a missing or invalid required value aborts boot with
a clear message instead of a silent misconfiguration. `.env.example` in the repo root contains placeholders only —
`.env` itself is git-ignored and must never be committed.

| Variable | Purpose | Secret |
|---|---|---|
| `NODE_ENV` | Runtime mode (`development` / `production` / `test`); also gates Swagger | No |
| `PORT` | API listen port | No |
| `DATABASE_URL` | PostgreSQL connection string used by the API | No (but contains the DB password) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres container init credentials (Docker Compose) | `POSTGRES_PASSWORD` yes |
| `JWT_SECRET` | Signs the session JWT | Yes |
| `JWT_EXPIRES_IN` | Session token / cookie lifetime (e.g. `2h`) | No |
| `COOKIE_SECRET` | `cookie-parser` signing secret, distinct from `JWT_SECRET` | Yes |
| `AI_PROVIDER` | AI provider selector (only `anthropic` is implemented) | No |
| `AI_MODEL` | Anthropic model id. Must be a current Claude model name — never hardcoded in code | No |
| `ANTHROPIC_API_KEY` | Anthropic API key, used server-side only, never sent to the browser | Yes |
| `AI_TIMEOUT_MS` | Timeout (ms) for each model call, default `20000` | No |
| `AI_MAX_QUESTION_LENGTH` | Max characters for a Property Q&A question, default `500` | No |
| `AI_MAX_OPTIONAL_FEATURES_LENGTH` | Max characters for generator optional features, default `1000` | No |
| `AI_RATE_LIMIT_TTL_MS` / `AI_RATE_LIMIT_LIMIT` | Rate-limit window and request count for the AI endpoints | No |

---

## API overview

All endpoints are mounted under `/api`. Every error response shares one shape:
`{ "statusCode": number, "message": string, "requestId": string }` — no stack traces, no provider internals.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Liveness/readiness; `503` if the database is unreachable |
| POST | `/api/auth/register` | — | Register with name/email/password; sets the session cookie |
| POST | `/api/auth/login` | — | Log in; sets the session cookie; generic error on failure |
| POST | `/api/auth/logout` | Cookie | Clears the session cookie |
| GET | `/api/auth/me` | Cookie | Returns the current authenticated user |
| GET | `/api/properties` | — | List properties with optional `location`, `propertyType`, `minBedrooms`, `maxPrice` filters |
| GET | `/api/properties/:id` | — | Property details by id |
| POST | `/api/properties/:id/ask` | Cookie | Property Q&A: ask a question about one listing |
| POST | `/api/ai/generate-listing` | Cookie | Smart Listing Generator: generate marketing copy from a form |

"Cookie" means the request must carry a valid `eai_session` HttpOnly session cookie (enforced by a backend guard,
not just hidden in the UI); anonymous requests get `401`.

Interactive API docs (Swagger) are available at **`/api/docs`**, but only when `NODE_ENV !== 'production'` — the
Docker image runs with `NODE_ENV=production`, so Swagger is disabled in the shipped container by design.

---

## Architecture

The browser only ever talks to one origin. In Docker, nginx serves the built frontend and proxies `/api/*` to the
NestJS API; in local dev, the Vite dev server does the same proxying. This same-origin design removes CORS from
the threat surface entirely and keeps the session cookie first-party in both modes. Only the API process holds the
Anthropic API key and ever calls the model — the browser never talks to Anthropic directly, and no AI response
reaches the client without first being validated against a Zod schema.

```text
EstateAI/
├── apps/
│   ├── web/                      # React + Vite + TypeScript + Tailwind
│   │   └── src/
│   │       ├── routes/            # HomePage, PropertyDetailsPage, GeneratePage,
│   │       │                      # LoginPage, RegisterPage, ProfilePage, NotFoundPage
│   │       ├── features/
│   │       │   ├── auth/          # AuthContext, ProtectedRoute, login/register forms
│   │       │   ├── properties/    # listing grid, filters, details, placeholders, skeletons
│   │       │   ├── ai/            # Property Q&A UI, listing generator form + result
│   │       │   └── profile/       # profile card
│   │       └── shared/
│   │           ├── api/           # typed fetch client, endpoint functions
│   │           └── components/    # Button, Input, Select, Spinner, EmptyState, ErrorState, Header, Layout
│   └── api/                       # NestJS
│       └── src/
│           ├── main.ts, app.module.ts
│           ├── common/            # exception filter, request-id middleware, logging interceptor
│           ├── config/            # environment schema validation (Joi)
│           ├── health/
│           ├── users/
│           ├── auth/               # JWT strategy/guard, cookie handling, register/login/logout/me
│           ├── properties/         # entity, service, controller
│           ├── ai/                 # provider abstraction, Anthropic provider, prompts, Zod schemas, controllers
│           └── database/           # data source, migrations, seed
├── packages/
│   └── shared-types/               # frozen request/response contract shared by web and api
├── docs/                           # TECHNICAL_PLAN.md, AI_WORKFLOW.md, OWASP_SELF_ASSESSMENT.md
├── docker-compose.yml
└── .env.example
```

Authentication is a stateless JWT stored in an `eai_session` HttpOnly cookie (`SameSite=Lax`, `Secure` in
production, scoped to `/api`), verified by a NestJS guard on every protected route — the frontend's route
protection is a UX convenience only, never the actual enforcement point.

AI calls happen exclusively on the backend: `ChatAnthropic` (via LangChain JS) combined with
`withStructuredOutput` and a Zod schema, so the model is constrained to return one specific JSON shape, which is
then re-validated server-side (defense in depth against a malformed or drifted response). There is no fake
fallback — if the Anthropic call fails, times out, or returns something that doesn't pass schema validation, the
API returns a generic `503` and the rest of the app keeps working normally.

---

## AI features

### Property Q&A

On a property details page, an authenticated user asks a free-text question. The client sends only
`{ "question": "..." }` — it never supplies or overrides the property data. The backend loads the property from
PostgreSQL by id, builds a system prompt that scopes the model strictly to that listing, and calls Anthropic.

The system prompt enforces a **domain lock**: questions about suitability, features, space/layout, listing-stated
location facts, pros/cons, or missing information are answered; anything else (games, general knowledge, coding
help, politics, acting as a general chatbot, etc.) gets exactly this refusal:

> I can only answer questions about this property and the information in its listing.

Response shape:

```ts
{
  answer: string;
  highlights: string[];
  caveats: string[];
  confidence: "high" | "medium" | "low";
}
```

### Smart Listing Generator

On `/generate`, an authenticated user fills a structured form (location, price, bedrooms, bathrooms, area,
property type, optional free-text features, optional tone) and receives polished marketing copy. The optional
free-text field is explicitly treated as untrusted content in the prompt — it may be mentioned, but embedded
instructions inside it are ignored. The model is instructed to avoid inventing facts (schools, transport, crime
statistics, views, renovation history), avoid unsupported superlatives and legal/financial claims, and avoid any
discriminatory or fair-housing-sensitive language.

Response shape:

```ts
{
  headline: string;
  description: string;
  highlights: string[];
  targetAudience: string;
}
```

Both features return plain text only (no HTML/markdown) and are never persisted — history for Property Q&A lives
only in React state for the current session, and generated listings are copyable but not auto-saved.

---

## Security summary

Full detail lives in [`docs/OWASP_SELF_ASSESSMENT.md`](docs/OWASP_SELF_ASSESSMENT.md) and
[`docs/TECHNICAL_PLAN.md`](docs/TECHNICAL_PLAN.md) §19–20. Highlights:

- Passwords hashed with Argon2id; never returned in any API response.
- Sessions are HttpOnly, `SameSite=Lax` cookies scoped to `/api` — never stored in `localStorage`.
- Both AI endpoints and the profile/logout endpoints are behind a backend `JwtAuthGuard`, not just hidden in the UI.
- AI endpoints are rate-limited (10 requests/minute by default, configurable); auth endpoints have a separate
  brute-force throttle.
- Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` rejects any unexpected field on every
  request body.
- Helmet security headers; `x-powered-by` disabled; same-origin design removes CORS from the attack surface.
- A single global exception filter normalizes every error to a safe `{ statusCode, message, requestId }` body;
  nothing internal (stack traces, provider responses, env values) reaches the client. Logs never contain passwords,
  hashes, API keys, cookies, or full prompts/responses.
- Layered prompt-injection defenses on both AI features: input validation and length caps, a narrowly scoped
  system prompt, explicit rules that treat listing/feature/question text as untrusted data, and Zod-validated
  structured output as the final trust boundary.

---

## Testing

Run the whole workspace's test suite from the repository root:

```bash
pnpm test
```

This runs Jest for the API (`apps/api/test`) and Vitest for the web app (`apps/web/src`). The backend suite covers
authentication and validation flows, access control on protected/AI endpoints, and AI-path behavior (refusal,
provider failure, and malformed structured output) against a mocked AI provider and test database/fixtures so it
does not depend on network access or a live Anthropic key. The frontend suite covers smoke-level rendering and
interaction for the core pages and components.

---

## What I'd improve with more time

- Refresh tokens with rotation and server-side revocation, instead of a single long-lived stateless JWT.
- A distributed rate limiter (e.g. Redis-backed) instead of the current in-memory, per-instance throttler.
- End-to-end browser tests (Playwright) covering the full register → ask → generate → logout flow.
- A CI pipeline running lint/typecheck/test/build and `docker compose up` smoke checks on every push.
- Real image upload/handling instead of CSS placeholders.
- Pagination on the property listing endpoint instead of returning the full result set.
- Structured log shipping to an external sink (e.g. for the alerting scenarios described in the OWASP assessment).
- Automated dependency audit (`pnpm audit` / Dependabot/Renovate) wired into CI.
