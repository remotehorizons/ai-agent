import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ConfigOverrides } from "./config.js";
import { SessionStore } from "./session-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");
const port = Number(process.env.PORT ?? "3000");

type ChatRequest = {
  message?: string;
  sessionId?: string;
  model?: string;
  baseUrl?: string;
  systemPrompt?: string;
  temperature?: number;
};

function pickOverrides(body: ChatRequest): ConfigOverrides {
  return {
    model: body.model,
    baseUrl: body.baseUrl,
    systemPrompt: body.systemPrompt,
    temperature: body.temperature,
  };
}

const app = express();
const sessions = new SessionStore();

app.use(express.json());
app.use(express.static(publicDir));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/chat", async (request, response) => {
  const body = request.body as ChatRequest;
  const message = body.message?.trim();

  if (!message) {
    response.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const { id, agent } = sessions.ensure(body.sessionId, pickOverrides(body));
    const result = await agent.run(message);

    response.json({
      sessionId: id,
      reply: result.content,
      usage: result.usage,
    });
  } catch (error: unknown) {
    const messageText =
      error instanceof Error ? error.message : "Unknown server error";

    response.status(500).json({ error: messageText });
  }
});

app.post("/api/reset", (request, response) => {
  const body = request.body as { sessionId?: string };

  if (!body.sessionId) {
    response.status(400).json({ error: "sessionId is required" });
    return;
  }

  const cleared = sessions.reset(body.sessionId);

  if (!cleared) {
    response.status(404).json({ error: "session not found" });
    return;
  }

  response.json({ ok: true });
});

app.get("*", (_request, response) => {
  response.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Web UI available at http://localhost:${port}`);
});
