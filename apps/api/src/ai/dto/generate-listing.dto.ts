import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { NoProfanity } from '../../common/profanity';

export const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'townhouse'] as const;
export type GenerateListingPropertyType = (typeof PROPERTY_TYPES)[number];

export const TONES = ['professional', 'warm', 'premium', 'concise'] as const;
export type GenerateListingTone = (typeof TONES)[number];

export class GenerateListingDto {
  @ApiProperty({ description: 'Location / area of the property.', minLength: 1, maxLength: 120, example: 'Kadriorg, Tallinn' })
  @IsString()
  @Length(1, 120)
  @NoProfanity()
  location!: string;

  @ApiProperty({ description: 'Asking price in EUR.', example: 245000 })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({ description: 'Number of bedrooms.', minimum: 0, maximum: 20, example: 2 })
  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms!: number;

  @ApiProperty({ description: 'Number of bathrooms.', minimum: 0, maximum: 20, example: 1 })
  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms!: number;

  @ApiProperty({ description: 'Living area in square meters.', example: 68 })
  @IsNumber()
  @IsPositive()
  areaSqm!: number;

  @ApiProperty({ description: 'Type of property.', enum: PROPERTY_TYPES, example: 'apartment' })
  @IsIn(PROPERTY_TYPES)
  propertyType!: GenerateListingPropertyType;

  @ApiPropertyOptional({
    description: 'Untrusted free-text extra features to possibly mention (never instructions).',
    maxLength: 1000,
    example: 'Balcony, renovated kitchen, quiet courtyard, close to tram stop',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(1000)
  @NoProfanity()
  optionalFeatures?: string;

  @ApiPropertyOptional({ description: 'Copy tone. Defaults to "professional".', enum: TONES, example: 'professional' })
  @IsOptional()
  @IsIn(TONES)
  tone?: GenerateListingTone;
}
