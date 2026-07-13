import { useEffect, useRef, useState } from 'react';
import type { GenerateListingResponse } from '@estateai/shared-types';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { Spinner } from '../../../shared/components/Spinner';
import { formatListingForClipboard } from './clipboard';
import type { ListingStatus } from './types';

const COPY_CONFIRMATION_MS = 2000;

export function ResultPanel({
  status,
  result,
  errorMessage,
  onRetry,
}: {
  status: ListingStatus;
  result: GenerateListingResponse | null;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  return (
    <div aria-live="polite" className="lg:sticky lg:top-6">
      {status === 'idle' && (
        <EmptyState
          title="Your generated listing will appear here"
          message="Fill in the property details on the left and generate to see a headline, description, and highlights."
        />
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Spinner size="lg" />
          <p className="text-sm text-slate-600">Writing your listing...</p>
        </div>
      )}

      {status === 'error' && (
        <ErrorState
          title="Could not generate listing"
          message={errorMessage ?? undefined}
          onRetry={onRetry}
        />
      )}

      {status === 'success' && result && <ListingResult result={result} />}
    </div>
  );
}

function ListingResult({ result }: { result: GenerateListingResponse }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatListingForClipboard(result));
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), COPY_CONFIRMATION_MS);
    } catch {
      // Clipboard access can be denied or unavailable (permissions, insecure context); ignore.
    }
  };

  const paragraphs = result.description
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{result.headline}</h2>

      <div className="flex flex-col gap-3 text-sm text-slate-700">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {result.highlights.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm text-slate-700">
          {result.highlights.map((highlight, index) => (
            <li key={index} className="flex gap-2">
              <span aria-hidden="true" className="text-emerald-600">
                •
              </span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">Target audience:</span> {result.targetAudience}
      </p>

      <div>
        <Button variant="secondary" onClick={() => void handleCopy()}>
          {copied ? 'Copied' : 'Copy listing'}
        </Button>
      </div>
    </div>
  );
}
