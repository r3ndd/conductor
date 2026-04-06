# Conductor Plugin Task Breakdown

## Execution Order

## Phase 0 - Project Scaffolding

### Task 0.1: Initialize plugin package skeleton

- Create `package.json`, build/test scripts, TypeScript config
- Add dependencies:
  - `@opencode-ai/plugin`
  - `@opencode-ai/sdk`
  - `jsonc-parser` (if config parsing/editing helpers are needed)
- Establish source layout for hooks, agents, commands, orchestration, knowledge, integrations

Definition of done:

- `bun run build` succeeds
- plugin export loads without runtime errors

### Task 0.2: Base plugin entry and logging

- Implement `src/index.ts` with typed plugin export
- Add startup logging through `client.app.log`
- Return minimal hooks object for progressive enhancement

Definition of done:

- plugin can be added to `opencode.json` and initializes cleanly

## Phase 1 - Runtime Config Injection

### Task 1.1: Define agent configs in code

- Implement agent definitions for:
  - `build` (primary)
  - `plan` (primary)
  - `researcher`, `architect`, `coder`, `reviewer`, `debugger`, `committer` (subagents)
- Set least-privilege permissions aligned with role expectations

Definition of done:

- agent map compiles and can be merged into runtime config

### Task 1.2: Define command templates in code

- Implement command entries for:
  - `/build`, `/plan`, `/brainstorm`, `/research`, `/architect`, `/code`, `/conductor-doctor`
- Commands specify target `agent` and `subtask` semantics as required

Definition of done:

- command map validates against OpenCode config schema expectations

### Task 1.3: Implement config merge layer

- Add deterministic merge helpers for:
  - `agent`
  - `command`
  - `mcp`
  - `default_agent`
- Respect precedence rules:
  1. Plugin options overrides
  2. Existing user config
  3. Plugin defaults

Definition of done:

- no user entries are deleted
- plugin-owned entries resolve predictably

### Task 1.4: Hook into `config`

- Wire merge layer into plugin `config` hook
- Set default active agent to `build` where appropriate
- Add trace logs summarizing injected components

Definition of done:

- on startup, commands/agents appear without manual file setup

## Phase 2 - Persistent Knowledge Core

### Task 2.1: Path and storage utilities

- Implement helpers for `.conductor/` directory creation
- Implement safe JSON read/write for `.conductor/state.json`
- Implement slug/timestamp naming helpers

Definition of done:

- storage helpers are idempotent and stable

### Task 2.2: Artifact writer

- Implement write flows for:
  - plan artifacts
  - research artifacts
  - design artifacts
- Include metadata block in each file

Definition of done:

- each command type can persist a valid artifact file with metadata

### Task 2.3: AGENTS memory support (enabled in v1)

- Implement memory extraction utility for non-obvious learnings
- Resolve nearest relevant `AGENTS.md` path for write target
- Add dedupe logic to avoid repeated entries

Definition of done:

- repeated runs do not spam duplicate memory entries

### Task 2.4: Compaction hook integration

- Implement `experimental.session.compacting` hook
- Inject structured compaction context:
  - active mode
  - current stage
  - pending tasks
  - memory extraction directives

Definition of done:

- compaction output consistently includes conductor continuation state

## Phase 3 - Orchestration Engine

### Task 3.1: Subagent execution helper

- Implement helper for spawning targeted agent sessions via SDK client
- Standardize prompt forwarding and output capture
- Include compact handoff envelope between stages

Definition of done:

- helper supports single and chained stage execution

### Task 3.2: Mode switching commands

- Implement `/build` and `/plan` effects:
  - update `.conductor/state.json`
  - return concise confirmation and implications

Definition of done:

- mode transitions persist and survive session changes

### Task 3.3: Plan-mode command flows

- `/brainstorm [prompt]`
  - interactive planning guidance
  - artifact write to `.conductor/plans/`
- `/research [prompt]`
  - researcher subagent execution
  - artifact write to `.conductor/research/`
- `/architect [prompt]`
  - architect subagent execution
  - artifact write to `.conductor/designs/`

Definition of done:

- each command reliably produces output + corresponding artifact

### Task 3.4: Build-mode `/code` pipeline

- Stage 1: Coder generates changes
- Stage 2: Reviewer checks and runs tests
- Stage 3: Debugger runs only if tests fail
- Stage 4: Committer prepares commit action and returns summary
- Persist stage transitions to state for resilience

Definition of done:

- full chain runs with conditional debugger branch
- final summary clearly reports stage outcomes

## Phase 4 - Context7/Codanna Integration

### Task 4.1: MCP defaults module

- Define MCP entries:
  - `context7` local command with `npx`
  - `codanna` local command with `codanna --config .codanna/settings.toml serve --watch`
- Integrate into config merge path

Definition of done:

- both MCP configs appear automatically in runtime config

### Task 4.2: Diagnostics checks module

- Implement checks for:
  - presence of `codanna` binary
  - existence of `.codanna/settings.toml`
  - shape of injected MCP entries
- Return actionable remediation suggestions

Definition of done:

- diagnostics produce clear pass/warn/fail status with concrete fix commands

### Task 4.3: `/conductor-doctor` command implementation

- Aggregate checks into single report
- Keep output concise, structured, and copy-pastable

Definition of done:

- user can run `/conductor-doctor` and resolve setup gaps without docs hunting

## Phase 5 - Hardening and Quality

### Task 5.1: Conflict and edge-case handling

- Validate behavior when user already has custom commands/agents named the same
- Ensure deterministic precedence and non-destructive behavior
- Add guardrails for missing permissions/tools

Definition of done:

- collisions handled predictably with warnings

### Task 5.2: Test coverage

- Unit tests:
  - config merge
  - state transitions
  - artifact/memory persistence
  - diagnostics
- Integration tests:
  - install-only bootstrap behavior
  - command availability and pipeline routing

Definition of done:

- tests pass in CI and local runs

### Task 5.3: Documentation

- README with:
  - install instructions (plugin list only)
  - command reference
  - behavior/permissions overview
  - Context7/Codanna notes and diagnostics usage

Definition of done:

- docs enable first-time user success without source code reading

## Backlog Items (Post-v1)

- Optional AGENTS memory scope controls (path allowlist/denylist)
- Optional command prefix mode for collision-heavy projects
- Auto-generated status dashboard artifact in `.conductor/`
- Optional Codanna init helper command (still user-triggered)
- Recursive Language Models feature set (explicitly deferred)

## Delivery Checklist

- [ ] Plugin installs from npm and loads via `plugin` list only
- [ ] `build` is default primary mode
- [ ] Plain commands are available and functional
- [ ] `.conductor/` artifacts and state persist correctly
- [ ] `AGENTS.md` memory extraction is enabled and deduplicated
- [ ] Context7 and Codanna MCP config is injected automatically
- [ ] Codanna remains diagnostics-only (no hidden installation/init)
- [ ] `/conductor-doctor` provides actionable setup guidance
