# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev    # Development with hot reload
npm run build        # Compile TypeScript
npm run start:prod   # Run compiled output
npm run lint         # ESLint with auto-fix
npm run format       # Prettier format
npm run test         # Unit tests (rootDir: src, matches *.spec.ts)
npm run test:e2e     # E2E tests using test/jest-e2e.json
npm run test:cov     # Coverage report
```

To run a single test file:
```bash
npx jest src/path/to/file.spec.ts
```

## Environment

Copy `.env.example` and fill in:
- `ANTHROPIC_API_KEY` — Anthropic API key

## Architecture

This is a NestJS WhatsApp bot that:
1. Connects to WhatsApp via `whatsapp-web.js` (Puppeteer-based). On first run, a QR code is printed to the terminal for authentication. Auth is persisted via `LocalAuth`.
2. Listens for incoming private messages and responds in Zurich German dialect using Claude via the Anthropic API.
3. Ignores group chat messages entirely.

### Module structure

- **AppModule** — root module; provides the `whatsapp-web.js` `Client` instance as a NestJS provider and wires up `WhatsappService`
- **AnthropicModule** — wraps `@anthropic-ai/sdk`; `AnthropicService.ask()` accepts a message history array (`MessageParam[]`), a SHA-256 hashed user ID, and a system prompt string
- **ChatbotModule** — `AiChatService` handles incoming WhatsApp messages; maintains per-user conversation history keyed by SHA-256 hash of the sender ID; group messages (`@g.us`) are silently ignored; responds exclusively in Zurich German dialect

### No HTTP endpoints

There is no `AppController`. The bot has no REST API — it only reacts to incoming WhatsApp messages.
