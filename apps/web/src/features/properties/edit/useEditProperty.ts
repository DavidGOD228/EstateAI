import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PropertyDto } from '@estateai/shared-types';
import { ApiError } from '../../../shared/api/client';
import * as api from '../../../shared/api/endpoints';
import { toCreatePropertyRequest, validateDraft } from '../create/validation';
import type { DraftErrors, DraftValues, PublishStatus } from '../create/types';

function toDraftValues(property: PropertyDto): DraftValues {
  return {
    title: property.title,
    description: property.description,
    features: property.features,
    price: String(property.price),
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    areaSqm: String(property.areaSqm),
    propertyType: property.propertyType,
    address: property.address,
    city: property.city,
    country: property.country,
  };
}

export interface EditPropertyState {
  values: DraftValues;
  errors: DraftErrors;
  status: PublishStatus;
  errorMessage: string | null;
  setField: <K extends keyof DraftValues>(field: K, value: DraftValues[K]) => void;
  addFeature: (feature: string) => void;
  removeFeature: (feature: string) => void;
  save: () => void;
}

/**
 * Manages the owner-editable form for an existing listing, seeded from its
 * current values, and saves via `updateProperty` (PATCH). Reuses the same
 * validation rules and draft shape as the create flow (`features/properties/create`)
 * since the editable fields are identical.
 */
export function useEditProperty(property: PropertyDto): EditPropertyState {
  const navigate = useNavigate();
  const [values, setValues] = useState<DraftValues>(() => toDraftValues(property));
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

  const save = useCallback(() => {
    const validationErrors = validateDraft(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('submitting');
    setErrorMessage(null);

    api
      .updateProperty(property.id, toCreatePropertyRequest(values))
      .then((updated) => {
        navigate(`/properties/${updated.id}`);
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
        );
        setStatus('error');
      });
  }, [values, navigate, property.id]);

  return { values, errors, status, errorMessage, setField, addFeature, removeFeature, save };
}
