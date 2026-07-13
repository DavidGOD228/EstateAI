import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PropertiesModule } from '../properties/properties.module';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './ai-provider.interface';
import { AnthropicAiProvider } from './anthropic.provider';
import { AskController } from './ask.controller';
import { GenerateListingController } from './generate-listing.controller';

@Module({
  imports: [
    PropertiesModule,
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(configService.get<string | number>('AI_RATE_LIMIT_TTL_MS') ?? 60000),
            limit: Number(configService.get<string | number>('AI_RATE_LIMIT_LIMIT') ?? 10),
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AskController, GenerateListingController],
  providers: [
    AiService,
    {
      provide: AI_PROVIDER,
      useClass: AnthropicAiProvider,
    },
  ],
})
export class AiModule {}
