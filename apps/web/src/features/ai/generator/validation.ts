import type { GenerateListingRequest, PropertyType } from '@estateai/shared-types';
import { containsProfanity, PROFANITY_VIOLATION_MESSAGE } from '../../../shared/utils/profanity';
import type { FormErrors, FormValues } from './types';

export const MAX_LOCATION_LENGTH = 120;
export const MAX_FEATURES_LENGTH = 1000;
export const MAX_ROOMS = 20;

function isValidInteger(value: string, min: number, max: number): boolean {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= min && n <= max;
}

function isPositiveNumber(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0;
}

export function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const location = values.location.trim();
  if (!location) {
    errors.location = 'Location is required.';
  } else if (location.length > MAX_LOCATION_LENGTH) {
    errors.location = `Location must be ${MAX_LOCATION_LENGTH} characters or fewer.`;
  } else if (containsProfanity(location)) {
    errors.location = PROFANITY_VIOLATION_MESSAGE;
  }

  if (!isPositiveNumber(values.price)) {
    errors.price = 'Enter a price greater than 0.';
  }

  if (!isValidInteger(values.bedrooms, 0, MAX_ROOMS)) {
    errors.bedrooms = `Enter a whole number of bedrooms (0-${MAX_ROOMS}).`;
  }

  if (!isValidInteger(values.bathrooms, 0, MAX_ROOMS)) {
    errors.bathrooms = `Enter a whole number of bathrooms (0-${MAX_ROOMS}).`;
  }

  if (!isPositiveNumber(values.areaSqm)) {
    errors.areaSqm = 'Enter a size greater than 0.';
  }

  if (!values.propertyType) {
    errors.propertyType = 'Select a property type.';
  }

  if (values.optionalFeatures.length > MAX_FEATURES_LENGTH) {
    errors.optionalFeatures = `Keep optional features under ${MAX_FEATURES_LENGTH} characters.`;
  } else if (containsProfanity(values.optionalFeatures)) {
    errors.optionalFeatures = PROFANITY_VIOLATION_MESSAGE;
  }

  return errors;
}

export function toGenerateListingRequest(values: FormValues): GenerateListingRequest {
  const optionalFeatures = values.optionalFeatures.trim();
  return {
    location: values.location.trim(),
    price: Number(values.price),
    bedrooms: Number(values.bedrooms),
    bathrooms: Number(values.bathrooms),
    areaSqm: Number(values.areaSqm),
    propertyType: values.propertyType as PropertyType,
    ...(optionalFeatures ? { optionalFeatures } : {}),
    tone: values.tone,
  };
}
