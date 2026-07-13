import type { GenerateListingResponse } from '@estateai/shared-types';

export function formatListingForClipboard(result: GenerateListingResponse): string {
  const lines = [
    result.headline,
    '',
    result.description,
    '',
    'Highlights:',
    ...result.highlights.map((highlight) => `- ${highlight}`),
    '',
    `Target audience: ${result.targetAudience}`,
  ];
  return lines.join('\n');
}
