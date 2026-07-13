import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyFilters } from './property-filters.interface';
import { Property } from './property.entity';

export interface PropertyPage {
  items: Property[];
  total: number;
}

/**
 * Seam contract: the AI module injects this service and calls `findById`.
 * Path, class name, and the `findById` signature are kept exactly as the
 * Foundation stub specified.
 */
@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
  ) {}

  async findById(id: string): Promise<Property | null> {
    return this.propertiesRepository.findOne({ where: { id } });
  }

  async findAll(filters: PropertyFilters): Promise<PropertyPage> {
    const qb = this.propertiesRepository.createQueryBuilder('property');

    if (filters.location) {
      qb.andWhere('property.city ILIKE :location', { location: `%${filters.location}%` });
    }
    if (filters.propertyType) {
      qb.andWhere('property.propertyType = :propertyType', { propertyType: filters.propertyType });
    }
    if (filters.minBedrooms !== undefined) {
      qb.andWhere('property.bedrooms >= :minBedrooms', { minBedrooms: filters.minBedrooms });
    }
    if (filters.maxPrice !== undefined) {
      qb.andWhere('property.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    qb.orderBy('property.createdAt', 'DESC');

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
