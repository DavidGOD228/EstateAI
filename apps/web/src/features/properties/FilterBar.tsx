import type { ChangeEvent } from 'react';
import type { PropertyType } from '@estateai/shared-types';
import { Input, Select } from '../../shared/components/Input';
import { MIN_BEDROOMS_OPTIONS, PROPERTY_TYPE_OPTIONS } from './types';
import type { PropertyFiltersState } from './types';

export function FilterBar({
  filters,
  onChange,
}: {
  filters: PropertyFiltersState;
  onChange: (next: PropertyFiltersState) => void;
}) {
  const handleLocation = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...filters, location: event.target.value });

  const handlePropertyType = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, propertyType: event.target.value as PropertyType | '' });

  const handleMinBedrooms = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, minBedrooms: event.target.value === '' ? '' : Number(event.target.value) });

  const handleMaxPrice = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...filters, maxPrice: event.target.value });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <Input
        label="Location"
        placeholder="City or area"
        value={filters.location}
        maxLength={120}
        onChange={handleLocation}
      />
      <Select label="Property type" value={filters.propertyType} onChange={handlePropertyType}>
        {PROPERTY_TYPE_OPTIONS.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Select label="Min bedrooms" value={filters.minBedrooms} onChange={handleMinBedrooms}>
        {MIN_BEDROOMS_OPTIONS.map((option) => (
          <option key={option.value === '' ? 'any' : option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        label="Max price (EUR)"
        type="number"
        min={0}
        step={1000}
        inputMode="numeric"
        placeholder="Any"
        value={filters.maxPrice}
        onChange={handleMaxPrice}
      />
    </div>
  );
}
