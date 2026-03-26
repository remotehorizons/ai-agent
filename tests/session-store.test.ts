import { describe, expect, it } from "vitest";

import { SessionStore } from "../src/session-store.js";

describe("SessionStore", () => {
  const env = {
    OPENAI_API_KEY: "key",
    OPENAI_MODEL: "gpt-4.1-mini",
  };

  it("creates a session and reuses it when asked", () => {
    const store = new SessionStore(env);
    const created = store.create();
    const resolved = store.ensure(created.id);

    expect(resolved.id).toBe(created.id);
    expect(resolved.agent).toBe(created.agent);
  });

  it("creates a new session when none is supplied", () => {
    const store = new SessionStore(env);
    const first = store.ensure(undefined);
    const second = store.ensure(undefined);

    expect(first.id).not.toBe(second.id);
  });

  it("resets an existing session", () => {
    const store = new SessionStore(env);
    const created = store.create();

    expect(store.reset(created.id)).toBe(true);
    expect(store.reset("missing")).toBe(false);
  });
});
