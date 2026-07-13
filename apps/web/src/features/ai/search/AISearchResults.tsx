import type { PropertySearchMatch } from '@estateai/shared-types';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { PropertyCard } from '../../properties/PropertyCard';
import { PropertyCardSkeleton } from '../../properties/PropertyCardSkeleton';
import type { AISearchStatus } from './useAISearch';

export function AISearchResults({
  status,
  query,
  summary,
  matches,
  errorMessage,
  onRetry,
  onClear,
}: {
  status: AISearchStatus;
  query: string;
  summary: string | null;
  matches: PropertySearchMatch[];
  errorMessage: string | null;
  onRetry: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          AI results for: &ldquo;{query}&rdquo;
        </span>
        <Button variant="ghost" onClick={onClear}>
          Clear AI search
        </Button>
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <ErrorState title="AI search failed" message={errorMessage ?? undefined} onRetry={onRetry} />
      )}

      {status === 'success' && matches.length === 0 && (
        <EmptyState title="No matches found" message={summary ?? 'Try describing what you need differently.'} />
      )}

      {status === 'success' && matches.length > 0 && (
        <div className="flex flex-col gap-4">
          {summary && <p className="text-sm text-slate-700">{summary}</p>}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <div key={match.property.id} className="flex flex-col gap-2">
                <PropertyCard property={match.property} />
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <span className="font-medium">Why it matches:</span> {match.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
