import { Inject, Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages';

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);

  constructor(@Inject('MyAnthropic') private readonly anthropic: Anthropic) {}

  async ask(
    messages: MessageParam[],
    userHash: string,
    system: string,
  ): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages,
        metadata: { user_id: userHash },
      });

      const block = response.content[0];
      const text = block.type === 'text' ? block.text : '';
      this.logger.log('Generated response', text);
      return text;
    } catch (error) {
      throw new Error(`Anthropic API call failed: ${error.message}`);
    }
  }
}
