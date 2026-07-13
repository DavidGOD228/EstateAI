import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyListResponseDto } from './dto/property-list-response.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { PropertyResponseDto, toPropertyResponse } from './dto/property-response.dto';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ type: PropertyListResponseDto })
  async findAll(@Query() query: PropertyQueryDto, @Req() req: Request): Promise<PropertyListResponseDto> {
    const { items, total } = await this.propertiesService.findAll(query);
    const currentUserId = req.user?.id ?? null;
    return { items: items.map((item) => toPropertyResponse(item, currentUserId)), total };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PropertyResponseDto })
  async create(@Body() dto: CreatePropertyDto, @Req() req: Request): Promise<PropertyResponseDto> {
    const ownerId = req.user!.id;
    const property = await this.propertiesService.create(dto, ownerId);
    return toPropertyResponse(property, ownerId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PropertyResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<PropertyResponseDto> {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return toPropertyResponse(property, req.user?.id ?? null);
  }
}
