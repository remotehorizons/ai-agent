import { describe, expect, it, vi } from "vitest";

import { handleTeamModeSelectionChange } from "../public/app-state.js";

describe("handleTeamModeSelectionChange", () => {
  it("updates the description and persists immediately", () => {
    const renderTeamModeDescription = vi.fn();
    const persistWorkspace = vi.fn();

    handleTeamModeSelectionChange(renderTeamModeDescription, persistWorkspace);

    expect(renderTeamModeDescription).toHaveBeenCalledTimes(1);
    expect(persistWorkspace).toHaveBeenCalledTimes(1);
  });
});
