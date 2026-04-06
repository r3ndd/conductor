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

- `/build`: switch active Conductor mode to `build`
- `/plan`: switch active Conductor mode to `plan`
- `/brainstorm [prompt]`: persist a planning artifact in `.conductor/plans/`
- `/research [prompt]`: run the researcher subagent and persist `.conductor/research/`
- `/architect [prompt]`: run the architect subagent and persist `.conductor/designs/`
- `/code [prompt]`: run the coding pipeline (`coder -> reviewer -> debugger if needed -> committer`)
- `/conductor-doctor`: show Context7/Codanna integration diagnostics

## Behavior

- Default primary mode is `build`.
- `.conductor/state.json` stores active mode, pipeline stage, pending steps, and latest artifact ids.
- AGENTS memory is enabled immediately: durable non-obvious notes are deduplicated into `AGENTS.md`.
- Config merge is non-destructive by default: user-defined commands, agents, and MCP keys are preserved.

## Permissions model

- `build` primary agent: full coding permissions (`edit`, `bash`, `webfetch`).
- `plan` primary agent: read-first posture (`edit` denied, `webfetch` allowed).
- Subagents are least-privilege by role.
- `committer` only grants `bash.git` and does not auto-push.

## Agent prompt files

Conductor agent prompts are defined as markdown files with YAML frontmatter and markdown body:

- `src/agents/prompts/build.md`
- `src/agents/prompts/plan.md`
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
        "defaultMode": "build",
        "forceAgents": ["build"],
        "forceCommands": ["code"],
        "forceMcp": ["context7"]
      }
    ]
  ]
}
```

- `defaultMode`: `build` or `plan`
- `forceAgents`, `forceCommands`, `forceMcp`: selectively force plugin-owned keys in collisions

## Development

```bash
bun run check
bun run build
```

Docker test environment is documented in `docker/README.md`.
