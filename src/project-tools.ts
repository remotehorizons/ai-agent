import { exec as execCallback, execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCallback);
const execFile = promisify(execFileCallback);
const defaultTimeoutMs = 20_000;
const maxTerminalOutputLength = 24_000;

export type RepoSnapshot = {
  cwd: string;
  branch: string | null;
  remoteUrl: string | null;
  isDirty: boolean;
  status: string;
};

export type TerminalResult = {
  command: string;
  cwd: string;
  stdout: string;
  stderr: string;
  exitCode: number;
};

function trimOutput(value: string): string {
  const normalized = value.trim();

  if (normalized.length <= maxTerminalOutputLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxTerminalOutputLength)}\n...output truncated...`;
}

export async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFile("git", args, {
    cwd,
    timeout: defaultTimeoutMs,
    maxBuffer: 1024 * 1024,
  });

  return stdout.trim();
}

export async function getRepoSnapshot(cwd: string): Promise<RepoSnapshot> {
  const [status, remoteUrl] = await Promise.all([
    runGit(["status", "--short", "--branch"], cwd),
    runGit(["remote", "get-url", "origin"], cwd).catch(() => ""),
  ]);

  const firstLine = status.split("\n")[0] ?? "";
  const branch = firstLine.startsWith("## ")
    ? firstLine.slice(3).split("...")[0]?.trim() || null
    : null;
  const isDirty = status
    .split("\n")
    .slice(1)
    .some((line) => line.trim().length > 0);

  return {
    cwd,
    branch,
    remoteUrl: remoteUrl || null,
    isDirty,
    status,
  };
}

export async function runTerminalCommand(
  command: string,
  cwd: string,
): Promise<TerminalResult> {
  const shell = process.env.SHELL || "/bin/zsh";

  try {
    const { stdout, stderr } = await exec(command, {
      cwd,
      shell,
      timeout: defaultTimeoutMs,
      maxBuffer: 1024 * 1024,
    });

    return {
      command,
      cwd,
      stdout: trimOutput(stdout),
      stderr: trimOutput(stderr),
      exitCode: 0,
    };
  } catch (error: unknown) {
    const details = error as {
      stdout?: string;
      stderr?: string;
      code?: number | string;
    };

    return {
      command,
      cwd,
      stdout: trimOutput(details.stdout ?? ""),
      stderr: trimOutput(details.stderr ?? (error instanceof Error ? error.message : "")),
      exitCode: typeof details.code === "number" ? details.code : 1,
    };
  }
}
