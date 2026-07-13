import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PropertiesService } from '../properties/properties.service';
import { AiService } from './ai.service';
import { AskQuestionResponseDto } from './dto/ask-question-response.dto';
import { AskQuestionDto } from './dto/ask-question.dto';

/**
 * Endpoint 1: POST /api/properties/:id/ask (plan §17).
 * The client sends only the question; the trusted property context is
 * always loaded server-side from the database by id.
 */
@ApiTags('ai')
@Controller('properties')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@ApiBearerAuth()
export class AskController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly aiService: AiService,
  ) {}

  @Post(':id/ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask a question about a specific property listing (authenticated, rate-limited).' })
  @ApiResponse({ status: 200, description: 'Structured, grounded answer.', type: AskQuestionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid property id or question.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication.' })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiResponse({ status: 503, description: 'AI assistant unavailable.' })
  async ask(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AskQuestionDto): Promise<AskQuestionResponseDto> {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.aiService.answerPropertyQuestion(property, dto.question);
  }
}
