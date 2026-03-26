import { randomUUID } from "node:crypto";

import { Agent } from "./agent.js";
import type { AgentConfig, ConfigOverrides } from "./config.js";
import { loadConfig } from "./config.js";

type SessionEntry = {
  agent: Agent;
};

export class SessionStore {
  private readonly sessions = new Map<string, SessionEntry>();
  private readonly env: NodeJS.ProcessEnv;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.env = env;
  }

  create(overrides: ConfigOverrides = {}): { id: string; agent: Agent } {
    const id = randomUUID();
    const config = loadConfig(this.env, overrides);
    const agent = new Agent(config);
    this.sessions.set(id, { agent });

    return { id, agent };
  }

  get(id: string): Agent | undefined {
    return this.sessions.get(id)?.agent;
  }

  reset(id: string): boolean {
    const agent = this.get(id);

    if (!agent) {
      return false;
    }

    agent.reset();
    return true;
  }

  ensure(id: string | undefined, overrides: ConfigOverrides = {}): {
    id: string;
    agent: Agent;
  } {
    if (id) {
      const existing = this.get(id);

      if (existing) {
        return { id, agent: existing };
      }
    }

    return this.create(overrides);
  }
}
