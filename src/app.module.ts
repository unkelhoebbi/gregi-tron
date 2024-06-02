import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { WhatsappService } from './messenger/whatsapp.service';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { OpenAiModule } from './open-ai/open-ai.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), OpenAiModule, ChatbotModule],
  controllers: [AppController],
  providers: [
    {
      provide: Client,
      useFactory: () => {
        return new Client({
          authStrategy: new LocalAuth(),
          webVersionCache: {
            type: 'remote',
            remotePath:
              'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
          },
        });
      },
    },
    WhatsappService,
  ],
})
export class AppModule {}
