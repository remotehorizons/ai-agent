export function findRoleConfig(roles, roleId) {
  return roles.find((role) => role.id === roleId);
}

export function sanitizeRestoredAgent(agent, sanitizeMetrics) {
  return {
    ...agent,
    reviewers: Array.isArray(agent.reviewers)
      ? agent.reviewers.filter((reviewerId) => typeof reviewerId === "string")
      : [],
    approvals:
      agent.approvals && typeof agent.approvals === "object" ? agent.approvals : {},
    metrics: sanitizeMetrics(agent.metrics),
    // Server sessions are in-memory only, so restored browser state must start fresh.
    sessionId: null,
  };
}

export function handleTeamModeSelectionChange(renderTeamModeDescription, persistWorkspace) {
  renderTeamModeDescription();
  persistWorkspace();
}
