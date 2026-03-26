import OpenAI from "openai";

import type { AgentConfig } from "../config.js";
import type { AgentMessage, ModelProvider } from "./base.js";

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

  async respond(messages: AgentMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: this.temperature,
    });

    return completion.choices[0]?.message?.content?.trim() ?? "";
  }
}
