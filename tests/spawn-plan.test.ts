import { describe, expect, it } from "vitest";

import { findRoleConfig } from "../public/app-state.js";

describe("findRoleConfig", () => {
  const roles = [
    { id: "pm", mission: "Plan" },
    { id: "qa", mission: "Test" },
  ];

  it("returns an exact role match", () => {
    expect(findRoleConfig(roles, "qa")).toEqual({ id: "qa", mission: "Test" });
  });

  it("does not fall back to the first role for invalid ids", () => {
    expect(findRoleConfig(roles, "qaa")).toBeUndefined();
  });
});
