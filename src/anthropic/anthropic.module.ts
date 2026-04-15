import { Module } from '@nestjs/common';
import { AnthropicService } from './anthropic.service';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [
    {
      provide: 'MyAnthropic',
      useFactory: (configService: ConfigService) => {
        return new Anthropic({
          apiKey: configService.get<string>('ANTHROPIC_API_KEY'),
        });
      },
      inject: [ConfigService],
    },
    AnthropicService,
  ],
  exports: [AnthropicService],
})
export class AnthropicModule {}
