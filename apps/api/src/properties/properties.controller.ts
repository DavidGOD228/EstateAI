import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyListResponseDto } from './dto/property-list-response.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { PropertyResponseDto, toPropertyResponse } from './dto/property-response.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property } from './property.entity';
import { PropertiesService } from './properties.service';

const NOT_FOUND_MESSAGE = 'Property not found';
const NOT_OWNER_MESSAGE = 'You do not own this listing.';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  private readonly logger = new Logger(PropertiesController.name);

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
    this.logger.log(JSON.stringify({ event: 'property.created', userId: ownerId, propertyId: property.id }));
    return toPropertyResponse(property, ownerId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PropertyResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<PropertyResponseDto> {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    return toPropertyResponse(property, req.user?.id ?? null);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PropertyResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
    @Req() req: Request,
  ): Promise<PropertyResponseDto> {
    const userId = req.user!.id;
    const property = await this.loadOwnedProperty(id, userId);
    const updated = await this.propertiesService.update(property, dto);
    this.logger.log(JSON.stringify({ event: 'property.updated', userId, propertyId: updated.id }));
    return toPropertyResponse(updated, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<void> {
    const userId = req.user!.id;
    const property = await this.loadOwnedProperty(id, userId);
    await this.propertiesService.remove(property);
    this.logger.log(JSON.stringify({ event: 'property.deleted', userId, propertyId: property.id }));
  }

  /**
   * Deny-by-default lookup shared by PATCH/DELETE: 404 if the listing
   * doesn't exist, then 403 if the caller doesn't own it (seeded rows have
   * `ownerId: null`, which never equals a real user id, so they 403 too —
   * harmless since listings are public reads anyway).
   */
  private async loadOwnedProperty(id: string, userId: string): Promise<Property> {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    if (property.ownerId !== userId) {
      throw new ForbiddenException(NOT_OWNER_MESSAGE);
    }
    return property;
  }
}
