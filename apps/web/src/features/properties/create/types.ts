import type { PropertyType } from '@estateai/shared-types';

export interface DraftValues {
  title: string;
  description: string;
  features: string[];
  price: string;
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  propertyType: PropertyType | '';
  address: string;
  city: string;
  country: string;
}

export type DraftErrors = Partial<Record<keyof DraftValues, string>> & { featureInput?: string };

export type PublishStatus = 'idle' | 'submitting' | 'error';

export const MAX_TITLE_LENGTH = 160;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MAX_FEATURES = 10;
export const MAX_FEATURE_LENGTH = 80;
export const MAX_ROOMS = 20;
export const MAX_CITY_LENGTH = 80;
export const MAX_COUNTRY_LENGTH = 80;
export const MAX_ADDRESS_LENGTH = 200;
export const DEFAULT_COUNTRY = 'Estonia';
