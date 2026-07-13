import type { PropertyType, Tone } from '@estateai/shared-types';

export interface FormValues {
  location: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  propertyType: PropertyType | '';
  optionalFeatures: string;
  tone: Tone;
}

export type FormErrors = Partial<Record<keyof FormValues, string>>;

export type ListingStatus = 'idle' | 'loading' | 'success' | 'error';

export const INITIAL_VALUES: FormValues = {
  location: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  areaSqm: '',
  propertyType: '',
  optionalFeatures: '',
  tone: 'professional',
};
