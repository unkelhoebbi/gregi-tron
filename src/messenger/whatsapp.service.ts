import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Client } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { AiChatService } from '../chatbot/ai-chat.service';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly client: Client,
    private readonly aiChatService: AiChatService,
  ) {}

  async onModuleInit() {
    this.client.on('ready', () => {
      this.logger.log('WhatsApp client is ready');
    });

    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
      this.logger.log('QR code generated');
    });

    this.client.on('authenticated', () => {
      this.logger.log('WhatsApp client authenticated');
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error({ msg }, 'AUTHENTICATION FAILURE');
    });

    this.client.on('disconnected', (reason) => {
      this.logger.warn({ reason }, 'WhatsApp client disconnected');
    });

    this.client.on('message', async (message) => {
      this.logger.debug({
        from: message.from,
        to: message.to,
        type: message.type,
        isGroup: message.from.includes('@g.us'),
        body: message.body,
      }, 'Message received');
      try {
        const response = await this.aiChatService.handleMessage(message);
        if (response) {
          await this.client.sendMessage(message.from, response);
          this.logger.log({ to: message.from, response }, 'Response sent');
        } else {
          this.logger.debug({ from: message.from }, 'Message ignored (no response)');
        }
      } catch (error) {
        this.logger.error({ from: message.from, error: error.message, stack: error.stack }, 'Failed to handle message');
      }
    });

    this.client.on('message_create', (message) => {
      this.logger.debug({
        from: message.from,
        to: message.to,
        fromMe: message.fromMe,
        type: message.type,
      }, 'message_create event');
    });

    await this.client.initialize();
  }

  async onModuleDestroy() {
    this.logger.log('Destroying WhatsApp client...');
    setTimeout(async () => {
      await this.client.destroy();
      this.logger.log('WhatsApp client destroyed');
    }, 10000);
  }
}
