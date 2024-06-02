import { Module } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { OpenAiModule } from '../open-ai/open-ai.module';

@Module({
  imports: [OpenAiModule],
  controllers: [],
  providers: [AiChatService],
  exports: [AiChatService],
})
export class ChatbotModule {}
