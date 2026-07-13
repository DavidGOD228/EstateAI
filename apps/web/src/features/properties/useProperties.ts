import { useCallback, useEffect, useState } from 'react';
import type { PropertyDto, PropertyType } from '@estateai/shared-types';
import * as api from '../../shared/api/endpoints';
import { ApiError } from '../../shared/api/client';

export interface PropertiesQueryInput {
  location: string;
  propertyType: PropertyType | '';
  minBedrooms: number | '';
  maxPrice: number | '';
}

export type PropertiesStatus = 'loading' | 'success' | 'error';

export interface UsePropertiesResult {
  items: PropertyDto[];
  total: number;
  status: PropertiesStatus;
  errorMessage: string | null;
  retry: () => void;
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/** Fetches the property list for the given filters, refetching whenever they change. */
export function useProperties(input: PropertiesQueryInput): UsePropertiesResult {
  const { location, propertyType, minBedrooms, maxPrice } = input;
  const [items, setItems] = useState<PropertyDto[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<PropertiesStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setErrorMessage(null);

    api
      .getProperties({
        location: location || undefined,
        propertyType: propertyType || undefined,
        minBedrooms: minBedrooms === '' ? undefined : minBedrooms,
        maxPrice: maxPrice === '' ? undefined : maxPrice,
      })
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setStatus('error');
        setErrorMessage(error instanceof ApiError ? error.message : DEFAULT_ERROR_MESSAGE);
      });

    return () => {
      cancelled = true;
    };
  }, [location, propertyType, minBedrooms, maxPrice, retryToken]);

  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  return { items, total, status, errorMessage, retry };
}
