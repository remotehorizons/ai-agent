import { describe, expect, it } from "vitest";

import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  it("returns a prompt when args are provided", () => {
    expect(parseArgs(["hello", "world"])).toEqual({
      prompt: "hello world",
    });
  });

  it("parses runtime overrides", () => {
    expect(
      parseArgs([
        "--model",
        "gpt-4.1",
        "--base-url",
        "http://localhost:11434/v1",
        "--temperature",
        "0.1",
        "hello",
      ]),
    ).toEqual({
      model: "gpt-4.1",
      baseUrl: "http://localhost:11434/v1",
      temperature: 0.1,
      prompt: "hello",
    });
  });

  it("returns undefined prompt for interactive mode", () => {
    expect(parseArgs([])).toEqual({
      prompt: undefined,
    });
  });
});
