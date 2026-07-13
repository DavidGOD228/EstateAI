import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { PropertyListResponseDto } from './dto/property-list-response.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { PropertyResponseDto, toPropertyResponse } from './dto/property-response.dto';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOkResponse({ type: PropertyListResponseDto })
  async findAll(@Query() query: PropertyQueryDto): Promise<PropertyListResponseDto> {
    const { items, total } = await this.propertiesService.findAll(query);
    return { items: items.map(toPropertyResponse), total };
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PropertyResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PropertyResponseDto> {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return toPropertyResponse(property);
  }
}
