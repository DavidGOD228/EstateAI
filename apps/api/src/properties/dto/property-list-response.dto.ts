import { ApiProperty } from '@nestjs/swagger';
import { PropertyResponseDto } from './property-response.dto';

export class PropertyListResponseDto {
  @ApiProperty({ type: [PropertyResponseDto] })
  items: PropertyResponseDto[];

  @ApiProperty()
  total: number;
}
