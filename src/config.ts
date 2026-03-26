import dotenv from "dotenv";

dotenv.config();

export type AgentConfig = {
  provider: "openai";
  model: string;
  apiKey: string;
  baseUrl?: string;
  systemPrompt: string;
  temperature?: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AgentConfig {
  const provider = env.AI_PROVIDER ?? "openai";

  if (provider !== "openai") {
    throw new Error(
      `Unsupported AI_PROVIDER "${provider}". Supported providers: openai.`,
    );
  }

  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required. Add it to your environment or .env file.",
    );
  }

  const temperature = env.OPENAI_TEMPERATURE
    ? Number(env.OPENAI_TEMPERATURE)
    : undefined;

  if (temperature !== undefined && Number.isNaN(temperature)) {
    throw new Error("OPENAI_TEMPERATURE must be a valid number.");
  }

  return {
    provider,
    model: env.OPENAI_MODEL ?? "gpt-4.1-mini",
    apiKey,
    baseUrl: env.OPENAI_BASE_URL,
    systemPrompt:
      env.AGENT_SYSTEM_PROMPT ??
      "You are a pragmatic AI agent that answers clearly and concisely.",
    temperature,
  };
}
