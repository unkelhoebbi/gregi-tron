import { Module } from '@nestjs/common';
import { WhatsappService } from './messenger/whatsapp.service';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ChatbotModule,
  ],
  providers: [
    {
      provide: Client,
      useFactory: () => {
        return new Client({
          authStrategy: new LocalAuth(),
        });
      },
    },
    WhatsappService,
  ],
})
export class AppModule {}
