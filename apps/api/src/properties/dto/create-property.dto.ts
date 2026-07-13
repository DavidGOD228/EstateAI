import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsNumber, IsPositive, IsString, Length, Max, Min } from 'class-validator';
import { PROPERTY_TYPES } from './property-query.dto';
import { PropertyType } from '../property.entity';
import { NoProfanity } from '../../common/profanity';

const trim = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim() : value);
const trimEach = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value) ? value.map((item) => (typeof item === 'string' ? item.trim() : item)) : value;

/** Mirrors `CreatePropertyRequest` in packages/shared-types. */
export class CreatePropertyDto {
  @ApiProperty({ minLength: 1, maxLength: 160 })
  @IsString()
  @Transform(trim)
  @Length(1, 160)
  @NoProfanity()
  title!: string;

  @ApiProperty({ minLength: 1, maxLength: 4000 })
  @IsString()
  @Transform(trim)
  @Length(1, 4000)
  @NoProfanity()
  description!: string;

  @ApiProperty({ description: 'EUR, > 0.', example: 245000 })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({ minLength: 1, maxLength: 200 })
  @IsString()
  @Transform(trim)
  @Length(1, 200)
  @NoProfanity()
  address!: string;

  @ApiProperty({ minLength: 1, maxLength: 80 })
  @IsString()
  @Transform(trim)
  @Length(1, 80)
  city!: string;

  @ApiProperty({ minLength: 1, maxLength: 80 })
  @IsString()
  @Transform(trim)
  @Length(1, 80)
  country!: string;

  @ApiProperty({ minimum: 0, maximum: 20, example: 2 })
  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms!: number;

  @ApiProperty({ minimum: 0, maximum: 20, example: 1 })
  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms!: number;

  @ApiProperty({ description: '> 0.', example: 68 })
  @IsNumber()
  @IsPositive()
  areaSqm!: number;

  @ApiProperty({ enum: PROPERTY_TYPES })
  @IsIn(PROPERTY_TYPES)
  propertyType!: PropertyType;

  @ApiProperty({ description: 'Display-only feature tags, 0–10 items, each 1–80 chars.', type: [String], maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @Transform(trimEach)
  @IsString({ each: true })
  @Length(1, 80, { each: true })
  @NoProfanity({ each: true })
  features!: string[];
}
