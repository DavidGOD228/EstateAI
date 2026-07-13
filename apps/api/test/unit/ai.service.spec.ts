import { ServiceUnavailableException } from '@nestjs/common';
import { AiService } from '../../src/ai/ai.service';
import { AiTimeoutError } from '../../src/ai/ai-provider.interface';
import { makeFakeAiProvider } from '../support/fake-ai-provider';
import { makeProperty } from '../support/fixtures';

const AI_UNAVAILABLE_MESSAGE = 'The AI assistant is currently unavailable. Please try again later.';

describe('AiService', () => {
  const property = makeProperty();

  describe('answerPropertyQuestion', () => {
    it('maps an AiTimeoutError from the provider to a 503 with the exact generic message', async () => {
      const aiProvider = makeFakeAiProvider();
      aiProvider.generate.mockRejectedValue(new AiTimeoutError());
      const service = new AiService(aiProvider);

      const attempt = service.answerPropertyQuestion(property, 'Does it have a balcony?');

      await expect(attempt).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(attempt).rejects.toMatchObject({ message: AI_UNAVAILABLE_MESSAGE });
    });

    it('maps a schema-invalid provider response to the same 503 (schema_error path)', async () => {
      const aiProvider = makeFakeAiProvider();
      // Missing required fields / wrong shape entirely.
      aiProvider.generate.mockResolvedValue({ notAnswer: 'nope' } as never);
      const service = new AiService(aiProvider);

      const attempt = service.answerPropertyQuestion(property, 'Does it have a balcony?');

      await expect(attempt).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(attempt).rejects.toMatchObject({ message: AI_UNAVAILABLE_MESSAGE });
    });

    it('passes a schema-valid provider response through unchanged', async () => {
      const validResult = {
        answer: 'Yes, the listing mentions a balcony.',
        highlights: ['balcony'],
        caveats: [],
        confidence: 'high' as const,
      };
      const aiProvider = makeFakeAiProvider();
      aiProvider.generate.mockResolvedValue(validResult);
      const service = new AiService(aiProvider);

      const result = await service.answerPropertyQuestion(property, 'Does it have a balcony?');

      expect(result).toEqual(validResult);
    });

    it('maps a generic provider error (non-timeout) to the same 503 message', async () => {
      const aiProvider = makeFakeAiProvider();
      aiProvider.generate.mockRejectedValue(new Error('anthropic 500'));
      const service = new AiService(aiProvider);

      await expect(service.answerPropertyQuestion(property, 'Does it have a balcony?')).rejects.toMatchObject({
        message: AI_UNAVAILABLE_MESSAGE,
      });
    });
  });

  describe('generateListing', () => {
    const input = {
      location: 'Kadriorg, Tallinn',
      price: 245000,
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 68,
      propertyType: 'apartment' as const,
    };

    it('passes a schema-valid listing response through unchanged', async () => {
      const validResult = {
        headline: 'Bright flat in Kadriorg',
        description: 'A bright two-bedroom flat close to the park.',
        highlights: ['Close to Kadriorg park', 'Two bedrooms'],
        targetAudience: 'Suits buyers looking for a quiet central flat.',
      };
      const aiProvider = makeFakeAiProvider();
      aiProvider.generate.mockResolvedValue(validResult);
      const service = new AiService(aiProvider);

      const result = await service.generateListing(input);

      expect(result).toEqual(validResult);
    });

    it('maps a malformed provider response to the generic 503', async () => {
      const aiProvider = makeFakeAiProvider();
      aiProvider.generate.mockResolvedValue({ headline: 123 } as never);
      const service = new AiService(aiProvider);

      await expect(service.generateListing(input)).rejects.toMatchObject({ message: AI_UNAVAILABLE_MESSAGE });
    });
  });
});
