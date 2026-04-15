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

## Known Issue: Bot does not receive messages

The bot starts but does not respond to incoming WhatsApp messages. Root cause unknown as of 2026-04-15.

### Debugging checklist

**1. Check authentication logs on startup.**
Run `npm run start:dev` and look for these logger lines in order:
- `QR code generated` → QR was printed; open a WhatsApp mobile app and scan it
- `WhatsApp client authenticated` → credentials accepted
- `WhatsApp client is ready` → client fully connected and ready to receive

If `ready` is never logged, the bot is not connected and will never fire `message` events.

**2. Check if LocalAuth session is stale.**
The session is stored in `.wwebjs_auth/` in the project root. If this directory exists but auth keeps failing, delete it and re-scan the QR code:
```bash
rm -rf .wwebjs_auth/
npm run start:dev   # a new QR code will appear
```

**3. Check Puppeteer / Chromium.**
`whatsapp-web.js` uses Puppeteer to run a headless Chrome. Common failure modes on macOS/Linux:
- Missing Chromium — check `node_modules/puppeteer/.local-chromium` exists
- Sandbox issues on Linux — may need `--no-sandbox` flag

**4. Confirm `message` events fire.**
`WhatsappService` (`src/messenger/whatsapp.service.ts`) logs every incoming message at `debug` level:
```
Message received { from, to, type, isGroup, body }
```
The logger level in `main.ts` includes `debug`, so these should appear. If they never appear after auth is confirmed ready, the `message` event is not firing — likely a `whatsapp-web.js` version incompatibility.

**5. Try downgrading `whatsapp-web.js`.**
The project uses `^1.34.6`. Earlier known-good versions were `^1.23.0`. If the above steps don't help, try:
```bash
npm install whatsapp-web.js@1.23.0
```
