import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { AiProvider, AiTimeoutError } from './ai-provider.interface';

/**
 * Only implementation of `AiProvider`. Wraps `ChatAnthropic` +
 * `withStructuredOutput`, enforcing `AI_TIMEOUT_MS` with a `Promise.race`
 * in addition to the client-level timeout.
 */
@Injectable()
export class AnthropicAiProvider implements AiProvider {
  private readonly model: ChatAnthropic;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.timeoutMs = Number(this.configService.get<string | number>('AI_TIMEOUT_MS') ?? 20000);

    this.model = new ChatAnthropic({
      model: this.configService.get<string>('AI_MODEL'),
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
      maxRetries: 0,
      clientOptions: {
        timeout: this.timeoutMs,
      },
    });
  }

  async generate<T extends Record<string, unknown>>(params: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
  }): Promise<T> {
    const structuredModel = this.model.withStructuredOutput<T>(params.schema);

    const invocation = structuredModel.invoke([new SystemMessage(params.system), new HumanMessage(params.user)]);

    return this.raceAgainstTimeout(invocation);
  }

  private raceAgainstTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new AiTimeoutError());
      }, this.timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}
