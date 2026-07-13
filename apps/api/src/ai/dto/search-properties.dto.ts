import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { NoProfanity } from '../../common/profanity';

/** Mirrors `SearchPropertiesRequest` in packages/shared-types. */
export class SearchPropertiesDto {
  @ApiProperty({
    description: 'Free-text search query across the current listings.',
    minLength: 2,
    maxLength: 300,
    example: 'bright flat near a park for a family',
  })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(2, 300)
  @NoProfanity()
  query!: string;
}
