import { ApiProperty } from '@nestjs/swagger';
import { PROPERTY_TYPES } from './property-query.dto';
import { Property, PropertyType } from '../property.entity';

/** All Property fields except `externalRef`, which is an internal seeding key. */
export class PropertyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ description: 'EUR' })
  price: number;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  bedrooms: number;

  @ApiProperty()
  bathrooms: number;

  @ApiProperty()
  areaSqm: number;

  @ApiProperty({ enum: PROPERTY_TYPES })
  propertyType: PropertyType;

  @ApiProperty({ type: [String] })
  features: string[];

  @ApiProperty({ description: 'ISO 8601' })
  createdAt: string;

  @ApiProperty({ description: 'ISO 8601' })
  updatedAt: string;
}

export function toPropertyResponse(property: Property): PropertyResponseDto {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    price: property.price,
    address: property.address,
    city: property.city,
    country: property.country,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqm: property.areaSqm,
    propertyType: property.propertyType,
    features: property.features ?? [],
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  };
}
