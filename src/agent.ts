import type { AgentConfig } from "./config.js";
import type { AgentMessage, ModelProvider, ModelResponse } from "./providers/base.js";
import { OpenAIProvider } from "./providers/openai.js";

export class Agent {
  private readonly provider: ModelProvider;
  private readonly history: AgentMessage[];

  constructor(config: AgentConfig, provider?: ModelProvider) {
    this.provider = provider ?? new OpenAIProvider(config);
    this.history = [{ role: "system", content: config.systemPrompt }];
  }

  async run(input: string): Promise<ModelResponse> {
    this.history.push({ role: "user", content: input });
    const response = await this.provider.respond(this.history);
    this.history.push({ role: "assistant", content: response.content });

    return response;
  }

  reset(): void {
    this.history.splice(1);
  }
}
