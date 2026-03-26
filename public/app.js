const messages = document.querySelector("#messages");
const composer = document.querySelector("#composer");
const messageInput = document.querySelector("#message-input");
const resetButton = document.querySelector("#reset-button");
const sessionStatus = document.querySelector("#session-status");
const messageTemplate = document.querySelector("#message-template");
const sendButton = document.querySelector("#send-button");
const settingsForm = document.querySelector("#settings-form");

let sessionId = null;

function appendMessage(role, body) {
  const fragment = messageTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".message");
  const meta = fragment.querySelector(".message-meta");
  const messageBody = fragment.querySelector(".message-body");

  article.classList.add(role);
  meta.textContent = role === "user" ? "You" : role === "assistant" ? "Agent" : "Status";
  messageBody.textContent = body;

  messages.appendChild(fragment);
  messages.scrollTop = messages.scrollHeight;
}

function setPending(isPending) {
  sendButton.disabled = isPending;
  resetButton.disabled = isPending;
  messageInput.disabled = isPending;
}

function getOverrides() {
  const formData = new FormData(settingsForm);
  const temperatureValue = formData.get("temperature");

  return {
    model: formData.get("model") || undefined,
    baseUrl: formData.get("baseUrl") || undefined,
    systemPrompt: formData.get("systemPrompt") || undefined,
    temperature:
      typeof temperatureValue === "string" && temperatureValue.trim()
        ? Number(temperatureValue)
        : undefined,
  };
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

composer.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();

  if (!message) {
    return;
  }

  appendMessage("user", message);
  messageInput.value = "";
  setPending(true);

  try {
    const payload = await postJson("/api/chat", {
      message,
      sessionId,
      ...(!sessionId ? getOverrides() : {}),
    });

    sessionId = payload.sessionId;
    sessionStatus.textContent = `Active session: ${sessionId.slice(0, 8)}...`;
    appendMessage("assistant", payload.reply);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown error";
    appendMessage("system", messageText);
  } finally {
    setPending(false);
    messageInput.focus();
  }
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

resetButton.addEventListener("click", async () => {
  if (!sessionId) {
    appendMessage("system", "No session to clear yet.");
    return;
  }

  setPending(true);

  try {
    await postJson("/api/reset", { sessionId });
    appendMessage("system", "Conversation cleared. New settings will apply on a new session.");
    sessionId = null;
    sessionStatus.textContent = "Session reset. Your next message starts fresh.";
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown error";
    appendMessage("system", messageText);
  } finally {
    setPending(false);
  }
});

appendMessage(
  "system",
  "Ready. Add your OpenAI settings in .env, optionally tune the session controls, then send a prompt.",
);
