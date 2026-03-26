import { describe, expect, it } from "vitest";

import { getRepoSnapshot, runTerminalCommand } from "../src/project-tools.js";

describe("project tools", () => {
  it("reads the current repository snapshot", async () => {
    const snapshot = await getRepoSnapshot(process.cwd());

    expect(snapshot.cwd).toBe(process.cwd());
    expect(snapshot.branch).toBeTruthy();
    expect(snapshot.status).toContain("## ");
  });

  it("executes terminal commands in the project directory", async () => {
    const result = await runTerminalCommand("pwd", process.cwd());

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(process.cwd());
    expect(result.cwd).toBe(process.cwd());
  });
});
