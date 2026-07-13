import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GenerateListingResponse } from '@estateai/shared-types';
import { ApiError } from '../../../shared/api/client';
import * as api from '../../../shared/api/endpoints';
import type { FormValues } from '../../ai/generator/types';
import { deriveAddressCity } from './deriveAddress';
import { DEFAULT_COUNTRY } from './types';
import type { DraftErrors, DraftValues, PublishStatus } from './types';
import { toCreatePropertyRequest, validateDraft } from './validation';

function buildInitialDraft(result: GenerateListingResponse, formValues: FormValues): DraftValues {
  const { address, city } = deriveAddressCity(formValues.location);
  return {
    title: result.headline,
    description: result.description,
    features: result.highlights.slice(0, 10),
    price: formValues.price,
    bedrooms: formValues.bedrooms,
    bathrooms: formValues.bathrooms,
    areaSqm: formValues.areaSqm,
    propertyType: formValues.propertyType,
    address,
    city,
    country: DEFAULT_COUNTRY,
  };
}

export interface DraftPublishState {
  values: DraftValues;
  errors: DraftErrors;
  status: PublishStatus;
  errorMessage: string | null;
  setField: <K extends keyof DraftValues>(field: K, value: DraftValues[K]) => void;
  addFeature: (feature: string) => void;
  removeFeature: (feature: string) => void;
  publish: () => void;
}

/** Manages the editable draft seeded from a generated listing, and publishes it via createProperty. */
export function useDraftPublish(
  result: GenerateListingResponse,
  formValues: FormValues,
): DraftPublishState {
  const navigate = useNavigate();
  const [values, setValues] = useState<DraftValues>(() => buildInitialDraft(result, formValues));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [status, setStatus] = useState<PublishStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof DraftValues>(field: K, value: DraftValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const addFeature = useCallback((feature: string) => {
    setValues((prev) => ({ ...prev, features: [...prev.features, feature] }));
    setErrors((prev) => {
      if (!prev.features) return prev;
      const next = { ...prev };
      delete next.features;
      return next;
    });
  }, []);

  const removeFeature = useCallback((feature: string) => {
    setValues((prev) => ({ ...prev, features: prev.features.filter((f) => f !== feature) }));
  }, []);

  const publish = useCallback(() => {
    const validationErrors = validateDraft(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('submitting');
    setErrorMessage(null);

    api
      .createProperty(toCreatePropertyRequest(values))
      .then((property) => {
        navigate(`/properties/${property.id}`);
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
        );
        setStatus('error');
      });
  }, [values, navigate]);

  return { values, errors, status, errorMessage, setField, addFeature, removeFeature, publish };
}
