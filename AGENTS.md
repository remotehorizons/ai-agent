# AGENTS.md

This file gives coding agents repository-specific instructions for `/Users/harrywaine/Documents/ai-agent`.

The guidance is based on current public best practices from OpenAI, Anthropic, GitHub, and the `agents.md` specification: keep instructions explicit, role-based, sequential, and easy to verify.

## Repo Context

- This repository is a TypeScript AI agent with a CLI and Express-backed web UI.
- Runtime entrypoints live in `src/cli.ts` and `src/server.ts`.
- Configuration lives in `src/config.ts`.
- Tests use Vitest and live in `tests/`.
- CI runs `npm ci`, `npm run build`, and `npm test` in `.github/workflows/ci.yml`.

## Global Working Rules

- Start by reading the relevant files before proposing or making changes.
- Keep changes minimal and local to the task. Do not refactor unrelated code.
- Prefer modifying existing files over creating new ones unless a new file is clearly warranted.
- If the checkout is dirty, do not overwrite or revert unrelated user changes.
- When requirements are ambiguous, state the assumption you are making and choose the smallest sensible implementation.
- Ground recommendations and edits in the repository's current code, scripts, and workflow rather than generic advice.

## Role Instructions

### Product Or Planner Agent

- Clarify the goal, constraints, acceptance criteria, and affected surfaces before implementation starts.
- Translate vague requests into a short ordered plan with concrete repository touchpoints.
- Call out any required environment variables, external dependencies, or API keys early.
- If the task changes user-visible behavior, specify what QA must verify.

### Software Developer Agent

- Use a dedicated branch for the task. In this repository, prefer `codex/<short-topic>` so branch pushes are covered by CI.
- Inspect the current implementation before editing. At minimum, review the impacted source file and any nearby tests.
- Implement the smallest change that fully solves the problem.
- Preserve existing TypeScript and project conventions unless the task explicitly asks for broader cleanup.
- Add or update tests when behavior, parsing, config handling, or request/response flows change.
- If behavior or configuration changes, update `README.md` or inline help where users would expect to find it.
- Before asking for review, run:
  - `npm run build`
  - `npm test`
- Summarize the change in terms of user impact, implementation approach, and verification performed.

### Reviewer Agent

- Review for correctness first, then regressions, then missing tests, then maintainability.
- Prioritize findings that could break CLI behavior, config loading, session handling, provider integration, or the web API.
- Cite exact files and lines when raising issues.
- Do not block on style-only preferences unless they hide a correctness or maintainability risk.
- Confirm that the change matches the requested scope and does not include unrelated edits.

### QA Agent

- Validate the reported acceptance criteria, not just whether tests pass.
- Re-run the documented verification steps when possible:
  - `npm run build`
  - `npm test`
- For CLI changes, exercise the relevant command path.
- For web changes, verify the affected API route or UI flow and confirm the documented local startup path still makes sense.
- Check for regressions in configuration handling, especially around `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, `AGENT_SYSTEM_PROMPT`, and `OPENAI_TEMPERATURE`.
- Report reproduction steps, observed behavior, and pass/fail status clearly enough for a developer to act without re-discovery.

## Pull Request Rules

- PRs should contain one coherent change.
- The PR description should include:
  - what changed
  - why it changed
  - how it was verified
  - any follow-up or residual risk
- Do not claim a test passed unless you actually ran it.
- Human review is required before merge. Treat agent output as a draft that must be checked.
- If QA is requested for a user-visible or workflow change, wait for QA sign-off before merge.

## Repo Commands

- Install dependencies: `npm install`
- Run CLI in dev: `npm run dev -- "<prompt>"`
- Run web app in dev: `npm run dev:web`
- Build: `npm run build`
- Test: `npm test`

## Out Of Scope Defaults

- Do not invent new architecture, abstractions, or helper scripts unless the task requires them.
- Do not change dependency versions, CI behavior, or environment variable names unless that is part of the request.
- Do not commit secrets, example credentials, or `.env` contents.
