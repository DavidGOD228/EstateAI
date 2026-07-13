import { PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';

/**
 * Mirrors `UpdatePropertyRequest` (`Partial<CreatePropertyRequest>`) in
 * packages/shared-types. `PartialType` keeps every `CreatePropertyDto`
 * validation decorator (length, positivity, profanity, etc.) but makes all
 * fields optional for both class-validator and the generated Swagger schema.
 */
export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
