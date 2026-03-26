# AI Agent

A minimal TypeScript CLI agent with:

- OpenAI as the default provider
- configurable model selection
- optional OpenAI-compatible base URL support
- one-off and interactive chat modes
- a browser UI backed by the same agent runtime

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and add your key:

   ```bash
   cp .env.example .env
   ```

3. Set `OPENAI_API_KEY` and optionally override `OPENAI_MODEL` or `OPENAI_BASE_URL`.

## Usage

Run the agent with a one-off prompt:

```bash
npm run dev -- "Summarize why strong logging matters in backend services."
```

Override the model at runtime:

```bash
npm run dev -- --model gpt-4.1 "Draft a product launch email."
```

Run in interactive mode:

```bash
npm run dev
```

Run the web UI:

```bash
npm run dev:web
```

Then open `http://localhost:3000`.

Build and run the compiled CLI:

```bash
npm run build
npm start -- "Give me three startup ideas in climate tech."
```

Build and run the compiled web server:

```bash
npm run build
npm run start:web
```

## Configuration

- `AI_PROVIDER`: currently `openai`
- `OPENAI_API_KEY`: required
- `OPENAI_MODEL`: defaults to `gpt-4.1-mini`
- `OPENAI_BASE_URL`: optional override for OpenAI-compatible APIs
- `AGENT_SYSTEM_PROMPT`: optional custom system instruction
- `OPENAI_TEMPERATURE`: optional sampling value

In the browser UI, `Max Agents` defaults to `50` and caps manual additions, team composition, and helper spawning.

## Model Flexibility

By default the agent talks to OpenAI using `OPENAI_API_KEY`. To switch models, change `OPENAI_MODEL`.

Examples:

```bash
OPENAI_MODEL=gpt-4.1 npm run dev -- "Draft a release note."
OPENAI_MODEL=gpt-4.1-mini npm run dev -- "Summarize this document."
```

To target another OpenAI-compatible endpoint, set `OPENAI_BASE_URL` and keep the rest of the app unchanged.

You can also override config from the CLI:

```bash
npm run dev -- --model gpt-4.1-mini --temperature 0.1 "Explain idempotency."
npm run dev -- --base-url http://localhost:11434/v1 --model llama3.2
```

The browser UI exposes the same runtime overrides when a new session starts:

- `Model` from a picker, with a custom-model option for compatible endpoints
- `Temperature`
- `Base URL`
- `System Prompt`

Once a session is active, the conversation keeps its own memory until you reset it.

## Web UI

The browser app is served by `Express` and uses the same `Agent` core as the CLI.

- `POST /api/chat` starts or continues a browser chat session
- `POST /api/reset` clears a session's conversation memory
- `GET /api/health` is a lightweight health check

If you want to test the chat path end to end, add a real `OPENAI_API_KEY` to `.env` and start the web server.

## Testing

```bash
npm test
```
