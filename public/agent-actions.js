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
