import { Agent } from "./agent.js";
import { loadConfig } from "./config.js";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type CliOptions = {
  prompt?: string;
  model?: string;
  baseUrl?: string;
  systemPrompt?: string;
  temperature?: number;
};

export function parseArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--model") {
      options.model = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--base-url") {
      options.baseUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--system-prompt") {
      options.systemPrompt = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--temperature") {
      options.temperature = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    positional.push(token);
  }

  const prompt = positional.join(" ").trim();

  return {
    ...options,
    prompt: prompt || undefined,
  };
}

async function runInteractive(agent: Agent): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log("Interactive mode. Type /exit to quit or /clear to reset history.");

  try {
    while (true) {
      const prompt = (await rl.question("> ")).trim();

      if (!prompt) {
        continue;
      }

      if (prompt === "/exit") {
        break;
      }

      if (prompt === "/clear") {
        agent.reset();
        console.log("Conversation history cleared.");
        continue;
      }

      const response = await agent.run(prompt);
      console.log(`\n${response.content}\n`);
    }
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const config = loadConfig(process.env, {
    model: options.model,
    baseUrl: options.baseUrl,
    systemPrompt: options.systemPrompt,
    temperature: options.temperature,
  });
  const agent = new Agent(config);

  if (options.prompt) {
    const response = await agent.run(options.prompt);
    console.log(response.content);
    return;
  }

  await runInteractive(agent);
}

const entrypoint = process.argv[1];
const currentFile = fileURLToPath(import.meta.url);

if (entrypoint === currentFile) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    process.exitCode = 1;
  });
}
