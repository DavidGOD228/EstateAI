import type { CreatePropertyRequest, PropertyType } from '@estateai/shared-types';
import {
  DEFAULT_COUNTRY,
  MAX_ADDRESS_LENGTH,
  MAX_CITY_LENGTH,
  MAX_COUNTRY_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_FEATURES,
  MAX_FEATURE_LENGTH,
  MAX_ROOMS,
  MAX_TITLE_LENGTH,
} from './types';
import type { DraftErrors, DraftValues } from './types';

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

export function validateDraft(values: DraftValues): DraftErrors {
  const errors: DraftErrors = {};

  const title = values.title.trim();
  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;
  }

  const description = values.description.trim();
  if (!description) {
    errors.description = 'Description is required.';
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
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

  const address = values.address.trim();
  if (!address) {
    errors.address = 'Address is required.';
  } else if (address.length > MAX_ADDRESS_LENGTH) {
    errors.address = `Address must be ${MAX_ADDRESS_LENGTH} characters or fewer.`;
  }

  const city = values.city.trim();
  if (!city) {
    errors.city = 'City is required.';
  } else if (city.length > MAX_CITY_LENGTH) {
    errors.city = `City must be ${MAX_CITY_LENGTH} characters or fewer.`;
  }

  const country = values.country.trim();
  if (!country) {
    errors.country = 'Country is required.';
  } else if (country.length > MAX_COUNTRY_LENGTH) {
    errors.country = `Country must be ${MAX_COUNTRY_LENGTH} characters or fewer.`;
  }

  if (values.features.length > MAX_FEATURES) {
    errors.features = `Keep it to ${MAX_FEATURES} feature tags or fewer.`;
  }

  return errors;
}

/** Validates a candidate feature tag before it's added to the chip list. */
export function validateNewFeature(
  candidate: string,
  existing: string[],
): string | null {
  const trimmed = candidate.trim();
  if (!trimmed) return 'Enter a feature to add.';
  if (trimmed.length > MAX_FEATURE_LENGTH) {
    return `Feature tags must be ${MAX_FEATURE_LENGTH} characters or fewer.`;
  }
  if (existing.length >= MAX_FEATURES) {
    return `You can add up to ${MAX_FEATURES} feature tags.`;
  }
  if (existing.some((feature) => feature.toLowerCase() === trimmed.toLowerCase())) {
    return 'That feature is already in the list.';
  }
  return null;
}

export function toCreatePropertyRequest(values: DraftValues): CreatePropertyRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    address: values.address.trim(),
    city: values.city.trim(),
    country: values.country.trim() || DEFAULT_COUNTRY,
    bedrooms: Number(values.bedrooms),
    bathrooms: Number(values.bathrooms),
    areaSqm: Number(values.areaSqm),
    propertyType: values.propertyType as PropertyType,
    features: values.features,
  };
}
