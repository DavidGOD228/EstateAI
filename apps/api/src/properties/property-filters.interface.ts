import { PropertyType } from './property.entity';

export interface PropertyFilters {
  /** Matches against city, case-insensitive substring. */
  location?: string;
  propertyType?: PropertyType;
  minBedrooms?: number;
  maxPrice?: number;
}
