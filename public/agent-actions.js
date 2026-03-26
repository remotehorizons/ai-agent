export function tryParseJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    return null;
  }

  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const source = fencedMatch ? fencedMatch[1] : text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function normalizeSpawnPlan(parsed, allowedRoleIds) {
  if (!parsed || !Array.isArray(parsed.spawn)) {
    return [];
  }

  const allowed = new Set(allowedRoleIds);

  return parsed.spawn
    .map((entry) => {
      const roleId = typeof entry?.roleId === "string" ? entry.roleId.trim() : "";

      if (!allowed.has(roleId)) {
        return null;
      }

      const mission =
        typeof entry?.mission === "string" && entry.mission.trim()
          ? entry.mission.trim()
          : "";
      const name =
        typeof entry?.name === "string" && entry.name.trim()
          ? entry.name.trim()
          : "";

      return {
        roleId,
        mission,
        name,
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

export function extractSpawnActions(reply, allowedRoleIds) {
  const parsed = tryParseJson(reply);

  return {
    parsed,
    plan: normalizeSpawnPlan(parsed, allowedRoleIds),
    waysOfWorking: Array.isArray(parsed?.waysOfWorking)
      ? parsed.waysOfWorking.filter((entry) => typeof entry === "string").slice(0, 4)
      : [],
    summary:
      typeof parsed?.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "",
  };
}

function normalizeString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeProgress(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export function extractWorkflowActions(reply) {
  const parsed = tryParseJson(reply);
  const excelRows = Array.isArray(parsed?.excel?.rows)
    ? parsed.excel.rows
        .map((row) => {
          const task = normalizeString(row?.task);

          if (!task) {
            return null;
          }

          return {
            task,
            owner: normalizeString(row?.owner),
            status: normalizeString(row?.status) || "Planned",
            progress: normalizeProgress(row?.progress),
            branch: normalizeString(row?.branch),
            pullRequest: normalizeString(row?.pullRequest),
            notes: normalizeString(row?.notes),
          };
        })
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const terminalCommands = Array.isArray(parsed?.terminal?.commands)
    ? parsed.terminal.commands
        .map((entry) => {
          const command = normalizeString(entry?.command);

          if (!command) {
            return null;
          }

          return {
            command,
            purpose: normalizeString(entry?.purpose),
          };
        })
        .filter(Boolean)
        .slice(0, 2)
    : [];
  const git = parsed?.git && typeof parsed.git === "object"
    ? {
        feature: normalizeString(parsed.git.feature),
        branch: normalizeString(parsed.git.branch),
        prTitle: normalizeString(parsed.git.prTitle),
        prBody: normalizeString(parsed.git.prBody),
        prStatus: normalizeString(parsed.git.prStatus) || "required",
      }
    : null;

  return {
    parsed,
    excelRows,
    terminalCommands,
    git,
  };
}
