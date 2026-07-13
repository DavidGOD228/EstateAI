import type { AskQuestionResponse, Confidence } from '@estateai/shared-types';

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

export interface QAHistoryEntry {
  id: string;
  question: string;
  response: AskQuestionResponse;
}

export function QAHistoryCard({ entry }: { entry: QAHistoryEntry }) {
  const { question, response } = entry;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">{question}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${CONFIDENCE_STYLES[response.confidence]}`}
        >
          {response.confidence}
        </span>
      </div>

      <p className="text-sm whitespace-pre-line text-slate-700">{response.answer}</p>

      {response.highlights.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {response.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}

      {response.caveats.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-700">Keep in mind</p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-amber-700">
            {response.caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
