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
    this.logger.log(
      { node: process.version, chromium: process.versions.chrome ?? 'unknown' },
      'Initializing WhatsApp client',
    );

    this.client.on('loading_screen', (percent, message) => {
      this.logger.log({ percent, message }, 'Loading screen');
    });

    this.client.on('change_state', (state) => {
      this.logger.log({ state }, 'Client state changed');
    });

    this.client.on('remote_session_saved', () => {
      this.logger.log('Remote session saved (LocalAuth)');
    });

    this.client.on('ready', () => {
      const info = this.client.info;
      this.logger.log(
        { number: info?.wid?.user, name: info?.pushname, platform: info?.platform },
        'WhatsApp client is ready',
      );
    });

    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
      this.logger.log('QR code generated — scan with WhatsApp mobile app');
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

    // Primary handler: message_create fires reliably in whatsapp-web.js v1.34+
    // whereas the plain `message` event can silently stop firing.
    this.client.on('message_create', async (message) => {
      this.logger.debug({
        from: message.from,
        to: message.to,
        fromMe: message.fromMe,
        type: message.type,
        isGroup: message.from.includes('@g.us'),
        body: message.body,
      }, 'message_create event');

      if (message.fromMe) return; // ignore outgoing messages

      try {
        const response = await this.aiChatService.handleMessage(message);
        if (response) {
          await this.client.sendMessage(message.from, response);
          this.logger.log({ to: message.from, response }, 'Response sent');
        } else {
          this.logger.debug({ from: message.from }, 'Message ignored (no response)');
        }
      } catch (error) {
        this.logger.error(
          { from: message.from, error: error.message, stack: error.stack },
          'Failed to handle message',
        );
      }
    });

    // Fallback: keep `message` listener to detect if it fires at all
    this.client.on('message', (message) => {
      this.logger.debug({
        from: message.from,
        type: message.type,
        body: message.body,
      }, "Message received via legacy 'message' event");
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
