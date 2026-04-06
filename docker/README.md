# Docker Testing Workflow

This setup runs OpenCode in a dedicated container and mounts this repository at `/workspace`.

## What this gives you

- Isolated OpenCode runtime
- Persistent container config/cache via named Docker volumes
- Plugin config bootstrap via `docker/opencode.json`
- Interactive TUI support (`stdin_open` + `tty`)

## Files

- `docker/Dockerfile`: toolchain + OpenCode CLI image
- `docker/entrypoint.sh`: initializes OpenCode config/cache and starts requested command
- `docker/opencode.json`: default OpenCode config seeded into container user config
- `docker-compose.yml`: dev service, mounts, env wiring

## First-time setup

Build image:

```bash
docker compose -f docker-compose.yml build opencode-plugin-dev
```

Start OpenCode interactively:

```bash
docker compose -f docker-compose.yml run --rm opencode-plugin-dev
```

Open a shell in container:

```bash
docker compose -f docker-compose.yml run --rm opencode-plugin-dev bash
```

## Plugin loading

The seeded config points to:

- `file:///workspace/dist/index.js`

Build your plugin before launching OpenCode so the file exists.

## Config sync behavior

Entrypoint copies `docker/opencode.json` to container config path only when missing.

To force overwrite on startup:

```bash
CONDUCTOR_FORCE_CONFIG_SYNC=1 docker compose -f docker-compose.yml run --rm opencode-plugin-dev
```

## API keys

`docker-compose.yml` forwards these env vars if set in host shell:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

Example:

```bash
OPENAI_API_KEY=... docker compose -f docker-compose.yml run --rm opencode-plugin-dev
```

## Codanna note

This image does not install `codanna` by default. That is intentional for diagnostics-first testing.

Your plugin should surface this via `/conductor-doctor` when Codanna is absent.

## Home paths in container

The container uses `/root` as `HOME`, with these mounted paths:

- `/root/.config/opencode`
- `/root/.cache/opencode`
