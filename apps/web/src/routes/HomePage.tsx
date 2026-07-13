import { useState } from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorState } from '../shared/components/ErrorState';
import { FilterBar } from '../features/properties/FilterBar';
import { PromoBanner } from '../features/properties/PromoBanner';
import { PropertyCard } from '../features/properties/PropertyCard';
import { PropertyCardSkeleton } from '../features/properties/PropertyCardSkeleton';
import { DEFAULT_FILTERS } from '../features/properties/types';
import type { PropertyFiltersState } from '../features/properties/types';
import { useDebouncedValue } from '../features/properties/useDebouncedValue';
import { useProperties } from '../features/properties/useProperties';

function parseMaxPrice(raw: string): number | '' {
  if (raw.trim() === '') return '';
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? '' : parsed;
}

export function HomePage() {
  const [filters, setFilters] = useState<PropertyFiltersState>(DEFAULT_FILTERS);
  const debouncedLocation = useDebouncedValue(filters.location, 400);
  const debouncedMaxPrice = useDebouncedValue(filters.maxPrice, 400);

  const { items, status, errorMessage, retry } = useProperties({
    location: debouncedLocation,
    propertyType: filters.propertyType,
    minBedrooms: filters.minBedrooms,
    maxPrice: parseMaxPrice(debouncedMaxPrice),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Find your next home</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse current listings and filter by location, type, size, and budget.
        </p>
      </div>

      <PromoBanner />

      <FilterBar filters={filters} onChange={setFilters} />

      {status === 'loading' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <ErrorState
          title="Couldn't load properties"
          message={errorMessage ?? undefined}
          onRetry={retry}
        />
      )}

      {status === 'success' && items.length === 0 && (
        <EmptyState
          title="No properties match your filters"
          message="Try widening your search criteria."
        />
      )}

      {status === 'success' && items.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
