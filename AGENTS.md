# Conductor Workspace Notes

## Docker Testing Setup

This repository includes a dedicated Docker environment for testing the OpenCode plugin in isolation.

### Files

- `docker/Dockerfile`
- `docker/entrypoint.sh`
- `docker/opencode.json`
- `docker-compose.yml`
- `docker/README.md`

### What the container includes

- OpenCode CLI (`opencode-ai`, currently verified as `1.3.15`)
- Bun runtime
- Node.js + npm
- git, ripgrep, curl, jq, python3

### Runtime paths and mounts

- Repository is mounted to `/workspace`
- Container `HOME` is `/root`
- OpenCode config path: `/root/.config/opencode/opencode.json`
- OpenCode cache path: `/root/.cache/opencode`

### Plugin config in container

Seeded config points to plugin build output:

- `file:///workspace/dist/index.js`

Build plugin output before running OpenCode in Docker.

### Common commands

Build image:

```bash
docker compose -f docker-compose.yml build opencode-plugin-dev
```

Run OpenCode interactively:

```bash
docker compose -f docker-compose.yml run --rm opencode-plugin-dev
```

Open shell in container:

```bash
docker compose -f docker-compose.yml run --rm opencode-plugin-dev bash
```

Reset volumes and network:

```bash
docker compose -f docker-compose.yml down -v
```

### Verification snapshot

Last verified in this workspace:

- `node --version` -> `v20.19.2`
- `npm --version` -> `9.2.0`
- `opencode --version` -> `1.3.15`
- `python3 --version` -> `3.13.5`
- `git --version` -> `2.47.3`
- `rg --version` -> `14.1.1`

### Codanna note

Codanna is intentionally not preinstalled in the image. This supports diagnostics-first testing for plugin doctor flows.

## Session Learnings

- OpenCode built-in primary agent naming is `build` (not `edit`): Conductor must override `build` and expose `/build` to actually replace the default coding entrypoint.
- For plugin config merging, Conductor intentionally preserves existing user `agent`/`command`/`mcp` keys and only overrides selectively via `forceAgents`/`forceCommands`/`forceMcp` tuple options.
- Docker smoke checks should verify both plugin bundle and seeded config together: `/workspace/dist/index.js` plus `/root/.config/opencode/opencode.json`.
