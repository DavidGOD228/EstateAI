import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PropertiesService } from '../properties/properties.service';
import { AiService } from './ai.service';
import { AskQuestionResponseDto } from './dto/ask-question-response.dto';
import { AskQuestionDto } from './dto/ask-question.dto';
import { UserThrottlerGuard } from './user-throttler.guard';

/**
 * Endpoint 1: POST /api/properties/:id/ask (plan §17).
 * The client sends only the question; the trusted property context is
 * always loaded server-side from the database by id.
 */
@ApiTags('ai')
@Controller('properties')
@UseGuards(JwtAuthGuard, UserThrottlerGuard)
@ApiBearerAuth()
export class AskController {
  private readonly logger = new Logger(AskController.name);

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
  async ask(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AskQuestionDto,
    @Req() req: Request,
  ): Promise<AskQuestionResponseDto> {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const result = await this.aiService.answerPropertyQuestion(property, dto.question);
    // Audit trail only: userId + outcome, never the question/answer content (OWASP A09).
    this.logger.log(
      JSON.stringify({ userId: req.user!.id, endpoint: 'POST /api/properties/:id/ask', outcome: 'success' }),
    );
    return result;
  }
}
