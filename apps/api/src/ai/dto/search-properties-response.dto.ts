import { ApiProperty } from '@nestjs/swagger';
import { PropertyResponseDto } from '../../properties/dto/property-response.dto';

/** Swagger response shape for one match. Mirrors `PropertySearchMatch` in packages/shared-types. */
export class PropertySearchMatchDto {
  @ApiProperty({ type: PropertyResponseDto })
  property!: PropertyResponseDto;

  @ApiProperty({ description: 'One short sentence explaining why this listing matches the query.' })
  reason!: string;
}

/** Swagger response shape for POST /api/ai/search-properties. Mirrors `SearchPropertiesResponse` in packages/shared-types. */
export class SearchPropertiesResponseDto {
  @ApiProperty({ description: 'Ranked best-first; empty when nothing matches or the query is out of scope.', type: [PropertySearchMatchDto] })
  matches!: PropertySearchMatchDto[];

  @ApiProperty({ description: 'One or two sentences summarizing the result (or why there are no matches).' })
  summary!: string;
}
