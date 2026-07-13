import * as Joi from 'joi';

/**
 * Fail-fast environment validation (docs/TECHNICAL_PLAN.md §19/§24). Runs
 * once at boot via ConfigModule.forRoot({ validationSchema }); an invalid or
 * missing required var aborts startup with a clear message instead of a
 * silent misconfiguration or a fake fallback at request time.
 *
 * `.unknown(true)` is required because Joi validates the *entire*
 * process.env object, which contains many unrelated shell/OS variables.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),

  DATABASE_URL: Joi.string().uri({ scheme: [/postgres/] }).required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('2h'),
  COOKIE_SECRET: Joi.string().min(16).required(),

  AI_PROVIDER: Joi.string().default('anthropic'),
  AI_MODEL: Joi.string().required(),
  ANTHROPIC_API_KEY: Joi.string().min(1).required(),
  AI_TIMEOUT_MS: Joi.number().default(20000),
  AI_MAX_QUESTION_LENGTH: Joi.number().default(500),
  AI_MAX_OPTIONAL_FEATURES_LENGTH: Joi.number().default(1000),
  AI_RATE_LIMIT_TTL_MS: Joi.number().default(60000),
  AI_RATE_LIMIT_LIMIT: Joi.number().default(10),
}).unknown(true);
