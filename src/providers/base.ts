export type AgentMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface ModelProvider {
  respond(messages: AgentMessage[]): Promise<string>;
}
