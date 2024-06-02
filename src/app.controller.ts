import { Controller, Logger, Post } from '@nestjs/common';
import { WhatsappService } from './messenger/whatsapp.service';
import { OpenAiService } from './open-ai/open-ai.service';
import { TemperatureService } from './data-collector/temperature.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly openAiService: OpenAiService,
    private readonly temperatureService: TemperatureService,
    private readonly configService: ConfigService,
  ) {}

  @Post('ice-bath-message')
  async sendIceBathMessage(): Promise<void> {
    this.logger.log('Starting execution');
    const temperature = await this.temperatureService.getCurrentTemperature();
    const gptResponse = await this.openAiService.askGpt(
      [
        {
          role: 'system',
          content:
            'Write a short message for a friend to go swimming in the Limmat. Maximum 70 characters.',
        },
        {
          role: 'system',
          content:
            'The message should include emojis and be motivating to go ice bathing/swimming.',
        },
        {
          role: 'system',
          content:
            'The message should always start with the question if the friend wants to go swimming tomorrow.',
        },
        {
          role: 'system',
          content: `The temperature is ${temperature}. The unit is °C. If ${temperature} is less than 10, you should talk about ice bathing, otherwise about swimming.`,
        },
        {
          role: 'system',
          content: 'The message should be in English.',
        },
        {
          role: 'user',
          content: 'Give me an example!',
        },
        {
          role: 'assistant',
          content:
            "Who's up for a swim in the Limmat tomorrow? 🏊‍ Temperature is like 🤏👀",
        },
        {
          role: 'system',
          content:
            'The temperature should never be mentioned in the message! You can use emojis to describe the temperature. Ambiguous messages are allowed, but no obscene or offensive messages.',
        },
      ],
      'scheduled-message',
    );
    this.logger.log('Got GPT response.');

    const phoneNumbers = this.configService.get('PHONE_NUMBERS').split(',');
    await Promise.all(
      phoneNumbers.map((number: string) => {
        return this.whatsappService.sendPrivateMessage(
          `Limmat temperature: ${temperature} °C.`,
          number,
        );
      }),
    );
    await Promise.all(
      phoneNumbers.map((number: string) => {
        return this.whatsappService.sendPrivateMessage(gptResponse, number);
      }),
    );
    this.logger.log('Finished.');
  }

  @Post('ice-bath-group-message')
  async sendIceBathGroupMessage(): Promise<void> {
    this.logger.log('Starting execution of group messages');
    const temperature = await this.temperatureService.getCurrentTemperature();
    const gptResponse = await this.openAiService.askGpt(
      [
        {
          role: 'system',
          content:
            'Write a short message for a group chat to go swimming in the Limmat. Maximum 70 characters.',
        },
        {
          role: 'system',
          content:
            'The message should include emojis and be motivating to go ice bathing/swimming.',
        },
        {
          role: 'system',
          content:
            'The message should always start with the question of who wants to go swimming tomorrow.',
        },
        {
          role: 'system',
          content: `The temperature is ${temperature}. The unit is °C. If ${temperature} is less than 10, you should talk about ice bathing, otherwise about swimming.`,
        },
        {
          role: 'system',
          content: 'The message should be in English.',
        },
        {
          role: 'user',
          content: 'Give me an example!',
        },
        {
          role: 'assistant',
          content:
            "Who's up for a swim in the Limmat tomorrow? 🏊‍ Temperature is like 🤏👀",
        },
        {
          role: 'system',
          content:
            'The temperature should never be mentioned in the message! You can use emojis to describe the temperature. Ambiguous messages are allowed, but no obscene or offensive messages.',
        },
      ],
      'scheduled-message',
    );
    this.logger.log('Got GPT response.');

    const phoneNumbers = this.configService.get('GROUP_CHAT_NAMES').split(',');
    await Promise.all(
      phoneNumbers.map((chatName: string) => {
        return this.whatsappService.sendGroupChatMessage(
          `Limmat temperature: ${temperature} °C.`,
          chatName,
        );
      }),
    );

    await Promise.all(
      phoneNumbers.map((chatName: string) => {
        return this.whatsappService.sendGroupChatMessage(gptResponse, chatName);
      }),
    );
    this.logger.log('Finished.');
  }
}
