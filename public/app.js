import {
  findRoleConfig,
  handleTeamModeSelectionChange,
  sanitizeRestoredAgent,
} from "./app-state.js";

const palette = document.querySelector("#palette");
const briefInput = document.querySelector("#brief-input");
const maxAgentsInput = document.querySelector("#maxAgents");
const modelSelect = document.querySelector("#modelSelect");
const customModelGroup = document.querySelector("#customModelGroup");
const customModelInput = document.querySelector("#customModel");
const temperatureInput = document.querySelector("#temperature");
const baseUrlInput = document.querySelector("#baseUrl");
const systemPromptInput = document.querySelector("#systemPrompt");
const seedButton = document.querySelector("#seed-button");
const teamModeSelect = document.querySelector("#team-mode-select");
const composeTeamButton = document.querySelector("#compose-team-button");
const teamModeDescription = document.querySelector("#team-mode-description");
const runSelectedButton = document.querySelector("#run-selected-button");
const reviewSelectedButton = document.querySelector("#review-selected-button");
const spawnHelperButton = document.querySelector("#spawn-helper-button");
const clearActivityButton = document.querySelector("#clear-activity-button");
const deleteAgentButton = document.querySelector("#delete-agent-button");
const activityFeed = document.querySelector("#activity-feed");
const activityTemplate = document.querySelector("#activity-template");
const insightsList = document.querySelector("#insights-list");
const laneDrafting = document.querySelector("#lane-drafting");
const laneReview = document.querySelector("#lane-review");
const laneApproved = document.querySelector("#lane-approved");
const laneDraftingCount = document.querySelector("#lane-drafting-count");
const laneReviewCount = document.querySelector("#lane-review-count");
const laneApprovedCount = document.querySelector("#lane-approved-count");
const agentCount = document.querySelector("#agent-count");
const pendingCount = document.querySelector("#pending-count");
const approvedCount = document.querySelector("#approved-count");
const metricEfficiency = document.querySelector("#metric-efficiency");
const metricThroughput = document.querySelector("#metric-throughput");
const metricApprovalRate = document.querySelector("#metric-approval-rate");
const metricReworkRate = document.querySelector("#metric-rework-rate");
const detailForm = document.querySelector("#detail-form");
const emptyState = document.querySelector("#empty-state");
const agentNameInput = document.querySelector("#agent-name");
const agentRoleInput = document.querySelector("#agent-role");
const agentMissionInput = document.querySelector("#agent-mission");
const agentModelSelect = document.querySelector("#agent-model-select");
const agentCustomModelGroup = document.querySelector("#agent-custom-model-group");
const agentCustomModelInput = document.querySelector("#agent-custom-model");
const agentStatus = document.querySelector("#agent-status");
const agentApprovalSummary = document.querySelector("#agent-approval-summary");
const agentRunCount = document.querySelector("#agent-run-count");
const agentSpawnCount = document.querySelector("#agent-spawn-count");
const agentOutput = document.querySelector("#agent-output");
const reviewerList = document.querySelector("#reviewer-list");
const sessionStatus = document.querySelector("#session-status");
const messages = document.querySelector("#messages");
const messageTemplate = document.querySelector("#message-template");
const composer = document.querySelector("#composer");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");

const paletteRoles = [
  {
    id: "pm",
    label: "Product Manager",
    shortLabel: "PM",
    color: "gold",
    canSpawn: true,
    mission:
      "Translate ambiguity into scope, sequence the work, and protect user value.",
    prompt:
      "You are a sharp product manager. Produce concise, concrete product direction with priorities, success criteria, and edge cases.",
  },
  {
    id: "architect",
    label: "Systems Architect",
    shortLabel: "AR",
    color: "violet",
    canSpawn: true,
    mission:
      "Design coordination rules so many agents can work without chaos.",
    prompt:
      "You are a systems architect. Design structures, interfaces, and orchestration rules that scale beyond a single workflow.",
  },
  {
    id: "engineer",
    label: "Software Engineer",
    shortLabel: "SE",
    color: "blue",
    canSpawn: false,
    mission:
      "Turn approved direction into implementation plans, technical decisions, and shipped work.",
    prompt:
      "You are a senior software engineer. Propose practical technical solutions, call out tradeoffs, and keep output implementation-ready.",
  },
  {
    id: "reviewer",
    label: "PR Reviewer",
    shortLabel: "PR",
    color: "teal",
    canSpawn: false,
    mission:
      "Protect code quality, behavior, and maintainability before anything lands.",
    prompt:
      "You are a strict pull request reviewer. Focus on regressions, risks, correctness, and missing tests. Be direct.",
  },
  {
    id: "designer",
    label: "Design Lead",
    shortLabel: "DL",
    color: "coral",
    canSpawn: false,
    mission:
      "Keep the interface intentional, differentiated, and easy to use under pressure.",
    prompt:
      "You are a product design lead. Recommend stronger UX structure, visual hierarchy, and interaction design with clear rationale.",
  },
  {
    id: "qa",
    label: "QA Analyst",
    shortLabel: "QA",
    color: "green",
    canSpawn: false,
    mission:
      "Challenge assumptions, map test coverage, and find release-blocking gaps.",
    prompt:
      "You are a QA analyst. Identify test scenarios, high-risk flows, and failure modes clearly and systematically.",
  },
  {
    id: "overseer",
    label: "Overseer",
    shortLabel: "OV",
    color: "silver",
    canSpawn: true,
    mission:
      "Analyze team effectiveness, detect recurring mistakes, and recommend role or process changes before waste compounds.",
    prompt:
      "You are an operational overseer. Analyze team effectiveness, highlight coordination risks, and recommend new roles or ways of working that reduce avoidable mistakes.",
  },
];

const teamModes = [
  {
    id: "delivery",
    label: "Delivery Pod",
    description:
      "Balanced shipping crew with architecture, design, QA, review, and an overseer watching execution health.",
    roles: ["pm", "architect", "engineer", "reviewer", "designer", "qa", "overseer"],
  },
  {
    id: "studio",
    label: "Studio Squad",
    description:
      "UI-heavy mode with stronger design-system alignment and oversight before scaling implementation.",
    roles: ["pm", "architect", "designer", "engineer", "engineer", "qa", "overseer"],
  },
  {
    id: "lean",
    label: "Lean Pod",
    description:
      "Compact crew for early exploration with product, engineering, and oversight kept tight.",
    roles: ["pm", "engineer", "reviewer", "overseer"],
  },
];

const state = {
  agents: [],
  selectedAgentId: null,
  pending: false,
  activity: [],
  logsByAgent: new Map(),
  insights: [],
};

const workspaceStorageKey = "ai-agent-workspace/v1";
const defaultMaxAgents = 50;

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultMetrics() {
  return {
    runs: 0,
    reviewsRequested: 0,
    reviewsCompleted: 0,
    approvalsGranted: 0,
    changesRequested: 0,
    directMessages: 0,
    spawnedAgents: 0,
  };
}

function parseMaxAgents(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return defaultMaxAgents;
  }

  return parsed;
}

function getMaxAgents() {
  return parseMaxAgents(maxAgentsInput.value);
}

function syncMaxAgentsInput() {
  maxAgentsInput.value = String(getMaxAgents());
}

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function sanitizeMetrics(metrics) {
  const defaults = defaultMetrics();
  if (!metrics || typeof metrics !== "object") {
    return defaults;
  }

  return {
    runs: Number(metrics.runs) || 0,
    reviewsRequested: Number(metrics.reviewsRequested) || 0,
    reviewsCompleted: Number(metrics.reviewsCompleted) || 0,
    approvalsGranted: Number(metrics.approvalsGranted) || 0,
    changesRequested: Number(metrics.changesRequested) || 0,
    directMessages: Number(metrics.directMessages) || 0,
    spawnedAgents: Number(metrics.spawnedAgents) || 0,
  };
}

function serializeWorkspace() {
  return {
    selectedAgentId: state.selectedAgentId,
    agents: state.agents,
    activity: state.activity,
    logsByAgent: Object.fromEntries(state.logsByAgent),
    insights: state.insights,
    controls: {
      brief: briefInput.value,
      maxAgents: maxAgentsInput.value,
      model: modelSelect.value,
      customModel: customModelInput.value,
      temperature: temperatureInput.value,
      baseUrl: baseUrlInput.value,
      systemPrompt: systemPromptInput.value,
      teamMode: teamModeSelect.value,
    },
  };
}

function persistWorkspace() {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      workspaceStorageKey,
      JSON.stringify(serializeWorkspace()),
    );
  } catch {
    // Ignore persistence failures so the app remains usable.
  }
}

function restoreWorkspace() {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(workspaceStorageKey);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return false;
    }

    const savedAgents = Array.isArray(parsed.agents) ? parsed.agents : [];
    const agentIds = new Set();

    state.agents = savedAgents
      .filter((agent) => agent && typeof agent === "object" && typeof agent.id === "string")
      .map((agent) => {
        agentIds.add(agent.id);
        return sanitizeRestoredAgent(agent, sanitizeMetrics);
      });

    state.selectedAgentId =
      typeof parsed.selectedAgentId === "string" && agentIds.has(parsed.selectedAgentId)
        ? parsed.selectedAgentId
        : state.agents[0]?.id ?? null;
    state.activity = Array.isArray(parsed.activity) ? parsed.activity : [];
    state.insights = Array.isArray(parsed.insights) ? parsed.insights : [];
    state.logsByAgent = new Map(
      Object.entries(parsed.logsByAgent ?? {}).map(([agentId, entries]) => [
        agentId,
        Array.isArray(entries) ? entries : [],
      ]),
    );

    for (const agent of state.agents) {
      if (!state.logsByAgent.has(agent.id)) {
        state.logsByAgent.set(agent.id, []);
      }
    }

    const controls =
      parsed.controls && typeof parsed.controls === "object" ? parsed.controls : {};
    briefInput.value = typeof controls.brief === "string" ? controls.brief : "";
    maxAgentsInput.value =
      typeof controls.maxAgents === "string" ? controls.maxAgents : String(defaultMaxAgents);
    modelSelect.value = typeof controls.model === "string" ? controls.model : modelSelect.value;
    customModelInput.value =
      typeof controls.customModel === "string" ? controls.customModel : "";
    temperatureInput.value =
      typeof controls.temperature === "string" ? controls.temperature : "";
    baseUrlInput.value = typeof controls.baseUrl === "string" ? controls.baseUrl : "";
    systemPromptInput.value =
      typeof controls.systemPrompt === "string" ? controls.systemPrompt : "";
    teamModeSelect.value =
      typeof controls.teamMode === "string" ? controls.teamMode : teamModeSelect.value;

    return true;
  } catch {
    return false;
  }
}
function getSelectedAgent() {
  return state.agents.find((agent) => agent.id === state.selectedAgentId) ?? null;
}

function getRoleConfig(roleId) {
  return paletteRoles.find((role) => role.id === roleId) ?? paletteRoles[0];
}

function getTeamModeConfig(modeId) {
  return teamModes.find((mode) => mode.id === modeId) ?? teamModes[0];
}

function getOverrides() {
  const selectedModel = modelSelect.value;
  const customModel = customModelInput.value.trim();
  const temperatureValue = temperatureInput.value.trim();

  return {
    model:
      selectedModel === "custom"
        ? customModel || undefined
        : selectedModel || undefined,
    baseUrl: baseUrlInput.value.trim() || undefined,
    systemPrompt: systemPromptInput.value.trim() || undefined,
    temperature: temperatureValue ? Number(temperatureValue) : undefined,
  };
}

function getEffectiveAgentModel(agent) {
  if (agent.modelMode === "custom") {
    return agent.customModel || undefined;
  }

  if (agent.modelMode && agent.modelMode !== "workspace") {
    return agent.modelMode;
  }

  return getOverrides().model;
}

function syncModelFields() {
  const showCustomModel = modelSelect.value === "custom";
  customModelGroup.style.display = showCustomModel ? "grid" : "none";
  customModelInput.required = showCustomModel;
}

function syncAgentModelFields() {
  const showCustomModel = agentModelSelect.value === "custom";
  agentCustomModelGroup.style.display = showCustomModel ? "grid" : "none";
  agentCustomModelInput.required = showCustomModel;
}

function invalidateInheritedAgentSessions() {
  for (const agent of state.agents) {
    if (agent.modelMode === "workspace") {
      agent.sessionId = null;
    }
  }

  render();
}

function invalidateAllAgentSessions() {
  for (const agent of state.agents) {
    agent.sessionId = null;
  }

  render();
}

function createAgent(roleId, options = {}) {
  if (state.agents.length >= getMaxAgents()) {
    addActivity(
      "Agent limit reached",
      `The workspace is capped at ${getMaxAgents()} agents. Raise Max Agents to add more.`,
    );
    return null;
  }
  const role = getRoleConfig(roleId);
  const numberForRole =
    state.agents.filter((agent) => agent.roleId === roleId).length + 1;
  const agent = {
    id: uid("agent"),
    roleId: role.id,
    roleLabel: role.label,
    shortLabel: role.shortLabel,
    color: role.color,
    name: options.name || `${role.label} ${numberForRole}`,
    mission: options.mission || role.mission,
    prompt: role.prompt,
    status: "drafting",
    reviewers: [],
    approvals: {},
    sessionId: null,
    modelMode: options.modelMode || "workspace",
    customModel: options.customModel || "",
    spawnedBy: options.spawnedBy || null,
    lastOutput: "",
    metrics: defaultMetrics(),
  };

  state.agents.push(agent);
  state.logsByAgent.set(agent.id, []);
  state.selectedAgentId = agent.id;

  if (options.spawnedBy) {
    const parent = state.agents.find((entry) => entry.id === options.spawnedBy);
    if (parent) {
      parent.metrics.spawnedAgents += 1;
    }
  }

  addActivity(agent.name, options.activity || "Agent created and ready for work.");
  return agent;
}

function createAgentsWithLimit(roleIds, describeSource) {
  const availableSlots = Math.max(getMaxAgents() - state.agents.length, 0);
  const nextRoles = roleIds.slice(0, availableSlots);

  for (const roleId of nextRoles) {
    createAgent(roleId, {
      activity: `${getRoleConfig(roleId).label} added from ${describeSource}.`,
    });
  }

  if (nextRoles.length < roleIds.length) {
    addActivity(
      "Agent limit reached",
      `Only ${nextRoles.length} of ${roleIds.length} requested agents were added because the workspace cap is ${getMaxAgents()}.`,
    );
  }

  return nextRoles.length;
}
function assignDefaultReviewers() {
  const byRole = (roleId) => state.agents.filter((agent) => agent.roleId === roleId);

  for (const agent of state.agents) {
    const reviewerIds = new Set();

    if (agent.roleId === "pm") {
      for (const entry of [...byRole("designer"), ...byRole("overseer")]) {
        reviewerIds.add(entry.id);
      }
    }

    if (agent.roleId === "architect") {
      for (const entry of [...byRole("pm"), ...byRole("overseer")]) {
        reviewerIds.add(entry.id);
      }
    }

    if (agent.roleId === "engineer") {
      for (const entry of [
        ...byRole("architect"),
        ...byRole("reviewer"),
        ...byRole("qa"),
        ...byRole("designer"),
      ]) {
        reviewerIds.add(entry.id);
      }
    }

    if (agent.roleId === "designer") {
      for (const entry of [...byRole("pm"), ...byRole("overseer")]) {
        reviewerIds.add(entry.id);
      }
    }

    if (agent.roleId === "qa") {
      for (const entry of [...byRole("architect"), ...byRole("overseer")]) {
        reviewerIds.add(entry.id);
      }
    }

    if (agent.roleId === "reviewer") {
      for (const entry of [...byRole("pm"), ...byRole("overseer")]) {
        reviewerIds.add(entry.id);
      }
    }

    agent.reviewers = [...reviewerIds].filter((reviewerId) => reviewerId !== agent.id);
    for (const reviewerId of Object.keys(agent.approvals)) {
      if (!agent.reviewers.includes(reviewerId)) {
        delete agent.approvals[reviewerId];
      }
    }
    updateAgentStatusFromApprovals(agent);
  }
}

function seedStarterTeam() {
  if (state.agents.length > 0) {
    return;
  }

  createAgentsWithLimit(
    ["pm", "architect", "engineer", "designer", "reviewer", "overseer"],
    "starter team",
  );

  assignDefaultReviewers();
  const engineer = state.agents.find((agent) => agent.roleId === "engineer");
  if (engineer) {
    state.selectedAgentId = engineer.id;
  }
  addActivity("Starter team", "Loaded a product, architecture, design, review, and oversight crew.");
  render();
}

function composeTeamMode(modeId) {
  const mode = getTeamModeConfig(modeId);
  createAgentsWithLimit(mode.roles, mode.label);
  assignDefaultReviewers();
  const overseer = state.agents.find((agent) => agent.roleId === "overseer");
  if (overseer) {
    state.selectedAgentId = overseer.id;
  }
  addInsight({
    title: `${mode.label} composed`,
    body: mode.description,
  });
  render();
}

function renderTeamModeDescription() {
  const mode = getTeamModeConfig(teamModeSelect.value);
  teamModeDescription.textContent = mode.description;
}

function renderPalette() {
  palette.innerHTML = "";

  for (const role of paletteRoles) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `palette-card tone-${role.color}`;
    button.innerHTML = `
      <strong>${role.label}</strong>
      <span>${role.mission}</span>
      <em>${role.canSpawn ? "Leads can expand through this role" : "Create agent"}</em>
    `;
    button.addEventListener("click", () => {
      if (createAgent(role.id)) {
        assignDefaultReviewers();
      }
      render();
    });
    palette.appendChild(button);
  }
}

function getApprovalStats(agent) {
  const total = agent.reviewers.length;
  const approved = Object.values(agent.approvals).filter(
    (approval) => approval.decision === "approved",
  ).length;
  const pending = Math.max(total - Object.keys(agent.approvals).length, 0);
  const rejected = Object.values(agent.approvals).filter(
    (approval) => approval.decision === "changes-requested",
  ).length;

  return { total, approved, pending, rejected };
}

function humanizeStatus(status) {
  const labels = {
    drafting: "Drafting",
    review: "In review",
    approved: "Approved",
    blocked: "Changes requested",
  };

  return labels[status] ?? status;
}

function createAgentCard(agent) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `agent-card tone-${agent.color}`;
  if (agent.id === state.selectedAgentId) {
    card.classList.add("selected");
  }

  const approvals = getApprovalStats(agent);
  const effectiveModel = getEffectiveAgentModel(agent) || "workspace default";

  card.innerHTML = `
    <div class="agent-card-top">
      <div class="agent-chip">${agent.shortLabel}</div>
      <span class="status-pill status-${agent.status}">${humanizeStatus(agent.status)}</span>
    </div>
    <strong>${agent.name}</strong>
    <p>${agent.mission}</p>
    <div class="agent-card-footer">
      <span>${approvals.approved}/${approvals.total || 0} approvals</span>
      <span>${effectiveModel}</span>
    </div>
  `;

  card.addEventListener("click", () => {
    state.selectedAgentId = agent.id;
    render();
  });

  return card;
}

function renderBoard() {
  laneDrafting.innerHTML = "";
  laneReview.innerHTML = "";
  laneApproved.innerHTML = "";

  const draftingAgents = state.agents.filter((agent) => agent.status === "drafting");
  const reviewAgents = state.agents.filter((agent) => agent.status === "review");
  const approvedAgents = state.agents.filter((agent) => agent.status === "approved");
  const blockedAgents = state.agents.filter((agent) => agent.status === "blocked");

  for (const agent of [...draftingAgents, ...blockedAgents]) {
    laneDrafting.appendChild(createAgentCard(agent));
  }

  for (const agent of reviewAgents) {
    laneReview.appendChild(createAgentCard(agent));
  }

  for (const agent of approvedAgents) {
    laneApproved.appendChild(createAgentCard(agent));
  }

  laneDraftingCount.textContent = String(draftingAgents.length + blockedAgents.length);
  laneReviewCount.textContent = String(reviewAgents.length);
  laneApprovedCount.textContent = String(approvedAgents.length);
}

function getWorkspaceMetrics() {
  const aggregate = {
    totalAgents: state.agents.length,
    approvedAgents: state.agents.filter((agent) => agent.status === "approved").length,
    pendingApprovals: state.agents.reduce(
      (count, agent) => count + getApprovalStats(agent).pending,
      0,
    ),
    totalRuns: state.agents.reduce((count, agent) => count + agent.metrics.runs, 0),
    totalSpawns: state.agents.reduce((count, agent) => count + agent.metrics.spawnedAgents, 0),
    decisionsGranted: state.agents.reduce(
      (count, agent) => count + agent.metrics.approvalsGranted,
      0,
    ),
    changesRequested: state.agents.reduce(
      (count, agent) => count + agent.metrics.changesRequested,
      0,
    ),
  };

  const totalReviewDecisions = aggregate.decisionsGranted + aggregate.changesRequested;
  const approvalRate = totalReviewDecisions
    ? aggregate.decisionsGranted / totalReviewDecisions
    : 0;
  const reworkRate = totalReviewDecisions
    ? aggregate.changesRequested / totalReviewDecisions
    : 0;
  const throughput = aggregate.totalAgents
    ? aggregate.approvedAgents / aggregate.totalAgents
    : 0;
  const efficiencyScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        throughput * 45 +
          approvalRate * 30 +
          Math.min(aggregate.totalSpawns, 6) * 3 +
          (aggregate.totalRuns ? 10 : 0) +
          (1 - reworkRate) * 15,
      ),
    ),
  );

  return {
    ...aggregate,
    approvalRate,
    reworkRate,
    throughput,
    efficiencyScore,
  };
}

function renderSummary() {
  const metrics = getWorkspaceMetrics();
  agentCount.textContent = String(metrics.totalAgents);
  pendingCount.textContent = String(metrics.pendingApprovals);
  approvedCount.textContent = String(metrics.approvedAgents);
  metricEfficiency.textContent = String(metrics.efficiencyScore);
  metricThroughput.textContent = `${Math.round(metrics.throughput * 100)}%`;
  metricApprovalRate.textContent = `${Math.round(metrics.approvalRate * 100)}%`;
  metricReworkRate.textContent = `${Math.round(metrics.reworkRate * 100)}%`;
}

function renderReviewers(agent) {
  reviewerList.innerHTML = "";
  const otherAgents = state.agents.filter((entry) => entry.id !== agent.id);

  if (!otherAgents.length) {
    reviewerList.textContent = "Create additional agents to build an approval chain.";
    return;
  }

  for (const reviewer of otherAgents) {
    const label = document.createElement("label");
    label.className = "reviewer-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = agent.reviewers.includes(reviewer.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        agent.reviewers = [...new Set([...agent.reviewers, reviewer.id])];
      } else {
        agent.reviewers = agent.reviewers.filter((id) => id !== reviewer.id);
        delete agent.approvals[reviewer.id];
      }
      updateAgentStatusFromApprovals(agent);
      render();
    });

    const stats = agent.approvals[reviewer.id];
    label.innerHTML = `
      <div>
        <strong>${reviewer.name}</strong>
        <span>${reviewer.roleLabel}</span>
      </div>
      <small>${stats ? stats.decision : "not requested"}</small>
    `;
    label.prepend(checkbox);
    reviewerList.appendChild(label);
  }
}

function renderDetails() {
  const agent = getSelectedAgent();

  if (!agent) {
    emptyState.classList.remove("hidden");
    detailForm.classList.add("hidden");
    deleteAgentButton.disabled = true;
    spawnHelperButton.disabled = true;
    sessionStatus.textContent = "No agent selected.";
    messages.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  detailForm.classList.remove("hidden");
  deleteAgentButton.disabled = false;
  spawnHelperButton.disabled = !getRoleConfig(agent.roleId).canSpawn || state.pending;
  spawnHelperButton.textContent =
    agent.roleId === "overseer" ? "Analyze + Recommend" : "Spawn Helpers";
  agentNameInput.value = agent.name;
  agentRoleInput.value = agent.roleLabel;
  agentMissionInput.value = agent.mission;
  agentModelSelect.value = agent.modelMode;
  agentCustomModelInput.value = agent.customModel;
  syncAgentModelFields();
  agentStatus.textContent = humanizeStatus(agent.status);
  const approvals = getApprovalStats(agent);
  agentApprovalSummary.textContent = `${approvals.approved} / ${approvals.total}`;
  agentRunCount.textContent = String(agent.metrics.runs);
  agentSpawnCount.textContent = String(agent.metrics.spawnedAgents);
  agentOutput.value = agent.lastOutput;
  sessionStatus.textContent = agent.sessionId
    ? `Session ${agent.sessionId.slice(0, 8)}...`
    : "No session started for this agent yet.";

  renderReviewers(agent);
  renderMessages(agent);
}

function renderMessages(agent) {
  messages.innerHTML = "";
  const log = state.logsByAgent.get(agent.id) ?? [];

  if (!log.length) {
    appendMessageElement("system", "No direct messages yet.");
    return;
  }

  for (const entry of log) {
    appendMessageElement(entry.role, entry.body);
  }
}

function appendMessageElement(role, body) {
  const fragment = messageTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".message");
  const meta = fragment.querySelector(".message-meta");
  const messageBody = fragment.querySelector(".message-body");

  article.classList.add(role);
  meta.textContent =
    role === "user" ? "You" : role === "assistant" ? "Agent" : "System";
  messageBody.textContent = body;

  messages.appendChild(fragment);
  messages.scrollTop = messages.scrollHeight;
}

function addMessage(agentId, role, body) {
  const log = state.logsByAgent.get(agentId) ?? [];
  log.push({ role, body });
  state.logsByAgent.set(agentId, log);
}

function addActivity(title, body) {
  state.activity.unshift({
    id: uid("activity"),
    title,
    body,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  });
  state.activity = state.activity.slice(0, 30);
  renderActivity();
}

function renderActivity() {
  activityFeed.innerHTML = "";

  if (!state.activity.length) {
    activityFeed.innerHTML =
      '<div class="activity-empty">Simulation events will appear here.</div>';
    return;
  }

  for (const item of state.activity) {
    const fragment = activityTemplate.content.cloneNode(true);
    fragment.querySelector("strong").textContent = item.title;
    fragment.querySelector("span").textContent = item.timestamp;
    fragment.querySelector("p").textContent = item.body;
    activityFeed.appendChild(fragment);
  }
}

function addInsight(entry) {
  state.insights.unshift({
    id: uid("insight"),
    title: entry.title,
    body: entry.body,
    bullets: entry.bullets || [],
  });
  state.insights = state.insights.slice(0, 8);
  renderInsights();
}

function renderInsights() {
  insightsList.innerHTML = "";

  if (!state.insights.length) {
    insightsList.innerHTML =
      '<div class="activity-empty">Overseer findings and team-expansion advice will appear here.</div>';
    return;
  }

  for (const insight of state.insights) {
    const article = document.createElement("article");
    article.className = "insight-card";
    const bullets = insight.bullets.length
      ? `<ul>${insight.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>`
      : "";
    article.innerHTML = `
      <strong>${insight.title}</strong>
      <p>${insight.body}</p>
      ${bullets}
    `;
    insightsList.appendChild(article);
  }
}

function render() {
  renderSummary();
  renderBoard();
  renderDetails();
  renderInsights();
  persistWorkspace();
}

function setPending(isPending) {
  state.pending = isPending;
  sendButton.disabled = isPending;
  runSelectedButton.disabled = isPending;
  reviewSelectedButton.disabled = isPending;
  composeTeamButton.disabled = isPending;
  seedButton.disabled = isPending;
  deleteAgentButton.disabled = isPending || !state.selectedAgentId;
  messageInput.disabled = isPending;
  const selectedAgent = getSelectedAgent();
  spawnHelperButton.disabled =
    isPending || !selectedAgent || !getRoleConfig(selectedAgent.roleId).canSpawn;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

function buildAgentSystemPrompt(agent) {
  const globalPolicy = systemPromptInput.value.trim();
  const reviewerNames = agent.reviewers
    .map((reviewerId) => state.agents.find((entry) => entry.id === reviewerId)?.name)
    .filter(Boolean)
    .join(", ");

  return [
    globalPolicy,
    agent.prompt,
    `Your role name is ${agent.name}.`,
    `Your mission: ${agent.mission}`,
    getEffectiveAgentModel(agent)
      ? `Use the model routing preference: ${getEffectiveAgentModel(agent)}.`
      : "",
    reviewerNames ? `Your work must be reviewed by: ${reviewerNames}.` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function sendAgentMessage(agent, message) {
  const baseOverrides = getOverrides();
  const effectiveModel = getEffectiveAgentModel(agent);
  const payload = await postJson("/api/chat", {
    message,
    sessionId: agent.sessionId,
    ...(agent.sessionId
      ? {}
      : {
          ...baseOverrides,
          model: effectiveModel,
          systemPrompt: buildAgentSystemPrompt(agent),
        }),
  });

  agent.sessionId = payload.sessionId;
  return payload.reply;
}

function updateAgentStatusFromApprovals(agent) {
  const { total, approved, rejected } = getApprovalStats(agent);

  if (!agent.lastOutput) {
    agent.status = "drafting";
    return;
  }

  if (!total) {
    agent.status = "approved";
    return;
  }

  if (rejected > 0) {
    agent.status = "blocked";
    return;
  }

  if (approved === total) {
    agent.status = "approved";
    return;
  }

  agent.status = "review";
}

async function runSelectedAgent() {
  const agent = getSelectedAgent();
  if (!agent) {
    addActivity("No agent selected", "Choose an agent before running a task.");
    return;
  }

  const sharedBrief = briefInput.value.trim();
  if (!sharedBrief) {
    addActivity("Missing brief", "Add a workspace brief so the agent has a concrete task.");
    return;
  }

  setPending(true);
  addActivity(agent.name, "Drafting a response against the shared workspace brief.");
  addMessage(agent.id, "user", sharedBrief);
  render();

  try {
    const reply = await sendAgentMessage(
      agent,
      `Shared workspace brief:\n${sharedBrief}\n\nDeliver your role-specific contribution for the current team and next likely stage of work.`,
    );

    agent.lastOutput = reply;
    agent.approvals = {};
    agent.metrics.runs += 1;
    updateAgentStatusFromApprovals(agent);
    addMessage(agent.id, "assistant", reply);
    addActivity(agent.name, "Produced a fresh draft and reset prior approvals.");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    addMessage(agent.id, "system", errorMessage);
    addActivity(agent.name, `Run failed: ${errorMessage}`);
  } finally {
    setPending(false);
    render();
  }
}

function parseReviewDecision(reviewText) {
  const upper = reviewText.toUpperCase();
  if (upper.includes("APPROVE") && !upper.includes("CHANGES_REQUESTED")) {
    return "approved";
  }
  return "changes-requested";
}

async function requestApproval() {
  const agent = getSelectedAgent();
  if (!agent) {
    addActivity("No agent selected", "Choose an agent before requesting approval.");
    return;
  }

  if (!agent.lastOutput) {
    addActivity(agent.name, "No output to review yet.");
    return;
  }

  if (!agent.reviewers.length) {
    agent.status = "approved";
    addActivity(agent.name, "No reviewers assigned, so the work was marked approved.");
    render();
    return;
  }

  setPending(true);
  agent.status = "review";
  agent.metrics.reviewsRequested += 1;
  addActivity(agent.name, "Approval cycle started.");
  render();

  try {
    for (const reviewerId of agent.reviewers) {
      const reviewer = state.agents.find((entry) => entry.id === reviewerId);
      if (!reviewer) {
        continue;
      }

      const reviewPrompt = [
        `You are reviewing output from ${agent.name}, a ${agent.roleLabel}.`,
        `Shared workspace brief:\n${briefInput.value.trim() || "No shared brief supplied."}`,
        `Candidate output:\n${agent.lastOutput}`,
        "Respond with APPROVE or CHANGES_REQUESTED on the first line.",
        "Then provide a short justification and, if needed, the most important requested revision.",
      ].join("\n\n");

      const review = await sendAgentMessage(reviewer, reviewPrompt);
      const decision = parseReviewDecision(review);

      agent.approvals[reviewer.id] = {
        decision,
        review,
      };
      reviewer.metrics.reviewsCompleted += 1;

      if (decision === "approved") {
        reviewer.metrics.approvalsGranted += 1;
      } else {
        reviewer.metrics.changesRequested += 1;
      }

      addMessage(reviewer.id, "assistant", review);
      addActivity(
        reviewer.name,
        `${decision === "approved" ? "Approved" : "Requested changes on"} ${agent.name}.`,
      );
    }

    updateAgentStatusFromApprovals(agent);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    addActivity(agent.name, `Approval cycle failed: ${errorMessage}`);
  } finally {
    setPending(false);
    render();
  }
}

function buildWorkspaceSnapshot() {
  const metrics = getWorkspaceMetrics();
  const team = state.agents
    .map((agent) => {
      const approvals = getApprovalStats(agent);
      return `${agent.name} (${agent.roleLabel}) status=${agent.status} approvals=${approvals.approved}/${approvals.total} runs=${agent.metrics.runs} spawns=${agent.metrics.spawnedAgents}`;
    })
    .join("\n");

  return [
    `Shared brief:\n${briefInput.value.trim() || "No shared brief supplied."}`,
    `Workspace metrics: efficiency=${metrics.efficiencyScore}, throughput=${Math.round(
      metrics.throughput * 100,
    )}%, approvalRate=${Math.round(metrics.approvalRate * 100)}%, reworkRate=${Math.round(
      metrics.reworkRate * 100,
    )}%`,
    `Current team:\n${team || "No agents yet."}`,
  ].join("\n\n");
}

function tryParseJson(text) {
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

function normalizeSpawnPlan(parsed) {
  if (!parsed || !Array.isArray(parsed.spawn)) {
    return [];
  }

  return parsed.spawn
    .map((entry) => {
      const role = findRoleConfig(paletteRoles, String(entry.roleId || ""));
      if (!role) {
        return null;
      }
      return {
        roleId: role.id,
        mission:
          typeof entry.mission === "string" && entry.mission.trim()
            ? entry.mission.trim()
            : role.mission,
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function fallbackSpawnPlan(agent) {
  if (agent.roleId === "pm") {
    return [
      { roleId: "architect", mission: "Turn the product direction into system-level workstreams and sequencing." },
      { roleId: "designer", mission: "Define a consistent UI language for the orchestration workspace." },
    ];
  }

  if (agent.roleId === "architect") {
    return [
      { roleId: "engineer", mission: "Build the next interaction slice and connect it cleanly to the workflow model." },
      { roleId: "qa", mission: "Pressure-test the orchestration flows and approval edge cases." },
    ];
  }

  return [
    { roleId: "qa", mission: "Map failure modes and highlight process mistakes before scale." },
    { roleId: "reviewer", mission: "Protect shipped quality by tightening review discipline." },
  ];
}

async function spawnHelpersForSelected() {
  const agent = getSelectedAgent();
  if (!agent) {
    addActivity("No agent selected", "Choose an agent before asking for expansion.");
    return;
  }

  const roleConfig = getRoleConfig(agent.roleId);
  if (!roleConfig.canSpawn) {
    addActivity(agent.name, "This role cannot spawn additional agents.");
    return;
  }

  setPending(true);
  addActivity(agent.name, "Analyzing the workspace for new supporting roles.");
  render();

  try {
    const spawnPrompt = [
      roleConfig.id === "overseer"
        ? "Analyze the team effectiveness and recommend new roles or ways of working to reduce mistakes."
        : `Decide which additional agents should be spawned by ${agent.name}.`,
      buildWorkspaceSnapshot(),
      `Allowed role ids: ${paletteRoles.map((role) => role.id).join(", ")}.`,
      "Respond in JSON with keys: spawn, waysOfWorking, summary.",
      'Example: {"spawn":[{"roleId":"qa","mission":"..."},{"roleId":"engineer","mission":"..."}],"waysOfWorking":["..."],"summary":"..."}',
    ].join("\n\n");

    const reply = await sendAgentMessage(agent, spawnPrompt);
    addMessage(agent.id, "assistant", reply);

    const parsed = tryParseJson(reply);
    const plan = normalizeSpawnPlan(parsed).length
      ? normalizeSpawnPlan(parsed)
      : fallbackSpawnPlan(agent);
    const waysOfWorking = Array.isArray(parsed?.waysOfWorking)
      ? parsed.waysOfWorking.filter((entry) => typeof entry === "string").slice(0, 4)
      : [];
    const summary =
      typeof parsed?.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : `${agent.name} recommended expanding the team to reduce delivery risk.`;

    for (const suggestion of plan) {
      const created = createAgent(suggestion.roleId, {
        mission: suggestion.mission,
        spawnedBy: agent.id,
        activity: `${getRoleConfig(suggestion.roleId).label} spawned by ${agent.name}.`,
      });
      if (!created) {
        break;
      }
    }

    assignDefaultReviewers();
    addInsight({
      title: `${agent.name} recommendations`,
      body: summary,
      bullets: waysOfWorking.length ? waysOfWorking : [
        "Keep architecture and design aligned before adding more engineers.",
        "Use QA and review as bottleneck detectors, not just final gates.",
      ],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    addActivity(agent.name, `Expansion analysis failed: ${errorMessage}`);
  } finally {
    setPending(false);
    render();
  }
}

composer.addEventListener("submit", async (event) => {
  event.preventDefault();

  const agent = getSelectedAgent();
  const message = messageInput.value.trim();
  if (!agent || !message) {
    return;
  }

  setPending(true);
  addMessage(agent.id, "user", message);
  agent.metrics.directMessages += 1;
  messageInput.value = "";
  render();

  try {
    const reply = await sendAgentMessage(agent, message);
    addMessage(agent.id, "assistant", reply);
    addActivity(agent.name, "Responded in the direct message thread.");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    addMessage(agent.id, "system", errorMessage);
    addActivity(agent.name, `Direct message failed: ${errorMessage}`);
  } finally {
    setPending(false);
    render();
  }
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

agentNameInput.addEventListener("input", () => {
  const agent = getSelectedAgent();
  if (!agent) {
    return;
  }
  agent.name = agentNameInput.value;
  render();
});

agentMissionInput.addEventListener("input", () => {
  const agent = getSelectedAgent();
  if (!agent) {
    return;
  }
  agent.mission = agentMissionInput.value;
  render();
});

agentModelSelect.addEventListener("change", () => {
  const agent = getSelectedAgent();
  if (!agent) {
    return;
  }

  agent.modelMode = agentModelSelect.value;
  if (agent.modelMode !== "custom") {
    agent.customModel = "";
  }
  agent.sessionId = null;
  syncAgentModelFields();
  render();
});

agentCustomModelInput.addEventListener("input", () => {
  const agent = getSelectedAgent();
  if (!agent) {
    return;
  }
  agent.customModel = agentCustomModelInput.value.trim();
  agent.sessionId = null;
  render();
});

teamModeSelect.addEventListener("change", () => {
  handleTeamModeSelectionChange(renderTeamModeDescription, persistWorkspace);
});
composeTeamButton.addEventListener("click", () => composeTeamMode(teamModeSelect.value));
seedButton.addEventListener("click", seedStarterTeam);
runSelectedButton.addEventListener("click", runSelectedAgent);
reviewSelectedButton.addEventListener("click", requestApproval);
spawnHelperButton.addEventListener("click", spawnHelpersForSelected);

deleteAgentButton.addEventListener("click", () => {
  const agent = getSelectedAgent();
  if (!agent) {
    return;
  }

  state.agents = state.agents.filter((entry) => entry.id !== agent.id);
  state.logsByAgent.delete(agent.id);

  for (const entry of state.agents) {
    entry.reviewers = entry.reviewers.filter((reviewerId) => reviewerId !== agent.id);
    delete entry.approvals[agent.id];
    updateAgentStatusFromApprovals(entry);
  }

  state.selectedAgentId = state.agents[0]?.id ?? null;
  addActivity(agent.name, "Agent removed from the workspace.");
  render();
});

clearActivityButton.addEventListener("click", () => {
  state.activity = [];
  renderActivity();
  persistWorkspace();
});

modelSelect.addEventListener("change", syncModelFields);
modelSelect.addEventListener("change", invalidateInheritedAgentSessions);
customModelInput.addEventListener("input", invalidateInheritedAgentSessions);
maxAgentsInput.addEventListener("input", () => {
  syncMaxAgentsInput();
  persistWorkspace();
});
temperatureInput.addEventListener("input", invalidateAllAgentSessions);
baseUrlInput.addEventListener("input", invalidateAllAgentSessions);
systemPromptInput.addEventListener("input", invalidateAllAgentSessions);

renderPalette();
const restoredWorkspace = restoreWorkspace();
syncModelFields();
syncAgentModelFields();
syncMaxAgentsInput();
renderTeamModeDescription();
renderActivity();
renderInsights();
render();

if (!restoredWorkspace) {
  addInsight({
    title: "Overseer baseline",
    body: "Use an overseer to watch approval friction, missed QA coverage, and unnecessary role contention as the team grows.",
    bullets: [
      "Architects should spawn engineering and QA capacity when design and system direction are stable.",
      "Design leads should stay in the approval loop for any UI-heavy implementation lane.",
    ],
  });
  addActivity(
    "Workspace ready",
    "Compose a team mode, run agents, measure workflow health, and let PMs, architects, or overseers expand the crew.",
  );
}
