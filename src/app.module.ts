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
          puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
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
