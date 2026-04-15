import { Module } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { AnthropicModule } from '../anthropic/anthropic.module';

@Module({
  imports: [AnthropicModule],
  controllers: [],
  providers: [AiChatService],
  exports: [AiChatService],
})
export class ChatbotModule {}
