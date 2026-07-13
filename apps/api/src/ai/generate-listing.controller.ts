import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateListingResponseDto } from './dto/generate-listing-response.dto';
import { GenerateListingDto } from './dto/generate-listing.dto';
import { UserThrottlerGuard } from './user-throttler.guard';

/**
 * Endpoint 2: POST /api/ai/generate-listing (plan §18).
 */
@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, UserThrottlerGuard)
@ApiBearerAuth()
export class GenerateListingController {
  private readonly logger = new Logger(GenerateListingController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('generate-listing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate marketing copy for a property from structured form fields (authenticated, rate-limited).' })
  @ApiResponse({ status: 200, description: 'Structured marketing copy.', type: GenerateListingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiResponse({ status: 503, description: 'AI assistant unavailable.' })
  async generateListing(@Body() dto: GenerateListingDto, @Req() req: Request): Promise<GenerateListingResponseDto> {
    const result = await this.aiService.generateListing(dto);
    // Audit trail only: userId + outcome, never the request/response content (OWASP A09).
    this.logger.log(JSON.stringify({ userId: req.user!.id, endpoint: 'POST /api/ai/generate-listing', outcome: 'success' }));
    return result;
  }
}
