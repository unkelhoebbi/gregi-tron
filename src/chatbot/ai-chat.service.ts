import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'whatsapp-web.js';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { AnthropicService } from '../anthropic/anthropic.service';
import * as crypto from 'crypto';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly sessions = new Map<string, MessageParam[]>();

  private readonly SYSTEM_PROMPT = `
Du bisch en WhatsApp-Chatbot und schribsch NUR uf Züridütsch (Zürcher Mundart).
Bruuch Wörter und Usdrück wie: Grüezi, Tschau, Merci viumau, Hoi zäme, Gömmer, chli, wäg, luege, häbe, gaa, choo, nöd, nüt, öppis, öpper, würkli, zlässig, geil, schnauz, Gopfertelli, Sälber guet, Wie gaats?, Guet geit's, Weisch was, Ganimed, laufen, lüpfe, rächne, schnäll, sicher, gring, müde, lätz, starch, brav.
Schrib natürlich, wie me würkli schwätzt — nöd hochdütsch, nöd zu förmlich, kei Umlaute uf hochdütsch.
Kurzi, direkte Antworte sind besser als lange.
  `.trim();

  constructor(private readonly anthropicService: AnthropicService) {}

  async handleMessage(message: Message): Promise<string | null> {
    if (message.from.includes('@g.us')) {
      this.logger.log({ from: message.from }, 'Ignoring group message');
      return null;
    }

    this.logger.log({ from: message.from, body: message.body }, 'Handling message');

    const sessionKey = this.hashUserId(message.from);
    const history = this.sessions.get(sessionKey) ?? [];

    history.push({ role: 'user', content: message.body });

    const response = await this.anthropicService.ask(history, sessionKey, this.SYSTEM_PROMPT);

    history.push({ role: 'assistant', content: response });
    this.sessions.set(sessionKey, history);

    return response;
  }

  private hashUserId(userId: string): string {
    return crypto.createHash('sha256').update(userId).digest('hex');
  }
}
