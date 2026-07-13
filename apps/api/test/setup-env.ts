/**
 * Runs once per test file, before the test framework and any test module
 * loads `ConfigModule` — every value here satisfies
 * `src/config/env.validation.ts` so `AppModule`'s `ConfigModule.forRoot`
 * boots cleanly with no real Postgres/Anthropic credentials.
 *
 * `AI_RATE_LIMIT_LIMIT` is intentionally generous: the assignment's AI e2e
 * coverage list exercises `/api/properties/:id/ask` and
 * `/api/ai/generate-listing` enough times in one file to trip the
 * production default (10/60s) — rate-limiting behavior itself isn't part of
 * the required coverage, so this avoids flaky 429s without touching
 * production code or config.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/estateai_test';

process.env.JWT_SECRET = 'test-jwt-secret-32-characters-min!!';
process.env.JWT_EXPIRES_IN = '2h';
process.env.COOKIE_SECRET = 'test-cookie-secret-32-characters!!';

process.env.AI_PROVIDER = 'anthropic';
process.env.AI_MODEL = 'test-model';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.AI_TIMEOUT_MS = '20000';
process.env.AI_RATE_LIMIT_TTL_MS = '60000';
process.env.AI_RATE_LIMIT_LIMIT = '1000';
