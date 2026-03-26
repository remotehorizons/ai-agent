import OpenAI from "openai";

import type { AgentConfig } from "../config.js";
import type { AgentMessage, ModelProvider, ModelResponse } from "./base.js";

export class OpenAIProvider implements ModelProvider {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly temperature?: number;

  constructor(config: AgentConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.model = config.model;
    this.temperature = config.temperature;
  }

  async respond(messages: AgentMessage[]): Promise<ModelResponse> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: this.temperature,
    });

    return {
      content: completion.choices[0]?.message?.content?.trim() ?? "",
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
    };
  }
}
