import { Property } from '../../src/properties/property.entity';
import { PropertyFilters } from '../../src/properties/property-filters.interface';
import { PropertyPage } from '../../src/properties/properties.service';

/**
 * Stand-in for `PropertiesService` (overridden by class token, per the
 * assignment's suggested "simplest robust path"), backed by a plain array
 * instead of a TypeORM repository/query builder. Reimplements the same
 * filter semantics as the real service so `GET /api/properties` e2e
 * assertions stay meaningful.
 */
export class FakePropertiesService {
  private rows: Property[] = [];

  seed(properties: Property[]): void {
    this.rows = [...properties];
  }

  clear(): void {
    this.rows = [];
  }

  async findById(id: string): Promise<Property | null> {
    return this.rows.find((property) => property.id === id) ?? null;
  }

  async findAll(filters: PropertyFilters): Promise<PropertyPage> {
    let items = [...this.rows];

    if (filters.location) {
      const needle = filters.location.toLowerCase();
      items = items.filter((property) => property.city.toLowerCase().includes(needle));
    }
    if (filters.propertyType) {
      items = items.filter((property) => property.propertyType === filters.propertyType);
    }
    if (filters.minBedrooms !== undefined) {
      items = items.filter((property) => property.bedrooms >= filters.minBedrooms!);
    }
    if (filters.maxPrice !== undefined) {
      items = items.filter((property) => property.price <= filters.maxPrice!);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items, total: items.length };
  }
}
