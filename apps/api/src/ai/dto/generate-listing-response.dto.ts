import { ApiProperty } from '@nestjs/swagger';

/** Swagger response shape for POST /api/ai/generate-listing. Mirrors `GenerateListingResponse` in packages/shared-types. */
export class GenerateListingResponseDto {
  @ApiProperty({ description: 'Short marketing headline, plain text.' })
  headline!: string;

  @ApiProperty({ description: 'Marketing description, plain text.' })
  description!: string;

  @ApiProperty({ description: 'Short bullet points highlighting the property.', type: [String] })
  highlights!: string[];

  @ApiProperty({ description: 'Description of the kind of buyer/renter this property suits.' })
  targetAudience!: string;
}
