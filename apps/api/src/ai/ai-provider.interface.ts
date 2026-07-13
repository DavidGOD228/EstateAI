import { z } from 'zod';

/**
 * Small provider abstraction so the rest of the AI module never depends on
 * a concrete model vendor. There is exactly one implementation
 * (`AnthropicAiProvider`); a future provider is a new class + DI binding.
 */
export interface AiProvider {
  generate<T extends Record<string, unknown>>(params: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
  }): Promise<T>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');

/** Thrown when a provider call exceeds `AI_TIMEOUT_MS`. Mapped to a 503 by AiService. */
export class AiTimeoutError extends Error {
  constructor(message = 'AI provider call timed out') {
    super(message);
    this.name = 'AiTimeoutError';
  }
}
