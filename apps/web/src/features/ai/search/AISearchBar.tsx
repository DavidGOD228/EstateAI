import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from './constants';

export function AISearchBar({
  query,
  pending,
  onQueryChange,
  onSubmit,
}: {
  query: string;
  pending: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { status } = useAuth();

  if (status !== 'authenticated') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <span aria-hidden="true" className="text-emerald-600">
          ✨
        </span>
        <p>
          <Link
            to="/login"
            state={{ from: '/' }}
            className="font-medium text-emerald-700 hover:underline"
          >
            Log in
          </Link>{' '}
          to use AI search.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <Input
          label="AI search"
          placeholder="Describe what you're looking for…"
          maxLength={MAX_QUERY_LENGTH}
          value={query}
          disabled={pending}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <Button
        type="submit"
        loading={pending}
        disabled={pending || query.trim().length < MIN_QUERY_LENGTH}
      >
        <span aria-hidden="true">✨</span> Search with AI
      </Button>
    </form>
  );
}
