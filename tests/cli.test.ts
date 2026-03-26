import { describe, expect, it } from "vitest";

import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  it("returns a prompt when args are provided", () => {
    expect(parseArgs(["hello", "world"])).toEqual({
      prompt: "hello world",
    });
  });

  it("returns undefined prompt for interactive mode", () => {
    expect(parseArgs([])).toEqual({
      prompt: undefined,
    });
  });
});
