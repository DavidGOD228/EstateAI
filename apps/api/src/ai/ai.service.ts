import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { z } from 'zod';
import { Property } from '../properties/property.entity';
import { AI_PROVIDER, AiProvider, AiTimeoutError } from './ai-provider.interface';
import { GenerateListingDto } from './dto/generate-listing.dto';
import {
  buildGenerateListingSystemPrompt,
  buildGenerateListingUserMessage,
  buildPropertyQaSystemPrompt,
  buildPropertyQaUserMessage,
} from './prompts';
import { listingSchema, ListingResult, propertyQaSchema, PropertyQaResult } from './schemas';

const AI_UNAVAILABLE_MESSAGE = 'The AI assistant is currently unavailable. Please try again later.';

type AiFailureCategory = 'timeout' | 'provider_error' | 'schema_error';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}

  async answerPropertyQuestion(property: Property, question: string): Promise<PropertyQaResult> {
    const system = buildPropertyQaSystemPrompt();
    const user = buildPropertyQaUserMessage(property, question);

    return this.generateSafely(propertyQaSchema, system, user);
  }

  async generateListing(input: GenerateListingDto): Promise<ListingResult> {
    const tone = input.tone ?? 'professional';
    const system = buildGenerateListingSystemPrompt(tone);
    const user = buildGenerateListingUserMessage({
      location: input.location,
      price: input.price,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      areaSqm: input.areaSqm,
      propertyType: input.propertyType,
      optionalFeatures: input.optionalFeatures,
      tone,
    });

    return this.generateSafely(listingSchema, system, user);
  }

  private async generateSafely<T extends Record<string, unknown>>(schema: z.ZodType<T>, system: string, user: string): Promise<T> {
    try {
      const result = await this.aiProvider.generate<T>({ system, user, schema });
      // Defense in depth: never trust the provider's own validation alone.
      return schema.parse(result);
    } catch (error: unknown) {
      const category: AiFailureCategory = this.categorize(error);
      this.logger.error(`AI request failed: ${category}`);
      throw new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
    }
  }

  private categorize(error: unknown): AiFailureCategory {
    if (error instanceof AiTimeoutError) {
      return 'timeout';
    }
    if (error instanceof z.ZodError) {
      return 'schema_error';
    }
    return 'provider_error';
  }
}
