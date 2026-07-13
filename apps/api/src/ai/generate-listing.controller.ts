import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateListingResponseDto } from './dto/generate-listing-response.dto';
import { GenerateListingDto } from './dto/generate-listing.dto';

/**
 * Endpoint 2: POST /api/ai/generate-listing (plan §18).
 */
@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@ApiBearerAuth()
export class GenerateListingController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-listing')
  @ApiOperation({ summary: 'Generate marketing copy for a property from structured form fields (authenticated, rate-limited).' })
  @ApiResponse({ status: 200, description: 'Structured marketing copy.', type: GenerateListingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiResponse({ status: 503, description: 'AI assistant unavailable.' })
  async generateListing(@Body() dto: GenerateListingDto): Promise<GenerateListingResponseDto> {
    return this.aiService.generateListing(dto);
  }
}
