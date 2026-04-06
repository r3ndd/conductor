# Conductor Plugin Implementation Plan

## Project Goal

Build a self-contained OpenCode plugin that users install by adding one plugin entry in `opencode.json`.

The plugin will provide:

- Top-level agent switching (`build` default, `plan` optional)
- Persistent project knowledge in `.conductor/` and `AGENTS.md`
- Automatic runtime integration of Context7 and Codanna MCP configuration
- Lightweight, non-opinionated orchestration with explicit user-facing commands

Out of scope for now:

- Recursive Language Models section from `Ideas.md`

## Confirmed Product Decisions

1. Default primary mode is `build`
2. Codanna setup is diagnostics-only (no automatic install/init side effects)
3. `AGENTS.md` memory extraction is enabled immediately
4. Plain command names are used (`/plan`, `/code`, etc.)

## Technical Strategy

### 1) Self-contained registration via plugin runtime hooks

Follow Micode's pattern:

- Define agents and commands in plugin source code
- Use plugin `config` hook to inject/merge:
  - `config.agent`
  - `config.command`
  - `config.mcp`
  - optional plugin-owned permission defaults

This avoids requiring users to manually create `.opencode/agents` or `.opencode/commands` files.

### 2) Runtime state and artifacts on disk

Persist project knowledge in a plugin-owned structure:

- `.conductor/plans/`
- `.conductor/research/`
- `.conductor/designs/`
- `.conductor/state.json`

Agent memory documents are written to relevant `AGENTS.md` files as curated, high-signal notes.

### 3) Command-driven orchestration

Commands route work to explicit agents/subtasks with deterministic behavior:

- `/build` and `/plan` update active conductor mode
- `/brainstorm`, `/research`, `/architect`, `/code` invoke target specialists
- `/code` runs stage chain: coder -> reviewer -> debugger (if tests fail) -> committer

### 4) Integration wiring

Inject MCP defaults at runtime:

- `context7`: local command via `npx -y @upstash/context7-mcp@latest`
- `codanna`: local command via `codanna --config .codanna/settings.toml serve --watch`

Diagnostics command (`/conductor-doctor`) reports:

- missing `codanna` binary
- missing `.codanna/settings.toml`
- integration config state and actionable next steps

## Architecture Overview

## Package Layout

Proposed structure:

```
src/
  index.ts
  agents/
    index.ts
    build.ts
    plan.ts
    researcher.ts
    architect.ts
    coder.ts
    reviewer.ts
    debugger.ts
    committer.ts
  commands/
    index.ts
    templates.ts
  orchestration/
    pipeline.ts
    handoff.ts
    run-subagent.ts
  knowledge/
    paths.ts
    artifacts.ts
    memory.ts
    compact.ts
  integrations/
    mcp.ts
    doctor.ts
    checks.ts
  config/
    merge.ts
    defaults.ts
    options.ts
  util/
    fs.ts
    jsonc.ts
    log.ts
```

## Hook Responsibilities

### `config`

- Merge plugin-owned agents/commands
- Set `default_agent` to plugin `build` agent if none set by plugin option override
- Merge MCP entries for Context7/Codanna while preserving user definitions unless explicitly plugin-owned

### `tool`

- Register `conductor_control` tool for internal orchestration and persistence operations
- Register helper tools only when needed for compactness and maintainability

### `experimental.session.compacting`

- Inject memory extraction requirements
- Ensure continuation summaries include:
  - active mode
  - current pipeline stage
  - pending tasks
  - non-obvious project learnings to persist

### `event` (optional but recommended)

- Listen for session lifecycle events for lightweight telemetry/logging
- Potential trigger points for background maintenance (non-blocking)

## Agent Model

## Primary Agents

- `build` (default): full read/write and orchestration privileges
- `plan`: read-focused, design/research/planning privileges, plus save-brainstorm capability

## Subagents

- `researcher`
- `architect`
- `coder`
- `reviewer`
- `debugger`
- `committer`

## Permissions Policy

- Restrict by capability, not personality
- Keep least-privilege defaults and allow user override through plugin options or global config
- Ensure committer can use git commands but does not silently push or run destructive git ops

## Command Surface

- `/build`: switch mode to build
- `/plan`: switch mode to plan
- `/brainstorm [prompt]`: interactive planning, writes plan artifact
- `/research [prompt]`: researcher run, writes research artifact
- `/architect [prompt]`: architecture/design run, writes design artifact
- `/code [prompt]`: execution chain with review/debug/commit stages
- `/conductor-doctor`: checks plugin, MCP, Codanna readiness

## Persistence Design

## Artifact Files

Use timestamped, slugged files:

- `YYYY-MM-DD-HHMM-topic-plan.md`
- `YYYY-MM-DD-HHMM-topic-research.md`
- `YYYY-MM-DD-HHMM-topic-design.md`

Each includes frontmatter-style metadata:

- `type`, `mode`, `session_id`, `agent`, `source_command`, `created_at`

## State File

`.conductor/state.json` stores:

- active mode (`build`/`plan`)
- current orchestration stage
- last artifact IDs per type
- compact memory pointers/checksums

## AGENTS.md Memory

Enable immediately:

- During compaction and stage transitions, extract durable non-obvious learnings
- Persist to nearest relevant `AGENTS.md` with dedupe guard
- Keep entries concise, factual, and actionable

## MCP Integration Strategy

## Context7

- Inject `mcp.context7` as local MCP with `npx` command
- Respect existing user-defined `context7` entry if present

## Codanna

- Inject `mcp.codanna` as local MCP with documented command
- Do not auto-install Codanna or run `codanna init`
- Report missing dependencies via `/conductor-doctor`

## Failure Handling

- Missing command binary: clear remediation command suggestions
- Invalid config: non-fatal warning + continue with unaffected features
- Existing conflicting names: deterministic merge policy and clear user-facing note

## Config Merge Rules

- Additive merge by default
- Plugin-owned namespace takes precedence for plugin-owned keys
- Existing non-plugin keys remain untouched
- Never delete user entries

Conflict handling priorities:

1. Explicit user override in plugin options
2. Existing user config
3. Plugin defaults

## Testing Plan

## Unit tests

- Config merge behavior (agents/commands/mcp)
- State transitions (`/build`, `/plan`, stage progression)
- Artifact naming and metadata writing
- AGENTS memory dedupe behavior
- Doctor checks for missing binaries/files

## Integration tests

- Fresh project + plugin only in `opencode.json` -> commands and agents available
- `/research`, `/architect`, `/brainstorm` create expected artifacts
- `/code` pipeline handles passing and failing test scenarios
- MCP injection visible and stable across reloads

## Manual validation

- Run with pre-existing custom agents/commands/mcp entries
- Confirm non-destructive merges and expected precedence
- Confirm no forced model/provider behavior

## Rollout Plan

## Milestone 1: Bootstrap and injection

- Plugin skeleton, hooks, config merge, base agents/commands

## Milestone 2: Knowledge persistence

- `.conductor` files, artifact writer, state manager, AGENTS memory

## Milestone 3: Orchestration

- Subagent run helpers and `/code` stage chain

## Milestone 4: Integrations and doctor

- Context7/Codanna MCP injection and diagnostics checks

## Milestone 5: Hardening

- Edge-case handling, docs, final QA and publish readiness

## Acceptance Criteria

- User installs by plugin list only and gets full command/agent experience
- Default behavior starts in `build` mode
- Persistent project knowledge files are created and updated correctly
- AGENTS.md memory extraction is active from v1
- Context7 and Codanna MCP blocks are injected automatically
- Codanna gaps are surfaced via diagnostics, not side-effecting installs
- Commands remain plain and discoverable (`/plan`, `/code`, etc.)
