# AI Workflow

How EstateAI was built with AI assistance: tools, process, representative prompts, what was reviewed by hand, and
what would be improved with more time. Companion to [`TECHNICAL_PLAN.md`](TECHNICAL_PLAN.md) (architecture,
source of truth) and [`OWASP_SELF_ASSESSMENT.md`](OWASP_SELF_ASSESSMENT.md) (security).

---

## Tools used

- **Cursor**, with Fable 5 (Claude Opus-class) as the orchestrating agent for the whole build — writing the plan,
  sequencing phases, and reviewing integration points.
- **Parallel Claude Sonnet 5 subagents** for implementation workstreams within each approved phase, each scoped to
  a disjoint set of directories (see "Phased parallel workstreams" below).
- **Skills consulted for the AI/LangChain integration**: `ecosystem-primer` (framework selection — confirmed a
  direct LangChain model call was the right fit, not LangGraph/Deep Agents/RAG), `langchain-fundamentals`
  (`ChatAnthropic` + `withStructuredOutput` pattern), `langchain-dependencies` (package/version constraints for
  `langchain`, `@langchain/core`, `@langchain/anthropic`).

---

## How it was built

The build followed a strict **documentation-first, phased** process, chosen specifically so that multiple AI
agents could work in parallel without stepping on each other's files:

1. **Plan approval gate.** `docs/TECHNICAL_PLAN.md` was written and had to be explicitly approved (`APPROVE PLAN`)
   before any application code was written. It fixed the architecture, API contract, database design, auth
   design, AI prompt design, and OWASP mapping up front.
2. **Frozen shared-types contract.** `packages/shared-types` — every request/response DTO shape — was created
   once, early, and then treated as read-only by all downstream workstreams. This is what let frontend and backend
   agents build against the same contract without ever needing to negotiate shapes mid-flight.
3. **Phased, parallel workstreams with disjoint directory ownership:**
   - **Phase 2 (frontend):** three parallel agents — shell/listings/details/Q&A UI, auth/profile UI, and the
     generator page — each owning a distinct subtree of `apps/web/src`.
   - **Phase 3 (backend):** two parallel agents — core backend (auth, users, properties, database, common
     infrastructure) and the AI module (provider abstraction, prompts, Zod schemas, the two AI endpoints) — plus a
     serial Docker/Compose pass.
   - **Phase 4 (this phase):** tests (`apps/api/test`, `apps/web/src`) and documentation
     (`README.md`, `docs/AI_WORKFLOW.md`, `docs/OWASP_SELF_ASSESSMENT.md`) in parallel, again on disjoint files.
4. **Integration/verification passes between phases:** `pnpm lint && pnpm typecheck && pnpm build` after each
   phase, followed by a live end-to-end pass — starting the real stack (Docker Postgres, the real API) and running
   `curl` against seeded data to confirm the contract actually worked, not just that it compiled.

---

## Representative prompts

Shortened, representative examples of the prompts used to drive each workstream (paraphrased from the actual
session prompts, trimmed for length):

**WS-D — AI module (Phase 3):**

> You own `apps/api/src/ai` only. Build the provider abstraction (`AiProvider` interface, `AnthropicAiProvider` as
> the only implementation, DI token `AI_PROVIDER`), the Zod schemas for both features, the prompts in
> `prompts.ts`, and the two controllers (`ask`, `generate-listing`). Do not implement an agent loop — this is
> single-shot `ChatAnthropic.withStructuredOutput`, no tools, no memory. `PropertiesService` is stubbed with the
> shape from `properties.service.ts` until integration; do not touch `auth`/`users`/`properties`. The off-topic
> refusal string must be exactly: "I can only answer questions about this property and the information in its
> listing." — verbatim, no paraphrasing, enforced via the system prompt and the Zod `.describe()` hints.

**WS-C — Auth (Phase 3):**

> Implement register/login/logout/me under `apps/api/src/auth` and `users`. Argon2id hashing. JWT in an HttpOnly
> cookie named `eai_session`, `sameSite: 'lax'`, `secure` only in production, `path: '/api'`. Login and register
> failures must use generic, enumeration-safe messages — never reveal whether an email exists. Guard `me`,
> `logout`, and (once wired) the AI endpoints with `JwtAuthGuard`; frontend route protection is UX only, this guard
> is the real enforcement.

**Phase-2 UI workstream (frontend, generator page):**

> You own exactly `apps/web/src/routes/GeneratePage.tsx`,
> `apps/web/src/features/ai/ListingGeneratorForm*`, and `apps/web/src/features/ai/GeneratedListingResult*`. Do not
> touch `features/auth`, `features/properties`, or `apps/api`. Consume the frozen types from
> `@estateai/shared-types` and the shared components from `shared/components` as interfaces only — build the
> structured form (location, price, bedrooms, bathrooms, area, property type, optional features, tone) with
> client-side validation, loading/disabled states during generation, and a copy-to-clipboard result card. The API
> may not exist yet; build against the typed client with defined error states either way.

**WS-D (Phase 4, this workstream) — documentation:**

> You own only `README.md`, `docs/AI_WORKFLOW.md`, `docs/OWASP_SELF_ASSESSMENT.md`. Every claim must be verified
> against the actual shipped code, not copied from the plan — check the real cookie name, rate limits, refusal
> string, seed count, and Swagger gating in the source before writing them down.

---

## What was reviewed manually

- **Contract-freeze decisions** — whether `packages/shared-types` genuinely covered every request/response shape
  needed before fanning out parallel agents, so no workstream would need to renegotiate the contract mid-flight.
- **Security-sensitive code paths** — guard wiring on `ask`, `generate-listing`, `me`, and `logout`; the global
  exception filter, to confirm no stack traces or provider internals could leak into a client response; the exact
  content of both system prompts, to confirm the domain lock, refusal string, and injection-handling language
  matched the plan.
- **Seed data correctness** — an early version of the seed had Tallinn districts (Kesklinn, Kadriorg, Kalamaja,
  etc.) stored as the `city` value, which silently broke the `location` filter's intended "city" semantics; this
  was corrected by moving the district into `address` and normalizing `city` to `Tallinn` (with `Tartu`/`Pärnu` for
  the non-Tallinn listings).
- **Pricing/model choice for subagents** — Claude Sonnet 5 was chosen for parallel implementation subagents on a
  cost basis (cheaper per-token than comparable tiers at the time of the build) given the work was well-scoped,
  mechanical implementation against a frozen contract rather than open-ended design.

---

## Security-related corrections made during the build

- **503-no-fallback enforced** — an early draft of the AI service risked returning a partially-parsed object on a
  schema mismatch; this was corrected so any `ZodError`, timeout, or provider error collapses to a single generic
  `503` response, never a partially trusted answer.
- **Enumeration-safe auth messages** — register and login were tightened to generic failure messages ("Unable to
  register with these details.", "Invalid email or password.") so neither endpoint reveals whether a given email
  is already registered.
- **Whitelist validation** — the global `ValidationPipe` was configured with `whitelist: true` and
  `forbidNonWhitelisted: true` so any request carrying unexpected fields is rejected outright, rather than the
  extra fields being silently dropped or, worse, passed through.
- **Generate entry points moved behind auth** — the `/generate` route (and its promo entry point) was moved behind
  `ProtectedRoute` and the corresponding backend guard late in the build, closing a gap where an anonymous user
  could reach the generator UI before hitting the auth wall on submit.

---

## What would be improved with more time (AI-workflow specific)

- An automated adversarial prompt-injection test harness (fuzzing the question/optional-features fields with known
  injection patterns) rather than the current hand-written injection-oriented test cases.
- An evaluation suite for grounding and refusal quality — sampling real model outputs against a fixed set of
  in-scope/out-of-scope questions to catch prompt regressions before they ship.
- LangSmith tracing on the two AI call sites, to get structured visibility into prompts/latency/failures beyond the
  current sanitized application logs.
