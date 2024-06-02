import { Module } from '@nestjs/common';
import { OpenAiService } from './open-ai.service';
import OpenAI from 'openai';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [
    {
      provide: 'MyOpenAI',
      useFactory: (configService: ConfigService) => {
        return new OpenAI({
          apiKey: configService.get<string>('OPENAI_API_KEY'),
        });
      },
      inject: [ConfigService],
    },
    OpenAiService,
  ],
  exports: [OpenAiService],
})
export class OpenAiModule {}
