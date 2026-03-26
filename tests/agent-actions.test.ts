import { describe, expect, it } from "vitest";

import {
  extractSpawnActions,
  extractWorkflowActions,
  normalizeSpawnPlan,
  tryParseJson,
} from "../public/agent-actions.js";

describe("agent spawn actions", () => {
  it("parses fenced JSON payloads", () => {
    const parsed = tryParseJson(
      [
        "Here is the staffing plan.",
        "```json",
        '{"spawn":[{"roleId":"architect","mission":"Define the workflow model."}],"summary":"Need architecture support."}',
        "```",
      ].join("\n"),
    );

    expect(parsed).toEqual({
      spawn: [{ roleId: "architect", mission: "Define the workflow model." }],
      summary: "Need architecture support.",
    });
  });

  it("filters out roles that are not allowed", () => {
    const plan = normalizeSpawnPlan(
      {
        spawn: [
          { roleId: "architect", mission: "Define the workflow model." },
          { roleId: "unknown", mission: "Should be ignored." },
        ],
      },
      ["pm", "architect", "engineer"],
    );

    expect(plan).toEqual([
      { roleId: "architect", mission: "Define the workflow model.", name: "" },
    ]);
  });

  it("extracts spawn metadata and limits the number of agents", () => {
    const result = extractSpawnActions(
      JSON.stringify({
        spawn: [
          { roleId: "architect", mission: "Define system boundaries.", name: "Architecture Lead" },
          { roleId: "designer", mission: "Shape the UI workflow." },
          { roleId: "qa", mission: "Break the handoff edges." },
          { roleId: "reviewer", mission: "This fourth role should be dropped." },
        ],
        waysOfWorking: ["Use the architect as the PM's first reviewer."],
        summary: "The PM needs support to split planning, UI, and verification.",
      }),
      ["architect", "designer", "qa", "reviewer"],
    );

    expect(result.plan).toEqual([
      {
        roleId: "architect",
        mission: "Define system boundaries.",
        name: "Architecture Lead",
      },
      {
        roleId: "designer",
        mission: "Shape the UI workflow.",
        name: "",
      },
      {
        roleId: "qa",
        mission: "Break the handoff edges.",
        name: "",
      },
    ]);
    expect(result.waysOfWorking).toEqual([
      "Use the architect as the PM's first reviewer.",
    ]);
    expect(result.summary).toBe(
      "The PM needs support to split planning, UI, and verification.",
    );
  });

  it("extracts workflow actions for excel, terminal, and git policy", () => {
    const result = extractWorkflowActions(
      [
        "Execution update",
        "```json",
        JSON.stringify({
          excel: {
            rows: [
              {
                task: "Build Excel viewer",
                owner: "Software Engineer 1",
                status: "In Progress",
                progress: 65,
                branch: "codex/excel-viewer",
                pullRequest: "Draft PR ready",
                notes: "Table rendering is in progress.",
              },
            ],
          },
          terminal: {
            commands: [
              {
                command: "git status --short --branch",
                purpose: "Check the current branch before opening a PR.",
              },
            ],
          },
          git: {
            feature: "Excel viewer",
            branch: "codex/excel-viewer",
            prTitle: "Add Excel planning viewer",
            prBody: "## Summary\n- Add an Excel-like planning panel",
            prStatus: "draft",
          },
        }),
        "```",
      ].join("\n"),
    );

    expect(result.excelRows).toEqual([
      {
        task: "Build Excel viewer",
        owner: "Software Engineer 1",
        status: "In Progress",
        progress: 65,
        branch: "codex/excel-viewer",
        pullRequest: "Draft PR ready",
        notes: "Table rendering is in progress.",
      },
    ]);
    expect(result.terminalCommands).toEqual([
      {
        command: "git status --short --branch",
        purpose: "Check the current branch before opening a PR.",
      },
    ]);
    expect(result.git).toEqual({
      feature: "Excel viewer",
      branch: "codex/excel-viewer",
      prTitle: "Add Excel planning viewer",
      prBody: "## Summary\n- Add an Excel-like planning panel",
      prStatus: "draft",
    });
  });
});
