import { Controller, Get } from "@nestjs/common";
import { WhatsappService } from "./messenger/whatsapp.service";

@Controller()
export class AppController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  sendMessage(): string {
    return 'Hello World!';
  }
}
