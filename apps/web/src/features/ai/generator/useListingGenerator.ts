import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import type { GenerateListingResponse } from '@estateai/shared-types';
import { ApiError } from '../../../shared/api/client';
import * as api from '../../../shared/api/endpoints';
import { INITIAL_VALUES } from './types';
import type { FormErrors, FormValues, ListingStatus } from './types';
import { toGenerateListingRequest, validate } from './validation';

export interface ListingGeneratorState {
  values: FormValues;
  errors: FormErrors;
  status: ListingStatus;
  result: GenerateListingResponse | null;
  errorMessage: string | null;
  setField: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  retry: () => void;
}

export function useListingGenerator(): ListingGeneratorState {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<ListingStatus>('idle');
  const [result, setResult] = useState<GenerateListingResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const submit = useCallback((formValues: FormValues) => {
    const validationErrors = validate(formValues);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('loading');
    setErrorMessage(null);

    api
      .generateListing(toGenerateListingRequest(formValues))
      .then((response) => {
        setResult(response);
        setStatus('success');
      })
      .catch((error: unknown) => {
        const message =
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
        setErrorMessage(message);
        setStatus('error');
      });
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === 'loading') return;
      submit(values);
    },
    [status, submit, values],
  );

  const retry = useCallback(() => {
    if (status === 'loading') return;
    submit(values);
  }, [status, submit, values]);

  return { values, errors, status, result, errorMessage, setField, handleSubmit, retry };
}
