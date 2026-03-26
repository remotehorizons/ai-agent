import { describe, expect, it, vi } from "vitest";

import { Agent } from "../src/agent.js";
import type { AgentConfig } from "../src/config.js";
import type { AgentMessage, ModelProvider } from "../src/providers/base.js";

class FakeProvider implements ModelProvider {
  public readonly calls: AgentMessage[][] = [];

  constructor(private readonly response: string) {}

  async respond(messages: AgentMessage[]): Promise<string> {
    this.calls.push([...messages]);
    return this.response;
  }
}

function createConfig(): AgentConfig {
  return {
    provider: "openai",
    model: "gpt-4.1-mini",
    apiKey: "test-key",
    systemPrompt: "Be precise.",
  };
}

describe("Agent", () => {
  it("builds chat history with the system prompt", async () => {
    const provider = new FakeProvider("first answer");
    const agent = new Agent(createConfig(), provider);

    await agent.run("hello");

    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]).toEqual([
      { role: "system", content: "Be precise." },
      { role: "user", content: "hello" },
    ]);
  });

  it("preserves conversation history across turns", async () => {
    const provider = new FakeProvider("next answer");
    const agent = new Agent(createConfig(), provider);

    await agent.run("first");
    await agent.run("second");

    expect(provider.calls[1]).toEqual([
      { role: "system", content: "Be precise." },
      { role: "user", content: "first" },
      { role: "assistant", content: "next answer" },
      { role: "user", content: "second" },
    ]);
  });

  it("clears history while retaining the system prompt", async () => {
    const provider = new FakeProvider("answer");
    const agent = new Agent(createConfig(), provider);

    await agent.run("first");
    agent.reset();
    await agent.run("second");

    expect(provider.calls[1]).toEqual([
      { role: "system", content: "Be precise." },
      { role: "user", content: "second" },
    ]);
  });
});
