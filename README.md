# AI Agent

A minimal TypeScript CLI agent with:

- OpenAI as the default provider
- configurable model selection
- optional OpenAI-compatible base URL support
- one-off and interactive chat modes

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

Run in interactive mode:

```bash
npm run dev
```

Build and run the compiled CLI:

```bash
npm run build
npm start -- "Give me three startup ideas in climate tech."
```

## Configuration

- `AI_PROVIDER`: currently `openai`
- `OPENAI_API_KEY`: required
- `OPENAI_MODEL`: defaults to `gpt-4.1-mini`
- `OPENAI_BASE_URL`: optional override for OpenAI-compatible APIs
- `AGENT_SYSTEM_PROMPT`: optional custom system instruction
- `OPENAI_TEMPERATURE`: optional sampling value

## Model Flexibility

By default the agent talks to OpenAI using `OPENAI_API_KEY`. To switch models, change `OPENAI_MODEL`.

Examples:

```bash
OPENAI_MODEL=gpt-4.1 npm run dev -- "Draft a release note."
OPENAI_MODEL=gpt-4.1-mini npm run dev -- "Summarize this document."
```

To target another OpenAI-compatible endpoint, set `OPENAI_BASE_URL` and keep the rest of the app unchanged.

## Testing

```bash
npm test
```
