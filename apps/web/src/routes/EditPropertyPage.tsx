import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { PropertyDto } from '@estateai/shared-types';
import { EditPropertyForm } from '../features/properties/edit/EditPropertyForm';
import * as api from '../shared/api/endpoints';
import { ApiError } from '../shared/api/client';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorState } from '../shared/components/ErrorState';
import { Skeleton } from '../shared/components/Skeleton';

type LoadState =
  | { status: 'loading' }
  | { status: 'success'; property: PropertyDto }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'error'; message: string };

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setState({ status: 'not-found' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    api
      .getProperty(id)
      .then((property) => {
        if (cancelled) return;
        // Owner-only server-side too; this only avoids flashing the form for
        // a listing the current user can't actually edit.
        if (!property.isOwn) {
          setState({ status: 'forbidden' });
          return;
        }
        setState({ status: 'success', property });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
          setState({ status: 'not-found' });
        } else if (error instanceof ApiError && error.status === 403) {
          setState({ status: 'forbidden' });
        } else {
          setState({
            status: 'error',
            message: error instanceof ApiError ? error.message : DEFAULT_ERROR_MESSAGE,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, retryToken]);

  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  if (state.status === 'forbidden') {
    return <Navigate to={id ? `/properties/${id}` : '/'} replace />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {id && (
        <Link
          to={`/properties/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Back to listing
        </Link>
      )}

      {state.status === 'loading' && <Skeleton className="h-96 w-full" />}

      {state.status === 'not-found' && (
        <EmptyState
          title="Property not found"
          message="This listing may have been removed or the link is incorrect."
        />
      )}

      {state.status === 'error' && (
        <ErrorState title="Couldn't load this property" message={state.message} onRetry={retry} />
      )}

      {state.status === 'success' && <EditPropertyForm property={state.property} />}
    </div>
  );
}
