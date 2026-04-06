# Conductor

Conductor is a self-contained OpenCode plugin that adds mode-aware orchestration, persistent project knowledge, and default MCP wiring.

## Install

Build the plugin first:

```bash
bun install
bun run build
```

Then add the plugin to `opencode.json`:

```json
{
  "plugin": ["file:///absolute/path/to/conductor/dist/index.js"]
}
```

No extra agent or command files are required.

Conductor ships built-in agent prompt markdown files in `src/agents/prompts/` and loads them into plugin agent config at runtime.

## Commands

- `/brainstorm [prompt]`: orchestrate brainstorming and persist `.conductor/plans/` artifact
- `/research [prompt]`: orchestrate researcher flow and persist `.conductor/research/` artifact
- `/architect [prompt]`: orchestrate architect flow and persist `.conductor/designs/` artifact
- `/code [prompt]`: orchestrate visible pipeline (`coder -> reviewer -> debugger if needed -> committer`)
- `/conductor-doctor`: show Context7/Codanna integration diagnostics

## Behavior

- Default primary mode is `conductor`.
- Conductor no longer overrides native `build` and `plan` agents.
- Command workflows inject an explicit orchestration prompt in `command.execute.before`.
- Subagent work is delegated visibly through native subagent/task flow, not hidden plugin-created sessions.
- Subagent learn extraction is prompted via built-in `/conductor-learn` skill command.
- `.conductor/state.json` stores active mode, pipeline stage, pending steps, and latest artifact ids.
- Config merge is non-destructive by default: user-defined commands, agents, and MCP keys are preserved.

## Permissions model

- `conductor` primary agent: full orchestration permissions (`edit`, `bash`, `webfetch`).
- Native OpenCode `build`/`plan` remain available and unmodified.
- Conductor specialist subagents are least-privilege by role.
- `committer` only grants `bash.git` and does not auto-push.

## Agent prompt files

Conductor agent prompts are defined as markdown files with YAML frontmatter and markdown body:

- `src/agents/prompts/conductor.md`
- `src/agents/prompts/researcher.md`
- `src/agents/prompts/architect.md`
- `src/agents/prompts/coder.md`
- `src/agents/prompts/reviewer.md`
- `src/agents/prompts/debugger.md`
- `src/agents/prompts/committer.md`

Format follows OpenCode agent markdown conventions:

```md
---
description: Short agent description
mode: subagent
---

System prompt content here.
```

Conductor strips frontmatter and assigns the markdown body to each agent's `prompt` field in `src/config/defaults.ts`.
At startup, Conductor warns in logs if any expected prompt file is missing or has an empty body.

## MCP integrations

Conductor injects defaults (without overriding existing user entries):

- `context7`: `npx -y @upstash/context7-mcp@latest`
- `codanna`: `codanna --config .codanna/settings.toml serve --watch`

Codanna remains diagnostics-only in v1: Conductor does not auto-install Codanna and does not run `codanna init`.

## Diagnostics

Use `/conductor-doctor` to check:

- MCP entries in runtime config
- Codanna binary availability
- `.codanna/settings.toml` presence

The report includes fix suggestions for each warning.

## Plugin options

Conductor supports optional plugin tuple options:

```json
{
  "plugin": [
    [
      "file:///absolute/path/to/conductor/dist/index.js",
      {
        "defaultMode": "conductor",
        "forceAgents": ["conductor"],
        "forceCommands": ["code"],
        "forceMcp": ["context7"]
      }
    ]
  ]
}
```

- `defaultMode`: `conductor`
- `forceAgents`, `forceCommands`, `forceMcp`: selectively force plugin-owned keys in collisions

## Development

```bash
bun run check
bun run build
```

Docker test environment is documented in `docker/README.md`.
