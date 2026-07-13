import { z } from 'zod';

/**
 * Structured output contract for the Property Q&A feature.
 * Mirrors `AskQuestionResponse` in packages/shared-types.
 */
export const propertyQaSchema = z.object({
  answer: z
    .string()
    .describe(
      'The direct answer to the user question, grounded strictly in the supplied property DATA. ' +
        'If the question is out of scope, this must be exactly: ' +
        '"I can only answer questions about this property and the information in its listing."',
    ),
  highlights: z
    .array(z.string())
    .describe(
      'Short bullet points (0-5) of property facts directly relevant to the answer. Empty array if not applicable or out of scope.',
    ),
  caveats: z
    .array(z.string())
    .describe(
      'Short notes (0-5) about missing information, assumptions, or limits of the answer. Empty array if not applicable or out of scope.',
    ),
  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe(
      'How confident the answer is given the available listing data: "high" when directly supported by the DATA, ' +
        '"medium" for reasonable inference, "low" when data is thin. Use "high" for the out-of-scope refusal.',
    ),
});

export type PropertyQaResult = z.infer<typeof propertyQaSchema>;

/**
 * Structured output contract for the Smart Listing Generator feature.
 * Mirrors `GenerateListingResponse` in packages/shared-types.
 */
export const listingSchema = z.object({
  headline: z
    .string()
    .describe('A short, plain-text marketing headline (no HTML/markdown) for the listing, based only on supplied fields.'),
  description: z
    .string()
    .describe(
      'A plain-text marketing description (no HTML/markdown) of 2-4 sentences using only the supplied structured fields and optionalFeatures.',
    ),
  highlights: z
    .array(z.string())
    .describe('3-6 short plain-text bullet points highlighting the property based only on supplied fields.'),
  targetAudience: z
    .string()
    .describe(
      'A short plain-text description of the kind of buyer/renter this property suits, based on its features ' +
        '(never a statement about who is allowed or welcome to live there).',
    ),
});

export type ListingResult = z.infer<typeof listingSchema>;
