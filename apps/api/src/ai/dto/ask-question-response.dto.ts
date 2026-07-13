import { ApiProperty } from '@nestjs/swagger';

/** Swagger response shape for POST /api/properties/:id/ask. Mirrors `AskQuestionResponse` in packages/shared-types. */
export class AskQuestionResponseDto {
  @ApiProperty({ description: 'The structured answer to the question.' })
  answer!: string;

  @ApiProperty({ description: 'Short bullet points relevant to the answer.', type: [String] })
  highlights!: string[];

  @ApiProperty({ description: 'Notes about missing information or assumptions.', type: [String] })
  caveats!: string[];

  @ApiProperty({ description: 'Confidence level of the answer.', enum: ['high', 'medium', 'low'] })
  confidence!: 'high' | 'medium' | 'low';
}
