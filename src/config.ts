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

export type ConfigOverrides = {
  model?: string;
  baseUrl?: string;
  systemPrompt?: string;
  temperature?: number;
};

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  overrides: ConfigOverrides = {},
): AgentConfig {
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

  const envTemperature = env.OPENAI_TEMPERATURE
    ? Number(env.OPENAI_TEMPERATURE)
    : undefined;
  const temperature = overrides.temperature ?? envTemperature;

  if (temperature !== undefined && Number.isNaN(temperature)) {
    throw new Error("OPENAI_TEMPERATURE must be a valid number.");
  }

  return {
    provider,
    model: overrides.model ?? env.OPENAI_MODEL ?? "gpt-4.1-mini",
    apiKey,
    baseUrl: overrides.baseUrl ?? env.OPENAI_BASE_URL,
    systemPrompt:
      overrides.systemPrompt ??
      env.AGENT_SYSTEM_PROMPT ??
      "You are a pragmatic AI agent that answers clearly and concisely.",
    temperature,
  };
}
