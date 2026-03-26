export type AgentMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ModelResponse = {
  content: string;
  usage: TokenUsage;
};

export interface ModelProvider {
  respond(messages: AgentMessage[]): Promise<ModelResponse>;
}
