import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { toPropertyResponse } from '../properties/dto/property-response.dto';
import { PropertiesService } from '../properties/properties.service';
import { AiService } from './ai.service';
import { PropertySearchMatchDto, SearchPropertiesResponseDto } from './dto/search-properties-response.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';

/** Candidate pool size loaded from the DB before ranking (plan-aligned cap). */
const CANDIDATE_LIMIT = 50;
/** Defense-in-depth cap mirroring the prompt's own "at most 6 matches" instruction. */
const MAX_MATCHES = 6;

/**
 * Endpoint 3: POST /api/ai/search-properties (authenticated, rate-limited).
 * The trusted candidate set is always loaded server-side from the database;
 * the model may only return ids drawn from that set — any other id in its
 * response is dropped before the client ever sees it (defends against
 * hallucinated ids).
 */
@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@ApiBearerAuth()
export class SearchPropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly aiService: AiService,
  ) {}

  @Post('search-properties')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search current listings with a free-text query (authenticated, rate-limited).' })
  @ApiResponse({ status: 200, description: 'Ranked matches, possibly empty.', type: SearchPropertiesResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid query.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiResponse({ status: 503, description: 'AI assistant unavailable.' })
  async search(@Body() dto: SearchPropertiesDto, @Req() req: Request): Promise<SearchPropertiesResponseDto> {
    const currentUserId = req.user?.id ?? null;
    const candidates = await this.propertiesService.findRecent(CANDIDATE_LIMIT);
    const result = await this.aiService.searchProperties(candidates, dto.query);

    const candidatesById = new Map(candidates.map((property) => [property.id, property]));
    const matches: PropertySearchMatchDto[] = result.matches
      .filter((match) => candidatesById.has(match.propertyId))
      .slice(0, MAX_MATCHES)
      .map((match) => ({
        property: toPropertyResponse(candidatesById.get(match.propertyId)!, currentUserId),
        reason: match.reason,
      }));

    return { matches, summary: result.summary };
  }
}
