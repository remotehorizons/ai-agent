import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("loads defaults", () => {
    const config = loadConfig({
      OPENAI_API_KEY: "key",
    });

    expect(config).toMatchObject({
      provider: "openai",
      model: "gpt-4.1-mini",
      apiKey: "key",
    });
  });

  it("supports custom model settings", () => {
    const config = loadConfig({
      OPENAI_API_KEY: "key",
      OPENAI_MODEL: "gpt-4.1",
      OPENAI_BASE_URL: "http://localhost:11434/v1",
      OPENAI_TEMPERATURE: "0.5",
    });

    expect(config).toMatchObject({
      model: "gpt-4.1",
      baseUrl: "http://localhost:11434/v1",
      temperature: 0.5,
    });
  });

  it("allows runtime overrides to take precedence", () => {
    const config = loadConfig(
      {
        OPENAI_API_KEY: "key",
        OPENAI_MODEL: "gpt-4.1-mini",
      },
      {
        model: "gpt-4.1",
        systemPrompt: "Override prompt",
      },
    );

    expect(config).toMatchObject({
      model: "gpt-4.1",
      systemPrompt: "Override prompt",
    });
  });

  it("rejects missing keys", () => {
    expect(() => loadConfig({})).toThrow(/OPENAI_API_KEY is required/);
  });

  it("rejects unsupported providers", () => {
    expect(() =>
      loadConfig({
        AI_PROVIDER: "anthropic",
        OPENAI_API_KEY: "key",
      }),
    ).toThrow(/Unsupported AI_PROVIDER/);
  });
});
