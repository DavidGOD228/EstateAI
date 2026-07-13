import { useState } from 'react';
import type { FormEvent } from 'react';
import * as api from '../../../shared/api/endpoints';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/components/Button';
import { Textarea } from '../../../shared/components/Input';
import { Spinner } from '../../../shared/components/Spinner';
import { MAX_QUESTION_LENGTH, SUGGESTED_QUESTIONS } from './constants';
import { QAHistoryCard } from './QAHistoryCard';
import type { QAHistoryEntry } from './QAHistoryCard';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function PropertyQAForm({ propertyId }: { propertyId: string }) {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<QAHistoryEntry[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    setPending(true);
    setError(null);

    api
      .askProperty(propertyId, { question: trimmed })
      .then((response) => {
        setHistory((prev) => [{ id: `${Date.now()}-${prev.length}`, question: trimmed, response }, ...prev]);
        setQuestion('');
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => setPending(false));
  };

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Ask AI about this property</h2>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((suggested) => (
          <button
            key={suggested}
            type="button"
            onClick={() => setQuestion(suggested)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {suggested}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          label="Your question"
          value={question}
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about this listing..."
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {question.length}/{MAX_QUESTION_LENGTH}
          </span>
          <Button type="submit" loading={pending} disabled={pending || question.trim().length === 0}>
            Ask AI
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </form>

      <div aria-live="polite" className="flex flex-col gap-4">
        {pending && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner size="sm" label="Getting answer..." />
          </div>
        )}
        {history.map((entry) => (
          <QAHistoryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </aside>
  );
}
