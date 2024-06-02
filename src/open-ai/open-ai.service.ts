import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import { join } from 'path';
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  constructor(@Inject('MyOpenAI') private readonly openAi: OpenAI) {}

  async askGpt(
    completionMessages: Array<ChatCompletionMessageParam>,
    userHash: string,
    pathToResponseType?: string | null,
  ): Promise<string> {
    if (pathToResponseType !== null && pathToResponseType !== undefined) {
      let typeFileContent;
      try {
        typeFileContent = fs.readFileSync(
          join(process.cwd(), pathToResponseType),
          'utf-8',
        );
      } catch (error) {
        throw new Error(`Failed to read file: ${JSON.stringify(error)}`);
      }
      completionMessages = [
        {
          role: 'system',
          content: `The response should be in a JSON format that matches this TypeScript type ${typeFileContent}`,
        },
        ...completionMessages,
      ];
    }

    try {
      const chatCompletion = await this.openAi.chat.completions.create({
        messages: completionMessages,
        model: 'gpt-4',
      });
      const [choice] = chatCompletion.choices;
      this.logger.log('Generated gpt response', choice.message.content);
      return choice.message.content;
    } catch (error) {
      throw new Error(`OpenAI API call failed: ${error.message}`);
    }
  }
}
