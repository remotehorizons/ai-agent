import { Agent } from "./agent.js";
import { loadConfig } from "./config.js";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type CliOptions = {
  prompt?: string;
};

export function parseArgs(argv: string[]): CliOptions {
  const prompt = argv.join(" ").trim();

  return {
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
      console.log(`\n${response}\n`);
    }
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const agent = new Agent(config);
  const options = parseArgs(process.argv.slice(2));

  if (options.prompt) {
    const response = await agent.run(options.prompt);
    console.log(response);
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
