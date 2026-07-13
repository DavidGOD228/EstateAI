import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PropertyDto } from '@estateai/shared-types';
import { PropertyQA } from '../features/ai/qa/PropertyQA';
import { PropertyImagePlaceholder } from '../features/properties/PropertyImagePlaceholder';
import { formatPrice } from '../features/properties/formatPrice';
import * as api from '../shared/api/endpoints';
import { ApiError } from '../shared/api/client';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorState } from '../shared/components/ErrorState';
import { Skeleton } from '../shared/components/Skeleton';

type LoadState =
  | { status: 'loading' }
  | { status: 'success'; property: PropertyDto }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const BackLink = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
  >
    ← Back to listings
  </Link>
);

export function PropertyDetailsPage() {
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
        if (!cancelled) setState({ status: 'success', property });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
          setState({ status: 'not-found' });
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

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      {state.status === 'loading' && <PropertyDetailsSkeleton />}

      {state.status === 'not-found' && (
        <EmptyState
          title="Property not found"
          message="This listing may have been removed or the link is incorrect."
          action={<BackLink />}
        />
      )}

      {state.status === 'error' && (
        <ErrorState title="Couldn't load this property" message={state.message} onRetry={retry} />
      )}

      {state.status === 'success' && <PropertyDetailsContent property={state.property} />}
    </div>
  );
}

function PropertyDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Skeleton className="aspect-[16/9] w-full" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

function PropertyDetailsContent({ property }: { property: PropertyDto }) {
  const { id, title, description, price, address, city, country, bedrooms, bathrooms, areaSqm, propertyType, features } =
    property;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <PropertyImagePlaceholder propertyType={propertyType} className="aspect-[16/9] w-full rounded-xl" />

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {address}, {city}, {country}
          </p>
        </div>

        <p className="text-3xl font-semibold text-emerald-700">{formatPrice(price)}</p>

        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
          <PropertySpec label="Bedrooms" value={bedrooms} />
          <PropertySpec label="Bathrooms" value={bathrooms} />
          <PropertySpec label="Area" value={`${areaSqm} m\u00b2`} />
          <PropertySpec label="Type" value={propertyType} />
        </dl>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{description}</p>
        </div>

        {features.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Features</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <PropertyQA propertyId={id} />
    </div>
  );
}

function PropertySpec({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold capitalize text-slate-900">{value}</dd>
    </div>
  );
}
