import type { PropertyType } from '@estateai/shared-types';

/** Filter form state. Kept as strings/`''` where inputs are text-based so fields can be empty. */
export interface PropertyFiltersState {
  location: string;
  propertyType: PropertyType | '';
  minBedrooms: number | '';
  maxPrice: string;
}

export const DEFAULT_FILTERS: PropertyFiltersState = {
  location: '',
  propertyType: '',
  minBedrooms: '',
  maxPrice: '',
};

export const PROPERTY_TYPE_OPTIONS: ReadonlyArray<{ value: PropertyType | ''; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'townhouse', label: 'Townhouse' },
];

export const MIN_BEDROOMS_OPTIONS: ReadonlyArray<{ value: number | ''; label: string }> = [
  { value: '', label: 'Any' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
];
