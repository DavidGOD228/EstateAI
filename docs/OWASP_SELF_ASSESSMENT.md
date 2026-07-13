# OWASP Top 10:2025 Self-Assessment

**Scope**: this is an MVP take-home build, not a production system. **Threat model**: an internet-facing demo with
real (but low-value) user accounts, public property data, and a real Anthropic API key that must never reach the
browser or leak through logs/error responses. The assets worth protecting are: user credentials, the Anthropic
key/spend (AI abuse), and user profile privacy. There is a single user role and no admin surface.

This document supersedes the OWASP table in `TECHNICAL_PLAN.md` §20 — that table was written before
implementation; every row below has been re-checked against the shipped code and adjusted where wording drifted
from what actually exists.

Verification methods used per row: **code inspection** (reading the relevant source file directly) and, where
noted, **live checks** from the Phase 3 end-to-end pass — a real running stack (Docker Postgres + the real API)
probed with `curl`.

---

## A01 — Broken Access Control

**Implementation**: `JwtAuthGuard` (passport-jwt, cookie-based) is applied to `POST /api/properties/:id/ask`,
`POST /api/ai/generate-listing`, `GET /api/auth/me`, and `POST /api/auth/logout`
(`apps/api/src/ai/ask.controller.ts`, `apps/api/src/ai/generate-listing.controller.ts`,
`apps/api/src/auth/auth.controller.ts`). The property for Q&A is always loaded server-side by id
(`apps/api/src/ai/ask.controller.ts` → `PropertiesService.findById`) — the client can never supply or override the
trusted property context, only the id and the question. `GET /api/auth/me` resolves the user strictly from the
authenticated cookie's `sub` claim, never from a client-supplied id, so no user can read another user's profile.
There are no admin routes.

**Reasoning**: the real assets here are AI cost/abuse and profile privacy; both are gated by a backend guard, not
just hidden in the frontend router.

**Known limitation**: single role, no per-resource ACL — not needed at this scale, since the only per-user
resource is the caller's own profile.

**Production improvement**: a centralized policy/authorization layer if roles are ever introduced.

**Verification notes**: code inspection of guard placement on all four controllers; live check — anonymous
requests to `ask`, `generate-listing`, `me`, and `logout` returned `401` in the Phase 3 e2e pass.

---

## A02 — Security Misconfiguration

**Implementation**: Helmet applied globally with defaults, `x-powered-by` disabled (`apps/api/src/main.ts`);
environment schema validated at boot via Joi, aborting startup on missing/invalid required vars
(`apps/api/src/config/env.validation.ts`); Swagger only mounted when `NODE_ENV !== 'production'`
(`apps/api/src/main.ts`), and the Docker image explicitly sets `NODE_ENV=production`
(`docker-compose.yml`, `apps/api/Dockerfile`), so it is disabled in the shipped container; global
`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
(`apps/api/src/main.ts`); request body capped at 100kb via manual `json()`/`urlencoded()` limits (`main.ts`);
same-origin design (nginx in Docker, Vite proxy in dev) means no CORS middleware exists at all, removing that
misconfiguration class entirely; there are no debug/introspection endpoints.

**Reasoning**: removes the most common misconfiguration vectors for an app of this shape without introducing
config complexity the MVP doesn't need.

**Known limitation**: `secure` cookie flag is off in local HTTP dev (`apps/api/src/auth/auth.controller.ts` —
`secure: NODE_ENV === 'production'`), by necessity since local dev runs over plain HTTP.

**Production improvement**: HTTPS termination everywhere, HSTS, a tuned Content-Security-Policy beyond Helmet's
defaults, secret manager instead of a flat `.env` file.

**Verification notes**: code inspection of `main.ts` and `env.validation.ts`; live check — `GET /api/docs` returns
the Swagger UI in the dev configuration and the code path is structurally unreachable when `NODE_ENV=production`.

---

## A03 — Software Supply Chain Failures

**Implementation**: a single committed `pnpm-lock.yaml`; dependency versions pinned with caret ranges in each
package's `package.json` (`apps/api/package.json`, `apps/web/package.json`); Docker builds use
`pnpm install --frozen-lockfile` (`apps/api/Dockerfile`, `apps/web/Dockerfile`); no CDN-loaded scripts — the
frontend is a Vite-bundled SPA served as static files by nginx; dependency count kept deliberately small (no UI
kit, no state-management library, no HTTP client library beyond native `fetch`).

**Reasoning**: at this scale, a small, pinned, lockfile-enforced dependency set is a stronger control than any
tooling layered on top of a large one.

**Known limitation**: no automated dependency audit runs in CI (there is no CI in this MVP).

**Production improvement**: `pnpm audit` and Dependabot/Renovate wired into a CI pipeline.

**Verification notes**: code inspection of `pnpm-lock.yaml` presence and the `--frozen-lockfile` build step in both
Dockerfiles.

---

## A04 — Cryptographic Failures

**Implementation**: passwords hashed with Argon2id via the `argon2` package (`apps/api/src/auth/auth.service.ts`
— `argon2.hash` / `argon2.verify`); `passwordHash` is a plain entity column never included in any response DTO
(`apps/api/src/auth/auth.mapper.ts` maps `User` → `AuthUserResponseDto`, which has no password field); all secrets
(`JWT_SECRET`, `COOKIE_SECRET`, `ANTHROPIC_API_KEY`, DB credentials) live only in environment variables, `.env` is
git-ignored, `.env.example` ships placeholders only; the session token is an HttpOnly cookie, never stored in
`localStorage` or sent as a header the frontend code touches; logs never include secrets or cookie values
(`apps/api/src/common/all-exceptions.filter.ts` logs only status/message/requestId, never raw exception payloads
containing secrets).

**Reasoning**: meets current password-storage and token-storage guidance without introducing key-management
infrastructure the MVP doesn't need.

**Known limitation**: `JWT_SECRET` is a single static secret with no rotation mechanism.

**Production improvement**: key rotation via a managed KMS/secret manager, shorter-lived access tokens paired with
a refresh-token flow.

**Verification notes**: code inspection of `auth.service.ts`, `auth.mapper.ts`, and `.gitignore` (confirms `.env`
is excluded).

---

## A05 — Injection

**Implementation**: every mutating endpoint has a `class-validator` DTO (`RegisterDto`, `LoginDto`,
`AskQuestionDto`, `GenerateListingDto`, `PropertyQueryDto`); TypeORM repositories and query builder are used
exclusively for all database access (`apps/api/src/properties/properties.service.ts`,
`apps/api/src/auth/auth.service.ts`) — no raw SQL string interpolation anywhere; React escapes all rendered text
by default and the codebase contains no `dangerouslySetInnerHTML` and no `eval`; AI output is rendered as plain
text in the UI, never as HTML. Prompt injection is treated as an injection-class risk: the property record, the
question, and `optionalFeatures` are explicitly labeled as untrusted content inside both system prompts
(`apps/api/src/ai/prompts.ts`), and every AI response is re-validated against its Zod schema server-side before
being returned (`apps/api/src/ai/ai.service.ts` — `schema.parse(result)` after the provider call).

**Reasoning**: one discipline — never trust unvalidated input, whether it flows into SQL, the DOM, or a model
prompt — covers SQL injection, XSS, and prompt injection together.

**Known limitation**: prompt injection can never be fully eliminated by instructions alone; a sufficiently crafted
input could still shift model behavior within the bounds of what the structured schema allows.

**Production improvement**: adversarial prompt-injection test suite, output content filtering, model-side
guardrails/classifiers.

**Verification notes**: code inspection of DTOs, repository usage, `prompts.ts` untrusted-data framing, and the
`schema.parse` defense-in-depth call.

---

## A06 — Insecure Design

**Implementation**: both AI endpoints require authentication and are throttled via `@nestjs/throttler`, configured
from `AI_RATE_LIMIT_TTL_MS`/`AI_RATE_LIMIT_LIMIT` (default 60000ms / 10 requests) —
`apps/api/src/ai/ai.module.ts`; question length is capped at 500 characters and `optionalFeatures` at 1000
characters via DTO validators (`apps/api/src/ai/dto/ask-question.dto.ts`,
`apps/api/src/ai/dto/generate-listing.dto.ts`); every model call races against `AI_TIMEOUT_MS` (default 20000ms)
via a `Promise.race`-style wrapper (`apps/api/src/ai/anthropic.provider.ts`); the property context for Q&A is
always loaded server-side, never accepted from the client; the AI response schemas contain no executable content
and nothing from either AI feature is ever persisted to the database or invoked as a tool.

**Reasoning**: these controls bound cost, abuse, and blast radius by design, rather than relying on the model
itself to behave.

**Known limitation**: the throttler is in-memory and per-process — it resets on restart and does not coordinate
across multiple instances.

**Production improvement**: a distributed rate limiter (e.g. Redis-backed) if the API ever runs as more than one
instance.

**Verification notes**: code inspection of `ai.module.ts` throttler config and DTO length constraints; live check
— the 11th `ask`/`generate-listing` request inside the configured window returned `429` in the Phase 3 e2e pass.

---

## A07 — Authentication Failures

**Implementation**: Argon2id password hashing; login always returns the identical generic message
`"Invalid email or password."` for both an unknown email and a wrong password
(`apps/api/src/auth/auth.service.ts`); registration returns a generic `"Unable to register with these details."`
on a duplicate email rather than confirming the email is taken; the session cookie (`eai_session`) is HttpOnly,
`SameSite=Lax`, scoped to `path: '/api'`, `Secure` in production, with an expiry matching `JWT_EXPIRES_IN`
(`apps/api/src/auth/auth.controller.ts`); logout clears the cookie server-side
(`res.clearCookie(SESSION_COOKIE_NAME, ...)`); register and login are throttled at 10 requests/60s
(`apps/api/src/auth/auth.controller.ts` — `AUTH_THROTTLE`) as brute-force protection; there are no default or
seeded credentials for any account.

**Reasoning**: prevents account enumeration and gives baseline protection against both offline cracking (via
Argon2id) and online brute-forcing (via the throttle).

**Known limitation**: no account lockout, no MFA, no password reset flow — all explicitly out of scope for this
MVP.

**Production improvement**: progressive lockout after repeated failures, MFA, a verified-email-based password
reset flow.

**Verification notes**: code inspection of `auth.service.ts` and `auth.controller.ts`; live check — repeated wrong
logins for a known-valid email and for a nonexistent email returned byte-identical `401` bodies in the Phase 3 e2e
pass; cookie flags (`HttpOnly`, `SameSite=Lax`, `path=/api`) were inspected directly from the `Set-Cookie` header
on a successful login.

---

## A08 — Software or Data Integrity Failures

**Implementation**: a single lockfile (`pnpm-lock.yaml`) drives every install, including inside Docker; official
upstream base images only (`node:20-alpine`, `postgres:16-alpine`, `nginx:alpine`); schema changes go exclusively
through TypeORM migrations — `synchronize: false` is set explicitly in `app.module.ts` and the API container's
entrypoint runs `migrate.js` before `main.js` (`apps/api/Dockerfile`); AI output is only ever data — it is
validated against a Zod schema and rendered as plain text, never executed, evaluated, or used to construct
further code paths.

**Reasoning**: the Zod schema is the trust boundary between "the model said this" and "the app treats this as
structured data" — the app never crosses from data into code with model output.

**Known limitation**: no image signing or SBOM generation for the built Docker images.

**Production improvement**: signed images, build provenance attestation, CI-enforced integrity checks.

**Verification notes**: code inspection of `app.module.ts` (`synchronize: false`), the Dockerfile entrypoint
ordering, and `ai.service.ts` (`schema.parse` before any response leaves the service).

---

## A09 — Security Logging & Alerting Failures

**Implementation**: a global `LoggingInterceptor` and `AllExceptionsFilter` produce structured, request-scoped
log lines carrying a request id (assigned per-request by `RequestIdMiddleware` via `crypto.randomUUID()`), method,
route, and status code (`apps/api/src/common/logging.interceptor.ts`,
`apps/api/src/common/all-exceptions.filter.ts`, `apps/api/src/common/request-id.middleware.ts`); the
`AiService` logs an AI outcome category (`timeout` | `provider_error` | `schema_error`) on every failure
(`apps/api/src/ai/ai.service.ts`) without logging the prompt or the raw response. Passwords, password hashes, the
Anthropic API key, cookie values, and full prompts/model responses are never passed to any logger call anywhere in
the codebase.

**Reasoning**: enough structured, correlated detail to reconstruct an incident by request id, without ever writing
sensitive values to a log sink.

**Known limitation**: no alerting pipeline exists in the MVP — logs go to stdout only.

**Production improvement**: alerts on repeated login failures per account/IP, unusual AI request volume, spikes in
AI failure category counts, elevated 5xx rate, and repeated `429` rate-limit violations.

**Verification notes**: code inspection of `logging.interceptor.ts`, `request-id.middleware.ts`, and every call
site of `Logger` in the `auth` and `ai` modules to confirm no secret or full-prompt values are passed as log
arguments.

---

## A10 — Mishandling of Exceptional Conditions

**Implementation**: a single global `AllExceptionsFilter` (`apps/api/src/common/all-exceptions.filter.ts`) catches
every thrown error application-wide and normalizes it to `{ statusCode, message, requestId }` — the full
exception (including stack trace) is only ever written to the server-side log, keyed by request id, never returned
to the client; AI timeouts, provider errors, and schema-validation failures all collapse to a single generic `503`
with the message "The AI assistant is currently unavailable. Please try again later."
(`apps/api/src/ai/ai.service.ts`); an unknown property id returns `404`
(`apps/api/src/ai/ask.controller.ts`, `apps/api/src/properties/properties.controller.ts`); missing or invalid
required environment variables abort process startup entirely via the Joi validation schema
(`apps/api/src/config/env.validation.ts`), rather than the app starting in a half-configured state; the health
endpoint returns `503` when the database is unreachable (`apps/api/src/health/health.controller.ts`), and the
Docker healthcheck keeps the API container out of rotation until it responds `200`.

**Reasoning**: every failure path identified in the design has one defined, safe response — none of them fall
through to a default that could leak internals.

**Known limitation**: the generic error messages trade some client-side debuggability for safety by design.

**Production improvement**: server-side error tracking (e.g. Sentry) with automatic scrubbing of sensitive fields,
so operators retain full detail without it ever reaching a response body.

**Verification notes**: code inspection of `all-exceptions.filter.ts`, `ai.service.ts`, and
`health.controller.ts`; live check — a request with an invalid AI provider configuration returned a generic `503`
body with no provider detail in the Phase 3 e2e pass, and validation errors (e.g. an oversized question) returned
`400` with a field-level message and no stack trace.

---

## Summary

Every row above reflects the code as it actually shipped, not the pre-implementation plan. The two changes from
the original `TECHNICAL_PLAN.md` §20 table worth calling out explicitly: the auth brute-force throttle is a
separate, explicit `@Throttle` decorator on `register`/`login` (10 req/60s) rather than an implicit "global limit
covers login" claim, and the AI-endpoint rate limit is sourced directly from `AI_RATE_LIMIT_TTL_MS` /
`AI_RATE_LIMIT_LIMIT` at the module level (`AiModule`), not hardcoded per-controller.
