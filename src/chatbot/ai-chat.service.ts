import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'whatsapp-web.js';
import { OpenAIChatResponse } from './response.type';
import { OpenAiService } from '../open-ai/open-ai.service';
import * as crypto from 'crypto';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(private readonly openAiService: OpenAiService) {}

  async handleMessage(message: Message): Promise<OpenAIChatResponse> {
    this.logger.log({ message }, 'Handling message');
    // Handle Group chats
    if (message.from.includes('@g.us')) {
      const mentionedIds = message.mentionedIds as string[];
      if (mentionedIds.length < 1 || !mentionedIds.includes(message.to)) {
        return {
          isSafeToRespond: false,
          message: '',
        };
      }
    }

    // Message is from a private chat or a group chat where the bot was mentioned
    const gptResponse = await this.openAiService.askGpt(
      [
        {
          role: 'system',
          content:
            'You should decide if it is safe to respond to this message. And set the isSafeToRespond property accordingly.',
        },
        {
          role: 'system',
          content:
            'If it is not safe to respond, you should set the message property to an empty string. Otherwise, set it to the response message.',
        },
        {
          role: 'system',
          content:
            'Uf dere Sitä findsch es Wörterbuech für Züridütsch https://zuri.net/de/zurich/sl%C3%A4ngikon-arbeit.htm',
        },
        {
          role: 'system',
          content:
            'Du Bruchsch möglichscht vill Wörter vo dem Wörterbuech und bruch au gnueg Emojis.',
        },
        {
          role: 'user',
          content: 'Was schaffsch du eigch?',
        },
        {
          role: 'assistant',
          content:
            '{\n' +
            '  "isSafeToRespond": true,\n' +
            '  "message": "🤖 Ich bin en Chatbot! 🗣️ Ich hilf Mänsche bi ihrne Frage und informier si über s Neuscht. 👍📚"\n' +
            '}',
        },
        {
          role: 'user',
          content: message.body,
        },
      ],
      this.hashUserId(message.from),
      'src/chatbot/response.type.ts',
    );

    try {
      return JSON.parse(gptResponse);
    } catch (error) {
      this.logger.error({ error }, 'Failed to parse GPT response');
      return {
        isSafeToRespond: false,
        message: '',
      };
    }
  }

  hashUserId(userId: string): string {
    return crypto.createHash('sha256').update(userId).digest('hex');
  }
}
