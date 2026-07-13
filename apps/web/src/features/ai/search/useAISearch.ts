import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import type { PropertySearchMatch } from '@estateai/shared-types';
import { ApiError } from '../../../shared/api/client';
import * as api from '../../../shared/api/endpoints';
import { MIN_QUERY_LENGTH } from './constants';

export type AISearchStatus = 'idle' | 'loading' | 'success' | 'error';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export interface AISearchState {
  query: string;
  submittedQuery: string;
  status: AISearchStatus;
  /** True once a search has been submitted; drives replacing the normal grid. */
  active: boolean;
  summary: string | null;
  matches: PropertySearchMatch[];
  errorMessage: string | null;
  setQuery: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  retry: () => void;
  clear: () => void;
}

/** Drives the "AI search" bar on the homepage: submits a free-text query and ranks matching listings. */
export function useAISearch(): AISearchState {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [status, setStatus] = useState<AISearchStatus>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const [matches, setMatches] = useState<PropertySearchMatch[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSearch = useCallback((trimmedQuery: string) => {
    setSubmittedQuery(trimmedQuery);
    setStatus('loading');
    setErrorMessage(null);

    api
      .searchProperties({ query: trimmedQuery })
      .then((response) => {
        setSummary(response.summary);
        setMatches(response.matches);
        setStatus('success');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setErrorMessage(error instanceof ApiError ? error.message : DEFAULT_ERROR_MESSAGE);
      });
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === 'loading') return;
      const trimmed = query.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) return;
      runSearch(trimmed);
    },
    [query, status, runSearch],
  );

  const retry = useCallback(() => {
    if (status === 'loading' || !submittedQuery) return;
    runSearch(submittedQuery);
  }, [status, submittedQuery, runSearch]);

  const clear = useCallback(() => {
    setStatus('idle');
    setQuery('');
    setSubmittedQuery('');
    setSummary(null);
    setMatches([]);
    setErrorMessage(null);
  }, []);

  return {
    query,
    submittedQuery,
    status,
    active: status !== 'idle',
    summary,
    matches,
    errorMessage,
    setQuery,
    handleSubmit,
    retry,
    clear,
  };
}
