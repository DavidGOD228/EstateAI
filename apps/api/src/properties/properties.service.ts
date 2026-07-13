import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
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

  /**
   * POST /api/properties: publishes a user-created listing. `externalRef`
   * is generated here (not user-supplied) since the column is unique and
   * seeded rows use a different naming scheme entirely.
   */
  async create(dto: CreatePropertyDto, ownerId: string): Promise<Property> {
    const property = this.propertiesRepository.create({
      ...dto,
      externalRef: `user-${randomUUID()}`,
      ownerId,
    });
    return this.propertiesRepository.save(property);
  }

  /** Candidate pool for AI contextual search: most recent listings, capped. */
  async findRecent(limit: number): Promise<Property[]> {
    return this.propertiesRepository.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  /**
   * PATCH /api/properties/:id: ownership is already verified by the caller.
   * Only fields present on `dto` (i.e. not `undefined`) are merged, so a
   * partial payload never clobbers untouched columns.
   */
  async update(property: Property, dto: UpdatePropertyDto): Promise<Property> {
    const definedFields = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
    Object.assign(property, definedFields);
    return this.propertiesRepository.save(property);
  }

  /** DELETE /api/properties/:id: ownership is already verified by the caller. */
  async remove(property: Property): Promise<void> {
    await this.propertiesRepository.remove(property);
  }
}
