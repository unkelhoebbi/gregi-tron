import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Client } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { AiChatService } from '../chatbot/ai-chat.service';
import { OpenAIChatResponse } from '../chatbot/response.type';

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
      const openAIChatResponse: OpenAIChatResponse =
        await this.aiChatService.handleMessage(message);
      if (openAIChatResponse.isSafeToRespond) {
        await this.client.sendMessage(message.from, openAIChatResponse.message);
      }
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
  public async sendPrivateMessage(
    message: string,
    number: string,
  ): Promise<void> {
    try {
      const numberId = await this.client.getNumberId(number);
      const response = await this.client.sendMessage(
        numberId._serialized,
        message,
      );
      this.logger.log({ message, number, response }, 'Message sent');
    } catch (err) {
      this.logger.error({ message, number, err }, 'Error sending message');
    }
  }

  public async sendGroupChatMessage(
    message: string,
    chatName: string,
  ): Promise<void> {
    try {
      const chats = await this.client.getChats();
      const groups = chats.filter((chat) => chat.isGroup);

      const targetGroup = groups.find((group) => group.name === chatName);

      if (targetGroup) {
        await this.client.sendMessage(targetGroup.id._serialized, message);
        this.logger.log({ message, chatName }, 'Message sent');
      } else {
        this.logger.error({ message, chatName }, 'Error sending message');
      }
    } catch (err) {
      this.logger.error({ message, chatName, err }, 'Error sending message');
    }
  }
}
