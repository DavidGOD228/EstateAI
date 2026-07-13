import type { DraftValues } from './types';

export function formatDraftForClipboard(draft: DraftValues, targetAudience?: string): string {
  const lines = [
    draft.title,
    '',
    draft.description,
    '',
    'Features:',
    ...draft.features.map((feature) => `- ${feature}`),
    ...(targetAudience ? ['', `Target audience: ${targetAudience}`] : []),
  ];
  return lines.join('\n');
}
