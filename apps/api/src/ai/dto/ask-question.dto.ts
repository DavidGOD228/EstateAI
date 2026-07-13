import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class AskQuestionDto {
  @ApiProperty({
    description: 'Free-text question about this specific property listing.',
    minLength: 1,
    maxLength: 500,
    example: 'Is this property suitable for a family of four?',
  })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 500)
  question!: string;
}
