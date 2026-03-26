const palette = document.querySelector("#palette");
const briefInput = document.querySelector("#brief-input");
const modelSelect = document.querySelector("#modelSelect");
const customModelGroup = document.querySelector("#customModelGroup");
const customModelInput = document.querySelector("#customModel");
const temperatureInput = document.querySelector("#temperature");
const baseUrlInput = document.querySelector("#baseUrl");
const systemPromptInput = document.querySelector("#systemPrompt");
const seedButton = document.querySelector("#seed-button");
const runSelectedButton = document.querySelector("#run-selected-button");
const reviewSelectedButton = document.querySelector("#review-selected-button");
const clearActivityButton = document.querySelector("#clear-activity-button");
const deleteAgentButton = document.querySelector("#delete-agent-button");
const activityFeed = document.querySelector("#activity-feed");
const activityTemplate = document.querySelector("#activity-template");
const laneDrafting = document.querySelector("#lane-drafting");
const laneReview = document.querySelector("#lane-review");
const laneApproved = document.querySelector("#lane-approved");
const laneDraftingCount = document.querySelector("#lane-drafting-count");
const laneReviewCount = document.querySelector("#lane-review-count");
const laneApprovedCount = document.querySelector("#lane-approved-count");
const agentCount = document.querySelector("#agent-count");
const pendingCount = document.querySelector("#pending-count");
const approvedCount = document.querySelector("#approved-count");
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
    mission:
      "Translate ambiguity into scope, sequence the work, and protect user value.",
    prompt:
      "You are a sharp product manager. Produce concise, concrete product direction with priorities, success criteria, and edge cases.",
  },
  {
    id: "engineer",
    label: "Software Engineer",
    shortLabel: "SE",
    color: "blue",
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
    mission:
      "Challenge assumptions, map test coverage, and find release-blocking gaps.",
    prompt:
      "You are a QA analyst. Identify test scenarios, high-risk flows, and failure modes clearly and systematically.",
  },
  {
    id: "architect",
    label: "Systems Architect",
    shortLabel: "AR",
    color: "violet",
    mission:
      "Design coordination rules so many agents can work without chaos.",
    prompt:
      "You are a systems architect. Design structures, interfaces, and orchestration rules that scale beyond a single workflow.",
  },
];

const state = {
  agents: [],
  selectedAgentId: null,
  pending: false,
  activity: [],
  logsByAgent: new Map(),
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSelectedAgent() {
  return state.agents.find((agent) => agent.id === state.selectedAgentId) ?? null;
}

function getRoleConfig(roleId) {
  return paletteRoles.find((role) => role.id === roleId) ?? paletteRoles[0];
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

function createAgent(roleId) {
  const role = getRoleConfig(roleId);
  const numberForRole =
    state.agents.filter((agent) => agent.roleId === roleId).length + 1;
  const agent = {
    id: uid("agent"),
    roleId: role.id,
    roleLabel: role.label,
    shortLabel: role.shortLabel,
    color: role.color,
    name: `${role.label} ${numberForRole}`,
    mission: role.mission,
    prompt: role.prompt,
    status: "drafting",
    reviewers: [],
    approvals: {},
    sessionId: null,
    modelMode: "workspace",
    customModel: "",
    lastOutput: "",
  };

  state.agents.push(agent);
  state.logsByAgent.set(agent.id, []);
  state.selectedAgentId = agent.id;

  addActivity(agent.name, "Agent created and ready for work.");
  render();
}

function seedStarterTeam() {
  if (state.agents.length > 0) {
    return;
  }

  createAgent("pm");
  createAgent("engineer");
  createAgent("reviewer");
  createAgent("designer");

  const pm = state.agents.find((agent) => agent.roleId === "pm");
  const engineer = state.agents.find((agent) => agent.roleId === "engineer");
  const reviewer = state.agents.find((agent) => agent.roleId === "reviewer");
  const designer = state.agents.find((agent) => agent.roleId === "designer");

  if (pm && engineer && reviewer && designer) {
    engineer.reviewers = [pm.id, reviewer.id, designer.id];
    pm.reviewers = [designer.id];
    reviewer.reviewers = [pm.id];
    designer.reviewers = [pm.id];
    state.selectedAgentId = engineer.id;
  }

  addActivity("Starter team", "Loaded a product, engineering, review, and design crew.");
  render();
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
      <em>Create agent</em>
    `;
    button.addEventListener("click", () => createAgent(role.id));
    palette.appendChild(button);
  }
}

function createAgentCard(agent) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `agent-card tone-${agent.color}`;
  if (agent.id === state.selectedAgentId) {
    card.classList.add("selected");
  }

  const approvals = getApprovalStats(agent);
  const reviewerNames = agent.reviewers
    .map((reviewerId) => state.agents.find((entry) => entry.id === reviewerId)?.name)
    .filter(Boolean);

  card.innerHTML = `
    <div class="agent-card-top">
      <div class="agent-chip">${agent.shortLabel}</div>
      <span class="status-pill status-${agent.status}">${humanizeStatus(agent.status)}</span>
    </div>
    <strong>${agent.name}</strong>
    <p>${agent.mission}</p>
    <div class="agent-card-footer">
      <span>${approvals.approved}/${approvals.total || 0} approvals</span>
      <span>${reviewerNames.length ? reviewerNames.join(", ") : "No reviewers"}</span>
    </div>
  `;

  card.addEventListener("click", () => {
    state.selectedAgentId = agent.id;
    render();
  });

  return card;
}

function getApprovalStats(agent) {
  const total = agent.reviewers.length;
  const approved = Object.values(agent.approvals).filter(
    (approval) => approval.decision === "approved",
  ).length;
  const pending = total - Object.keys(agent.approvals).length;
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

function renderSummary() {
  const totalPending = state.agents.reduce((count, agent) => {
    return count + getApprovalStats(agent).pending;
  }, 0);
  const totalApproved = state.agents.filter((agent) => agent.status === "approved").length;

  agentCount.textContent = String(state.agents.length);
  pendingCount.textContent = String(totalPending);
  approvedCount.textContent = String(totalApproved);
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
    sessionStatus.textContent = "No agent selected.";
    messages.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  detailForm.classList.remove("hidden");
  deleteAgentButton.disabled = false;
  agentNameInput.value = agent.name;
  agentRoleInput.value = agent.roleLabel;
  agentMissionInput.value = agent.mission;
  agentModelSelect.value = agent.modelMode;
  agentCustomModelInput.value = agent.customModel;
  syncAgentModelFields();
  agentStatus.textContent = humanizeStatus(agent.status);
  const approvals = getApprovalStats(agent);
  agentApprovalSummary.textContent = `${approvals.approved} / ${approvals.total}`;
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
    const title = fragment.querySelector("strong");
    const timestamp = fragment.querySelector("span");
    const body = fragment.querySelector("p");

    title.textContent = item.title;
    timestamp.textContent = item.timestamp;
    body.textContent = item.body;
    activityFeed.appendChild(fragment);
  }
}

function render() {
  renderSummary();
  renderBoard();
  renderDetails();
}

function setPending(isPending) {
  state.pending = isPending;
  sendButton.disabled = isPending;
  runSelectedButton.disabled = isPending;
  reviewSelectedButton.disabled = isPending;
  seedButton.disabled = isPending;
  deleteAgentButton.disabled = isPending || !state.selectedAgentId;
  messageInput.disabled = isPending;
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
      `Shared workspace brief:\n${sharedBrief}\n\nDeliver your role-specific contribution. Keep it structured and actionable.`,
    );

    agent.lastOutput = reply;
    agent.approvals = {};
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

composer.addEventListener("submit", async (event) => {
  event.preventDefault();

  const agent = getSelectedAgent();
  const message = messageInput.value.trim();

  if (!agent || !message) {
    return;
  }

  setPending(true);
  addMessage(agent.id, "user", message);
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

  // A fresh session is required for the backend to pick up a new model.
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

seedButton.addEventListener("click", seedStarterTeam);
runSelectedButton.addEventListener("click", runSelectedAgent);
reviewSelectedButton.addEventListener("click", requestApproval);

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
});

modelSelect.addEventListener("change", syncModelFields);
modelSelect.addEventListener("change", invalidateInheritedAgentSessions);
customModelInput.addEventListener("input", invalidateInheritedAgentSessions);

renderPalette();
syncModelFields();
syncAgentModelFields();
renderActivity();
render();
addActivity(
  "Workspace ready",
  "Create agents, assign reviewers, draft work, and run approval cycles.",
);
