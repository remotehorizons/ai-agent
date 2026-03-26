import type { AgentConfig } from "./config.js";
import type { AgentMessage, ModelProvider } from "./providers/base.js";
import { OpenAIProvider } from "./providers/openai.js";

export class Agent {
  private readonly provider: ModelProvider;
  private readonly history: AgentMessage[];

  constructor(config: AgentConfig, provider?: ModelProvider) {
    this.provider = provider ?? new OpenAIProvider(config);
    this.history = [{ role: "system", content: config.systemPrompt }];
  }

  async run(input: string): Promise<string> {
    this.history.push({ role: "user", content: input });
    const response = await this.provider.respond(this.history);
    this.history.push({ role: "assistant", content: response });

    return response;
  }

  reset(): void {
    this.history.splice(1);
  }
}
