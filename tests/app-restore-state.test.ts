import { describe, expect, it } from "vitest";

import { sanitizeRestoredAgent } from "../public/app-state.js";

describe("sanitizeRestoredAgent", () => {
  it("clears persisted session ids while preserving other restorable fields", () => {
    const metrics = { runs: 2 };
    const restored = sanitizeRestoredAgent(
      {
        id: "agent-1",
        reviewers: ["reviewer-1", 42, null],
        approvals: { "reviewer-1": { decision: "approved" } },
        metrics,
        sessionId: "stale-session-id",
      },
      (value) => value,
    );

    expect(restored).toMatchObject({
      id: "agent-1",
      reviewers: ["reviewer-1"],
      approvals: { "reviewer-1": { decision: "approved" } },
      metrics,
      sessionId: null,
    });
  });
});
